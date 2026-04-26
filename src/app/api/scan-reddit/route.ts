import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

// ── Reddit API helpers ─────────────────────────────────────────────────────

async function refreshRedditToken(refreshToken: string): Promise<string | null> {
  const clientId = process.env.REDDIT_CLIENT_ID!
  const clientSecret = process.env.REDDIT_CLIENT_SECRET!
  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'PinPoint/1.0 by taegyujeong',
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }),
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.access_token ?? null
}

async function searchReddit(
  query: string,
  accessToken: string
): Promise<{ id: string; title: string; selftext: string; subreddit: string; permalink: string; author: string; createdAt: string }[]> {
  const params = new URLSearchParams({ q: query, sort: 'new', limit: '10', t: 'month' })
  const res = await fetch(`https://oauth.reddit.com/search?${params}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'PinPoint/1.0 by taegyujeong',
    },
  })
  if (!res.ok) return []
  const data = await res.json()
  return (data?.data?.children ?? []).map((c: any) => ({
    id: c.data.id,
    title: c.data.title,
    selftext: c.data.selftext ?? '',
    subreddit: c.data.subreddit,
    permalink: `https://www.reddit.com${c.data.permalink}`,
    author: c.data.author,
    createdAt: new Date((c.data.created_utc ?? 0) * 1000).toISOString(),
  }))
}

// ── Route Handler ──────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user || authError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { projectId } = await request.json()

    // Fetch project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()
    if (!project || projectError) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    // Fetch Reddit account
    const { data: redditAccount } = await supabase
      .from('reddit_accounts')
      .select('access_token, refresh_token, reddit_username')
      .eq('project_id', projectId)
      .maybeSingle()
    if (!redditAccount) return NextResponse.json({ error: 'Reddit account not connected' }, { status: 400 })

    // Resolve access token (refresh if needed)
    let accessToken = redditAccount.access_token
    const testRes = await fetch('https://oauth.reddit.com/api/v1/me', {
      headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'PinPoint/1.0 by taegyujeong' },
    })
    if (!testRes.ok) {
      const fresh = await refreshRedditToken(redditAccount.refresh_token)
      if (!fresh) return NextResponse.json({ error: 'Reddit token expired and refresh failed' }, { status: 401 })
      accessToken = fresh
      await supabase.from('reddit_accounts').update({ access_token: fresh }).eq('project_id', projectId)
    }

    const productContext = `${project.name}: ${project.initial_geo_draft?.brandDefinition ?? ''}`
    console.log('[scan] productContext:', productContext)

    if (!project.initial_geo_draft) {
      return NextResponse.json({ error: 'No product context found — complete onboarding first' }, { status: 400 })
    }

    // Generate Reddit-optimized search strategy from product context
    console.log('[scan] generating Reddit search strategy...')
    const { object: strategy } = await generateObject({
      model: openai('gpt-4o-mini'),
      prompt: `Product: ${productContext}
Target customers: ${(project.initial_geo_draft.idealCustomers ?? []).join(', ')}
Problems solved: ${(project.initial_geo_draft.problemSolutions ?? []).map((p: any) => p.problem).join(', ')}

Generate a Reddit search strategy for finding posts where someone is ACTIVELY struggling with the problem this product solves — not discussing it academically, not writing fiction.`,
      schema: z.object({
        subreddits: z.array(z.string()).describe('6-8 subreddit names (no r/ prefix) where target customers ask for help'),
        searchTerms: z.array(z.string()).describe('5 short search queries (2-4 words max) matching what struggling users type'),
      }),
    })

    console.log('[scan] subreddits:', strategy.subreddits)
    console.log('[scan] searchTerms:', strategy.searchTerms)

    // Fetch already-processed Reddit post IDs to avoid duplicates
    const { data: existingPosts } = await supabase
      .from('reddit_posts')
      .select('post_id')
      .eq('project_id', projectId)
    const seenIds = new Set((existingPosts ?? []).map((p: any) => p.post_id))
    console.log('[scan] already seen post IDs:', seenIds.size)

    let newDrafts = 0
    const errors: string[] = []

    // Search top subreddits × top search terms (capped to avoid rate limits)
    const subreddits = strategy.subreddits.slice(0, 4)
    const terms = strategy.searchTerms.slice(0, 3)

    for (const subreddit of subreddits) {
      for (const term of terms) {
        const query = `subreddit:${subreddit} ${term}`
        console.log(`[scan] searching: "${query}"`)
        let posts: Awaited<ReturnType<typeof searchReddit>>
        try {
          posts = await searchReddit(query, accessToken)
        } catch (e) {
          errors.push(`Search failed for "${query}"`)
          continue
        }

        console.log(`[scan] → ${posts.length} posts:`, posts.map(p => `[${p.id}] r/${p.subreddit}: ${p.title.slice(0, 60)}`))

        for (const post of posts) {
          if (seenIds.has(post.id)) continue
          seenIds.add(post.id)

          // Strict relevance check + comment generation
          let result: { relevant: boolean; reason: string; draftComment: string }
          try {
            const { object } = await generateObject({
              model: openai('gpt-4o-mini'),
              system: `You filter Reddit posts for potential customers. Be STRICT — only mark relevant if the author is ACTIVELY asking for help with a specific problem that the product directly solves. Reject if:
- It's creative writing, fiction, or storytelling (r/HFY, r/worldbuilding, etc.)
- Author is discussing the topic casually, not seeking a solution
- Post is a meme, image, or off-topic discussion
- Author is already an expert or professional in the field
- The connection to the product requires more than one logical step`,
              prompt: `Product: ${productContext}
The product helps: ${(project.initial_geo_draft.idealCustomers ?? []).slice(0, 2).join(', ')}

Reddit post from r/${post.subreddit}:
Title: "${post.title}"
Body: "${post.selftext.slice(0, 400)}"

Is the author DIRECTLY struggling with a problem this product solves? If yes, write a 2-3 sentence comment that genuinely helps them first, then naturally mentions the product as one option.`,
              schema: z.object({
                relevant: z.boolean(),
                reason: z.string().describe('One sentence — cite specific evidence from the post'),
                draftComment: z.string().describe('Helpful comment, empty string if not relevant'),
              }),
            })
            result = object
          } catch (e) {
            errors.push(`AI failed for post ${post.id}`)
            continue
          }

          console.log(`[scan] post ${post.id} r/${post.subreddit} → relevant=${result.relevant} | ${result.reason}`)

          if (!result.relevant) { console.log(`[scan] ↳ skipped (not relevant)`); continue }
          if (!result.draftComment) { console.log(`[scan] ↳ skipped (no draft comment despite relevant=true)`); continue }
          console.log(`[scan] ↳ relevant! saving to DB...`)

        // Save reddit_post
        const { data: savedPost, error: postError } = await supabase
          .from('reddit_posts')
          .insert({
            project_id: projectId,
            post_id: post.id,
            title: post.title,
            body: post.selftext,
            subreddit: post.subreddit,
            post_url: post.permalink,
            author_username: post.author,
            keyword: term,
            post_created_at: post.createdAt,
          })
          .select('id')
          .single()

        if (postError || !savedPost) {
          errors.push(`DB insert failed for post ${post.id}: ${postError?.message}`)
          console.error(`[scan] reddit_post insert error:`, postError)
          continue
        }

        // Save draft comment
        const { error: commentError } = await supabase
          .from('comments')
          .insert({
            project_id: projectId,
            reddit_post_id: savedPost.id,
            author_username: redditAccount.reddit_username,
            draft_text: result.draftComment,
            status: 'pending',
          })

        if (commentError) {
          errors.push(`Comment insert failed: ${commentError.message}`)
          console.error(`[scan] comment insert error:`, commentError)
          continue
        }

        console.log(`[scan] ✓ saved draft for post ${post.id}`)
        newDrafts++
        }
      }
    }

    console.log(`[scan] done — ${newDrafts} new drafts, ${errors.length} errors`)
    return NextResponse.json({
      success: true,
      newDrafts,
      keywordsScanned: subreddits.length * terms.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('scan-reddit error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

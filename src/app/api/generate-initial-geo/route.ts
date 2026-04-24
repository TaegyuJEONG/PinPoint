import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { repoUrl, repoName, defaultBranch, homepage, description } = await request.json()

    const cookieStore = await cookies()
    const ghToken = cookieStore.get('gh_provider_token')?.value

    if (!ghToken) {
      return NextResponse.json({ error: 'GitHub token missing' }, { status: 400 })
    }

    // 2. Fetch Source Content (Prioritize Homepage Scrape -> GitHub README -> Description)
    let sourceContent = ''
    let sourceOrigin = ''

    // Attempt 1: Scrape homepage via Jina Reader if provided
    if (homepage) {
      try {
        console.log('Scraping homepage with Jina Reader:', homepage)
        const jinaRes = await fetch(`https://r.jina.ai/${homepage}`)
        if (jinaRes.ok) {
          sourceContent = await jinaRes.text()
          sourceOrigin = 'Live Website'
        }
      } catch (e) {
        console.warn('Jina Reader failed, falling back to README', e)
      }
    }

    // Attempt 2: Fallback to GitHub README if sourceContent is still empty
    if (!sourceContent) {
      try {
        const readmeRes = await fetch(`https://api.github.com/repos/${repoName}/readme`, {
          headers: {
            Authorization: `Bearer ${ghToken}`,
            Accept: 'application/vnd.github.v3.raw',
          }
        })
        if (readmeRes.ok) {
          sourceContent = await readmeRes.text()
          sourceOrigin = 'GitHub README'
        } else {
          sourceContent = description || repoName
          sourceOrigin = 'Repository Description'
        }
      } catch (e) {
        sourceContent = description || repoName
        sourceOrigin = 'Repository Description'
      }
    }

    // 3. Generate Initial GEO using OpenAI
    console.log(`Generating initial GEO for: ${repoName} (Source: ${sourceOrigin})`)
    const { object: initialGeo } = await generateObject({
      model: openai('gpt-4o-mini'),
      system: 'You are an expert product marketer. Based on the provided product information (extracted from their website or GitHub README), extract key details to help build a marketing profile. Be concise and accurate.',
      prompt: `Analyze this product: ${repoName}\n\nProduct Information (${sourceOrigin}):\n${sourceContent.substring(0, 20000)}`,
      schema: z.object({
        idealCustomers: z.array(z.string()).describe("List of 2-4 target audience profiles"),
        problemSolutions: z.array(z.object({
          problem: z.string(),
          solution: z.string(),
        })).describe("List of 2-3 key problems the product solves and how it solves them"),
        faqs: z.array(z.object({
          question: z.string(),
          answer: z.string(),
        })).describe("List of 2-4 likely frequently asked questions"),
        useCases: z.array(z.string()).describe("List of 2-4 common use cases"),
        competitors: z.array(z.string()).describe("List of 1-3 likely competitors or alternative solutions, if known. Leave empty if none."),
      })
    })

    // 4. Create or Update the Project in DB
    console.log('Saving project to DB...')
    
    // Check if project exists to avoid duplicates (since we don't have unique index yet)
    const { data: existingProject } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', user.id)
      .eq('github_repo_url', repoUrl)
      .single()

    let project, error;

    if (existingProject) {
      console.log('Updating existing project:', existingProject.id)
      const { data, error: updateError } = await supabase
        .from('projects')
        .update({
          name: repoName.split('/')[1] || repoName,
          product_urls: { website: homepage || '', github: repoUrl },
          initial_geo_draft: initialGeo
        })
        .eq('id', existingProject.id)
        .select()
        .single()
      project = data
      error = updateError
    } else {
      console.log('Creating new project...')
      const { data, error: insertError } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: repoName.split('/')[1] || repoName,
          github_repo_url: repoUrl,
          product_urls: { website: homepage || '', github: repoUrl },
          initial_geo_draft: initialGeo
        })
        .select()
        .single()
      project = data
      error = insertError
    }

    if (error) {
      console.error('Failed to create project in DB:', error)
      return NextResponse.json({ error: 'Failed to save project: ' + error.message }, { status: 500 })
    }

    console.log('Successfully generated initial geo for:', repoName)
    return NextResponse.json({ project, initial_geo: initialGeo })
    
  } catch (error) {
    console.error('Generate Initial GEO Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

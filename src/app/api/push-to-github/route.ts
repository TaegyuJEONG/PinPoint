import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

// ── GitHub Contents API helper ─────────────────────────────────────────────

async function upsertFile({
  ghToken,
  repoName,
  path,
  content,
  message,
}: {
  ghToken: string
  repoName: string
  path: string
  content: string
  message: string
}): Promise<{ success: boolean; status?: number; url?: string; error?: string }> {
  const apiUrl = `https://api.github.com/repos/${repoName}/contents/${path}`
  const headers = {
    Authorization: `Bearer ${ghToken}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  }
  const encodedContent = Buffer.from(content, 'utf-8').toString('base64')

  async function fetchCurrentSha(): Promise<string | undefined> {
    try {
      const getRes = await fetch(apiUrl, { headers })
      if (getRes.ok) {
        const existing = await getRes.json()
        return existing.sha as string | undefined
      }
    } catch { /* file doesn't exist */ }
    return undefined
  }

  async function attemptPut(sha: string | undefined): Promise<{ success: boolean; status?: number; url?: string; error?: string }> {
    const body: Record<string, string> = { message, content: encodedContent }
    if (sha) body.sha = sha

    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    })

    if (!putRes.ok) {
      let errorMessage = 'GitHub API error'
      try {
        const err = await putRes.json()
        errorMessage = err.message || errorMessage
      } catch { /* non-JSON response body */ }
      return { success: false, status: putRes.status, error: errorMessage }
    }

    const result = await putRes.json()
    return { success: true, url: result.content?.html_url }
  }

  const sha = await fetchCurrentSha()
  const result = await attemptPut(sha)

  // 409 Conflict means our SHA is stale — re-fetch and retry once
  if (result.status === 409) {
    const freshSha = await fetchCurrentSha()
    return attemptPut(freshSha)
  }

  return result
}

// ── Route Handler ──────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cookieStore = await cookies()
    const ghToken = cookieStore.get('gh_provider_token')?.value
    if (!ghToken) {
      return NextResponse.json({ error: 'GitHub token missing' }, { status: 400 })
    }

    const { repoName, defaultBranch = 'main', llmsTxt, llmsFullTxt } = await request.json()

    if (!repoName || !llmsTxt || !llmsFullTxt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    console.log(`Pushing GEO files to GitHub: ${repoName}`)

    // Detect whether a public/ folder exists in the repo
    let targetDir = ''
    try {
      const treeRes = await fetch(
        `https://api.github.com/repos/${repoName}/git/trees/${defaultBranch}?recursive=0`,
        {
          headers: {
            Authorization: `Bearer ${ghToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      )
      if (treeRes.ok) {
        const treeData = await treeRes.json()
        const topLevelDirs: string[] = (treeData.tree || [])
          .filter((f: { type: string }) => f.type === 'tree')
          .map((f: { path: string }) => f.path)
        if (topLevelDirs.includes('public')) {
          targetDir = 'public/'
        }
      }
    } catch (e) {
      console.warn('Tree scan failed, using repo root:', e)
    }

    // Push both files in parallel
    const [r1, r2] = await Promise.all([
      upsertFile({
        ghToken,
        repoName,
        path: `${targetDir}llms.txt`,
        content: llmsTxt,
        message: 'chore: add llms.txt for AI agent discoverability',
      }),
      upsertFile({
        ghToken,
        repoName,
        path: `${targetDir}llms-full.txt`,
        content: llmsFullTxt,
        message: 'chore: add llms-full.txt GEO context for AI recommendations',
      }),
    ])

    if (!r1.success || !r2.success) {
      const permissionStatuses = [401, 403, 404]
      const isPermissionIssue =
        permissionStatuses.includes(r1.status ?? 0) ||
        permissionStatuses.includes(r2.status ?? 0)

      return NextResponse.json(
        {
          error: isPermissionIssue ? 'insufficient_permissions' : 'One or more files failed to push',
          details: { llmsTxt: r1, llmsFullTxt: r2 },
        },
        { status: isPermissionIssue ? 403 : 500 }
      )
    }

    return NextResponse.json({
      success: true,
      targetDir: targetDir || '(repo root)',
      urls: { llmsTxt: r1.url, llmsFullTxt: r2.url },
    })
  } catch (error) {
    console.error('Push to GitHub Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

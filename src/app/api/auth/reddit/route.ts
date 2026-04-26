import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function GET() {
  const clientId = process.env.REDDIT_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'REDDIT_CLIENT_ID not configured' }, { status: 500 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'))

  // Fetch most recent project to embed project_id in state
  const { data: projectRows } = await supabase
    .from('projects')
    .select('id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
  const projectId = projectRows?.[0]?.id
  if (!projectId) return NextResponse.redirect(new URL('/onboarding', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'))

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const redirectUri = `${siteUrl}/api/auth/reddit/callback`
  const state = projectId // embed project_id so callback knows which project

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    state,
    redirect_uri: redirectUri,
    duration: 'permanent',
    scope: 'identity submit read',
  })

  return NextResponse.redirect(`https://www.reddit.com/api/v1/authorize?${params}`)
}

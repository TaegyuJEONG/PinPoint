import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const dashboardUrl = new URL('/dashboard', siteUrl)
  const errorUrl = new URL('/dashboard?error=reddit_auth_failed', siteUrl)

  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state') // this is the project_id
  const error = searchParams.get('error')

  if (error || !code || !state) {
    console.error('Reddit OAuth error:', error)
    return NextResponse.redirect(errorUrl)
  }

  const clientId = process.env.REDDIT_CLIENT_ID
  const clientSecret = process.env.REDDIT_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    console.error('[reddit/callback] REDDIT_CLIENT_ID or REDDIT_CLIENT_SECRET missing')
    return NextResponse.redirect(errorUrl)
  }

  const redirectUri = `${siteUrl}/api/auth/reddit/callback`
  console.log('[reddit/callback] step=token_exchange redirect_uri=', redirectUri)

  // Exchange code for tokens
  const tokenRes = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'PinPoint/1.0 by taegyujeong',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  })

  const tokenBody = await tokenRes.text()
  console.log('[reddit/callback] token_exchange status=', tokenRes.status, 'body=', tokenBody)

  if (!tokenRes.ok) {
    return NextResponse.redirect(errorUrl)
  }

  const tokens = JSON.parse(tokenBody)
  const { access_token, refresh_token, expires_in } = tokens

  if (!access_token) {
    console.error('[reddit/callback] no access_token in response:', tokens)
    return NextResponse.redirect(errorUrl)
  }

  // Get Reddit username
  console.log('[reddit/callback] step=fetch_me')
  const meRes = await fetch('https://oauth.reddit.com/api/v1/me', {
    headers: {
      Authorization: `Bearer ${access_token}`,
      'User-Agent': 'PinPoint/1.0 by taegyujeong',
    },
  })

  const meBody = await meRes.text()
  console.log('[reddit/callback] me status=', meRes.status, 'body=', meBody.slice(0, 200))

  if (!meRes.ok) {
    return NextResponse.redirect(errorUrl)
  }

  const me = JSON.parse(meBody)
  const redditUsername = me.name as string

  // Save to DB — check first to decide insert vs update
  console.log('[reddit/callback] step=db_save username=', redditUsername, 'project=', state)
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('reddit_accounts')
    .select('id')
    .eq('project_id', state)
    .maybeSingle()

  const { error: dbError } = existing
    ? await supabase.from('reddit_accounts').update({ reddit_username: redditUsername, access_token, refresh_token }).eq('project_id', state)
    : await supabase.from('reddit_accounts').insert({ project_id: state, reddit_username: redditUsername, access_token, refresh_token })

  if (dbError) {
    console.error('[reddit/callback] db_save failed:', JSON.stringify(dbError))
    return NextResponse.redirect(errorUrl)
  }

  console.log(`Reddit connected: u/${redditUsername} for project ${state}`)
  return NextResponse.redirect(dashboardUrl)
}

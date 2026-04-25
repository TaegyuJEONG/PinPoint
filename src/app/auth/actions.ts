'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for simplicity
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error, data: sessionData } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/login?error=' + encodeURIComponent(error.message))
  }

  // Check if they need onboarding — limit(1) handles multiple project rows gracefully
  const { data: projectRows } = await supabase
    .from('projects')
    .select('id')
    .eq('user_id', sessionData.user.id)
    .limit(1)
  const projects = projectRows?.[0] ?? null

  revalidatePath('/', 'layout')
  
  if (!projects) {
    redirect('/onboarding')
  } else {
    redirect('/dashboard')
  }
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    redirect('/login?error=' + encodeURIComponent(error.message))
  }

  // Explicitly sign in to guarantee the session cookie is fully hydrated before redirecting
  const { error: sessionError } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  })

  // We don't block on sessionError, but ideally it succeeds.
  revalidatePath('/', 'layout')
  redirect('/onboarding')
}

export async function signInWithGithub() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/onboarding`,
      // Standard login - no scary repo scopes
    },
  })

  if (error) {
    redirect('/login?error=' + encodeURIComponent(error.message))
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function signInWithGithubPrivate() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/onboarding`,
      scopes: 'repo', // Full read/write access to all public and private repos
    },
  })

  if (error) {
    redirect('/login?error=' + encodeURIComponent(error.message))
  }

  if (data.url) {
    redirect(data.url)
  }
}

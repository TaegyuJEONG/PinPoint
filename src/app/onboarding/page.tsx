import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import OnboardingFlow from './components/onboarding-flow'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user's existing projects if any
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .single()

  let repos = []
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  const tokenCookie = cookieStore.get('gh_provider_token')?.value
  
  if (tokenCookie) {
    try {
      const res = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
        headers: {
          Authorization: `Bearer ${tokenCookie}`,
          Accept: 'application/vnd.github.v3+json'
        }
      })
      if (res.ok) {
        repos = await res.json()
      }
    } catch (e) {
      console.error("Failed to fetch repos", e)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10">
      <div className="w-full max-w-4xl px-4">
        <h1 className="text-3xl font-bold mb-2">Welcome to PinPoint</h1>
        <p className="text-slate-500 mb-8">Let's set up your project and find your first users.</p>
        
        <OnboardingFlow initialProject={projects} user={user} githubRepos={repos} />
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/utils/supabase/client'
import { Loader2 } from 'lucide-react'

export default function GithubConnect({ onComplete, user }: { onComplete: () => void, user: any }) {
  const [loading, setLoading] = useState(false)
  const [repoUrl, setRepoUrl] = useState('')
  const supabase = createClient()

  async function handleLinkGithub() {
    setLoading(true)
    const { data, error } = await supabase.auth.linkIdentity({
      provider: 'github',
      options: {
         redirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
         scopes: 'repo' // request access to repositories
      }
    })
    
    if (error) {
       console.error("Error linking GitHub", error)
       setLoading(false)
    }
    // Supabase will automatically redirect to GitHub for OAuth in this case.
  }

  // Once connected or manually pasted, simulating moving to next
  function handleContinue() {
    setLoading(true)
    // Simulate finding the repo and extracting details
    setTimeout(() => {
        setLoading(false)
        onComplete()
    }, 1500)
  }

  return (
    <div className="space-y-6 max-w-md mx-auto py-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Connect your Project</h2>
        <p className="text-muted-foreground text-sm">We need access to your repository to understand your product and draft authentic comments.</p>
      </div>

      <div className="space-y-4 pt-4">
        <Button onClick={handleLinkGithub} disabled={loading} className="w-full bg-[#24292F] hover:bg-[#24292F]/90 text-white font-medium">
          <svg className="mr-2 h-4 w-4" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
          Connect GitHub Account
        </Button>

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t"></span></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-muted-foreground">Or enter manually (Public)</span></div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="repo">Public GitHub Repository URL</Label>
          <Input 
             id="repo" 
             placeholder="https://github.com/user/repo" 
             value={repoUrl} 
             onChange={(e) => setRepoUrl(e.target.value)} 
          />
        </div>

        <Button onClick={handleContinue} disabled={!repoUrl && !loading} className="w-full font-medium">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? 'Analyzing Project...' : 'Analyze Project & Continue'}
        </Button>
      </div>
    </div>
  )
}

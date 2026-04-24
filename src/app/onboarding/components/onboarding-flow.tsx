'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import RepoSelector from './repo-selector'
import QaWizard from './qa-wizard'
import { Loader2 } from 'lucide-react'

type Step = 'repo' | 'loading' | 'qa' | 'done'

export default function OnboardingFlow({ initialProject, user, githubRepos = [] }: { initialProject: any, user: any, githubRepos?: any[] }) {
  const [step, setStep] = useState<Step>('repo')
  const [geoData, setGeoData] = useState<any>(initialProject?.initial_geo_draft || null)
  const [error, setError] = useState<string | null>(null)

  async function handleRepoSelect(repo: any, customHomepage?: string) {
    setStep('loading')
    setError(null)
    try {
      const res = await fetch('/api/generate-initial-geo', {
        method: 'POST',
        body: JSON.stringify({ 
          repoUrl: repo.html_url, 
          repoName: repo.full_name, 
          defaultBranch: repo.default_branch, 
          description: repo.description, 
          homepage: customHomepage || repo.homepage 
        })
      })
      const data = await res.json()
      
      if (res.ok) {
         setGeoData(data.initial_geo)
         setStep('qa')
      } else {
         console.error("Failed to generate initial geo:", data.error)
         setError(data.error || "Failed to analyze repository")
         setStep('repo')
      }
    } catch (e) {
      console.error(e)
      setError("A network error occurred")
      setStep('repo')
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-1">
          {error}
        </div>
      )}
      
      {/* Basic Stepper UI */}
      <div className="flex gap-4 mb-8">
        <StepIndicator current={step} target="repo" label="1. Select Project" />
        <StepIndicator current={step} target="qa" label="2. Grounding Q&A" />
      </div>

      <Card className="p-6 shadow-sm border-slate-200 bg-white min-h-[400px]">
        {step === 'repo' && <RepoSelector repos={githubRepos} onSelect={handleRepoSelect} />}
        {step === 'loading' && (
           <div className="flex flex-col items-center justify-center h-full py-20 space-y-4">
             <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
             <h3 className="text-xl font-semibold">Analyzing Repository...</h3>
             <p className="text-slate-500">Extracting context from your README and generating initial GEO.</p>
           </div>
        )}
        {step === 'qa' && <QaWizard initialGeo={geoData} onComplete={(data) => { console.log(data); setStep('done') }} />}
        {step === 'done' && (
           <div className="text-center py-10 space-y-4">
              <h2 className="text-3xl font-bold text-indigo-600">GEO Files Prepared!</h2>
              <p className="text-slate-500 mb-6">Your llms.txt and llms-full.txt are ready for deployment.</p>
              <div className="flex justify-center gap-4">
                 <button className="px-4 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700">Push to GitHub</button>
                 <button className="px-4 py-2 border border-slate-300 rounded-md font-medium hover:bg-slate-50">Download Manually</button>
              </div>
           </div>
        )}
      </Card>
    </div>
  )
}

function StepIndicator({ current, target, label }: { current: Step, target: Step, label: string }) {
  const steps = ['repo', 'qa', 'done']
  const currentIndex = steps.indexOf(current)
  const targetIndex = steps.indexOf(target)
  const isPast = currentIndex > targetIndex
  const isActive = current === target

  return (
    <div className={`flex-1 pb-4 border-b-2 transition-colors ${isActive ? 'border-indigo-600 text-indigo-600' : isPast ? 'border-slate-800 text-slate-800' : 'border-slate-200 text-slate-400'}`}>
      <span className="text-sm font-medium">{label}</span>
    </div>
  )
}

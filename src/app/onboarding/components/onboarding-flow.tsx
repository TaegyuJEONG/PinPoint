'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import RepoSelector from './repo-selector'
import QaWizard from './qa-wizard'
import GeoFilesPreview from './geo-files-preview'
import { Loader2 } from 'lucide-react'

type Step = 'repo' | 'loading' | 'qa' | 'generating' | 'preview' | 'done'

interface SelectedRepo {
  name: string         // e.g. "owner/repo"
  html_url: string
  default_branch: string
  description: string
  homepage: string
}

export default function OnboardingFlow({
  initialProject,
  user,
  githubRepos = [],
}: {
  initialProject: any
  user: any
  githubRepos?: any[]
}) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('repo')
  const [geoData, setGeoData] = useState<any>(initialProject?.initial_geo_draft || null)
  const [projectName, setProjectName] = useState<string>(initialProject?.name || '')
  const [selectedRepo, setSelectedRepo] = useState<SelectedRepo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [llmsTxt, setLlmsTxt] = useState('')
  const [llmsFullTxt, setLlmsFullTxt] = useState('')

  // ── Step 1: Repo selected → generate initial GEO ─────────────────────────

  async function handleRepoSelect(repo: any, customHomepage?: string) {
    setStep('loading')
    setError(null)
    setSelectedRepo({
      name: repo.full_name,
      html_url: repo.html_url,
      default_branch: repo.default_branch,
      description: repo.description,
      homepage: customHomepage || repo.homepage || '',
    })
    try {
      const res = await fetch('/api/generate-initial-geo', {
        method: 'POST',
        body: JSON.stringify({
          repoUrl: repo.html_url,
          repoName: repo.full_name,
          defaultBranch: repo.default_branch,
          description: repo.description,
          homepage: customHomepage || repo.homepage,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setGeoData(data.initial_geo)
        setProjectName(data.project?.name || '')
        setStep('qa')
      } else {
        console.error('Failed to generate initial geo:', data.error)
        setError(data.error || 'Failed to analyze repository')
        setStep('repo')
      }
    } catch (e) {
      console.error(e)
      setError('A network error occurred')
      setStep('repo')
    }
  }

  // ── Step 2: QA wizard complete → generate GEO files ──────────────────────

  async function handleQaComplete(qaData: any) {
    setStep('generating')
    setError(null)
    try {
      const res = await fetch('/api/generate-llms-txt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoName: selectedRepo?.name,
          defaultBranch: selectedRepo?.default_branch || 'main',
          homepage: selectedRepo?.homepage || '',
          projectName,
          ...qaData,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setLlmsTxt(data.llmsTxt)
        setLlmsFullTxt(data.llmsFullTxt)
        setStep('preview')
      } else {
        setError(data.error || 'Failed to generate GEO files')
        setStep('qa')
      }
    } catch (e) {
      console.error(e)
      setError('A network error occurred while generating files')
      setStep('qa')
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-1">
          {error}
        </div>
      )}

      {/* Stepper */}
      {step !== 'preview' && (
        <div className="flex gap-4 mb-8">
          <StepIndicator current={step} target="repo" label="1. Select Project" />
          <StepIndicator current={step} target="qa" label="2. Grounding Q&A" />
        </div>
      )}

      <Card
        className={`p-6 shadow-sm border-slate-200 bg-white ${step !== 'preview' ? 'min-h-[400px]' : ''}`}
      >
        {step === 'repo' && (
          <RepoSelector repos={githubRepos} onSelect={handleRepoSelect} />
        )}

        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center h-full py-20 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
            <h3 className="text-xl font-semibold">Analyzing Repository & Website...</h3>
            <p className="text-slate-500">
              Extracting context from your codebase and product website to generate an initial GEO baseline.
            </p>
          </div>
        )}

        {step === 'qa' && (
          <QaWizard
            initialGeo={geoData}
            projectName={projectName}
            onComplete={handleQaComplete}
          />
        )}

        {step === 'generating' && (
          <div className="flex flex-col items-center justify-center h-full py-20 space-y-6">
            <div className="relative">
              <Loader2 className="h-10 w-10 animate-spin text-brand-600" />
              <div className="absolute inset-0 h-10 w-10 bg-brand-600/10 rounded-full blur-xl animate-pulse" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold text-slate-900">Generating GEO Files...</p>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Scanning your repository structure and assembling <code>llms.txt</code> and{' '}
                <code>llms-full.txt</code>.
              </p>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <GeoFilesPreview
            llmsTxt={llmsTxt}
            llmsFullTxt={llmsFullTxt}
            repoName={selectedRepo?.name || ''}
            defaultBranch={selectedRepo?.default_branch || 'main'}
            onGoToDashboard={() => router.push('/dashboard')}
          />
        )}
      </Card>
    </div>
  )
}

function StepIndicator({
  current,
  target,
  label,
}: {
  current: Step
  target: Step
  label: string
}) {
  const steps: Step[] = ['repo', 'loading', 'qa', 'generating', 'preview']
  const currentIndex = steps.indexOf(current)
  const targetIndex = steps.indexOf(target)
  const isPast = currentIndex > targetIndex
  const isActive = current === target || (target === 'qa' && current === 'generating')

  return (
    <div
      className={`flex-1 pb-4 border-b-2 transition-colors ${
        isActive
          ? 'border-brand-600 text-brand-600'
          : isPast
          ? 'border-slate-800 text-slate-800'
          : 'border-slate-200 text-slate-400'
      }`}
    >
      <span className="text-sm font-medium">{label}</span>
    </div>
  )
}

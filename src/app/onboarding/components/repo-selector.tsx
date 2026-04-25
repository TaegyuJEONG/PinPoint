'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { FolderGit2, Loader2, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

import { signInWithGithubPrivate } from '@/app/auth/actions'
import { Globe } from 'lucide-react'

export default function RepoSelector({ repos, onSelect }: { repos: any[], onSelect: (repo: any, customUrl?: string) => void }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [customUrl, setCustomUrl] = useState('')
  const [selectedRepo, setSelectedRepo] = useState<any | null>(null)
  const [selecting, setSelecting] = useState<number | null>(null)

  const filteredRepos = repos.filter(repo => 
    repo.full_name.toLowerCase().includes(searchTerm.toLowerCase()) && !repo.fork
  )

  function handleSelect(repo: any) {
    setSelectedRepo(repo)
    // Auto-fill custom URL if the repository already has a homepage defined
    if (repo.homepage && !customUrl) {
      setCustomUrl(repo.homepage)
    }
  }

  function handleConfirm() {
    if (!selectedRepo) return
    setSelecting(selectedRepo.id)
    onSelect(selectedRepo, customUrl)
  }

  const hasPrivateRepos = repos.some(repo => repo.private)

  if (selectedRepo) {
    return (
      <div className="space-y-6 py-4">
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-2xl font-bold">Product Website</h2>
          <p className="text-muted-foreground text-sm">We'll analyze your codebase and live website together to create better marketing assets.</p>
        </div>

        <div className="max-w-xl mx-auto space-y-6">
          {/* Selected Repo Card (Read Only) */}
          <Card className="p-4 bg-slate-50 border-slate-200">
             <div className="flex items-center space-x-3">
               <div className="h-10 w-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                 <FolderGit2 className="h-5 w-5" />
               </div>
               <div className="flex-1 overflow-hidden">
                  <h3 className="font-bold text-sm text-slate-800 truncate">{selectedRepo.name}</h3>
                  <p className="text-xs text-slate-500 truncate">{selectedRepo.full_name}</p>
               </div>
               <div className="text-right">
                  <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold text-slate-500 hover:text-indigo-600" onClick={() => setSelectedRepo(null)}>
                    Change Repo
                  </Button>
               </div>
             </div>
          </Card>

          {/* URL Input */}
          <div className="bg-white border text-left border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <Globe className="h-4 w-4 text-slate-500" />
              Website URL (Optional)
            </label>
            <div className="relative">
              <Input 
                placeholder="e.g. https://genkle.ai" 
                className="h-12 bg-white border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm rounded-xl w-full text-base"
                value={customUrl}
                onChange={e => setCustomUrl(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleConfirm() }}
              />
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              If your product is already live, our AI will scrape the actual landing page to fully capture your tone and current messaging.
            </p>
          </div>
          
          <div className="flex justify-end pt-4">
             <Button 
                onClick={handleConfirm} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6 rounded-xl font-bold shadow-md w-full sm:w-auto h-auto transition-all"
                disabled={selecting !== null}
             >
                {selecting !== null ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing...</>
                ) : (
                  'Start Analysis'
                )}
             </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 py-4">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-2xl font-bold">Select a Repository</h2>
        <p className="text-muted-foreground text-sm">Choose the codebase you want to generate documentation and outreach for.</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6 mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search your repositories to start..." 
            className="pl-9 h-12 bg-white border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm rounded-xl text-base" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto p-1">
        {repos.length === 0 ? (
           <div className="col-span-full text-center py-10 text-slate-500">
             No repositories found. Ensure you granted access.
           </div>
        ) : filteredRepos.length === 0 ? (
           <div className="col-span-full text-center py-10 text-slate-500">
             No repositories matching your search.
           </div>
        ) : (
          filteredRepos.map(repo => (
            <Card 
              key={repo.id} 
              className={`group relative p-4 cursor-pointer transition-all duration-200 border-slate-200 hover:border-indigo-500 hover:shadow-lg bg-white overflow-hidden`}
              onClick={() => handleSelect(repo)}
            >
               <div className="flex items-start justify-between relative z-10">
                 <div className="space-y-1.5 overflow-hidden flex-1">
                   <div className="flex items-center space-x-2">
                     <FolderGit2 className={`h-4 w-4 shrink-0 transition-colors text-slate-400 group-hover:text-indigo-500`} />
                     <h3 className="font-bold truncate text-sm text-slate-800">
                       {repo.name}
                       {repo.private && <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-100 uppercase">Private</span>}
                     </h3>
                   </div>
                   {repo.description ? (
                     <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{repo.description}</p>
                   ) : (
                     <p className="text-xs text-slate-400 italic font-light">No description provided</p>
                   )}
                 </div>
                 <div className="flex items-center ml-2">
                   <div className="h-6 px-2 rounded-full bg-slate-50 text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center border border-slate-200 uppercase tracking-wider">
                     Select
                   </div>
                 </div>
               </div>
               
               {/* Subtle background glow on hover */}
               <div className="absolute inset-0 bg-indigo-50/0 group-hover:bg-indigo-50/30 transition-colors pointer-events-none" />
            </Card>
          ))
        )}
      </div>

      {!hasPrivateRepos && (
        <div className="mt-8 pt-8 border-t border-slate-100">
          <div className="max-w-md mx-auto p-6 rounded-2xl bg-slate-50/80 border border-slate-200/50 text-center space-y-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-800">Looking for a private repository?</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                We focus on safety first. Repositories listed above are public. 
                Elevate access to include your private codebases.
              </p>
            </div>
            <form action={signInWithGithubPrivate}>
              <Button 
                type="submit" 
                variant="outline" 
                className="w-full bg-white hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 font-bold text-xs shadow-sm transition-all py-5"
              >
                Enable Private Access
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

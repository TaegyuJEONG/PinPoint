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
  const [selecting, setSelecting] = useState<number | null>(null)

  const filteredRepos = repos.filter(repo => 
    repo.full_name.toLowerCase().includes(searchTerm.toLowerCase()) && !repo.fork
  )

  function handleSelect(repo: any) {
    setSelecting(repo.id)
    onSelect(repo, customUrl)
  }

  const hasPrivateRepos = repos.some(repo => repo.private)

  return (
    <div className="space-y-6 py-4">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-2xl font-bold">Select a Repository</h2>
        <p className="text-muted-foreground text-sm">Choose the codebase you want to generate documentation and outreach for.</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-4 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search repositories..." 
              className="pl-9 h-11 bg-white border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm rounded-xl" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <Globe className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Product URL (e.g. https://genkle.ai)" 
              className="pl-9 h-11 bg-white border-slate-200 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm rounded-xl"
              value={customUrl}
              onChange={e => setCustomUrl(e.target.value)}
            />
            <div className="absolute right-3 top-3">
              <div className="group relative">
                <div className="text-[10px] text-slate-400 cursor-help border border-slate-200 rounded px-1.5 py-0.5 bg-slate-50">?</div>
                <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  AI가 실제 홈페이지를 분석하여 더 정확한 마케팅 문구를 생성합니다. (깃허브에 등록된 주소보다 우선 연동됩니다)
                </div>
              </div>
            </div>
          </div>
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
              className={`group relative p-4 cursor-pointer transition-all duration-200 border-slate-200 hover:border-indigo-500 hover:shadow-lg bg-white overflow-hidden ${selecting === repo.id ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md' : ''}`}
              onClick={() => handleSelect(repo)}
            >
               <div className="flex items-start justify-between relative z-10">
                 <div className="space-y-1.5 overflow-hidden flex-1">
                   <div className="flex items-center space-x-2">
                     <FolderGit2 className={`h-4 w-4 shrink-0 transition-colors ${selecting === repo.id ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500'}`} />
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
                   {selecting === repo.id ? (
                     <Loader2 className="h-4 w-4 animate-spin text-indigo-600 shrink-0" />
                   ) : (
                     <div className="h-6 px-2 rounded-full bg-slate-50 text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center border border-slate-200 uppercase tracking-wider">
                       Select
                     </div>
                   )}
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
            <form action={signInWithGithubPrivate} method="POST">
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

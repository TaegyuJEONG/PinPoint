'use client'

import { useState } from 'react'
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Hash,
  Radio,
  FileText,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  geoFilesReady: boolean
  redditConnected: boolean
  keywords: string[]
  projectName: string
}

export default function SetupChecklist({
  geoFilesReady,
  redditConnected,
  keywords,
  projectName,
}: Props) {
  const [keywordsExpanded, setKeywordsExpanded] = useState(false)

  const steps = [
    {
      id: 'geo',
      done: geoFilesReady,
      icon: <FileText className="h-4 w-4" />,
      label: 'GEO files generated',
      desc: 'Your llms.txt and llms-full.txt are ready and pushed to GitHub.',
    },
    {
      id: 'reddit',
      done: redditConnected,
      icon: <Radio className="h-4 w-4" />,
      label: 'Connect your Reddit account',
      desc: 'Required to post comments from your own account — PinPoint never posts without your confirmation.',
    },
    {
      id: 'monitor',
      done: false,
      icon: <Zap className="h-4 w-4" />,
      label: 'Activate Reddit monitoring',
      desc: 'PinPoint will scan Reddit hourly using your 20 keywords and surface relevant posts.',
    },
  ]

  const completedCount = steps.filter(s => s.done).length
  const allDone = completedCount === steps.length

  if (allDone) return null

  return (
    <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50/60 to-brand-50/40 p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="h-5 w-5 rounded-full bg-brand-600 text-white text-[10px] font-extrabold flex items-center justify-center">
              {steps.length - completedCount}
            </span>
            Setup remaining
          </h2>
          <p className="text-xs text-slate-500">
            Complete these steps to activate Reddit monitoring for <span className="font-semibold text-slate-700">{projectName}</span>.
          </p>
        </div>
        {/* Mini progress bar */}
        <div className="shrink-0 flex flex-col items-end gap-1">
          <span className="text-xs font-bold text-brand-600 tabular-nums">
            {completedCount}/{steps.length}
          </span>
          <div className="w-24 h-1.5 rounded-full bg-brand-100 overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step) => (
          <div
            key={step.id}
            className={cn(
              'flex items-start gap-3 rounded-xl p-3.5 transition-colors',
              step.done
                ? 'bg-white/60 opacity-60'
                : 'bg-white border border-slate-200 shadow-sm'
            )}
          >
            <div
              className={cn(
                'shrink-0 mt-0.5 h-5 w-5 rounded-full flex items-center justify-center',
                step.done ? 'bg-success-500 text-white' : 'text-slate-400'
              )}
            >
              {step.done ? (
                <CheckCircle2 className="h-5 w-5 text-success-500" />
              ) : (
                <Circle className="h-5 w-5 text-slate-300" />
              )}
            </div>
            <div className="flex-1 space-y-0.5">
              <p className={cn('text-sm font-semibold', step.done ? 'text-slate-400 line-through' : 'text-slate-800')}>
                {step.label}
              </p>
              {!step.done && (
                <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
              )}
            </div>
            {!step.done && step.id === 'reddit' && (
              <a
                href="/api/auth/reddit"
                className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 px-3 py-1.5 rounded-lg transition-colors"
              >
                Connect
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {!step.done && step.id === 'monitor' && (
              <button
                disabled={!redditConnected}
                className={cn(
                  'shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors',
                  redditConnected
                    ? 'text-white bg-indigo-600 hover:bg-indigo-700'
                    : 'text-slate-400 bg-slate-100 cursor-not-allowed'
                )}
              >
                Activate
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Keywords preview */}
      {keywords.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => setKeywordsExpanded(!keywordsExpanded)}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-brand-500" />
              <span className="text-sm font-semibold text-slate-700">
                {keywords.length} monitoring keywords extracted
              </span>
            </div>
            {keywordsExpanded ? (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            )}
          </button>
          {keywordsExpanded && (
            <div className="px-4 pb-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
              {keywords.map((kw, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-700 bg-brand-50 border border-brand-100 px-2.5 py-1 rounded-full"
                >
                  <Hash className="h-2.5 w-2.5" />
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { MessageSquare, Clock, CheckCircle2, XCircle, ExternalLink, BadgeDollarSign, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Tab = 'pending' | 'posted'

interface PendingComment {
  id: string
  draft_text: string
  edited_text?: string
  status: string
  created_at: string
  reddit_posts?: {
    title: string
    subreddit: string
    post_url: string
    author_username: string
  }
}

interface PostedComment {
  id: string
  edited_text?: string
  draft_text: string
  posted_at?: string
  status: string
  reddit_posts?: {
    title: string
    subreddit: string
    post_url: string
    author_username: string
  }
  conversions?: { id: string }[]
}

interface Props {
  pendingComments: PendingComment[]
  postedComments: PostedComment[]
  projectId: string
  redditConnected?: boolean
}

export default function DashboardTabs({ pendingComments, postedComments, projectId, redditConnected = false }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('pending')

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        <TabButton
          active={activeTab === 'pending'}
          onClick={() => setActiveTab('pending')}
          count={pendingComments.length}
          label="Pending"
        />
        <TabButton
          active={activeTab === 'posted'}
          onClick={() => setActiveTab('posted')}
          count={postedComments.length}
          label="Posted"
        />
      </div>

      {/* Pending */}
      {activeTab === 'pending' && (
        <div className="space-y-3">
          {pendingComments.length === 0 ? (
            redditConnected ? (
              <EmptyState
                icon={<MessageSquare className="h-8 w-8 text-slate-300" />}
                title="No pending drafts yet"
                desc="PinPoint scans Reddit hourly using your keywords. When a relevant post is found, a draft comment will appear here for your review."
              />
            ) : (
              <EmptyStateNoReddit />
            )
          ) : (
            pendingComments.map(comment => (
              <PendingCard key={comment.id} comment={comment} projectId={projectId} />
            ))
          )}
        </div>
      )}

      {/* Posted */}
      {activeTab === 'posted' && (
        <div className="space-y-3">
          {postedComments.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 className="h-8 w-8 text-slate-300" />}
              title="No posted comments yet"
              desc="Comments you confirm from the Pending tab will appear here with their full history."
            />
          ) : (
            postedComments.map(comment => (
              <PostedCard key={comment.id} comment={comment} />
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ── Tab button ──────────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  count,
  label,
}: {
  active: boolean
  onClick: () => void
  count: number
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
        active ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
      )}
    >
      {label}
      <span
        className={cn(
          'text-xs font-bold px-1.5 py-0.5 rounded-full',
          active ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-500'
        )}
      >
        {count}
      </span>
    </button>
  )
}

// ── Empty state (generic) ────────────────────────────────────────────────────

function EmptyState({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
      {icon}
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <p className="text-xs text-slate-400 max-w-xs">{desc}</p>
    </div>
  )
}

// ── Empty state (Reddit not connected) ──────────────────────────────────────

function EmptyStateNoReddit() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 border-2 border-dashed border-caution-200 rounded-2xl bg-caution-50/40">
      <div className="h-12 w-12 rounded-full bg-caution-100 flex items-center justify-center">
        <WifiOff className="h-6 w-6 text-caution-400" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-700">Reddit account not connected</p>
        <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
          Connect your Reddit account above to start monitoring. PinPoint will scan hourly and surface relevant posts here.
        </p>
      </div>
      <a
        href="/api/auth/reddit"
        className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 px-4 py-2 rounded-xl transition-colors"
      >
        Connect Reddit
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  )
}

// ── Pending card ─────────────────────────────────────────────────────────────

function PendingCard({ comment, projectId }: { comment: PendingComment; projectId: string }) {
  const [text, setText] = useState(comment.edited_text || comment.draft_text)
  const [status, setStatus] = useState<'idle' | 'confirming' | 'rejecting' | 'done'>('idle')

  const post = comment.reddit_posts

  async function handleAction(action: 'confirm' | 'reject') {
    setStatus(action === 'confirm' ? 'confirming' : 'rejecting')
    // TODO: wire up to API route (Week 5 — Reddit posting)
    await new Promise(r => setTimeout(r, 800)) // placeholder delay
    setStatus('done')
  }

  if (status === 'done') return null

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs hover:shadow-sm transition-shadow">
      {/* Post context */}
      {post && (
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                r/{post.subreddit}
              </span>
              <span className="text-[11px] text-slate-400">by u/{post.author_username}</span>
            </div>
            <p className="text-sm font-semibold text-slate-800 leading-snug">{post.title}</p>
          </div>
          {post.post_url && (
            <a
              href={post.post_url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-slate-400 hover:text-brand-600 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      )}

      {/* Editable draft */}
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Draft Comment
        </label>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={4}
          className="w-full text-sm text-slate-700 leading-relaxed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 resize-none transition-all"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-[11px] text-slate-400">
          <Clock className="h-3 w-3" />
          {new Date(comment.created_at).toLocaleDateString()}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
            onClick={() => handleAction('reject')}
            disabled={status !== 'idle'}
          >
            <XCircle className="h-4 w-4" />
            Reject
          </Button>
          <Button
            size="sm"
            className="gap-1.5 bg-brand-600 hover:bg-brand-700"
            onClick={() => handleAction('confirm')}
            disabled={status !== 'idle'}
          >
            <CheckCircle2 className="h-4 w-4" />
            {status === 'confirming' ? 'Posting…' : 'Confirm & Post'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Posted card ──────────────────────────────────────────────────────────────

function PostedCard({ comment }: { comment: PostedComment }) {
  const post = comment.reddit_posts
  const isConverted = (comment.conversions?.length ?? 0) > 0

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
      {/* Post context */}
      {post && (
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                r/{post.subreddit}
              </span>
              <span className="text-[11px] text-slate-400">by u/{post.author_username}</span>
              {isConverted && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-caution-700 bg-caution-50 border border-caution-200 px-2 py-0.5 rounded-full">
                  <BadgeDollarSign className="h-3 w-3" />
                  Converted
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-slate-800 leading-snug">{post.title}</p>
          </div>
          {post.post_url && (
            <a
              href={post.post_url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-slate-400 hover:text-brand-600 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      )}

      {/* Comment text */}
      <p className="text-sm text-slate-600 leading-relaxed border-l-2 border-brand-200 pl-3">
        {comment.edited_text || comment.draft_text}
      </p>

      {/* Footer */}
      {comment.posted_at && (
        <p className="text-[11px] text-slate-400 flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3 text-success-500" />
          Posted {new Date(comment.posted_at).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
          })}
        </p>
      )}
    </div>
  )
}

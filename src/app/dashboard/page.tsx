import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Target, Radio, MessageSquare, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import DashboardTabs from './components/dashboard-tabs'

export const metadata = {
  title: 'Dashboard — PinPoint',
  description: 'Review and confirm Reddit outreach drafts for your product.',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch project
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!project) redirect('/onboarding')

  // Fetch pending comments (status = 'pending')
  const { data: pendingComments } = await supabase
    .from('comments')
    .select('*, reddit_posts(*)')
    .eq('project_id', project.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  // Fetch posted comments (status = 'posted' | 'confirmed')
  const { data: postedComments } = await supabase
    .from('comments')
    .select('*, reddit_posts(*), conversions(*)')
    .eq('project_id', project.id)
    .in('status', ['posted', 'confirmed'])
    .order('posted_at', { ascending: false })

  const pendingCount = pendingComments?.length ?? 0
  const postedCount = postedComments?.length ?? 0
  const convertedCount = postedComments?.filter(c => c.conversions?.length > 0).length ?? 0

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top nav */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 h-14 flex items-center px-6">
        <Link href="/" className="flex items-center gap-2 mr-8">
          <Target className="h-5 w-5 text-indigo-600" />
          <span className="text-lg font-bold tracking-tight">PinPoint</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <span className="px-3 py-1.5 rounded-lg font-medium bg-indigo-50 text-indigo-700">
            Dashboard
          </span>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {/* Reddit connection status — placeholder */}
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 border border-slate-200 px-3 py-1.5 rounded-full">
            <Radio className="h-3 w-3" />
            Reddit: not connected
          </div>
          <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
            {user.email?.[0]?.toUpperCase() ?? 'U'}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Project header */}
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Project</p>
          <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
          {project.github_repo_url && (
            <a
              href={project.github_repo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-slate-500 hover:text-indigo-600 transition-colors"
            >
              {project.github_repo_url}
            </a>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            icon={<MessageSquare className="h-5 w-5 text-indigo-500" />}
            label="Awaiting Review"
            value={pendingCount}
            accent="indigo"
          />
          <StatCard
            icon={<Radio className="h-5 w-5 text-emerald-500" />}
            label="Comments Posted"
            value={postedCount}
            accent="emerald"
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5 text-amber-500" />}
            label="Conversions Tracked"
            value={convertedCount}
            accent="amber"
          />
        </div>

        {/* Main tabs */}
        <DashboardTabs
          pendingComments={pendingComments ?? []}
          postedComments={postedComments ?? []}
          projectId={project.id}
        />
      </main>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: number
  accent: 'indigo' | 'emerald' | 'amber'
}) {
  const bg = {
    indigo: 'bg-indigo-50 border-indigo-100',
    emerald: 'bg-emerald-50 border-emerald-100',
    amber: 'bg-amber-50 border-amber-100',
  }[accent]

  return (
    <div className={`rounded-2xl border p-5 ${bg} space-y-3`}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-3xl font-extrabold text-slate-900 tabular-nums">{value}</p>
    </div>
  )
}

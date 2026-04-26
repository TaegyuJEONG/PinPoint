import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Target, Radio, MessageSquare, TrendingUp, Wifi, WifiOff } from 'lucide-react'
import Link from 'next/link'
import DashboardTabs from './components/dashboard-tabs'
import SetupChecklist from './components/setup-checklist'
import ScanButton from './components/scan-button'

async function checkGeoFilesOnGitHub(ghToken: string, repoName: string): Promise<boolean> {
  const headers = {
    Authorization: `Bearer ${ghToken}`,
    Accept: 'application/vnd.github.v3+json',
  }
  try {
    const [rootRes, publicRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${repoName}/contents/llms.txt`, { headers }),
      fetch(`https://api.github.com/repos/${repoName}/contents/public/llms.txt`, { headers }),
    ])
    return rootRes.ok || publicRes.ok
  } catch {
    return false
  }
}

export const metadata = {
  title: 'Dashboard — PinPoint',
  description: 'Review and confirm Reddit outreach drafts for your product.',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch most recent project — .single() breaks when >1 row exists, so use limit(1)
  const { data: projectRows } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)

  const project = projectRows?.[0] ?? null
  if (!project) redirect('/onboarding')

  // Check GEO files by looking for llms.txt in the actual GitHub repo
  const cookieStore = await cookies()
  const ghToken = cookieStore.get('gh_provider_token')?.value
  const repoName = project.github_repo_url
    ?.replace('https://github.com/', '')
    .replace(/\/$/, '')

  const geoFilesReady = ghToken && repoName
    ? await checkGeoFilesOnGitHub(ghToken, repoName)
    : false

  // Fetch Reddit account connection
  const { data: redditAccount } = await supabase
    .from('reddit_accounts')
    .select('id, reddit_username')
    .eq('project_id', project.id)
    .maybeSingle()

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

  const redditConnected = !!redditAccount
  const keywords: string[] = Array.isArray(project.keywords) ? project.keywords : []

  // Show setup only when not all done
  const showSetup = !geoFilesReady || !redditConnected

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top nav */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 h-14 flex items-center px-6">
        <Link href="/" className="flex items-center gap-2 mr-8">
          <Target className="h-5 w-5 text-brand-600" />
          <span className="text-lg font-bold tracking-tight">PinPoint</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <span className="px-3 py-1.5 rounded-lg font-medium bg-brand-50 text-brand-700">
            Dashboard
          </span>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {redditConnected ? (
            <div className="flex items-center gap-1.5 text-xs font-medium text-success-600 border border-success-200 bg-success-50 px-3 py-1.5 rounded-full">
              <Wifi className="h-3 w-3" />
              u/{redditAccount?.reddit_username}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 border border-slate-200 px-3 py-1.5 rounded-full">
              <WifiOff className="h-3 w-3" />
              Reddit: not connected
            </div>
          )}
          <div className="h-7 w-7 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-700">
            {user.email?.[0]?.toUpperCase() ?? 'U'}
          </div>
        </div>
      </header>

      {showSetup ? (
        /* ── Setup page ─────────────────────────────────────────────────────── */
        <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-12 space-y-6">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Project</p>
            <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
            {project.github_repo_url && (
              <a
                href={project.github_repo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-slate-500 hover:text-brand-600 transition-colors"
              >
                {project.github_repo_url}
              </a>
            )}
          </div>
          <SetupChecklist
            geoFilesReady={geoFilesReady}
            redditConnected={redditConnected}
            keywords={keywords}
            projectName={project.name}
          />
        </main>
      ) : (
        /* ── Main dashboard ─────────────────────────────────────────────────── */
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 space-y-8">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Project</p>
            <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
            {project.github_repo_url && (
              <a
                href={project.github_repo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-slate-500 hover:text-brand-600 transition-colors"
              >
                {project.github_repo_url}
              </a>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <StatCard
              icon={<MessageSquare className="h-5 w-5 text-brand-500" />}
              label="Awaiting Review"
              value={pendingCount}
              accent="brand"
            />
            <StatCard
              icon={<Radio className="h-5 w-5 text-success-500" />}
              label="Comments Posted"
              value={postedCount}
              accent="success"
            />
            <StatCard
              icon={<TrendingUp className="h-5 w-5 text-caution-500" />}
              label="Conversions Tracked"
              value={convertedCount}
              accent="caution"
            />
          </div>

          <div className="flex items-center justify-between">
            <ScanButton projectId={project.id} />
            <p className="text-xs text-slate-400">AI selects subreddits &amp; keywords · past week · ~30–60s</p>
          </div>

          <DashboardTabs
            pendingComments={pendingComments ?? []}
            postedComments={postedComments ?? []}
            projectId={project.id}
            redditConnected={redditConnected}
          />
        </main>
      )}
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
  accent: 'brand' | 'success' | 'caution'
}) {
  const bg = {
    brand: 'bg-brand-50 border-brand-100',
    success: 'bg-success-50 border-success-100',
    caution: 'bg-caution-50 border-caution-100',
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

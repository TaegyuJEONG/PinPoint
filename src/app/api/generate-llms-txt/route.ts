import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

// ── llms-full.txt assembler (no LLM call — pure template) ──────────────────

function buildLlmsFullTxt({
  projectName,
  brandDefinition,
  idealCustomers,
  problemSolutions,
  faqs,
  useCases,
  trustSignals,
  competitors,
  matrixFactors,
}: {
  projectName: string
  brandDefinition: string
  idealCustomers: string[]
  problemSolutions: { problem: string; solution: string }[]
  faqs: { question: string; answer: string }[]
  useCases: string[]
  trustSignals: { type: string; content: string }[]
  competitors: string[]
  matrixFactors: { feature: string; yours: string; comps: Record<string, string> }[]
}): string {
  const lines: string[] = []

  lines.push(`# ${projectName} — Full Product Context`)
  lines.push('')
  if (brandDefinition) {
    lines.push(`> ${brandDefinition}`)
    lines.push('')
  }

  // Target Audience
  if (idealCustomers.length > 0) {
    lines.push('## Target Audience')
    lines.push('')
    idealCustomers.forEach(c => lines.push(`- ${c}`))
    lines.push('')
  }

  // Problems & Solutions
  if (problemSolutions.length > 0) {
    lines.push('## Problems & Solutions')
    lines.push('')
    problemSolutions.forEach(({ problem, solution }) => {
      lines.push(`### Problem: ${problem}`)
      lines.push(`**Solution:** ${solution}`)
      lines.push('')
    })
  }

  // Key Use Cases
  if (useCases.length > 0) {
    lines.push('## Key Use Cases')
    lines.push('')
    useCases.forEach(u => lines.push(`- ${u}`))
    lines.push('')
  }

  // Trust & Authority (E-E-A-T)
  if (trustSignals.length > 0) {
    lines.push('## Trust & Authority')
    lines.push('')
    const grouped: Record<string, string[]> = {}
    trustSignals.forEach(({ type, content }) => {
      if (!grouped[type]) grouped[type] = []
      grouped[type].push(content)
    })
    Object.entries(grouped).forEach(([type, contents]) => {
      lines.push(`### ${type}`)
      contents.forEach(c => lines.push(`- ${c}`))
      lines.push('')
    })
  }

  // FAQ
  if (faqs.length > 0) {
    lines.push('## Frequently Asked Questions')
    lines.push('')
    faqs.forEach(({ question, answer }) => {
      lines.push(`### Q: ${question}`)
      lines.push(`A: ${answer}`)
      lines.push('')
    })
  }

  // Competitive Landscape
  if (competitors.length > 0 && matrixFactors.length > 0) {
    lines.push('## Competitive Landscape')
    lines.push('')
    lines.push(`Alternatives: ${competitors.join(', ')}`)
    lines.push('')
    matrixFactors.forEach(({ feature, yours, comps }) => {
      lines.push(`### ${feature}`)
      lines.push(`- **${projectName}:** ${yours}`)
      competitors.forEach(c => {
        if (comps[c]) lines.push(`- **${c}:** ${comps[c]}`)
      })
      lines.push('')
    })
  }

  return lines.join('\n')
}

// ── llms.txt assembler (built from GitHub repo scan) ──────────────────────

async function buildLlmsTxt({
  projectName,
  brandDefinition,
  repoName,
  homepage,
  ghToken,
  defaultBranch,
}: {
  projectName: string
  brandDefinition: string
  repoName: string
  homepage: string
  ghToken: string
  defaultBranch: string
}): Promise<string> {
  const lines: string[] = []
  const baseUrl = homepage?.startsWith('http') ? homepage.replace(/\/$/, '') : null

  lines.push(`# ${projectName}`)
  lines.push('')
  if (brandDefinition) {
    lines.push(`> ${brandDefinition}`)
    lines.push('')
  }

  // Scan the repo file tree
  let tree: { path: string; type: string }[] = []
  try {
    const treeRes = await fetch(
      `https://api.github.com/repos/${repoName}/git/trees/${defaultBranch}?recursive=1`,
      { headers: { Authorization: `Bearer ${ghToken}`, Accept: 'application/vnd.github.v3+json' } }
    )
    if (treeRes.ok) {
      const treeData = await treeRes.json()
      tree = treeData.tree || []
    }
  } catch (e) {
    console.warn('GitHub tree scan failed:', e)
  }

  const paths = tree.map((f: { path: string }) => f.path)

  // Detect OpenAPI
  const hasOpenApi = paths.some(p =>
    /openapi\.(yaml|json|yml)$/i.test(p) || /swagger\.(yaml|json|yml)$/i.test(p)
  )
  if (hasOpenApi && baseUrl) {
    const openapiPath = paths.find(p => /openapi\.(yaml|json|yml)$/i.test(p))
    lines.push('## OpenAPI Specification')
    lines.push('')
    if (openapiPath) {
      const ext = openapiPath.split('.').pop()
      lines.push(`- [OpenAPI spec (${ext?.toUpperCase()})](${baseUrl}/openapi.${ext})`)
    }
    lines.push('')
  }

  // Detect MCP
  const hasMcp = paths.some(p =>
    p === '.well-known/mcp.json' || p.includes('mcp-server') || p.includes('mcp.json')
  )
  if (hasMcp) {
    lines.push('## MCP Server')
    lines.push('')
    lines.push(`- [Repository](https://github.com/${repoName})`)
    if (baseUrl && paths.includes('.well-known/mcp.json')) {
      lines.push(`- [MCP Discovery](${baseUrl}/.well-known/mcp.json)`)
    }
    lines.push('')
  }

  // Detect CLI
  const hasCliDir = paths.some(p => /^(cli|bin)\//i.test(p))
  let hasPackageJsonBin = false
  const packageJsonPath = paths.find(p => p === 'package.json')
  if (packageJsonPath) {
    try {
      const pkgRes = await fetch(
        `https://api.github.com/repos/${repoName}/contents/package.json`,
        { headers: { Authorization: `Bearer ${ghToken}`, Accept: 'application/vnd.github.v3.raw' } }
      )
      if (pkgRes.ok) {
        const pkg = await pkgRes.json()
        hasPackageJsonBin = !!(pkg.bin && Object.keys(pkg.bin).length > 0)
      }
    } catch { /* skip */ }
  }
  if (hasCliDir || hasPackageJsonBin) {
    lines.push('## Command Line Tool')
    lines.push('')
    lines.push(`- [Repository](https://github.com/${repoName})`)
    lines.push('')
  }

  // Detect SDK sub-packages
  const sdkPatterns = [
    { pattern: /-node$/, label: 'Node.js' },
    { pattern: /-python$/, label: 'Python' },
    { pattern: /-php$/, label: 'PHP' },
    { pattern: /-ruby$/, label: 'Ruby' },
    { pattern: /-go$/, label: 'Go' },
    { pattern: /-java$/, label: 'Java' },
    { pattern: /-dotnet$/, label: '.NET' },
    { pattern: /-rust$/, label: 'Rust' },
  ]
  const detectedSdks: { label: string; path: string }[] = []
  sdkPatterns.forEach(({ pattern, label }) => {
    const match = paths.find(p => pattern.test(p.split('/')[0]))
    if (match) detectedSdks.push({ label, path: match.split('/')[0] })
  })
  if (detectedSdks.length > 0) {
    lines.push('## SDKs')
    lines.push('')
    detectedSdks.forEach(({ label, path }) => {
      lines.push(`- [${label}](https://github.com/${repoName}/tree/${defaultBranch}/${path})`)
    })
    lines.push('')
  }

  // Detect docs directory
  const docsDir = paths.find(p => /^(docs?|documentation|wiki)\//i.test(p))
  if (docsDir) {
    lines.push('## Documentation')
    lines.push('')
    if (baseUrl) {
      lines.push(`- [Documentation](${baseUrl}/docs)`)
    }
    lines.push(
      `- [Source](https://github.com/${repoName}/tree/${defaultBranch}/${docsDir.split('/')[0]})`
    )
    lines.push('')
  }

  // Detect pricing page
  const hasPricing = paths.some(p => /pricing\.(md|mdx)$/i.test(p))
  if (hasPricing && baseUrl) {
    lines.push('## Pricing')
    lines.push('')
    lines.push(`- [Pricing](${baseUrl}/pricing)`)
    lines.push('')
  }

  // Always link to llms-full.txt
  lines.push('## Full Product Context (GEO)')
  lines.push('')
  const fullTxtUrl = baseUrl
    ? `${baseUrl}/llms-full.txt`
    : `https://raw.githubusercontent.com/${repoName}/${defaultBranch}/llms-full.txt`
  lines.push(
    `- [Full documentation](${fullTxtUrl})`
  )
  lines.push('')

  // GitHub repo link
  lines.push('## Source Code')
  lines.push('')
  lines.push(`- [GitHub Repository](https://github.com/${repoName})`)
  lines.push('')

  return lines.join('\n')
}

// ── Route Handler ──────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cookieStore = await cookies()
    const ghToken = cookieStore.get('gh_provider_token')?.value
    if (!ghToken) {
      return NextResponse.json({ error: 'GitHub token missing' }, { status: 400 })
    }

    const {
      repoName,
      defaultBranch = 'main',
      homepage = '',
      projectName,
      brandDefinition = '',
      idealCustomers = [],
      problemSolutions = [],
      faqs = [],
      useCases = [],
      trustSignals = [],
      competitors = [],
      matrixFactors = [],
    } = await request.json()

    if (!repoName) {
      return NextResponse.json({ error: 'repoName is required' }, { status: 400 })
    }

    console.log(`Generating GEO files for: ${repoName}`)

    // Generate both files in parallel
    const [llmsTxt, llmsFullTxt] = await Promise.all([
      buildLlmsTxt({
        projectName,
        brandDefinition,
        repoName,
        homepage,
        ghToken,
        defaultBranch,
      }),
      Promise.resolve(
        buildLlmsFullTxt({
          projectName,
          brandDefinition,
          idealCustomers,
          problemSolutions,
          faqs,
          useCases,
          trustSignals,
          competitors,
          matrixFactors,
        })
      ),
    ])

    return NextResponse.json({ llmsTxt, llmsFullTxt })
  } catch (error) {
    console.error('Generate LLMs TXT Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

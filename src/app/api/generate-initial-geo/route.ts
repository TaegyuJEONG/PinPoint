import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { repoUrl, repoName, defaultBranch, homepage, description } = await request.json()

    const cookieStore = await cookies()
    const ghToken = cookieStore.get('gh_provider_token')?.value

    if (!ghToken) {
      return NextResponse.json({ error: 'GitHub token missing' }, { status: 400 })
    }

    // 2. Fetch README from GitHub
    let readmeContent = ''
    try {
      const readmeRes = await fetch(`https://api.github.com/repos/${repoName}/readme`, {
        headers: {
          Authorization: `Bearer ${ghToken}`,
          Accept: 'application/vnd.github.v3.raw',
        }
      })
      if (readmeRes.ok) {
        readmeContent = await readmeRes.text()
      } else {
        // Fallback to description if README fails (e.g., empty repo)
        readmeContent = description || repoName
      }
    } catch (e) {
      readmeContent = description || repoName
    }

    // 3. Generate Initial GEO using OpenAI
    console.log('Generating initial GEO for:', repoName)
    const { object: initialGeo } = await generateObject({
      model: openai('gpt-4o-mini'),
      system: 'You are an expert product marketer. Based on the provided GitHub README and description, extract key details to help build a marketing profile. Be concise and accurate.',
      prompt: `Analyze this repository: ${repoName}\n\nREADME content:\n${readmeContent.substring(0, 8000)}`,
      schema: z.object({
        idealCustomers: z.array(z.string()).describe("List of 2-4 target audience profiles"),
        problemSolutions: z.array(z.object({
          problem: z.string(),
          solution: z.string(),
        })).describe("List of 2-3 key problems the product solves and how it solves them"),
        faqs: z.array(z.object({
          question: z.string(),
          answer: z.string(),
        })).describe("List of 2-4 likely frequently asked questions"),
        useCases: z.array(z.string()).describe("List of 2-4 common use cases"),
        competitors: z.array(z.string()).describe("List of 1-3 likely competitors or alternative solutions, if known. Leave empty if none."),
      })
    })

    // 4. Create the Project in DB
    console.log('Inserting project into DB...')
    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name: repoName.split('/')[1] || repoName,
        github_repo_url: repoUrl,
        product_urls: { website: homepage || '', github: repoUrl },
        initial_geo_draft: initialGeo
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create project in DB:', error)
      return NextResponse.json({ error: 'Failed to save project: ' + error.message }, { status: 500 })
    }

    console.log('Successfully generated initial geo for:', repoName)
    return NextResponse.json({ project, initial_geo: initialGeo })
    
  } catch (error) {
    console.error('Generate Initial GEO Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

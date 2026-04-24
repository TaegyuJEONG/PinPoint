import { NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // generateObject with GPT-4o-mini
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      system: 'You are an SEO and Generative Engine Optimization expert. Based on the product profile, generate 3 to 5 highly realistic, natural language search queries that a potential customer would type into ChatGPT or Perplexity when searching for a solution like this.',
      prompt: `Product context:\n${JSON.stringify(body).substring(0, 5000)}`,
      schema: z.object({
        prompts: z.array(z.string()).describe("List of 3-5 search queries")
      })
    })

    return NextResponse.json({ prompts: object.prompts })
  } catch (error) {
    console.error('Generate Prompts Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

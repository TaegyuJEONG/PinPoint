import { NextResponse } from 'next/server'
import { generateObject, generateText } from 'ai'
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

    const { prompts } = await request.json()

    if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
      return NextResponse.json({ error: 'No prompts provided' }, { status: 400 })
    }

    // Loop through the prompts and fetch actual ChatGPT baseline
    console.log('Sending prompts to OpenAI baseline...')
    
    // Process concurrently for speed
    const fetchPromises = prompts.map(async (prompt) => {
      const { text } = await generateText({
        model: openai('gpt-4o-mini'),
        prompt: prompt, // Just act like a normal user asking ChatGPT
      })
      return { prompt, text }
    })

    const results = await Promise.all(fetchPromises)
    
    const aggregatedText = results.map(r => `--- PROMPT: ${r.prompt} ---\nRESPONSE:\n${r.text}\n`).join('\n')

    console.log('Synthesizing responses into competitor matrix...')
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      system: 'You are a competitive intelligence analyst. Analyze the following raw responses from an AI search engine across multiple user prompts. Identify the top 2 to 4 competitors frequently mentioned or recommended. Extract structured data comparing them on key factors like "Pricing", "Core Differentiator", and up to 2 other features. If a factor is not mentioned for a competitor, put "-". Return a strict JSON output.',
      prompt: `Raw AI Output:\n${aggregatedText.substring(0, 35000)}`,
      schema: z.object({
        competitors: z.array(z.string()).describe("Top 2-4 competitor names"),
        factors: z.array(z.object({
          feature: z.string().describe("E.g. Price, AI Features, Target Audience"),
          compEntries: z.array(z.object({
            name: z.string().describe("Competitor name"),
            value: z.string().describe("Details for this competitor on this feature")
          })).describe("One entry per competitor with their details for this feature")
        })).describe("List of 3-4 feature comparison rows"),
      })
    })

    // Transform compEntries array into the Record<string, string> format the frontend expects
    const formattedFactors = object.factors.map(f => {
      const comps: Record<string, string> = {}
      f.compEntries.forEach(entry => { comps[entry.name] = entry.value })
      return { feature: f.feature, comps, yours: '' }
    })

    return NextResponse.json({ 
      competitors: object.competitors, 
      factors: formattedFactors,
      rawScanResults: results 
    })
  } catch (error) {
    console.error('Scan Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

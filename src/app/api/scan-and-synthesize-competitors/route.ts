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

    const payload = await request.json()
    const { brandDefinition, idealCustomers, problemSolutions, faqs, useCases, trustSignals, targetPrompts } = payload

    if (!idealCustomers && !problemSolutions && !useCases) {
      return NextResponse.json({ error: 'Insufficient product context provided' }, { status: 400 })
    }

    console.log('Synthesizing deep context into competitor matrix...')
    
    // Construct a comprehensive summary of the product to send to the AI
    const productContext = `
Brand Definition: ${brandDefinition || 'N/A'}
Ideal Customers: ${JSON.stringify(idealCustomers || [])}
Problems & Solutions: ${JSON.stringify(problemSolutions || [])}
Frequently Asked Questions: ${JSON.stringify(faqs || [])}
Key Use Cases: ${JSON.stringify(useCases || [])}
Trust & Authority Signals: ${JSON.stringify(trustSignals || [])}
Example Search Prompts Target Audience Uses: ${JSON.stringify(targetPrompts || [])}
    `

    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      system: `You are an elite competitive intelligence analyst and product strategist. Your job is to analyze a new product based on its deep context (its origin story, target audience, specific problems it solves, and use cases).
      
Instead of just picking big generic apps, identify the 2 to 4 TRUE DIRECT ALTERNATIVES or competitors that the target audience would actually consider for these specific use cases. 

Then, create a highly insightful competitive matrix. For each comparison factor:
1. Identify the factor (e.g. Pricing, Core Differentiator, Where They Fail, Switching Costs).
2. Provide a sharp, data-driven detail for each COMPETITOR.
3. Provide a sharp, strategic detail for the OUR PRODUCT (the subject of the context provided).

DO NOT just use generic factors like "Target Audience" or "AI Features". Be incisive.
Return a strict JSON output matching the schema. If a factor is unknown, put "-".`,
      prompt: `Analyze the following product context and generate a sharp competitive matrix including our product's own advantages:\n\n${productContext}`,
      schema: z.object({
        competitors: z.array(z.string()).describe("Top 2-4 true competitor/alternative names"),
        factors: z.array(z.object({
          feature: z.string().describe("E.g. Pricing, Core Differentiator, Where They Fail, Switching Costs"),
          yoursValue: z.string().describe("Details for OUR product for this feature"),
          compEntries: z.array(z.object({
            name: z.string().describe("Competitor name"),
            value: z.string().describe("Details for this competitor on this feature")
          })).describe("One entry per competitor with their details for this feature")
        })).describe("List of 3-4 insightful feature comparison rows"),
      })
    })

    // Transform compEntries array into the Record<string, string> format the frontend expects
    const formattedFactors = object.factors.map(f => {
      const comps: Record<string, string> = {}
      f.compEntries.forEach(entry => { comps[entry.name] = entry.value })
      return { feature: f.feature, comps, yours: f.yoursValue }
    })

    return NextResponse.json({ 
      competitors: object.competitors, 
      factors: formattedFactors,
      rawScanResults: [] // Retained for backwards compatibility if needed
    })
  } catch (error) {
    console.error('Scan Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

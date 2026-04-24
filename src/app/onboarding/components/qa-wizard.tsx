'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, X, Loader2 } from 'lucide-react'

const STEPS = [
  { id: 1, title: 'Origin Story', question: "What's your authentic origin story?", desc: "Where did the idea come from? Authentic stories convert better." },
  { id: 2, title: 'Ideal Customers', question: 'Who are your ideal customers?', desc: "We extracted these from your README." },
  { id: 3, title: 'Problems & Solutions', question: 'What specific problems do you solve?', desc: "Define the pain points and your solutions." },
  { id: 4, title: 'Common Q&A', question: 'What questions do customers frequently ask?', desc: "Address objections before they happen." },
  { id: 5, title: 'Key Use Cases', question: 'What are the main use cases?', desc: "How are people actually using this?" },
  { id: 6, title: 'Target Search Prompts', question: 'What do customers search for?', desc: "These are the exact prompts your prospects type into ChatGPT or Perplexity." },
  { id: 7, title: 'Competitor Matrix', question: 'How do you stack up against alternatives?', desc: "We scanned ChatGPT with your prompts. Fill in your advantages against the AI's top recommendations." }
]

export default function QaWizard({ initialGeo, onComplete }: { initialGeo: any, onComplete: (data: any) => void }) {
  const [currentStepId, setCurrentStepId] = useState(1)
  const currentStep = STEPS.find(s => s.id === currentStepId)!

  // States
  const [originStory, setOriginStory] = useState('')
  const [idealCustomers, setIdealCustomers] = useState<string[]>(initialGeo?.idealCustomers || [])
  const [problemSolutions, setProblemSolutions] = useState<{problem: string, solution: string}[]>(initialGeo?.problemSolutions || [])
  const [faqs, setFaqs] = useState<{question: string, answer: string}[]>(initialGeo?.faqs || [])
  const [useCases, setUseCases] = useState<string[]>(initialGeo?.useCases || [])
  const [targetPrompts, setTargetPrompts] = useState<string[]>([])
  const [competitors, setCompetitors] = useState<string[]>(initialGeo?.competitors || ['Competitor A'])

  const [matrixFactors, setMatrixFactors] = useState<{feature: string, yours: string, comps: Record<string, string>}[]>([
    { feature: 'Price', yours: '', comps: {} },
    { feature: 'Core Differentiator', yours: '', comps: {} }
  ])

  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false)
  const [isSynthesizing, setIsSynthesizing] = useState(false)
  const [hasSynthesized, setHasSynthesized] = useState(false)

  async function handleNext() {
    if (currentStepId === 5) {
      if (targetPrompts.length === 0) {
        setIsGeneratingPrompts(true)
        try {
          const res = await fetch('/api/generate-prompts', {
            method: 'POST',
            body: JSON.stringify({ initialGeo, originStory, idealCustomers, problemSolutions, faqs, useCases })
          })
          const data = await res.json()
          if (data.prompts) setTargetPrompts(data.prompts)
        } catch(e) { console.error(e) }
        setIsGeneratingPrompts(false)
      }
      setCurrentStepId(6)
    } else if (currentStepId === 6) {
      if (!hasSynthesized) {
        setIsSynthesizing(true)
        try {
          const res = await fetch('/api/scan-and-synthesize-competitors', {
            method: 'POST',
            body: JSON.stringify({ prompts: targetPrompts })
          })
          const data = await res.json()
          if (data.competitors && data.factors) {
            setCompetitors(data.competitors)
            setMatrixFactors(data.factors)
            setHasSynthesized(true)
          }
        } catch(e) { console.error(e) }
        setIsSynthesizing(false)
      }
      setCurrentStepId(7)
    } else if (currentStepId < 7) {
      setCurrentStepId(currentStepId + 1)
    } else {
      onComplete({ originStory, idealCustomers, problemSolutions, faqs, useCases, targetPrompts, competitors, matrixFactors })
    }
  }

  function handleBack() {
    if (currentStepId > 1) setCurrentStepId(currentStepId - 1)
  }

  return (
    <div className="space-y-6 mx-auto py-2">
      <div className="mb-4 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-500">Step {currentStepId} of 7</span>
          <span className="text-sm font-medium text-indigo-600">{currentStep.title}</span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
             className="h-full bg-indigo-600 transition-all duration-300 ease-in-out" 
             style={{ width: `${(currentStepId / 7) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold">{currentStep.question}</h2>
        <p className="text-sm text-slate-500">{currentStep.desc}</p>
      </div>

      <div className="min-h-[300px] pb-4">
        {isGeneratingPrompts && currentStepId === 6 && (
          <div className="flex flex-col items-center justify-center h-48 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <p className="text-slate-500">Generating target prompts...</p>
          </div>
        )}
        
        {isSynthesizing && currentStepId === 7 && (
          <div className="flex flex-col items-center justify-center h-48 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <p className="text-slate-500">Scanning ChatGPT responses & Synthesizing competitor matrix...</p>
          </div>
        )}

        {!isGeneratingPrompts && !isSynthesizing && (
          <>
            {currentStepId === 1 && (
              <textarea
                className="w-full h-48 p-4 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 resize-none"
                placeholder="I was building a side project and realized I had no way to find users..."
                value={originStory}
                onChange={e => setOriginStory(e.target.value)}
              />
            )}
            
            {currentStepId === 2 && <ListEditor items={idealCustomers} setItems={setIdealCustomers} placeholder="E.g. Solo founders" />}
            {currentStepId === 3 && <PairEditor items={problemSolutions} setItems={setProblemSolutions} k1="problem" k2="solution" pl1="The Problem..." pl2="How we solve it..." />}
            {currentStepId === 4 && <PairEditor items={faqs} setItems={setFaqs} k1="question" k2="answer" pl1="Question..." pl2="Answer..." />}
            {currentStepId === 5 && <ListEditor items={useCases} setItems={setUseCases} placeholder="E.g. Automating outreach" />}
            {currentStepId === 6 && <ListEditor items={targetPrompts} setItems={setTargetPrompts} placeholder="E.g. Best AI voice diary app" />}
            {currentStepId === 7 && <CompetitorMatrix competitors={competitors} factors={matrixFactors} setFactors={setMatrixFactors} />}
          </>
        )}
      </div>

      <div className="flex justify-between pt-6 border-t">
        <Button variant="ghost" onClick={handleBack} disabled={currentStepId === 1 || isGeneratingPrompts || isSynthesizing}>
          Back
        </Button>
        <Button onClick={handleNext} className="bg-indigo-600 hover:bg-indigo-700" disabled={isGeneratingPrompts || isSynthesizing}>
          {currentStepId === 7 ? 'Generate GEO Files' : 'Next Step'}
        </Button>
      </div>
    </div>
  )
}

function ListEditor({ items, setItems, placeholder }: { items: string[], setItems: any, placeholder: string }) {
  const [val, setVal] = useState('')
  const add = () => { if (val.trim()) { setItems([...items, val]); setVal('') } }
  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input value={item} onChange={e => { const copy = [...items]; copy[i] = e.target.value; setItems(copy) }} />
            <Button variant="ghost" size="icon" className="text-red-500 shrink-0" onClick={() => setItems(items.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 pt-2">
        <Input value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder={placeholder} />
        <Button variant="outline" onClick={add}><Plus className="h-4 w-4" /></Button>
      </div>
    </div>
  )
}

function PairEditor({ items, setItems, k1, k2, pl1, pl2 }: { items: any[], setItems: any, k1: string, k2: string, pl1: string, pl2: string }) {
  const add = () => setItems([...items, { [k1]: '', [k2]: '' }])
  return (
    <div className="space-y-6 pt-2">
      {items.map((item, i) => (
        <div key={i} className="space-y-2 p-4 border rounded-md relative bg-slate-50">
          <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-red-500 h-6 w-6" onClick={() => setItems(items.filter((_, idx) => idx !== i))}><X className="h-4 w-4" /></Button>
          <div className="space-y-1 pr-8">
            <span className="text-xs font-semibold text-slate-500 uppercase">{k1}</span>
            <Input value={item[k1]} onChange={e => { const c = [...items]; c[i][k1] = e.target.value; setItems(c) }} placeholder={pl1} className="bg-white" />
          </div>
          <div className="space-y-1 pr-8">
            <span className="text-xs font-semibold text-slate-500 uppercase">{k2}</span>
            <textarea value={item[k2]} onChange={e => { const c = [...items]; c[i][k2] = e.target.value; setItems(c) }} placeholder={pl2} className="w-full p-2 border rounded-md text-sm min-h-[60px] bg-white resize-y" />
          </div>
        </div>
      ))}
      <Button variant="outline" className="w-full border-dashed" onClick={add}><Plus className="h-4 w-4 mr-2" /> Add Pair</Button>
    </div>
  )
}

function CompetitorMatrix({ competitors, factors, setFactors }: { competitors: string[], factors: any[], setFactors: any }) {
  const addFactor = () => setFactors([...factors, { feature: '', yours: '', comps: {} }])

  return (
    <div className="space-y-4 pt-4 overflow-x-auto">
      <table className="w-full text-sm text-left border rounded-md overflow-hidden shadow-sm">
        <thead className="bg-slate-100 border-b border-slate-200">
          <tr>
            <th className="px-3 py-3 font-semibold min-w-[150px]">Factor / Feature</th>
            {competitors.map((c, i) => <th key={i} className="px-3 py-3 font-semibold text-slate-500 min-w-[150px]">{c}</th>)}
            <th className="px-3 py-3 font-bold text-indigo-700 bg-indigo-50 min-w-[150px]">You</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {factors.map((f, i) => (
            <tr key={i} className="hover:bg-slate-50/50">
              <td className="px-2 py-2">
                <Input value={f.feature} onChange={(e) => { const nc = [...factors]; nc[i].feature = e.target.value; setFactors(nc) }} className="border-0 shadow-none bg-transparent" placeholder="Factor name..." />
              </td>
              {competitors.map((c, j) => (
                <td key={j} className="px-2 py-2">
                  <Input value={f.comps[c] || ''} onChange={(e) => { const nc = [...factors]; nc[i].comps[c] = e.target.value; setFactors(nc) }} className="border-0 shadow-none bg-transparent text-slate-500" placeholder="..." />
                </td>
              ))}
              <td className="px-2 py-2 bg-indigo-50/50">
                <Input value={f.yours} onChange={(e) => { const nc = [...factors]; nc[i].yours = e.target.value; setFactors(nc) }} className="border-0 shadow-none bg-transparent font-medium text-indigo-900" placeholder="Your advantage..." />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Button variant="outline" size="sm" onClick={addFactor}><Plus className="h-4 w-4 mr-2" /> Add Factor Row</Button>
    </div>
  )
}

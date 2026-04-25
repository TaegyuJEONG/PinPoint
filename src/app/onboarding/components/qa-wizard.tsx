'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, X, Loader2 } from 'lucide-react'

const STEPS = [
  { id: 1, title: 'Origin Story', question: "What's your authentic origin story?", desc: "Where did the idea come from? Authentic stories convert better." },
  { id: 2, title: 'Ideal Customers', question: 'Who are your ideal customers?', desc: "Review and refine your target audience." },
  { id: 3, title: 'Problems & Solutions', question: 'What specific problems do you solve?', desc: "Define the pain points and your solutions." },
  { id: 4, title: 'Common Q&A', question: 'What questions do customers frequently ask?', desc: "Anticipate and address user questions before they arise." },
  { id: 5, title: 'Key Use Cases', question: 'What are the main use cases?', desc: "How are people actually using this?" },
  { id: 6, title: 'Target Search Prompts', question: 'What do customers search for?', desc: "These are the high-intent prompts your audience uses to find solutions in LLMs like ChatGPT, Claude, or Perplexity." },
  { id: 7, title: 'Competitor Matrix', question: 'How do you stack up against alternatives?', desc: "We scanned ChatGPT with your prompts. Fill in your advantages against the AI's top recommendations." }
]

export default function QaWizard({ initialGeo, onComplete }: { initialGeo: any, onComplete: (data: any) => void }) {
  const [currentStepId, setCurrentStepId] = useState(1)
  const currentStep = STEPS.find(s => s.id === currentStepId)!
  const scrollContainerRef = useRef<HTMLDivElement>(null)

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
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0
    if (currentStepId === 5) {
      setCurrentStepId(6)
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
    } else if (currentStepId === 6) {
      setCurrentStepId(7)
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
    } else if (currentStepId < 7) {
      setCurrentStepId(currentStepId + 1)
    } else {
      onComplete({ originStory, idealCustomers, problemSolutions, faqs, useCases, targetPrompts, competitors, matrixFactors })
    }
  }

  function handleBack() {
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0
    if (currentStepId > 1) setCurrentStepId(currentStepId - 1)
  }

  return (
    <div className="space-y-6 mx-auto py-2 w-full max-w-2xl">
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

      <div 
        ref={scrollContainerRef}
        className="min-h-[300px] max-h-[380px] overflow-y-auto custom-scrollbar pr-2 pb-4"
      >
        {isGeneratingPrompts && currentStepId === 6 && (
          <div className="flex flex-col items-center justify-center h-64 space-y-6 text-center px-4">
            <div className="relative">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
              <div className="absolute inset-0 h-10 w-10 bg-indigo-600/10 rounded-full blur-xl animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <p className="text-lg font-semibold text-slate-900">Generating target prompts...</p>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                We're analyzing your product content to identify high-intent queries your audience uses in LLMs. This helps focus your GEO strategy.
              </p>
            </div>
          </div>
        )}
        
        {isSynthesizing && currentStepId === 7 && (
          <div className="flex flex-col items-center justify-center h-64 space-y-6 text-center px-4">
            <div className="relative">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
              <div className="absolute inset-0 h-10 w-10 bg-indigo-600/10 rounded-full blur-xl animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <p className="text-lg font-semibold text-slate-900">Scanning LLM Landscapes...</p>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                We're live-scanning AI search engines to see how they currently perceive your competitors. Synthesizing your competitive matrix...
              </p>
            </div>
          </div>
        )}

        {!isGeneratingPrompts && !isSynthesizing && (
          <>
            {currentStepId === 1 && (
              <div className="space-y-1">
                <div className="relative bg-white border border-slate-200 rounded-2xl hover:border-indigo-400 focus-within:border-indigo-600 focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all overflow-hidden shadow-sm">
                  <textarea
                    className="w-full p-4 bg-transparent border-none focus:ring-0 focus:outline-none resize-none overflow-hidden leading-relaxed text-sm transition-all"
                    placeholder="I was building a side project and realized I had no way to find users..."
                    rows={1}
                    value={originStory}
                    onChange={e => setOriginStory(e.target.value)}
                    maxLength={2000}
                    ref={(el) => {
                      if (el) {
                        const resize = () => {
                          el.style.height = 'auto';
                          el.style.height = el.scrollHeight + 'px';
                        };
                        resize();
                        const observer = new ResizeObserver(resize);
                        observer.observe(el);
                      }
                    }}
                    onInput={e => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = target.scrollHeight + 'px';
                    }}
                  />
                </div>
                <div className="text-[10px] font-medium text-slate-400 text-right pr-2">
                  {originStory.length} / 2000
                </div>
              </div>
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
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const add = () => { 
    if (val.trim()) { 
      setItems([...items, val])
      setVal('') 
      // Reset height after adding
      if (inputRef.current) {
        inputRef.current.style.height = 'auto'
      }
    } 
  }

  return (
    <div className="space-y-2 pt-2">
      <div className="space-y-1">
        {items.map((item, i) => (
          <div key={i} className="group space-y-1">
            <div className="relative bg-white border border-slate-200 rounded-xl hover:border-indigo-400 focus-within:border-indigo-600 focus-within:ring-0 transition-all duration-200 shadow-sm flex items-center min-h-[64px] overflow-hidden">
              <textarea 
                value={item} 
                rows={1}
                className="w-full px-4 py-3 text-sm bg-transparent border-none focus:ring-0 focus:outline-none resize-none overflow-hidden leading-relaxed placeholder:text-slate-400"
                ref={(el) => {
                  if (el) {
                    const resize = () => {
                      el.style.height = 'auto';
                      el.style.height = el.scrollHeight + 'px';
                    };
                    resize();
                    const observer = new ResizeObserver(resize);
                    observer.observe(el);
                  }
                }}
                onChange={e => { 
                  const copy = [...items]; copy[i] = e.target.value; setItems(copy);
                }} 
                maxLength={300}
                onInput={e => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = target.scrollHeight + 'px';
                }}
              />
              <button 
                className="mr-3 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1 shrink-0"
                onClick={() => setItems(items.filter((_, idx) => idx !== i))}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="text-[9px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity text-right pr-2">
              {item.length} / 300
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-1 pt-4 border-t border-slate-100">
        <div className="flex items-start gap-2">
          <textarea 
            ref={inputRef}
            value={val} 
            rows={1}
            onChange={e => setVal(e.target.value)} 
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                add();
              }
            }} 
            onInput={e => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = (target.scrollHeight + 4) + 'px';
            }}
            maxLength={300}
            placeholder={placeholder}
            className="flex-1 p-3 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all resize-none overflow-hidden min-h-[44px] leading-relaxed"
          />
          <Button variant="outline" size="icon" onClick={add} className="h-11 w-11 rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50 shrink-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-[9px] font-bold text-slate-400 text-right pr-14">
          {val.length} / 300
        </div>
      </div>
    </div>
  )
}

function PairEditor({ items, setItems, k1, k2, pl1, pl2 }: { items: any[], setItems: any, k1: string, k2: string, pl1: string, pl2: string }) {
  const add = () => setItems([...items, { [k1]: '', [k2]: '' }])
  return (
    <div className="space-y-6 pt-2">
      {items.map((item, i) => (
        <div key={i} className="group p-6 bg-slate-50/30 border border-slate-200 rounded-3xl relative transition-all hover:bg-white hover:border-slate-300 hover:shadow-sm">
          <button 
            className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1 z-10" 
            onClick={() => setItems(items.filter((_, idx) => idx !== i))}
          >
            <X className="h-4 w-4" />
          </button>
          
          <div className="space-y-5">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">{k1}</label>
              <div className="relative bg-white border border-slate-200 rounded-2xl hover:border-indigo-400 focus-within:border-indigo-600 focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all flex items-center min-h-[56px] overflow-hidden shadow-sm">
                <textarea 
                  value={item[k1]} 
                  rows={1}
                  onChange={e => { const c = [...items]; c[i][k1] = e.target.value; setItems(c) }} 
                  placeholder={pl1} 
                  maxLength={200}
                  className="w-full px-4 py-3 text-sm bg-transparent border-none focus:ring-0 focus:outline-none resize-none overflow-hidden leading-relaxed font-medium"
                  ref={(el) => {
                    if (el) {
                      const resize = () => {
                        el.style.height = 'auto';
                        el.style.height = el.scrollHeight + 'px';
                      };
                      resize();
                      const observer = new ResizeObserver(resize);
                      observer.observe(el);
                    }
                  }}
                  onInput={e => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = target.scrollHeight + 'px';
                  }}
                />
              </div>
              <div className="text-[9px] font-bold text-slate-300 text-right pr-2">
                {item[k1].length} / 200
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">{k2}</label>
              <div className="relative bg-white border border-slate-200 rounded-2xl hover:border-indigo-400 focus-within:border-indigo-600 focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all flex items-center min-h-[56px] overflow-hidden shadow-sm">
                <textarea 
                  value={item[k2]} 
                  rows={1}
                  onChange={e => { const c = [...items]; c[i][k2] = e.target.value; setItems(c) }} 
                  placeholder={pl2} 
                  maxLength={1000}
                  className="w-full px-4 py-3 text-sm bg-transparent border-none focus:ring-0 focus:outline-none resize-none overflow-hidden leading-relaxed" 
                  ref={(el) => {
                    if (el) {
                      const resize = () => {
                        el.style.height = 'auto';
                        el.style.height = el.scrollHeight + 'px';
                      };
                      resize();
                      const observer = new ResizeObserver(resize);
                      observer.observe(el);
                    }
                  }}
                  onInput={e => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = target.scrollHeight + 'px';
                  }}
                />
              </div>
              <div className="text-[9px] font-bold text-slate-300 text-right pr-2">
                {item[k2].length} / 1000
              </div>
            </div>
          </div>
        </div>
      ))}
      <Button variant="outline" className="w-full border-dashed h-12 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all" onClick={add}>
        <Plus className="h-4 w-4 mr-2" /> Add {k1} Pair
      </Button>
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
              <td className="px-1 py-1 align-top">
                <textarea 
                  value={f.feature} 
                  onChange={(e) => { const nc = [...factors]; nc[i].feature = e.target.value; setFactors(nc) }} 
                  rows={1}
                  placeholder="Factor..."
                  className="w-full px-2 py-2 text-xs bg-transparent border-none focus:ring-0 focus:outline-none resize-none overflow-hidden leading-relaxed font-semibold italic"
                  ref={(el) => {
                    if (el) {
                      const resize = () => { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; };
                      resize();
                      const observer = new ResizeObserver(resize); observer.observe(el);
                    }
                  }}
                  onInput={e => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto'; target.style.height = target.scrollHeight + 'px';
                  }}
                />
              </td>
              {competitors.map((c, j) => (
                <td key={j} className="px-1 py-1 align-top">
                  <textarea 
                    value={f.comps[c] || ''} 
                    onChange={(e) => { const nc = [...factors]; nc[i].comps[c] = e.target.value; setFactors(nc) }} 
                    rows={1}
                    placeholder="..."
                    className="w-full px-2 py-2 text-xs bg-transparent border-none focus:ring-0 focus:outline-none resize-none overflow-hidden leading-relaxed text-slate-500"
                    ref={(el) => {
                      if (el) {
                        const resize = () => { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; };
                        resize();
                        const observer = new ResizeObserver(resize); observer.observe(el);
                      }
                    }}
                    onInput={e => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto'; target.style.height = target.scrollHeight + 'px';
                    }}
                  />
                </td>
              ))}
              <td className="px-1 py-1 align-top bg-indigo-50/30">
                <textarea 
                  value={f.yours} 
                  onChange={(e) => { const nc = [...factors]; nc[i].yours = e.target.value; setFactors(nc) }} 
                  rows={1}
                  placeholder="..."
                  className="w-full px-2 py-2 text-xs bg-transparent border-none focus:ring-0 focus:outline-none resize-none overflow-hidden leading-relaxed font-bold text-indigo-900"
                  ref={(el) => {
                    if (el) {
                      const resize = () => { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; };
                      resize();
                      const observer = new ResizeObserver(resize); observer.observe(el);
                    }
                  }}
                  onInput={e => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto'; target.style.height = target.scrollHeight + 'px';
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Button variant="outline" size="sm" onClick={addFactor}><Plus className="h-4 w-4 mr-2" /> Add Factor Row</Button>
    </div>
  )
}

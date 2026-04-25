'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = [
  {
    id: 1,
    title: 'Brand Entity',
    question: 'Define your brand in one clear sentence.',
    desc: 'This is the most important signal for AI identity. Help LLMs instantly understand who you are, who you serve, and what makes you different.'
  },
  { id: 2, title: 'Ideal Customers', question: 'Who are your ideal customers?', desc: "Review and refine your target audience. Be specific — the more precise, the better AI can match you to the right queries." },
  { id: 3, title: 'Problems & Solutions', question: 'What specific problems do you solve?', desc: "The #1 signal AI uses to match your product to user queries. Be concrete about the pain and your fix." },
  { id: 4, title: 'Common Q&A', question: 'What questions do customers frequently ask?', desc: "FAQ-style content is the most directly cited format in AI-generated answers. These become citable assets." },
  { id: 5, title: 'Key Use Cases', question: 'What are the main use cases?', desc: "Concrete use cases help AI accurately match you to 'Best X for Y' queries across ChatGPT, Perplexity, and Claude." },
  {
    id: 6,
    title: 'Trust & Authority',
    question: 'What proof makes you credible and citable?',
    desc: "AI applies E-E-A-T signals before recommending a product. Testimonials, key metrics, notable customers, and press mentions all improve citation rates."
  },
  {
    id: 7,
    title: 'Competitor Matrix',
    question: 'How do you stack up against alternatives?',
    desc: "AI analyzes your full profile to identify true alternatives and build a sharp competitive positioning matrix."
  }
]

export default function QaWizard({ initialGeo, projectName, onComplete }: { initialGeo: any, projectName: string, onComplete: (data: any) => void }) {
  const [currentStepId, setCurrentStepId] = useState(1)
  const currentStep = STEPS.find(s => s.id === currentStepId)!
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Step 1: Brand Entity (replaces Origin Story)
  const [brandDefinition, setBrandDefinition] = useState(initialGeo?.brandDefinition || '')
  // Step 2-5: existing fields
  const [idealCustomers, setIdealCustomers] = useState<string[]>(initialGeo?.idealCustomers || [])
  const [problemSolutions, setProblemSolutions] = useState<{ problem: string, solution: string }[]>(initialGeo?.problemSolutions || [])
  const [faqs, setFaqs] = useState<{ question: string, answer: string }[]>(initialGeo?.faqs || [])
  const [useCases, setUseCases] = useState<string[]>(initialGeo?.useCases || [])
  // Step 6: Trust & Authority (new)
  const [trustSignals, setTrustSignals] = useState<{ type: string, content: string }[]>([])
  // Target prompts: now auto-generated at step 1 (from generate-initial-geo), no longer a UI step
  const targetPrompts: string[] = initialGeo?.targetPrompts || []
  // Step 7: Competitor Matrix
  const [competitors, setCompetitors] = useState<string[]>(initialGeo?.competitors || [])
  const [matrixFactors, setMatrixFactors] = useState<{ feature: string, yours: string, comps: Record<string, string> }[]>([
    { feature: 'Pricing / Business Model', yours: '', comps: {} },
    { feature: 'Core Differentiator', yours: '', comps: {} }
  ])

  const [isSynthesizing, setIsSynthesizing] = useState(false)
  const [hasSynthesized, setHasSynthesized] = useState(false)

  async function handleNext() {
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0

    if (currentStepId === 6) {
      // Step 6 → 7: Trigger deep context competitor synthesis
      setCurrentStepId(7)
      if (!hasSynthesized) {
        setIsSynthesizing(true)
        try {
          const res = await fetch('/api/scan-and-synthesize-competitors', {
            method: 'POST',
            body: JSON.stringify({ brandDefinition, idealCustomers, problemSolutions, faqs, useCases, trustSignals, targetPrompts })
          })
          const data = await res.json()
          if (data.competitors && data.factors) {
            setCompetitors(data.competitors)
            setMatrixFactors(data.factors)
            setHasSynthesized(true)
          }
        } catch (e) { console.error(e) }
        setIsSynthesizing(false)
      }
    } else if (currentStepId < 7) {
      setCurrentStepId(currentStepId + 1)
    } else {
      onComplete({ brandDefinition, idealCustomers, problemSolutions, faqs, useCases, trustSignals, targetPrompts, competitors, matrixFactors })
    }
  }

  function handleBack() {
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0
    if (currentStepId > 1) setCurrentStepId(currentStepId - 1)
  }

  return (
    <div className={cn("space-y-6 mx-auto py-2 w-full transition-all duration-500", currentStepId === 7 ? "max-w-5xl lg:max-w-6xl" : "max-w-2xl")}>
      <div className="mb-4 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-500">Step {currentStepId} of 7</span>
          <span className="text-sm font-medium text-brand-600">{currentStep.title}</span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-600 transition-all duration-300 ease-in-out"
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
        className={cn(
          "overflow-y-auto custom-scrollbar pr-2 pb-4 transition-all duration-500",
          currentStepId === 7 ? "min-h-[400px] max-h-[600px]" : "min-h-[300px] max-h-[380px]"
        )}
      >
        {isSynthesizing && currentStepId === 7 && (
          <div className="flex flex-col items-center justify-center h-64 space-y-6 text-center px-4">
            <div className="relative">
              <Loader2 className="h-10 w-10 animate-spin text-brand-600" />
              <div className="absolute inset-0 h-10 w-10 bg-brand-600/10 rounded-full blur-xl animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <p className="text-lg font-semibold text-slate-900">Analyzing Market Positioning...</p>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                We're analyzing your unique product context to identify true alternatives and extract sharp competitive advantages.
              </p>
            </div>
          </div>
        )}

        {!isSynthesizing && (
          <>
            {currentStepId === 1 && <BrandEntityEditor value={brandDefinition} onChange={setBrandDefinition} />}
            {currentStepId === 2 && <ListEditor items={idealCustomers} setItems={setIdealCustomers} placeholder="E.g. Solo founders building SaaS products" />}
            {currentStepId === 3 && <PairEditor items={problemSolutions} setItems={setProblemSolutions} k1="problem" k2="solution" pl1="The Problem..." pl2="How we solve it..." />}
            {currentStepId === 4 && <PairEditor items={faqs} setItems={setFaqs} k1="question" k2="answer" pl1="Question..." pl2="Answer..." />}
            {currentStepId === 5 && <ListEditor items={useCases} setItems={setUseCases} placeholder="E.g. Automating user research analysis" />}
            {currentStepId === 6 && <TrustEditor items={trustSignals} setItems={setTrustSignals} />}
            {currentStepId === 7 && (
              <CompetitorMatrix
                competitors={competitors}
                factors={matrixFactors}
                setFactors={setMatrixFactors}
                projectName={projectName}
              />
            )}
          </>
        )}
      </div>

      <div className="flex justify-between pt-6 border-t">
        <Button variant="ghost" onClick={handleBack} disabled={currentStepId === 1 || isSynthesizing}>
          Back
        </Button>
        <div className="flex gap-2">
          {currentStepId === 6 && (
            <Button variant="ghost" onClick={handleNext} className="text-slate-400 hover:text-slate-600">
              Skip this step
            </Button>
          )}
          <Button onClick={handleNext} className="bg-brand-600 hover:bg-brand-700" disabled={isSynthesizing}>
            {currentStepId === 7 ? 'Generate GEO Files' : 'Next Step'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Brand Entity Editor ──────────────────────────────────────────────────────

function BrandEntityEditor({ value, onChange }: { value: string, onChange: (v: string) => void }) {
  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-1">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Format Guide</p>
        <div className="p-3 bg-brand-50 border border-brand-100 rounded-xl text-xs text-brand-800 leading-relaxed">
          <span className="font-bold">[Product]</span> is a <span className="font-bold">[category]</span> that helps{' '}
          <span className="font-bold">[target audience]</span> solve{' '}
          <span className="font-bold">[specific problem]</span> by{' '}
          <span className="font-bold">[unique approach / differentiator]</span>.
        </div>
      </div>
      <div className="space-y-1">
        <div className="relative bg-white border border-slate-200 rounded-2xl hover:border-brand-400 focus-within:border-brand-600 focus-within:ring-4 focus-within:ring-brand-500/5 transition-all overflow-hidden shadow-sm">
          <textarea
            className="w-full p-4 bg-transparent border-none focus:ring-0 focus:outline-none resize-none overflow-hidden leading-relaxed text-sm transition-all"
            placeholder="E.g. Genkle.ai is an AI writing coach that helps non-native English speakers communicate with confidence by providing real-time, context-aware feedback on tone and clarity."
            rows={3}
            value={value}
            onChange={e => onChange(e.target.value)}
            maxLength={500}
            ref={(el) => {
              if (el) {
                const resize = () => { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }
                resize()
                const observer = new ResizeObserver(resize)
                observer.observe(el)
              }
            }}
            onInput={e => {
              const target = e.target as HTMLTextAreaElement
              target.style.height = 'auto'
              target.style.height = target.scrollHeight + 'px'
            }}
          />
        </div>
        <div className="text-[10px] font-medium text-slate-400 text-right pr-2">
          {value.length} / 500
        </div>
      </div>
    </div>
  )
}

// ── Trust & Authority Editor ─────────────────────────────────────────────────

const TRUST_TYPES = ['Testimonial', 'Key Metric', 'Notable Customer', 'Press / Award']

function TrustEditor({ items, setItems }: { items: { type: string, content: string }[], setItems: any }) {
  const add = () => setItems([...items, { type: 'Testimonial', content: '' }])

  return (
    <div className="space-y-4 pt-2">
      {items.length === 0 && (
        <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl">
          <p className="text-sm font-medium text-slate-400">No proof points yet</p>
          <p className="text-xs text-slate-300 mt-1">Add testimonials, metrics, notable customers, or press mentions</p>
        </div>
      )}
      {items.map((item, i) => (
        <div key={i} className="group p-5 bg-slate-50/30 border border-slate-200 rounded-2xl relative transition-all hover:bg-white hover:border-slate-300 hover:shadow-sm">
          <button
            className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1 z-10"
            onClick={() => setItems(items.filter((_: any, idx: number) => idx !== i))}
          >
            <X className="h-4 w-4" />
          </button>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Type</label>
              <div className="flex flex-wrap gap-2">
                {TRUST_TYPES.map(type => (
                  <button
                    key={type}
                    onClick={() => { const c = [...items]; c[i].type = type; setItems(c) }}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                      item.type === type
                        ? "bg-brand-600 text-white border-brand-600"
                        : "bg-white text-slate-500 border-slate-200 hover:border-brand-300 hover:text-brand-600"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Content</label>
              <div className="relative bg-white border border-slate-200 rounded-xl hover:border-brand-400 focus-within:border-brand-600 focus-within:ring-4 focus-within:ring-brand-500/5 transition-all overflow-hidden shadow-sm">
                <textarea
                  value={item.content}
                  rows={2}
                  onChange={e => { const c = [...items]; c[i].content = e.target.value; setItems(c) }}
                  placeholder={
                    item.type === 'Testimonial' ? '"This saved us 10 hours a week." — Jane Doe, PM at Stripe' :
                    item.type === 'Key Metric' ? 'E.g. 500% average ROI in 30 days, 10,000+ active users' :
                    item.type === 'Notable Customer' ? 'E.g. Used by teams at Notion, Linear, and Vercel' :
                    'E.g. Featured in TechCrunch, Product Hunt #1 of the Day'
                  }
                  maxLength={500}
                  className="w-full px-4 py-3 text-sm bg-transparent border-none focus:ring-0 focus:outline-none resize-none overflow-hidden leading-relaxed"
                  ref={(el) => {
                    if (el) {
                      const resize = () => { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }
                      resize()
                      const observer = new ResizeObserver(resize)
                      observer.observe(el)
                    }
                  }}
                  onInput={e => {
                    const target = e.target as HTMLTextAreaElement
                    target.style.height = 'auto'; target.style.height = target.scrollHeight + 'px'
                  }}
                />
              </div>
              <div className="text-[9px] font-bold text-slate-300 text-right pr-2">{item.content.length} / 500</div>
            </div>
          </div>
        </div>
      ))}
      <Button variant="outline" className="w-full border-dashed h-12 rounded-xl text-slate-500 hover:text-brand-600 hover:bg-brand-50 hover:border-brand-200 transition-all" onClick={add}>
        <Plus className="h-4 w-4 mr-2" /> Add Proof Point
      </Button>
    </div>
  )
}

// ── List Editor ──────────────────────────────────────────────────────────────

function ListEditor({ items, setItems, placeholder }: { items: string[], setItems: any, placeholder: string }) {
  const [val, setVal] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const add = () => {
    if (val.trim()) {
      setItems([...items, val])
      setVal('')
      if (inputRef.current) inputRef.current.style.height = 'auto'
    }
  }

  return (
    <div className="space-y-2 pt-2">
      <div className="space-y-1">
        {items.map((item, i) => (
          <div key={i} className="group space-y-1">
            <div className="relative bg-white border border-slate-200 rounded-xl hover:border-brand-400 focus-within:border-brand-600 focus-within:ring-0 transition-all duration-200 shadow-sm flex items-center min-h-[64px] overflow-hidden">
              <textarea
                value={item}
                rows={1}
                className="w-full px-4 py-3 text-sm bg-transparent border-none focus:ring-0 focus:outline-none resize-none overflow-hidden leading-relaxed placeholder:text-slate-400"
                ref={(el) => {
                  if (el) {
                    const resize = () => { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }
                    resize()
                    const observer = new ResizeObserver(resize)
                    observer.observe(el)
                  }
                }}
                onChange={e => { const copy = [...items]; copy[i] = e.target.value; setItems(copy) }}
                maxLength={300}
                onInput={e => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = 'auto'; target.style.height = target.scrollHeight + 'px'
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
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); add() } }}
            onInput={e => {
              const target = e.target as HTMLTextAreaElement
              target.style.height = 'auto'; target.style.height = (target.scrollHeight + 4) + 'px'
            }}
            maxLength={300}
            placeholder={placeholder}
            className="flex-1 p-3 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-brand-500/10 focus:border-brand-400 transition-all resize-none overflow-hidden min-h-[44px] leading-relaxed"
          />
          <Button variant="outline" size="icon" onClick={add} className="h-11 w-11 rounded-xl border-brand-200 text-brand-600 hover:bg-brand-50 shrink-0">
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

// ── Pair Editor ──────────────────────────────────────────────────────────────

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
              <div className="relative bg-white border border-slate-200 rounded-2xl hover:border-brand-400 focus-within:border-brand-600 focus-within:ring-4 focus-within:ring-brand-500/5 transition-all flex items-center min-h-[56px] overflow-hidden shadow-sm">
                <textarea
                  value={item[k1]}
                  rows={1}
                  onChange={e => { const c = [...items]; c[i][k1] = e.target.value; setItems(c) }}
                  placeholder={pl1}
                  maxLength={200}
                  className="w-full px-4 py-3 text-sm bg-transparent border-none focus:ring-0 focus:outline-none resize-none overflow-hidden leading-relaxed font-medium"
                  ref={(el) => {
                    if (el) {
                      const resize = () => { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }
                      resize()
                      const observer = new ResizeObserver(resize)
                      observer.observe(el)
                    }
                  }}
                  onInput={e => {
                    const target = e.target as HTMLTextAreaElement
                    target.style.height = 'auto'; target.style.height = target.scrollHeight + 'px'
                  }}
                />
              </div>
              <div className="text-[9px] font-bold text-slate-300 text-right pr-2">{item[k1].length} / 200</div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">{k2}</label>
              <div className="relative bg-white border border-slate-200 rounded-2xl hover:border-brand-400 focus-within:border-brand-600 focus-within:ring-4 focus-within:ring-brand-500/5 transition-all flex items-center min-h-[56px] overflow-hidden shadow-sm">
                <textarea
                  value={item[k2]}
                  rows={1}
                  onChange={e => { const c = [...items]; c[i][k2] = e.target.value; setItems(c) }}
                  placeholder={pl2}
                  maxLength={1000}
                  className="w-full px-4 py-3 text-sm bg-transparent border-none focus:ring-0 focus:outline-none resize-none overflow-hidden leading-relaxed"
                  ref={(el) => {
                    if (el) {
                      const resize = () => { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }
                      resize()
                      const observer = new ResizeObserver(resize)
                      observer.observe(el)
                    }
                  }}
                  onInput={e => {
                    const target = e.target as HTMLTextAreaElement
                    target.style.height = 'auto'; target.style.height = target.scrollHeight + 'px'
                  }}
                />
              </div>
              <div className="text-[9px] font-bold text-slate-300 text-right pr-2">{item[k2].length} / 1000</div>
            </div>
          </div>
        </div>
      ))}
      <Button variant="outline" className="w-full border-dashed h-12 rounded-xl text-slate-500 hover:text-brand-600 hover:bg-brand-50 hover:border-brand-200 transition-all" onClick={add}>
        <Plus className="h-4 w-4 mr-2" /> Add {k1} Pair
      </Button>
    </div>
  )
}

// ── Competitor Matrix ────────────────────────────────────────────────────────

function CompetitorMatrix({ competitors, factors, setFactors, projectName }: { competitors: string[], factors: any[], setFactors: any, projectName: string }) {
  const addFactor = () => setFactors([...factors, { feature: '', yours: '', comps: {} }])
  const removeFactor = (index: number) => setFactors(factors.filter((_: any, i: number) => i !== index))

  return (
    <div className="space-y-4 pt-4 overflow-x-auto">
      <table className="w-full text-sm text-left border rounded-md overflow-hidden shadow-sm">
        <thead className="bg-slate-100 border-b border-slate-200">
          <tr>
            <th className="px-3 py-3 font-semibold min-w-[150px]">Factor / Feature</th>
            <th className="px-3 py-3 font-bold text-brand-700 bg-brand-50 min-w-[150px]">{projectName || 'You'}</th>
            {competitors.map((c, i) => <th key={i} className="px-3 py-3 font-semibold text-slate-500 min-w-[150px]">{c}</th>)}
            <th className="px-3 py-3 w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {factors.map((f, i) => (
            <tr key={i} className="hover:bg-slate-50/50 group/row">
              <td className="px-1 py-1 align-top">
                <textarea
                  value={f.feature}
                  onChange={(e) => { const nc = [...factors]; nc[i].feature = e.target.value; setFactors(nc) }}
                  rows={1}
                  placeholder="Factor..."
                  className="w-full px-2 py-2 text-xs bg-transparent border-none focus:ring-0 focus:outline-none resize-none overflow-hidden leading-relaxed font-semibold italic"
                  ref={(el) => {
                    if (el) {
                      const resize = () => { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }
                      resize()
                      const observer = new ResizeObserver(resize); observer.observe(el)
                    }
                  }}
                  onInput={e => {
                    const target = e.target as HTMLTextAreaElement
                    target.style.height = 'auto'; target.style.height = target.scrollHeight + 'px'
                  }}
                />
              </td>
              <td className="px-1 py-1 align-top bg-brand-50/30">
                <textarea
                  value={f.yours}
                  onChange={(e) => { const nc = [...factors]; nc[i].yours = e.target.value; setFactors(nc) }}
                  rows={1}
                  placeholder="..."
                  className="w-full px-2 py-2 text-xs bg-transparent border-none focus:ring-0 focus:outline-none resize-none overflow-hidden leading-relaxed font-bold text-brand-900"
                  ref={(el) => {
                    if (el) {
                      const resize = () => { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }
                      resize()
                      const observer = new ResizeObserver(resize); observer.observe(el)
                    }
                  }}
                  onInput={e => {
                    const target = e.target as HTMLTextAreaElement
                    target.style.height = 'auto'; target.style.height = target.scrollHeight + 'px'
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
                        const resize = () => { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }
                        resize()
                        const observer = new ResizeObserver(resize); observer.observe(el)
                      }
                    }}
                    onInput={e => {
                      const target = e.target as HTMLTextAreaElement
                      target.style.height = 'auto'; target.style.height = target.scrollHeight + 'px'
                    }}
                  />
                </td>
              ))}
              <td className="px-2 py-2 align-middle text-right">
                <button
                  onClick={() => removeFactor(i)}
                  className="p-1 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover/row:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Button variant="outline" size="sm" onClick={addFactor}><Plus className="h-4 w-4 mr-2" /> Add Factor Row</Button>
    </div>
  )
}

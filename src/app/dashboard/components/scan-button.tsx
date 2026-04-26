'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2, Radio, CheckCircle2, AlertCircle } from 'lucide-react'

type ScanState = 'idle' | 'scanning' | 'done' | 'error'

export default function ScanButton({ projectId }: { projectId: string }) {
  const router = useRouter()
  const [state, setState] = useState<ScanState>('idle')
  const [result, setResult] = useState<{ newDrafts: number; keywordsScanned: number; dbErrors?: string[] } | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleScan() {
    setState('scanning')
    setResult(null)
    setErrorMsg(null)
    try {
      const res = await fetch('/api/scan-reddit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setResult({ newDrafts: data.newDrafts, keywordsScanned: data.keywordsScanned, dbErrors: data.errors })
        setState('done')
        router.refresh()
      } else {
        setErrorMsg(data.error ?? 'Scan failed')
        setState('error')
      }
    } catch {
      setErrorMsg('Network error')
      setState('error')
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={handleScan}
        disabled={state === 'scanning'}
        className="gap-2 bg-brand-600 hover:bg-brand-700 text-white"
      >
        {state === 'scanning' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Radio className="h-4 w-4" />
        )}
        {state === 'scanning' ? 'Scanning Reddit…' : 'Scan Reddit Now'}
      </Button>

      {state === 'done' && result && (
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1.5 text-sm text-success-700 font-medium">
            <CheckCircle2 className="h-4 w-4" />
            {result.newDrafts > 0
              ? `${result.newDrafts} new draft${result.newDrafts > 1 ? 's' : ''} from ${result.keywordsScanned} keywords`
              : `Scanned ${result.keywordsScanned} keywords — no new posts`}
          </span>
          {result.dbErrors && result.dbErrors.length > 0 && (
            <span className="text-xs text-destructive font-mono">{result.dbErrors[0]}</span>
          )}
        </div>
      )}

      {state === 'error' && errorMsg && (
        <span className="flex items-center gap-1.5 text-sm text-destructive font-medium">
          <AlertCircle className="h-4 w-4" />
          {errorMsg}
        </span>
      )}
    </div>
  )
}

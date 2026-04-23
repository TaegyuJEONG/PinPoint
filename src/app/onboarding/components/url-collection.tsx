'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function UrlCollection({ onComplete, initialGithub }: { onComplete: (urls: any) => void, initialGithub?: string }) {
  const [urls, setUrls] = useState({
    website: '',
    github: initialGithub || '',
    docs: '',
    pricing: '',
    api: ''
  })
  
  function handleSubmit() {
    onComplete(urls)
  }

  return (
    <div className="space-y-6 max-w-md mx-auto py-4">
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-2xl font-bold">Product URLs</h2>
        <p className="text-muted-foreground text-sm">Where can people learn more? We'll use these to generate your resource index (llms.txt) for AI agents.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="website">Website <span className="text-red-500">*</span></Label>
          <Input id="website" placeholder="https://yourproduct.com" value={urls.website} onChange={e => setUrls({...urls, website: e.target.value})} />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="github">GitHub Repository <span className="text-red-500">*</span></Label>
          <Input id="github" placeholder="https://github.com/user/repo" value={urls.github} onChange={e => setUrls({...urls, github: e.target.value})} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="docs">Documentation</Label>
          <Input id="docs" placeholder="https://yourproduct.com/docs" value={urls.docs} onChange={e => setUrls({...urls, docs: e.target.value})} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pricing">Pricing Page</Label>
          <Input id="pricing" placeholder="https://yourproduct.com/pricing" value={urls.pricing} onChange={e => setUrls({...urls, pricing: e.target.value})} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="api">API Reference</Label>
          <Input id="api" placeholder="https://yourproduct.com/api" value={urls.api} onChange={e => setUrls({...urls, api: e.target.value})} />
        </div>

        <Button 
          onClick={handleSubmit} 
          disabled={!urls.website || !urls.github} 
          className="w-full mt-6 font-medium"
        >
          Save & Proceed to Q&A
        </Button>
      </div>
    </div>
  )
}

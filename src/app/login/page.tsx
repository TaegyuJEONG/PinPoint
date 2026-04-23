import { signInWithGithub } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Target } from 'lucide-react'
import Link from 'next/link'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const resolvedParams = await searchParams
  
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-slate-50">
      <div className="hidden md:flex flex-col justify-center items-center bg-indigo-600 text-white p-12">
        <div className="max-w-md space-y-6">
          <Link href="/" className="inline-flex items-center space-x-2 font-bold text-2xl">
            <Target className="h-8 w-8 text-white" />
            <span>PinPoint</span>
          </Link>
          <h1 className="text-4xl font-bold tracking-tight">Focus on Building. We handle the outreach.</h1>
          <p className="text-indigo-100 text-lg">
            Connect your GitHub repository, and we'll instantly generate your target audience and community outreach strategy directly from your codebase.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-8">
        <Card className="w-full max-w-md shadow-lg border-slate-200 bg-white">
          <CardHeader className="space-y-2 text-center pb-6">
            <div className="flex justify-center mb-4 md:hidden">
              <Link href="/" className="inline-flex items-center space-x-2 font-bold text-xl text-slate-800">
                <Target className="h-6 w-6 text-indigo-600" />
                <span>PinPoint</span>
              </Link>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">Welcome Builder</CardTitle>
            <CardDescription className="text-slate-500">
              PinPoint needs access to your GitHub repositories to analyze your project.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <AuthError params={resolvedParams} />

            <form action={signInWithGithub}>
              <Button type="submit" size="lg" className="w-full bg-[#24292F] hover:bg-[#24292F]/90 text-white font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]">
                <svg className="mr-3 h-5 w-5" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                Continue with GitHub
              </Button>
            </form>
            <p className="text-center text-xs text-slate-500 max-w-xs mx-auto">
              We only use your repository access to extract project details and generate documentation.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function AuthError({ params }: { params: { error?: string } }) {
  if (!params.error) return null

  return (
    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm font-medium">
      {params.error}
    </div>
  )
}

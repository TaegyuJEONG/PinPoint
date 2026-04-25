import Link from 'next/link'
import { Button, buttonVariants } from '@/components/ui/button'
import { ArrowRight, Target, Users, Zap } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b backdrop-blur-md sticky top-0 z-50 bg-white/80">
        <Link className="flex items-center justify-center" href="/">
          <Target className="h-6 w-6 text-brand-600" />
          <span className="ml-2 text-xl font-bold tracking-tight">PinPoint</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4 mt-2" href="#features">
            Features
          </Link>
          <Link className={buttonVariants({ variant: 'ghost', size: 'sm' })} href="/login">
            Sign In
          </Link>
          <Link href="/login" className={buttonVariants({ size: 'sm', className: 'bg-brand-600 hover:bg-brand-700' })}>
            Get Started
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-linear-to-b from-white to-slate-50">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none bg-clip-text text-transparent bg-linear-to-r from-brand-600 to-brand-400">
                  Find your first 100 paying users
                </h1>
                <p className="mx-auto max-w-[700px] text-slate-500 md:text-xl dark:text-slate-400">
                  Authentic, pinpointed outreach at scale. Convert Reddit leads into loyal customers using AI that sounds human.
                </p>
              </div>
              <div className="space-x-4">
                <Link href="/login" className={buttonVariants({ size: 'lg', className: 'bg-brand-600 hover:bg-brand-700 px-8 py-6 text-lg' })}>
                    Start Your 14-Day Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-12 lg:grid-cols-3">
              <div className="flex flex-col items-center space-y-4 text-center p-6 rounded-2xl bg-white shadow-xs border border-slate-100 hover:shadow-md transition-shadow">
                <div className="p-3 bg-brand-100 rounded-full">
                  <Target className="h-8 w-8 text-brand-600" />
                </div>
                <h3 className="text-xl font-bold">Pinpointed Accuracy</h3>
                <p className="text-slate-500">
                  Our LLM filter ensures you only see posts where the author is a genuine potential user, not noise.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center p-6 rounded-2xl bg-white shadow-xs border border-slate-100 hover:shadow-md transition-shadow">
                <div className="p-3 bg-brand-100 rounded-full">
                  <Zap className="h-8 w-8 text-brand-600" />
                </div>
                <h3 className="text-xl font-bold">Authentic Engagement</h3>
                <p className="text-slate-500">
                  AI-drafted comments grounded in your project brief. They open with value and end with your product.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center p-6 rounded-2xl bg-white shadow-xs border border-slate-100 hover:shadow-md transition-shadow">
                <div className="p-3 bg-brand-100 rounded-full">
                  <Users className="h-8 w-8 text-brand-600" />
                </div>
                <h3 className="text-xl font-bold">Human-in-the-loop</h3>
                <p className="text-slate-500">
                  Review every draft from your dashboard. Edit, confirm, or reject. You stay in control of your reputation.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-slate-500 dark:text-slate-400">© 2026 PinPoint Inc. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  )
}

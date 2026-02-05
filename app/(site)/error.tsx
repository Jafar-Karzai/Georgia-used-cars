'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { SiteNavbar } from '@/components/layout/site-navbar'
import { SiteFooter } from '@/components/layout/site-footer'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Error boundary for the homepage
 * Displays a user-friendly error message and recovery options
 */
export default function HomePageError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log errors in development only
    if (process.env.NODE_ENV === 'development') {
      console.error('Homepage error:', error)
    }
    // TODO: In production, send to error reporting service (Sentry, etc.)
  }, [error])

  return (
    <div className="min-h-screen bg-background bg-pattern flex flex-col">
      <SiteNavbar />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center">
          {/* Error Icon */}
          <div className="w-20 h-20 rounded-full bg-action-100 text-action-600 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10" />
          </div>

          {/* Error Message */}
          <h1 className="text-2xl font-extrabold tracking-tight mb-3">
            Something went wrong
          </h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            We had trouble loading the homepage. This is usually temporary.
            Please try again or browse our inventory directly.
          </p>

          {/* Error Details (dev only) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-8 p-4 rounded-lg bg-muted/50 text-left">
              <p className="text-xs font-mono text-muted-foreground break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs font-mono text-muted-foreground mt-2">
                  Digest: {error.digest}
                </p>
              )}
            </div>
          )}

          {/* Recovery Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={reset} className="btn-precision">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button asChild variant="outline">
              <Link href="/inventory">
                <Home className="w-4 h-4 mr-2" />
                Browse Inventory
              </Link>
            </Button>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}

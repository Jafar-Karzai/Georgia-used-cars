import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/lib/auth/context'
import './globals.css'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Wrench } from 'lucide-react'
import { SiteFooter } from '@/components/layout/site-footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Georgia Used Cars - Premium Salvage Vehicles',
  description: 'Your trusted source for quality salvage vehicles imported from US and Canada auctions. Browse our inventory of cars, trucks, and SUVs in Sharjah, UAE.',
  keywords: 'used cars, salvage cars, UAE, Sharjah, Copart, IAAI, imported vehicles',
  authors: [{ name: 'Georgia Used Cars' }],
  creator: 'Georgia Used Cars',
  publisher: 'Georgia Used Cars',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://georgiaused.com',
    siteName: 'Georgia Used Cars',
    title: 'Georgia Used Cars - Premium Salvage Vehicles',
    description: 'Your trusted source for quality salvage vehicles imported from US and Canada auctions.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Georgia Used Cars - Premium Salvage Vehicles',
    description: 'Your trusted source for quality salvage vehicles imported from US and Canada auctions.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <div className="relative flex min-h-screen flex-col">
            {/* Global Under-Construction Banner */}
            <div className="border-b bg-primary/5">
              <div className="container mx-auto px-4 py-2">
                <Alert className="border-primary/30 bg-primary/5">
                  <Wrench className="h-4 w-4" />
                  <AlertTitle className="text-sm">Under Construction</AlertTitle>
                  <AlertDescription className="text-xs text-muted-foreground">
                    We’re actively building and refining the experience. Some features may be incomplete.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
            <main className="flex-1">
              {children}
            </main>
            <SiteFooter />
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}

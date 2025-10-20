import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/lib/auth/context'
import './globals.css'
// Root layout only provides global providers; per-area UI lives in route groups

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
            <main className="flex-1">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}

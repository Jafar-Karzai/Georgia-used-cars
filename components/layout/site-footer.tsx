'use client'

import Link from 'next/link'
import { Logo } from '@/components/ui/logo'

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/50 py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <Logo variant="compact" className="mb-4" />
            <p className="text-muted-foreground text-sm">
              Premium salvage vehicles imported from US and Canada auctions. Your trusted partner in Sharjah, UAE.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <div className="space-y-2 text-sm">
              <Link href="/" className="block text-muted-foreground hover:text-foreground transition-colors">Home</Link>
              <Link href="/inventory" className="block text-muted-foreground hover:text-foreground transition-colors">Inventory</Link>
              <Link href="/about" className="block text-muted-foreground hover:text-foreground transition-colors">About</Link>
              <Link href="/contact" className="block text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Services</h4>
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">Vehicle Import</p>
              <p className="text-muted-foreground">Auction Bidding</p>
              <p className="text-muted-foreground">Inspection Services</p>
              <p className="text-muted-foreground">Documentation</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact Info</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>+971 52 244 8485</p>
              <p>info@georgiaused.com</p>
              <p>Sharjah, UAE</p>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 Georgia Used Cars. All rights reserved.</p>
          <p className="mt-2">
            Developed by <span className="font-medium text-foreground">Jafar Karzai</span>
          </p>
        </div>
      </div>
    </footer>
  )
}


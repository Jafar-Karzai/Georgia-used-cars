'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Logo } from '@/components/ui/logo'
import { Menu, Search, Phone } from 'lucide-react'

export function SiteNavbar() {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Logo href="/" />

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-foreground/80 hover:text-foreground transition-colors">Home</Link>
          <Link href="/inventory" className="text-foreground/80 hover:text-foreground transition-colors">Inventory</Link>
          <Link href="/about" className="text-foreground/80 hover:text-foreground transition-colors">About</Link>
          <Link href="/contact" className="text-foreground/80 hover:text-foreground transition-colors">Contact</Link>
        </div>

        {/* Desktop actions */}
        <div className="hidden sm:flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/inventory">
              <Search className="h-4 w-4 mr-2" />
              Browse Cars
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/contact">
              Contact Us
            </Link>
          </Button>
        </div>

        {/* Mobile menu */}
        <div className="flex sm:hidden items-center gap-1">
          <Button asChild variant="ghost" size="icon" aria-label="Contact">
            <Link href="/contact">
              <Phone className="h-5 w-5" />
            </Link>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="text-left">
                  <Logo href="/" />
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-2">
                <Link href="/" className="block py-2 text-foreground/90 hover:text-foreground">Home</Link>
                <Link href="/inventory" className="block py-2 text-foreground/90 hover:text-foreground">Inventory</Link>
                <Link href="/about" className="block py-2 text-foreground/90 hover:text-foreground">About</Link>
                <Link href="/contact" className="block py-2 text-foreground/90 hover:text-foreground">Contact</Link>
              </div>
              <div className="mt-6 grid grid-cols-1 gap-2">
                <Button asChild variant="outline">
                  <Link href="/inventory">
                    <Search className="h-4 w-4 mr-2" />
                    Browse Cars
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/contact">Contact Us</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}


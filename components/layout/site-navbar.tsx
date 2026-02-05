'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Logo } from '@/components/ui/logo'
import { Menu, Search, Phone, User, LogOut, LayoutDashboard, LogIn } from 'lucide-react'

export function SiteNavbar() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mockAuth = localStorage.getItem('mockAuth')
      const userStr = localStorage.getItem('mockUser')
      setIsAuthenticated(mockAuth === 'true')
      if (userStr) {
        const user = JSON.parse(userStr)
        setUserName(user.name || 'User')
      }
    }
  }, [])

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mockAuth')
      localStorage.removeItem('mockUser')
    }
    setIsAuthenticated(false)
    router.push('/')
  }

  return (
    <nav className="frosted-panel border-b sticky top-0 z-50">
      <div className="max-w-content mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
        <Logo href="/" />

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold uppercase tracking-wider">
          <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">Home</Link>
          <Link href="/inventory" className="text-muted-foreground hover:text-primary transition-colors">Inventory</Link>
          <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">About</Link>
          <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</Link>
        </div>

        {/* Desktop actions */}
        <div className="hidden sm:flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/inventory">
              <Search className="h-4 w-4 mr-2" />
              Browse Cars
            </Link>
          </Button>

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {userName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden lg:inline-block text-sm font-medium">
                    {userName}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/my-account" className="cursor-pointer">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/my-account/reservations" className="cursor-pointer">
                    <User className="h-4 w-4 mr-2" />
                    My Reservations
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm">
              <Link href="/auth/customer-login">
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Link>
            </Button>
          )}
        </div>

        {/* Mobile menu */}
        <div className="flex sm:hidden items-center gap-1">
          {isAuthenticated && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {userName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/my-account" className="cursor-pointer">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/my-account/reservations" className="cursor-pointer">
                    <User className="h-4 w-4 mr-2" />
                    My Reservations
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
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
                {!isAuthenticated && (
                  <Button asChild>
                    <Link href="/auth/customer-login">
                      <LogIn className="h-4 w-4 mr-2" />
                      Sign In
                    </Link>
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}


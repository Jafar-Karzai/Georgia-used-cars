'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Logo } from '@/components/ui/logo'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  LayoutDashboard,
  ShoppingCart,
  Heart,
  User,
  Settings,
  LogOut,
  Menu,
  Home,
  Bell,
  Wallet,
} from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function MyAccountLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Get user data from localStorage
  const [mockUser, setMockUser] = useState({
    name: 'User',
    email: 'user@example.com',
    initials: 'U',
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('mockUser')
      if (userStr) {
        const user = JSON.parse(userStr)
        setMockUser({
          name: user.name || 'User',
          email: user.email,
          initials: user.name ? user.name.substring(0, 2).toUpperCase() : 'U',
        })
      } else {
        // No user found, redirect to login
        router.push('/auth/customer-login')
      }
    }
  }, [router])

  const handleLogout = () => {
    // Mock logout - clear localStorage and redirect to home
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mockAuth')
      localStorage.removeItem('mockUser')
    }
    router.push('/')
  }

  const navigation = [
    {
      name: 'Dashboard',
      href: '/my-account',
      icon: LayoutDashboard,
      current: pathname === '/my-account',
    },
    {
      name: 'My Reservations',
      href: '/my-account/reservations',
      icon: ShoppingCart,
      current: pathname.startsWith('/my-account/reservations'),
      badge: 2, // Mock: number of active reservations
    },
    {
      name: 'Payments',
      href: '/my-account/payments',
      icon: Wallet,
      current: pathname.startsWith('/my-account/payments'),
    },
    {
      name: 'Favorites',
      href: '/my-account/favorites',
      icon: Heart,
      current: pathname.startsWith('/my-account/favorites'),
    },
    {
      name: 'Profile',
      href: '/my-account/profile',
      icon: User,
      current: pathname.startsWith('/my-account/profile'),
    },
    {
      name: 'Settings',
      href: '/my-account/settings',
      icon: Settings,
      current: pathname.startsWith('/my-account/settings'),
    },
  ]

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo & Mobile Menu */}
            <div className="flex items-center gap-4">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0">
                  <div className="flex flex-col h-full">
                    <div className="p-6 border-b">
                      <Logo href="/" />
                    </div>
                    <nav className="flex-1 p-4 space-y-1">
                      {navigation.map((item) => {
                        const Icon = item.icon
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              item.current
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted'
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                            <span>{item.name}</span>
                            {item.badge && (
                              <span className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        )
                      })}
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>

              <div className="hidden md:block">
                <Logo href="/" />
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              {/* Back to Website */}
              <Button variant="ghost" size="sm" asChild className="hidden md:flex">
                <Link href="/">
                  <Home className="h-4 w-4 mr-2" />
                  Back to Website
                </Link>
              </Button>

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {mockUser.initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline-block text-sm font-medium">
                      {mockUser.name}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{mockUser.name}</p>
                      <p className="text-xs text-muted-foreground">{mockUser.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/my-account/profile">
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/my-account/settings">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Navigation - Desktop */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <nav className="sticky top-24 space-y-1 bg-background rounded-lg border p-4">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      item.current
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                    {item.badge && (
                      <span
                        className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                          item.current
                            ? 'bg-primary-foreground text-primary'
                            : 'bg-primary text-primary-foreground'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  )
}

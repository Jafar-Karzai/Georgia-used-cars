'use client'

import Link from 'next/link'
import { Car } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LogoProps {
  variant?: 'default' | 'compact' | 'icon-only'
  className?: string
  href?: string
  showTagline?: boolean
}

export function Logo({ 
  variant = 'default', 
  className,
  href = '/',
  showTagline = false 
}: LogoProps) {
  const LogoContent = () => (
    <div className={cn("flex items-center group", className)}>
      {/* Logo Icon Container */}
      <div 
        className={cn(
          "relative flex items-center justify-center transition-all duration-300 group-hover:scale-105",
          variant === 'compact' ? "w-10 h-10 mr-3" : "w-12 h-12 mr-4",
          variant === 'icon-only' ? "w-10 h-10 mr-0" : ""
        )}
        style={{
          background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.8) 100%)',
          borderRadius: '10px',
          boxShadow: '0 4px 16px hsl(var(--primary)/0.25), 0 2px 8px hsl(var(--primary)/0.15)'
        }}
      >
        {/* Car Icon with GUC overlay */}
        <div className="relative">
          <Car 
            className={cn(
              "text-primary-foreground transition-transform duration-300",
              variant === 'compact' ? "h-5 w-5" : "h-6 w-6"
            )}
            strokeWidth={2.5}
          />
          {/* GUC Text Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span 
              className={cn(
                "text-primary-foreground font-bold tracking-wider",
                variant === 'compact' ? "text-[6px]" : "text-[7px]"
              )}
              style={{ 
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontWeight: 800,
                textShadow: '0 1px 2px rgba(0,0,0,0.3)'
              }}
            >
              GUC
            </span>
          </div>
        </div>
        
        {/* Red accent dot */}
        <div 
          className={cn(
            "absolute rounded-full transition-transform duration-300 group-hover:scale-110",
            variant === 'compact' ? "w-2.5 h-2.5 -bottom-1 -right-1" : "w-3 h-3 -bottom-1 -right-1"
          )}
          style={{ backgroundColor: 'hsl(var(--accent))' }}
        />
      </div>
      
      {/* Brand Text */}
      {variant !== 'icon-only' && (
        <div className="flex flex-col">
          {/* Main text - GEORGIA */}
          <span 
            className={cn(
              "font-bold transition-colors group-hover:text-foreground/90",
              variant === 'compact' ? "text-lg" : "text-xl"
            )}
            style={{ 
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontWeight: 700,
              color: 'hsl(var(--foreground))',
              lineHeight: '1.1'
            }}
          >
            GEORGIA
          </span>
          
          {/* Descriptor line - USED CARS */}
          <span
            className={cn(
              "tracking-widest text-muted-foreground uppercase transition-colors duration-300",
              variant === 'compact' ? "text-2xs" : "text-xs"
            )}
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontWeight: 300,
              letterSpacing: '0.12em'
            }}
          >
            USED CARS
          </span>

          {/* Tagline */}
          {showTagline && variant === 'default' && (
            <span
              className="text-2xs text-muted-foreground/70 tracking-wide mt-0.5"
              style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontWeight: 400,
                letterSpacing: '0.05em'
              }}
            >
              Premium Imports
            </span>
          )}
        </div>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="transition-opacity hover:opacity-90">
        <LogoContent />
      </Link>
    )
  }

  return <LogoContent />
}

// Specialized variants for different use cases
export function LogoFull(props: Omit<LogoProps, 'variant'>) {
  return <Logo {...props} variant="default" showTagline />
}

export function LogoCompact(props: Omit<LogoProps, 'variant'>) {
  return <Logo {...props} variant="compact" />
}

export function LogoIcon(props: Omit<LogoProps, 'variant'>) {
  return <Logo {...props} variant="icon-only" />
}

// Admin panel logo variant with different styling
export function LogoAdmin({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center group", className)}>
      <div 
        className="relative w-8 h-8 flex items-center justify-center mr-3 transition-all duration-300 group-hover:scale-105"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.8) 100%)',
          borderRadius: '6px',
          boxShadow: '0 2px 8px hsl(var(--primary)/0.2)'
        }}
      >
        <Car className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span 
            className="text-primary-foreground font-bold text-[5px] tracking-wider"
            style={{ 
              fontWeight: 800,
              textShadow: '0 1px 2px rgba(0,0,0,0.3)'
            }}
          >
            GUC
          </span>
        </div>
        
        {/* Red accent dot */}
        <div 
          className="absolute w-2 h-2 rounded-full -bottom-0.5 -right-0.5"
          style={{ backgroundColor: 'hsl(var(--accent))' }}
        />
      </div>
      
      <div className="flex flex-col">
        <span 
          className="text-sm font-bold text-foreground"
          style={{ 
            fontWeight: 700,
            lineHeight: '1.1'
          }}
        >
          GEORGIA
        </span>
        <span 
          className="text-[8px] tracking-widest text-muted-foreground uppercase"
          style={{ 
            fontWeight: 300,
            letterSpacing: '0.1em'
          }}
        >
          USED CARS
        </span>
      </div>
    </div>
  )
}
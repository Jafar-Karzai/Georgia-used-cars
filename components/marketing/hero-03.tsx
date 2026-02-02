'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Phone } from 'lucide-react'
import { HeroSearchCard } from './hero-search-card'

export function Hero03() {
  return (
    <section className="hero-gradient relative overflow-hidden">
      {/* Dot Pattern Overlay - creates premium texture */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.4) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
        aria-hidden="true"
      />

      {/* Gradient Orb - subtle ambient lighting effect */}
      <div
        className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(59,130,246,0.5) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center py-16 md:py-20 lg:py-24">

          {/* Left Column - Text Content */}
          <div className="text-white animate-reveal">
            {/* Subtitle Badge */}
            <p className="text-precision-200 text-xs font-bold uppercase tracking-widest mb-4">
              Direct from US &amp; Canada Auctions
            </p>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[0.95] mb-6 text-balance">
              Premium Salvage
              <br />
              <span className="text-precision-300">Delivered to UAE</span>
            </h1>

            {/* Description */}
            <p className="text-precision-100 text-lg max-w-lg mb-8 leading-relaxed">
              Curated selection from Copart and IAAI auctions. High-accuracy damage reports
              for repair shops and project enthusiasts. Sold AS-IS.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                asChild
                size="lg"
                className="bg-action-600 hover:bg-action-700 text-white px-8 py-6 rounded-xl font-bold text-sm uppercase tracking-widest transition-all btn-precision shadow-lg shadow-action-600/25"
              >
                <Link href="/inventory">
                  View Inventory
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-2 border-white/30 hover:border-white/60 bg-transparent text-white px-8 py-6 rounded-xl font-bold text-sm uppercase tracking-widest transition-all hover:bg-white/5"
              >
                <Link href="/contact">
                  <Phone className="mr-2 h-4 w-4" />
                  Contact Sales
                </Link>
              </Button>
            </div>
          </div>

          {/* Right Column - Search Card */}
          <div className="animate-reveal" style={{ animationDelay: '0.15s' }}>
            <HeroSearchCard variant="hero" />
          </div>
        </div>
      </div>

      {/* Bottom gradient fade - smooth transition to next section */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background/10 to-transparent pointer-events-none"
        aria-hidden="true"
      />
    </section>
  )
}

export default Hero03

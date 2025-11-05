'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ArrowUpRight, PhoneCall } from 'lucide-react'
import { HeroSearchCard } from './hero-search-card'

export function Hero03() {
  return (
    <section className="w-full relative">
      {/* Text Content */}
      <div className="container mx-auto px-4 sm:px-6 pt-16 pb-8 md:pt-20 md:pb-12">
        {/* Heading and CTAs */}
        <div className="text-center max-w-4xl mx-auto mb-12 md:mb-16">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight font-bold tracking-tight text-foreground">
            Premium Salvage Vehicles,
            <br />
            <span className="text-primary">Expertly Imported</span>
          </h1>
          <p className="mt-6 text-muted-foreground text-lg sm:text-xl max-w-2xl mx-auto">
            Georgia Used Cars sources quality vehicles from top auction houses and delivers a transparent, high‑touch buying experience in the UAE.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Button asChild size="lg" className="rounded-full text-base w-full sm:w-auto shadow-lg">
              <Link href="/inventory">
                Browse Inventory <ArrowUpRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full text-base shadow-none w-full sm:w-auto">
              <Link href="/contact">
                <PhoneCall className="mr-2 h-5 w-5" /> Contact Sales
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Search Card and Hero Image Container */}
      <div className="relative overflow-x-hidden">
        {/* Search Card Container - with responsive max-width to create side margins */}
        <div className="flex justify-center px-4 sm:px-6 pb-4 sm:pb-6 md:pb-8 relative z-20">
          <div className="w-full max-w-[82%] sm:max-w-[85%] md:max-w-[80%]">
            <HeroSearchCard />
          </div>
        </div>

        {/* Hero Image Container - FULL WIDTH with deeper negative margin for intrusion effect */}
        <div className="relative w-full -mt-12 sm:-mt-16 md:-mt-20 lg:-mt-24 pb-12 md:pb-20 z-0 px-4 sm:px-6 overflow-hidden">
          <div className="relative w-full h-[500px] md:h-[650px] lg:h-[750px] rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            {/* SVG background gradient */}
            <Image src="/hero/vehicle-hero.svg" alt="Background gradient" fill priority className="object-cover" />
            {/* Real car, transparent background */}
            <Image
              src="/hero/Side-View-Red-Ferrari-PNG-Clipart.png"
              alt="Showcase vehicle"
              fill
              sizes="(max-width: 768px) 100vw, 1200px"
              priority
              className="object-contain object-center drop-shadow-2xl"
            />
            {/* Gradient overlay at bottom for better card visibility */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/10 via-transparent to-transparent" />
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero03

'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ArrowUpRight, PhoneCall } from 'lucide-react'

export function Hero03() {
  return (
    <section className="w-full flex flex-col gap-10 items-center justify-center px-4 sm:px-6 py-12 md:py-20">
      <div className="text-center max-w-3xl">
        <h1 className="mt-4 text-3xl sm:text-5xl md:text-6xl leading-tight md:leading-[1.15] font-semibold tracking-tight">
          Premium Salvage Vehicles, Expertly Imported
        </h1>
        <p className="mt-4 text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
          Georgia Used Cars sources quality vehicles from top auction houses and delivers a transparent, high‑touch buying experience in the UAE.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Button asChild size="lg" className="rounded-full text-base w-full sm:w-auto">
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

      <div className="w-full max-w-screen-xl mx-auto aspect-video rounded-xl overflow-hidden relative">
        {/* SVG background gradient */}
        <Image src="/hero/vehicle-hero.svg" alt="Background gradient" fill priority className="object-cover" />
        {/* Real car, transparent background */}
        <Image
          src="/hero/Side-View-Red-Ferrari-PNG-Clipart.png"
          alt="Showcase vehicle"
          fill
          sizes="(max-width: 768px) 100vw, 1200px"
          priority
          className="object-contain object-bottom drop-shadow-2xl"
        />
        {/* Subtle darken for contrast on text over bright areas if needed */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/10 to-transparent" />
      </div>
    </section>
  )
}

export default Hero03

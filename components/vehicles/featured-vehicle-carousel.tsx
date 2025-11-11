'use client'

import { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import useEmblaCarousel from 'embla-carousel-react'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Car, Clock } from 'lucide-react'

interface PublicVehicle {
  id: string
  year: number
  make: string
  model: string
  current_status: string
  sale_price?: number
  sale_currency?: string
  sale_type?: string
  sale_price_includes_vat?: boolean
  expected_arrival_date?: string
  actual_arrival_date?: string
  vehicle_photos?: Array<{
    url: string
    is_primary: boolean
  }>
}

interface FeaturedVehicleCarouselProps {
  vehicles: PublicVehicle[]
  isUAE?: boolean | null
}

export function FeaturedVehicleCarousel({ vehicles, isUAE = null }: FeaturedVehicleCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
    containScroll: 'trimSnaps',
  })
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index)
    },
    [emblaApi]
  )

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return

    setScrollSnaps(emblaApi.scrollSnapList())
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    onSelect()

    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
    }
  }, [emblaApi, onSelect])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') scrollPrev()
      if (e.key === 'ArrowRight') scrollNext()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [scrollPrev, scrollNext])

  const formatCurrency = (amount: number | string) => {
    if (typeof amount === 'string') return amount
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getDisplayPrice = (vehicle: PublicVehicle): number | string => {
    if (!vehicle.sale_price || vehicle.sale_price <= 0) return 'Contact for Price'

    const basePrice = vehicle.sale_price
    const saleType = vehicle.sale_type || 'local_and_export'
    const includesVat = vehicle.sale_price_includes_vat ?? false

    if (saleType === 'export_only') return basePrice
    if (saleType === 'local_only') return includesVat ? basePrice : basePrice * 1.05

    if (isUAE) {
      return includesVat ? basePrice : basePrice * 1.05
    } else {
      return basePrice
    }
  }

  const getVatNote = (vehicle: PublicVehicle) => {
    if (!vehicle.sale_price || vehicle.sale_price <= 0) return null

    const saleType = vehicle.sale_type || 'local_and_export'
    if (saleType === 'export_only') return 'VAT free'
    if (saleType === 'local_only') return 'Includes 5% VAT'

    if (isUAE) {
      return 'Includes 5% VAT (UAE)'
    } else {
      return 'VAT free (Export)'
    }
  }

  const getDaysUntilArrival = (expectedDate?: string) => {
    if (!expectedDate) return null

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const expected = new Date(expectedDate)
    expected.setHours(0, 0, 0, 0)

    const daysRemaining = Math.ceil((expected.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysRemaining < 0) return null
    if (daysRemaining === 0) return 'Arriving Today'
    if (daysRemaining === 1) return 'Arriving Tomorrow'
    return `Arriving in ${daysRemaining} days`
  }

  if (!vehicles || vehicles.length === 0) {
    return null
  }

  return (
    <section
      className="relative w-full group"
      aria-label="Featured vehicles carousel"
      role="region"
    >
      {/* Embla Carousel Container - with padding to show side cards */}
      <div
        className="overflow-hidden"
        ref={emblaRef}
        role="group"
        aria-roledescription="carousel"
        aria-live="polite"
      >
        <div className="flex gap-4 md:gap-6 pl-4 md:pl-8 pr-4 md:pr-8">
          {vehicles.map((vehicle, index) => {
            const primaryPhoto = vehicle.vehicle_photos?.find(p => p.is_primary) || vehicle.vehicle_photos?.[0]
            const displayPrice = getDisplayPrice(vehicle)
            const vatNote = getVatNote(vehicle)
            const arrivalInfo = getDaysUntilArrival(vehicle.expected_arrival_date)

            return (
              <article
                key={vehicle.id}
                className={`flex-[0_0_85%] md:flex-[0_0_65%] min-w-0 ${
                  index === vehicles.length - 1 ? 'mr-4 md:mr-8' : ''
                }`}
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${vehicles.length}`}
              >
                <Link
                  href={`/inventory/${vehicle.id}`}
                  className="block group/card"
                  aria-label={`View details for ${vehicle.year} ${vehicle.make} ${vehicle.model}, priced at ${formatCurrency(displayPrice)}`}
                >
                  {/* Card Container - Taller for more vertical feel */}
                  <div className="relative w-full h-[500px] md:h-[600px] bg-muted overflow-hidden rounded-xl shadow-xl transition-all duration-300 group-hover/card:shadow-2xl">
                    {primaryPhoto?.url ? (
                      <>
                        <Image
                          src={primaryPhoto.url}
                          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                          fill
                          priority={index === 0}
                          className="object-cover object-center transition-transform duration-500 group-hover/card:scale-105"
                          sizes="(max-width: 768px) 85vw, 70vw"
                        />
                        {/* Gradient overlay for text legibility - Bottom left for info card */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-black/70 via-black/20 to-transparent pointer-events-none" />
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <Car className="h-24 w-24 text-muted-foreground/30" />
                      </div>
                    )}

                    {/* Arrival Countdown Badge - Top Left with Glass Effect */}
                    {arrivalInfo && (
                      <div className="absolute top-4 left-4 md:top-6 md:left-6">
                        <Badge className="
                          backdrop-blur-md
                          bg-red-500/85
                          text-white
                          border border-white/20
                          shadow-lg
                          px-3 py-1.5
                          text-xs md:text-sm
                          font-semibold
                          inline-flex items-center gap-2
                          transition-all duration-300
                          hover:bg-red-500/95 hover:scale-105
                        ">
                          <Clock className="h-3.5 w-3.5 md:h-4 md:w-4" />
                          <span>{arrivalInfo}</span>
                        </Badge>
                      </div>
                    )}

                    {/* Info Card - Left-Aligned with Apple Liquid Glass Effect */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 flex items-end">
                      <div className="max-w-md">
                        <div className="
                          backdrop-blur-2xl bg-white/80 dark:bg-black/80
                          border border-white/20 dark:border-white/10
                          rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.12)]
                          dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]
                          p-4 md:p-6
                          relative overflow-hidden
                        ">
                          {/* Inner glow effect - Apple liquid glass signature */}
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-primary/5 to-transparent dark:from-primary/10 dark:via-primary/5 pointer-events-none rounded-2xl" />

                          {/* Content wrapper for proper z-index */}
                          <div className="relative z-10">
                            {/* Vehicle Name - White for maximum contrast */}
                            <h2 className="text-xl md:text-2xl font-bold text-white mb-2 md:mb-3 leading-tight">
                              {vehicle.year} {vehicle.make} {vehicle.model}
                            </h2>

                            {/* Price - Primary color for brand emphasis */}
                            <div>
                              <p className="text-3xl md:text-4xl font-bold text-primary drop-shadow-lg">
                                {formatCurrency(displayPrice)}
                              </p>
                              {vatNote && (
                                <p className="text-xs text-white/90 flex items-center gap-1.5 mt-1">
                                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" />
                                  {vatNote}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </article>
            )
          })}
        </div>
      </div>

      {/* Navigation Arrows - Show on hover when there are cards to navigate to */}
      {vehicles.length > 1 && (
        <>
          {canScrollPrev && (
            <button
              onClick={scrollPrev}
              aria-label="Previous vehicle"
              className="
                absolute left-4 top-1/2 -translate-y-1/2
                w-12 h-12 rounded-full
                bg-background/80 backdrop-blur-md border border-border/50
                flex items-center justify-center
                opacity-0 group-hover:opacity-100
                hover:bg-background hover:scale-110
                transition-all duration-300
                shadow-lg
                z-10
              "
            >
              <ChevronLeft className="h-6 w-6 text-foreground" />
            </button>
          )}

          {canScrollNext && (
            <button
              onClick={scrollNext}
              aria-label="Next vehicle"
              className="
                absolute right-4 top-1/2 -translate-y-1/2
                w-12 h-12 rounded-full
                bg-background/80 backdrop-blur-md border border-border/50
                flex items-center justify-center
                opacity-0 group-hover:opacity-100
                hover:bg-background hover:scale-110
                transition-all duration-300
                shadow-lg
                z-10
              "
            >
              <ChevronRight className="h-6 w-6 text-foreground" />
            </button>
          )}
        </>
      )}

      {/* Dot Indicators */}
      {vehicles.length > 1 && (
        <div className="flex justify-center gap-2 mt-6" role="group" aria-label="Carousel navigation">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              aria-label={`Go to vehicle ${index + 1} of ${vehicles.length}`}
              aria-current={index === selectedIndex ? 'true' : 'false'}
              className={`
                transition-all duration-300
                ${
                  index === selectedIndex
                    ? 'w-8 h-2 bg-primary rounded-full'
                    : 'w-2 h-2 bg-muted-foreground/30 rounded-full hover:bg-muted-foreground/50'
                }
              `}
            />
          ))}
        </div>
      )}
    </section>
  )
}

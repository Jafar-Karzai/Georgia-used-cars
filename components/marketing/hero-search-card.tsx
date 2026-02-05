'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

// Popular makes - can be expanded or fetched from API
const POPULAR_MAKES = [
  'Toyota',
  'Honda',
  'Ford',
  'Chevrolet',
  'Nissan',
  'BMW',
  'Mercedes-Benz',
  'Audi',
  'Lexus',
  'Hyundai',
  'Mazda',
  'Volkswagen',
  'Jeep',
  'Dodge',
  'GMC'
]

// Price ranges in AED
const PRICE_RANGES = [
  { value: '0-50000', label: 'Under 50,000 AED' },
  { value: '50000-100000', label: '50,000 - 100,000 AED' },
  { value: '100000-200000', label: '100,000 - 200,000 AED' },
  { value: '200000-999999', label: '200,000+ AED' },
]

// Generate year range (current year to 1990)
const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: currentYear - 1989 }, (_, i) => currentYear - i)

interface HeroSearchCardProps {
  variant?: 'default' | 'hero'
  className?: string
}

export function HeroSearchCard({ variant = 'default', className }: HeroSearchCardProps) {
  const router = useRouter()
  const [make, setMake] = useState<string>('')
  const [model, setModel] = useState<string>('')
  const [yearFrom, setYearFrom] = useState<string>('')
  const [priceRange, setPriceRange] = useState<string>('')

  const handleSearch = () => {
    const params = new URLSearchParams()

    if (make && make !== 'all') params.set('make', make)
    if (model) params.set('model', model)
    if (yearFrom && yearFrom !== 'all') params.set('year_min', yearFrom)
    if (priceRange && priceRange !== 'all') {
      const [min, max] = priceRange.split('-')
      if (min) params.set('price_min', min)
      if (max) params.set('price_max', max)
    }

    const queryString = params.toString()
    router.push(queryString ? `/inventory?${queryString}` : '/inventory')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // Hero variant - white frosted card for use on blue gradient background
  if (variant === 'hero') {
    return (
      <div
        className={cn(
          'rounded-2xl p-6 lg:p-8 animate-reveal',
          'bg-white/95 dark:bg-precision-900/95',
          'backdrop-blur-xl',
          'shadow-2xl shadow-precision-950/20 dark:shadow-black/40',
          'border border-white/50 dark:border-precision-700/50',
          className
        )}
        role="search"
        aria-label="Vehicle search"
      >
        {/* Card Header */}
        <h3 className="text-foreground font-extrabold text-lg mb-6 flex items-center gap-3">
          <span className="w-1.5 h-6 bg-action-600 rounded-full" aria-hidden="true" />
          Find Your Vehicle
        </h3>

        {/* Search Form Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Make Select */}
          <div>
            <label htmlFor="hero-make-select" className="block text-2xs uppercase font-bold text-muted-foreground tracking-wider mb-2">
              Make / Brand
            </label>
            <Select value={make} onValueChange={setMake}>
              <SelectTrigger id="hero-make-select" className="h-12 bg-muted/50 dark:bg-precision-800/50 border-border/50 font-semibold text-sm">
                <SelectValue placeholder="All Makes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Makes</SelectItem>
                {POPULAR_MAKES.map((makeName) => (
                  <SelectItem key={makeName} value={makeName}>
                    {makeName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Model Input */}
          <div>
            <label htmlFor="hero-model-input" className="block text-2xs uppercase font-bold text-muted-foreground tracking-wider mb-2">
              Model
            </label>
            <Input
              id="hero-model-input"
              type="text"
              placeholder="Any Model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              onKeyPress={handleKeyPress}
              className="h-12 bg-muted/50 dark:bg-precision-800/50 border-border/50 font-semibold text-sm placeholder:font-normal"
            />
          </div>

          {/* Year From */}
          <div>
            <label htmlFor="hero-year-select" className="block text-2xs uppercase font-bold text-muted-foreground tracking-wider mb-2">
              Year From
            </label>
            <Select value={yearFrom} onValueChange={setYearFrom}>
              <SelectTrigger id="hero-year-select" className="h-12 bg-muted/50 dark:bg-precision-800/50 border-border/50 font-semibold text-sm">
                <SelectValue placeholder="Any Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Year</SelectItem>
                {YEARS.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price Range */}
          <div>
            <label htmlFor="hero-price-select" className="block text-2xs uppercase font-bold text-muted-foreground tracking-wider mb-2">
              Price Range
            </label>
            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger id="hero-price-select" className="h-12 bg-muted/50 dark:bg-precision-800/50 border-border/50 font-semibold text-sm">
                <SelectValue placeholder="Any Price" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Price</SelectItem>
                {PRICE_RANGES.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Search Button */}
        <Button
          onClick={handleSearch}
          size="lg"
          className="w-full h-12 bg-precision-900 hover:bg-precision-800 dark:bg-precision-700 dark:hover:bg-precision-600 text-white font-bold text-sm uppercase tracking-widest transition-all btn-precision"
        >
          <Search className="h-4 w-4 mr-2" aria-hidden="true" />
          Search Vehicles
        </Button>
      </div>
    )
  }

  // Default variant - for standalone use (original design)
  return (
    <Card className={cn(
      'w-full shadow-sm border border-border/50 backdrop-blur-md bg-background/85 relative z-20 rounded-xl ring-8 ring-background/95',
      className
    )}>
      <CardContent className="p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Make Select */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Make
            </label>
            <Select value={make} onValueChange={setMake}>
              <SelectTrigger className="h-12 bg-background">
                <SelectValue placeholder="Select make" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Makes</SelectItem>
                {POPULAR_MAKES.map((makeName) => (
                  <SelectItem key={makeName} value={makeName}>
                    {makeName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Model Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Model
            </label>
            <Input
              type="text"
              placeholder="Enter model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              onKeyPress={handleKeyPress}
              className="h-12 bg-background"
            />
          </div>

          {/* Year Range */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Year From
            </label>
            <Select value={yearFrom} onValueChange={setYearFrom}>
              <SelectTrigger className="h-12 bg-background">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                {YEARS.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search Button */}
          <div className="flex items-end">
            <Button
              onClick={handleSearch}
              size="lg"
              className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
            >
              <Search className="h-5 w-5 mr-2" />
              Search
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

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

// Generate year range (current year to 1990)
const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: currentYear - 1989 }, (_, i) => currentYear - i)

export function HeroSearchCard() {
  const router = useRouter()
  const [make, setMake] = useState<string>('')
  const [model, setModel] = useState<string>('')
  const [yearFrom, setYearFrom] = useState<string>('')
  const [yearTo, setYearTo] = useState<string>('')

  const handleSearch = () => {
    const params = new URLSearchParams()

    if (make) params.set('make', make)
    if (model) params.set('model', model)
    if (yearFrom) params.set('year_min', yearFrom)
    if (yearTo) params.set('year_max', yearTo)

    const queryString = params.toString()
    router.push(queryString ? `/inventory?${queryString}` : '/inventory')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <Card className="w-full shadow-sm border border-border/40 backdrop-blur-md bg-background/95 relative z-20 rounded-xl ring-8 ring-white/90">
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
              Year Range
            </label>
            <div className="flex gap-2">
              <Select value={yearFrom} onValueChange={setYearFrom}>
                <SelectTrigger className="h-12 bg-background">
                  <SelectValue placeholder="From" />
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
              <Select value={yearTo} onValueChange={setYearTo}>
                <SelectTrigger className="h-12 bg-background">
                  <SelectValue placeholder="To" />
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

'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Heart,
  Search,
  Car,
  Gauge,
  Fuel,
  Calendar,
  Eye,
  X,
  ShoppingCart,
  Grid3x3,
  List,
  Sparkles,
} from 'lucide-react'
import Image from 'next/image'

export default function FavoritesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Mock favorite vehicles data
  const favorites = [
    {
      id: '2021-camry-id',
      year: 2021,
      make: 'Toyota',
      model: 'Camry',
      trim: 'XLE',
      price: 50000,
      currency: 'AED',
      type: 'sedan',
      mileage: 35000,
      fuelType: 'Petrol',
      transmission: 'Automatic',
      image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop',
      isAvailable: true,
      addedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      featured: true,
    },
    {
      id: '2022-accord-id',
      year: 2022,
      make: 'Honda',
      model: 'Accord',
      trim: 'Sport',
      price: 60000,
      currency: 'AED',
      type: 'sedan',
      mileage: 28000,
      fuelType: 'Petrol',
      transmission: 'Automatic',
      image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&h=300&fit=crop',
      isAvailable: true,
      addedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      featured: false,
    },
    {
      id: '2020-mustang-id',
      year: 2020,
      make: 'Ford',
      model: 'Mustang',
      trim: 'GT',
      price: 80000,
      currency: 'AED',
      type: 'coupe',
      mileage: 42000,
      fuelType: 'Petrol',
      transmission: 'Manual',
      image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=300&fit=crop',
      isAvailable: true,
      addedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      featured: true,
    },
    {
      id: '2019-x5-id',
      year: 2019,
      make: 'BMW',
      model: 'X5',
      trim: 'xDrive40i',
      price: 100000,
      currency: 'AED',
      type: 'suv',
      mileage: 55000,
      fuelType: 'Petrol',
      transmission: 'Automatic',
      image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop',
      isAvailable: false,
      addedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      featured: false,
      soldDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: '2021-f150-id',
      year: 2021,
      make: 'Ford',
      model: 'F-150',
      trim: 'Lariat',
      price: 120000,
      currency: 'AED',
      type: 'truck',
      mileage: 38000,
      fuelType: 'Diesel',
      transmission: 'Automatic',
      image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&h=300&fit=crop',
      isAvailable: true,
      addedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      featured: false,
    },
  ]

  const formatCurrency = (amount: number, currency: string = 'AED') => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatMileage = (mileage: number) => {
    return new Intl.NumberFormat('en-AE').format(mileage)
  }

  const handleRemoveFavorite = (id: string) => {
    // Mock remove - in real app, this would call an API
    console.log('Removing favorite:', id)
  }

  // Filter and sort
  const filteredFavorites = favorites
    .filter((vehicle) => {
      // Filter by type
      if (filterType !== 'all' && vehicle.type !== filterType) return false

      // Filter by search query
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase()
        const vehicleString =
          `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}`.toLowerCase()
        if (!vehicleString.includes(searchLower)) return false
      }

      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.addedDate.getTime() - a.addedDate.getTime()
        case 'price-low':
          return a.price - b.price
        case 'price-high':
          return b.price - a.price
        case 'year-new':
          return b.year - a.year
        case 'year-old':
          return a.year - b.year
        default:
          return 0
      }
    })

  // Stats
  const totalFavorites = favorites.length
  const availableCount = favorites.filter((v) => v.isAvailable).length
  const avgPrice =
    favorites.length > 0 ? favorites.reduce((sum, v) => sum + v.price, 0) / favorites.length : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">My Favorites</h1>
        <p className="text-muted-foreground">
          Vehicles you&apos;ve saved for later
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Favorites
            </CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalFavorites}</div>
            <p className="text-xs text-muted-foreground mt-1">Saved vehicles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available Now
            </CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{availableCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready to reserve</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Price
            </CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(avgPrice)}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all favorites</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search favorites..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter by Type */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="sedan">Sedan</SelectItem>
                <SelectItem value="suv">SUV</SelectItem>
                <SelectItem value="truck">Truck</SelectItem>
                <SelectItem value="coupe">Coupe</SelectItem>
                <SelectItem value="hatchback">Hatchback</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Recently Added</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="year-new">Year: Newest First</SelectItem>
                <SelectItem value="year-old">Year: Oldest First</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode Toggle */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {filteredFavorites.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Heart className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery || filterType !== 'all'
                ? 'No Matching Favorites'
                : 'No Favorites Yet'}
            </h3>
            <p className="text-muted-foreground text-center mb-6">
              {searchQuery || filterType !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'Start saving vehicles you like to easily find them later.'}
            </p>
            {searchQuery || filterType !== 'all' ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('')
                  setFilterType('all')
                }}
              >
                Clear Filters
              </Button>
            ) : (
              <Button asChild>
                <Link href="/inventory">
                  <Car className="h-4 w-4 mr-2" />
                  Browse Vehicles
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>
              Showing {filteredFavorites.length} of {totalFavorites} favorites
            </p>
          </div>

          <div
            className={
              viewMode === 'grid'
                ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }
          >
            {filteredFavorites.map((vehicle) => (
              <Card
                key={vehicle.id}
                className={`overflow-hidden hover:shadow-lg transition-all ${
                  !vehicle.isAvailable ? 'opacity-75' : ''
                }`}
              >
                <div className="relative">
                  {/* Vehicle Image */}
                  <div className="aspect-video bg-muted overflow-hidden relative">
                    <Image
                      src={vehicle.image}
                      alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Badges Overlay */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {vehicle.featured && (
                      <Badge className="bg-primary text-primary-foreground">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                    {!vehicle.isAvailable && (
                      <Badge variant="destructive">Sold</Badge>
                    )}
                  </div>

                  {/* Remove Button */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute top-3 right-3 h-8 w-8 bg-background/80 hover:bg-background"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove from favorites?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove {vehicle.year} {vehicle.make} {vehicle.model} from
                          your favorites list. You can always add it back later.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleRemoveFavorite(vehicle.id)}>
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <CardContent className="p-4 space-y-4">
                  {/* Vehicle Info */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-semibold text-lg leading-tight">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </h3>
                        {vehicle.trim && (
                          <p className="text-sm text-muted-foreground">{vehicle.trim}</p>
                        )}
                      </div>
                    </div>

                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(vehicle.price, vehicle.currency)}
                    </p>
                  </div>

                  {/* Specs */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Gauge className="h-4 w-4" />
                      <span>{formatMileage(vehicle.mileage)} km</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Fuel className="h-4 w-4" />
                      <span>{vehicle.fuelType}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                      <Calendar className="h-4 w-4" />
                      <span className="capitalize">{vehicle.transmission}</span>
                    </div>
                  </div>

                  {/* Status Message */}
                  {!vehicle.isAvailable && vehicle.soldDate && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-xs text-red-800">
                        This vehicle was sold on{' '}
                        {vehicle.soldDate.toLocaleDateString('en-AE', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button asChild variant="outline" className="flex-1">
                      <Link href={`/inventory/${vehicle.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Link>
                    </Button>
                    {vehicle.isAvailable && (
                      <Button asChild className="flex-1">
                        <Link href={`/inventory/${vehicle.id}`}>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Reserve
                        </Link>
                      </Button>
                    )}
                  </div>

                  {/* Added Date */}
                  <p className="text-xs text-muted-foreground text-center pt-2 border-t">
                    Added{' '}
                    {vehicle.addedDate.toLocaleDateString('en-AE', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

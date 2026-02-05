'use client'

import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

/**
 * Vehicle Filters Sidebar Component
 * Provides filtering options for vehicle inventory
 */

export interface VehicleFilters {
  make?: string
  model?: string
  minYear?: number
  maxYear?: number
  minPrice?: number
  maxPrice?: number
  bodyType?: string
  fuelType?: string
  transmission?: string
  status?: string
  runAndDrive?: boolean
  engineStarts?: boolean
}

interface FiltersSidebarProps {
  filters: VehicleFilters
  onFilterChange: (key: keyof VehicleFilters, value: string | number | boolean | undefined) => void
  onClearFilters: () => void
  onApplyFilters: () => void
  currency?: 'AED' | 'USD'
  isMobile?: boolean
  onClose?: () => void
  makes?: string[]
  bodyTypes?: string[]
  damageTypes?: string[]
}

const DEFAULT_MAKES = [
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
  'Porsche',
  'Tesla',
]

const DEFAULT_BODY_TYPES = [
  'Sedan',
  'SUV',
  'Coupe',
  'Hatchback',
  'Truck',
  'Convertible',
  'Wagon',
]

const DEFAULT_DAMAGE_TYPES = [
  'Front End',
  'Rear End',
  'Side Impact',
  'Water / Flood',
  'Hail Damage',
  'Mechanical',
  'Vandalism',
]

export function FiltersSidebar({
  filters,
  onFilterChange,
  onClearFilters,
  onApplyFilters,
  currency = 'AED',
  isMobile = false,
  onClose,
  makes = DEFAULT_MAKES,
  bodyTypes = DEFAULT_BODY_TYPES,
  damageTypes = DEFAULT_DAMAGE_TYPES,
}: FiltersSidebarProps) {
  const handleApply = () => {
    onApplyFilters()
    if (isMobile && onClose) {
      onClose()
    }
  }

  return (
    <div className={`frosted-panel rounded-2xl ${isMobile ? '' : 'sticky top-28'}`}>
      <div className="p-5 border-b border-border flex justify-between items-center">
        <h3 className="font-extrabold flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" />
          Filters
        </h3>
        <button
          onClick={onClearFilters}
          className="text-2xs font-bold text-action-600 hover:text-action-700 uppercase tracking-wider"
        >
          Clear All
        </button>
      </div>

      <div className="p-5 space-y-6">
        {/* Make */}
        <div>
          <label className="block text-2xs uppercase font-bold text-muted-foreground mb-2">
            Make / Brand
          </label>
          <Select
            value={filters.make || ''}
            onValueChange={(value) => onFilterChange('make', value)}
          >
            <SelectTrigger className="w-full bg-muted/50 border-border rounded-xl px-4 py-3 font-semibold text-sm">
              <SelectValue placeholder="All Makes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Makes</SelectItem>
              {makes.map((make) => (
                <SelectItem key={make} value={make}>
                  {make}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Year Range */}
        <div>
          <label className="block text-2xs uppercase font-bold text-muted-foreground mb-2">
            Year Range
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="From"
              value={filters.minYear || ''}
              onChange={(e) =>
                onFilterChange('minYear', e.target.value ? parseInt(e.target.value) : undefined)
              }
              className="w-full bg-muted/50 border-border rounded-xl px-4 py-3 font-semibold text-sm"
            />
            <Input
              type="number"
              placeholder="To"
              value={filters.maxYear || ''}
              onChange={(e) =>
                onFilterChange('maxYear', e.target.value ? parseInt(e.target.value) : undefined)
              }
              className="w-full bg-muted/50 border-border rounded-xl px-4 py-3 font-semibold text-sm"
            />
          </div>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-2xs uppercase font-bold text-muted-foreground mb-2">
            Price Range ({currency})
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={filters.minPrice || ''}
              onChange={(e) =>
                onFilterChange('minPrice', e.target.value ? parseInt(e.target.value) : undefined)
              }
              className="w-full bg-muted/50 border-border rounded-xl px-4 py-3 font-semibold text-sm"
            />
            <Input
              type="number"
              placeholder="Max"
              value={filters.maxPrice || ''}
              onChange={(e) =>
                onFilterChange('maxPrice', e.target.value ? parseInt(e.target.value) : undefined)
              }
              className="w-full bg-muted/50 border-border rounded-xl px-4 py-3 font-semibold text-sm"
            />
          </div>
        </div>

        {/* Body Type */}
        <div>
          <label className="block text-2xs uppercase font-bold text-muted-foreground mb-2">
            Body Type
          </label>
          <Select
            value={filters.bodyType || ''}
            onValueChange={(value) => onFilterChange('bodyType', value)}
          >
            <SelectTrigger className="w-full bg-muted/50 border-border rounded-xl px-4 py-3 font-semibold text-sm">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {bodyTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Engine Status */}
        <div>
          <label className="block text-2xs uppercase font-bold text-muted-foreground mb-3">
            Engine Status
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.runAndDrive === true}
                onChange={(e) => onFilterChange('runAndDrive', e.target.checked ? true : undefined)}
                className="w-4 h-4 accent-precision-900 rounded"
              />
              <span className="text-sm font-medium flex items-center gap-2">
                <span className="w-2 h-2 bg-success rounded-full"></span>
                Run & Drive
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.engineStarts === true}
                onChange={(e) => onFilterChange('engineStarts', e.target.checked ? true : undefined)}
                className="w-4 h-4 accent-precision-900 rounded"
              />
              <span className="text-sm font-medium flex items-center gap-2">
                <span className="w-2 h-2 bg-warning rounded-full"></span>
                Starts
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.runAndDrive === false}
                onChange={(e) => onFilterChange('runAndDrive', e.target.checked ? false : undefined)}
                className="w-4 h-4 accent-precision-900 rounded"
              />
              <span className="text-sm font-medium flex items-center gap-2">
                <span className="w-2 h-2 bg-action-600 rounded-full"></span>
                Does Not Start
              </span>
            </label>
          </div>
        </div>

        {/* Damage Type */}
        <div>
          <label className="block text-2xs uppercase font-bold text-muted-foreground mb-2">
            Damage Type
          </label>
          <Select
            value={filters.fuelType || ''}
            onValueChange={(value) => onFilterChange('fuelType', value)}
          >
            <SelectTrigger className="w-full bg-muted/50 border-border rounded-xl px-4 py-3 font-semibold text-sm">
              <SelectValue placeholder="All Damage Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Damage Types</SelectItem>
              {damageTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleApply}
          className="w-full bg-precision-900 hover:bg-precision-800 text-white py-4 rounded-xl font-bold text-sm uppercase tracking-widest btn-precision"
        >
          Apply Filters
        </Button>
      </div>
    </div>
  )
}

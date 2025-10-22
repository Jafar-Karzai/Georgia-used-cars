'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import type { StatusGroup } from '@/lib/utils/vehicle-status'
import { Car, Package, TruckIcon } from 'lucide-react'

interface StatusFilterTabsProps {
  counts?: {
    all: number
    arrived: number
    arriving_soon: number
  }
  currentGroup?: StatusGroup
  className?: string
}

export function StatusFilterTabs({ counts, currentGroup = 'all', className }: StatusFilterTabsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (value === 'all') {
      params.delete('statusGroup')
    } else {
      params.set('statusGroup', value)
    }

    // Reset to page 1 when changing tabs
    params.delete('page')

    const queryString = params.toString()
    router.push(queryString ? `/inventory?${queryString}` : '/inventory')
  }

  return (
    <div className="bg-brand-red-600 rounded-lg p-6 shadow-lg">
      <Tabs value={currentGroup} onValueChange={handleTabChange} className={className}>
        <TabsList className="grid w-full grid-cols-3 h-auto p-1.5 bg-white/10 backdrop-blur-sm border border-white/20">
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=inactive]:text-white data-[state=inactive]:hover:bg-white/20 py-3 px-4 gap-2 flex items-center justify-center transition-all group"
          >
            <Car className="h-4 w-4" />
            <span className="font-semibold">All Vehicles</span>
            {counts && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs font-bold group-data-[state=active]:bg-slate-100 group-data-[state=active]:text-slate-900 group-data-[state=inactive]:bg-slate-900 group-data-[state=inactive]:text-white">
                {counts.all}
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger
            value="arrived"
            className="data-[state=active]:bg-white data-[state=active]:text-emerald-900 data-[state=inactive]:text-white data-[state=inactive]:hover:bg-white/20 py-3 px-4 gap-2 flex items-center justify-center transition-all group"
          >
            <Package className="h-4 w-4" />
            <span className="font-semibold">Arrived</span>
            {counts && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs font-bold group-data-[state=active]:bg-emerald-100 group-data-[state=active]:text-emerald-900 group-data-[state=inactive]:bg-slate-900 group-data-[state=inactive]:text-white">
                {counts.arrived}
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger
            value="arriving_soon"
            className="data-[state=active]:bg-white data-[state=active]:text-blue-900 data-[state=inactive]:text-white data-[state=inactive]:hover:bg-white/20 py-3 px-4 gap-2 flex items-center justify-center transition-all group"
          >
            <TruckIcon className="h-4 w-4" />
            <span className="font-semibold">Arriving Soon</span>
            {counts && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs font-bold group-data-[state=active]:bg-brand-blue-100 group-data-[state=active]:text-brand-blue-900 group-data-[state=inactive]:bg-slate-900 group-data-[state=inactive]:text-white">
                {counts.arriving_soon}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}

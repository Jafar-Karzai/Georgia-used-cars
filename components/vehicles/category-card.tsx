'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { ArrowUpRight } from 'lucide-react'
import { useState } from 'react'

interface CategoryCardProps {
  name: string
  slug: string
  exampleModels: string[]
  icon: React.ReactNode
  className?: string
}

export function CategoryCard({
  name,
  slug,
  exampleModels,
  icon,
  className = ''
}: CategoryCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Link
      href={`/inventory?category=${slug}`}
      className={`block group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card className="
        relative overflow-hidden
        bg-gradient-to-br from-background to-muted/30
        border border-border/50
        hover:border-border
        transition-all duration-300
        hover:shadow-xl
        h-full
        p-6 md:p-8
      ">
        {/* Background Icon - Decorative */}
        <div className="absolute -right-4 -bottom-4 opacity-5 transition-all duration-300 group-hover:opacity-10 group-hover:scale-110">
          <div className="text-foreground scale-[3]">
            {icon}
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Icon + Arrow */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20">
              {icon}
            </div>
            <div className={`
              w-8 h-8 rounded-full
              bg-muted/50 backdrop-blur-sm
              flex items-center justify-center
              transition-all duration-300
              ${isHovered ? 'bg-primary scale-110' : ''}
            `}>
              <ArrowUpRight className={`h-4 w-4 transition-all duration-300 ${
                isHovered ? 'text-white translate-x-0.5 -translate-y-0.5' : 'text-muted-foreground'
              }`} />
            </div>
          </div>

          {/* Category Name */}
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3 transition-colors duration-300 group-hover:text-primary">
            {name}
          </h3>

          {/* Example Models */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            {exampleModels.join(', ')}
          </p>
        </div>

        {/* Glassmorphism Overlay on Hover */}
        <div className={`
          absolute inset-0
          bg-gradient-to-br from-primary/5 to-transparent
          transition-opacity duration-300
          pointer-events-none
          ${isHovered ? 'opacity-100' : 'opacity-0'}
        `} />
      </Card>
    </Link>
  )
}

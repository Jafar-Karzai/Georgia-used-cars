'use client'

import Link from 'next/link'

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
  icon,
  className = ''
}: CategoryCardProps) {
  return (
    <Link
      href={`/inventory?category=${slug}`}
      className={`block group ${className}`}
    >
      <div className="alumina-surface rounded-2xl border border-border p-6 text-center card-hover cursor-pointer h-full">
        <div className="icon-circle bg-precision-100 text-precision-900 mx-auto mb-4 transition-transform duration-300 group-hover:scale-110">
          {icon}
        </div>
        <h3 className="font-bold text-sm mb-1">{name}</h3>
      </div>
    </Link>
  )
}

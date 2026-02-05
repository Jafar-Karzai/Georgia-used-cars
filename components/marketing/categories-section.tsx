import { Car, Truck, Gem, Zap } from 'lucide-react'
import { CategoryCard } from '@/components/vehicles/category-card'

/**
 * Categories Section Component
 * Displays vehicle category cards for browsing
 */

interface Category {
  name: string
  slug: string
  exampleModels: string[]
  icon: React.ReactNode
}

interface CategoriesSectionProps {
  eyebrow?: string
  title?: string
  categories?: Category[]
}

const defaultCategories: Category[] = [
  {
    name: 'SUVs',
    slug: 'suv',
    exampleModels: ['Range Rover Sport', 'Mercedes GLE', 'Tesla Model X'],
    icon: <Car className="h-6 w-6" aria-hidden="true" />,
  },
  {
    name: 'Sedans',
    slug: 'sedan',
    exampleModels: ['BMW 5 Series', 'Audi A6', 'Toyota Camry'],
    icon: <Car className="h-6 w-6" aria-hidden="true" />,
  },
  {
    name: 'Trucks',
    slug: 'truck',
    exampleModels: ['Ford F-150', 'Chevrolet Silverado', 'RAM 1500'],
    icon: <Truck className="h-6 w-6" aria-hidden="true" />,
  },
  {
    name: 'Luxury',
    slug: 'luxury',
    exampleModels: ['Bentley Flying Spur', 'Mercedes S-Class', 'Lexus LS'],
    icon: <Gem className="h-6 w-6" aria-hidden="true" />,
  },
  {
    name: 'Sports',
    slug: 'sports',
    exampleModels: ['Porsche 911', 'Audi R8', 'BMW M4'],
    icon: <Zap className="h-6 w-6" aria-hidden="true" />,
  },
  {
    name: 'Electric',
    slug: 'electric',
    exampleModels: ['Tesla Model S', 'Lucid Air', 'BMW i7'],
    icon: <Zap className="h-6 w-6" aria-hidden="true" />,
  },
]

export function CategoriesSection({
  eyebrow = 'Browse By',
  title = 'Vehicle Categories',
  categories = defaultCategories,
}: CategoriesSectionProps) {
  return (
    <section className="py-16 md:py-20" aria-labelledby="categories-heading">
      <div className="max-w-content mx-auto px-4 md:px-6">
        <div className="text-center mb-10">
          <p className="text-2xs uppercase font-bold text-accent tracking-widest mb-2">
            {eyebrow}
          </p>
          <h2
            id="categories-heading"
            className="text-3xl md:text-4xl font-extrabold tracking-tight"
          >
            {title}
          </h2>
        </div>

        <nav aria-label="Vehicle categories">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <CategoryCard
                key={category.slug}
                name={category.name}
                slug={category.slug}
                exampleModels={category.exampleModels}
                icon={category.icon}
              />
            ))}
          </div>
        </nav>
      </div>
    </section>
  )
}

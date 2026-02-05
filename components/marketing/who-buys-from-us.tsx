import { Wrench, Factory, Users } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * Who Buys From Us Section Component
 * Displays the target customer segments
 */

interface CustomerType {
  icon: ReactNode
  title: string
  description: string
}

interface WhoBuysFromUsSectionProps {
  eyebrow?: string
  title?: string
  customers?: CustomerType[]
}

const defaultCustomers: CustomerType[] = [
  {
    icon: <Wrench className="h-6 w-6" />,
    title: 'DIY Enthusiasts',
    description:
      'Car enthusiasts looking for project vehicles to restore, customize, or rebuild.',
  },
  {
    icon: <Factory className="h-6 w-6" />,
    title: 'Parts Dealers',
    description:
      'Automotive parts businesses sourcing quality components from salvage vehicles.',
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: 'Repair Shops',
    description:
      'Professional auto body shops acquiring vehicles for repair and resale.',
  },
]

export function WhoBuysFromUsSection({
  eyebrow = 'Our Customers',
  title = 'Who Buys From Us?',
  customers = defaultCustomers,
}: WhoBuysFromUsSectionProps) {
  return (
    <section className="py-16 md:py-20 bg-secondary/30" aria-labelledby="customers-heading">
      <div className="max-w-content mx-auto px-4 md:px-6">
        <div className="text-center mb-10">
          <p className="text-2xs uppercase font-bold text-accent tracking-widest mb-2">
            {eyebrow}
          </p>
          <h2 id="customers-heading" className="text-3xl font-extrabold tracking-tight">
            {title}
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {customers.map((customer) => (
            <article
              key={customer.title}
              className="alumina-surface rounded-2xl border border-border p-8 text-center card-hover"
            >
              <div
                className="icon-circle bg-precision-100 text-precision-900 mx-auto mb-4"
                aria-hidden="true"
              >
                {customer.icon}
              </div>
              <h3 className="font-bold text-lg mb-2">{customer.title}</h3>
              <p className="text-sm text-muted-foreground">{customer.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

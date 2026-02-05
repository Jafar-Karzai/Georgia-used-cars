/**
 * Stats Strip Component
 * Displays key business statistics in a frosted panel strip
 */

interface Stat {
  label: string
  value: string
}

interface StatsStripProps {
  stats?: Stat[]
}

const defaultStats: Stat[] = [
  { label: 'Hub Location', value: 'Sharjah, UAE' },
  { label: 'Vehicle Type', value: 'Salvage / AS-IS' },
  { label: 'Next Shipment', value: '3 Days' },
  { label: 'Auction Partners', value: 'Copart / IAAI' },
]

export function StatsStrip({ stats = defaultStats }: StatsStripProps) {
  return (
    <section className="frosted-panel border-y" aria-label="Company statistics">
      <div className="max-w-content mx-auto">
        <dl className="grid grid-cols-2 md:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={`p-6 ${index < stats.length - 1 ? 'border-r border-border' : ''}`}
            >
              <dt className="text-2xs uppercase font-bold text-accent tracking-widest mb-1">
                {stat.label}
              </dt>
              <dd className="text-lg font-extrabold text-foreground">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

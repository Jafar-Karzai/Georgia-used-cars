import { BadgeDollarSign, Network, Globe2 } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * Value Propositions Section Component
 * Displays the key advantages of choosing the business
 */

interface ValueProposition {
  icon: ReactNode
  title: string
  description: string
  iconBgClass?: string
  iconTextClass?: string
}

interface ValuePropositionsSectionProps {
  eyebrow?: string
  title?: string
  propositions?: ValueProposition[]
}

const defaultPropositions: ValueProposition[] = [
  {
    icon: <BadgeDollarSign className="w-7 h-7" />,
    title: 'Unbeatable Prices',
    description:
      'Access premium salvage vehicles from US and Canada auctions at a fraction of retail cost. Perfect for budget-conscious buyers.',
    iconBgClass: 'bg-precision-100',
    iconTextClass: 'text-precision-900',
  },
  {
    icon: <Network className="w-7 h-7" />,
    title: 'Trusted Network',
    description:
      'We connect you with reliable repair shops and quality parts suppliers. Benefit from our established industry relationships.',
    iconBgClass: 'bg-action-100',
    iconTextClass: 'text-action-600',
  },
  {
    icon: <Globe2 className="w-7 h-7" />,
    title: 'Import Expertise',
    description:
      'Years of experience importing from US and Canada. We handle all paperwork, shipping, and customs procedures for you.',
    iconBgClass: 'bg-success/10',
    iconTextClass: 'text-success',
  },
]

export function ValuePropositionsSection({
  eyebrow = 'Why Choose Us',
  title = 'The Georgia Advantage',
  propositions = defaultPropositions,
}: ValuePropositionsSectionProps) {
  return (
    <section className="py-16 md:py-20" aria-labelledby="advantages-heading">
      <div className="max-w-content mx-auto px-4 md:px-6">
        <div className="text-center mb-10">
          <p className="text-2xs uppercase font-bold text-accent tracking-widest mb-2">
            {eyebrow}
          </p>
          <h2 id="advantages-heading" className="text-3xl font-extrabold tracking-tight">
            {title}
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {propositions.map((prop) => (
            <article
              key={prop.title}
              className="alumina-surface rounded-2xl border border-border p-8 card-hover"
            >
              <div
                className={`w-14 h-14 rounded-2xl ${prop.iconBgClass} ${prop.iconTextClass} flex items-center justify-center mb-6`}
                aria-hidden="true"
              >
                {prop.icon}
              </div>
              <h3 className="font-extrabold text-xl mb-3">{prop.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{prop.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

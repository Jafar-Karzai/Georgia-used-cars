import { Search, Eye, ShoppingCart, CheckCircle2 } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * How It Works Section Component
 * Displays the step-by-step process for purchasing vehicles
 */

interface Step {
  icon: ReactNode
  number: string
  title: string
  description: string
  isHighlighted?: boolean
}

interface HowItWorksSectionProps {
  eyebrow?: string
  title?: string
  steps?: Step[]
}

const defaultSteps: Step[] = [
  {
    icon: <Search className="w-8 h-8" />,
    number: '01',
    title: 'Browse & Select',
    description: 'Explore our curated inventory with detailed damage reports and photos.',
  },
  {
    icon: <Eye className="w-8 h-8" />,
    number: '02',
    title: 'Inspect in Person',
    description: 'Visit our Sharjah yard to inspect in-stock units before you buy.',
  },
  {
    icon: <ShoppingCart className="w-8 h-8" />,
    number: '03',
    title: 'Complete Purchase',
    description: 'Finalize payment (cash only). We handle all documentation.',
  },
  {
    icon: <CheckCircle2 className="w-8 h-8" />,
    number: '04',
    title: 'Take Delivery',
    description: 'Collect from our yard or arrange delivery anywhere in UAE.',
    isHighlighted: true,
  },
]

export function HowItWorksSection({
  eyebrow = 'Simple Process',
  title = 'How It Works',
  steps = defaultSteps,
}: HowItWorksSectionProps) {
  return (
    <section
      className="py-16 md:py-20 bg-precision-900 text-white"
      aria-labelledby="how-it-works-heading"
    >
      <div className="max-w-content mx-auto px-4 md:px-6">
        <div className="text-center mb-14">
          <p className="text-2xs uppercase font-bold text-precision-400 tracking-widest mb-2">
            {eyebrow}
          </p>
          <h2
            id="how-it-works-heading"
            className="text-3xl md:text-4xl font-extrabold tracking-tight"
          >
            {title}
          </h2>
        </div>

        <ol className="grid md:grid-cols-4 gap-8 list-none">
          {steps.map((step) => (
            <li key={step.number} className="text-center">
              <div
                className={`w-16 h-16 rounded-2xl ${
                  step.isHighlighted ? 'bg-action-600' : 'bg-precision-600'
                } flex items-center justify-center mx-auto mb-6`}
                aria-hidden="true"
              >
                {step.icon}
              </div>
              <p
                className="text-5xl font-black text-precision-800 mb-3 font-mono"
                aria-hidden="true"
              >
                {step.number}
              </p>
              <h3 className="font-bold text-lg mb-2">{step.title}</h3>
              <p className="text-sm text-precision-300">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

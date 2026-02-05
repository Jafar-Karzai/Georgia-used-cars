import Link from 'next/link'
import { Button } from '@/components/ui/button'

/**
 * CTA Banner Component
 * A call-to-action banner with gradient background
 */

interface CTAAction {
  label: string
  href: string
}

interface CTABannerProps {
  title?: string
  subtitle?: string
  primaryAction?: CTAAction
  secondaryAction?: CTAAction
}

export function CTABanner({
  title = 'Ready to Find Your Next Vehicle?',
  subtitle = 'Direct Auction Access - Customs Clearance - UAE-Wide Delivery',
  primaryAction = { label: 'Browse Inventory', href: '/inventory' },
  secondaryAction = { label: 'Contact Sales', href: '/contact' },
}: CTABannerProps) {
  return (
    <section className="px-4 md:px-6 py-16">
      <div className="max-w-content mx-auto hero-gradient rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-3">{title}</h2>
            <p className="text-precision-200 text-sm uppercase tracking-widest font-bold">
              {subtitle}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              asChild
              size="lg"
              className="bg-action-600 hover:bg-action-700 text-white btn-precision"
            >
              <Link href={primaryAction.href}>{primaryAction.label}</Link>
            </Button>
            {secondaryAction && (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-2 border-white/30 hover:border-white/60 text-white bg-transparent hover:bg-white/10"
              >
                <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

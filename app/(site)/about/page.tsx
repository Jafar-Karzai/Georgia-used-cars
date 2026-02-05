import Link from 'next/link'
import {
  Car,
  Home,
  ChevronRight,
  Shield,
  Award,
  Users,
  CheckCircle,
  Globe,
  Truck,
  FileText
} from 'lucide-react'
import { SiteNavbar } from '@/components/layout/site-navbar'
import { CTABanner } from '@/components/marketing'

export const metadata = {
  title: 'About Us | Georgia Used Cars',
  description: 'Your trusted partner in premium salvage vehicle imports from US and Canada auctions. Based in Sharjah, UAE, we specialize in bringing quality vehicles to the Middle East market.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background bg-pattern">
      <SiteNavbar />

      {/* Breadcrumb */}
      <div className="frosted-panel border-x-0 border-t-0 rounded-none">
        <div className="max-w-content mx-auto px-4 md:px-6 py-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-precision-600 transition-colors">
              <Home className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Home</span>
            </Link>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
            <span className="text-foreground font-semibold">About Us</span>
          </nav>
        </div>
      </div>

      <main id="main-content" role="main">
        {/* Hero Section */}
        <section className="py-20 md:py-28 relative overflow-hidden">
          <div className="absolute inset-0 hero-gradient opacity-5" aria-hidden="true" />
          <div className="max-w-content mx-auto px-4 md:px-6 text-center relative">
            <p className="text-2xs uppercase font-bold text-accent tracking-widest mb-3">Trusted Since 2012</p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 text-balance">
              About Georgia Used Cars
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Your trusted partner in premium salvage vehicle imports from US and Canada auctions.
              Based in Sharjah, UAE, we specialize in bringing quality vehicles to the Middle East market.
            </p>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-16 md:py-20" aria-labelledby="story-heading">
          <div className="max-w-content mx-auto px-4 md:px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-2xs uppercase font-bold text-precision-500 tracking-widest mb-2">Our Journey</p>
                <h2 id="story-heading" className="text-3xl md:text-4xl font-extrabold tracking-tight mb-6">Our Story</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Founded with a passion by Hedayatullah Nasimi for quality vehicles and transparent business practices,
                    Georgia Used Cars has become a leading importer of salvage vehicles from North American auctions.
                  </p>
                  <p>
                    We recognized the growing demand for affordable, quality vehicles in the UAE market and
                    saw an opportunity to bridge the gap between American auction houses and Middle Eastern buyers.
                  </p>
                  <p>
                    Our expertise in navigating complex import procedures, combined with our commitment to
                    transparency and customer service, has made us the go-to choice for savvy buyers looking
                    for exceptional value in the used car market.
                  </p>
                </div>
              </div>

              <div className="alumina-surface rounded-2xl p-8 border border-border">
                <div className="grid grid-cols-2 gap-6 text-center relative z-10">
                  <div className="p-4">
                    <div className="text-4xl font-extrabold text-precision-600 mb-2">4500+</div>
                    <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Vehicles Imported</div>
                  </div>
                  <div className="p-4">
                    <div className="text-4xl font-extrabold text-precision-600 mb-2">13+</div>
                    <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Years Experience</div>
                  </div>
                  <div className="p-4">
                    <div className="text-4xl font-extrabold text-precision-600 mb-2">98%</div>
                    <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Satisfaction Rate</div>
                  </div>
                  <div className="p-4">
                    <div className="text-4xl font-extrabold text-precision-600 mb-2">24/7</div>
                    <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Support Available</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Our Values */}
        <section className="py-16 md:py-20 bg-secondary/30" aria-labelledby="values-heading">
          <div className="max-w-content mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <p className="text-2xs uppercase font-bold text-accent tracking-widest mb-2">What Drives Us</p>
              <h2 id="values-heading" className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">Our Values</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                The principles that drive everything we do
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <article className="alumina-surface rounded-2xl p-8 border border-border card-hover text-center">
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-precision-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <Shield className="h-8 w-8 text-precision-600" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Transparency</h3>
                  <p className="text-muted-foreground">
                    We provide complete transparency about vehicle history, condition, and all associated costs.
                    No hidden fees, no surprises.
                  </p>
                </div>
              </article>

              <article className="alumina-surface rounded-2xl p-8 border border-border card-hover text-center">
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-precision-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <Award className="h-8 w-8 text-precision-600" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Quality</h3>
                  <p className="text-muted-foreground">
                    Every vehicle is carefully selected from reputable auction houses and thoroughly inspected
                    to ensure it meets our quality standards.
                  </p>
                </div>
              </article>

              <article className="alumina-surface rounded-2xl p-8 border border-border card-hover text-center">
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-precision-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <Users className="h-8 w-8 text-precision-600" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Customer First</h3>
                  <p className="text-muted-foreground">
                    Your satisfaction is our priority. We provide comprehensive support throughout your
                    vehicle purchase journey.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* Our Process */}
        <section className="py-16 md:py-20" aria-labelledby="process-heading">
          <div className="max-w-content mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <p className="text-2xs uppercase font-bold text-precision-500 tracking-widest mb-2">Simple & Efficient</p>
              <h2 id="process-heading" className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">How We Work</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Our streamlined process from auction to your doorstep
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="relative">
                  <div className="w-20 h-20 bg-precision-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <Globe className="h-10 w-10 text-precision-600" aria-hidden="true" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-precision-900 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2">Auction Selection</h3>
                <p className="text-muted-foreground text-sm">
                  We monitor top US and Canada auction houses daily, selecting vehicles that meet our quality criteria.
                </p>
              </div>

              <div className="text-center">
                <div className="relative">
                  <div className="w-20 h-20 bg-precision-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <CheckCircle className="h-10 w-10 text-precision-600" aria-hidden="true" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-precision-900 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2">Inspection & Purchase</h3>
                <p className="text-muted-foreground text-sm">
                  Detailed inspection reports and strategic bidding to secure the best vehicles at competitive prices.
                </p>
              </div>

              <div className="text-center">
                <div className="relative">
                  <div className="w-20 h-20 bg-precision-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <Truck className="h-10 w-10 text-precision-600" aria-hidden="true" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-precision-900 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2">Shipping & Import</h3>
                <p className="text-muted-foreground text-sm">
                  Professional shipping and customs clearance handling to ensure safe arrival in the UAE.
                </p>
              </div>

              <div className="text-center">
                <div className="relative">
                  <div className="w-20 h-20 bg-precision-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <Car className="h-10 w-10 text-precision-600" aria-hidden="true" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-precision-900 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    4
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2">Delivery</h3>
                <p className="text-muted-foreground text-sm">
                  Final inspection, documentation completion, and delivery to your location or our showroom.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-16 md:py-20 bg-secondary/30" aria-labelledby="why-heading">
          <div className="max-w-content mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <p className="text-2xs uppercase font-bold text-accent tracking-widest mb-2">The Georgia Advantage</p>
              <h2 id="why-heading" className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">Why Choose Georgia Used Cars?</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                What sets us apart in the competitive import market
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-background/50 transition-colors">
                <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-success" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">Extensive Network</h3>
                  <p className="text-muted-foreground text-sm">
                    Direct relationships with major auction houses including Copart, IAAI, and others.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-background/50 transition-colors">
                <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-success" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">Expert Inspection</h3>
                  <p className="text-muted-foreground text-sm">
                    Trained professionals assess every vehicle's condition and potential before bidding.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-background/50 transition-colors">
                <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-success" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">Competitive Pricing</h3>
                  <p className="text-muted-foreground text-sm">
                    Strategic bidding and efficient processes allow us to offer the best market prices.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-background/50 transition-colors">
                <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-success" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">Full Documentation</h3>
                  <p className="text-muted-foreground text-sm">
                    Complete paperwork handling including customs clearance and UAE registration assistance.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-background/50 transition-colors">
                <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-success" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">Warranty Options</h3>
                  <p className="text-muted-foreground text-sm">
                    Optional warranty packages available for additional peace of mind.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-background/50 transition-colors">
                <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-success" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">After-Sales Support</h3>
                  <p className="text-muted-foreground text-sm">
                    Ongoing support for parts, service recommendations, and future vehicle needs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 md:py-20" aria-labelledby="team-heading">
          <div className="max-w-content mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <p className="text-2xs uppercase font-bold text-precision-500 tracking-widest mb-2">Our Experts</p>
              <h2 id="team-heading" className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">Our Team</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Experienced professionals dedicated to your success
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <article className="alumina-surface rounded-2xl p-8 border border-border card-hover text-center">
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-precision-100 rounded-full mx-auto mb-5 flex items-center justify-center">
                    <Users className="h-10 w-10 text-precision-600" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Auction Specialists</h3>
                  <p className="text-muted-foreground text-sm">
                    Expert bidders with years of experience navigating North American auto auctions.
                  </p>
                </div>
              </article>

              <article className="alumina-surface rounded-2xl p-8 border border-border card-hover text-center">
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-precision-100 rounded-full mx-auto mb-5 flex items-center justify-center">
                    <FileText className="h-10 w-10 text-precision-600" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Import Experts</h3>
                  <p className="text-muted-foreground text-sm">
                    Specialists in customs procedures, documentation, and UAE import regulations.
                  </p>
                </div>
              </article>

              <article className="alumina-surface rounded-2xl p-8 border border-border card-hover text-center">
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-precision-100 rounded-full mx-auto mb-5 flex items-center justify-center">
                    <Shield className="h-10 w-10 text-precision-600" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Quality Inspectors</h3>
                  <p className="text-muted-foreground text-sm">
                    Certified inspectors ensuring every vehicle meets our strict quality standards.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <CTABanner />
      </main>
    </div>
  )
}

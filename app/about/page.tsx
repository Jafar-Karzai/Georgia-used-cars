'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Car, 
  Home,
  ChevronRight,
  Shield,
  Award,
  Users,
  TrendingUp,
  CheckCircle,
  Star,
  Globe,
  Truck,
  FileText
} from 'lucide-react'
import { Logo } from '@/components/ui/logo'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo href="/" />
          
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">Home</Link>
            <Link href="/inventory" className="text-muted-foreground hover:text-foreground transition-colors">Inventory</Link>
            <Link href="/about" className="text-foreground font-medium">About</Link>
            <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
          </div>
          
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/inventory">Browse Inventory</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              <Home className="h-4 w-4" />
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">About Us</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            About Georgia Used Cars
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Your trusted partner in premium salvage vehicle imports from US and Canada auctions. 
            Based in Sharjah, UAE, we specialize in bringing quality vehicles to the Middle East market.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Story</h2>
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
            
            <div className="relative">
              <div className="bg-primary/10 rounded-lg p-8">
                <div className="grid grid-cols-2 gap-6 text-center">
                  <div>
                    <div className="text-3xl font-bold text-primary mb-2">4500+</div>
                    <div className="text-sm text-muted-foreground">Vehicles Imported</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary mb-2">13+</div>
                    <div className="text-sm text-muted-foreground">Years Experience</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary mb-2">98%</div>
                    <div className="text-sm text-muted-foreground">Customer Satisfaction</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary mb-2">24/7</div>
                    <div className="text-sm text-muted-foreground">Customer Support</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Values</h2>
            <p className="text-xl text-muted-foreground">
              The principles that drive everything we do
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Transparency</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We provide complete transparency about vehicle history, condition, and all associated costs. 
                  No hidden fees, no surprises.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Award className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Every vehicle is carefully selected from reputable auction houses and thoroughly inspected 
                  to ensure it meets our quality standards.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Customer First</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Your satisfaction is our priority. We provide comprehensive support throughout your 
                  vehicle purchase journey.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Process */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How We Work</h2>
            <p className="text-xl text-muted-foreground">
              Our streamlined process from auction to your doorstep
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">1. Auction Selection</h3>
              <p className="text-muted-foreground text-sm">
                We monitor top US and Canada auction houses daily, selecting vehicles that meet our quality criteria.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">2. Inspection & Purchase</h3>
              <p className="text-muted-foreground text-sm">
                Detailed inspection reports and strategic bidding to secure the best vehicles at competitive prices.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">3. Shipping & Import</h3>
              <p className="text-muted-foreground text-sm">
                Professional shipping and customs clearance handling to ensure safe arrival in the UAE.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Car className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">4. Delivery</h3>
              <p className="text-muted-foreground text-sm">
                Final inspection, documentation completion, and delivery to your location or our showroom.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose Georgia Used Cars?</h2>
            <p className="text-xl text-muted-foreground">
              What sets us apart in the competitive import market
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-emerald-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Extensive Network</h3>
                <p className="text-muted-foreground text-sm">
                  Direct relationships with major auction houses including Copart, IAAI, and others.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-emerald-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Expert Inspection</h3>
                <p className="text-muted-foreground text-sm">
                  Trained professionals assess every vehicle's condition and potential before bidding.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-emerald-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Competitive Pricing</h3>
                <p className="text-muted-foreground text-sm">
                  Strategic bidding and efficient processes allow us to offer the best market prices.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-emerald-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Full Documentation</h3>
                <p className="text-muted-foreground text-sm">
                  Complete paperwork handling including customs clearance and UAE registration assistance.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-emerald-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Warranty Options</h3>
                <p className="text-muted-foreground text-sm">
                  Optional warranty packages available for additional peace of mind.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-emerald-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">After-Sales Support</h3>
                <p className="text-muted-foreground text-sm">
                  Ongoing support for parts, service recommendations, and future vehicle needs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Team</h2>
            <p className="text-xl text-muted-foreground">
              Experienced professionals dedicated to your success
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Auction Specialists</h3>
                <p className="text-muted-foreground text-sm">
                  Expert bidders with years of experience navigating North American auto auctions.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <FileText className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Import Experts</h3>
                <p className="text-muted-foreground text-sm">
                  Specialists in customs procedures, documentation, and UAE import regulations.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Shield className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Quality Inspectors</h3>
                <p className="text-muted-foreground text-sm">
                  Certified inspectors ensuring every vehicle meets our strict quality standards.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Find Your Next Vehicle?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Browse our current inventory or contact us to discuss your specific requirements. 
            We're here to help you find the perfect vehicle at the right price.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/inventory">
                <Car className="h-5 w-5 mr-2" />
                Browse Inventory
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/contact">
                Contact Our Team
                <ChevronRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
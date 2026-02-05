'use client'

import Link from 'next/link'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { fetchVehicleById } from '@/lib/api/vehicles-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Car,
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle,
  AlertTriangle,
  Home,
  ChevronRight,
  MessageSquare
} from 'lucide-react'
import { SiteNavbar } from '@/components/layout/site-navbar'

interface ContactForm {
  customer_name: string
  email: string
  phone: string
  inquiry_type: 'general' | 'vehicle_specific' | 'service' | 'financing'
  subject: string
  message: string
  vehicle_id?: string
  preferred_contact_method: 'phone' | 'email' | 'whatsapp'
  marketing_consent: boolean
}

interface Vehicle {
  id: string
  year: number
  make: string
  model: string
  price: number
}

function ContactPageContent() {
  const searchParams = useSearchParams()
  const vehicleId = searchParams.get('vehicle')
  const inquiryType = searchParams.get('type') || 'general'

  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<ContactForm>({
    customer_name: '',
    email: '',
    phone: '',
    inquiry_type: inquiryType as ContactForm['inquiry_type'],
    subject: '',
    message: '',
    vehicle_id: vehicleId || undefined,
    preferred_contact_method: 'email',
    marketing_consent: false
  })

  useEffect(() => {
    if (vehicleId) {
      loadVehicle()
      setForm(prev => ({
        ...prev,
        inquiry_type: 'vehicle_specific',
        vehicle_id: vehicleId
      }))
    }
  }, [vehicleId])

  const loadVehicle = async () => {
    if (!vehicleId) return

    try {
      const response = await fetchVehicleById(vehicleId)
      if (response.success && response.data) {
        setVehicle(response.data)
        setForm(prev => ({
          ...prev,
          subject: `Inquiry about ${response.data.year} ${response.data.make} ${response.data.model}`
        }))
      }
    } catch (error) {
      console.error('Failed to load vehicle:', error)
    }
  }

  const handleInputChange = (field: keyof ContactForm, value: string | boolean | undefined) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!form.customer_name || !form.email || !form.phone || !form.subject || !form.message) {
        throw new Error('Please fill in all required fields')
      }

      const response = await fetch('/api/public/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_name: form.customer_name,
          email: form.email,
          phone: form.phone,
          inquiry_type: form.inquiry_type,
          subject: form.subject,
          message: form.message,
          vehicle_id: form.vehicle_id,
          preferred_contact_method: form.preferred_contact_method,
          marketing_consent: form.marketing_consent
        }),
      })

      const result = await response.json()

      if (result.success) {
        setSubmitted(true)
      } else {
        throw new Error(result.error || 'Failed to submit inquiry')
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit inquiry. Please try again.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background bg-pattern">
        <SiteNavbar />

        <div className="max-w-content mx-auto px-4 md:px-6 py-20 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-success" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-4">Thank You!</h1>
            <p className="text-muted-foreground mb-8">
              Your inquiry has been submitted successfully. We'll get back to you within 24 hours.
            </p>
            <div className="space-y-3">
              <Button asChild className="w-full bg-precision-900 hover:bg-precision-800 py-6 rounded-xl font-bold uppercase tracking-wider btn-precision">
                <Link href="/inventory">
                  <Car className="h-5 w-5 mr-2" />
                  Browse More Vehicles
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full py-6 rounded-xl font-bold uppercase tracking-wider border-2">
                <Link href="/">Back to Home</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

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
            <span className="text-foreground font-semibold">Contact Us</span>
          </nav>
        </div>
      </div>

      <main id="main-content" role="main">
        {/* Header */}
        <section className="py-12 md:py-16">
          <div className="max-w-content mx-auto px-4 md:px-6 text-center">
            <p className="text-2xs uppercase font-bold text-accent tracking-widest mb-3">Get In Touch</p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">Contact Us</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get in touch with our team for vehicle inquiries, quotes, or any questions about our services.
            </p>
          </div>
        </section>

        {/* Contact Content */}
        <section className="pb-16 md:pb-20">
          <div className="max-w-content mx-auto px-4 md:px-6">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Contact Information */}
              <div className="space-y-6">
                <div className="alumina-surface rounded-2xl border border-border overflow-hidden">
                  <div className="p-5 border-b border-border">
                    <h2 className="font-extrabold flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-precision-600" aria-hidden="true" />
                      Get In Touch
                    </h2>
                  </div>
                  <div className="p-5 space-y-5 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-precision-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Phone className="h-5 w-5 text-precision-600" aria-hidden="true" />
                      </div>
                      <div>
                        <div className="text-2xs uppercase font-bold text-muted-foreground tracking-wider">Phone</div>
                        <a href="tel:+971555467220" className="font-semibold hover:text-precision-600 transition-colors">
                          +971 55 546 7220
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-precision-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Mail className="h-5 w-5 text-precision-600" aria-hidden="true" />
                      </div>
                      <div>
                        <div className="text-2xs uppercase font-bold text-muted-foreground tracking-wider">Email</div>
                        <a href="mailto:info@georgiacars.com" className="font-semibold hover:text-precision-600 transition-colors">
                          info@georgiacars.com
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-precision-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-5 w-5 text-precision-600" aria-hidden="true" />
                      </div>
                      <div>
                        <div className="text-2xs uppercase font-bold text-muted-foreground tracking-wider">Location</div>
                        <div className="font-semibold">Sharjah, UAE</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-precision-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Clock className="h-5 w-5 text-precision-600" aria-hidden="true" />
                      </div>
                      <div>
                        <div className="text-2xs uppercase font-bold text-muted-foreground tracking-wider">Business Hours</div>
                        <div className="font-semibold text-sm">
                          Sun - Thu: 9:00 AM - 6:00 PM<br />
                          Fri - Sat: 10:00 AM - 4:00 PM
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vehicle Info (if specific vehicle inquiry) */}
                {vehicle && (
                  <div className="alumina-surface rounded-2xl border border-border border-precision-200 overflow-hidden">
                    <div className="p-5 border-b border-border bg-precision-50">
                      <h2 className="font-extrabold flex items-center gap-2">
                        <Car className="w-4 h-4 text-precision-600" aria-hidden="true" />
                        Vehicle Inquiry
                      </h2>
                    </div>
                    <div className="p-5 relative z-10">
                      <div className="font-bold text-lg mb-1">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </div>
                      <div className="text-2xl font-extrabold text-precision-600 mb-4">
                        {formatCurrency(vehicle.price)}
                      </div>
                      <Button asChild variant="outline" size="sm" className="w-full rounded-xl font-bold border-2">
                        <Link href={`/inventory/${vehicle.id}`}>
                          View Vehicle Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Contact Form */}
              <div className="lg:col-span-2">
                <div className="alumina-surface rounded-2xl border border-border overflow-hidden">
                  <div className="p-5 border-b border-border">
                    <h2 className="font-extrabold flex items-center gap-2">
                      <Send className="w-4 h-4 text-precision-600" aria-hidden="true" />
                      Send us a Message
                    </h2>
                  </div>
                  <div className="p-5 md:p-6 relative z-10">
                    {error && (
                      <Alert variant="destructive" className="mb-6 rounded-xl">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Basic Information */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="customer_name" className="text-2xs uppercase font-bold text-muted-foreground tracking-wider">
                            Full Name *
                          </Label>
                          <Input
                            id="customer_name"
                            type="text"
                            value={form.customer_name}
                            onChange={(e) => handleInputChange('customer_name', e.target.value)}
                            required
                            className="mt-2 bg-muted/50 border-border rounded-xl px-4 py-3 font-semibold"
                          />
                        </div>

                        <div>
                          <Label htmlFor="email" className="text-2xs uppercase font-bold text-muted-foreground tracking-wider">
                            Email Address *
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={form.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            required
                            className="mt-2 bg-muted/50 border-border rounded-xl px-4 py-3 font-semibold"
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="phone" className="text-2xs uppercase font-bold text-muted-foreground tracking-wider">
                            Phone Number *
                          </Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={form.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            required
                            className="mt-2 bg-muted/50 border-border rounded-xl px-4 py-3 font-semibold"
                          />
                        </div>

                        <div>
                          <Label htmlFor="preferred_contact_method" className="text-2xs uppercase font-bold text-muted-foreground tracking-wider">
                            Preferred Contact Method
                          </Label>
                          <Select
                            value={form.preferred_contact_method}
                            onValueChange={(value) => handleInputChange('preferred_contact_method', value)}
                          >
                            <SelectTrigger className="mt-2 bg-muted/50 border-border rounded-xl px-4 py-3 font-semibold h-auto">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="phone">Phone Call</SelectItem>
                              <SelectItem value="whatsapp">WhatsApp</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Inquiry Details */}
                      <div>
                        <Label htmlFor="inquiry_type" className="text-2xs uppercase font-bold text-muted-foreground tracking-wider">
                          Inquiry Type
                        </Label>
                        <Select
                          value={form.inquiry_type}
                          onValueChange={(value) => handleInputChange('inquiry_type', value)}
                        >
                          <SelectTrigger className="mt-2 bg-muted/50 border-border rounded-xl px-4 py-3 font-semibold h-auto">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General Inquiry</SelectItem>
                            <SelectItem value="vehicle_specific">Vehicle Specific</SelectItem>
                            <SelectItem value="service">Service Question</SelectItem>
                            <SelectItem value="financing">Financing</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="subject" className="text-2xs uppercase font-bold text-muted-foreground tracking-wider">
                          Subject *
                        </Label>
                        <Input
                          id="subject"
                          type="text"
                          value={form.subject}
                          onChange={(e) => handleInputChange('subject', e.target.value)}
                          placeholder="Brief description of your inquiry"
                          required
                          className="mt-2 bg-muted/50 border-border rounded-xl px-4 py-3 font-semibold"
                        />
                      </div>

                      <div>
                        <Label htmlFor="message" className="text-2xs uppercase font-bold text-muted-foreground tracking-wider">
                          Message *
                        </Label>
                        <Textarea
                          id="message"
                          value={form.message}
                          onChange={(e) => handleInputChange('message', e.target.value)}
                          placeholder="Please provide details about your inquiry..."
                          rows={5}
                          required
                          className="mt-2 bg-muted/50 border-border rounded-xl px-4 py-3 font-semibold resize-none"
                        />
                      </div>

                      {/* Consent */}
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="marketing_consent"
                          checked={form.marketing_consent}
                          onCheckedChange={(checked) => handleInputChange('marketing_consent', checked === true)}
                          className="mt-0.5"
                        />
                        <Label htmlFor="marketing_consent" className="text-sm leading-relaxed text-muted-foreground cursor-pointer">
                          I agree to receive marketing communications and updates about new vehicles and services from Georgia Used Cars.
                        </Label>
                      </div>

                      {/* Submit Button */}
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-precision-900 hover:bg-precision-800 text-white py-6 rounded-xl font-bold uppercase tracking-widest btn-precision"
                      >
                        {loading ? (
                          'Sending...'
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 md:py-20 bg-secondary/30" aria-labelledby="faq-heading">
          <div className="max-w-content mx-auto px-4 md:px-6">
            <div className="text-center mb-10">
              <p className="text-2xs uppercase font-bold text-precision-500 tracking-widest mb-2">Common Questions</p>
              <h2 id="faq-heading" className="text-3xl font-extrabold tracking-tight">Frequently Asked Questions</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <article className="alumina-surface rounded-2xl p-6 border border-border card-hover">
                <div className="relative z-10">
                  <h3 className="text-lg font-bold mb-3">How do I place an order?</h3>
                  <p className="text-muted-foreground">
                    Contact us with the vehicle details you're interested in. We'll provide a quote and guide you through our import process from auction to delivery.
                  </p>
                </div>
              </article>

              <article className="alumina-surface rounded-2xl p-6 border border-border card-hover">
                <div className="relative z-10">
                  <h3 className="text-lg font-bold mb-3">What's included in the price?</h3>
                  <p className="text-muted-foreground">
                    Our prices typically include auction fees, basic documentation, and coordination. Shipping, customs, and UAE registration are additional costs.
                  </p>
                </div>
              </article>

              <article className="alumina-surface rounded-2xl p-6 border border-border card-hover">
                <div className="relative z-10">
                  <h3 className="text-lg font-bold mb-3">How long does import take?</h3>
                  <p className="text-muted-foreground">
                    Import timeline varies by location and shipping method, typically 4-8 weeks from auction purchase to arrival in UAE.
                  </p>
                </div>
              </article>

              <article className="alumina-surface rounded-2xl p-6 border border-border card-hover">
                <div className="relative z-10">
                  <h3 className="text-lg font-bold mb-3">Can I inspect before buying?</h3>
                  <p className="text-muted-foreground">
                    We provide detailed photos and condition reports. For vehicles already in UAE, physical inspection can be arranged at our facility.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default function ContactPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background bg-pattern" />}>
      <ContactPageContent />
    </Suspense>
  )
}

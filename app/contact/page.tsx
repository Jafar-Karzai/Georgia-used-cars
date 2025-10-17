'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { VehicleService } from '@/lib/services/vehicles'
import { InquiryService } from '@/lib/services/inquiries'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  ChevronRight
} from 'lucide-react'
import { Logo } from '@/components/ui/logo'

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

export default function ContactPage() {
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
      const response = await VehicleService.getById(vehicleId)
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

  const handleInputChange = (field: keyof ContactForm, value: any) => {
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
      // Validate required fields
      if (!form.customer_name || !form.email || !form.phone || !form.subject || !form.message) {
        throw new Error('Please fill in all required fields')
      }

      // Create inquiry
      const inquiryData = {
        customer_name: form.customer_name,
        email: form.email,
        phone: form.phone,
        inquiry_type: form.inquiry_type,
        subject: form.subject,
        message: form.message,
        vehicle_id: form.vehicle_id,
        preferred_contact_method: form.preferred_contact_method,
        status: 'new' as const,
        priority: form.inquiry_type === 'vehicle_specific' ? 'high' as const : 'medium' as const,
        source: 'website' as const
      }

      const response = await InquiryService.create(inquiryData)
      
      if (response.success) {
        setSubmitted(true)
      } else {
        throw new Error(response.error || 'Failed to submit inquiry')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit inquiry. Please try again.')
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
      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Logo href="/" />
            
            <div className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">Home</Link>
              <Link href="/inventory" className="text-muted-foreground hover:text-foreground transition-colors">Inventory</Link>
              <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">About</Link>
              <Link href="/contact" className="text-foreground font-medium">Contact</Link>
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-md mx-auto">
            <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-4">Thank You!</h1>
            <p className="text-muted-foreground mb-6">
              Your inquiry has been submitted successfully. We'll get back to you within 24 hours.
            </p>
            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/inventory">Browse More Vehicles</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/">Back to Home</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Car className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">Georgia Used Cars</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">Home</Link>
            <Link href="/inventory" className="text-muted-foreground hover:text-foreground transition-colors">Inventory</Link>
            <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">About</Link>
            <Link href="/contact" className="text-foreground font-medium">Contact</Link>
          </div>
          
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/inventory">Browse Inventory</Link>
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
            <span className="text-foreground font-medium">Contact Us</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get in touch with our team for vehicle inquiries, quotes, or any questions about our services.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Get In Touch</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">Phone</div>
                    <div className="text-muted-foreground">+971 XX XXX XXXX</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">Email</div>
                    <div className="text-muted-foreground">info@georgiaused.com</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">Location</div>
                    <div className="text-muted-foreground">Sharjah, UAE</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">Business Hours</div>
                    <div className="text-muted-foreground">
                      Sun - Thu: 9:00 AM - 6:00 PM<br />
                      Fri - Sat: 10:00 AM - 4:00 PM
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vehicle Info (if specific vehicle inquiry) */}
            {vehicle && (
              <Card>
                <CardHeader>
                  <CardTitle>Vehicle Inquiry</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="font-medium">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      {formatCurrency(vehicle.price)}
                    </div>
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link href={`/inventory/${vehicle.id}`}>
                        View Vehicle Details
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Send us a Message</CardTitle>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customer_name">Full Name *</Label>
                      <Input
                        id="customer_name"
                        type="text"
                        value={form.customer_name}
                        onChange={(e) => handleInputChange('customer_name', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={form.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="preferred_contact_method">Preferred Contact Method</Label>
                      <Select
                        value={form.preferred_contact_method}
                        onValueChange={(value) => handleInputChange('preferred_contact_method', value)}
                      >
                        <SelectTrigger>
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
                    <Label htmlFor="inquiry_type">Inquiry Type</Label>
                    <Select
                      value={form.inquiry_type}
                      onValueChange={(value) => handleInputChange('inquiry_type', value)}
                    >
                      <SelectTrigger>
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
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      type="text"
                      value={form.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      placeholder="Brief description of your inquiry"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      value={form.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      placeholder="Please provide details about your inquiry..."
                      rows={5}
                      required
                    />
                  </div>

                  {/* Consent */}
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="marketing_consent"
                      checked={form.marketing_consent}
                      onCheckedChange={(checked) => handleInputChange('marketing_consent', checked)}
                    />
                    <Label htmlFor="marketing_consent" className="text-sm leading-5">
                      I agree to receive marketing communications and updates about new vehicles and services from Georgia Used Cars.
                    </Label>
                  </div>

                  {/* Submit Button */}
                  <Button type="submit" disabled={loading} className="w-full">
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
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How do I place an order?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Contact us with the vehicle details you're interested in. We'll provide a quote and guide you through our import process from auction to delivery.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What's included in the price?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Our prices typically include auction fees, basic documentation, and coordination. Shipping, customs, and UAE registration are additional costs.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How long does import take?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Import timeline varies by location and shipping method, typically 4-8 weeks from auction purchase to arrival in UAE.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I inspect before buying?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We provide detailed photos and condition reports. For vehicles already in UAE, physical inspection can be arranged at our facility.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
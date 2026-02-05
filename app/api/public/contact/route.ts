import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface ContactFormData {
  customer_name: string
  email: string
  phone: string
  inquiry_type: 'general' | 'vehicle_specific' | 'service' | 'financing'
  subject: string
  message: string
  vehicle_id?: string
  preferred_contact_method: 'phone' | 'email' | 'whatsapp'
  marketing_consent?: boolean
}

export async function POST(request: NextRequest) {
  try {
    let formData: ContactFormData
    try {
      const body = await request.text()
      if (!body.trim()) {
        return NextResponse.json(
          { success: false, error: 'Request body is required' },
          { status: 400 }
        )
      }
      formData = JSON.parse(body)
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!formData.customer_name || !formData.email || !formData.phone || !formData.subject || !formData.message) {
      return NextResponse.json(
        { success: false, error: 'Please fill in all required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid email address' },
        { status: 400 }
      )
    }

    // Find or create customer by email
    let customer = await prisma.customer.findFirst({
      where: { email: formData.email.toLowerCase() }
    })

    if (!customer) {
      // Create new customer
      customer = await prisma.customer.create({
        data: {
          fullName: formData.customer_name,
          email: formData.email.toLowerCase(),
          phone: formData.phone,
          marketingConsent: formData.marketing_consent || false
        }
      })
    } else {
      // Update customer with latest info if needed
      if (formData.phone && formData.phone !== customer.phone) {
        customer = await prisma.customer.update({
          where: { id: customer.id },
          data: {
            phone: formData.phone,
            marketingConsent: formData.marketing_consent || customer.marketingConsent
          }
        })
      }
    }

    // Create inquiry linked to customer
    const inquiry = await prisma.inquiry.create({
      data: {
        customerId: customer.id,
        vehicleId: formData.vehicle_id || null,
        source: 'website',
        subject: formData.subject,
        message: formData.message,
        priority: formData.inquiry_type === 'vehicle_specific' ? 'high' : 'medium',
        status: 'new'
      }
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          inquiry_id: inquiry.id,
          customer_id: customer.id
        }
      },
      { status: 201 }
    )

  } catch (error: unknown) {
    console.error('Error in POST /api/public/contact:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit inquiry. Please try again.' },
      { status: 500 }
    )
  }
}

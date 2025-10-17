// This is an example component showing how to use the blue and red brand colors
// You can reference this for future components

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Car, Phone, AlertTriangle, CheckCircle, Star } from 'lucide-react'

export function ColorExamples() {
  return (
    <div className="space-y-8 p-8">
      <h2 className="text-2xl font-bold">Georgia Used Cars - Color Usage Examples</h2>
      
      {/* Primary Blue (Current) */}
      <section className="space-y-4">
        <h3 className="text-xl font-semibold">Primary Blue (Main Brand Color)</h3>
        <div className="flex flex-wrap gap-4">
          <Button>Primary Button</Button>
          <Button variant="outline">Outline Button</Button>
          <Badge className="bg-primary text-primary-foreground">Primary Badge</Badge>
          <div className="text-primary">Primary Text</div>
        </div>
      </section>

      {/* Accent Red (New) */}
      <section className="space-y-4">
        <h3 className="text-xl font-semibold">Accent Red (Secondary Brand Color)</h3>
        <div className="flex flex-wrap gap-4">
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">Red Button</Button>
          <Button variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">Red Outline</Button>
          <Badge className="bg-accent text-accent-foreground">Accent Badge</Badge>
          <div className="text-accent">Accent Red Text</div>
        </div>
      </section>

      {/* Brand Color Variants */}
      <section className="space-y-4">
        <h3 className="text-xl font-semibold">Brand Color Variants</h3>
        
        {/* Blue Variants */}
        <div className="space-y-2">
          <h4 className="font-medium">Blue Variants:</h4>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-brand-blue-100 text-brand-blue-900 border border-brand-blue-200">Light Blue</Badge>
            <Badge className="bg-brand-blue-500 text-white">Medium Blue</Badge>
            <Badge className="bg-brand-blue-700 text-white">Dark Blue</Badge>
          </div>
        </div>

        {/* Red Variants */}
        <div className="space-y-2">
          <h4 className="font-medium">Red Variants:</h4>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-brand-red-100 text-brand-red-900 border border-brand-red-200">Light Red</Badge>
            <Badge className="bg-brand-red-500 text-white">Medium Red</Badge>
            <Badge className="bg-brand-red-700 text-white">Dark Red</Badge>
          </div>
        </div>
      </section>

      {/* Contextual Usage Examples */}
      <section className="space-y-4">
        <h3 className="text-xl font-semibold">Contextual Usage Examples</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          {/* Success/Available - Keep Green */}
          <Card className="border-emerald-200">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <CardTitle className="text-emerald-700">Vehicle Available</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Badge className="bg-emerald-100 text-emerald-800">Available</Badge>
            </CardContent>
          </Card>

          {/* Urgent/Important - Use Red */}
          <Card className="border-brand-red-200">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-brand-red-500" />
                <CardTitle className="text-brand-red-700">Urgent Inquiry</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Badge className="bg-brand-red-100 text-brand-red-800">High Priority</Badge>
            </CardContent>
          </Card>

          {/* Featured/Special - Use Blue */}
          <Card className="border-brand-blue-200">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-brand-blue-500" />
                <CardTitle className="text-brand-blue-700">Featured Vehicle</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Badge className="bg-brand-blue-100 text-brand-blue-800">Featured</Badge>
            </CardContent>
          </Card>

          {/* Call to Action - Use Red for Urgency */}
          <Card className="border-brand-red-200">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-brand-red-500" />
                <CardTitle className="text-brand-red-700">Limited Time Offer</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="bg-brand-red-500 hover:bg-brand-red-600 text-white w-full">
                Call Now!
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Alerts */}
      <section className="space-y-4">
        <h3 className="text-xl font-semibold">Alert Examples</h3>
        
        <Alert className="border-brand-blue-200 bg-brand-blue-50">
          <Car className="h-4 w-4 text-brand-blue-600" />
          <AlertDescription className="text-brand-blue-800">
            New vehicles added to inventory this week!
          </AlertDescription>
        </Alert>

        <Alert className="border-brand-red-200 bg-brand-red-50">
          <AlertTriangle className="h-4 w-4 text-brand-red-600" />
          <AlertDescription className="text-brand-red-800">
            Limited time: Special pricing on selected vehicles ending soon!
          </AlertDescription>
        </Alert>
      </section>
    </div>
  )
}

/* 
USAGE GUIDELINES:

1. PRIMARY BLUE (Current primary):
   - Main navigation
   - Primary buttons
   - Links
   - Main brand elements

2. ACCENT RED (New accent):
   - Call-to-action buttons
   - Urgent notifications
   - Special offers/deals
   - Important badges
   - Emergency or high-priority items

3. SEMANTIC COLORS (Keep existing):
   - Green: Success, available, completed
   - Yellow/Amber: Warning, pending
   - Red destructive: Errors, unavailable

4. USAGE PATTERNS:
   - Use blue as the dominant color (70-80%)
   - Use red sparingly for emphasis (10-20%)
   - Maintain green for success states
   - Ensure sufficient contrast for accessibility

5. RECOMMENDED COMBINATIONS:
   - Blue primary + Red accent buttons
   - Blue headers + Red call-to-action
   - Blue borders + Red highlights
   - Blue icons + Red badges for urgency
*/
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo, LogoFull, LogoCompact, LogoIcon, LogoAdmin } from '@/components/ui/logo'

export default function LogoDemoPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Georgia Used Cars - Logo System</h1>
          <p className="text-muted-foreground">
            Our comprehensive logo system with blue and red brand colors
          </p>
        </div>

        {/* Default Logo */}
        <Card>
          <CardHeader>
            <CardTitle>Default Logo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-6 bg-background border rounded-lg">
              <Logo />
            </div>
            <p className="text-sm text-muted-foreground">
              Primary logo for main navigation and headers
            </p>
          </CardContent>
        </Card>

        {/* Full Logo with Tagline */}
        <Card>
          <CardHeader>
            <CardTitle>Full Logo with Tagline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-6 bg-background border rounded-lg">
              <LogoFull />
            </div>
            <p className="text-sm text-muted-foreground">
              Complete logo with "Premium Imports" tagline for special occasions
            </p>
          </CardContent>
        </Card>

        {/* Compact Logo */}
        <Card>
          <CardHeader>
            <CardTitle>Compact Logo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-6 bg-background border rounded-lg">
              <LogoCompact />
            </div>
            <p className="text-sm text-muted-foreground">
              Smaller version for footers and constrained spaces
            </p>
          </CardContent>
        </Card>

        {/* Icon Only */}
        <Card>
          <CardHeader>
            <CardTitle>Icon Only</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-6 bg-background border rounded-lg">
              <LogoIcon />
            </div>
            <p className="text-sm text-muted-foreground">
              Icon-only version for mobile or very small spaces
            </p>
          </CardContent>
        </Card>

        {/* Admin Logo */}
        <Card>
          <CardHeader>
            <CardTitle>Admin Panel Logo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-6 bg-sidebar border rounded-lg">
              <LogoAdmin />
            </div>
            <p className="text-sm text-muted-foreground">
              Specialized version for admin sidebar with sidebar colors
            </p>
          </CardContent>
        </Card>

        {/* Color Variations */}
        <Card>
          <CardHeader>
            <CardTitle>Color Theme</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Light Background</h4>
              <div className="p-6 bg-background border rounded-lg">
                <Logo />
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3">Dark Background</h4>
              <div className="p-6 bg-foreground border rounded-lg">
                <div className="dark">
                  <Logo />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Brand Colors */}
        <Card>
          <CardHeader>
            <CardTitle>Brand Colors Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="w-16 h-16 rounded-lg mx-auto mb-2" style={{ backgroundColor: 'hsl(var(--primary))' }} />
                <p className="text-xs font-medium">Primary Blue</p>
                <p className="text-xs text-muted-foreground">Main brand color</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-lg mx-auto mb-2" style={{ backgroundColor: 'hsl(var(--accent))' }} />
                <p className="text-xs font-medium">Accent Red</p>
                <p className="text-xs text-muted-foreground">Secondary accent</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-lg mx-auto mb-2" style={{ backgroundColor: 'hsl(var(--foreground))' }} />
                <p className="text-xs font-medium">Foreground</p>
                <p className="text-xs text-muted-foreground">Text color</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 border-2 rounded-lg mx-auto mb-2" style={{ backgroundColor: 'hsl(var(--background))' }} />
                <p className="text-xs font-medium">Background</p>
                <p className="text-xs text-muted-foreground">Base background</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <ul className="space-y-2 text-sm">
              <li><strong>Default Logo:</strong> Use in main navigation, headers, and primary brand placements</li>
              <li><strong>Compact Logo:</strong> Use in footers, secondary navigation, or space-constrained areas</li>
              <li><strong>Icon Only:</strong> Use in mobile navigation collapsed states or as favicons</li>
              <li><strong>Admin Logo:</strong> Exclusively for admin panel sidebar and admin-related interfaces</li>
              <li><strong>Colors:</strong> Blue as primary (70-80%), red as accent (10-20%)</li>
              <li><strong>GUC Initials:</strong> Georgia Used Cars abbreviated for compact recognition</li>
              <li><strong>Car Icon:</strong> Represents automotive industry focus</li>
              <li><strong>Red Dot:</strong> Accent element for visual interest and brand recognition</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
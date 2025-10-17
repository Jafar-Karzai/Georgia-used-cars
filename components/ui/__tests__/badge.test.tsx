import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge, badgeVariants } from '../badge'

describe('Badge', () => {
  describe('Basic Rendering', () => {
    it('should render badge with children', () => {
      render(<Badge>Test Badge</Badge>)
      
      expect(screen.getByText('Test Badge')).toBeInTheDocument()
    })

    it('should render as a div element', () => {
      render(<Badge>Test Badge</Badge>)
      
      const badge = screen.getByText('Test Badge')
      expect(badge.tagName).toBe('DIV')
    })

    it('should apply base badge classes', () => {
      render(<Badge>Test Badge</Badge>)
      
      const badge = screen.getByText('Test Badge')
      expect(badge).toHaveClass(
        'inline-flex',
        'items-center',
        'rounded-md',
        'border',
        'px-2.5',
        'py-0.5',
        'text-xs',
        'font-semibold',
        'transition-colors',
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-ring',
        'focus:ring-offset-2'
      )
    })
  })

  describe('Variant Styling', () => {
    it('should apply default variant styles by default', () => {
      render(<Badge>Default Badge</Badge>)
      
      const badge = screen.getByText('Default Badge')
      expect(badge).toHaveClass(
        'border-transparent',
        'bg-primary',
        'text-primary-foreground',
        'shadow',
        'hover:bg-primary/80'
      )
    })

    it('should apply secondary variant styles', () => {
      render(<Badge variant="secondary">Secondary Badge</Badge>)
      
      const badge = screen.getByText('Secondary Badge')
      expect(badge).toHaveClass(
        'border-transparent',
        'bg-secondary',
        'text-secondary-foreground',
        'hover:bg-secondary/80'
      )
    })

    it('should apply destructive variant styles', () => {
      render(<Badge variant="destructive">Destructive Badge</Badge>)
      
      const badge = screen.getByText('Destructive Badge')
      expect(badge).toHaveClass(
        'border-transparent',
        'bg-destructive',
        'text-destructive-foreground',
        'shadow',
        'hover:bg-destructive/80'
      )
    })

    it('should apply outline variant styles', () => {
      render(<Badge variant="outline">Outline Badge</Badge>)
      
      const badge = screen.getByText('Outline Badge')
      expect(badge).toHaveClass('text-foreground')
      // Outline variant only adds text-foreground, border styling comes from base
    })
  })

  describe('Custom Styling', () => {
    it('should merge custom className with default classes', () => {
      render(<Badge className="custom-class bg-red-500">Custom Badge</Badge>)
      
      const badge = screen.getByText('Custom Badge')
      expect(badge).toHaveClass('custom-class')
      expect(badge).toHaveClass('bg-red-500')
      // Should still have base classes
      expect(badge).toHaveClass('inline-flex', 'items-center', 'rounded-md')
    })

    it('should allow custom className to override default styles', () => {
      render(<Badge className="bg-custom-color">Override Badge</Badge>)
      
      const badge = screen.getByText('Override Badge')
      expect(badge).toHaveClass('bg-custom-color')
    })

    it('should combine variant and custom className', () => {
      render(
        <Badge variant="secondary" className="custom-secondary">
          Combined Badge
        </Badge>
      )
      
      const badge = screen.getByText('Combined Badge')
      expect(badge).toHaveClass('custom-secondary')
      expect(badge).toHaveClass('bg-secondary', 'text-secondary-foreground')
    })
  })

  describe('HTML Attributes', () => {
    it('should pass through HTML div attributes', () => {
      render(
        <Badge 
          data-testid="test-badge" 
          id="badge-id"
          role="status"
        >
          Attribute Badge
        </Badge>
      )
      
      const badge = screen.getByTestId('test-badge')
      expect(badge).toHaveAttribute('id', 'badge-id')
      expect(badge).toHaveAttribute('role', 'status')
    })

    it('should handle onClick events', () => {
      const handleClick = vi.fn()
      render(<Badge onClick={handleClick}>Clickable Badge</Badge>)
      
      const badge = screen.getByText('Clickable Badge')
      badge.click()
      
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should handle aria attributes', () => {
      render(
        <Badge 
          aria-label="Status badge"
          aria-describedby="badge-description"
        >
          Accessible Badge
        </Badge>
      )
      
      const badge = screen.getByText('Accessible Badge')
      expect(badge).toHaveAttribute('aria-label', 'Status badge')
      expect(badge).toHaveAttribute('aria-describedby', 'badge-description')
    })
  })

  describe('Content Types', () => {
    it('should render text content', () => {
      render(<Badge>Simple Text</Badge>)
      
      expect(screen.getByText('Simple Text')).toBeInTheDocument()
    })

    it('should render JSX content', () => {
      render(
        <Badge>
          <span>Complex</span> <strong>Content</strong>
        </Badge>
      )
      
      expect(screen.getByText('Complex')).toBeInTheDocument()
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('should render with icons', () => {
      const IconComponent = () => <svg data-testid="test-icon" />
      
      render(
        <Badge>
          <IconComponent /> With Icon
        </Badge>
      )
      
      expect(screen.getByTestId('test-icon')).toBeInTheDocument()
      expect(screen.getByText('With Icon')).toBeInTheDocument()
    })

    it('should handle empty content', () => {
      render(<Badge />)
      
      // Should render empty badge
      const badge = document.querySelector('.inline-flex')
      expect(badge).toBeInTheDocument()
    })

    it('should handle numeric content', () => {
      render(<Badge>{42}</Badge>)
      
      expect(screen.getByText('42')).toBeInTheDocument()
    })
  })

  describe('Badge Variants Function', () => {
    it('should generate correct class strings for default variant', () => {
      const classes = badgeVariants()
      
      expect(classes).toContain('inline-flex')
      expect(classes).toContain('items-center')
      expect(classes).toContain('bg-primary')
      expect(classes).toContain('text-primary-foreground')
    })

    it('should generate correct class strings for secondary variant', () => {
      const classes = badgeVariants({ variant: 'secondary' })
      
      expect(classes).toContain('bg-secondary')
      expect(classes).toContain('text-secondary-foreground')
    })

    it('should generate correct class strings for destructive variant', () => {
      const classes = badgeVariants({ variant: 'destructive' })
      
      expect(classes).toContain('bg-destructive')
      expect(classes).toContain('text-destructive-foreground')
    })

    it('should generate correct class strings for outline variant', () => {
      const classes = badgeVariants({ variant: 'outline' })
      
      expect(classes).toContain('text-foreground')
    })
  })

  describe('Real-world Usage Scenarios', () => {
    it('should work as status indicator', () => {
      render(
        <div>
          <Badge variant="secondary">Draft</Badge>
          <Badge variant="default">Published</Badge>
          <Badge variant="destructive">Deleted</Badge>
        </div>
      )
      
      expect(screen.getByText('Draft')).toBeInTheDocument()
      expect(screen.getByText('Published')).toBeInTheDocument()
      expect(screen.getByText('Deleted')).toBeInTheDocument()
    })

    it('should work with vehicle status colors', () => {
      render(
        <Badge className="bg-green-100 text-green-800">
          At Yard
        </Badge>
      )
      
      const badge = screen.getByText('At Yard')
      expect(badge).toHaveClass('bg-green-100', 'text-green-800')
    })

    it('should work as notification badge', () => {
      render(
        <div className="relative">
          <button>Notifications</button>
          <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full">
            3
          </Badge>
        </div>
      )
      
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('should work with accessibility features', () => {
      render(
        <Badge 
          role="status" 
          aria-live="polite"
          className="bg-blue-100 text-blue-800"
        >
          Processing
        </Badge>
      )
      
      const badge = screen.getByText('Processing')
      expect(badge).toHaveAttribute('role', 'status')
      expect(badge).toHaveAttribute('aria-live', 'polite')
    })
  })

  describe('Responsive Design', () => {
    it('should maintain proper styling at different screen sizes', () => {
      render(<Badge className="md:px-4 lg:text-sm">Responsive Badge</Badge>)
      
      const badge = screen.getByText('Responsive Badge')
      expect(badge).toHaveClass('md:px-4', 'lg:text-sm')
      // Should still have base responsive classes
      expect(badge).toHaveClass('px-2.5', 'text-xs')
    })

    it('should work with responsive variants', () => {
      // Note: This tests the concept - actual responsive variants would need custom implementation
      render(
        <Badge className="bg-gray-100 text-gray-800 md:bg-blue-100 md:text-blue-800">
          Responsive Color Badge
        </Badge>
      )
      
      const badge = screen.getByText('Responsive Color Badge')
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-800', 'md:bg-blue-100', 'md:text-blue-800')
    })
  })

  describe('Performance and Edge Cases', () => {
    it('should handle very long text content', () => {
      const longText = 'This is a very long badge text that might wrap or overflow'
      render(<Badge>{longText}</Badge>)
      
      expect(screen.getByText(longText)).toBeInTheDocument()
    })

    it('should handle special characters in content', () => {
      render(<Badge>Special: @#$%^&*()</Badge>)
      
      expect(screen.getByText('Special: @#$%^&*()')).toBeInTheDocument()
    })

    it('should handle undefined variant gracefully', () => {
      render(<Badge variant={undefined as any}>Undefined Variant</Badge>)
      
      const badge = screen.getByText('Undefined Variant')
      // Should fall back to default variant
      expect(badge).toHaveClass('bg-primary', 'text-primary-foreground')
    })

    it('should render multiple badges correctly', () => {
      render(
        <div>
          {Array.from({ length: 10 }, (_, i) => (
            <Badge key={i} variant={i % 2 === 0 ? 'default' : 'secondary'}>
              Badge {i + 1}
            </Badge>
          ))}
        </div>
      )
      
      expect(screen.getByText('Badge 1')).toBeInTheDocument()
      expect(screen.getByText('Badge 10')).toBeInTheDocument()
    })
  })
})
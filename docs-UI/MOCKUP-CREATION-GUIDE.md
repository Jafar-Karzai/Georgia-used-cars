# UI Mockup Creation Guide

A systematic approach for creating comprehensive HTML/CSS mockups from design concepts before implementing in a production codebase.

---

## Purpose

This guide enables rapid UI exploration through static HTML mockups. The goal is to visualize a complete design system before committing to React/framework implementation, allowing for quick iterations and stakeholder approval.

---

## Process Overview

### Phase 1: Design Analysis

1. **Review the source design** (HTML template, Figma, screenshot, or concept)
2. **Extract the design DNA:**
   - Color palette (primary, secondary, accent, neutrals)
   - Typography (font families, weights, hierarchy)
   - Shape language (rounded vs sharp corners)
   - Spacing patterns (padding, gaps, margins)
   - Visual effects (shadows, gradients, glass effects, borders)
   - Interactive states (hover, active, focus)

3. **Identify the design personality:**
   - Is it industrial, minimal, playful, luxurious, technical?
   - What visual metaphors does it use?
   - What mood does it convey?

### Phase 2: Codebase Exploration

1. **Map existing pages** that need mockups:
   - List all public-facing pages
   - List key components used across pages
   - Note any unique page-specific elements

2. **Identify UI elements to design:**
   - Navigation (header, mobile menu)
   - Cards (product cards, info cards, feature cards)
   - Forms (inputs, selects, buttons)
   - Tables/grids
   - Modals/dialogs
   - Badges/tags/status indicators
   - Pagination
   - Footer

### Phase 3: Design System Definition

Create a CSS variables block that defines the entire design system:

```css
:root {
    /* Primary Colors */
    --primary: #XXXXXX;
    --primary-dark: #XXXXXX;

    /* Accent Colors */
    --accent: #XXXXXX;
    --accent-dark: #XXXXXX;

    /* Semantic Colors */
    --success: #XXXXXX;
    --warning: #XXXXXX;
    --error: #XXXXXX;

    /* Neutrals */
    --background: #XXXXXX;
    --surface: #XXXXXX;
    --border: #XXXXXX;
    --text-primary: #XXXXXX;
    --text-secondary: #XXXXXX;
    --text-muted: #XXXXXX;

    /* Typography */
    --font-primary: 'Font Name', sans-serif;
    --font-mono: 'Mono Font', monospace;

    /* Spacing (if systematic) */
    --spacing-xs: Xpx;
    --spacing-sm: Xpx;
    --spacing-md: Xpx;
    --spacing-lg: Xpx;

    /* Shape */
    --radius: Xpx; /* 0 for sharp edges */
}
```

### Phase 4: Mockup Creation Order

Create mockups in this sequence for maximum efficiency:

1. **Component Library Page** (optional but helpful)
   - All buttons, badges, form elements in one place
   - Ensures consistency before building pages

2. **Home Page**
   - Establishes the full visual language
   - Includes: header, hero, feature sections, cards, CTA, footer
   - Most comprehensive page - sets the tone

3. **Listing/Index Page**
   - Filters/sidebar
   - Grid/list views
   - Pagination
   - Search functionality

4. **Detail Page**
   - Gallery/media display
   - Information hierarchy
   - Action panels
   - Related items

5. **Form Pages** (contact, login, etc.)
   - Form styling
   - Validation states
   - Success/error messaging

---

## Mockup Structure Template

Each HTML mockup should follow this structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Title | Brand Name</title>

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=FONTS_HERE&display=swap" rel="stylesheet">

    <style>
        /* 1. CSS Variables / Design Tokens */
        :root { ... }

        /* 2. Reset & Base Styles */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { ... }

        /* 3. Typography Classes */
        .mono { ... }

        /* 4. Layout Components */
        .container { ... }
        header { ... }
        footer { ... }

        /* 5. UI Components */
        .btn { ... }
        .card { ... }
        .badge { ... }

        /* 6. Page-Specific Sections */
        .hero { ... }
        .features { ... }

        /* 7. Responsive Breakpoints */
        @media (max-width: 1024px) { ... }
        @media (max-width: 768px) { ... }
    </style>
</head>
<body>
    <!-- Header -->
    <!-- Main Content Sections -->
    <!-- Footer -->
</body>
</html>
```

---

## Key Considerations

### Typography Hierarchy
- **Display/Hero:** Largest, boldest - for main headlines
- **Section Titles:** Clear hierarchy markers (e.g., accent bar before title)
- **Card Titles:** Prominent but not overwhelming
- **Body Text:** Readable, appropriate contrast
- **Labels/Captions:** Smaller, often monospace for technical data

### Color Usage Patterns
- **Primary color:** Main actions, links, key UI elements
- **Accent color:** CTAs, important notices, hover states
- **Success/Warning/Error:** Status indicators, validation
- **Neutrals:** Backgrounds, borders, text hierarchy

### Visual Hierarchy Techniques
- Size contrast
- Color contrast
- Spacing/whitespace
- Typography weight
- Border/divider lines
- Background differentiation

### Interactive States
Define hover/active states for:
- Buttons
- Cards
- Links
- Form inputs
- Navigation items

### Mobile Responsiveness
Include breakpoints for:
- Desktop (1200px+)
- Tablet (768px - 1024px)
- Mobile (< 768px)

Key mobile considerations:
- Stack columns vertically
- Increase touch targets
- Hide secondary navigation (hamburger menu)
- Adjust font sizes
- Simplify complex grids

---

## Icon Recommendations

Avoid emojis in production mockups. Instead use:

1. **SVG Icons** - Inline SVGs for full control
2. **Icon Libraries:**
   - Lucide Icons (https://lucide.dev)
   - Heroicons (https://heroicons.com)
   - Phosphor Icons (https://phosphoricons.com)
   - Tabler Icons (https://tabler-icons.io)

Include icons via CDN or inline SVG for mockups:
```html
<!-- CDN Example (Lucide) -->
<script src="https://unpkg.com/lucide@latest"></script>
<script>lucide.createIcons();</script>

<!-- Usage -->
<i data-lucide="car"></i>
```

---

## Checklist Before Implementation

- [ ] All primary pages are mocked up
- [ ] Design system variables are documented
- [ ] Mobile responsive layouts tested
- [ ] Hover/interactive states defined
- [ ] Color contrast meets accessibility standards
- [ ] Typography hierarchy is clear
- [ ] Consistent spacing throughout
- [ ] Stakeholder approval received

---

## Transitioning to Production

Once mockups are approved:

1. **Extract design tokens** to your framework's config (tailwind.config.js, CSS variables)
2. **Create reusable components** matching mockup patterns
3. **Implement page-by-page**, using mockup as visual reference
4. **Cross-reference** mockup during development for consistency

---

## Prompt Template for AI Agents

When requesting mockups from an AI agent, provide:

```
Create HTML/CSS mockups for [PROJECT NAME] using [DESIGN STYLE].

**Design Requirements:**
- Theme: [light/dark]
- Shape language: [sharp edges / rounded corners]
- Primary color: [hex code]
- Accent color: [hex code]
- Typography: [font choices]
- Mood: [industrial, minimal, luxurious, etc.]

**Pages Needed:**
1. Home page with: [list sections]
2. Listing page with: [filters, grid, pagination, etc.]
3. Detail page with: [gallery, specs, actions, etc.]

**Existing Components to Include:**
- [List key components from your app]

**Reference:**
- [Link to design inspiration or existing HTML template]

**Output:**
- Self-contained HTML files with embedded CSS
- Mobile responsive
- Use proper icons (Lucide/Heroicons), not emojis
- Include hover states and transitions
```

---

*This guide enables consistent, high-quality mockup creation across projects and themes.*

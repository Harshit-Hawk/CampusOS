---
name: CampusOS Design System
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#424754'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#727785'
  outline-variant: '#c2c6d6'
  surface-tint: '#005ac2'
  primary: '#0058be'
  on-primary: '#ffffff'
  primary-container: '#2170e4'
  on-primary-container: '#fefcff'
  inverse-primary: '#adc6ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#924700'
  on-tertiary: '#ffffff'
  tertiary-container: '#b75b00'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#ffdcc6'
  tertiary-fixed-dim: '#ffb786'
  on-tertiary-fixed: '#311400'
  on-tertiary-fixed-variant: '#723600'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  xxl: 64px
  container-max: 1280px
  gutter: 24px
---

## Brand & Style

This design system is engineered for **CampusOS**, an institutional-grade platform for student life. The brand identity is rooted in reliability, efficiency, and high-performance utility. It adopts a **Modern Corporate/Product-Led** aesthetic, drawing direct inspiration from industry-leading developer and productivity tools.

The visual language communicates authority through precision rather than ornament. It avoids the typical "educational" tropes of playful colors or soft illustrations, opting instead for a rigorous, systematic approach that treats student life management with the same seriousness as financial or engineering workflows. The emotional response should be one of clarity, focus, and institutional trust.

## Colors

The palette is restrained and functional, designed to provide a neutral stage for high-fidelity product content.

- **Primary (#3B82F6):** A precise blue used for primary actions, progress indicators, and active states. It signals utility and intelligence.
- **Surface & Background:** A subtle distinction between the canvas (`#F8FAFC`) and UI containers (`#FFFFFF`) creates natural depth without relying on heavy shadows.
- **Typography:** Deep slate (`#0F172A`) ensures maximum legibility for primary information, while secondary text (`#64748B`) provides hierarchy for metadata and supporting descriptions.
- **Borders (#E2E8F0):** Used rigorously to define structure and separate information density levels.

## Typography

The system utilizes **Inter** exclusively to maintain a utilitarian and systematic feel. For headlines, we employ a "Tight" stylistic set (tracking -1% to -2%) with heavier weights to create a confident, bold appearance reminiscent of high-end SaaS dashboards.

- **Headlines:** Should be tight, bold, and authoritative. Use `display-lg` for hero sections and marketing landing points.
- **Body:** Set with standard tracking and generous line-height to ensure long-form reading comfort in documentation or campus policy pages.
- **Labels:** Use `label-sm` in all-caps for category headers or small badges to create a distinct visual texture compared to body prose.

## Layout & Spacing

The design system employs a **Fixed Grid** philosophy for desktop layouts, transitioning to a fluid model for mobile. It uses a base-4 pixel grid to ensure mathematical precision in all alignments.

- **Grid:** A 12-column grid for desktop (1280px max-width) with 24px gutters. For application views (dashboards), a "no-max-width" fluid sidebar + fixed content area is used.
- **Rhythm:** Generous white space is prioritized to reduce cognitive load. Vertical spacing between sections should typically use `xl` (40px) or `xxl` (64px) to allow the "minimalist" aesthetic to breathe.
- **Breakpoints:**
  - **Mobile:** < 640px (4 columns, 16px margins)
  - **Tablet:** 640px - 1024px (8 columns, 24px margins)
  - **Desktop:** > 1024px (12 columns, 24px margins)

## Elevation & Depth

This design system avoids heavy drop shadows and floating effects. Depth is achieved through **Tonal Layering** and **Micro-Shadows**.

- **Level 0 (Base):** Background color `#F8FAFC`.
- **Level 1 (Surface):** White cards or panels `#FFFFFF` with a 1px border of `#E2E8F0`.
- **Level 2 (Interactive/Overlay):** Modals or dropdowns use a "Product Shadow"—an extremely diffused, low-opacity shadow: `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`.
- **Ghost Borders:** For subtle separation, use 1px solid borders rather than shadows whenever possible to maintain the "flat" professional aesthetic.

## Shapes

The shape language is **Soft** but disciplined. We avoid overly rounded or "bubbly" corners to maintain a professional, institutional feel.

- **Standard Elements:** Buttons and Input fields use a 0.25rem (4px) radius.
- **Containers:** Large cards and sections use 0.5rem (8px) to 0.75rem (12px) radius.
- **Strictness:** Do not use pill-shaped buttons; the geometric squareness reinforces the "OS" and "Tool" nature of the product.

## Components

### Buttons
- **Primary:** Solid `#3B82F6` with white text. 4px border radius. Subtle inner highlight on hover.
- **Secondary:** White background with `#E2E8F0` border and `#0F172A` text.
- **Tertiary:** Transparent background, slate text. No border.

### Input Fields
- **Default State:** 1px solid `#E2E8F0` border, `#FFFFFF` background.
- **Focus State:** 1px solid `#3B82F6` with a subtle 2px blue outer glow (ring).
- **Labels:** Always use `label-md` positioned above the input.

### Cards
- White background, 1px solid `#E2E8F0` border. No shadow by default.
- Use a slight elevation (Micro-shadow) only on hover if the card is an interactive link.

### Chips & Badges
- Small, rectangular with 2px radius. 
- Use subtle background tints (e.g., light blue background with primary blue text) rather than high-saturation fills.

### Navigation
- Sidebar navigation uses `body-sm` text with 500 weight.
- Active states are marked by a vertical 2px line on the left or a subtle grey background shift.
# CORTEXIA Design System

> Desain sistem untuk aplikasi CORTEXIA mengikuti *Fitur Pelafalan* design reference

## 🎨 Brand Colors

### Primary Colors (Orange Palette)
- **Main Orange**: `#F89847` - Warna utama brand CORTEXIA
- **Light Orange**: `#FFA560` - Untuk hover states dan highlights
- **Dark Orange**: `#E57A2D` - Untuk teks dan emphasis
- **Lighter Orange**: `#FFBC7F` - Untuk backgrounds yang subtle
- **Pale Orange**: `#FFE5D1` - Untuk light backgrounds dan badges

### Secondary Colors (Purple/Navy Palette)
- **Navy Main**: `#1E2B5F` - Primary text color
- **Navy Light**: `#2D3E7F` - Secondary elements
- **Navy Dark**: `#0F1A3F` - Dark text and headers
- **Purple Main**: `#6366F1` - Secondary brand color
- **Purple Light**: `#818CF8` - Light accents
- **Purple Pale**: `#E0E7FF` - Light backgrounds

### Status Colors
- **Success**: `#10B981` - Green for success states
- **Warning**: `#F59E0B` - Amber for warnings
- **Error**: `#EF4444` - Red for errors
- **Info**: `#3B82F6` - Blue for info messages

## 📝 Typography

### Font Families
1. **Primary Font**: `Outfit` - Modern, rounded sans-serif
2. **Secondary Font**: `Poppins` - Clean, geometric sans-serif
3. **Fallback**: `Inter`, `Roboto`, system fonts

### Font Weights
- Regular: 400
- Medium: 500
- Semi-Bold: 600
- Bold: 700
- Extra-Bold: 800
- Black: 900

### Heading Styles
```typescript
h1: 2.75rem (44px) - Weight: 800
h2: 2.25rem (36px) - Weight: 700
h3: 1.875rem (30px) - Weight: 700
h4: 1.5rem (24px) - Weight: 600
h5: 1.25rem (20px) - Weight: 600
h6: 1rem (16px) - Weight: 600
```

### Body Text
- **Body 1**: 1rem (16px) - Regular (400)
- **Body 2**: 0.875rem (14px) - Regular (400)
- **Button Text**: 1rem (16px) - Semi-Bold (600)

## 🎯 Component Styles

### Buttons

#### Primary Button (Orange Gradient)
```tsx
import { CortexiaPrimaryButton } from '@/components/common/CortexiaComponents';

<CortexiaPrimaryButton>
  Mulai Sekarang
</CortexiaPrimaryButton>
```

**Specifications:**
- Border Radius: 32px (pill-shaped)
- Padding: 16px 40px
- Background: Linear gradient (Orange Main → Orange Light)
- Shadow: `0px 4px 16px rgba(248, 152, 71, 0.3)`
- Hover: Slight lift with enhanced shadow

#### Secondary Button (Light Purple)
```tsx
import { CortexiaSecondaryButton } from '@/components/common/CortexiaComponents';

<CortexiaSecondaryButton>
  Kembali
</CortexiaSecondaryButton>
```

**Specifications:**
- Background: `#E8EBFF`
- Color: Purple Main
- Border Radius: 28px
- Padding: 14px 32px

### Cards

#### Main Card
```tsx
import { CortexiaCard } from '@/components/common/CortexiaComponents';

<CortexiaCard>
  {/* Content */}
</CortexiaCard>
```

**Specifications:**
- Border Radius: 32px
- Padding: 32px
- Background: Gradient white with slight warm tint
- Shadow: `0px 8px 32px rgba(0, 0, 0, 0.08)`
- Hover: Enhanced shadow + lift animation

#### Interactive Card
```tsx
import { CortexiaInteractiveCard } from '@/components/common/CortexiaComponents';

<CortexiaInteractiveCard onClick={handleClick}>
  {/* Clickable content */}
</CortexiaInteractiveCard>
```

**Specifications:**
- Border Radius: 24px
- Padding: 24px
- Cursor: pointer
- Hover: Orange border + lift animation
- Transition: Smooth cubic-bezier

### Badges & Chips

#### Stars Badge
```tsx
import { CortexiaStarsBadge } from '@/components/common/CortexiaComponents';
import { Star } from '@mui/icons-material';

<CortexiaStarsBadge icon={<Star />} label="20 Bintang" />
```

#### Info Badge
```tsx
import { CortexiaBadge } from '@/components/common/CortexiaComponents';

<CortexiaBadge label="Latihan Bersuara" />
```

### Progress Bars

```tsx
import { CortexiaProgressBar, CortexiaProgressFill } from '@/components/common/CortexiaComponents';

<CortexiaProgressBar>
  <CortexiaProgressFill progress={68} />
</CortexiaProgressBar>
```

**Specifications:**
- Height: 12px
- Border Radius: 12px
- Background: `#E5E7EB` (neutral gray)
- Fill: Orange gradient with shadow
- Smooth transition on value change

## 🎭 Decorative Elements

### Background Shapes

```tsx
import { DecorativeShape } from '@/components/common/CortexiaComponents';

<DecorativeShape 
  shape="circle" 
  color="#FFE5D1" 
  size={100} 
  sx={{ top: '5%', left: '10%' }} 
/>

<DecorativeShape 
  shape="triangle" 
  color="#E8EBFF" 
  size={80} 
  sx={{ top: '15%', right: '8%' }} 
/>

<DecorativeShape 
  shape="sparkle" 
  color="#F89847" 
  size={60} 
  sx={{ bottom: '20%', left: '15%' }} 
/>
```

**Available Shapes:**
- `circle` - Round decorative element
- `triangle` - Triangular shape
- `sparkle` - Star-like sparkle
- `star` - Five-pointed star

**Behavior:**
- Float animation (up and down movement)
- Low opacity (0.12-0.15)
- Absolute positioning
- Non-interactive (pointer-events: none)

### CORTI Mascot

```tsx
import { CortiMascot } from '@/components/common/CortexiaComponents';

<CortiMascot>
  🍊
</CortiMascot>
```

**Specifications:**
- Size: 120px × 120px
- Background: Orange gradient
- Border: 4px white
- Shadow: Orange glow
- Animation: Gentle bounce

## 🎬 Animations

### Available Animations

#### Float Animation
```css
.animate-float
```
Smooth up and down movement (6s loop)

#### Pulse Animation
```css
.animate-pulse
```
Gentle scale and opacity pulse (2s loop)

#### Bounce Animation
```css
.animate-bounce
```
Playful bounce effect (2s loop)

#### Slide In Animations
```css
.animate-slide-in-up
.animate-slide-in-down
.animate-slide-in-left
.animate-slide-in-right
```
Entrance animations from different directions

#### Fade In
```css
.animate-fade-in
```
Smooth opacity transition

#### Scale In
```css
.animate-scale-in
```
Zoom-in entrance effect

### Custom Keyframes

Import from components:
```tsx
import { float, pulse, bounce, slideInUp } from '@/components/common/CortexiaComponents';
```

## 📐 Spacing System

```typescript
xs:  4px
sm:  8px
md:  16px
lg:  24px
xl:  32px
2xl: 48px
```

## 🔘 Border Radius

```typescript
sm:   12px  // Small elements
md:   20px  // Medium elements
lg:   28px  // Buttons
xl:   32px  // Cards
full: 9999px // Pills/Circles
```

## 🌈 Shadows

### Standard Shadows
```typescript
sm: 0px 2px 8px rgba(0, 0, 0, 0.05)
md: 0px 4px 16px rgba(0, 0, 0, 0.08)
lg: 0px 8px 32px rgba(0, 0, 0, 0.12)
```

### Brand Shadows
```typescript
orange: 0px 4px 16px rgba(248, 152, 71, 0.25)
purple: 0px 4px 16px rgba(99, 102, 241, 0.25)
```

## 📱 Responsive Design

### Breakpoints
```typescript
xs: 0px     // Mobile
sm: 600px   // Small tablet
md: 960px   // Tablet
lg: 1280px  // Desktop
xl: 1920px  // Large desktop
```

### Mobile-First Approach
Always design for mobile first, then enhance for larger screens:

```tsx
sx={{
  fontSize: { xs: '1.5rem', md: '2rem', lg: '2.5rem' },
  padding: { xs: 2, md: 3, lg: 4 },
}}
```

## 🎨 Page Layouts

### Standard Page Wrapper

```tsx
import { CortexiaPageWrapper } from '@/components/common/CortexiaComponents';

<CortexiaPageWrapper>
  {/* Page content */}
</CortexiaPageWrapper>
```

**Includes:**
- Gradient background (Purple-tinted → Peach)
- Minimum height: 100vh
- Relative positioning for decorative elements

### Container

```tsx
<Container maxWidth="lg">
  {/* Content */}
</Container>
```

## 🎯 Best Practices

### Color Usage
1. **Primary Orange** for main CTAs and important actions
2. **Purple** for secondary actions and informational elements
3. **Navy** for text and headers
4. **Pale colors** for backgrounds and subtle highlights

### Typography
1. Use **Bold (700-800)** for headings
2. Use **Semi-Bold (600)** for buttons and emphasis
3. Use **Regular (400)** for body text
4. Maintain consistent line heights (1.5-1.6)

### Spacing
1. Use consistent spacing multiples (8px grid system)
2. Larger spacing for sections, smaller for components
3. More whitespace = better readability

### Shadows
1. Subtle shadows for resting state
2. Enhanced shadows for hover/active states
3. Brand-colored shadows for primary elements

### Animations
1. Keep animations smooth (0.3s - 0.6s duration)
2. Use easing functions: `cubic-bezier(0.4, 0, 0.2, 1)`
3. Don't overuse animations - purposeful only

### Accessibility
1. Maintain color contrast ratios (WCAG AA minimum)
2. Ensure focus states are visible
3. Support keyboard navigation
4. Provide alt text for images

## 📦 Component Export Structure

```typescript
// All components available from:
import {
  CortexiaPageWrapper,
  DecorativeShape,
  CortiMascot,
  CortexiaPrimaryButton,
  CortexiaSecondaryButton,
  CortexiaOutlineButton,
  CortexiaCard,
  CortexiaInteractiveCard,
  CortexiaBadge,
  CortexiaStarsBadge,
  CortexiaProgressBar,
  CortexiaProgressFill,
  CortexiaAvatar,
  CortexiaFAB,
  CortexiaBackButton,
  CortexiaGlassContainer,
  CortexiaIconButton,
  CortexiaSuccessCard,
  CortexiaInfoBox,
  CortexiaLoadingSpinner,
} from '@/components/common/CortexiaComponents';
```

## 🚀 Quick Start Example

```tsx
import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import {
  CortexiaPageWrapper,
  DecorativeShape,
  CortexiaPrimaryButton,
  CortexiaCard,
} from '@/components/common/CortexiaComponents';

const MyPage: React.FC = () => {
  return (
    <CortexiaPageWrapper>
      {/* Decorative elements */}
      <DecorativeShape shape="circle" color="#FFE5D1" size={100} sx={{ top: '10%', left: '5%' }} />
      <DecorativeShape shape="sparkle" color="#F89847" size={60} sx={{ bottom: '20%', right: '10%' }} />
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h2" sx={{ mb: 4, textAlign: 'center' }}>
          Selamat Datang!
        </Typography>
        
        <CortexiaCard>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Ini adalah contoh halaman menggunakan CORTEXIA Design System
          </Typography>
          
          <CortexiaPrimaryButton>
            Mulai Sekarang
          </CortexiaPrimaryButton>
        </CortexiaCard>
      </Container>
    </CortexiaPageWrapper>
  );
};

export default MyPage;
```

## 📚 Additional Resources

- **Theme Configuration**: `src/theme.ts`
- **Global Styles**: `src/styles/cortexia.css`
- **Component Library**: `src/components/common/CortexiaComponents.tsx`
- **Example Pages**:
  - Pronunciation Practice: `src/pages/student/PronunciationPractice.tsx`
  - Welcome Screen: `src/pages/student/WelcomeScreen.tsx`
  - Dashboard: `src/pages/student/StudentDashboardRedesign.tsx`

## 🎨 Design References

Design files are located in:
- `CORTEXIA - Fitur Pelafalan/`
- `Container/`
- `CORTEXIA PROTOTYPE/`

---

**Version**: 1.0  
**Last Updated**: 2026  
**Maintained by**: CORTEXIA Development Team

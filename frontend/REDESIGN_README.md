# CORTEXIA Web Redesign 🎨

## Gambaran Umum

Redesign aplikasi web CORTEXIA mengikuti desain sistem dari **CORTEXIA - Fitur Pelafalan** dengan elemen-elemen detail dari **Container** dan **CORTEXIA PROTOTYPE**.

## 📁 File-File Baru

### 1. Theme System
**File**: `src/theme.ts`
- ✅ Updated dengan CORTEXIA color palette
- ✅ Typography menggunakan Outfit & Poppins fonts
- ✅ Custom component styles (buttons, cards, chips, etc.)
- ✅ Custom shadows dan border radius
- ✅ Theme extensions untuk CORTEXIA branding

### 2. Component Library
**File**: `src/components/common/CortexiaComponents.tsx`

Komponen-komponen yang tersedia:
- `CortexiaPageWrapper` - Page wrapper dengan gradient background
- `DecorativeShape` - Bentuk dekoratif (circle, triangle, sparkle, star)
- `CortiMascot` - Avatar maskot CORTI dengan animasi bounce
- `CortexiaPrimaryButton` - Tombol utama dengan orange gradient
- `CortexiaSecondaryButton` - Tombol sekunder dengan purple background
- `CortexiaOutlineButton` - Tombol outline
- `CortexiaCard` - Card dengan shadow dan hover effect
- `CortexiaInteractiveCard` - Card yang bisa diklik
- `CortexiaBadge` - Badge/chip untuk labels
- `CortexiaStarsBadge` - Badge khusus untuk menampilkan bintang
- `CortexiaProgressBar` - Progress bar dengan gradient fill
- `CortexiaAvatar` - Avatar dengan border styling
- `CortexiaBackButton` - Tombol kembali
- `CortexiaIconButton` - Icon button circular
- `CortexiaSuccessCard` - Card untuk success state
- `CortexiaInfoBox` - Box untuk menampilkan informasi
- `CortexiaLoadingSpinner` - Loading spinner

### 3. Global Styles
**File**: `src/styles/cortexia.css`

Includes:
- CSS Variables untuk colors, spacing, shadows, dll
- Global reset dan base styles
- Custom scrollbar styling
- Utility classes (gradients, glass effects, etc.)
- Animation keyframes
- Responsive typography
- Accessibility focus styles

### 4. New Pages

#### a. Pronunciation Practice Page
**File**: `src/pages/student/PronunciationPractice.tsx`

Features:
- ✅ Header dengan back button, stars badge, dan avatar
- ✅ Title section dengan badge "Latihan Bersuara Ceria"
- ✅ Large word display dengan spasi antar huruf
- ✅ Phonetic pronunciation dengan audio button
- ✅ Waveform animation saat recording
- ✅ Large microphone button dengan pulse animation
- ✅ Feedback box dengan icon dan text
- ✅ Action buttons (Tekan dan Baca, Kata Berikutnya)
- ✅ Bottom actions (Volume, CORTI Menyimak)
- ✅ Decorative floating shapes

#### b. Welcome Screen
**File**: `src/pages/student/WelcomeScreen.tsx`

Features:
- ✅ Greeting bubble dengan "Ayo!"
- ✅ CORTI mascot dengan bounce animation
- ✅ Animated CORTEXIA brand name dengan color-coded letters
- ✅ Description text
- ✅ Primary CTA button
- ✅ Loading state dengan progress bar
- ✅ Floating decorative letters
- ✅ Background decorative shapes

#### c. Student Dashboard Redesign
**File**: `src/pages/student/StudentDashboardRedesign.tsx`

Features:
- ✅ Welcome header dengan level badge
- ✅ Stars display dan avatar
- ✅ 4 stat cards dengan icons dan values
- ✅ Overall progress card dengan progress bar
- ✅ Quick actions section (3 cards)
- ✅ Recent activities list
- ✅ Consistent CORTEXIA styling throughout

## 🎨 Design System

### Color Palette

#### Primary (Orange)
```css
Main:    #F89847
Light:   #FFA560
Dark:    #E57A2D
Lighter: #FFBC7F
Pale:    #FFE5D1
```

#### Secondary (Purple/Navy)
```css
Navy Main:    #1E2B5F
Navy Light:   #2D3E7F
Purple Main:  #6366F1
Purple Light: #818CF8
Purple Pale:  #E0E7FF
```

#### Status Colors
```css
Success: #10B981
Warning: #F59E0B
Error:   #EF4444
Info:    #3B82F6
```

### Typography

**Font Families:**
1. Outfit (Primary)
2. Poppins (Secondary)
3. Inter (Fallback)

**Font Weights:**
- Regular: 400
- Medium: 500
- Semi-Bold: 600
- Bold: 700
- Extra-Bold: 800
- Black: 900

### Spacing System
```
xs:  4px
sm:  8px
md:  16px
lg:  24px
xl:  32px
2xl: 48px
```

### Border Radius
```
sm:   12px
md:   20px
lg:   28px  (buttons)
xl:   32px  (cards)
full: 9999px (circular)
```

## 🚀 Cara Menggunakan

### 1. Import Components

```tsx
import {
  CortexiaPageWrapper,
  DecorativeShape,
  CortexiaPrimaryButton,
  CortexiaCard,
} from '@/components/common/CortexiaComponents';
```

### 2. Basic Page Structure

```tsx
import React from 'react';
import { Container, Typography } from '@mui/material';
import {
  CortexiaPageWrapper,
  DecorativeShape,
  CortexiaPrimaryButton,
} from '@/components/common/CortexiaComponents';

const MyPage: React.FC = () => {
  return (
    <CortexiaPageWrapper>
      {/* Decorative shapes */}
      <DecorativeShape 
        shape="circle" 
        color="#FFE5D1" 
        size={100} 
        sx={{ top: '10%', left: '5%' }} 
      />
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h2">Hello CORTEXIA!</Typography>
        <CortexiaPrimaryButton>Start Learning</CortexiaPrimaryButton>
      </Container>
    </CortexiaPageWrapper>
  );
};

export default MyPage;
```

### 3. Menggunakan Animations

```tsx
import { slideInUp } from '@/components/common/CortexiaComponents';
import { styled } from '@mui/material';

const AnimatedBox = styled(Box)(({ theme }) => ({
  animation: `${slideInUp} 0.6s ease-out`,
}));
```

### 4. Using CSS Utility Classes

```tsx
<div className="animate-float">
  This will float up and down
</div>

<div className="cortexia-gradient-text">
  This text has gradient color
</div>

<div className="cortexia-glass-effect">
  Glass morphism effect
</div>
```

## 📱 Responsive Design

Semua komponen sudah responsive dengan breakpoints:
- xs: 0px (Mobile)
- sm: 600px (Small Tablet)
- md: 960px (Tablet)
- lg: 1280px (Desktop)
- xl: 1920px (Large Desktop)

Example:
```tsx
<Box
  sx={{
    fontSize: { xs: '1rem', md: '1.5rem', lg: '2rem' },
    padding: { xs: 2, md: 3, lg: 4 },
  }}
>
  Responsive content
</Box>
```

## 🎭 Design Principles

### 1. Playful & Friendly
- Rounded corners (20px+)
- Soft shadows
- Bright, warm colors
- Friendly mascot (CORTI)

### 2. Clear & Readable
- High contrast text
- Generous spacing
- Clear hierarchy
- Consistent typography

### 3. Interactive & Engaging
- Hover animations
- Smooth transitions
- Visual feedback
- Progress indicators

### 4. Educational Focus
- Progress tracking
- Achievement badges
- Encouraging feedback
- Gamification elements

## 🔧 Integration dengan Existing Code

### Option 1: Replace Existing Pages
Ganti import di routing:
```tsx
// Before
import StudentDashboard from './pages/student/StudentDashboard';

// After
import StudentDashboard from './pages/student/StudentDashboardRedesign';
```

### Option 2: Gradual Migration
Biarkan kedua versi ada, test new design:
```tsx
<Route path="/student/dashboard" element={<StudentDashboard />} />
<Route path="/student/dashboard-new" element={<StudentDashboardRedesign />} />
```

### Option 3: Feature Flag
```tsx
const useNewDesign = true; // atau dari config/environment

<Route 
  path="/student/dashboard" 
  element={useNewDesign ? <StudentDashboardRedesign /> : <StudentDashboard />} 
/>
```

## 📋 Checklist Implementation

### ✅ Completed
- [x] Theme configuration with CORTEXIA colors
- [x] Component library dengan semua komponen dasar
- [x] Global CSS dengan animations dan utilities
- [x] Pronunciation Practice page
- [x] Welcome Screen page
- [x] Student Dashboard redesign
- [x] Design system documentation

### 🔄 Next Steps (Recommendations)
- [ ] Update routing untuk menggunakan halaman baru
- [ ] Migrate halaman lain (Teacher Dashboard, Admin, etc.)
- [ ] Add unit tests untuk komponen baru
- [ ] Add Storybook untuk component showcase
- [ ] Optimize images dan assets
- [ ] Add error boundaries
- [ ] Implement PWA features
- [ ] Add dark mode support (optional)

## 🎯 Key Features

### 1. Consistent Branding
Semua komponen mengikuti CORTEXIA brand guidelines dengan:
- Consistent color usage
- Unified typography
- Standardized spacing
- Cohesive visual language

### 2. Reusable Components
Component library memudahkan development:
- No need to rewrite styles
- Consistent UX across pages
- Easy maintenance
- Quick prototyping

### 3. Performance Optimized
- CSS-in-JS dengan Material-UI
- Efficient animations
- Lazy loading ready
- Code splitting friendly

### 4. Accessibility
- WCAG compliant colors
- Keyboard navigation
- Focus indicators
- Semantic HTML

## 📚 Documentation

Dokumentasi lengkap tersedia di:
- **Design System**: `DESIGN_SYSTEM.md`
- **Component API**: Comments di `CortexiaComponents.tsx`
- **Theme Config**: Comments di `theme.ts`
- **Examples**: Lihat halaman-halaman di `src/pages/student/`

## 🤝 Contributing

Untuk menambah komponen baru:

1. Tambahkan di `CortexiaComponents.tsx`
2. Export dari file yang sama
3. Document dengan TypeScript comments
4. Tambahkan example di `DESIGN_SYSTEM.md`
5. Test di berbagai screen sizes

## 📞 Support

Untuk pertanyaan atau issue:
1. Check `DESIGN_SYSTEM.md` terlebih dahulu
2. Review example pages
3. Buat issue di repository

---

**Happy Coding! 🎨✨**

Mari buat CORTEXIA semakin menarik dan menyenangkan untuk anak-anak belajar membaca!

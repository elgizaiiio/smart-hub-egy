

# Landing Page -- Leonardo.ai Style for Megsy

## Overview
Build a massive, dark-themed, animation-heavy landing page inspired by the Leonardo.ai screenshots. Force dark background (`bg-black`), giant bold typography, scroll-triggered animations via `framer-motion`, infinite marquee strips, and alternating left/right content reveals.

## Page Structure (Top to Bottom)

### 1. Sticky Navbar
- Transparent at top, blur-glass on scroll (`backdrop-blur-md`)
- Metallic "M" logo + "Megsy" text (left), nav links center, "Log in" + "Start Creating" buttons (right)
- Mobile: hamburger menu

### 2. Hero Section (full viewport)
- Black bg with subtle animated gradient orbs (purple/violet)
- Giant uppercase bold text: **"THE ALL-IN-ONE"** (white) + **"AI CREATIVE PLATFORM"** (purple/primary)
- Subtitle text, two CTA buttons (FancyButton + outline)
- Text animates in from bottom with stagger

### 3. Stats Marquee Strip
- Infinite horizontal CSS scroll: "80+ AI Models" / "7 Categories" / "150+ Countries" / "4B+ Assets Generated"
- Duplicated content for seamless loop

### 4. Feature Sections (4 blocks, Leonardo-style)
Each section has:
- **Giant bold uppercase title** filling width (like "REFINE", "SCALE" in screenshots) with accent color
- Image/video on one side, numbered steps or description on the other
- Alternating left/right layout
- `whileInView` slide-in from left or right

Sections:
1. **AI Chat** -- "CONVERSE" giant text, showcase Megsy V1 chat capabilities
2. **Image Generation** -- "CREATE" giant text, 20+ models, showcase images from `/api-showcase/`
3. **Video Generation** -- "ANIMATE" giant text, cinematic quality
4. **Code & Deploy** -- "BUILD" giant text, live preview, GitHub sync

### 5. Models Marquee Strip
- Infinite ribbon of model names in pill badges: Megsy V1, Megsy Video, FLUX Kontext, Nano Banana 2, Recraft V4, etc.
- Gradient purple background strip

### 6. Showcase Gallery (Leonardo "Blueprints" style)
- Giant uppercase title "EXPLORE" + "MORE AI CREATIVE TOOLS" on colored bg (yellow/amber like screenshot)
- Horizontal carousel of cards with images from `/api-showcase/`
- Each card: image + bold title + description + "Learn more" button
- Cards: AI Image Generator, AI Video Generator, AI Code Builder, AI Image Upscaler, AI Chat

### 7. How It Works (numbered colored cards like screenshot 2)
- Stacked colored cards (green, yellow, red, purple) numbered 1-5
- Each step: bold title + description
- Right side: mockup/screenshot
- Cards animate in with stagger on scroll

### 8. FAQ Section
- Giant "FAQS" text with decorative purple shapes (like Leonardo screenshot)
- Accordion items using existing Accordion component

### 9. CTA Section
- Giant text: **"JOIN THE CREATORS"** (green/primary) + **"SHAPING THE FUTURE WITH MEGSY"** (white)
- Subtitle + "Start creating" button
- Models marquee strip below (like company logos strip)

### 10. Footer
- 4-column dark footer: Product, Resources, Legal, Contact
- Megsy logo + copyright

## Technical Details

### Files to Create
- `src/pages/LandingPage.tsx` -- Main orchestrator (~800 lines)
- `src/components/landing/LandingNavbar.tsx`
- `src/components/landing/HeroSection.tsx`
- `src/components/landing/StatsMarquee.tsx`
- `src/components/landing/FeatureBlock.tsx` -- Reusable giant-text feature section
- `src/components/landing/ModelsMarquee.tsx`
- `src/components/landing/ShowcaseGallery.tsx`
- `src/components/landing/HowItWorks.tsx`
- `src/components/landing/FAQSection.tsx`
- `src/components/landing/CTASection.tsx`
- `src/components/landing/LandingFooter.tsx`

### Files to Edit
- `src/App.tsx` -- Conditional routing: unauth users see LandingPage at `/`, auth users see ChatPage
- `src/index.css` -- Add marquee keyframes + landing-specific styles

### Animation Strategy (framer-motion)
- Every section uses `whileInView` with `viewport={{ once: true, margin: "-100px" }}`
- Giant text: `initial={{ opacity: 0, y: 80 }}` animate to visible
- Feature blocks: alternate `x: -100` and `x: 100` slide-ins
- Gallery cards: `staggerChildren: 0.15`
- How It Works cards: stagger from left with scale
- Stats/Models: pure CSS `@keyframes marquee { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }`

### Giant Typography Style
- `text-[8vw]` to `text-[12vw]` for massive headings (responsive via vw units)
- `font-black uppercase tracking-tight leading-none`
- Accent words in `text-primary` (purple) or custom colors (green, yellow, pink)

### Model Branding
- All models displayed from `apiModelsData.ts`
- Megsy models (Megsy V1, Megsy Video, Megsy V1 Image) get "Flagship" badges
- No mention of OpenAI/Google as underlying providers

### Routing Change in App.tsx
Add session state check at `/` route -- show `LandingPage` for unauthenticated, `ChatPage` for authenticated. Use existing `supabase.auth.getSession()` pattern.

### Dark Theme
Landing page wrapper forces `data-theme="dark"` and `bg-black text-white` regardless of user preference.

### Images
- Use existing `/api-showcase/showcase-1.png` through `showcase-4.jpg` for feature sections
- Use `/api-showcase/video-*.mp4` as background videos where applicable




# Plan: Create Megsy Models Page + Legal Pages + SEO (Landing-style Design)

## Scope (Updated per user request)
- **NO** About, Status, or API Docs pages
- Models page shows **Megsy-branded models only** (Megsy V1, Megsy Imagine, Megsy Video)
- All new pages use Landing-style design (LandingNavbar + LandingFooter, dark theme, framer-motion animations, cinematic hero sections)

## Pages to Create

### 1. Megsy Models Page (`/models`)
- Cinematic hero: "Meet Megsy Models" with animated gradient text
- 3 model sections: **Megsy V1** (Chat), **Megsy Imagine** (Image), **Megsy Video** (Video)
- Each model gets a large card with: name, description, capabilities list, supported features (aspect ratios, quality, audio), pricing
- Animated stats bar (3 models, 36+ underlying engines, etc.)
- Press-ready design with download-worthy visuals

### 2. Legal Pages (Landing-style, not plain text walls)
- **Terms of Service** (`/terms`) — structured sections with icons, clean typography
- **Privacy Policy** (`/privacy`) — GDPR-compliant sections, data handling, cookies
- **Cookie Policy** (`/cookies`) — cookie types, management options

### 3. Additional Company Pages
- **Careers** (`/careers`) — culture section, open positions placeholder, benefits grid
- **Security** (`/security`) — encryption, data protection, compliance commitments
- **Blog** (`/blog`) — "Coming Soon" with email subscribe placeholder
- **Changelog** (`/changelog`) — timeline of recent updates

### 4. SEO Infrastructure
- `src/components/SEOHead.tsx` — reusable Helmet component (title, description, og tags, canonical)
- `public/sitemap.xml` — all public routes
- Update `public/robots.txt` with sitemap reference
- Update `index.html` with better default meta
- Wrap `main.tsx` with `HelmetProvider`
- Apply SEOHead to all public pages

## Files to Create
| File | Purpose |
|------|---------|
| `src/pages/ModelsPage.tsx` | Megsy models showcase |
| `src/pages/TermsPage.tsx` | Terms of Service |
| `src/pages/PrivacyPage.tsx` | Privacy Policy |
| `src/pages/CookiePolicyPage.tsx` | Cookie Policy |
| `src/pages/CareersPage.tsx` | Careers page |
| `src/pages/SecurityPage.tsx` | Security & Trust |
| `src/pages/BlogPage.tsx` | Blog placeholder |
| `src/pages/ChangelogPage.tsx` | Changelog timeline |
| `src/components/SEOHead.tsx` | SEO meta component |
| `public/sitemap.xml` | Sitemap |

## Files to Edit
| File | Changes |
|------|---------|
| `src/App.tsx` | Add 8 new routes |
| `src/main.tsx` | Add `HelmetProvider` |
| `src/components/landing/LandingFooter.tsx` | Update Legal links to internal routes, add Models/Careers/Security links |
| `src/components/landing/LandingNavbar.tsx` | Add "Models" link |
| `public/robots.txt` | Add sitemap URL |
| `index.html` | Improve default meta tags |

## Design Pattern
Every page follows the same structure as `ServiceImagesPage.tsx`:
```text
LandingNavbar
  └─ Hero Section (cinematic, gradient text, framer-motion)
  └─ Content Sections (bento grids, feature cards, glassmorphism)
  └─ CTA Section
LandingFooter
```
Dark theme (`data-theme="dark"`), `overflow-x-hidden`, framer-motion scroll animations.


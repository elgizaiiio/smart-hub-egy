

# Comprehensive UI Overhaul Plan

## Files to modify (11 files)

### 1. Photos/Files Button Routing (`src/pages/ChatPage.tsx`)
- Change "Photos" button's `onClick` to trigger `imageInputRef.current?.click()` (opens phone gallery directly)
- Change "Files" button's `onClick` to trigger `fileInputRef.current?.click()` (opens device file picker directly)
- Apply same logic in `FilesPage.tsx` plus menu if applicable

### 2. Pricing Page Overhaul (`src/pages/PricingPage.tsx`)
- Rename "Business" to "Elite", badge "Best Value" to "PREMIUM 👑"
- Update credits: Monthly Starter=250, Pro=500, Elite=1500; Yearly Starter=2500, Pro=5000, Elite=15000
- Starter card: bg `#1A1A2E`, border `#333355`, button `#2A2A4A`
- Pro card: bg `rgba(124,58,237,0.1)`, border `#7C3AED`, "MOST POPULAR" purple badge, full purple button, scale slightly larger (`scale-105`)
- Elite card: bg `rgba(255,215,0,0.1)`, border `#FFD700`, "PREMIUM 👑" gold badge, gradient button `#FFD700 -> #FFA500`
- Use FancyButton component for "Get Started" buttons (same style as Unlock Pro)

### 3. Transparent Input Box (`src/components/AnimatedInput.tsx`)
- Change container from `bg-secondary/60` to `bg-transparent backdrop-blur-md border border-border/40`
- Same treatment for inline inputs in `ImagesPage.tsx`, `VideosPage.tsx`, `FilesPage.tsx`, `ProgrammingPage.tsx`

### 4. Sticky Header + Input Behavior
**Group 1 (sticky header + sticky bottom input):** Already mostly done in ChatPage. Verify/add `sticky top-0 z-20` header and `sticky bottom-0` input wrapper for:
- `ChatPage.tsx` (already has sticky header, input uses `shrink-0` which works)
- `FilesPage.tsx` - ensure same pattern
- `ProgrammingPage.tsx` - ensure same pattern

**Group 2 (sticky header, non-sticky input):** ImagesPage, VideosPage
- Add `sticky top-0 z-20` to header
- Input stays in normal flow (not sticky) - already the case

### 5. Sidebar Redesign (`src/components/AppSidebar.tsx`)
- Make "Recent" header sticky within the scrollable section (`sticky top-0 z-10 bg-sidebar`)
- Add section-specific icons next to each service (MessageSquare for Chat, ImageIcon for Images, Video for Videos, Code2 for Code, FileText for Files)
- Add subtle separators between sections
- Professional styling with refined spacing

### 6. Input Border Colors (Section 10)
- Add `border border-primary/30` to all input containers that changes with theme (primary color adapts automatically)
- Apply to AnimatedInput and all inline textareas across pages

### 7. Loading Button Purple Pulse (`src/components/AnimatedInput.tsx` + page inputs)
- Change loading/cancel button from `bg-destructive` to `bg-[#7C3AED]` with `animate-pulse` (slow: custom animation `animation: pulse 3s ease-in-out infinite`)
- Apply same to Loader2 buttons in ImagesPage, VideosPage, FilesPage

### 8. Placeholder Updates
- **Chat** (`AnimatedInput.tsx`): Replace DEFAULT_PLACEHOLDERS with 4 items: "What's on your mind?", "Ask anything...", "Let's figure it out...", "Try me!"
- **Images** (`ImagesPage.tsx`): Replace PLACEHOLDERS with: "Describe your image...", "Logo design...", "Anime character...", "A sunset landscape..."
- **Videos** (`VideosPage.tsx`): Replace with: "Describe the scene you want to create...", "A cinematic video of a sunset over the ocean...", "A sports car speeding on the highway...", "A man walking through a misty forest..."
- **Files** (`FilesPage.tsx`): Replace FILE_PLACEHOLDERS with: "Write a professional business proposal...", "Create a detailed report about...", "Create a structured presentation about...", "Summarize this document for me..."

### 9. Integration Icons (`src/pages/IntegrationsPage.tsx`)
- Replace Lucide icons for Slack, Outlook, Discord, Google Drive, Google Calendar, HubSpot with inline SVG brand icons
- Keep other integrations' icons as-is

---

## Summary of files:
1. `src/pages/ChatPage.tsx` - Photos/Files direct open, sticky layout
2. `src/pages/PricingPage.tsx` - Full redesign with themed cards + FancyButton
3. `src/components/AnimatedInput.tsx` - Transparent bg, new placeholders, purple loading, border
4. `src/pages/ImagesPage.tsx` - New placeholders, transparent input, sticky header, purple loading, border
5. `src/pages/VideosPage.tsx` - New placeholders, transparent input, sticky header, purple loading, border
6. `src/pages/FilesPage.tsx` - New placeholders, transparent input, sticky layout, purple loading, border
7. `src/pages/ProgrammingPage.tsx` - Transparent input, sticky layout, border
8. `src/components/AppSidebar.tsx` - Sticky Recent, icons, professional styling
9. `src/pages/IntegrationsPage.tsx` - Real brand SVG icons
10. `src/index.css` - Add slow-pulse animation keyframe


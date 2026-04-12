

# iOS 26 Liquid Glass Effect — Full Chat Page

## Problem
Current glassmorphism uses hardcoded `bg-white/10` and `border-white/20` which only works on dark themes. The project already has theme-aware CSS variables (`--glass`, `--glass-border`, `--glass-blur`) but they're not being used on the chat page.

## What Changes

### 1. New CSS Classes (`src/index.css`)
Add reusable `liquid-glass` utility classes that use the existing theme variables + iOS 26 characteristics:

- **`.liquid-glass`** — Primary surface (input bar, plus menu, dialogs): strong blur (40px), translucent bg from `--glass`, specular top highlight (inset white border), deep shadow
- **`.liquid-glass-subtle`** — Secondary surface (user bubbles, mode badges, nav buttons): lighter blur (24px), subtler bg
- **`.liquid-glass-button`** — Interactive elements (Photos/Files/Videos/Code pills, action buttons, toggle switches): micro glass with hover state enhancement
- **`.liquid-glass-hover`** — Hover-only glass (copy/like/dislike buttons): transparent at rest, glass on hover

All classes reference `--glass`, `--glass-border`, `--glass-blur` so they automatically adapt to every theme (dark, Ocean, Sahara, Aurora, Ember, Citrus).

### 2. AnimatedInput.tsx
Replace hardcoded `border-white/15 bg-white/[0.08] backdrop-blur-3xl` with `liquid-glass` class.

### 3. ChatMessage.tsx
- **User bubbles**: Replace `bg-white/10 backdrop-blur-2xl border-white/20` with `liquid-glass-subtle`
- **Action buttons** (Copy, Like, Dislike): Replace `hover:bg-white/10 hover:backdrop-blur-xl` with `liquid-glass-hover`
- **Product cards**: Add `liquid-glass-subtle` to shopping result cards
- **Context menu**: Use `liquid-glass` for the long-press popup

### 4. ChatPage.tsx
- **Navigation pills** (Photos, Files, Videos, Code): Replace `bg-secondary/40 border-border/50` with `liquid-glass-button`
- **Plus menu container**: Replace hardcoded glass with `liquid-glass`
- **Plus menu buttons** (Camera, Photos, Files): Add `liquid-glass-hover`
- **Mode toggles** (Web search, Learning, Shopping, Deep Research): Add `liquid-glass-hover`
- **Mode badges** (above input): Add `liquid-glass-subtle`
- **Scroll-to-bottom button**: Replace `bg-white/10 backdrop-blur-2xl border-white/20` with `liquid-glass-subtle`
- **Share/Rename/Invite dialogs**: Replace `glassDialogClass` with `liquid-glass`
- **Header menu dropdown**: Add `liquid-glass`
- **Attachment chips**: Add `liquid-glass-button`

### 5. Key CSS Properties (iOS 26 Liquid Glass recipe)
```css
.liquid-glass {
  background: hsl(var(--glass));
  border: 1px solid hsl(var(--glass-border));
  backdrop-filter: blur(40px) saturate(1.8);
  box-shadow:
    inset 0 1px 0 0 hsl(0 0% 100% / 0.12),  /* specular highlight */
    inset 0 -1px 0 0 hsl(0 0% 0% / 0.05),    /* bottom edge */
    0 8px 40px hsl(0 0% 0% / 0.15),           /* depth shadow */
    0 2px 8px hsl(0 0% 0% / 0.1);             /* close shadow */
}
```

## Files Changed

| File | Changes |
|------|---------|
| `src/index.css` | Add 4 `liquid-glass` utility classes |
| `src/components/AnimatedInput.tsx` | Use `liquid-glass` class |
| `src/components/ChatMessage.tsx` | Use `liquid-glass-subtle` and `liquid-glass-hover` |
| `src/pages/ChatPage.tsx` | Apply liquid glass to ALL interactive elements |

## Theme Compatibility
All classes use the existing `--glass` / `--glass-border` / `--glass-blur` variables which are already defined for every theme, so the effect automatically adapts.


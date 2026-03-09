

## Plan: Auth-Aware Navbar + Complete All Service Pages + Settings Cleanup

This is a large task with several components. Here's the breakdown:

---

### 1. Auth-Aware LandingNavbar

**File: `src/components/landing/LandingNavbar.tsx`**

- Add `supabase` auth state listener to detect if user is logged in
- When **logged out**: Show "Log in" + "Start Creating" buttons (current behavior)
- When **logged in**: Show a profile avatar button (using `Avatar` component) that navigates to `/settings` or `/chat`
- Fetch user avatar from Supabase profile, fallback to initials
- Apply to both desktop and mobile menu

---

### 2. Settings Desktop: Remove "Overview"

**File: `src/components/DesktopSettingsLayout.tsx`**

- Remove "Overview" from `NAV_ITEMS` array (the item with `id: "overview"` and `path: "/settings"`)
- Make "Billing" the first item, or redirect `/settings` to `/settings/billing`

**File: `src/pages/SettingsPage.tsx`**

- Update desktop branch: instead of showing "Welcome" with `DesktopSettingsHome`, show the Billing page content or redirect to `/settings/billing`

---

### 3. Expand Service Pages to Massive Landing-Style Pages

All 4 thin service pages need to become massive, matching the landing page aesthetic with real Megsy content. Each will include:
- Giant hero with floating images or background media
- Stats/numbers section
- Bento grid features section
- Interactive demo or showcase gallery
- How it works steps
- FAQ section
- CTA section
- Use existing showcase images from `/showcase/` and `/api-showcase/`

**Pages to expand:**
- `src/pages/services/ServiceVideosPage.tsx` — Currently ~100 lines, needs expansion to ~500+ with video demos, model showcase, bento grid
- `src/pages/services/ServiceChatPage.tsx` — Currently ~100 lines, needs expansion with chat demo, model list, features grid
- `src/pages/services/ServiceFilesPage.tsx` — Currently ~100 lines, needs expansion with file analysis showcase, supported formats, use cases
- `src/pages/services/ServiceCodePage.tsx` — Currently ~100 lines, needs expansion with code workspace preview, deployment showcase, tech stack

**Note:** `ServiceImagesPage.tsx` is already massive (~650 lines) and serves as the template for the others.

---

### 4. Generate New Images

Generate supporting images for the service pages where needed (code workspace preview, file analysis demo, video generation preview).

---

### Summary of Files to Edit

| File | Change |
|---|---|
| `LandingNavbar.tsx` | Add auth state, show avatar when logged in |
| `DesktopSettingsLayout.tsx` | Remove "Overview" nav item |
| `SettingsPage.tsx` | Redirect desktop to billing or remove overview |
| `ServiceVideosPage.tsx` | Massive expansion with real content |
| `ServiceChatPage.tsx` | Massive expansion with real content |
| `ServiceFilesPage.tsx` | Massive expansion with real content |
| `ServiceCodePage.tsx` | Massive expansion with real content |




# Plan: Desktop Settings Layout + Enhanced Settings Pages

## Overview
Add a responsive `DesktopSettingsLayout` component with sidebar navigation for desktop, while keeping the current mobile-first layout. Enhance settings pages to render differently based on screen size.

## Key Adaptation Notes
The provided code references many hooks/components that don't exist in this project (`useAuth`, `useThemeContext`, `useCreditCheck`, `usePremiumCheck`, `useSEO`, `T`, `tToast`, `formatMC`, react-icons). All will be adapted to use existing project patterns: direct `supabase` client, `useCredits` hook, `useIsMobile`, lucide-react icons, and `sonner` toast.

## Changes

### 1. Create `src/components/DesktopSettingsLayout.tsx`
- Sidebar with nav sections (Preferences, Agent & Integrations, Account & Billing, Support)
- Highlights active route via `useLocation`
- Logout button at bottom of sidebar
- Right content panel renders `children`
- Only used on desktop (pages check `useIsMobile()`)

### 2. Create `src/components/DesktopSettingsHome.tsx`
- Welcome panel shown when visiting `/settings` on desktop
- Shows user avatar, name, email, credits balance, plan status
- Quick action cards (Add Credits, Customization, Referrals)
- Uses `useCredits` hook for balance

### 3. Update `src/pages/SettingsPage.tsx`
- On mobile: keep current layout (list of nav items)
- On desktop: render `DesktopSettingsLayout` wrapping `DesktopSettingsHome`

### 4. Update all settings sub-pages to support desktop layout
Each page (`ProfileSettingsPage`, `CustomizationPage`, `BillingPage`, `LanguagePage`, `ReferralsPage`, `ApisPage`, `IntegrationsPage`, `StatusPage`, `AboutPage`) will:
- On mobile: keep current layout unchanged
- On desktop: wrap content in `DesktopSettingsLayout` (sidebar + content area)

### 5. Add new pages for Change Email, Change Password, Delete Account
- `src/pages/ChangeEmailPage.tsx` - email update form using `supabase.auth.updateUser`
- `src/pages/ChangePasswordPage.tsx` - password update with strength indicator
- `src/pages/DeleteAccountPage.tsx` - confirmation flow with "type DELETE" safeguard
- Add routes in `App.tsx`

### 6. Update `src/App.tsx`
- Add routes: `/settings/change-email`, `/settings/change-password`, `/settings/delete-account`

## File Summary
- **New**: `DesktopSettingsLayout.tsx`, `DesktopSettingsHome.tsx`, `ChangeEmailPage.tsx`, `ChangePasswordPage.tsx`, `DeleteAccountPage.tsx`
- **Modified**: `SettingsPage.tsx`, `ProfileSettingsPage.tsx`, `CustomizationPage.tsx`, `BillingPage.tsx`, `LanguagePage.tsx`, `ReferralsPage.tsx`, `ApisPage.tsx`, `IntegrationsPage.tsx`, `StatusPage.tsx`, `AboutPage.tsx`, `App.tsx`


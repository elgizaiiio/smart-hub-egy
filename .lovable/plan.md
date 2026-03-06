

# Megsy Platform - Comprehensive Update Plan

This is a large-scope update covering Chat UI, Images/Videos pages, Files page, Sidebar, Settings pages, Auth, Themes, and Animations. Here's the organized plan:

---

## 1. Chat Page (`ChatPage.tsx`)

- **Remove model selector from header** - move it inside the `+` menu (already partially done, but needs cleanup)
- **"Unlock Pro" button**: Replace with `FancyButton` centered in header, text = "Unlock Pro", with `+` new chat button on far right. Both hide with fade animation when conversation starts
- **Greeting**: Already "Hey, what's up?" - keep as-is
- **Remove "More Models" button** from `+` menu
- **Modes**: Make Learning Mode and Shopping Mode functional - they set a system prompt modifier (e.g. "You are in learning mode, explain things step by step")
- **Integrations button**: Navigate to `/settings` integrations section instead of being in menu
- **File/Image attachment**: Already shows inside input bar, verify works cleanly
- **Web Search fix**: Update search edge function to also request `images` from Serper API, pass images back to chat, and display them in ChatMessage. Also support URLs in search context

## 2. Thinking Animation (`ThinkingLoader.tsx` + `index.css`)

- **Replace current sparkle animation** with the Pegtop loader animation (already in CSS). Make stars bigger: increase `transform: scale(0.5)` to `scale(0.7)` and slow animation from `1s` to `1.8s`
- **Show ThinkingLoader persistently** below assistant messages during streaming (like Claude does), not just during initial thinking

## 3. Images Page (`ImagesPage.tsx`)

- **Center model dropdown**: Already has `centerDropdown` prop, ensure the dropdown opens centered on screen
- **Add missing models**: Add 5 latest fal.ai models (e.g., HiDream I1 Full, OmniGen2, FLUX Realism, Aura Flow v2, Stable Cascade - already in ModelSelector)
- **Make generation work**: Create a new edge function `generate-image` that calls fal.ai API with the selected model, returns the generated image
- **Publish to section in `+` menu**: Add Facebook, Instagram, LinkedIn buttons with Composio integration links

## 4. Videos Page (`VideosPage.tsx`)

- **Center model dropdown**: Same as images
- **Make generation work**: Create `generate-video` edge function calling fal.ai
- **Publish to in `+` menu**: Same social integrations as images

## 5. Files Page (`FilesPage.tsx`)

- **Make functional**: Connect to Lovable AI gateway with `google/gemini-3-flash-preview` model
- **After generation**: Show preview button for generated files (HTML preview in iframe, download as .txt/.md/.html/.pdf)
- **`+` menu**: Add attach document button and smart agents

## 6. Sidebar (`AppSidebar.tsx`)

- **Remove About and Logout buttons** from sidebar
- **Fix user info**: Load real user data from `supabase.auth.getUser()`
- **Fix credits**: Currently hardcoded to 0 - query from a credits field (we'll need to add a `profiles` table or use metadata)
- **Visa icon**: Add CreditCard icon next to user profile, clicking navigates to `/pricing`
- **Context-aware history**: Already filters by `currentMode` - verify it works

## 7. Settings Page (`SettingsPage.tsx`)

- **Show real user info** from Supabase auth
- **Add Logout button** at bottom
- **Keep About** in the Support section

## 8. Customization Page (`CustomizationPage.tsx`)

- **Fix themes**: Currently has `realThemes` array with `light`, `dark`, `ocean`, `sunset` but the theme IDs don't match CSS. Fix:
  - Theme 1: "Healthy Light" (id: `light`) - warm white
  - Theme 2: "Healthy Dark" (id: `dark`) - dark navy/slate
  - Theme 3: "Ocean" (id: `ocean`) - deep blue
  - Theme 4: "Sunset" (id: `sunset`) - warm amber/orange dark

## 9. Pricing Page (`PricingPage.tsx`)

- **Monthly/Yearly toggle**: Already implemented
- **Dark psychology pricing**: Adjust prices to use anchoring/charm pricing ($9.97, $29.97, $79.97)

## 10. Billing Page (`BillingPage.tsx`)

- **Megsy card**: Already has metallic M design - keep
- **Show credit operations**: Add usage history section that reads from a `credit_transactions` concept (mock for now since no table exists)

## 11. Profile Settings (`ProfileSettingsPage.tsx`)

- **Load real user data** from Supabase auth (email, name, avatar)
- **Show credits and plan**
- **Add Change Email, Change Password, Upgrade to Premium, Delete Account sections** matching the reference screenshot

## 12. Auth Page (`AuthPage.tsx`)

- **Fix email check logic**: Currently uses a hack (signing in with wrong password). Instead, just always go to password step - if signup, show "Create a password" placeholder; if signin, show "Enter your password". The current issue is it goes straight to password without differentiating. Fix the `checkEmailExists` function to properly detect if user exists using Supabase's approach

## 13. Edge Functions

- **Deploy `search` function**: Already exists, needs to return images properly
- **Deploy `generate-image` function**: New - calls fal.ai for image generation
- **Deploy `generate-video` function**: New - calls fal.ai for video generation
- **Update `chat` function**: Fix system prompt to say "Megsy" instead of "egy"

---

## Technical Details

### Files to edit:
- `src/pages/ChatPage.tsx` - Header restructure, modes functionality, integrations nav
- `src/components/ThinkingLoader.tsx` - Keep pegtop, enlarge stars
- `src/index.css` - Adjust pegtop animation speed/scale
- `src/pages/ImagesPage.tsx` - Center dropdown, real generation
- `src/pages/VideosPage.tsx` - Center dropdown, real generation
- `src/pages/FilesPage.tsx` - Connect to AI, preview system
- `src/components/AppSidebar.tsx` - Remove about/logout, fix user/credits
- `src/pages/SettingsPage.tsx` - Real user data, add logout
- `src/pages/CustomizationPage.tsx` - Fix theme IDs
- `src/pages/ProfileSettingsPage.tsx` - Real data, full profile page
- `src/pages/BillingPage.tsx` - Credit history
- `src/pages/AuthPage.tsx` - Fix email detection flow
- `src/components/ChatMessage.tsx` - Show search images, persistent loader
- `src/components/ModelSelector.tsx` - Remove "Free" labels from chat models
- `supabase/functions/chat/index.ts` - Fix system prompt
- `supabase/functions/search/index.ts` - Return images properly

### New edge functions:
- `supabase/functions/generate-image/index.ts` - fal.ai image generation
- `supabase/functions/generate-video/index.ts` - fal.ai video generation

### Database:
- Add `profiles` table with `credits` column via migration (needed for real credit tracking)


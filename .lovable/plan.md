

# Plan: Free Models (deapi.ai), Feature Gating, Chat Fixes, Studio Redesign, Enterprise Redesign, Landing Referral Sections

## Overview

This plan covers: adding free deapi.ai models, subscription gating for media/code, removing DeepSeek from chat, markdown support, chat UX fixes (mode badge scroll, model icons), studio redesign, enterprise page redesign, and landing page referral sections.

---

## 1. Database: deapi_keys Table + Migration

Create a `deapi_keys` table to store 500+ rotating API keys:

```sql
CREATE TABLE public.deapi_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key text NOT NULL,
  label text,
  usage_count int DEFAULT 0,
  last_used_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.deapi_keys ENABLE ROW LEVEL SECURITY;
-- Only service_role can access
```

Add Telegram bot commands to manage keys (add/remove/list/stats).

## 2. Edge Function: generate-image + generate-video Updates

**generate-image/index.ts:**
- Add deapi.ai models to MODEL_MAP with `provider: "deapi"` flag:
  - `"qwen-image-edit-plus"` → `POST https://api.deapi.ai/api/v1/client/img2img` with model slug
  - `"flux2-klein-4b"` → `POST https://api.deapi.ai/api/v1/client/txt2img` with model slug
  - `"z-image-turbo-int8"` → same endpoint
  - `"flux1-schnell"` → same endpoint
- For deapi models: fetch a random active key from `deapi_keys`, use it, increment `usage_count`. On failure (401/403), mark key inactive and retry with next key.

**generate-video/index.ts:**
- Add deapi.ai video models:
  - `"ltx-2.3-22b"` → `POST https://api.deapi.ai/api/v1/client/img2video` (image-to-video)
  - `"ltx-2-19b"` → `POST https://api.deapi.ai/api/v1/client/txt2video` (text-to-video)
- Same key rotation logic as images.

deapi.ai API pattern:
```
POST https://api.deapi.ai/api/v1/client/txt2img
Authorization: Bearer <KEY>
Body: { prompt, model: "<slug>", width, height, steps, seed }
```
Response returns `request_id`, poll with `GET /api/v1/client/request-status/{request_id}`.

## 3. Add Free Models to modelDetails.ts

Add these models (all 1 MC, provider "deapi"):

**Image models (text-to-image):**
- FLUX.2 Klein 4B BF16 (type: "image")
- Z-Image-Turbo INT8 (type: "image")
- FLUX.1 schnell (type: "image")

**Image models (image-to-image):**
- Qwen Image Edit Plus (type: "image", requiresImage: true)
- FLUX.2 Klein 4B BF16 (also supports img2img)

**Video models:**
- LTX-2.3 22B Distilled INT8 (type: "video-i2v", requiresImage: true)
- LTX-2 19B Distilled FP8 (type: "video", text-to-video)

## 4. Subscription Gating on Images/Videos/Code

**ImagesPage.tsx, VideosPage.tsx, CodeWorkspace.tsx:**
- Check user's plan from `profiles` table
- Free users can ONLY use the free deapi models (1 MC each)
- All other (fal.ai) models show a lock overlay → "Upgrade to Starter"
- In ModelPickerSheet, show a lock badge on gated models for free users
- When free user tries to select a gated model, show upgrade toast/redirect

**Logic:**
```ts
const isFreeModel = (modelId: string) => FREE_MODEL_IDS.includes(modelId);
// FREE_MODEL_IDS = ["qwen-image-edit-plus", "flux2-klein-4b", "z-image-turbo-int8", "flux1-schnell", "ltx-2.3-22b", "ltx-2-19b"]
```

## 5. Remove DeepSeek from Chat

- **ModelSelector.tsx**: Remove `{ id: "deepseek/deepseek-r1", name: "DeepSeek R1" }` from `CHAT_MODELS` and `code` models array
- **modelDetails.ts**: Already removed (verify)

## 6. Markdown + Tables Support in Chat

- **ChatMessage.tsx**: Already imports `ReactMarkdown`. Add `remarkGfm` plugin for table support:
  ```tsx
  import remarkGfm from "remark-gfm";
  <ReactMarkdown remarkPlugins={[remarkGfm]}>
  ```
- Add table styling in CSS or via components prop.

## 7. Chat Mode Badge Fixes

- **Deep Research badge icon**: Remove the `<Star>` icon from the mode badge (line ~629). Show only text "Deep Research Mode".
- **Scroll blocking by badge**: The mode badge `motion.div` at line 621 has `w-fit` which shouldn't block scroll. The issue is likely the badge's container intercepting touch events. Fix: add `pointer-events-none` to the badge wrapper, `pointer-events-auto` on the X button only.
- **Scroll issues when navigating chats**: Ensure `scrollToBottom` fires after `loadConversation` completes. Add `setTimeout(() => scrollToBottom(), 100)` after setting messages.

## 8. Model Icon Fix on Images/Videos Pages

The screenshot shows a colored circle instead of the model logo. The issue: `FALLBACK_LOGOS` in ImagesPage doesn't cover all dynamic models. When `selectedModel.iconUrl` is undefined and model ID isn't in FALLBACK_LOGOS, no logo renders.

**Fix**: In the model icon display area, if no `iconUrl` and no fallback, show the model name's first letter as a styled text badge (similar to `ModelBrandIcon`). Also ensure the `getDefaultModel("images")` returns a model that has a logo entry.

Since image/video models are fully dynamic, the default model may not be in FALLBACK_LOGOS. Fix `getDefaultModel` to handle this gracefully.

## 9. Studio Page Redesign

Current studio is functional but basic. Redesign `ImageStudioPage.tsx`:
- Full-bleed canvas background (dark card)
- Larger image display area (90% viewport)
- Floating toolbar at bottom with model selector + prompt input
- Thumbnail strip as horizontal scroll at top instead of tiny left sidebar
- Better loading state with the gradient animation from `GenerationLoader`
- Same treatment for `VideoStudioPage.tsx`

## 10. Enterprise Page Redesign

Redesign `EnterprisePage.tsx` with the Landing page aesthetic:
- Use `LandingNavbar` + `LandingFooter`
- Hero section with "Enterprise" headline
- Feature highlights in card grid (no icons/emoji)
- Trust signals (security, SLA, dedicated support)
- Form section below with same fields but better visual treatment
- Dark theme consistent with landing

## 11. Landing Page Referral Sections

Add two referral sections to `LandingPage.tsx`:

**Top section** (after StatsMarquee): "Earn Money with Megsy" banner
- Golden accent color (#FFD700)
- Key stats: 20% Forever, $0 Minimum, 90-Day Cookie, 24H Payout
- CTA button → `https://referral.megsyai.com`

**Bottom section** (before CTASection): Detailed referral block
- "Your Earnings" breakdown showing commission per plan
- 5-step process summary
- Calculator preview showing potential earnings
- CTA → referral.megsyai.com

Create `src/components/landing/ReferralBanner.tsx` and `src/components/landing/ReferralSection.tsx`.

## 12. Telegram Bot: deapi Key Management

Add commands to `telegram-bot/index.ts`:
- `🔑 مفاتيح deAPI` menu button
- Sub-commands: Add key, List keys (with usage stats), Remove key, Toggle active/inactive
- Show total active keys count and total usage

---

## Files to Create/Edit

| Action | File |
|--------|------|
| Migration | Create `deapi_keys` table |
| Edit | `supabase/functions/generate-image/index.ts` — add deapi models + key rotation |
| Edit | `supabase/functions/generate-video/index.ts` — add deapi video models + key rotation |
| Edit | `src/lib/modelDetails.ts` — add 7 free deapi models |
| Edit | `src/components/ModelSelector.tsx` — remove DeepSeek from CHAT_MODELS and code |
| Edit | `src/components/ModelPickerSheet.tsx` — add lock badge for gated models |
| Edit | `src/pages/ImagesPage.tsx` — subscription gating, icon fallback fix |
| Edit | `src/pages/VideosPage.tsx` — subscription gating, icon fallback fix |
| Edit | `src/pages/ChatPage.tsx` — mode badge fixes, scroll fix |
| Edit | `src/components/ChatMessage.tsx` — add remarkGfm for tables |
| Edit | `src/pages/ImageStudioPage.tsx` — full redesign |
| Edit | `src/pages/VideoStudioPage.tsx` — matching redesign |
| Edit | `src/pages/EnterprisePage.tsx` — full redesign with landing style |
| Create | `src/components/landing/ReferralBanner.tsx` |
| Create | `src/components/landing/ReferralSection.tsx` |
| Edit | `src/pages/LandingPage.tsx` — add referral sections |
| Edit | `supabase/functions/telegram-bot/index.ts` — deapi key management commands |
| Edit | `src/pages/CodeWorkspace.tsx` — subscription gating |


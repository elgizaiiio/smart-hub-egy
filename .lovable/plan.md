

# Megsy Platform - Comprehensive Fixes Plan

## Overview
This plan addresses ~15 distinct issues: sending files/images to AI, search image display, model selector positioning, pricing updates, authentication gating, sidebar filtering, white background, and user profile display.

---

## 1. Send Files/Images/Video to AI in Chat

**Problem**: Attached files/images are stored in `attachedFiles` state but never included in the API messages sent to the chat edge function.

**Fix**:
- **`ChatPage.tsx`**: When `attachedFiles` contains images, construct multimodal message content (array with text + image_url parts) instead of plain string. Include base64 data in the message payload.
- **`supabase/functions/chat/index.ts`**: Already passes messages through - multimodal content arrays are supported by both OpenRouter and Lovable AI gateway natively.
- Add video file support: accept `video/*` in the image input, read as base64, send as content part. OpenRouter models like GPT-5 support video input.
- The user message bubble should show attached image thumbnails above the text.

**Files**: `ChatPage.tsx`, `ChatMessage.tsx`

---

## 2. Search Images Above Text (Not Below)

**Problem**: In `ChatMessage.tsx`, images render after the text content (line 67-78). Also, search images are only added to messages in `onDone` callback, after streaming completes.

**Fix**:
- **`ChatMessage.tsx`**: Move the images block above the `prose-chat` text content block.
- **`ChatPage.tsx`**: When search returns images, immediately set them on the assistant message state during streaming (not just in onDone). Add images to the initial assistant message creation.

**Files**: `ChatMessage.tsx`, `ChatPage.tsx`

---

## 3. White Background Default

**Problem**: Default theme is dark (`data-theme: "dark"` in App.tsx line 34).

**Fix**:
- **`App.tsx`**: Change default theme from "dark" to "light".
- **`index.css`**: The light theme variables already exist (`:root` / `[data-theme="light"]`). The background is `40 20% 98%` which is a warm off-white. Change to pure white: `0 0% 100%`.

**Files**: `App.tsx`, `index.css`

---

## 4. Photos Button Opens Gallery (3 Daily Limit)

**Problem**: Currently Photos button opens file picker same as Camera.

**Fix**: Keep Photos as a file picker (`accept="image/*"` without `capture`) but remove `capture="environment"`. This opens the photo gallery on mobile. Add a daily limit check (3 images/day) using localStorage counter with date key.

**Files**: `ChatPage.tsx`

---

## 5. Model Selector Dropdown Positioning Fix

**Problem**: As shown in screenshots, the model dropdown in Images/Videos pages appears off-screen. The dropdown uses `absolute top-full mt-2 left-1/2 -translate-x-1/2` which goes outside viewport when the button is centered at the top.

**Fix**:
- **`ModelSelector.tsx`**: Use `fixed` positioning calculated from the button's `getBoundingClientRect()`. Position dropdown directly below the button, centered horizontally, clamped to viewport edges. Use a `useEffect` to compute position when `open` changes.

**Files**: `ModelSelector.tsx`

---

## 6. Files Button Opens Device Files

**Problem**: Files button in chat currently opens file picker with limited extensions.

**Fix**: Already works correctly - the `fileInputRef` triggers a file picker. Just ensure the accept attribute includes common file types: `.pdf,.txt,.md,.csv,.json,.js,.ts,.py,.html,.css,.docx,.xlsx`.

**Files**: `ChatPage.tsx`

---

## 7. Mode Badge (Blur Badge for Learning/Shopping, Not Search)

**Problem**: No visual indicator when modes are active.

**Fix**: Add a small blurred badge/dot next to the input area or model name when Learning or Shopping mode is active. Do NOT show badge for search mode (search integrates silently).

**Files**: `ChatPage.tsx`

---

## 8. Image Analysis (User Uploads Analyzed by AI)

**Problem**: Images are attached but not sent to the AI model. Same as issue #1.

**Fix**: Covered by #1 - send image data as multimodal content to the AI. The AI models (GPT-5, Gemini) all support image analysis natively.

---

## 9. Links Open in Popup

**Problem**: AI response links open normally.

**Fix**: In `ChatMessage.tsx`, customize ReactMarkdown's `a` component to open links via `window.open()` popup or a modal iframe preview.

**Files**: `ChatMessage.tsx`

---

## 10. Require Auth Before Showing Content

**Problem**: All routes are accessible without authentication.

**Fix**:
- **`App.tsx`**: Create a `ProtectedRoute` wrapper component that checks `supabase.auth.getUser()`. If no user, redirect to `/auth`. Wrap all routes except `/auth` and `/pricing` with it.

**Files**: `App.tsx`

---

## 11. Update Pricing

**Problem**: Current prices are $9.97/$29.97/$79.97 monthly.

**Fix**: Update to:
- Starter: $25/mo, $199/yr
- Pro: $49/mo, $499/yr  
- Business: $149/mo, $1299/yr

**Files**: `PricingPage.tsx`

---

## 12. Remove Lovable AI Fallback, Use fal.ai Directly

**Problem**: Previous fix added Lovable AI fallback because fal.ai balance was exhausted. Now fal.ai has balance again.

**Fix**: Remove the fallback logic in `generate-image/index.ts`. Keep `generateWithFal` as the only path. Remove `generateWithLovableAI` function and the try/catch fallback wrapper. Keep `nano-banana-2` routing to Lovable AI since it's a Gemini model.

**Files**: `supabase/functions/generate-image/index.ts`

---

## 13. Sidebar: Don't Show Conversations for Images/Videos/Files

**Problem**: Sidebar shows recent conversations filtered by `currentMode`, but Images/Videos/Files pages pass their mode, showing those conversations.

**Fix**: In `AppSidebar.tsx`, only show the "Recent" conversations section when `currentMode === "chat"` or `currentMode === "code"`. For images/videos/files, hide the recent section entirely.

**Files**: `AppSidebar.tsx`

---

## 14. User Name/Avatar Not Showing Correctly

**Problem**: Shows "User" and no real avatar. The `handle_new_user` trigger creates profiles with `display_name` from `full_name` metadata and `avatar_url` from metadata. But if user signs up with email/password, these metadata fields are empty.

**Fix**:
- The trigger already sets `display_name` to `split_part(email, '@', 1)` as fallback - this should work.
- In `AppSidebar.tsx` and `SettingsPage.tsx`, the profile query looks correct. The issue is likely that the profile row exists but `display_name` is null for some users. Add better fallback: use email prefix if display_name is null.
- Ensure `loadUserInfo` in sidebar correctly falls back through: `profile.display_name` -> `user.user_metadata.full_name` -> `user.email.split('@')[0]` -> "User"

**Files**: `AppSidebar.tsx`, `SettingsPage.tsx`

---

## 15. Database Completeness

The existing tables (conversations, messages, memories, profiles) cover the current functionality. No new tables needed for these fixes. The `profiles` table already has `avatar_url`, `display_name`, `credits`, and `plan` columns.

---

## Implementation Order

1. **Quick UI fixes**: White background, pricing update, auth gating, sidebar filtering, mode badges
2. **Core functionality**: Send files/images to AI (multimodal messages), search images above text
3. **Model selector positioning**: Fixed positioning with viewport clamping
4. **Edge functions**: Remove Lovable AI fallback from generate-image
5. **Links popup, daily photo limit**

## Files Summary

| File | Changes |
|------|---------|
| `ChatPage.tsx` | Multimodal messages, photo gallery, mode badges, file accept types |
| `ChatMessage.tsx` | Images above text, links in popup |
| `ModelSelector.tsx` | Fixed dropdown positioning |
| `AppSidebar.tsx` | Hide recent for non-chat modes, avatar fallback |
| `SettingsPage.tsx` | Avatar fallback |
| `App.tsx` | White default theme, ProtectedRoute wrapper |
| `index.css` | White background for light theme |
| `PricingPage.tsx` | New prices ($25/$49/$149 monthly, $199/$499/$1299 yearly) |
| `generate-image/index.ts` | Remove Lovable AI fallback, use fal.ai directly |


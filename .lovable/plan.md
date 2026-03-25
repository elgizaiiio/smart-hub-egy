

# Chat Page Comprehensive Redesign Plan

This is a large set of changes spanning the input bar, header, sidebar, deep research, shopping mode, notifications, dialogs, and the edge function. Here is the full breakdown.

---

## 1. Input Bar Fixes

**Animated placeholder issue**: The current `AnimatedInput` still has potential interference between the placeholder animation and actual typing. Will audit the `useEffect` dependencies and ensure the interval is fully cleared the moment `value` changes, using a stable `useRef` pattern.

**Plus (+) and Send buttons**: Increase icon container size from `w-7/w-8` to `w-9 h-9`, and vertically center them with `items-center` instead of `items-end` on the flex row.

**Plus menu backdrop**: Add stronger `backdrop-blur-2xl bg-black/60` to the menu container and ensure the `fixed inset-0 z-[45]` backdrop click handler closes it reliably.

---

## 2. Empty State Centering

Move "Ask Megsy ?" heading and service navigation pills to exact vertical + horizontal center using `flex items-center justify-center h-full`. Remove extra padding that pushes content down.

---

## 3. Unlock Pro Button

Replace the plain text+Crown button in the header with the `FancyButton` component (same as ProgrammingPage), centered in the header. When a conversation is active, it stays visible alongside the 3-dot menu.

---

## 4. Header Behavior on Conversation Start

When `messages.length > 0`:
- Hide all header content except: sidebar menu button (left) and 3-dot MoreVertical button (right)
- Both floating, transparent, no background
- Unlock Pro moves inside the 3-dot dropdown menu

When `messages.length === 0`:
- Show full header with FancyButton centered

---

## 5. Full-Height Layout Without Scroll Issues

Ensure the chat container uses `h-[100dvh]` with proper flex layout so the header, messages area, and floating input all fit without the input disappearing or requiring scroll on the page itself (only messages scroll).

---

## 6. Sidebar Redesign

**Visual overhaul**:
- Apply FancyButton-style animated gradient background to the sidebar itself (using CSS from `.fancy-btn` adapted for the sidebar panel)
- All sidebar items: borderless, transparent hover states
- Add subtle animated particle/glow effects similar to FancyButton's `.points_wrapper`

**Structure**: Keep existing functionality (services, recent chats, user info, credits bar) but with the new visual treatment.

---

## 7. Deep Research Mode Improvements

**Edge function changes** (`supabase/functions/chat/index.ts`):
- Increase search count from 3-5 to 6-10 searches
- Always include `include_images: true` for deep research searches
- Add image search calls for every deep research query (not just when explicitly requested)
- Forward collected images via the `images` SSE event so they render in chat
- Update system prompt to instruct: "Divide research into sub-tasks, search each thoroughly, include relevant images in your final report"

**Frontend**: Deep research results already render images via `ChatMessage` -- ensure the images array flows through properly.

---

## 8. Shopping Mode Enhancement

**Edge function**: Add a shopping-specific system prompt when `chatMode === "shopping"`:
- Instruct the AI to search multiple stores, extract product info
- Output product cards as structured JSON blocks:
  ```json
  {"type":"cards","items":[{"title":"Product Name","description":"Description + Price","action":"Buy","link":"https://store.com/product","image":"https://..."}]}
  ```
- Inject smart questions to clarify: budget, brand preference, features needed

**Frontend** (`InfoCards.tsx`): Extend card rendering to support `image` and `link` fields -- show product image, and make the action button open the store link.

---

## 9. Search Images for People

Already partially implemented. Ensure `include_images: true` is passed for all person-related searches. The images SSE event already renders in `ChatMessage`. Verify the image rendering works by checking the `images` prop flow.

---

## 10. Smart Questions Visibility

Add a visual hint when smart questions/cards appear. The AI's system prompt will include: "When presenting interactive options, add a brief line like 'Choose from the options below' or 'Click on any card below' before the JSON block."

---

## 11. Integration Connect Button in Chat

When the AI detects a tool call fails (service not connected), it already outputs a text message. Enhance this to include a structured block:
```json
{"type":"cards","items":[{"title":"Connect [Service]","description":"This action requires connecting your account","action":"Connect"}]}
```
Frontend: When a card with action "Connect" is clicked, navigate to `/settings/integrations`.

---

## 12. Dialog Redesigns

**Rename dialog**: Glassmorphism style -- `bg-black/80 backdrop-blur-2xl border-white/10 rounded-2xl`. Ensure text stays inside the container with `overflow-hidden` and `truncate` on the generated URL.

**Share dialog**: Same glass treatment. Fix the URL overflow
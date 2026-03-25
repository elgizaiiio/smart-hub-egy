

# Comprehensive Chat, Files, Sidebar & Notifications Update

This plan covers all the requested changes across multiple files.

---

## Changes Overview

### 1. Smart Questions Not Showing
The smart questions logic in `ChatPage.tsx` (lines 179-196) only checks the PREVIOUS assistant message when a NEW user message arrives. This means questions are never shown at the right time. Fix: detect questions from the LATEST assistant message immediately after streaming completes, not only when a new user message is sent.

### 2. Shopping Product Card Images Not Loading
`InfoCards.tsx` renders `<img src={item.image}>` but shopping mode images come from web search results which may have CORS issues or broken URLs. Add error handling with `onError` fallback and a placeholder. Also ensure the edge function's shopping prompt instructs the AI to use direct image URLs.

### 3. Floating Input Bar (Messages Pass Behind It)
Currently the bottom input has `sticky bottom-0` with a gradient background. Change to `fixed bottom-0` with fully transparent/blur background so messages scroll freely underneath.

### 4. Remove Crown Icon from Unlock Pro Button
In `ChatPage.tsx` header, remove `<Crown>` from the FancyButton. Remove Unlock Pro from the 3-dot dropdown menu entirely.

### 5. Remove Unlock Pro from Sidebar
In `AppSidebar.tsx`, remove the FancyButton/Unlock Pro section (lines 172-178). Add a credits icon button next to the user profile that navigates to `/pricing`.

### 6. Sidebar "New Chat" Button Redesign
Give it a visible background: `bg-white/15 rounded-xl` with hover effect, making it stand out.

### 7. Sidebar Random Color on Each Open
Replace the fixed gradient with a JS-driven random color palette. In `AppSidebar.tsx`, use `useState` with random selection from 6+ color palettes on each mount. Apply via inline `style` on the aside element. Keep the same animation keyframes.

Color palettes:
- Navy/Blue (current)
- Purple/Violet
- Teal/Emerald
- Rose/Pink
- Amber/Orange
- Slate/Charcoal

### 8. User Profile Button Different Color + Credits Icon
Give the user info button at the bottom a distinct `bg-white/10` background. Add a small coin/credits icon button beside it linking to `/pricing`.

### 9. Files Page - Smart File Agent
Upgrade `FilesPage.tsx` to use the full agent system:
- Pass `mode: "files"` to the chat edge function (already done)
- Update the edge function's `files` mode system prompt to include the full Decision Engine: `analyze_file`, `answer`, `extract`, `rewrite`, `generate_document`, `ask_user`, `auto_review`, `multi_file_analysis`, `external_connection_required`
- Add auto-review behavior: if user uploads file without text, agent automatically reviews
- Add smart questions support (reuse the same JSON block pattern from chat)
- Add Connect card support for external services
- Support PPTX JSON output format
- Use streaming for the response (already partially done, but improve to show real-time text)

### 10. Share & Invite - Make Fully Functional
The invite system already has DB tables and handlers. Verify invite email sends by checking the edge function. Fix: ensure `handleSendInviteEmail` also sends an actual email via the `send-email` edge function. Fix: ensure invite link works when opened by another user.

### 11. Notification System - Mobile Redesign
Replace the `NotificationBell` popover with a slide-up drawer (using the existing `Drawer` component from vaul). Add a bell icon in the chat header. On tap, open a full-width bottom drawer with notifications list.

### 12. Input Bar Placeholder Text Fix
The placeholder animation in `AnimatedInput.tsx` currently appends `"│"` cursor character in FilesPage but not in ChatPage. Ensure consistency. The main ChatPage AnimatedInput already has the fix with `useRef` pattern - verify it works.

---

## Technical Details

### Files to modify:

1. **`src/pages/ChatPage.tsx`**
   - Fix smart questions detection: add `useEffect` that checks the latest assistant message for questions blocks when streaming ends
   - Make input bar `fixed` instead of `sticky`
   - Remove Crown from FancyButton, remove Unlock Pro from dropdown
   - Add Bell icon in header opening notification drawer

2. **`src/components/AnimatedInput.tsx`**
   - No changes needed (already working)

3. **`src/components/InfoCards.tsx`**
   - Add `onError` handler to `<img>` with fallback placeholder
   - Add loading state for images

4. **`src/components/AppSidebar.tsx`**
   - Remove FancyButton/Unlock Pro section
   - New chat button: add `bg-white/15 rounded-xl` background
   - Random color palette on mount using `useMemo` with random selection
   - User button: distinct background + credits icon linking to `/pricing`
   - Pass random gradient colors via inline style

5. **`src/index.css`**
   - Remove fixed sidebar gradient colors (moved to JS)

6. **`src/pages/FilesPage.tsx`**
   - Upgrade to smart agent: auto-review when file uploaded without text
   - Add structured blocks rendering (questions, cards, flow)
   - Reuse `ChatMessage` component or add parsing for JSON blocks
   - Add Connect button support

7. **`supabase/functions/chat/index.ts`**
   - Update `files` mode system prompt with full Decision Engine
   - Add auto-review instructions
   - Add smart questions support for files mode

8. **`src/components/NotificationBell.tsx`**
   - Redesign as a bottom drawer using `Drawer` component
   - Full-width slide-up panel on mobile
   - Add to chat header

9. **`src/components/ChatMessage.tsx`**
   - No structural changes needed (questions blocks already return null in structured rendering, which is correct since they're shown in the input bar)


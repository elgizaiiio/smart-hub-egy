

# Plan: Chat Page Overhaul — Real Status, Clean UI, Smart Agent

## Summary
Fix the ThinkingLoader to show only real backend events (not random cycling), remove the Megsy Computer badge above input, make agent badges plain text, and switch to `anthropic/claude-haiku-4.5` via LemonData as the primary model.

---

## Changes

### 1. ThinkingLoader — Real Status Only (ThinkingLoader.tsx)
**Problem**: Status text cycles randomly through "Thinking → Searching → Reading → Writing" even when nothing real is happening.

**Fix**:
- Remove the `STATUS_CYCLE` interval that rotates text every 2.4s
- Default display: just "Thinking" with the animated star (no cycling)
- When `statusHistory` has entries, show the **latest real status** as the main text next to the star
- When `isComputerUse` is true: show "Megsy Computer" as a **fixed line** with the star, then below it show real steps from `statusHistory`
- The star color changes based on the **actual latest status keyword** (contains "search" → blue, "writing" → green, etc.), not a timer
- Remove the fake fallback steps ("Understanding the request", "Processing", "Generating response") — only show real `statusHistory`

### 2. Remove Megsy Computer Badge Above Input (ChatPage.tsx)
- Remove the violet `Megsy Computer` button/badge that appears above the input bar (lines 844-849)
- Keep the toggle in the `+` menu — that stays
- The computer use state is shown only in the ThinkingLoader during active use

### 3. Agent Badge → Plain Text (ChatPage.tsx + AnimatedInput.tsx)
- Replace `<AgentBadge>` component usage in the input area with plain text like `@shopping` or `@learning`
- No colors, no icons, no backgrounds — just simple `text-muted-foreground text-xs` with the @ mention text
- The `AgentBadge` component stays for other uses, but in the input bar it becomes plain text

### 4. Switch Default Model to claude-haiku-4.5 (ChatPage.tsx + chat/index.ts)
- Change `MEGSY_MODEL` from `"auto"` to `"anthropic/claude-haiku-4.5"` (fast, smart, via LemonData)
- In `chat/index.ts`, update the default model from `"claude-haiku-4-5"` to `"claude-haiku-4-5"` (already correct internally but ensure consistency)
- Remove the `detectComplexity` function — always use claude-haiku-4.5 for speed and intelligence

### 5. Input Bar Style Match (AnimatedInput.tsx)
- Make the chat input visually match the `UnifiedInputBar` used in Images/Studio:
  - Slightly larger min-height
  - Same rounded style and spacing

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/ThinkingLoader.tsx` | Remove cycling interval, show only real statuses, fix Computer Use display |
| `src/pages/ChatPage.tsx` | Remove Megsy Computer badge above input, plain text for agent mode |
| `src/components/AnimatedInput.tsx` | Replace AgentBadge with plain @text in input area |
| `supabase/functions/chat/index.ts` | Ensure model is `claude-haiku-4-5` consistently |


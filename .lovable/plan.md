

# Three Changes: Shopping API Integration, Deep Research Cleanup, iOS Glassmorphism

## 1. Integrate Shoppy-Wise-AI as Shopping Tool

The shoppy-wise-ai project is a **free, open API** (no API key needed) at:
`https://ygsoyowrumtntnlasmmh.supabase.co/functions/v1`

**Changes in `supabase/functions/chat/index.ts`:**
- Replace the Serper `SHOPPING_SEARCH` tool execution with calls to the Shoppy-Wise API
- `GET /shopping-search?q={query}&currency={currency}&country={country}&type={type}&limit=20`
- Parse response: `data.products` array with `title, price, converted_price, source, image, url`
- Also add `CONVERT_CURRENCY` tool: `GET /currency-convert?amount={amount}&from={from}&to={to}`
- Remove the external redirect from Shopping Mode in `ChatPage.tsx` — shopping now works natively again via the API
- Keep Serper `WEB_SEARCH` for product reviews/comparisons alongside the new shopping API

## 2. Deep Research: Hide Internal Results & Remove Sources

**Changes in `supabase/functions/chat/index.ts`:**
- In the deep research synthesis prompt, add explicit instruction: "Do NOT include a Sources/References section at the end"
- Add stronger filtering in `pushStatus()` to suppress any internal step leaks

**Changes in `src/components/ChatMessage.tsx`:**
- When rendering deep research messages, hide the "Sources" footer section (the favicon row at the bottom)
- Detect deep research context via a new `isDeepResearch` prop or by checking if the message is long (3000+ chars with research structure)

**Changes in `src/pages/ChatPage.tsx`:**
- Pass `isDeepResearch` flag to ChatMessage for the assistant messages when `chatMode === "deep-research"`
- Filter out any status messages that leak tool names in `normalizeStatusLabel`

## 3. iOS Glassmorphism Effect on Chat Page

Inspired by the iPhone glass animation, apply premium glassmorphism to:

**User message bubbles:**
- `bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_8px_32px_rgba(0,0,0,0.3)]`

**Input bar container:**
- `bg-white/8 backdrop-blur-3xl border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_20px_60px_rgba(0,0,0,0.4)]`
- Subtle gradient overlay on the border for the "light refraction" effect

**Plus menu & mode badges:**
- Enhanced glass: `bg-white/5 backdrop-blur-3xl border border-white/10`

**Action buttons (Copy, Like, Dislike):**
- Glass hover states: `hover:bg-white/10 hover:backdrop-blur-xl`

**Scroll-to-bottom button:**
- Glass circle: `bg-white/10 backdrop-blur-2xl border border-white/20`

All changes use CSS-only glassmorphism (no heavy animations), matching the premium iOS aesthetic the user saw.

## Files Changed

| File | Changes |
|------|---------|
| `supabase/functions/chat/index.ts` | Replace SHOPPING_SEARCH with Shoppy-Wise API, hide sources in deep research prompt, strengthen status filtering |
| `src/pages/ChatPage.tsx` | Remove shopping redirect (back to native mode), pass `isDeepResearch` to ChatMessage, apply glass styles to input area |
| `src/components/ChatMessage.tsx` | Add `isDeepResearch` prop, hide sources section for deep research, apply glass styles to user bubbles and buttons |
| `src/components/AnimatedInput.tsx` | Apply glassmorphism to input container |


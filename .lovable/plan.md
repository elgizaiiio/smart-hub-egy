

# Comprehensive Fix Plan — 10 Issues

## Summary of Problems Found

After thorough code review, here are the root causes:

1. **Computer opens without analyzing** — `buildForcedToolCalls` triggers `BROWSE_WEBSITE` on ANY search intent, even simple questions. The AI model never gets a chance to think first.
2. **View Live shows nothing real** — The dialog only shows `friendlyHistory` (deduplicated static labels), not real-time browser data. No live iframe/screenshot stream.
3. **Deep Research exposes internal operations** — Status messages like "Searching stores...", "Gathering trusted sources..." and raw tool markers leak to the user.
4. **"الاطلاع على الصورة" button** — `artifactActions` in `ChatMessage.tsx` (line 327-344) builds buttons for ANY image URL including search result images. Must be removed entirely.
5. **Images open externally** — `onClick={() => window.open(img, '_blank')}` on line 426 opens images in a new tab instead of an in-app `ImagePreviewModal`.
6. **Shopping doesn't ask for country/currency** — The system prompt guesses from Arabic text, never actually asks the user. No account-wide memory storage.
7. **Megsy Computer badge layout** — Currently shown as a full card (lines 97-128). Should be: star + "Megsy Computer" + small button on ONE line, then a second line with star + status text.
8. **Files page broken** — Uses direct `fetch` to chat function, no Manus integration, no real preview system.
9. **Programming preview** — Already works via `react-runner` inline. The user confirmed "Inline preview tab" is the desired behavior.
10. **Voice tools via Manus** — No Manus integration exists anywhere in the codebase yet.

---

## Phase 1: Fix Computer Use Intelligence (P0)

### Problem
`shouldForceComputerFlow` (chat/index.ts line 534) forces browser for ALL search intents. This means even "what is React?" opens the browser.

### Solution
- Remove `buildForcedToolCalls` for normal chat mode entirely
- Keep forced tool calls ONLY for `shopping` mode and `deep-research` mode
- For normal chat: let the AI model decide via `tool_choice: "auto"` whether to call `BROWSE_WEBSITE`
- Add a stronger system prompt hint: "Only use BROWSE_WEBSITE when the task genuinely requires visiting a real website"
- The model already has the tool definitions — let it reason instead of force-calling

### Files
- `supabase/functions/chat/index.ts` — modify `shouldForceComputerFlow` condition

---

## Phase 2: Real-time View Live Dialog (P0)

### Problem
The "View Live" dialog shows only static `friendlyHistory`. The `browserLiveState` has `screenshotUrl` and `liveUrl` but they're barely used.

### Solution
Redesign `ThinkingLoader.tsx`:
- **Default state**: One line — animated star + "Megsy Computer" text + small "View" pill button
- **Second line below**: animated star + dynamic status text ("Searching the web...", "Collecting data...")
- **View Live dialog**: Show `browserLiveState.screenshotUrl` as a refreshing image (poll every 2s), real-time step log from `statusHistory`, and current generic status (never show URLs)
- **Obfuscate all URLs**: Replace any URL in status with "a website" or just remove it
- All text in English

### Files
- `src/components/ThinkingLoader.tsx` — full redesign

---

## Phase 3: Hide Internal Operations from Deep Research (P0)

### Problem
Status messages like tool names and raw search queries appear in the chat.

### Solution
- In `ChatPage.tsx` `onStatus` callback (line 376-385): filter out ANY status that contains tool names or raw queries
- `normalizeStatusLabel` already exists but doesn't catch everything
- Add a blocklist: any status containing "BROWSE_WEBSITE", "WEB_SEARCH", "SHOPPING_SEARCH", "Running", raw URLs, or query strings should be mapped to generic labels
- Only show: "Thinking...", "Searching the web...", "Analyzing results...", "Writing the report..."

### Files
- `src/pages/ChatPage.tsx` — enhance `normalizeStatusLabel` and `onStatus` filter

---

## Phase 4: Remove "الاطلاع على الصورة" Button Completely (P0)

### Problem
`artifactActions` in `ChatMessage.tsx` generates Arabic buttons for every image/URL.

### Solution
- Delete the entire `artifactActions` useMemo block (lines 327-344)
- Delete the rendering block (lines 499-513) that displays these buttons
- Delete `getArtifactActionLabel` function (lines 50-56)

### Files
- `src/components/ChatMessage.tsx`

---

## Phase 5: In-app Image Preview (P1)

### Problem
Search result images open in new tab via `window.open`.

### Solution
- Import `ImagePreviewModal` in `ChatMessage.tsx`
- Add state `const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)`
- Change image `onClick` from `window.open(img, '_blank')` to `setPreviewImageUrl(img)`
- Render `<ImagePreviewModal url={previewImageUrl} onClose={() => setPreviewImageUrl(null)} />` at end of component

### Files
- `src/components/ChatMessage.tsx`

---

## Phase 6: Shopping Country/Currency Memory (P1)

### Problem
System prompt guesses country from Arabic text. Never asks user. No persistent memory.

### Solution
- On first shopping message, if no `user_memory_entries` record exists with `scope='account'` and key `shopping_preferences`, the system prompt instructs the AI to ask the user for their country and preferred currency
- When the AI gets the answer, the backend saves it to `user_memory_entries` table
- On subsequent shopping sessions, the backend fetches this preference and injects it into the system prompt
- Add to `chat/index.ts`: query `user_memory_entries` for shopping preferences when `isShopping`

### Files
- `supabase/functions/chat/index.ts` — fetch and use shopping preferences from memory
- DB migration: ensure `user_memory_entries` table works for this (it already exists in schema)

---

## Phase 7: Files Page — Manus AI Integration (P1)

### Problem
Files page generates HTML locally and preview is broken.

### Solution (Hybrid approach as user requested)
1. Create `supabase/functions/manus-agent/index.ts` edge function:
   - Accept task description, use Manus API when available (need API key)
   - Fallback: use Hyperbrowser to automate manus.im website
   - Smart key rotation from `api_keys` table (service='manus')
   - Stream progress steps back via SSE
2. Update `FilesPage.tsx`:
   - For slides/documents: call `manus-agent` function instead of direct chat
   - Display real-time progress from Manus (like the reference screenshots)
   - Preview: render returned HTML in an iframe
   - Redesign page with landing page aesthetic (dark bg, gradient text, modern cards)
3. Add Manus key management via Telegram bot (extend existing bot)

### Files
- `supabase/functions/manus-agent/index.ts` (new)
- `src/pages/FilesPage.tsx` (redesign)
- `supabase/functions/telegram-bot/index.ts` (extend for Manus keys)

---

## Phase 8: Voice Tools via Manus AI (P2)

### Problem
Voice tools call `generate-voice` edge function which has issues.

### Solution
- Create voice task routing through Manus for complex tasks (podcast creation, music with lyrics)
- Keep simple TTS/STT through existing Deepgram/OpenRouter
- For music generation: AI analyzes prompt → generates lyrics/genre → sends to provider
- Update `generate-voice` function to route appropriately

### Files
- `supabase/functions/generate-voice/index.ts` (update routing)
- `supabase/functions/manus-agent/index.ts` (add voice task support)

---

## Phase 9: Programming Preview (Already Working)

The programming workspace already has an inline preview tab using `react-runner`. No changes needed per user confirmation.

---

## Phase 10: Obfuscate Browser Status in ThinkingLoader

### Already covered in Phase 2
- `pushBrowser` sends Arabic text like "بدأت استخدام Megsy Computer" — change to English
- Remove `currentUrl` from display, replace with generic "Searching the web"
- `toFriendlyStep` already maps most statuses but needs more coverage

### Files
- `supabase/functions/chat/index.ts` — change Arabic browser status messages to English
- `src/components/ThinkingLoader.tsx` — expand `toFriendlyStep` mapping

---

## Implementation Order

1. Phase 1 — Fix computer use intelligence (stop force-triggering)
2. Phase 3 — Hide internal operations
3. Phase 4 — Remove "الاطلاع على الصورة"
4. Phase 5 — In-app image preview
5. Phase 2 — Redesign ThinkingLoader + View Live
6. Phase 10 — Obfuscate browser status (merged with Phase 2)
7. Phase 6 — Shopping memory
8. Phase 7 — Files page Manus integration
9. Phase 8 — Voice tools Manus routing

---

## Technical Details

**Key files to modify:**
- `supabase/functions/chat/index.ts` — line 534 `shouldForceComputerFlow`, lines 1109-1210 browser status messages
- `src/components/ThinkingLoader.tsx` — full redesign
- `src/components/ChatMessage.tsx` — remove artifact buttons, add ImagePreviewModal
- `src/pages/ChatPage.tsx` — enhance status filtering
- `src/pages/FilesPage.tsx` — full redesign with Manus
- `supabase/functions/manus-agent/index.ts` — new edge function

**New edge function needed:** `manus-agent` for file generation and complex voice tasks

**DB migration needed:** Insert shopping preferences into `user_memory_entries` (table already exists)


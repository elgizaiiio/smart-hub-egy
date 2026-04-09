

# Plan: Agent System Overhaul + Remove Megsy Computer UI

## What You'll Get
A completely rebuilt agent orchestration backend for Shopping, Deep Research, and Normal Chat — with modular functions, retry logic, currency conversion, validation, confidence scoring, and cross-agent collaboration. Plus removal of the Megsy Computer badge/box from the chat UI.

---

## Phase 1: Remove Megsy Computer UI from Chat (Frontend)

**Files:** `ChatPage.tsx`, `ChatMessage.tsx`, `ThinkingLoader.tsx`

1. **ChatPage.tsx:**
   - Remove `ThinkingLoader` import and all `browserLiveState` state
   - Remove `statusHistory` state and all `setBrowserLiveState` / `setStatusHistory` calls
   - Remove `BROWSER_STATUS_REGEX`, `isBrowserStatus`, `normalizeStatusLabel` — replace with a simple inline status text
   - Remove Megsy Computer toggle from plus menu
   - Remove `computerUseEnabled` state entirely
   - Keep `searchStatus` as a simple one-line text under the assistant bubble (e.g., "Searching..." or "Comparing options...")
   - Remove all `browserLiveState` props from `ChatMessage`

2. **ChatMessage.tsx:**
   - Remove `ThinkingLoader` component usage
   - Remove `browserLiveState`, `statusHistory` props
   - Keep `searchStatus` as a simple animated text line with a spinning star, no dialog, no "View Live" button
   - Show only generic labels: "Thinking...", "Searching the web...", "Comparing options...", "Writing response..."

3. **ThinkingLoader.tsx:**
   - Simplify to a minimal component: animated star + one-line status text
   - Remove the entire View Live dialog, screenshot polling, activity log
   - No "Megsy Computer" branding visible to user

---

## Phase 2: Modular Backend Functions (Edge Function)

**File:** `supabase/functions/chat/index.ts`

Create reusable internal functions at the top of the file:

```text
┌─────────────────────────────┐
│  Modular Function Library   │
├─────────────────────────────┤
│ searchProducts(query, opts) │  → Serper shopping + validation
│ searchWeb(query, opts)      │  → Serper web search + images
│ browseWebsite(goal, url)    │  → Hyperbrowser agent
│ convertCurrency(amount,     │  → Exchange rate API
│   from, to)                 │
│ extractText(html)           │  → Clean text extraction
│ summarizeText(text, limit)  │  → Truncate + summarize
│ validateProduct(product)    │  → Check all fields exist
│ generatePreview(data)       │  → HTML preview builder
│ retryWithFallback(fn, opts) │  → Adaptive retry wrapper
└─────────────────────────────┘
```

Key additions:
- `retryWithFallback(fn, maxRetries, backoffStrategy)` — wraps any async call with exponential backoff, different strategy per error type (network → retry fast, 429 → wait longer, 4xx → try fallback source)
- `validateProduct(p)` — ensures title, price, link all exist; drops invalid entries
- `convertCurrency(amount, from, to)` — calls exchangerate-api.com (free tier) for real-time conversion
- `confidenceScore(result)` — returns 0-1 based on data completeness

---

## Phase 3: Shopping Agent Overhaul

**File:** `supabase/functions/chat/index.ts` — `handleToolCalls` section

Changes to `SHOPPING_SEARCH` handler:
1. Search with Serper Shopping API (existing)
2. **NEW:** Validate every product with `validateProduct()` — drop broken entries
3. **NEW:** Convert all prices to user's preferred currency using `convertCurrency()`
4. **NEW:** Add `confidence` score per product (0-1)
5. **NEW:** If Serper fails, retry with `retryWithFallback()`, then fallback to `BROWSE_WEBSITE` for live store scraping
6. **NEW:** Send products progressively (incremental SSE updates as each batch is ready)
7. **NEW:** Structured JSON output format per product:
   ```json
   {"title":"...", "price_local":"...", "price_original":"...", "image":"...", "link":"...", "confidence":0.9}
   ```
8. Status messages: only generic ("Searching stores...", "Comparing prices...", "Converting currency...")
9. **NEW:** Log each step to console for debugging (never expose to user)

Changes to system prompt:
- Instruct model to NEVER mention tool names
- Instruct to present results naturally in user's language
- Use stored country/currency from `user_memory_entries`

---

## Phase 4: Deep Research Agent Overhaul

**File:** `supabase/functions/chat/index.ts`

Changes to `WEB_SEARCH` handler (when `isDeepResearch`):
1. **NEW:** Context awareness — track already-searched queries in `allSearchResults` to avoid duplicate searches
2. **NEW:** Text extraction — when browser results return HTML, run `extractText()` to clean
3. **NEW:** Summarization — if extracted text > 2000 chars, auto-summarize before adding to context
4. **NEW:** Retry mechanism — if a search fails, try alternative query phrasing
5. **NEW:** Image collection — always `include_images=true`, validate image URLs
6. **NEW:** Confidence scoring per source
7. **NEW:** Fallback sources — if Serper fails, use BROWSE_WEBSITE to scrape Google directly

Synthesis prompt improvements:
- Strictly forbid showing raw data, tool names, search queries
- Force language matching (Arabic query → Arabic report)
- Require inline images with `![](url)` format
- Structured report format with proper sections

---

## Phase 5: Normal Chat Agent — Decision Layer

**File:** `supabase/functions/chat/index.ts`

The normal chat agent gets a **Decision Layer**:
1. **Before any tool call**, the model analyzes the request intent:
   - Needs live web data? → Use `WEB_SEARCH` or `BROWSE_WEBSITE`
   - Mentions prices/products? → Reuse `searchProducts()` from Shopping module
   - Needs currency info? → Use `convertCurrency()`
   - Simple question? → Answer directly, no tools
2. **Agent Collaboration:** When normal chat detects shopping or research intent, it calls the same modular functions as those agents (not duplicating logic)
3. `tool_choice: "auto"` stays — let the model decide
4. System prompt enhanced to explain the decision framework
5. Context tracking — log which tools were used per conversation for future optimization

---

## Phase 6: Cross-Agent Collaboration Layer

**File:** `supabase/functions/chat/index.ts`

Architecture:
```text
User Request
    │
    ▼
┌──────────────┐
│ Decision      │  Analyzes intent, picks mode
│ Layer         │
└──────┬───────┘
       │
   ┌───┼───────────────┐
   ▼   ▼               ▼
Shopping  Research    Direct
Agent     Agent      Response
   │       │
   └───┬───┘
       ▼
  Shared Functions
  (search, browse, convert, validate)
```

- All three agents share the same modular functions
- If normal chat needs product data → calls `searchProducts()` directly
- If shopping needs reviews → calls `searchWeb()` directly
- No duplicate API calls — results cached within request lifecycle
- Each agent logs its steps internally (never exposed to user)

---

## Phase 7: Status Messages Cleanup

**Files:** `ChatPage.tsx`, `supabase/functions/chat/index.ts`

Backend changes:
- Replace ALL `pushStatus()` calls with generic English labels only:
  - "Searching..." / "Comparing options..." / "Writing response..." / "Almost done..."
- Remove ALL `pushBrowser()` calls — no browser state sent to frontend
- Never send tool names, URLs, or raw queries in status

Frontend changes:
- `onStatus` handler: simple setter, no filtering needed (backend sends clean data)
- `onBrowser` handler: removed entirely
- Status shown as: animated star + text, nothing else

---

## Implementation Order
1. Phase 1 — Remove Megsy Computer UI (fast, visible improvement)
2. Phase 2 — Build modular functions
3. Phase 3 — Shopping agent with currency + validation
4. Phase 4 — Deep Research with summarization + dedup
5. Phase 5 — Normal chat decision layer
6. Phase 6 — Cross-agent collaboration
7. Phase 7 — Status cleanup

---

## Technical Notes

**Currency API:** Free tier of exchangerate-api.com or open.er-api.com (no key needed for basic rates). Cache exchange rates for 1 hour in memory.

**Confidence scoring formula:**
- Has title: +0.2
- Has valid price: +0.3
- Has image URL that responds: +0.2
- Has valid purchase link: +0.2
- Has seller name: +0.1

**Retry strategy:**
- Network timeout → retry after 1s, 2s, 4s (exponential)
- HTTP 429 → wait 5s then retry once
- HTTP 4xx → skip to fallback source
- HTTP 5xx → retry after 2s, then fallback

**Files modified:**
- `supabase/functions/chat/index.ts` — major refactor (~60% of changes)
- `src/pages/ChatPage.tsx` — remove browser state, simplify status
- `src/components/ChatMessage.tsx` — remove ThinkingLoader complexity
- `src/components/ThinkingLoader.tsx` — simplify to one-line status




# Plan: Chat Agent Overhaul + Privacy Fix

## Priority 1 -- CRITICAL: Fix Conversation Privacy Leak

**Root cause**: The `AppSidebar.loadConversations()` query (line 70-76) does NOT filter by `user_id`. Combined with the RLS policy "Public can view shared conversations" (`is_shared = true AND share_id IS NOT NULL`), any authenticated user sees shared conversations from ALL users in the sidebar.

Additionally, `ProfilePage` counts conversations without user_id filter (lines 48-50), inflating stats with other users' data.

**Fix**:
1. Add `.eq("user_id", user.id)` to `AppSidebar.loadConversations()` query
2. Add `.eq("user_id", user.id)` to `ProfilePage.loadProfile()` conversation count queries
3. Add `.eq("user_id", user.id)` to `ProfilePage.loadMedia()` query
4. Run a database migration to set `user_id` on the 69 orphaned conversations (or delete them)
5. Add a NOT NULL constraint on `conversations.user_id` via migration to prevent future orphans

## Priority 2 -- Single Agent Experience ("Megsy" Only)

**Remove all model selection UI from chat**:
- `ChatPage.tsx`: Remove `ModelSelector` import/usage, remove model picker from plus menu (both mobile and desktop), remove `modelsExpanded` state
- `AnimatedInput.tsx`: Remove `selectedModel`/`onModelChange` props, remove the desktop model selector dropdown entirely
- Hardcode `model: "google/gemini-3-flash-preview"` in `handleSend()` -- the user always talks to "Megsy"
- Keep model selection only in Images/Videos/Code pages (those are separate tools)
- Header shows "Megsy" only, no model name badge

## Priority 3 -- Smart Questions System (Buttons + Text)

**Backend** (`supabase/functions/chat/index.ts`):
- Add to system prompt: instructions for Megsy to output a JSON block `{"type":"questions","questions":[...]}` when the request is ambiguous
- Each question has `title`, `options[]`, and optional `allowText: true`
- Include "Skip and assume the best" as a final option

**Frontend** (`ChatMessage.tsx`):
- Parse assistant messages for `{"type":"questions",...}` JSON blocks
- Render a `SmartQuestionCard` component: title, option buttons, optional text input, "Skip" button
- On button click, send the selected answer as the next user message automatically
- Completed questions collapse into a summary line

**New component**: `src/components/SmartQuestionCard.tsx`

## Priority 4 -- Flow Cards & Visual Intelligence

**Backend**: Add to system prompt instructions for outputting `{"type":"flow","steps":[...]}` when presenting plans

**Frontend** (`ChatMessage.tsx`):
- Parse `{"type":"flow",...}` JSON blocks
- Render `FlowCard` component: vertical connected cards with connector lines between them
- Each card: title, description, action buttons ("Execute", "Details")
- Action buttons send a message to the chat like "Execute step: [title]"

**New component**: `src/components/FlowCard.tsx`

## Priority 5 -- Smart Output Routing

**Backend**: Add to system prompt the output type instructions:
- Plans/workflows -> `{"type":"flow",...}`
- Comparisons -> markdown table (already rendered by ReactMarkdown)
- Code -> markdown code blocks (already rendered)
- Ideas -> `{"type":"cards","items":[...]}`
- Simple answers -> plain text
- Questions -> `{"type":"questions",...}`

**Frontend**: Add parsers in `ChatMessage.tsx` to detect and render each type. Cards use a simple grid layout component.

**New component**: `src/components/InfoCards.tsx` (for idea cards)

## Priority 6 -- Context Compression & User Data Access

**Backend** (`supabase/functions/chat/index.ts`):
- When conversation exceeds 20 messages, summarize older messages into a compact context block before sending to the AI
- Add user profile data (name, plan, credits) to system prompt context (fetched via service role from profiles table using the auth token)

## Priority 7 -- User Personality Adaptation

**Backend**: Enhance system prompt to explicitly instruct Megsy to:
- Detect language from first message and maintain it
- Detect complexity level and adapt (brief vs detailed)
- Never use emoji (already in place)

## Priority 8 -- Interactive UI Enhancements

- All Flow/Question/Card outputs have clickable actions
- Action buttons auto-send messages to the chat engine
- Collapsible sections for long outputs
- Operations log: store action history in component state, show as a collapsible timeline

## Technical Details

**Files modified**:
- `src/components/AppSidebar.tsx` -- add user_id filter
- `src/pages/ProfilePage.tsx` -- add user_id filter
- `src/pages/ChatPage.tsx` -- remove model selector, simplify to single agent
- `src/components/AnimatedInput.tsx` -- remove model picker props/UI
- `src/components/ChatMessage.tsx` -- add JSON block detection and structured rendering
- `supabase/functions/chat/index.ts` -- enhanced system prompt with output routing instructions, context compression, user data injection

**Files created**:
- `src/components/SmartQuestionCard.tsx` -- interactive question buttons
- `src/components/FlowCard.tsx` -- connected vertical flow cards with actions
- `src/components/InfoCards.tsx` -- grid cards for ideas/suggestions

**Database migration**:
- Delete or assign orphaned conversations (user_id IS NULL)
- Add NOT NULL constraint to conversations.user_id

**No emoji anywhere** in any new or modified component.


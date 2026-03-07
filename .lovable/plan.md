

# Comprehensive Chat Page Fixes + Composio Integration

## Issues Identified

1. **ModelSelector button doesn't open**: The `fancy-btn` CSS has `overflow: hidden` which clips the portal content, but the real issue is likely z-index conflicts or the click being swallowed by inner elements (`.fold`, `.points_wrapper`). The button inside the plus menu works differently than standalone. Need to verify the click handler fires.

2. **Images sent incorrectly to AI**: The multimodal content array construction looks correct structurally, but video content is sent as `image_url` type instead of proper handling. Also, large base64 images may exceed API limits.

3. **Arabic BiDi text issues**: Mixed Arabic/English text breaks layout. Need to add `dir="auto"` to message containers and prose-chat.

4. **Mode badge positioning**: Currently in header, user wants it above the input box.

5. **System prompt needs follow-up question**: Update to ask engaging follow-up at end of responses.

6. **Composio integrations**: Need a real edge function that calls Composio's REST API to initiate connections and execute tools for 17 services.

---

## Plan

### 1. Fix ModelSelector Button (ModelSelector.tsx + ChatPage.tsx)

The `fancy-btn` with `overflow: hidden` clips internal content. But since we use `createPortal`, the dropdown renders outside. The real problem may be that inside the plus menu, the ModelSelector's button click is being intercepted by the plus menu's backdrop overlay (the `fixed inset-0 z-30` div). The ModelSelector button is at z-index lower than the backdrop.

**Fix**: Change the ModelSelector in the plus menu to use a simple styled button instead of `fancy-btn`. Or ensure the ModelSelector's button has `z-index` above the backdrop. Actually, the plus menu itself is z-40, so the button inside should work. Let me check - the backdrop is `z-30`, the menu is `z-40`, the ModelSelector portal overlay is `z-[9998]`. This should work. The issue might be that the `fancy-btn` inner elements (`.inner` with `z-index: 2`, `.fold` with `z-index: 1`) intercept clicks. Add `pointer-events: none` to `.fold`.

**Simpler approach**: Replace `fancy-btn` in ModelSelector with a regular styled button to eliminate all CSS complexity issues.

### 2. Fix Image Sending to AI (ChatPage.tsx)

- Images are already sent as base64 `image_url` parts - this should work with OpenRouter/Gemini
- Ensure `attachedImages` from previous messages in history are also sent as multimodal content (currently only current message gets multimodal treatment)
- Fix: when reconstructing `allMessages`, check if any message has `attachedImages` and build multimodal content for those too

### 3. Add BiDi Support (ChatMessage.tsx, index.css)

- Add `dir="auto"` to the prose-chat div and user message div
- Add CSS `unicode-bidi: plaintext` to prose-chat paragraphs

### 4. Move Mode Badge Above Input (ChatPage.tsx)

- Move the mode badge from the header to just above the input area
- Show it as a small pill with blur effect

### 5. Update System Prompt (chat/index.ts)

- Add instruction: "At the end of each response, ask the user a brief, relevant follow-up question to keep the conversation going"
- Redeploy edge function

### 6. Composio Integration (New Edge Function + IntegrationsPage.tsx)

**Architecture**: Create `supabase/functions/composio/index.ts` that:
- `POST /composio` with `{ action: "connect", app: "github", userId: "..." }` - initiates OAuth connection via Composio API
- `POST /composio` with `{ action: "execute", tool: "GMAIL_SEND_EMAIL", args: {...}, connectedAccountId: "..." }` - executes a tool
- `POST /composio` with `{ action: "list-connections", userId: "..." }` - lists user's connected accounts

**Composio REST API endpoints used**:
- `POST https://backend.composio.dev/api/v3/connectedAccounts` - initiate connection
- `GET https://backend.composio.dev/api/v3/connectedAccounts?user_id=...` - list connections
- `POST https://backend.composio.dev/api/v3/tools/execute/:tool_slug` - execute tool

**IntegrationsPage.tsx updates**:
- Add all 17 services (GitHub, Google Drive, Google Calendar, Notion, Gmail, Slack, Supabase, HubSpot, YouTube, Outlook, Figma, Microsoft Teams, Zoom, Instagram, Facebook, LinkedIn, Discord)
- Connect button calls the composio edge function to initiate OAuth
- Show connection status (connected/disconnected) per service
- Store connected account IDs in user's profile or a new table

**Chat integration**: When the AI determines it needs to use a tool (e.g., send email), the system prompt will include available integrations. The edge function will handle tool execution.

### 7. Chat Edge Function - Tool Calling Support (chat/index.ts)

- Add Composio tools as OpenRouter/Gemini function calling tools
- When model returns a tool call, execute via Composio API and return result
- This enables "send email via Gmail", "create GitHub issue", etc. from chat

---

## Files to Change

| File | Changes |
|------|---------|
| `src/components/ModelSelector.tsx` | Replace `fancy-btn` with simple button styling |
| `src/pages/ChatPage.tsx` | Move mode badge above input, fix multimodal message history, improve file handling |
| `src/components/ChatMessage.tsx` | Add `dir="auto"` for BiDi support |
| `src/index.css` | Add BiDi CSS rules to prose-chat |
| `supabase/functions/chat/index.ts` | Update system prompt with follow-up question instruction, add tool calling for Composio |
| `supabase/functions/composio/index.ts` | **New** - Composio proxy for connections + tool execution |
| `src/pages/IntegrationsPage.tsx` | Add all 17 services, real connect/disconnect with status |
| `supabase/config.toml` | Add composio function config |

## Implementation Order

1. Fix ModelSelector button (quick CSS fix)
2. Fix BiDi + mode badge positioning
3. Fix image sending in chat history
4. Update system prompt + redeploy chat function
5. Create Composio edge function
6. Update IntegrationsPage with real connections
7. Wire Composio tools into chat for tool calling


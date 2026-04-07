

# Plan: Chat UI Cleanup + Unified Tool Orchestration via @mentions

## Summary
Three main areas: (1) Clean up Megsy Computer and mode UI, (2) Fix ThinkingLoader display, (3) Build a unified @mention tool-chaining system that lets users invoke Images, Videos, Voice, Files, and more directly from Chat.

---

## Part 1: UI Cleanup (ThinkingLoader + ChatPage)

### ThinkingLoader.tsx
- Remove `Monitor` icon import and usage next to "Megsy Computer"
- Replace animated star next to "Megsy Computer" with a **static** violet-colored star (no `animate` prop)
- Remove the `ChevronDown` toggle button that expands/collapses the step log
- Always show steps inline (no collapsible) -- each step appears as a new line below the previous one, no toggle needed
- When `isComputerUse` is false, don't show "Megsy Computer" header at all
- Steps just flow naturally: star + latest status text, with history lines below

### ChatPage.tsx
- Set `searchEnabled: true` and `computerUseEnabled: true` as **defaults** (useState defaults)
- Keep toggles in the `+` menu so users can disable them
- Remove `Monitor` icon from the Megsy Computer toggle in the `+` menu (keep just text "Megsy Computer")
- Remove the mode badge section above the input bar (lines 836-849 with `@{chatMode}` text)
- The `isComputerUse` prop passed to ThinkingLoader should be based on whether the backend **actually triggered** computer use (detected from status events containing browser keywords like "Navigating", "Opening", "Scrolling"), NOT from the toggle state

---

## Part 2: Unified @Mention Tool Orchestration

### Concept
Users can chain multiple tools in a single message using `@` mentions. After selecting a tool, pressing `#` shows relevant models/parameters with credit costs.

**Flow example:**
```
@images #nano-banana Generate a sunset photo
@videos #veo3 Create a video of ocean waves  
@voice #tts Read this text aloud
@slides Create a presentation about Egypt
```

### agentRegistry.ts Changes
- Add new agents for direct tool invocation:
  - `@email` (category: "integration") -- send email
  - Keep existing: `@images`, `@videos`, `@voice`, `@slides`, `@code`
- Add a `models` array to each agent definition listing available models with credit costs:
  ```ts
  models?: { id: string; label: string; cost: number }[]
  ```
  - `@images` models: nano-banana (2 MC), nano-banana-pro (4 MC), nano-banana-2 (3 MC)
  - `@videos` models: veo3, wan-x, etc.
  - `@voice` models: tts, voice-clone, etc.

### MentionDropdown.tsx Changes
- After selecting an agent, if user types `#`, show a **ModelPickerDropdown** with that agent's available models
- Each model option shows: model name + credit cost badge
- Selected model gets injected as `#model-name` in the input text

### AnimatedInput.tsx Changes  
- Detect `#` after an `@agent` selection to trigger model picker
- Parse input to extract: agent mentions, model selections, and the prompt text
- Display selected tools as minimal inline tags: `@images #nano-banana`

### ChatPage.tsx -- Tool Execution
- Instead of navigating away when selecting `@images`, `@videos`, etc., **stay in chat**
- Parse the message to detect tool invocations
- Send tool instructions to the backend via the existing chat function
- Backend orchestrates: calls the appropriate edge functions (generate-image, generate-video, generate-voice, etc.)
- Results stream back and display inline in the chat

### Backend: chat/index.ts Changes
- Add tool definitions for each workspace tool:
  ```ts
  GENERATE_IMAGE: { goal, model, count }
  GENERATE_VIDEO: { prompt, model }
  GENERATE_VOICE: { text, voice }
  SEND_EMAIL: { to, subject, body }
  CREATE_SLIDES: { topic, style }
  ```
- When AI calls these tools, the backend invokes the corresponding edge functions
- Stream status updates back: "Generating image with Nano Banana...", "Image ready", etc.
- Deduct credits based on model + quantity

---

## Part 3: Credit Integration
- Each tool call deducts the appropriate MC cost
- Before execution, validate user has sufficient credits
- Show cost preview in the `#model` picker dropdown

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/ThinkingLoader.tsx` | Remove Monitor icon, static violet star for computer use header, remove collapsible toggle |
| `src/pages/ChatPage.tsx` | Default search+computer ON, remove mode badge above input, detect computer use from status events, handle in-chat tool execution |
| `src/lib/agentRegistry.ts` | Add `models` array to agents, add `@email` agent |
| `src/components/MentionDropdown.tsx` | Show model picker on `#` after agent selection |
| `src/components/AnimatedInput.tsx` | Detect `#` trigger, parse multi-tool input |
| `supabase/functions/chat/index.ts` | Add tool definitions for image/video/voice/slides/email, orchestrate execution, stream status |

---

## Implementation Order
1. UI cleanup (ThinkingLoader + ChatPage badges/defaults) -- quick wins
2. Agent registry + model data
3. MentionDropdown + AnimatedInput `#` model picker
4. Backend tool orchestration in chat function
5. In-chat result rendering (images, videos inline)
6. Credit validation and deduction


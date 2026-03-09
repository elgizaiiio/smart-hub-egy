

## Plan: Studio Pages + Agent Chat for Images & Videos

### Overview
Create dedicated Studio pages for images and videos with a generation workflow, history gallery, preview modal, and an AI Agent chat page for model/prompt assistance with social media integration buttons.

### New Pages & Routes

1. **`/images/studio`** - Image Studio (generation view with progress bar + history grid)
2. **`/videos/studio`** - Video Studio (same pattern for videos)
3. **`/images/agent`** - Image Agent Chat (AI assistant for image prompts/models)
4. **`/videos/agent`** - Video Agent Chat (AI assistant for video prompts/models)

### Architecture

```text
┌─────────────────────────────────────────────────┐
│  ImagesPage / VideosPage                        │
│  ┌───────────────────────────────────────────┐   │
│  │ Showcase + Input Bar                      │   │
│  │ [Generate] → navigate to /images/studio   │   │
│  └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  ImageStudioPage / VideoStudioPage              │
│  ┌──────────┐  ┌────────────────────────────┐   │
│  │ Progress │  │ History Grid               │   │
│  │ Bar      │  │ (click → preview modal)    │   │
│  └──────────┘  └────────────────────────────┘   │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  ImageAgentPage / VideoAgentPage                │
│  ┌───────────────────────────────────────────┐   │
│  │ Chat interface (like ChatPage)            │   │
│  │ System prompt: help with models/prompts   │   │
│  │ Social buttons: Instagram, FB, LinkedIn   │   │
│  └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### Changes by File

**New files:**
- `src/pages/ImageStudioPage.tsx` - Studio with progress bar during generation, masonry grid of past images, click-to-preview with download
- `src/pages/VideoStudioPage.tsx` - Same pattern for videos
- `src/pages/ImageAgentPage.tsx` - Chat UI (reusing ChatMessage, AnimatedInput, streamChat) with image-focused system prompt + social integration buttons
- `src/pages/VideoAgentPage.tsx` - Same for video-focused agent

**Modified files:**

1. **`src/App.tsx`** - Add 4 new protected routes
2. **`src/pages/ImagesPage.tsx`** - On generate, navigate to `/images/studio` passing prompt/model/settings via state instead of showing inline results
3. **`src/pages/VideosPage.tsx`** - Same, navigate to `/videos/studio`
4. **`src/components/DesktopSidebar.tsx`** - Dynamically show "Studio" and "Agent" sub-items under Images/Videos when user is on those pages

### Studio Page Behavior
- Receives generation params via `useLocation().state` or stores in sessionStorage
- Shows animated progress bar while generating
- On completion, adds result to top of grid
- Loads previous generations from `conversations` + `messages` (mode=images/videos)
- Click any item opens `ShowcaseDetailModal` with download button
- Input bar at bottom for re-generation

### Agent Page Behavior
- Full chat interface using `streamChat` with a system prompt like: "You are an AI assistant specialized in helping users create the best images/videos. Help them choose models, write prompts, and optimize settings."
- Social media buttons (Instagram, Facebook, LinkedIn) at top that trigger Composio integration actions
- Uses the existing `ConnectorsDialog` for social media connections

### Sidebar Changes
- When on `/images`, `/images/studio`, or `/images/agent`, show sub-navigation: Images, Studio, Agent
- Same for `/videos` paths
- In collapsed mode, show icons with tooltips

### Technical Notes
- Credit cost multiplication logic (numImages * modelCost) already exists in ImagesPage
- Agent chat uses the existing `chat` edge function with a specialized system prompt
- Social integrations reuse existing Composio infrastructure


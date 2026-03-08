

# Implementation Plan

## Overview
5 major changes: (1) Delete Studio & Projects pages, (2) Fix ProfilePage with real data, (3) Conversation sharing via public links, (4) Error Boundaries, (5) Offline Support, (6) PWA setup.

---

## 1. Delete StudioPage & ProjectsPage

- Delete `src/pages/StudioPage.tsx` and `src/pages/ProjectsPage.tsx`
- Remove their imports and routes from `App.tsx` (lines 16-17, 89-90)
- Remove any sidebar references to `/studio` or `/projects`

## 2. Fix ProfilePage with Real Supabase Data

- Fetch user profile from `profiles` table (display_name, avatar_url, credits, plan)
- Fetch user email from `supabase.auth.getUser()`
- Count stats from DB:
  - Images: count conversations where `mode = 'images'`
  - Videos: count conversations where `mode = 'videos'`
  - Chats: count conversations where `mode = 'chat'`
- Tab content: query `messages` table for messages with `images` array (filter by conversation mode) to show generated images/videos in the grid
- Avatar upload: use existing `avatars` storage bucket
- Credits bar: show real credits from profile

## 3. Conversation Sharing (Public Links)

### Database Migration
- Add columns to `conversations` table:
  - `is_shared boolean default false`
  - `share_id text unique` (short random ID for URL)
- Add RLS policy: public SELECT on conversations where `is_shared = true` (matched by `share_id`)
- Add RLS policy: public SELECT on messages where conversation is shared

### Frontend
- New page `src/pages/SharedChatPage.tsx` at route `/share/:shareId` (public, no auth)
  - Fetches conversation + messages by `share_id`
  - Read-only view of the conversation with same ChatMessage component
  - Minimal header with "Megsy" branding and "Try Megsy" CTA
- Add share button in ChatPage (in message header or conversation options)
  - Generates a `share_id` if not exists, sets `is_shared = true`
  - Copies link to clipboard: `https://smart-hub-egy.lovable.app/share/{shareId}`

## 4. Error Boundary Component

- Create `src/components/ErrorBoundary.tsx` (React class component with `componentDidCatch`)
  - Shows a clean error UI: "Something went wrong" with a retry button
- Wrap main routes in `App.tsx` with ErrorBoundary
- Optionally wrap individual page components

## 5. Offline Support

- Create `src/hooks/useOnlineStatus.ts` hook using `navigator.onLine` + event listeners
- Create `src/components/OfflineBanner.tsx` - a fixed banner at top showing "You're offline" when connection drops
- Add OfflineBanner to `App.tsx` (inside BrowserRouter, before Routes)

## 6. PWA Setup

- Install `vite-plugin-pwa`
- Configure in `vite.config.ts` with manifest (name: "Megsy", icons, theme_color, etc.)
- Add `navigateFallbackDenylist: [/^\/~oauth/]` to workbox config
- Add PWA meta tags to `index.html` (apple-mobile-web-app-capable, theme-color, etc.)
- Create PWA icons in `/public` (192x192, 512x512)

---

## Technical: Database Migration SQL

```sql
-- Add sharing columns to conversations
ALTER TABLE conversations ADD COLUMN is_shared boolean DEFAULT false;
ALTER TABLE conversations ADD COLUMN share_id text UNIQUE;

-- Public read policy for shared conversations
CREATE POLICY "Public can view shared conversations"
ON conversations FOR SELECT
TO anon, authenticated
USING (is_shared = true AND share_id IS NOT NULL);

-- Public read policy for messages of shared conversations
CREATE POLICY "Public can view messages of shared conversations"
ON messages FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND conversations.is_shared = true
  )
);
```

## Files Changed
- **Delete**: `StudioPage.tsx`, `ProjectsPage.tsx`
- **Modify**: `App.tsx`, `ProfilePage.tsx`, `ChatPage.tsx`, `vite.config.ts`, `index.html`
- **Create**: `ErrorBoundary.tsx`, `OfflineBanner.tsx`, `useOnlineStatus.ts`, `SharedChatPage.tsx`
- **Install**: `vite-plugin-pwa`


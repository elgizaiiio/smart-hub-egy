

# Fix Plan: Model Selector, Image Generation, Video Endpoints, BiDi

## Issues

1. **Image generation infinite loading** - The `generate-image` edge function uses wrong fal.ai endpoints AND a broken upload URL (`fal-ai/workflows/upload` returns 404). Status polling returns 405 because the endpoint paths are incorrect.
2. **Video generation wrong endpoints** - Same issue with `generate-video`.
3. **ModelSelector not opening** - The dropdown uses `createPortal` but likely has z-index conflicts with the plus menu backdrop (`fixed inset-0 z-30`). When ModelSelector is inside the plus menu, clicking the button hits the backdrop first.
4. **Images not sent to AI model in chat** - `handleSend` in ChatPage ignores `attachedFiles` entirely - it only sends `{ role, content }` text, never includes image data in the API call.
5. **BiDi on Index page** - User wants it removed (Index page is just a placeholder, likely referring to ChatPage main page).
6. **Plus menu doesn't close on outside click (Images/Videos pages)** - Already has backdrop handler but may need verification.

## Plan

### 1. Fix `generate-image` Edge Function
Update `MODEL_MAP` with correct fal.ai endpoints from user's table:
- `megsy-v1-img` → `fal-ai/nano-banana-pro`
- `gpt-image` → `fal-ai/gpt-image-1.5`
- `flux-kontext` → `fal-ai/flux-pro/kontext/max/text-to-image`
- `ideogram-3` → `fal-ai/ideogram/v3`
- `recraft-v4` → `fal-ai/recraft/v4/pro/text-to-image`
- `flux-2-pro` → `fal-ai/flux-2-pro`
- `nano-banana-2` → `fal-ai/nano-banana-pro`
- (all others per user's table)

Fix upload: Replace broken `fal-ai/workflows/upload` with `https://fal.upload.fal.ai/files/upload/` (correct fal storage endpoint), or better yet, pass base64 data URIs directly since fal.ai supports them natively.

Use **synchronous API** (`https://fal.run/${endpoint}`) instead of queue+poll pattern to avoid the 405 status polling issue. This simplifies the code significantly.

### 2. Fix `generate-video` Edge Function
Update `VIDEO_MODEL_MAP` with correct endpoints:
- `megsy-video` → `fal-ai/minimax/hailuo-2.3/pro/text-to-video`
- `kling-3-pro` → `fal-ai/kling-video/v3/pro/text-to-video`
- `openai-sora` → `fal-ai/sora-2/text-to-video`
- `pika-2.2` → `fal-ai/pika/v2.2/text-to-video`
- `luma-dream` → `fal-ai/luma-dream-machine/ray-2`
- (all others per user's table)

Also add missing models: `veo-3.1`, `kling-o1`, new I2V models.

Keep queue+poll for videos (they take longer), but fix the endpoint paths.

### 3. Update `ModelSelector.tsx` Model Lists
Update `IMAGE_MODELS` and `VIDEO_MODELS` arrays to match the correct model IDs and add missing models (Veo 3.1, Kling O1, etc.) with correct credit costs.

### 4. Fix ModelSelector Inside Plus Menu
The issue: when ModelSelector is inside the plus menu, the `fixed inset-0 z-30` backdrop intercepts clicks. The ModelSelector button is at z-40 (inside the menu), but when clicked, the ModelSelector's own portal backdrop is z-[9998]. The problem is the button's `onClick` fires, but the dropdown appears behind the plus menu's backdrop.

**Fix**: Give the ModelSelector button `position: relative; z-index: 50` to ensure it's above the plus menu backdrop. Also ensure the ModelSelector portal renders above everything.

### 5. Fix Images Not Sent to Chat AI
In `ChatPage.tsx` `handleSend`, build multimodal content when `attachedFiles` contains images:
```typescript
const allMessages = [...messages, userMsg].map(m => {
  // For the current user message, include attached images
  if (m === userMsg && imageAttachments.length > 0) {
    return {
      role: m.role,
      content: [
        ...imageAttachments.map(f => ({ type: "image_url", image_url: { url: f.data } })),
        { type: "text", text: m.content }
      ]
    };
  }
  return { role: m.role, content: m.content };
});
```

### 6. Remove BiDi from Chat Main Page
Check `index.css` for any global BiDi styles applied broadly and scope them to only chat message content.

## Files to Change

| File | Change |
|------|--------|
| `supabase/functions/generate-image/index.ts` | Fix MODEL_MAP endpoints, use sync API, fix upload |
| `supabase/functions/generate-video/index.ts` | Fix VIDEO_MODEL_MAP endpoints |
| `src/components/ModelSelector.tsx` | Update IMAGE_MODELS/VIDEO_MODELS lists, fix z-index |
| `src/pages/ChatPage.tsx` | Send images as multimodal content to AI |
| `src/index.css` | Scope BiDi styles to `.prose-chat` only |


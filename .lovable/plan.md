

# Plan: Chat UI Overhaul -- Visual Upgrade

## Changes Overview

### 1. Flow Cards with Colored Gradient + Fancy Animation
**File**: `src/components/FlowCard.tsx`
- Each card gets a unique gradient color (purple, blue, green, amber, teal -- cycling)
- Apply the `fancy-btn` shimmer/particle animation to each card
- Add typewriter effect: card content (title + description) appears character by character with a slight delay per card
- Remove all action buttons from cards -- interaction is tap-only (tap card to expand details inline)
- Add CSS classes for each color variant in `src/index.css`

### 2. InfoCards with Colored Gradients + Fancy Animation
**File**: `src/components/InfoCards.tsx`
- Same treatment: each card gets a different gradient color
- Fancy-btn particle animation on each card
- Typewriter text effect for title and description

### 3. Sources Display -- Inline with Search Context
**File**: `src/components/ChatMessage.tsx`
- Redesign sources section: show "Searching for X" with favicon bubbles inline (like the reference image)
- Sources appear as small circular favicon icons in a row with site name below
- Cleaner, more compact layout

### 4. ThinkingLoader -- Star with Dynamic Status Text
**File**: `src/components/ThinkingLoader.tsx`
- Use the existing animated star (PegtopIcon SVG)
- Star color changes based on state: Blue (searching), Green (writing), Amber (reading)
- Collapsible research steps shown as text lines with chevron toggle
- Status text cycles: "Searching...", "Reading...", "Writing..." with smooth transitions
- Add collapsible step list showing what the agent is doing (like images 3&4)

### 5. Smart Questions -- Embedded in Input Bar
**Files**: `src/pages/ChatPage.tsx`, `src/components/AnimatedInput.tsx`
- When questions arrive, they appear as a bottom sheet/panel INSIDE the input area (not as a chat message)
- Show question counter "X of Y" at top right
- Options as numbered list items (tap to select)
- Text input at bottom with send arrow
- X button to dismiss/skip
- Remove SmartQuestionCard rendering from ChatMessage -- move it to ChatPage input area

### 6. Input Bar -- Borderless, No Background
**File**: `src/components/AnimatedInput.tsx`
- Remove border, background, and rounded container styles
- Make it fully transparent -- content scrolls UNDERNEATH (not through) the input
- Plus button: circular outlined style matching the reference image
- Keep the gradient fade on the container div in ChatPage

### 7. Remove Long-Press Copy Popup
**File**: `src/components/ChatMessage.tsx`
- Delete all `showCopyPopup` state, `longPressTimer`, `handleLongPressStart`, `handleLongPressEnd`
- Remove the `AnimatePresence` copy popup block entirely
- Remove `onTouchStart`/`onTouchEnd` handlers from message divs

### 8. Remove Action Buttons from Flow Cards
**File**: `src/components/FlowCard.tsx`
- No "Execute" or "Details" buttons
- Tap on card sends the step title as a message (gesture-based)

## Technical Notes
- New CSS classes `flow-card-purple`, `flow-card-blue`, `flow-card-green`, `flow-card-amber`, `flow-card-teal` in index.css with gradient backgrounds and particle animations
- Typewriter effect via a small React hook that reveals text progressively using `useState` + `setInterval`
- Questions state lifted from ChatMessage to ChatPage for input-bar integration
- No emojis anywhere in new/modified code


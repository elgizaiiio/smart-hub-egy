
# Megsy Platform - Credits + Real Programming + Integrations

## ✅ Completed

### 1. Credit System
- Created `credit_transactions` table in Supabase
- Created `deduct_credits` database function (SECURITY DEFINER)
- Created `deduct-credits` edge function
- Created `useCredits` hook for frontend credit checking
- Updated `generate-image` edge function to deduct credits
- Updated `generate-video` edge function to deduct credits
- Updated ImagesPage and VideosPage to check credits before generation
- Chat remains free

### 2. Real Programming System (Sprites.dev)
- Created `sprites-sandbox` edge function for Sprites.dev API management
- Actions: create, exec, write-file, write-files, status, destroy
- Each sprite gets a public URL: `https://{name}-{hash}.sprites.app/`
- Rebuilt `CodeWorkspace.tsx` with:
  - Plan → Build workflow with credit deduction (5 credits per build)
  - Hidden file tree (internal state, not visible to user)
  - AI generates JSON file structure, parsed and deployed to Sprite
  - Real preview via iframe pointing to Sprite URL
  - Conversation persistence to Supabase
  - Project saving with files_snapshot

### 3. GitHub Integration
- Created `github-repo` edge function via Composio
- Actions: check-connection, create-repo, push-files
- Push to GitHub button in CodeWorkspace plus menu
- Creates new repo and pushes all project files

### 4. Database
- Created `projects` table (id, user_id, name, fly_machine_id, fly_app_name, preview_url, status, files_snapshot, conversation_id)
- Created `credit_transactions` table (id, user_id, amount, action_type, description, created_at)

### 5. OAuth2 "Login with Megsy"
- Created `oauth_clients`, `oauth_codes`, `oauth_tokens` tables with RLS
- Created 3 Edge Functions: `oauth-authorize`, `oauth-token`, `oauth-userinfo`
- Added OAuth Apps management to Telegram admin bot (create, list, edit, delete, regenerate secret)
- Built `/oauth/authorize` consent screen page
- Updated App.tsx routes and config.toml

### 6. Secrets Required
- `SPRITES_TOKEN` ✅ Added (replaced FLY_API_TOKEN)
- `COMPOSIO_API_KEY` ✅ Already exists
- `FAL_API_KEY` ✅ Already exists

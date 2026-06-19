# AI Site Guide - Quick Start (5 Minutes)

## One-Time Setup (First Time Only)

### 1. Install & Configure

```bash
# Clone and install
git clone <your-repo>
cd ai-site-guide
pnpm install

# Setup environment
cp .env.example .env.local

# Add your keys to .env.local:
# - OPENAI_API_KEY (from https://platform.openai.com/api-keys)
# - AWS_ACCESS_KEY_ID & AWS_SECRET_ACCESS_KEY (from AWS IAM)
# - AWS_REGION (e.g., us-east-1)
```

### 2. Create AWS DynamoDB Tables

**Easiest way - Use AWS Console:**
1. Go to https://console.aws.amazon.com/dynamodbv2
2. Click "Create table"
3. Create 3 tables with these settings:

| Table Name | Partition Key | Sort Key | Billing |
|------------|---------------|----------|---------|
| `ai-site-guide-sessions` | `sessionId` (String) | `createdAt` (Number) | On-demand |
| `ai-site-guide-messages` | `sessionId` (String) | `timestamp` (Number) | On-demand |
| `ai-site-guide-feedback` | `feedbackId` (String) | — | On-demand |

Then enable TTL on each table (Attribute Name: `expiresAt`)

**Or use CLI (FAST):**
```bash
# Run this (see EXTENSION_SETUP.md for full commands)
aws dynamodb create-table --table-name ai-site-guide-sessions ...
# (See DEPLOYMENT_CHECKLIST.md Phase 2 for all CLI commands)
```

## Daily Development

### Start Local Development

```bash
# Terminal 1: Start backend (port 3000)
pnpm dev

# Terminal 2: Start extension watch
pnpm watch:ext
```

### Load Extension in Chrome

1. Go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select `.output/chrome-mv3` folder
5. Visit any website, press `Ctrl+Shift+G` to open chat

### Test It

- Website: https://github.com (free, no login needed)
- Ask: "How do I find a repository?"
- Confirm chat bubble appears and responds

## Deploy to Production

```bash
# 1. Commit changes
git add .
git commit -m "Ready for deployment"
git push origin main

# 2. Deploy backend (one-time setup via GUI preferred)
# - Go to https://vercel.com/new
# - Connect GitHub repo
# - Add environment variables (same as .env.local)
# - Deploy button (automatic after that)

# 3. Update extension API URL
# Edit: src/lib/api-client.ts
const API_BASE = 'https://your-vercel-project.vercel.app';

# 4. Rebuild extension
pnpm run build:ext

# 5. Test in Chrome (reload extension)
# - chrome://extensions → Refresh button
```

## File Structure (What's What)

```
src/                          # Extension code (Chrome only)
├── entrypoints/content-script-setup.ts  # Main UI component
├── utils/
│   ├── page-context.ts       # Extract page info
│   ├── dom-highlighter.ts    # Highlight elements
│   └── animated-cursor.ts    # Show cursor animation
└── styles/extension.css      # Chat bubble styling

app/
├── api/chat/route.ts         # Main chat endpoint
├── api/sessions/route.ts     # Session management
├── lib/
│   ├── openai-client.ts      # OpenAI integration
│   ├── structured-output.ts  # Guidance schema
│   └── dynamodb.ts           # Database client
```

## Common Commands

```bash
pnpm dev              # Start backend
pnpm watch:ext        # Watch extension files
pnpm build:ext        # Build extension for release
pnpm dev:all          # Run both (requires concurrently)

# Clean rebuild
rm -rf .output
pnpm run build:ext
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Extension not showing | Reload in chrome://extensions |
| API connection error | Ensure `pnpm dev` is running |
| DynamoDB errors | Check AWS credentials in .env.local |
| OpenAI errors | Verify API key is valid (test at platform.openai.com) |
| Chat bubble not responding | Open DevTools (F12) → Check Console for errors |

## Next Steps

1. ✓ **Customize:** Edit `src/styles/extension.css` for branding
2. ✓ **Deploy:** Follow DEPLOYMENT_CHECKLIST.md for production
3. ✓ **Monitor:** Setup analytics in Vercel dashboard
4. ✓ **Publish:** Submit to Chrome Web Store (see DEPLOYMENT_CHECKLIST.md)

## Need Help?

- **Setup issues:** See EXTENSION_SETUP.md
- **Deployment issues:** See DEPLOYMENT_CHECKLIST.md
- **API docs:** See README_EXTENSION.md
- **Code structure:** See comments in source files

---

**Pro Tip:** Keep this file open while developing. Use keyboard shortcuts:
- `Ctrl+Shift+G` - Toggle chat bubble (when extension loaded)
- `F12` - Open DevTools to see console logs
- `chrome://extensions/` - Reload extension after code changes

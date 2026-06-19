# AI Site Guide - Extension Setup & Deployment Guide

This is a full-stack Chrome extension with a Vercel backend API and AWS DynamoDB integration for chat history, sessions, and feedback.

## Architecture Overview

- **Frontend:** WXT-based Chrome extension with Shadow DOM isolation for the chat bubble UI
- **Backend:** Next.js 16 API routes on Vercel for chat processing, structured guidance generation
- **Database:** AWS DynamoDB for session management, chat history, and user feedback
- **AI:** OpenAI API via Vercel AI SDK for intelligent site guidance

## Prerequisites

1. **Chrome Browser** - For loading and testing the extension
2. **Node.js & pnpm** - For development
3. **OpenAI API Key** - For chat and guidance generation
4. **AWS Account** - For DynamoDB setup with IAM authentication
5. **Vercel Account** - For deploying the backend

## Local Development Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the project root:

```env
# Backend API (for local development)
REACT_APP_API_URL=http://localhost:3000

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# AWS DynamoDB Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
```

### 3. Create DynamoDB Tables

Before running the backend, set up these AWS DynamoDB tables:

#### Table 1: ChatSessions
- **Table Name:** `ai-site-guide-sessions`
- **Partition Key:** `sessionId` (String)
- **Sort Key:** `createdAt` (Number)
- **TTL Attribute:** `expiresAt` (Number) - Set to 86400 (24 hours)
- **Billing Mode:** On-demand

#### Table 2: ChatHistory
- **Table Name:** `ai-site-guide-messages`
- **Partition Key:** `sessionId` (String)
- **Sort Key:** `timestamp` (Number)
- **Indexes:**
  - GSI: `userId` (String) as partition key, `timestamp` as sort key
- **TTL Attribute:** `expiresAt` (Number) - Set to 2592000 (30 days)
- **Billing Mode:** On-demand

#### Table 3: Feedback
- **Table Name:** `ai-site-guide-feedback`
- **Partition Key:** `feedbackId` (String)
- **Attributes:** `sessionId`, `messageId`, `feedback`, `timestamp`
- **TTL Attribute:** `expiresAt` (Number)
- **Billing Mode:** On-demand

**AWS CLI Commands (Optional):**

```bash
# Create ChatSessions table
aws dynamodb create-table \
  --table-name ai-site-guide-sessions \
  --attribute-definitions AttributeName=sessionId,AttributeType=S AttributeName=createdAt,AttributeType=N \
  --key-schema AttributeName=sessionId,KeyType=HASH AttributeName=createdAt,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1

# Add TTL to ChatSessions
aws dynamodb update-time-to-live \
  --table-name ai-site-guide-sessions \
  --time-to-live-specification AttributeName=expiresAt,Enabled=true \
  --region us-east-1

# Similar commands for other tables...
```

### 4. Run Local Development Server

```bash
# Start the Next.js backend
pnpm dev

# In another terminal, build the extension
pnpm run build:ext

# Or watch for changes during development
pnpm run watch:ext
```

### 5. Load Extension in Chrome

1. Open `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Navigate to `/vercel/share/v0-project/.output/chrome-mv3` (or `dist` directory)
5. The "AI Site Guide" extension should appear in your Chrome toolbar

### 6. Test the Extension

- Visit any website
- Press `Ctrl+Shift+G` to toggle the chat bubble
- Ask for guidance: "How do I sign up?" or "Guide me through checkout"
- The extension will extract page context and provide step-by-step visual guidance

## Deployment to Vercel

### 1. Connect GitHub Repository

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit: AI Site Guide extension"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ai-site-guide.git
git push -u origin main
```

### 2. Deploy to Vercel

```bash
# Install Vercel CLI
pnpm install -g vercel

# Deploy
vercel
```

Or connect via [https://vercel.com/new](https://vercel.com/new)

### 3. Set Environment Variables in Vercel

In your Vercel project settings, add these environment variables:

```
OPENAI_API_KEY=your_openai_api_key
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
```

### 4. Update Extension Configuration

After deployment, update the API URL in the extension:

1. Edit `src/lib/api-client.ts`
2. Change:
   ```typescript
   const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000';
   ```
   to:
   ```typescript
   const API_BASE = 'https://your-vercel-project.vercel.app';
   ```

3. Rebuild the extension:
   ```bash
   pnpm run build:ext
   ```

4. Reload the extension in Chrome (Chrome Extensions menu → Refresh)

## Publishing to Chrome Web Store

### Prerequisites

- Google Developer Account ($5 one-time fee)
- Extension must pass Chrome Web Store review

### Steps

1. **Create extension zip:**
   ```bash
   cd .output/chrome-mv3
   zip -r ../ai-site-guide.zip .
   ```

2. **Upload to Chrome Web Store:**
   - Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Click "New item"
   - Upload the zip file
   - Fill in extension details, screenshots, privacy policy
   - Submit for review (typically 1-2 business days)

3. **Privacy Compliance:**
   - The extension sends page context to OpenAI (see privacy policy template below)
   - No personal data is stored in the extension (uses extension storage only)
   - Chat history is stored server-side with TTL-based expiration

## API Endpoints Reference

### POST /api/chat
Send a user message and get AI guidance.

**Request:**
```json
{
  "sessionId": "session_xxx",
  "message": "How do I complete checkout?",
  "pageContext": {
    "title": "Checkout - Example Store",
    "url": "https://example.com/checkout",
    "buttons": ["Continue", "Pay Now"],
    "headings": ["Order Summary", "Payment Method"],
    "forms": ["email", "cardNumber"]
  }
}
```

**Response:**
```json
{
  "response": {
    "id": "msg_xxx",
    "role": "assistant",
    "content": "I'll guide you through checkout..."
  },
  "guidance": [
    {
      "step": 1,
      "action": "click",
      "selector": "button:contains('Continue')",
      "instruction": "Click the Continue button",
      "highlight": true
    }
  ]
}
```

### GET /api/sessions
Retrieve all chat sessions (for the current user).

### POST /api/feedback
Submit feedback on a message (helpful/not helpful).

## Troubleshooting

### Extension not showing on page
- Check manifest permissions in `src/manifest.json`
- Verify content script is loading: Open DevTools → Application → Service Workers
- Check for console errors in the page's DevTools

### API connection errors
- Ensure backend is running or Vercel deployment is active
- Check CORS settings in backend (configured in route handlers)
- Verify environment variables are set correctly

### DynamoDB connection errors
- Confirm AWS credentials have DynamoDB access permissions
- Check table names match in `app/lib/dynamodb.ts`
- Verify tables exist in the correct AWS region

### OpenAI API errors
- Verify API key is valid and has sufficient credits
- Check API rate limits
- Ensure model name is correct (`gpt-4-turbo-preview` or latest available)

## Privacy & Security

### Data Handling
- **Page context** is sent to OpenAI for generating guidance
- **Chat history** is stored in DynamoDB with user-controlled retention
- **No personally identifiable information** is collected without consent
- **Extension storage** uses Chrome's secure storage APIs

### Recommended Privacy Policy
```
This extension sends website content to our servers and to OpenAI for AI-powered guidance.
We store chat history for 30 days. You can clear history anytime from the extension popup.
We do not sell user data. See full privacy policy at [your-domain].
```

## Performance Optimization

### Extension Size
- Current bundle: ~500KB (minified)
- Lazy load guidance system only when needed

### API Response Time
- Guidance generation: 1-3 seconds average
- Use streaming for long responses

### DynamoDB
- On-demand billing scales automatically
- TTL removes old data automatically (saves costs)

## Next Steps & Features

- [ ] Voice input/output integration (Web Speech API)
- [ ] Multi-language support
- [ ] Browser history context integration
- [ ] A/B testing different guidance approaches
- [ ] Analytics dashboard for website owners
- [ ] B2B widget version for embedding in websites
- [ ] Mobile app version using React Native

## Support & Issues

For bugs or feature requests:
- Open an issue on GitHub
- Check existing troubleshooting guide
- Review console logs for error messages

---

**Built with:** WXT • Next.js 16 • AI SDK • AWS DynamoDB • OpenAI

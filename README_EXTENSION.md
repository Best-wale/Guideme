# AI Site Guide - Chrome Extension

An intelligent Chrome extension that provides AI-powered, visually-guided assistance for navigating any website. Users ask for help, and the extension delivers step-by-step guidance with animated highlights, cursor animations, and voice I/O capabilities.

## Quick Start

### Prerequisites
- Node.js 18+ and pnpm
- Chrome/Chromium browser
- OpenAI API key
- AWS account for DynamoDB

### Development

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your keys

# Run local dev environment (backend + extension)
pnpm dev:all

# Or run separately:
pnpm dev                 # Backend only (port 3000)
pnpm watch:ext          # Extension watch mode (in another terminal)
```

### Load Extension in Chrome

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `.output/chrome-mv3` directory

### Usage

- Press `Ctrl+Shift+G` to toggle the chat bubble on any website
- Ask for guidance: "How do I sign up?" or "Guide me through checkout"
- The extension will extract page context and provide step-by-step guidance

## Project Structure

```
├── src/
│   ├── entrypoints/
│   │   ├── content.tsx              # Content script - injected into pages
│   │   ├── content-script-setup.ts  # Chat bubble UI component
│   │   ├── background.ts            # Service worker for background tasks
│   │   ├── popup.html               # Extension popup
│   │   └── popup.ts                 # Popup script
│   ├── components/
│   │   ├── ChatBubble.tsx           # Main floating chat UI
│   │   ├── ChatMessage.tsx          # Individual message component
│   │   ├── VoiceInput.tsx           # Voice I/O component
│   │   └── VisualGuide.tsx          # Step-by-step guidance renderer
│   ├── utils/
│   │   ├── page-context.ts          # Extract DOM context
│   │   ├── dom-highlighter.ts       # Highlight and animate elements
│   │   ├── animated-cursor.ts       # Cursor animation system
│   │   └── messaging.ts             # Extension message passing
│   ├── lib/
│   │   └── api-client.ts            # Backend API communication
│   ├── types/
│   │   └── index.ts                 # TypeScript types
│   ├── styles/
│   │   └── extension.css            # Extension styling
│   └── manifest.json                # Chrome extension manifest
├── app/
│   ├── api/
│   │   ├── chat/route.ts            # Chat processing endpoint
│   │   ├── sessions/route.ts        # Session management
│   │   └── feedback/route.ts        # Feedback collection
│   ├── lib/
│   │   ├── openai-client.ts         # OpenAI integration
│   │   ├── structured-output.ts     # Guidance schema
│   │   └── dynamodb.ts              # DynamoDB client
│   └── layout.tsx                   # Next.js layout
├── wxt.config.ts                    # WXT configuration
├── EXTENSION_SETUP.md               # Detailed setup guide
└── README_EXTENSION.md              # This file
```

## Key Features

### 1. **Floating Chat Bubble**
- Shadow DOM isolated to prevent host site style conflicts
- Glassmorphic design with blur effect
- Toggle with `Ctrl+Shift+G` or button click
- Smooth animations and transitions

### 2. **Visual Guidance System**
- **Element Highlighting:** Pulsing glow effect on target elements
- **Cursor Animation:** Simulated cursor that moves to show clickable areas
- **Sequential Steps:** Multi-step guidance renderer with progress tracking
- **Auto-scroll:** Automatically scrolls page to make guide visible

### 3. **AI-Powered Assistance**
- Analyzes page structure (buttons, forms, headings, text)
- Generates contextual, step-by-step guidance
- Uses structured output for reliable action parsing
- Handles complex multi-step workflows

### 4. **Voice I/O** (When Implemented)
- Speech recognition for voice queries
- Text-to-speech for guidance playback
- Hands-free navigation assistance

### 5. **Session Management**
- Persistent chat history (30 days)
- Multi-session support across tabs
- DynamoDB-backed storage
- TTL-based automatic cleanup

## API Integration

### Backend Endpoints

**POST /api/chat** - Send message and get guidance
```typescript
const response = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({
    sessionId: 'session_123',
    message: 'How do I check out?',
    pageContext: { /* extracted DOM info */ }
  })
});
```

**GET /api/sessions** - Retrieve chat sessions

**POST /api/feedback** - Submit message feedback

## Extension Architecture

### Content Script Flow

```
User types message in chat bubble
         ↓
Content script extracts page context
         ↓
API call to backend with message + context
         ↓
OpenAI generates guidance + structured steps
         ↓
Backend returns response + step array
         ↓
Extension renders steps with visual guides
         ↓
DOM highlighter activates element highlights
         ↓
Cursor animator shows interaction hints
```

### Page Context Extraction

The extension automatically collects:
- Page title, URL, and meta description
- All clickable elements (buttons, links)
- Form inputs and labels
- Headings and major text sections
- Images with alt text
- Accessible element hierarchy

## Configuration

### Environment Variables

```env
# Backend API URL (for extension)
REACT_APP_API_URL=http://localhost:3000

# OpenAI Configuration
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4-turbo-preview

# AWS DynamoDB
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
```

### WXT Configuration

The `wxt.config.ts` file controls:
- Manifest version (MV3)
- Content script injection points
- Background service worker setup
- Build output directory

## Building for Production

```bash
# Build extension zip
pnpm run build:ext

# Create deployment package
zip -r ai-site-guide.zip .output/chrome-mv3/

# Deploy backend to Vercel
vercel deploy
```

## Testing

### Extension Testing
- Load unpacked in Chrome DevTools
- Check DevTools Console for errors
- Use Chrome Extension DevTools for debugging

### Backend Testing
```bash
# Start backend
pnpm dev

# Test API endpoints
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test",
    "message": "Help me navigate",
    "pageContext": {}
  }'
```

### DynamoDB Testing
```bash
# Use AWS CLI to check tables
aws dynamodb scan \
  --table-name ai-site-guide-sessions \
  --region us-east-1
```

## Performance Optimization

- **Bundle Size:** Lazy load guidance system
- **API Calls:** Use streaming for long responses
- **Storage:** Automatic TTL-based cleanup
- **DOM:** Batch highlight/unhighlight operations

## Security Considerations

1. **Content Security Policy:** Configured for minimal permissions
2. **API Keys:** Kept server-side only
3. **User Data:** Encrypted in transit, TTL expiration
4. **No Third-Party Tracking:** Clean privacy practices

## Common Issues & Solutions

### Extension not showing
- Verify manifest.json is valid
- Check content script permissions
- Ensure CSS is properly scoped with Shadow DOM

### API connection errors
- Confirm backend is running on port 3000
- Check CORS headers in API routes
- Verify environment variables

### DynamoDB errors
- Test AWS credentials: `aws sts get-caller-identity`
- Confirm tables exist in correct region
- Check IAM permissions for DynamoDB access

### OpenAI errors
- Verify API key is valid and has credits
- Check rate limits
- Ensure model name is supported

## Roadmap

- [ ] Voice input/output integration
- [ ] Multi-language support
- [ ] Browser history context
- [ ] A/B testing framework
- [ ] Analytics dashboard
- [ ] B2B widget version
- [ ] Mobile app (React Native)
- [ ] Offline mode with local cache

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT - See LICENSE file

## Support

- **Issues:** GitHub Issues
- **Documentation:** See EXTENSION_SETUP.md
- **Contact:** support@example.com

---

**Tech Stack:** WXT • Next.js 16 • React 19 • Tailwind CSS • TypeScript • AI SDK • AWS DynamoDB • OpenAI

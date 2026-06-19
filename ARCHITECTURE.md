# AI Site Guide - Architecture & Technical Details

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────┐         ┌────────────────────────┐   │
│  │   Website DOM        │         │  Chrome Extension      │   │
│  │  (Any web page)      │◄──────► │  (WXT + React)         │   │
│  │  - Buttons           │         │  - Content Script      │   │
│  │  - Forms             │         │  - Shadow DOM Bubble   │   │
│  │  - Text              │         │  - Message Passing     │   │
│  └──────────────────────┘         └────────────────────────┘   │
│                                            │                    │
│                                            │                    │
│                                    ┌───────▼────────┐           │
│                                    │  Chat UI       │           │
│                                    │ - Messages     │           │
│                                    │ - Voice Input  │           │
│                                    │ - Feedback     │           │
│                                    └────────────────┘           │
│                                            │                    │
│                                    ┌───────▼────────┐           │
│                                    │ DOM Utils      │           │
│                                    │ - Highlighter  │           │
│                                    │ - Cursor Anim  │           │
│                                    │ - Page Extract │           │
│                                    └────────────────┘           │
│                                            │                    │
│                                    ┌───────▼────────┐           │
│                                    │ API Client     │           │
│                                    │ - HTTP Fetch   │           │
│                                    │ - Error Handle │           │
│                                    └────────────────┘           │
│                                            │                    │
└────────────────────────────────────────────┼────────────────────┘
                                             │
                                    HTTPS (Secure)
                                             │
┌────────────────────────────────────────────┼────────────────────┐
│                      VERCEL BACKEND                              │
├────────────────────────────────────────────┼────────────────────┤
│                                            │                    │
│                                    ┌───────▼────────┐           │
│                                    │ API Routes     │           │
│                                    │ /api/chat      │           │
│                                    │ /api/sessions  │           │
│                                    │ /api/feedback  │           │
│                                    └────────────────┘           │
│                                            │                    │
│                    ┌───────────────────────┼───────────────────┐│
│                    │                       │                   ││
│            ┌───────▼────────┐    ┌────────▼──────┐  ┌─────────▼─┐
│            │ OpenAI Client  │    │ DynamoDB      │  │ Structured│
│            │ - Chat GPT     │    │ Client        │  │ Output    │
│            │ - Streaming    │    │ - Sessions    │  │ Schema    │
│            │ - Tokens       │    │ - Messages    │  │ (Zod)     │
│            └────────────────┘    │ - Feedback    │  └───────────┘
│                                  └───────────────┘                │
└─────────────────────────────────────────────────────────────────┘
                                             │
                                    HTTPS (Secure)
                                             │
┌────────────────────────────────────────────┼────────────────────┐
│                     AWS ACCOUNT                                  │
├────────────────────────────────────────────┼────────────────────┤
│                                            │                    │
│                                    ┌───────▼────────┐           │
│                                    │ DynamoDB       │           │
│                                    │ Tables         │           │
│                                    ├────────────────┤           │
│                                    │ Sessions       │           │
│                                    │ Messages       │           │
│                                    │ Feedback       │           │
│                                    └────────────────┘           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. User Types a Message

```
User Input
  ↓
React State Update (ChatMessage)
  ↓
Content Script captures input
  ↓
Extract Page Context (DOM, headings, buttons, forms)
  ↓
API Client prepares request payload
  ↓
HTTP POST to /api/chat
```

### 2. Backend Processing

```
API receives request
  ↓
Validate input (Zod schema)
  ↓
Save session in DynamoDB (if new)
  ↓
Generate system prompt with page context
  ↓
Stream to OpenAI API with structured output schema
  ↓
OpenAI returns:
  - Chat response text
  - Structured guidance steps (JSON)
  ↓
Save chat message to DynamoDB
  ↓
Return response + guidance to client
```

### 3. Visual Guidance Display

```
Receive guidance steps from API
  ↓
For each step:
  1. Find DOM element (CSS selector)
  2. Highlight with pulsing glow
  3. Animate cursor to element
  4. Display instruction text
  5. Wait for user interaction or timeout
  6. Unhighlight and move to next step
  ↓
Step complete - ask for next step
```

### 4. Feedback Loop

```
User clicks "helpful" or "not helpful"
  ↓
API Client prepares feedback
  ↓
HTTP POST to /api/feedback
  ↓
Save feedback to DynamoDB with TTL
  ↓
(Optional) Send to analytics/monitoring
```

## Component Architecture

### Extension Components (Frontend)

```typescript
// Entry point
content-script-setup.ts
├── ChatBubble Component
│   ├── Header (title, close button)
│   ├── Messages Area
│   │   └── ChatMessage (per message)
│   ├── Input Area
│   │   ├── Text Input
│   │   ├── Send Button
│   │   └── VoiceInput (microphone icon)
│   └── Feedback Area
│       └── Thumbs up/down buttons
└── VisualGuide Component
    ├── Step Indicator
    ├── Instruction Text
    ├── DOM Highlighter (visual feedback)
    └── Cursor Animator (motion guidance)
```

### API Route Structure

```typescript
app/
├── api/
│   ├── chat/route.ts
│   │   ├── POST handler
│   │   ├── Input validation
│   │   ├── Session management
│   │   ├── OpenAI streaming
│   │   ├── Structured output parsing
│   │   └── DynamoDB save
│   │
│   ├── sessions/route.ts
│   │   ├── GET handler (retrieve sessions)
│   │   ├── POST handler (create session)
│   │   └── DELETE handler (clear history)
│   │
│   └── feedback/route.ts
│       ├── POST handler (save feedback)
│       └── Analytics integration point
│
├── lib/
│   ├── openai-client.ts
│   │   └── Configured OpenAI client
│   │
│   ├── structured-output.ts
│   │   └── Zod schemas for validation
│   │
│   └── dynamodb.ts
│       ├── DynamoDB client setup
│       ├── Table helpers
│       ├── Query operations
│       └── TTL handling
```

## Database Schema

### Table: ai-site-guide-sessions

```
Partition Key: sessionId (String)
Sort Key: createdAt (Number - Unix timestamp)

Attributes:
- sessionId: String (Primary)
- createdAt: Number (Unix ms)
- userId: String (Optional)
- messageCount: Number
- lastActive: Number
- metadata: Map (extensible)
- expiresAt: Number (TTL - 24 hours)

Example:
{
  "sessionId": "session_1718820123456_abc123",
  "createdAt": 1718820123456,
  "userId": "user_optional",
  "messageCount": 5,
  "lastActive": 1718823456789,
  "metadata": {
    "pageUrls": ["github.com", "google.com"],
    "userAgent": "Chrome/..."
  },
  "expiresAt": 1718906523  // 24 hours later
}
```

### Table: ai-site-guide-messages

```
Partition Key: sessionId (String)
Sort Key: timestamp (Number - Unix timestamp)

Attributes:
- sessionId: String (Primary)
- timestamp: Number (Unix ms)
- messageId: String (Unique)
- role: String ("user" | "assistant")
- content: String
- pageContext: Map
  - title: String
  - url: String
  - buttons: List<String>
  - forms: List<String>
  - headings: List<String>
- guidanceSteps: List<Map>
- feedbackScore: Number (-1: not helpful, 0: neutral, 1: helpful)
- expiresAt: Number (TTL - 30 days)

Example:
{
  "sessionId": "session_xxx",
  "timestamp": 1718820123456,
  "messageId": "msg_xyz",
  "role": "assistant",
  "content": "I'll help you sign up...",
  "pageContext": {
    "title": "GitHub Signup",
    "url": "https://github.com/signup",
    "buttons": ["Sign up with email", "Continue"],
    "forms": ["email", "password"]
  },
  "guidanceSteps": [
    {
      "step": 1,
      "action": "click",
      "selector": "button:contains('Sign up with email')",
      "instruction": "Click the email signup button"
    }
  ],
  "feedbackScore": 1,
  "expiresAt": 1721498123
}
```

### Table: ai-site-guide-feedback

```
Partition Key: feedbackId (String)

Attributes:
- feedbackId: String (UUID)
- sessionId: String
- messageId: String
- feedback: String ("helpful" | "not_helpful" | "partially_helpful")
- userComment: String (Optional)
- timestamp: Number
- expiresAt: Number (TTL - 90 days)

Example:
{
  "feedbackId": "fb_12345678-90ab-cdef-1234-567890abcdef",
  "sessionId": "session_xxx",
  "messageId": "msg_xyz",
  "feedback": "helpful",
  "userComment": "Great instructions, saved me time!",
  "timestamp": 1718820223456,
  "expiresAt": 1726598123
}
```

## Key Technologies

### Frontend (Extension)

- **WXT:** Modern Web Extension framework
- **React 19:** UI library with latest hooks
- **Shadow DOM:** Style isolation for chat bubble
- **Zustand:** Minimal state management
- **Zod:** Runtime type validation
- **Tailwind CSS:** Utility-first styling

### Backend

- **Next.js 16:** Serverless functions on Vercel
- **Vercel AI SDK:** Unified AI interface
- **OpenAI API:** LLM backbone (gpt-4-turbo-preview)
- **AWS SDK:** DynamoDB access with IAM auth
- **Zod:** Request/response validation

### Infrastructure

- **Vercel:** Serverless backend with auto-scaling
- **AWS DynamoDB:** NoSQL database with on-demand billing
- **OpenAI API:** Hosted LLM service

## Scalability Considerations

### Horizontal Scaling

- **Vercel:** Automatic scaling (serverless)
- **DynamoDB:** On-demand billing (scales automatically)
- **CDN:** Vercel Edge Network for reduced latency

### Vertical Optimization

- **API Response Caching:** Cache page contexts
- **Token Optimization:** Use GPT-3.5 for simple tasks
- **Batch Operations:** Combine feedback saves

### Cost Optimization

- **DynamoDB TTL:** Auto-delete old data
- **API Rate Limiting:** Prevent abuse
- **Model Selection:** Use cheaper models when appropriate

## Security Architecture

### Data Flow Security

```
Browser Extension
  │
  └─► HTTPS Encryption ─► Vercel Backend
       (TLS 1.3)          - No storage
                          - Immediate processing
                          │
                          └─► OpenAI API (HTTPS)
                              - No storage
                              - API Key server-side only
                              │
                              └─► DynamoDB (IAM Auth)
                                  - Encrypted at rest
                                  - TTL-based expiration
```

### Key Security Measures

1. **Extension Sandbox:** Content script isolated from host page
2. **API Authentication:** OpenAI key never exposed to client
3. **CORS Protection:** Vercel API only accepts from extension
4. **Data Minimization:** Only send necessary context
5. **Encryption:** TLS for all data in transit
6. **No Client Storage:** Session data only in DynamoDB
7. **TTL Expiration:** Automatic data cleanup

## Extension Manifest Permissions

```json
{
  "permissions": [
    "activeTab",      // Access current tab
    "scripting",      // Inject content script
    "storage"         // Store extension settings
  ],
  "host_permissions": [
    "<all_urls>"      // Access any website
  ]
}
```

Each permission is minimal and justified:
- **activeTab:** Needed to extract page context
- **scripting:** Inject UI and highlighting
- **storage:** Remember user preferences
- **all_urls:** Extension works on any website

## Performance Metrics

### Target Performance

| Metric | Target | Current |
|--------|--------|---------|
| Extension Load | <500ms | TBD |
| Chat API Response | <3s | TBD |
| Guidance Rendering | <200ms | TBD |
| DOM Highlight | <50ms | TBD |
| Cursor Animation | 60fps | TBD |

### Optimization Opportunities

- Lazy load guidance system
- Cache page contexts
- Use streaming for long responses
- Optimize CSS animations
- Debounce DOM queries

## Error Handling

### Extension Error Handling

```typescript
try {
  // Extract page context
  const context = extractPageContext();
  
  // Send message
  const response = await apiClient.sendMessage(
    userMessage,
    context
  );
  
  // Render guidance
  renderGuidance(response.guidance);
} catch (error) {
  // User-friendly error message
  showErrorNotification(error.message);
  
  // Log for debugging
  console.error('[Extension]', error);
}
```

### API Error Handling

```typescript
try {
  // Validate input
  const validated = ChatSchema.parse(request.body);
  
  // Call OpenAI
  const response = await openai.createMessage(...);
  
  // Parse structured output
  const guidance = StructuredSchema.parse(response);
  
  // Save to DB
  await saveMessageToDb(guidance);
  
  return response;
} catch (error) {
  // Return appropriate status
  if (error instanceof ZodError) {
    return { status: 400, error: 'Invalid input' };
  }
  return { status: 500, error: 'Server error' };
}
```

## Monitoring & Analytics

### Key Metrics to Track

1. **Usage:**
   - DAU (Daily Active Users)
   - Messages per session
   - Popular queries

2. **Performance:**
   - API response time
   - Extension load time
   - DynamoDB query latency

3. **Quality:**
   - Feedback score distribution
   - Error rate
   - Success rate (completed tasks)

4. **Cost:**
   - OpenAI token usage
   - DynamoDB read/write capacity
   - Vercel function invocations

### Integration Points

- Vercel Analytics (built-in)
- DynamoDB CloudWatch metrics
- OpenAI usage dashboard
- Custom logging to DynamoDB

## Future Architecture Evolution

### Phase 2: Multi-language & Models

```
- Add language detection
- Support Claude, Mistral, local LLMs
- Cached translations
```

### Phase 3: Analytics Dashboard

```
- Website owner insights
- Popular queries
- User satisfaction trends
- Widget for website owners
```

### Phase 4: Collaborative Features

```
- Shared guidance sessions
- Team annotations
- Public knowledge base
```

### Phase 5: Mobile

```
- React Native app
- Simplified guidance rendering
- Touch gesture support
```

## Testing Strategy

### Unit Tests
- Page context extraction
- DOM highlighter logic
- API client methods

### Integration Tests
- Extension ↔ Backend communication
- Backend ↔ DynamoDB operations
- Structured output parsing

### E2E Tests
- Full user flow: message → guidance → feedback
- Visual guidance rendering
- Error recovery

### Performance Tests
- API response time under load
- Extension memory usage
- DOM highlight performance

---

**Last Updated:** June 2026
**Architecture Version:** 1.0
**Status:** Production Ready

# AI Site Guide - Deployment Checklist

Complete this checklist to ensure your extension and backend are properly deployed and configured.

## Phase 1: Local Development Setup ✓

- [ ] Clone repository and install dependencies
  ```bash
  git clone <repo-url>
  cd ai-site-guide
  pnpm install
  ```

- [ ] Copy environment template
  ```bash
  cp .env.example .env.local
  ```

- [ ] Add your credentials to `.env.local`
  - [ ] OpenAI API Key (get from https://platform.openai.com/api-keys)
  - [ ] AWS Access Key ID and Secret
  - [ ] AWS Region (e.g., us-east-1)

- [ ] Test backend locally
  ```bash
  pnpm dev
  # Should start on http://localhost:3000
  ```

- [ ] Test extension locally
  ```bash
  pnpm watch:ext
  # In another terminal: visit chrome://extensions, enable Developer mode
  # Click "Load unpacked" → select .output/chrome-mv3
  ```

- [ ] Manual testing on a test website
  - [ ] Press Ctrl+Shift+G to open chat bubble
  - [ ] Send a test message
  - [ ] Verify API connection works
  - [ ] Check console for errors

## Phase 2: AWS DynamoDB Setup ✓

### Create Tables

- [ ] **ChatSessions Table**
  ```bash
  aws dynamodb create-table \
    --table-name ai-site-guide-sessions \
    --attribute-definitions \
      AttributeName=sessionId,AttributeType=S \
      AttributeName=createdAt,AttributeType=N \
    --key-schema \
      AttributeName=sessionId,KeyType=HASH \
      AttributeName=createdAt,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-1
  ```

- [ ] **ChatHistory Table**
  ```bash
  aws dynamodb create-table \
    --table-name ai-site-guide-messages \
    --attribute-definitions \
      AttributeName=sessionId,AttributeType=S \
      AttributeName=timestamp,AttributeType=N \
      AttributeName=userId,AttributeType=S \
    --key-schema \
      AttributeName=sessionId,KeyType=HASH \
      AttributeName=timestamp,KeyType=RANGE \
    --global-secondary-indexes \
      'IndexName=userId-timestamp-index,Keys=[{AttributeName=userId,KeyType=HASH},{AttributeName=timestamp,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5}' \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-1
  ```

- [ ] **Feedback Table**
  ```bash
  aws dynamodb create-table \
    --table-name ai-site-guide-feedback \
    --attribute-definitions \
      AttributeName=feedbackId,AttributeType=S \
    --key-schema \
      AttributeName=feedbackId,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-1
  ```

### Enable TTL

- [ ] ChatSessions TTL (24 hours)
  ```bash
  aws dynamodb update-time-to-live \
    --table-name ai-site-guide-sessions \
    --time-to-live-specification 'AttributeName=expiresAt,Enabled=true' \
    --region us-east-1
  ```

- [ ] ChatHistory TTL (30 days)
  ```bash
  aws dynamodb update-time-to-live \
    --table-name ai-site-guide-messages \
    --time-to-live-specification 'AttributeName=expiresAt,Enabled=true' \
    --region us-east-1
  ```

- [ ] Feedback TTL (90 days)
  ```bash
  aws dynamodb update-time-to-live \
    --table-name ai-site-guide-feedback \
    --time-to-live-specification 'AttributeName=expiresAt,Enabled=true' \
    --region us-east-1
  ```

### Verify Tables Created

- [ ] List tables
  ```bash
  aws dynamodb list-tables --region us-east-1
  ```
  Should show:
  - ai-site-guide-sessions
  - ai-site-guide-messages
  - ai-site-guide-feedback

## Phase 3: Vercel Deployment ✓

### GitHub Setup

- [ ] Initialize git repository
  ```bash
  git init
  git add .
  git commit -m "Initial commit: AI Site Guide extension"
  git branch -M main
  git remote add origin https://github.com/YOUR_USERNAME/ai-site-guide.git
  git push -u origin main
  ```

- [ ] Repository is public or Vercel has access

### Deploy to Vercel

- [ ] Install Vercel CLI
  ```bash
  pnpm install -g vercel
  ```

- [ ] Login to Vercel
  ```bash
  vercel login
  ```

- [ ] Deploy project
  ```bash
  vercel
  # Follow prompts, select project name and settings
  ```

- [ ] Get deployment URL
  - Note the URL: `https://your-project.vercel.app`

### Configure Environment Variables

- [ ] Go to Vercel project settings
- [ ] Navigate to "Environment Variables"
- [ ] Add production variables:
  - [ ] `OPENAI_API_KEY` = your-openai-key
  - [ ] `AWS_REGION` = us-east-1
  - [ ] `AWS_ACCESS_KEY_ID` = your-access-key
  - [ ] `AWS_SECRET_ACCESS_KEY` = your-secret-key
  - [ ] `DYNAMODB_SESSIONS_TABLE` = ai-site-guide-sessions
  - [ ] `DYNAMODB_MESSAGES_TABLE` = ai-site-guide-messages
  - [ ] `DYNAMODB_FEEDBACK_TABLE` = ai-site-guide-feedback

- [ ] Redeploy after setting env vars
  ```bash
  vercel redeploy --prod
  ```

### Test Deployment

- [ ] Verify API is responding
  ```bash
  curl https://your-project.vercel.app/api/chat
  # Should return error about missing body, not 404
  ```

- [ ] Check logs
  ```bash
  vercel logs
  ```

## Phase 4: Extension Configuration ✓

### Update API URL

- [ ] Edit `src/lib/api-client.ts`
  ```typescript
  const API_BASE = 'https://your-project.vercel.app';
  ```

- [ ] Rebuild extension
  ```bash
  pnpm run build:ext
  ```

- [ ] Create deployment package
  ```bash
  cd .output/chrome-mv3
  zip -r ../../ai-site-guide.zip .
  cd ../..
  ```

### Test Production Configuration

- [ ] Reload extension in Chrome
  - [ ] Open chrome://extensions
  - [ ] Click the refresh icon on AI Site Guide
  - [ ] Visit a test website
  - [ ] Verify chat bubble opens (Ctrl+Shift+G)
  - [ ] Send a test message
  - [ ] Confirm it connects to Vercel (check browser DevTools Network tab)

## Phase 5: Browser Store Submission ✓

### Prepare for Store

- [ ] Create extension store assets:
  - [ ] 128x128 icon (PNG)
  - [ ] 440x280 promotional image
  - [ ] Screenshots (up to 5, 1280x800)
  - [ ] Write extension description (up to 132 characters)
  - [ ] Create detailed privacy policy

- [ ] Finalize manifest.json
  - [ ] Update version number
  - [ ] Verify all permissions are justified
  - [ ] Update description

- [ ] Create privacy policy
  - [ ] Document what data is collected
  - [ ] Explain how OpenAI processes data
  - [ ] Detail retention policies (30 days)
  - [ ] Host at public URL

### Submit to Chrome Web Store

- [ ] Go to https://chrome.google.com/webstore/devconsole/register
- [ ] Create developer account (one-time $5 fee)
- [ ] Click "New item"
- [ ] Upload `ai-site-guide.zip`
- [ ] Fill in store listing:
  - [ ] Title: "AI Site Guide"
  - [ ] Short description (132 chars max)
  - [ ] Detailed description
  - [ ] Upload promotional image
  - [ ] Upload screenshots
  - [ ] Set category: "Productivity"
  - [ ] Add privacy policy URL

- [ ] Set permissions in manifest
  - [ ] Verify each permission is necessary
  - [ ] Explain in store listing why each permission is needed

- [ ] Submit for review
  - Typical approval: 1-2 business days
  - May require changes if review team finds issues

## Phase 6: Post-Deployment Monitoring ✓

### Setup Monitoring

- [ ] Configure Vercel Analytics
  - [ ] Add analytics to track performance
  - [ ] Monitor API response times

- [ ] Set up error tracking (optional but recommended)
  ```bash
  pnpm add @sentry/nextjs
  ```
  Then configure in Vercel

- [ ] Monitor DynamoDB costs
  - [ ] CloudWatch dashboards
  - [ ] Set up billing alerts in AWS

### Create Support Documentation

- [ ] Write FAQ
  - [ ] How to install
  - [ ] How to use
  - [ ] Troubleshooting common issues

- [ ] Setup issue tracking
  - [ ] GitHub Issues for bug reports
  - [ ] Support email address

## Phase 7: Optimization & Scaling ✓

### Performance Optimization

- [ ] Monitor API response times
- [ ] Optimize OpenAI API calls
  - [ ] Check token usage
  - [ ] Consider using GPT-3.5 for cost savings
- [ ] Enable caching where possible
- [ ] Monitor DynamoDB read/write capacity

### Scaling Preparation

- [ ] Plan for increased users
  - [ ] Vercel serverless scales automatically
  - [ ] DynamoDB on-demand scales automatically
- [ ] Setup rate limiting (if needed)
- [ ] Consider API quotas

### Security Audit

- [ ] Review CORS configuration
- [ ] Verify API key security
  - [ ] Keys only in Vercel env vars
  - [ ] Never commit .env files
- [ ] Enable HTTPS everywhere (automatic on Vercel)
- [ ] Review extension permissions
- [ ] Audit DynamoDB access policies

## Phase 8: Launch & Communication ✓

- [ ] Announce on Product Hunt (optional)
- [ ] Share on Twitter/LinkedIn
- [ ] Update GitHub README
- [ ] Create launch blog post
- [ ] Setup analytics dashboard

## Rollback Plan

If issues arise:

1. **Revert Vercel deployment**
   ```bash
   vercel rollback
   ```

2. **Remove from Chrome Store**
   - Go to store dashboard
   - Click "Unpublish" (keeps it accessible by direct URL)

3. **Hotfix & Redeploy**
   ```bash
   # Make fixes
   git commit -am "Hotfix: issue description"
   git push origin main
   vercel redeploy --prod
   ```

## Support Resources

- **WXT Docs:** https://wxt.dev
- **Next.js 16:** https://nextjs.org/docs
- **AI SDK:** https://sdk.vercel.ai
- **AWS DynamoDB:** https://aws.amazon.com/dynamodb
- **Chrome Extension Docs:** https://developer.chrome.com/docs/extensions

## Sign-Off

- [ ] Development lead reviewed this checklist
- [ ] QA tested all functionality
- [ ] Security review completed
- [ ] Performance benchmarked
- [ ] Deployment approved for production

**Date Deployed:** _______________

**Deployed By:** _______________

**Version:** _______________

---

**Questions?** Check EXTENSION_SETUP.md or create an issue on GitHub.

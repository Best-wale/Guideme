# How to Load the Extension in Chrome

Your extension has been successfully built! Now you need to load it into Chrome manually (Chrome doesn't automatically load extensions from development directories).

## Step 1: Build the Extension

The extension should already be built. To rebuild it at any time, run:

```bash
pnpm run build:ext
```

The built extension is located at: `.output/chrome-mv3/`

## Step 2: Open Chrome Extensions Page

1. Open Chrome (or Chromium-based browsers like Edge, Brave, etc.)
2. Go to: `chrome://extensions/`
3. Or use: Menu → More tools → Extensions

## Step 3: Enable Developer Mode

In the top-right corner of the Extensions page, toggle **"Developer mode"** ON.

## Step 4: Load Unpacked Extension

1. Click **"Load unpacked"** button
2. Navigate to the project folder: `/vercel/share/v0-project`
3. Select the `.output/chrome-mv3` folder
4. Click **"Select Folder"**

## Step 5: Verify Extension is Loaded

You should now see the extension listed on the Extensions page:
- **Name:** AI Site Guide
- **Status:** Should show as "enabled"
- **Icon:** Shows the extension icon

## Step 6: Test the Extension

1. Go to any website (e.g., https://github.com)
2. **Press: `Ctrl+Shift+G`** (Windows/Linux) or **`Cmd+Shift+G`** (Mac)
3. A chat bubble should appear in the bottom-right corner

## Step 7: What if it doesn't show?

### The chat bubble doesn't appear:
- Check if the extension is enabled (should be blue/green toggle on Extensions page)
- Try opening the browser console (F12) and look for any errors
- Try reloading the page (F5)
- Try pressing the keyboard shortcut again

### Errors in console:
- If you see "API error", the backend isn't running or the API URL is wrong
- Make sure `pnpm dev` is running for the Next.js backend
- Check that the API URL in `src/entrypoints/background.ts` matches your backend URL

### The popup appears but shows errors:
- Open the popup (Extensions page → click on "AI Site Guide")
- Check the browser console (F12) for error messages
- Make sure the backend is running and accessible

## Using the Extension

Once loaded, here's how to use it:

1. **Press `Ctrl+Shift+G`** to open/close the chat bubble
2. **Ask a question** about the website (e.g., "How do I fork a repository?")
3. **The extension will**:
   - Extract information from the page
   - Send it to the AI backend
   - Generate step-by-step guidance
   - Highlight elements you need to click
   - Show an animated cursor showing where to click

## Reloading the Extension After Changes

If you make changes to the extension code:

1. Run `pnpm run build:ext` to rebuild
2. Go to `chrome://extensions/`
3. Click the **"Refresh"** button on the AI Site Guide extension card
4. The extension will reload with your changes

## Need Help?

- **Extension shows error**: Check `.output/chrome-mv3/manifest.json` format
- **Chat not working**: Ensure the backend is running (`pnpm dev`)
- **Want to see logs**: Open DevTools (F12) and check Console tab

## Next Steps

1. Load the extension into Chrome (follow steps above)
2. Test it on github.com by asking "How do I fork a repository?"
3. Check the console (F12) for any errors
4. Deploy your backend to Vercel when ready

**Note:** The extension is currently set to use `http://localhost:3000/api` for the backend. Update the API URL in `src/entrypoints/background.ts` when you deploy.

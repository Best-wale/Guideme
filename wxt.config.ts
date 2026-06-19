import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'AI Site Guide',
    description: 'An intelligent browser extension that guides you through websites with AI-powered instructions',
    version: '1.0.0',
    permissions: ['activeTab', 'scripting', 'storage', 'tabs'],
    host_permissions: ['<all_urls>'],
    action: {
      default_popup: 'src/entrypoints/popup.html',
      default_title: 'AI Site Guide',
    },
    icons: {
      16: '/icons/icon-16.png',
      32: '/icons/icon-32.png',
      48: '/icons/icon-48.png',
      128: '/icons/icon-128.png',
    },
  },
  entrypointsDir: 'src/entrypoints',
  srcDir: 'src',
  outDir: 'dist',
});

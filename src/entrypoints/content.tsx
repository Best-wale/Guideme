import { defineContentScript } from 'wxt/sandbox';
import { setupContentScript } from './content-script-setup';

export default defineContentScript({
  matches: ['<all_urls>'],
  world: 'MAIN',
  async main(ctx) {
    await setupContentScript(ctx);
  },
});

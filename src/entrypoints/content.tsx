import { defineContentScript } from 'wxt/utils/define-content-script';
import { setupContentScript } from '../utils/content-script-setup';

export default defineContentScript({
  matches: ['<all_urls>'],
  world: 'MAIN',
  async main(ctx) {
    await setupContentScript(ctx);
  },
});

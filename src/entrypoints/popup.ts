document.addEventListener('DOMContentLoaded', () => {
  const settingsBtn = document.getElementById('settings-btn');
  const helpBtn = document.getElementById('help-btn');

  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
  }

  if (helpBtn) {
    helpBtn.addEventListener('click', () => {
      chrome.tabs.create({
        url: chrome.runtime.getURL('help.html'),
      });
    });
  }
});

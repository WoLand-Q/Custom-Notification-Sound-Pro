async function updateRules() {
  chrome.storage.sync.get(
      [
        'isEnabled',
        'redirectUrl',
        'localFilePath',
        'selectedSound',
        'originalSoundUrl'
      ],
      async (data) => {
        await chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: [1]
        });

        if (data.isEnabled) {
          let redirectUrl = '';

          if (data.localFilePath) {
            redirectUrl = chrome.runtime.getURL(data.localFilePath);
          } else if (data.redirectUrl) {
            redirectUrl = data.redirectUrl;
          } else if (data.selectedSound) {
            redirectUrl = chrome.runtime.getURL(data.selectedSound);
          }

          if (redirectUrl) {
            const originalSound =
                data.originalSoundUrl ||
                'https://sd.onix-soft.com.ua/sounds/notification.mp3';

            await chrome.declarativeNetRequest.updateDynamicRules({
              addRules: [
                {
                  id: 1,
                  priority: 1,
                  action: {
                    type: 'redirect',
                    redirect: { url: redirectUrl }
                  },
                  condition: {
                    urlFilter: originalSound,
                    resourceTypes: ['media', 'xmlhttprequest']
                  }
                }
              ]
            });
          }
        }
      }
  );
}

chrome.runtime.onStartup.addListener(updateRules);
chrome.runtime.onInstalled.addListener(updateRules);
chrome.storage.onChanged.addListener((changes, area) => {
  if (
      area === 'sync' &&
      (changes.isEnabled ||
          changes.redirectUrl ||
          changes.localFilePath ||
          changes.selectedSound ||
          changes.originalSoundUrl)
  ) {
    updateRules();
  }
});

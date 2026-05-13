chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'OPEN_EUC') {
    chrome.storage.local.get('eucCredentials', function(result) {
      var creds = result.eucCredentials || {};
      chrome.storage.local.set({ eucPending: { keyword: msg.keyword, ts: Date.now() } }, function() {
        // ログイン情報があればログインページから、なければEUCページへ直接
        var url = (creds.userId && creds.password)
          ? 'https://s-class.admin.sus.ac.jp/uprx/up/xu/xua001/Xua00102.xhtml'
          : 'https://s-class.admin.sus.ac.jp/uprx/up/xu/xua001/Xua00101.xhtml';
        chrome.tabs.create({ url: url });
      });
    });
    sendResponse({ ok: true });
    return true;
  }
});

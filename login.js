// login.js — ログインページ (Xua00102.xhtml) で自動ログイン
// セレクタ確認済み:
//   ユーザーID: input#loginForm\:userId
//   パスワード: input#loginForm\:password
//   ログインボタン: LOGINテキストを含む .ui-button

(function() {
  chrome.storage.local.get(['eucPending', 'eucCredentials'], function(result) {
    var pending = result.eucPending;
    var creds   = result.eucCredentials;

    if (!pending || !creds || !creds.userId || !creds.password) return;
    if (Date.now() - pending.ts > 5 * 60 * 1000) return;

    waitFor('#loginForm\\:userId', 8000).then(function(userInput) {
      var passInput = document.querySelector('#loginForm\\:password');
      if (!passInput) throw new Error('password not found');

      // 入力
      setNativeValue(userInput, creds.userId);
      setNativeValue(passInput, creds.password);

      setTimeout(function() {
        // LOGINボタンを探してクリック
        var loginBtn = null;
        document.querySelectorAll('.ui-button').forEach(function(b) {
          if (!loginBtn) {
            var txt = b.querySelector('.ui-button-text');
            if (txt && txt.textContent.trim().toUpperCase() === 'LOGIN') {
              loginBtn = b;
            }
          }
        });

        if (loginBtn) {
          loginBtn.click();
        } else {
          // フォールバック: submitボタンを探す
          var sub = document.querySelector('input[type="submit"], button[type="submit"]');
          if (sub) sub.click();
        }
      }, 400);

    }).catch(function(e) {
      console.warn('[EUC] ログインフィールドが見つかりません:', e);
    });
  });

  // React/JSF対応のvalue設定
  function setNativeValue(el, value) {
    var nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativeInputValueSetter.call(el, value);
    el.dispatchEvent(new Event('input',  { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function waitFor(selector, timeout) {
    return new Promise(function(resolve, reject) {
      var t = Date.now();
      (function check() {
        var el = document.querySelector(selector);
        if (el) return resolve(el);
        if (Date.now() - t > timeout) return reject(new Error('timeout'));
        setTimeout(check, 200);
      })();
    });
  }
})();

// toplevel.js — ログイン後トップページでEUCメニューを自動クリック

(function() {
  chrome.storage.local.get('eucPending', function(result) {
    var pending = result.eucPending;
    if (!pending) return;
    if (Date.now() - pending.ts > 5 * 60 * 1000) return;

    waitFor('#menuForm\\:mainMenu', 8000).then(function() {
      setTimeout(function() {

        // HTMLより確認済み: EUC学生出欠登録のリンクを探す
        // <a data-pfconfirmcommand="...menuid':'16'..." onclick="confirmIfModified(this);return false;">
        var eucLink = null;
        document.querySelectorAll('#menuForm\\:mainMenu .ui-menuitem-link').forEach(function(a) {
          if (!eucLink) {
            var cmd = a.getAttribute('data-pfconfirmcommand') || '';
            var txt = a.querySelector('.ui-menuitem-text');
            if (
              (txt && txt.textContent.trim() === 'EUC学生出欠登録') ||
              (cmd.includes("'menuForm:mainMenu_menuid':'16'"))
            ) {
              eucLink = a;
            }
          }
        });

        if (eucLink) {
          // onclick="confirmIfModified(this);return false;" を正しく実行
          // confirmIfModified はページの関数で、変更確認後にdata-pfconfirmcommandを実行する
          eucLink.click();
          console.log('[EUC] EUC学生出欠登録をクリックしました');
        } else {
          console.warn('[EUC] EUC学生出欠登録リンクが見つかりません');
        }

      }, 1500);
    }).catch(function() {
      console.warn('[EUC] メニューが見つかりません');
    });
  });

  function waitFor(selector, timeout) {
    return new Promise(function(resolve, reject) {
      var t = Date.now();
      (function check() {
        var el = document.querySelector(selector);
        if (el) return resolve(el);
        if (Date.now() - t > timeout) return reject();
        setTimeout(check, 300);
      })();
    });
  }
})();

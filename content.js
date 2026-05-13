// content.js — EUCページ (Xua00101.xhtml) で自動入力・登録
// セレクタ確認済み:
//   入力: input#funcForm:number
//   登録ボタン: span.ui-button-text = "出席登録"
//   OKボタン: span.ui-button-text = "OK"

(function() {

  function waitFor(selector, timeout) {
    return new Promise(function(resolve, reject) {
      var t = Date.now();
      (function check() {
        var el = document.querySelector(selector);
        if (el) return resolve(el);
        if (Date.now() - t > timeout) return reject();
        setTimeout(check, 200);
      })();
    });
  }

  function showBanner(msg, color) {
    var el = document.getElementById('_euc_banner');
    if (!el) {
      el = document.createElement('div');
      el.id = '_euc_banner';
      el.style.cssText = [
        'position:fixed', 'bottom:24px', 'right:24px', 'z-index:999999',
        'padding:14px 18px', 'border-radius:12px', 'font-size:14px',
        'font-family:-apple-system,sans-serif', 'color:#fff',
        'box-shadow:0 4px 20px rgba(0,0,0,0.3)', 'max-width:300px',
        'line-height:1.5', 'display:flex', 'align-items:center', 'gap:12px',
        'transition:background 0.3s'
      ].join(';');
      document.body.appendChild(el);
    }
    el.style.background = color;
    el.innerHTML = '<span>' + msg + '</span>' +
      '<button onclick="this.parentElement.remove()" style="background:rgba(255,255,255,0.3);border:none;color:#fff;border-radius:6px;padding:3px 9px;cursor:pointer;font-size:12px;flex-shrink:0">✕</button>';
  }

  // メイン処理
  chrome.storage.local.get('eucPending', function(result) {
    var pending = result.eucPending;
    if (!pending || !pending.keyword) return;
    if (Date.now() - pending.ts > 5 * 60 * 1000) return;

    chrome.storage.local.remove('eucPending');

    showBanner('⏳ キーワードを入力中...', '#185FA5');

    // input#funcForm:number を待つ
    waitFor('#funcForm\\:number', 8000).then(function(input) {

      // キーワード入力
      input.focus();
      input.value = pending.keyword;
      input.dispatchEvent(new Event('input',  { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      // onchange="return PrimeFaces.vi(this)" を直接呼ぶ
      if (typeof PrimeFaces !== 'undefined') {
        try { PrimeFaces.vi(input); } catch(e) {}
      }

      setTimeout(function() {
        // 「出席登録」ボタンを探す
        // <span class="ui-button-text ui-c">出席登録</span> の親ボタン
        var submitBtn = null;
        document.querySelectorAll('.ui-button-text').forEach(function(span) {
          if (!submitBtn && span.textContent.trim() === '出席登録') {
            submitBtn = span.closest('.ui-button, button');
          }
        });

        if (!submitBtn) {
          showBanner('⚠ 出席登録ボタンが見つかりません', '#854F0B');
          return;
        }

        submitBtn.click();
        showBanner('👆 OKボタンを押して完了してください', '#854F0B');

        // 履歴に保存（OKを押す前だが登録操作は完了しているので記録）
        chrome.storage.local.get('eucHistory', function(r) {
          var h = r.eucHistory || [];
          var now = new Date();
          h.unshift({
            keyword: pending.keyword,
            date: now.toLocaleDateString('ja-JP'),
            time: now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
          });
          chrome.storage.local.set({ eucHistory: h.slice(0, 30) });
        });

      }, 600);

    }).catch(function() {
      showBanner('⚠ EUC入力フィールドが見つかりません', '#A32D2D');
    });
  });

})();

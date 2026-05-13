document.addEventListener('DOMContentLoaded', function() {
  var mainScreen     = document.getElementById('screen-main');
  var settingsScreen = document.getElementById('screen-settings');

  // 画面切替
  document.getElementById('goto-settings').onclick = function() {
    mainScreen.style.display = 'none';
    settingsScreen.style.display = 'block';
    loadCreds();
  };
  document.getElementById('goto-main').onclick = function() {
    settingsScreen.style.display = 'none';
    mainScreen.style.display = 'block';
    checkCreds();
    loadHistory();
  };

  // 初期化
  checkCreds();
  loadHistory();

  // --- メイン ---
  var kwInput  = document.getElementById('keyword');
  var submitBtn = document.getElementById('submit-btn');
  var mainMsg  = document.getElementById('main-msg');

  kwInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') doSubmit(); });
  submitBtn.addEventListener('click', doSubmit);

  function doSubmit() {
    var kw = kwInput.value.trim();
    if (!kw) { showMsg(mainMsg, 'キーワードを入力してください', 'err'); return; }
    submitBtn.disabled = true;
    submitBtn.textContent = '開いています...';
    chrome.runtime.sendMessage({ type: 'OPEN_EUC', keyword: kw }, function() {
      showMsg(mainMsg, '✅ S-CLASSを開きました', 'ok');
      kwInput.value = '';
      setTimeout(function() { window.close(); }, 700);
    });
  }

  function checkCreds() {
    chrome.storage.local.get('eucCredentials', function(r) {
      var c = r.eucCredentials || {};
      var warn = document.getElementById('login-warn');
      if (!c.userId || !c.password) {
        warn.style.display = 'block';
      } else {
        warn.style.display = 'none';
      }
    });
  }

  function loadHistory() {
    chrome.storage.local.get('eucHistory', function(r) {
      var list = document.getElementById('history-list');
      var h = r.eucHistory || [];
      if (!h.length) { list.innerHTML = '<div class="empty">まだ登録履歴がありません</div>'; return; }
      list.innerHTML = h.slice(0, 5).map(function(item) {
        var kw = item.keyword.replace(/'/g, "\\'");
        return '<div class="history-item" onclick="document.getElementById(\'keyword\').value=\'' + kw + '\';document.getElementById(\'keyword\').focus()">' +
          '<span class="h-kw">' + item.keyword + '</span>' +
          '<span class="h-meta">' + item.date + '<br>' + item.time + '</span>' +
          '</div>';
      }).join('');
    });
  }

  // --- 設定 ---
  document.getElementById('toggle-pass').onclick = function() {
    var p = document.getElementById('password');
    p.type = p.type === 'password' ? 'text' : 'password';
    this.textContent = p.type === 'password' ? '👁' : '🙈';
  };

  document.getElementById('save-btn').onclick = function() {
    var uid  = document.getElementById('userId').value.trim();
    var pass = document.getElementById('password').value;
    var msg  = document.getElementById('settings-msg');
    if (!uid || !pass) { showMsg(msg, '学籍番号とパスワードを入力してください', 'err'); return; }
    chrome.storage.local.set({ eucCredentials: { userId: uid, password: pass } }, function() {
      showMsg(msg, '✅ 保存しました', 'ok');
      setTimeout(function() { document.getElementById('goto-main').click(); }, 700);
    });
  };

  document.getElementById('clear-btn').onclick = function() {
    if (!confirm('ログイン情報を削除しますか？')) return;
    chrome.storage.local.remove('eucCredentials', function() {
      document.getElementById('userId').value = '';
      document.getElementById('password').value = '';
      showMsg(document.getElementById('settings-msg'), '削除しました', 'ok');
    });
  };

  function loadCreds() {
    chrome.storage.local.get('eucCredentials', function(r) {
      var c = r.eucCredentials || {};
      document.getElementById('userId').value   = c.userId   || '';
      document.getElementById('password').value = c.password || '';
    });
  }

  function showMsg(el, text, type) {
    el.textContent = text;
    el.className = type;
    if (type === 'err') setTimeout(function() { el.textContent = ''; }, 3000);
  }
});

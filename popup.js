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

  checkCreds();
  loadHistory();

  // --- メイン ---
  var kwInput   = document.getElementById('keyword');
  var submitBtn = document.getElementById('submit-btn');
  var mainMsg   = document.getElementById('main-msg');

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
      document.getElementById('login-warn').style.display =
        (!c.userId || !c.password) ? 'block' : 'none';
    });
  }

  // --- カルーセル ---
  var currentIndex = 0;
  var historyData  = [];

  function loadHistory() {
    chrome.storage.local.get('eucHistory', function(r) {
      historyData = r.eucHistory || [];
      currentIndex = 0;
      renderCarousel();
    });
  }

  function renderCarousel() {
    var track    = document.getElementById('carousel-track');
    var dots     = document.getElementById('carousel-dots');
    var empty    = document.getElementById('history-empty');
    var viewport = document.getElementById('carousel-viewport');
    var leftBtn  = document.getElementById('arrow-left');
    var rightBtn = document.getElementById('arrow-right');

    if (!historyData.length) {
      track.innerHTML = '';
      dots.innerHTML  = '';
      empty.style.display  = 'block';
      document.querySelector('.carousel-outer').style.display = 'none';
      dots.style.display   = 'none';
      return;
    }

    empty.style.display  = 'none';
    document.querySelector('.carousel-outer').style.display = 'flex';
    dots.style.display   = 'flex';

    // カード生成
    track.innerHTML = historyData.map(function(h, i) {
      return '<div class="history-card" data-index="' + i + '">' +
        '<div class="h-kw">' + h.keyword + '</div>' +
        '<div class="h-meta">' + h.date + '<br>' + h.time + '</div>' +
        '<button class="h-del" data-index="' + i + '" title="削除">✕</button>' +
        '</div>';
    }).join('');

    // ドット生成
    dots.innerHTML = historyData.map(function(_, i) {
      return '<button class="dot' + (i === currentIndex ? ' active' : '') + '" data-index="' + i + '"></button>';
    }).join('');

    // カードクリック → キーワード入力
    track.querySelectorAll('.history-card').forEach(function(card) {
      card.addEventListener('click', function(e) {
        if (e.target.classList.contains('h-del')) return;
        var kw = historyData[parseInt(card.dataset.index)].keyword;
        document.getElementById('keyword').value = kw;
        document.getElementById('keyword').focus();
      });
    });

    // 削除ボタン
    track.querySelectorAll('.h-del').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var idx = parseInt(btn.dataset.index);
        historyData.splice(idx, 1);
        if (currentIndex >= historyData.length) currentIndex = Math.max(0, historyData.length - 1);
        chrome.storage.local.set({ eucHistory: historyData }, renderCarousel);
      });
    });

    // ドットクリック
    dots.querySelectorAll('.dot').forEach(function(dot) {
      dot.addEventListener('click', function() {
        currentIndex = parseInt(dot.dataset.index);
        updatePosition();
      });
    });

    // 矢印
    leftBtn.disabled  = currentIndex === 0;
    rightBtn.disabled = currentIndex === historyData.length - 1;

    updatePosition();
  }

  function updatePosition() {
    var track    = document.getElementById('carousel-track');
    var dots     = document.getElementById('carousel-dots');
    var leftBtn  = document.getElementById('arrow-left');
    var rightBtn = document.getElementById('arrow-right');

    // viewport幅を取得してスライド
    var viewport = document.getElementById('carousel-viewport');
    var w = viewport.offsetWidth || 220;
    track.style.transform = 'translateX(-' + (currentIndex * w) + 'px)';

    leftBtn.disabled  = currentIndex === 0;
    rightBtn.disabled = currentIndex === historyData.length - 1;

    dots.querySelectorAll('.dot').forEach(function(dot, i) {
      dot.classList.toggle('active', i === currentIndex);
    });
  }

  document.getElementById('arrow-left').addEventListener('click', function() {
    if (currentIndex > 0) { currentIndex--; updatePosition(); }
  });
  document.getElementById('arrow-right').addEventListener('click', function() {
    if (currentIndex < historyData.length - 1) { currentIndex++; updatePosition(); }
  });

  // 全削除
  document.getElementById('clear-all-btn').addEventListener('click', function() {
    if (!historyData.length) return;
    if (!confirm('登録履歴をすべて削除しますか？')) return;
    historyData = [];
    currentIndex = 0;
    chrome.storage.local.set({ eucHistory: [] }, renderCarousel);
  });

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

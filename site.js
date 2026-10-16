// Site furniture around the toy: a menu sheet (about, tip, GitHub, privacy, credits) and a tip nudge
// after a finished session. Kept out of src/main.js so the game stays untouched; it only reads the DOM
// main.js already owns (html[lang], #done, #cred).
(() => {
  const GH = 'https://github.com/kkunkunya/digital-cat';
  const TIERS = [['can', '🥫', '2.99'], ['fish', '🐟', '4.99'], ['tower', '🏰', '9.99']];
  const COPY = {
    zh: {
      open: '关于与打赏', name: '数字猫猫', tag: '拍一下猫屁屁，30 秒班味清零。',
      tipH: '请猫猫吃点好的', tipP: '免费玩，不用登录。喜欢的话，请它吃顿好的，支持继续做下去。',
      can: '一个罐罐', fish: '一包小鱼干', tower: '一座猫爬架',
      soon: '打赏通道审核中，很快开放。',
      about: '关于这只猫', aboutS: '是什么、谁做的、怎么做的',
      gh: 'GitHub 源码', ghS: '开源，欢迎点个 Star',
      privacy: '隐私说明', cred: '音效来源', close: '关闭', pay: '安全收银台由 Waffo 提供',
      nudge: '放松到了？请猫猫吃个罐罐',
    },
    en: {
      open: 'About & tip', name: 'Digital Cat', tag: 'Pat the cat. Unwind in 30 seconds.',
      tipH: 'Treat the cat', tipP: 'Free to play, no sign-up. If it made you smile, a small treat keeps it going.',
      can: 'A can of food', fish: 'Fish snacks', tower: 'A cat tower',
      soon: 'Tips open soon — the checkout is in review.',
      about: 'About this cat', aboutS: 'What it is, who made it, how',
      gh: 'Source on GitHub', ghS: 'Open source — a star helps',
      privacy: 'Privacy', cred: 'Audio credits', close: 'Close', pay: 'Secure checkout by Waffo',
      nudge: 'Feeling better? Treat the cat',
    },
  };
  const lang = () => (document.documentElement.lang === 'zh' ? 'zh' : 'en');
  const qs = new URLSearchParams(location.search);
  try { if (qs.get('tip') === 'test') sessionStorage.setItem('tip', 'test'); } catch (e) { /* private mode */ }
  let testMode = false; try { testMode = sessionStorage.getItem('tip') === 'test'; } catch (e) { /* private mode */ }
  let tipOpen = testMode;

  const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
  const stage = document.getElementById('stage');
  if (!stage) return;

  const btn = el('button', 'sx-open', '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="2.2"/><circle cx="12" cy="12" r="2.2"/><circle cx="19" cy="12" r="2.2"/></svg>');
  btn.id = 'sxopen';
  stage.appendChild(btn);

  const wrap = el('div', 'sx'); wrap.hidden = true;
  wrap.innerHTML = `<div class="sx-sheet" role="dialog" aria-modal="true" aria-labelledby="sxname">
    <div class="sx-grab"></div>
    <button class="sx-x" data-k="close-aria" aria-label="close">✕</button>
    <header class="sx-head"><img class="sx-logo" src="icon-180.png" alt="" width="56" height="56"><div><h2 id="sxname" data-k="name"></h2><p data-k="tag"></p></div></header>
    <section class="sx-tip"><h3 data-k="tipH"></h3><p data-k="tipP"></p>
      <div class="sx-tiers">${TIERS.map(([k, e, p]) => `<button class="sx-tier" data-tier="${k}"><span class="e">${e}</span><b data-k="${k}"></b><span class="p">$${p}</span></button>`).join('')}</div>
      <p class="sx-soon" data-k="soon"></p><p class="sx-pay" data-k="pay"></p></section>
    <a class="sx-row" href="about.html"><span class="i">🐈</span><span><b data-k="about"></b><small data-k="aboutS"></small></span><span class="go">→</span></a>
    <a class="sx-row" href="${GH}" target="_blank" rel="noopener"><span class="i"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg></span><span><b data-k="gh"></b><small data-k="ghS"></small></span><span class="go">↗</span></a>
    <footer class="sx-foot"><a href="privacy.html" data-k="privacy"></a><i>·</i><a href="audio/CREDITS.txt" target="_blank" rel="noopener" data-k="cred"></a><i>·</i><span>© 2026 Kun</span></footer>
  </div>`;
  document.body.appendChild(wrap);

  const nudge = el('button', 'sx-nudge');
  stage.appendChild(nudge);

  function paint() {
    const t = COPY[lang()];
    wrap.querySelectorAll('[data-k]').forEach((n) => { const k = n.dataset.k; if (k === 'close-aria') n.setAttribute('aria-label', t.close); else n.textContent = t[k]; });
    btn.setAttribute('aria-label', t.open); btn.title = t.open;
    nudge.textContent = '🥫 ' + t.nudge;
    wrap.classList.toggle('tip-off', !tipOpen);
    // Keep the about/privacy links in the visitor's language.
    wrap.querySelectorAll('a[href$=".html"]').forEach((a) => { a.href = a.getAttribute('href').split('?')[0] + '?lang=' + lang(); });
  }

  let lastFocus = null;
  function open(focusTip) {
    lastFocus = document.activeElement; paint(); wrap.hidden = false;
    requestAnimationFrame(() => { wrap.classList.add('on'); (focusTip && tipOpen ? wrap.querySelector('.sx-tier') : wrap.querySelector('.sx-x')).focus({ preventScroll: true }); });
    nudge.classList.remove('on');
  }
  function close() { wrap.classList.remove('on'); setTimeout(() => { wrap.hidden = true; lastFocus && lastFocus.focus && lastFocus.focus(); }, 260); }
  btn.addEventListener('click', () => open(false));
  nudge.addEventListener('click', () => open(true));
  wrap.addEventListener('click', (e) => { if (e.target === wrap || e.target.closest('.sx-x')) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !wrap.hidden) close(); });
  // Swipe the sheet down to dismiss.
  let y0 = null; const sheet = wrap.querySelector('.sx-sheet');
  sheet.addEventListener('touchstart', (e) => { y0 = sheet.scrollTop <= 0 ? e.touches[0].clientY : null; }, { passive: true });
  sheet.addEventListener('touchmove', (e) => { if (y0 != null) { const d = Math.max(0, e.touches[0].clientY - y0); sheet.style.transform = `translateY(${d}px)`; } }, { passive: true });
  sheet.addEventListener('touchend', (e) => { if (y0 != null) { const d = e.changedTouches[0].clientY - y0; sheet.style.transform = ''; if (d > 90) close(); } y0 = null; });

  wrap.querySelectorAll('.sx-tier').forEach((b) => b.addEventListener('click', () => {
    if (!tipOpen) return;
    b.classList.add('go');
    location.href = `/api/tip?tier=${b.dataset.tier}&lang=${lang()}${testMode ? '&mode=test' : ''}`;
  }));

  // The tip shows only once the live checkout is approved (or in an explicit ?tip=test preview).
  if (!testMode) fetch('/api/tip/status').then((r) => (r.ok ? r.json() : null)).then((s) => { tipOpen = !!(s && s.live); paint(); }).catch(() => {});

  // After a finished session main.js raises #done; offer the tip once, a beat later.
  const done = document.getElementById('done');
  let nudged = false; try { nudged = sessionStorage.getItem('nudged') === '1'; } catch (e) { /* private mode */ }
  if (done) new MutationObserver(() => {
    if (nudged || !tipOpen || !done.classList.contains('on')) return;
    nudged = true; try { sessionStorage.setItem('nudged', '1'); } catch (e) { /* private mode */ }
    setTimeout(() => { paint(); nudge.classList.add('on'); setTimeout(() => nudge.classList.remove('on'), 9000); }, 1400);
  }).observe(done, { attributes: true, attributeFilter: ['class'] });

  new MutationObserver(paint).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  paint();
})();

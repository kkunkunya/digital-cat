// Site furniture around the toy: a one-line intro + grey footer under the cat, and a tip button in the
// result card once a session is finished. Kept out of src/main.js so the game stays untouched; it only
// reads the DOM main.js already owns (html[lang], #done, #card).
(() => {
  const GH = 'https://github.com/kkunkunya/digital-cat';
  const MAIL = 'hello@deararcana.com';
  const TAROT = 'https://deararcana.com/'; // our sister site; zh visitors get its Traditional Chinese edition
  const COPY = {
    // Copy from the social-media manager's 1016 sheet. Sound lines say "real cats" / "pats & meows" because
    // the purr is a public-domain recording, not Kun's cat (audio/CREDITS.txt).
    zh: {
      intro: '拍拍它的屁屁，它会哼哼给你听。', by: '声音都来自真猫。坤坤做的小玩具。', faq: '怎么玩 · 声音来源 · 费用 · 常见问题',
      gh: '开源代码', mail: `联系：${MAIL}`, privacy: '不收集个人信息，只在你手机里记战绩', terms: '条款', cred: '拍打声和喵声录自坤坤家的猫',
      tarot: '我们还做了免费塔罗占卜站 Dear Arcana →',
      tip: '给 Tangerine 和 Coal 买个罐罐 🐟', tipNote: '喜欢就投喂，不投也能一直玩', tipAria: '打赏 2.99 美元，给 Tangerine 和 Coal 买个罐罐',
      tipTitle: '请 Tangerine 和 Coal 吃个罐罐', tipBody: '它们拍屁屁拍得好辛苦，一个罐罐就能哼一整天。', tipGo: '投喂一个罐罐 · US$2.99', tipNo: '下次吧', tipFoot: '一次性，不是订阅 · 不投也能一直玩', tipClose: '关闭',
    },
    en: {
      intro: 'Pat its butt. It purrs back.', by: 'Real sounds from real cats. A tiny toy by Kunkun.', faq: 'How to play · Sound sources · Pricing · FAQ',
      gh: 'Open source', mail: `Contact: ${MAIL}`, privacy: 'No personal data — scores stay on your device', terms: 'Terms', cred: "Pats & meows recorded from Kunkun's own cat",
      tarot: 'Also by us: Dear Arcana, free online tarot →',
      tip: 'Buy Tangerine and Coal a can of treats 🐟', tipNote: "Totally optional — it's free forever", tipAria: 'Tip US$2.99 to buy Tangerine and Coal a can of treats',
      tipTitle: 'Treat Tangerine & Coal to a can', tipBody: 'All that patting is hard work. One little can keeps the purring going.', tipGo: 'Buy a can · US$2.99', tipNo: 'Maybe later', tipFoot: 'One-time, never a subscription · still free to play', tipClose: 'Close',
    },
  };
  const lang = () => (document.documentElement.lang === 'zh' ? 'zh' : 'en');
  const qs = new URLSearchParams(location.search);
  try { if (qs.get('tip') === 'test') sessionStorage.setItem('tip', 'test'); } catch (e) { /* private mode */ }
  let testMode = false; try { testMode = sessionStorage.getItem('tip') === 'test'; } catch (e) { /* private mode */ }
  let tipOpen = testMode;
  let played = false;
  let nudged = false; // the corner hint shows at most once per visit

  const app = document.getElementById('app');
  const card = document.getElementById('card');
  const row = card && card.querySelector('.row');
  if (!app) return;

  // index.html ships the footer with a static bilingual description (for search engines); add the rest around it.
  let foot = document.getElementById('sitefoot');
  if (!foot) { foot = app.appendChild(document.createElement('footer')); foot.id = 'sitefoot'; }
  foot.insertAdjacentHTML('afterbegin', '<p><span data-k="intro"></span> <a href="about.html#faq" data-page data-k="faq"></a></p><small data-k="by"></small>');
  foot.insertAdjacentHTML('beforeend', `<nav><a href="${GH}" target="_blank" rel="noopener" data-k="gh"></a><i>·</i><a href="mailto:${MAIL}" data-k="mail"></a><i>·</i><a href="privacy.html" data-page data-k="privacy"></a><i>·</i><a href="terms.html" data-page data-k="terms"></a><i>·</i><a href="audio/CREDITS.txt" target="_blank" rel="noopener" data-k="cred"></a></nav>
    <a class="sib" href="${TAROT}" target="_blank" rel="noopener" data-k="tarot"></a>`);

  const tip = document.createElement('button');
  tip.className = 'btn cat-tip'; tip.hidden = true;
  if (row) row.after(tip); // its own line under Save / Close, at the very bottom of the card

  // The tip pop-up: a small illustrated sheet (can of fish, two cat ears peeking over the rim, floating hearts).
  const CAN = `<svg class="can" viewBox="0 0 160 150" aria-hidden="true">
    <defs><linearGradient id="tc-body" x1="0" x2="1"><stop offset="0" stop-color="#ffb27a"/><stop offset=".5" stop-color="#ff8f4d"/><stop offset="1" stop-color="#f06a3a"/></linearGradient>
    <linearGradient id="tc-lid" x1="0" x2="1"><stop offset="0" stop-color="#f4f0ea"/><stop offset=".5" stop-color="#fff"/><stop offset="1" stop-color="#cfc7bd"/></linearGradient></defs>
    <ellipse cx="80" cy="140" rx="58" ry="7" fill="#7a4a2a" opacity=".16"/>
    <g class="ears"><path d="M42 58 L48 18 L76 46 Z" fill="#e87d3e"/><path d="M50 48 L52 30 L65 44 Z" fill="#ffc9d3"/>
      <path d="M118 58 L112 18 L84 46 Z" fill="#3b3a40"/><path d="M110 48 L108 30 L95 44 Z" fill="#ffc9d3"/></g>
    <path d="M30 56 H130 V122 Q130 136 80 136 Q30 136 30 122 Z" fill="url(#tc-body)"/>
    <path d="M30 56 H130 V70 H30 Z" fill="#fff" opacity=".12"/>
    <rect x="30" y="76" width="100" height="34" fill="#fff6ea"/>
    <path d="M62 93 q10 -9 22 0 q-12 9 -22 0 z M84 93 l10 -6 v12 z" fill="#ff7a3d"/><circle cx="68" cy="92" r="1.6" fill="#fff6ea"/>
    <path d="M38 62 v66" stroke="#fff" stroke-opacity=".35" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="80" cy="56" rx="50" ry="9" fill="url(#tc-lid)"/><ellipse cx="80" cy="56" rx="38" ry="5.5" fill="#e6ddd2"/>
    <g class="eyes" fill="#3a2418"><ellipse cx="66" cy="50" rx="3" ry="3.6"/><ellipse cx="94" cy="50" rx="3" ry="3.6"/></g>
    <path d="M76 55 q4 4 8 0" stroke="#3a2418" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path class="ring" d="M118 52 q22 -6 20 12 q-2 14 -18 10" stroke="#e6ddd2" stroke-width="5" fill="none" stroke-linecap="round"/></svg>`;
  const modal = document.createElement('div');
  modal.id = 'tipmodal'; modal.hidden = true; modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true');
  modal.innerHTML = `<div class="tm-sheet"><button class="tm-x" aria-label="close">×</button>
    <div class="tm-art">${CAN}<i class="h h1">♥</i><i class="h h2">♥</i><i class="h h3">✦</i><i class="h h4">♥</i></div>
    <h2 data-k="tipTitle"></h2><p class="tm-body" data-k="tipBody"></p>
    <button class="tm-go" data-k="tipGo"></button><button class="tm-no" data-k="tipNo"></button><small data-k="tipFoot"></small></div>`;
  document.body.appendChild(modal);
  const openTip = () => { paint(); modal.hidden = false; requestAnimationFrame(() => modal.classList.add('on')); modal.querySelector('.tm-go').focus(); };
  const closeTip = () => { modal.classList.remove('on'); setTimeout(() => { modal.hidden = true; }, 220); };
  modal.addEventListener('click', (e) => { if (e.target === modal || e.target.closest('.tm-no, .tm-x')) closeTip(); });
  modal.querySelector('.tm-go').addEventListener('click', () => go());
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closeTip(); });

  function paint() {
    const t = COPY[lang()];
    foot.querySelectorAll('[data-k]').forEach((n) => { n.textContent = t[n.dataset.k]; });
    // Keep the static pages in the visitor's language.
    foot.querySelectorAll('a[data-page]').forEach((a) => { const [p, h] = a.getAttribute('href').split('#'); a.href = p.split('?')[0] + '?lang=' + lang() + (h ? '#' + h : ''); });
    foot.querySelector('.sib').href = TAROT + (lang() === 'zh' ? 'zh-hant' : '');
    tip.textContent = t.tip; tip.appendChild(document.createElement('small')).textContent = t.tipNote; tip.setAttribute('aria-label', t.tipAria);
    modal.querySelectorAll('[data-k]').forEach((n) => { n.textContent = t[n.dataset.k]; });
    modal.querySelector('.tm-x').setAttribute('aria-label', t.tipClose);
    tip.hidden = !(tipOpen && played);
    if (card) card.classList.toggle('has-tip', !tip.hidden);
  }

  function go() { location.href = `/api/tip?tier=can&lang=${lang()}${testMode ? '&mode=test' : ''}`; }
  tip.addEventListener('click', openTip);

  // The pop-up opens once per visit at 20 pats or the cat's first butt-raise (main.js sets body[data-butt-up]).
  function maybeNudge() {
    if (nudged || !tipOpen) return;
    nudged = true; openTip();
  }
  const num = document.getElementById('num');
  if (num) new MutationObserver(() => { if ((parseInt(num.textContent, 10) || 0) >= 20) maybeNudge(); })
    .observe(num, { childList: true, characterData: true, subtree: true });
  new MutationObserver(() => { if (document.body.dataset.buttUp) maybeNudge(); })
    .observe(document.body, { attributes: true, attributeFilter: ['data-butt-up'] });

  // The tip shows only once the live checkout is approved (or in an explicit ?tip=test preview).
  if (!testMode) fetch('/api/tip/status').then((r) => (r.ok ? r.json() : null)).then((s) => { tipOpen = !!(s && s.live); paint(); }).catch(() => {});

  // main.js raises #done after a finished session; only from then on does the result card offer the tip.
  const done = document.getElementById('done');
  if (done) new MutationObserver(() => { if (!played && done.classList.contains('on')) { played = true; paint(); } }).observe(done, { attributes: true, attributeFilter: ['class'] });

  if (card) new MutationObserver(() => { if (card.classList.contains('on') && !played) { played = true; paint(); } }).observe(card, { attributes: true, attributeFilter: ['class'] });

  new MutationObserver(paint).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  paint();
})();

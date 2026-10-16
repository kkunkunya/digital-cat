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
    },
    en: {
      intro: 'Pat its butt. It purrs back.', by: 'Real sounds from real cats. A tiny toy by Kunkun.', faq: 'How to play · Sound sources · Pricing · FAQ',
      gh: 'Open source', mail: `Contact: ${MAIL}`, privacy: 'No personal data — scores stay on your device', terms: 'Terms', cred: "Pats & meows recorded from Kunkun's own cat",
      tarot: 'Also by us: Dear Arcana, free online tarot →',
      tip: 'Buy Tangerine and Coal a can of treats 🐟', tipNote: "Totally optional — it's free forever", tipAria: 'Tip US$2.99 to buy Tangerine and Coal a can of treats',
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

  const nudge = document.createElement('button');
  nudge.id = 'tipnudge'; nudge.hidden = true; document.body.appendChild(nudge);
  nudge.addEventListener('click', () => { nudge.hidden = true; go(); });

  function paint() {
    const t = COPY[lang()];
    foot.querySelectorAll('[data-k]').forEach((n) => { n.textContent = t[n.dataset.k]; });
    // Keep the static pages in the visitor's language.
    foot.querySelectorAll('a[data-page]').forEach((a) => { const [p, h] = a.getAttribute('href').split('#'); a.href = p.split('?')[0] + '?lang=' + lang() + (h ? '#' + h : ''); });
    foot.querySelector('.sib').href = TAROT + (lang() === 'zh' ? 'zh-hant' : '');
    tip.textContent = t.tip; tip.appendChild(document.createElement('small')).textContent = t.tipNote; tip.setAttribute('aria-label', t.tipAria);
    nudge.textContent = t.tip; nudge.setAttribute('aria-label', t.tipAria);
    tip.hidden = !(tipOpen && played);
    if (card) card.classList.toggle('has-tip', !tip.hidden);
  }

  function go() { location.href = `/api/tip?tier=can&lang=${lang()}${testMode ? '&mode=test' : ''}`; }
  tip.addEventListener('click', () => { tip.classList.add('go'); go(); });

  // Quiet corner hint at 20 pats or the cat's first butt-raise (main.js sets body[data-butt-up]), once per visit,
  // gone after 5 s; never over the cat.
  function maybeNudge() {
    if (nudged || !tipOpen) return;
    nudged = true; paint(); nudge.hidden = false; setTimeout(() => { nudge.hidden = true; }, 5000);
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

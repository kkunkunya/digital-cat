// Site furniture around the toy: a one-line intro + grey footer under the cat, and a tip button in the
// result card once a session is finished. Kept out of src/main.js so the game stays untouched; it only
// reads the DOM main.js already owns (html[lang], #done, #card).
(() => {
  const GH = 'https://github.com/kkunkunya/digital-cat';
  const MAIL = 'hello@deararcana.com';
  const COPY = {
    zh: {
      intro: '拍一下猫屁屁，30 秒班味清零。Kun 和 AI 搭档做的。', faq: '常见问题',
      gh: 'GitHub 开源', mail: '联系', privacy: '不收集个人信息', terms: '条款', cred: '声音出处',
      tip: '🥫 请猫猫吃罐罐', tipAria: '打赏 2.99 美元，请猫猫吃罐罐',
    },
    en: {
      intro: 'Pat the cat, unwind in 30 seconds · by Kun & AI.', faq: 'FAQ',
      gh: 'Open source', mail: 'Contact', privacy: 'No personal data', terms: 'Terms', cred: 'Sounds',
      tip: '🥫 Treat the cat', tipAria: 'Tip US$2.99 to treat the cat',
    },
  };
  const lang = () => (document.documentElement.lang === 'zh' ? 'zh' : 'en');
  const qs = new URLSearchParams(location.search);
  try { if (qs.get('tip') === 'test') sessionStorage.setItem('tip', 'test'); } catch (e) { /* private mode */ }
  let testMode = false; try { testMode = sessionStorage.getItem('tip') === 'test'; } catch (e) { /* private mode */ }
  let tipOpen = testMode;
  let played = false;

  const app = document.getElementById('app');
  const card = document.getElementById('card');
  const row = card && card.querySelector('.row');
  if (!app) return;

  const foot = document.createElement('footer');
  foot.id = 'sitefoot';
  foot.innerHTML = `<p><span data-k="intro"></span> <a href="about.html#faq" data-page data-k="faq"></a></p>
    <nav><a href="${GH}" target="_blank" rel="noopener" data-k="gh"></a><i>·</i><a href="mailto:${MAIL}" data-k="mail"></a><i>·</i><a href="privacy.html" data-page data-k="privacy"></a><i>·</i><a href="terms.html" data-page data-k="terms"></a><i>·</i><a href="audio/CREDITS.txt" target="_blank" rel="noopener" data-k="cred"></a></nav>`;
  app.appendChild(foot);

  const tip = document.createElement('button');
  tip.className = 'btn cat-tip'; tip.hidden = true;
  if (row) row.insertBefore(tip, row.lastElementChild);

  function paint() {
    const t = COPY[lang()];
    foot.querySelectorAll('[data-k]').forEach((n) => { n.textContent = t[n.dataset.k]; });
    // Keep the static pages in the visitor's language.
    foot.querySelectorAll('a[data-page]').forEach((a) => { const [p, h] = a.getAttribute('href').split('#'); a.href = p.split('?')[0] + '?lang=' + lang() + (h ? '#' + h : ''); });
    tip.textContent = t.tip; tip.setAttribute('aria-label', t.tipAria);
    tip.hidden = !(tipOpen && played);
    if (card) card.classList.toggle('has-tip', !tip.hidden);
  }

  tip.addEventListener('click', () => {
    tip.classList.add('go');
    location.href = `/api/tip?tier=can&lang=${lang()}${testMode ? '&mode=test' : ''}`;
  });

  // The tip shows only once the live checkout is approved (or in an explicit ?tip=test preview).
  if (!testMode) fetch('/api/tip/status').then((r) => (r.ok ? r.json() : null)).then((s) => { tipOpen = !!(s && s.live); paint(); }).catch(() => {});

  // main.js raises #done after a finished session; only from then on does the result card offer the tip.
  const done = document.getElementById('done');
  if (done) new MutationObserver(() => { if (!played && done.classList.contains('on')) { played = true; paint(); } }).observe(done, { attributes: true, attributeFilter: ['class'] });

  new MutationObserver(paint).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  paint();
})();

// Language for the static pages: ?lang= → the toy's saved choice → browser. Same 'lang' key as src/main.js.
(() => {
  const q = new URLSearchParams(location.search);
  let saved = ''; try { saved = localStorage.getItem('lang') || ''; } catch (e) { /* private mode */ }
  const pick = [q.get('lang'), saved, ...(navigator.languages || [navigator.language])].map((l) => (l || '').slice(0, 2).toLowerCase()).find((l) => l === 'zh' || l === 'en') || 'en';
  const set = (l) => {
    document.documentElement.lang = l;
    document.querySelectorAll('.lang button').forEach((b) => b.classList.toggle('on', b.dataset.l === l));
    const t = document.querySelector(`meta[name="title-${l}"]`); if (t) document.title = t.content;
    document.querySelectorAll('a[data-keep-lang]').forEach((a) => { a.href = a.getAttribute('href').split('?')[0] + '?lang=' + l; });
  };
  set(pick);
  document.querySelectorAll('.lang button').forEach((b) => b.addEventListener('click', () => { set(b.dataset.l); try { localStorage.setItem('lang', b.dataset.l); } catch (e) { /* private mode */ } }));
  // Tip buttons: same live gate as the toy's menu (site.js).
  const box = document.querySelector('[data-tip]');
  if (box) {
    let test = false; try { test = q.get('tip') === 'test' || sessionStorage.getItem('tip') === 'test'; if (test) sessionStorage.setItem('tip', 'test'); } catch (e) { /* private mode */ }
    box.classList.toggle('tip-off', !test);
    if (!test) fetch('/api/tip/status').then((r) => (r.ok ? r.json() : null)).then((s) => box.classList.toggle('tip-off', !(s && s.live))).catch(() => {});
    box.querySelectorAll('[data-tier]').forEach((b) => b.addEventListener('click', () => {
      location.href = `/api/tip?tier=${b.dataset.tier}&lang=${document.documentElement.lang}${test ? '&mode=test' : ''}`;
    }));
  }
})();

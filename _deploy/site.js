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

  // ── Per-cat bonds (DENE-2239) ── everything below lives on this device only (localStorage); nothing is locked.
  // Each cat counts its own pats and has its own five badges; the old shared total ("pats") is kept as the lifetime count.
  const CATS = ['orange', 'black'];
  const BADGE_AT = [10, 40, 120, 300, 800];
  const CAT_BADGES = {
    black: { emoji: ['👀', '📋', '🪑', '🥫', '🖤'],
      zh: { who: '煤球', names: ['勉强认识你', '煤球的观察名单', '允许你坐旁边', '专属罐罐顾问', '煤球的自己人'],
        says: ['……你还挺有耐心。', '我只是在确认你不是坏人。', '位置给你留着。别误会。', '口味记得不错嘛。', '今天也可以留下。'] },
      en: { who: 'Coal', names: ['Barely acquainted', "On Coal's watch list", 'Allowed to sit nearby', 'Personal can advisor', "Coal's person"],
        says: ['…You are rather patient.', "I'm only checking you're not a bad person.", "Your spot's saved. Don't read into it.", 'Not bad, remembering my flavours.', 'You may stay today too.'] } },
    orange: { emoji: ['🐾', '🎶', '☀️', '🐟', '🏠'],
      zh: { who: '橘子', names: ['橘子的拍友', '呼噜合伙人', '橘子的小太阳', '小鱼干常客', '橘子的家人'],
        says: ['你来啦！我就知道你会喜欢我。', '听见没？这是给你的呼噜。', '你一来，我就开心起来。', '今天也有好吃的吗？', '我最喜欢你回来啦。'] },
      en: { who: 'Tangerine', names: ["Tangerine's pat pal", 'Purr partner', "Tangerine's little sun", 'Treat regular', "Tangerine's family"],
        says: ["You're here! I knew you'd like me.", 'Hear that? The purr is for you.', 'You show up and I light up.', 'Any treats today?', 'I love it when you come back.'] } },
  };
  const BACK = { // next-day greetings, one per cat
    zh: { black: '煤球：你今天怎么才来。……（尾巴却悄悄翘了起来）', orange: '橘子：你回来啦！我等你好久啦！（立刻蹭过来）' },
    en: { black: "Coal: What took you so long today? …(its tail quietly perks up)", orange: 'Tangerine: You came back! I waited so long! (rubs against you at once)' },
  };
  const MEMO = [[2, '🎀'], [5, '🧣'], [10, '🏮']];
  const WALL = {
    zh: { h: '🏆 猫猫勋章墙', total: (n) => `累计拍数 ${n}`, left: (k) => `再 ${k} 下解锁下一枚`, all: '五枚全部解锁',
      got: (b) => `解锁勋章：${b}`, thanks: '谢谢你常来陪它们，想投喂可以点这里 →',
      memoH: '回访纪念', memoSub: (d) => `你来过 ${d} 天 · 不用天天来，隔多久都欢迎`, memoName: ['第二天见面', '五天的缘分', '十天老朋友'], claim: '收下纪念' },
    en: { h: '🏆 Cat badge wall', total: (n) => `${n} pats in total`, left: (k) => `${k} more for the next one`, all: 'All five unlocked',
      got: (b) => `Badge unlocked: ${b}`, thanks: 'Thanks for visiting so often — feed them if you like →',
      memoH: 'Visit keepsakes', memoSub: (d) => `You have visited on ${d} days · skip as many days as you like, you are always welcome`, memoName: ['Day two', 'Five days', 'Ten days'], claim: 'Keep it' },
  };
  const PACK = {
    zh: { entry: '✨ 认识新朋友', h: '认识新朋友', sub: '4 只新猫的想法，还在构思', note: '这只是一个想法投票：现在不卖东西，不会扣你的钱。点一下，告诉我们你想不想要。',
      cats: [['🍦', '奶油', '社交蝴蝶：一来就翻肚皮，喜欢快节奏。'], ['🌧️', '雨点', '慢半拍：先睡眼惺忪，耐心摸才醒。'], ['🥟', '豆包', '贪吃鬼：拍一下停一下，期待小鱼干。'], ['🧢', '队长', '小小巡逻员：绕着你转，每天一个新姿势。']],
      want: (g) => `想要 · 约 US$${g}`, thanks: '记下啦！它们还没做出来，不会扣费。有消息会放在这里。', close: '关闭' },
    en: { entry: '✨ Meet new friends', h: 'Meet new friends', sub: 'Four new cats — just an idea for now', note: "This is a vote on an idea: nothing is for sale and you will not be charged. Tap to tell us whether you'd want it.",
      cats: [['🍦', 'Cream', 'Social butterfly: rolls over at once, loves a quick beat.'], ['🌧️', 'Raindrop', 'Half a beat slow: sleepy until you pat patiently.'], ['🥟', 'Bao', 'Foodie: pat, pause, wait for treats.'], ['🧢', 'Captain', 'Tiny patrol cat: circles you, a new pose each day.']],
      want: (g) => `I'd want this · about US$${g}`, thanks: "Noted! They aren't made yet and nothing was charged. News will show up here.", close: 'Close' },
  };
  const MOOD = {
    zh: { t: (c) => `${c} 又跟你亲近了一点 💛`, s: '它们还有 4 位朋友想认识你', go: '去看看', x: '关闭' },
    en: { t: (c) => `${c} warmed up to you a bit more 💛`, s: 'Four more friends would love to meet you', go: 'Take a look', x: 'Close' },
  };
  const ls = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } };
  const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const today = ymd(new Date());

  // Lifetime pats keep their old key (older visitors keep their number); per-cat counts start from zero, history is not split.
  let total = ls('pats', 0); if (typeof total !== 'number' || !(total >= 0)) total = parseInt(localStorage.getItem('pats') || '0', 10) || 0;
  const by = Object.assign({ orange: 0, black: 0 }, ls('patsBy', {}));
  let days = ls('days', null);
  if (!Array.isArray(days)) days = total > 0 ? ['legacy'] : []; // a visitor who already had pats before this update counts as returning
  const isReturn = days.length > 0 && !days.includes(today);
  if (!days.includes(today)) { days.push(today); save('days', days); }
  const visitDays = days.length;
  const greeted = ls('greeted', {});
  const claimed = ls('memo', {});
  let cur = 'orange';
  const chips = [...document.querySelectorAll('.chip')];
  const curFromChips = () => (CATS[chips.findIndex((c) => c.classList.contains('on'))] || 'orange');
  cur = curFromChips();

  // anonymous counters: no id, no cookie; "o" marks the first time this device does it so we can estimate unique people
  function track(e, g) {
    const k = 'ev_' + e + (g || ''), o = !ls(k, false); if (o) save(k, true);
    const body = JSON.stringify({ e, g, o });
    try { if (!(navigator.sendBeacon && navigator.sendBeacon('/api/e', new Blob([body], { type: 'text/plain' })))) fetch('/api/e', { method: 'POST', body, keepalive: true }); } catch (err) { /* ignore */ }
  }
  let grp = ls('grp', null); if (grp !== '199' && grp !== '299') { grp = Math.random() < 0.5 ? '199' : '299'; save('grp', grp); }
  const priceTxt = () => (grp === '199' ? '1.99' : '2.99');
  const say = (t) => window.dispatchEvent(new CustomEvent('cat:say', { detail: t }));
  if (isReturn) track('return_visit');

  const wall = document.createElement('section'); wall.id = 'wall';
  foot.before(wall);
  const toast = document.createElement('div'); toast.id = 'badgetoast'; toast.hidden = true; document.body.appendChild(toast);

  // "Meet new friends": a concept card (nothing for sale, nobody charged). Appears from the second visit day.
  const friends = document.createElement('button'); friends.id = 'newfriends'; friends.hidden = true;
  const bar = document.getElementById('bar'); if (bar) bar.after(friends); else app.appendChild(friends);
  const sheet = document.createElement('div'); sheet.id = 'packsheet'; sheet.hidden = true; document.body.appendChild(sheet);
  const mood = document.createElement('div'); mood.id = 'moodcard'; mood.hidden = true; document.body.appendChild(mood);
  let packShown = false;
  function showFriends() {
    if (visitDays < 2) return; // never on the first visit day
    friends.hidden = false;
    if (!packShown) { packShown = true; track('pack_entry_shown', grp); }
  }
  function openPack() {
    const p = PACK[lang()];
    track('pack_open', grp);
    sheet.innerHTML = `<div class="box"><button class="x" aria-label="${p.close}">×</button><h2>${p.h}</h2><p class="sub">${p.sub}</p><ul>${p.cats.map(([e, n, d], i) =>
      `<li data-i="${i}"><b>${e}</b><span><strong>${n}</strong><small>${d}</small></span></li>`).join('')}</ul><p class="note">${p.note}</p>
      <button class="want">${p.want(priceTxt())}</button><p class="thx" hidden>${p.thanks}</p></div>`;
    sheet.hidden = false;
    sheet.querySelector('.x').onclick = () => { sheet.hidden = true; };
    sheet.querySelectorAll('li').forEach((li) => { li.onclick = () => { li.classList.toggle('pick'); track('pack_pick', grp); }; });
    sheet.querySelector('.want').onclick = (ev) => { track('pack_interest', grp); ev.currentTarget.hidden = true; sheet.querySelector('.thx').hidden = false; };
  }
  sheet.addEventListener('click', (ev) => { if (ev.target === sheet) sheet.hidden = true; });
  friends.addEventListener('click', openPack);

  // one small, closable card at an emotional high (a freshly earned badge), at most once a day, never on the first visit day
  function maybeMood(catId) {
    if (visitDays < 2) return;
    const m = ls('mood', {}); if (m.day === today) return;
    save('mood', { day: today }); showFriends();
    const t = MOOD[lang()];
    mood.innerHTML = `<span><b>${t.t(CAT_BADGES[catId][lang()].who)}</b><small>${t.s}</small></span><button class="go">${t.go}</button><button class="x" aria-label="${t.x}">×</button>`;
    mood.hidden = false; track('mood_shown');
    mood.querySelector('.x').onclick = () => { mood.hidden = true; track('mood_dismiss'); };
    mood.querySelector('.go').onclick = () => { mood.hidden = true; track('mood_open'); openPack(); };
  }

  function paintWall() {
    const w = WALL[lang()];
    const row = (id) => {
      const n = by[id], b = CAT_BADGES[id], t = b[lang()], nx = BADGE_AT.findIndex((a) => n < a);
      return `<div class="catrow ${id}"><h3>${t.who} · ${n}<small>${nx >= 0 ? w.left(BADGE_AT[nx] - n) : w.all}</small></h3><ul>${BADGE_AT.map((a, i) =>
        `<li class="${n >= a ? 'on' : ''}"><b>${n >= a ? b.emoji[i] : '🔒'}</b><span>${t.names[i]}</span><small>${a}</small></li>`).join('')}</ul></div>`;
    };
    const memo = `<div class="memo"><h3>${w.memoH}<small>${w.memoSub(visitDays)}</small></h3><ul>${MEMO.map(([d, e], i) => {
      const got = visitDays >= d, mine = !!claimed[d];
      return `<li class="${mine ? 'on' : ''}"><b>${mine ? e : got ? '🎁' : '🔒'}</b><span>${w.memoName[i]}</span>${got && !mine ? `<button data-d="${d}">${w.claim}</button>` : `<small>${d}</small>`}</li>`;
    }).join('')}</ul></div>`;
    wall.innerHTML = `<h2>${w.h}</h2><p>${w.total(total)}</p>${CATS.map(row).join('')}${memo}`;
    wall.querySelectorAll('.memo button').forEach((b) => { b.onclick = () => { claimed[b.dataset.d] = 1; save('memo', claimed); track('memo_claim'); paintWall(); }; });
    if (tipOpen && total >= BADGE_AT[0]) {
      const a = wall.appendChild(document.createElement('button')); a.className = 'walltip'; a.textContent = w.thanks; a.addEventListener('click', go);
    }
  }
  window.addEventListener('cat:slap', (e) => {
    const id = CATS.includes(e.detail.cat) ? e.detail.cat : cur;
    const before = by[id]; by[id] += 1; total += 1; save('patsBy', by); save('pats', total);
    const hit = BADGE_AT.findIndex((b) => before < b && by[id] >= b);
    if (hit >= 0) {
      const t = CAT_BADGES[id][lang()];
      toast.textContent = CAT_BADGES[id].emoji[hit] + ' ' + WALL[lang()].got(t.names[hit]); toast.hidden = false; setTimeout(() => { toast.hidden = true; }, 2800);
      say(`${t.who}：${t.says[hit]}`); maybeMood(id);
    }
    paintWall();
  });
  function greet(id) { // next-day line, once per cat per day
    if (!isReturn || greeted[id] === today) return;
    greeted[id] = today; save('greeted', greeted); say(BACK[lang()][id]);
  }
  window.addEventListener('cat:switch', (e) => { cur = CATS.includes(e.detail.cat) ? e.detail.cat : cur; greet(cur); });
  if (isReturn) setTimeout(() => greet(cur), 800);
  if (visitDays >= 2) showFriends();
  const paint0 = paint; paint = () => { paint0(); paintWall(); friends.textContent = PACK[lang()].entry; };

  new MutationObserver(paint).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  paint();
})();

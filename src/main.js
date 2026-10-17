import * as THREE from '../vendor/three.module.js';

const $ = (s) => document.querySelector(s);
const DEBUG = /debug/.test(location.search);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a);
// C1: with 'reduce motion' the press still dents the fur, but there is no overshoot, no extra look-hold and no flying fx
const REDUCE = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ───────────────────────── cats ─────────────────────────
const CATS = [
  {
    id: 'orange', bg: ['#fff3e3', '#ffc890'], ink: '#7a3f10',
    w: 1.14, legs: 1.0, headW: 1.08,
    fur: { len: 0.065, shells: 26, density: 75, thick: 0.62, droop: 0.035, rootDark: 0.55, spec: 0.08, specPow: 5, rim: 0.65, tip: 1.25 },
    colA: '#f39540', colB: '#b4500d', colW: '#fff1df', nose: '#f39a9a', bean: '#ffb0b8',
    spring: { k: 70, c: 5.5, delay: 110 },
    iris: '#f4dc68', irisOut: '#9aa838', pupil: 0.56, slit: 1.0, lidRest: 0,
    tail: { n: 26, len: 1.45, r0: 0.13, r1: 0.1, rest: [-0.9, 1.1, 0.6, 2.4], up: [1.3, -0.75, -0.45, -0.5] },
    look: { k: 24, c: 8, hold: 2.6, delay: 300 }, // slow, lingering look back
    purr: 'audio/purr_orange.mp3', cuts: [0.45, 1.96, 3.72, 5.59],
    // Kun's own cat (audio/kun), as recorded
    meow: { rate: 1, gain: 0.7 },
  },
  {
    // puff: the short satin coat needs a bigger bristle to read on camera when it startles
    id: 'black', puff: 2.6, bg: ['#f1f1ff', '#b7bff0'], ink: '#26284d',
    w: 0.86, legs: 1.1, headW: 0.94,
    fur: { len: 0.03, shells: 20, density: 170, thick: 0.72, droop: 0.008, rootDark: 0.8, spec: 0.12, specPow: 30, rim: 0.22, tip: 1.0 },
    colA: '#1c1b22', colB: '#141318', colW: '#2a2830', nose: '#5b4650', bean: '#d08a98', // pink beans read on camera; a dark pad vanishes into black fur
    spring: { k: 230, c: 12, delay: 0 },
    iris: '#f8e660', irisOut: '#c0a01c', pupil: 0.55, slit: 0.85, lidRest: 0.08,
    tail: { n: 32, len: 1.3, r0: 0.08, r1: 0.055, rest: [1.3, -2.5, -1.25, -0.2], up: [1.32, -1.2, -0.5, -0.5] },
    look: { k: 120, c: 15, hold: 0.9, delay: 30 }, // quick side-eye, then pretends it didn't care
    purr: 'audio/purr_black.mp3', cuts: [0.59, 2.18, 3.56, 5.31, 6.57, 8.72],
    // the same real meows, a little lower
    meow: { rate: 0.9, gain: 0.7 },
  },
];

// ───────────────────────── words (one entry per language; adding a language = adding one entry) ─────────────────────────
const COPY = {
  zh: {
    title: '在线撸猫解压小游戏｜数字猫猫',
    ui: { ear: '建议佩戴耳机', hint: '拍一下屁屁，它就呼噜<small>真猫录音 · 点一下听听 · 左右拖动转视角</small>', pre: '已拍', unit: '下', done: '放松完成，分享战绩', cred: '音效来源',
      share: '晒给朋友', tip: '长按图片即可保存或发送给朋友。', save: '保存图片', close: '关闭' },
    shareText: '拍了一下猫屁屁，它居然舒服地呼噜了。你也试试？',
    sound: '声音', soundOn: '开启声音', soundOff: '关闭声音', saved: '已保存', cardAlt: '分享图', combo: '连拍 ×', wrap: '30 秒到了，好好放松一下。',
    pop: { soft: ['啪', '轻拍', '软'], mid: ['好软', '弹', '啪', '舒服'], big: ['呼噜', '好舒服', '再来', '真舒服'], face: ['蹭蹭', '呼噜', '❤'], pet: ['摸摸', '呼噜', '舒服'] },
    feel: ['还没开始，猫咪在等你。', '拍了一下，压力开始松动。', '拍了几下，心情轻松了一些。', '肩膀放松了，今天可以从容下班。', '压力清零，整个人都回来了。', '今天的辛苦，猫咪替你分担了。'],
    card: { pill: (d) => '今日放松报告 · ' + d.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' }), title: '今天拍了猫屁屁', unit: () => '下',
      stamp: ['压力', '已清零', '缓解中'], company: (c) => `${c.name}（${c.tag}）陪你放松`, tryIt: (a) => `拍拍屁屁就哼哼 ▸ ${a}`, slogan: '拍拍屁屁就哼哼',
      file: (n) => `拍猫屁屁-${n}下.png` },
    cats: {
      orange: { name: '橘子', tag: '温顺', chip: '温顺', lines: {
        idle: '橘子正在晒太阳，拍拍她吧。',
        first: '橘子：嗯？（慢慢回过头）',
        mid: ['又软又弹，压力少了一半。', '橘子：再来一下嘛。', '肩膀是不是松下来了？'],
        high: ['橘子舒服得摊成了一张猫饼。', '呼噜声已经开到最大。', '工作的事，晚点再说。'],
        pet: ['橘子把头蹭进你的手心。', '橘子舒服得眯起了眼睛。'] } },
      black: { name: '煤球', tag: '傲娇', chip: '傲娇', lines: {
        idle: '煤球斜眼看着你：不许拍。',
        first: '煤球：哼！谁允许你拍的？',
        mid: ['煤球：……只许一下。', '煤球：哼，轻一点。', '煤球的尾巴出卖了它。'],
        high: ['呼噜声？不是我发出的。', '煤球：明天……还可以再拍。', '今天的压力，已经清零。'],
        pet: ['煤球假装不在意，耳朵却软了下来。', '煤球：哼……再摸一下。'] } },
    },
  },
  en: {
    title: 'Cat Game Online | Digital Cats · Real Purrs',
    ui: { ear: 'Best with headphones', hint: 'Pat its butt. Hear that happy little purr.<small>Real cat recordings · drag sideways to turn the view</small>', pre: '', unit: 'pats', done: 'All done. Share your score.', cred: 'Audio credits',
      share: 'Share with a friend', tip: 'Press and hold the image to save or share it.', save: 'Save image', close: 'Close' },
    shareText: 'One little pat, one very happy purr. Your turn.',
    sound: 'Sound', soundOn: 'Sound on', soundOff: 'Sound off', saved: 'Saved', cardAlt: 'Score card', combo: 'Combo ×', wrap: 'Thirty seconds. Feeling lighter already.',
    pop: { soft: ['Pat.', 'Boop.', 'Soft.'], mid: ['So soft.', 'Bouncy.', 'Pat.', 'Nice.'], big: ['Purr.', 'So good.', 'Again.', 'Bliss.'], face: ['Nuzzle.', 'Purr.', '❤'], pet: ['Pet.', 'Purr.', 'Cozy.'] },
    feel: ['No pats yet. The cat is waiting.', 'One pat. The stress is starting to ease.', 'A few pats. Already feeling lighter.', 'Shoulders down. You can leave work on time today.', 'Stress cleared. You feel like yourself again.', 'The cat took on the day’s stress for you.'],
    card: { pill: (d) => 'Daily Unwind Report · ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), title: 'Today’s cat pats', unit: (n) => (n === 1 ? 'pat' : 'pats'),
      stamp: ['STRESS', 'OFF', 'LOW'], company: (c) => `${c.name} (${c.tag}) kept you company.`, tryIt: (a) => `Pat it, it purrs ▸ ${a}`, slogan: 'Pat it, it purrs',
      file: (n) => `cat-pats-${n}.png` },
    cats: {
      orange: { name: 'Tangerine', tag: 'Easygoing', chip: 'Easygoing', lines: {
        idle: 'Tangerine is sunbathing. Give her a pat.',
        first: 'Tangerine: Hm? (She slowly turns around.)',
        mid: ['Soft and bouncy. Half the stress is gone.', 'Tangerine: One more, please.', 'Are your shoulders loosening up?'],
        high: ['Tangerine has melted into a cat pancake.', 'The purring is at full volume.', 'Work can wait.'],
        pet: ['Tangerine nuzzles into your palm.', 'Tangerine squints with contentment.'] } },
      black: { name: 'Coal', tag: 'Feisty', chip: 'Feisty', lines: {
        idle: 'Coal is giving you side-eye. No touching.',
        first: 'Coal: Hey! Who said you could do that?',
        mid: ['Coal: Fine. Just one.', 'Coal: Hmph. Not so hard.', 'Coal’s tail is giving it away.'],
        high: ['Purring? That wasn’t me.', 'Coal: You may pat me again tomorrow.', 'Stress level: cleared.'],
        pet: ['Coal acts aloof, but those ears have gone soft.', 'Coal: Hmph. One more.'] } },
    },
  },
};
// ?lang= (for links / testing) > the visitor's own pick > the phone's language > English
const pickLang = () => {
  let saved = ''; try { saved = localStorage.getItem('lang') || ''; } catch (e) { /* private mode */ }
  const q = new URLSearchParams(location.search).get('lang');
  return [q, saved, ...(navigator.languages || [navigator.language])].map((l) => (l || '').slice(0, 2).toLowerCase()).find((l) => COPY[l]) || 'en';
};
let lang = pickLang();
const TX = () => COPY[lang];
function applyLang() {
  const t = TX();
  document.documentElement.lang = lang; document.title = t.title;
  CATS.forEach((c) => Object.assign(c, t.cats[c.id]));
  document.querySelectorAll('[data-t]').forEach((el) => { el.innerHTML = t.ui[el.dataset.t]; });
  document.querySelectorAll('.chip').forEach((b, k) => { b.innerHTML = `${CATS[k].name}<small>${CATS[k].chip}</small>`; });
  $('#mute').setAttribute('aria-label', t.sound);
  $('#mute span').textContent = $('#mute').classList.contains('off') ? t.soundOn : t.soundOff;
  $('#cardimg').alt = t.cardAlt;
  document.querySelectorAll('#lang [data-l]').forEach((s) => s.classList.toggle('on', s.dataset.l === lang));
}
// "1 pat" / "5 pats"; Chinese has no plural
function setUnit() { $('#unit').textContent = lang === 'en' && taps === 1 ? 'pat' : TX().ui.unit; }
applyLang();

// ───────────────────────── renderer / scene ─────────────────────────
const stage = $('#stage');
const canvas = $('#gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.outputColorSpace = THREE.SRGBColorSpace;
let pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
renderer.setPixelRatio(pixelRatio);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
const CAM_POS = new THREE.Vector3(2.5, 2.0, 5.15); // three-quarter rear: butt to camera, body length still readable
const CAM_LOOK = new THREE.Vector3(-0.14, 0.82, -0.24);
const PIVOT = new THREE.Vector3(0, 0, -0.25);
const Y_AXIS = new THREE.Vector3(0, 1, 0);

const KEY0 = new THREE.Vector3(-0.45, 0.85, 0.75).normalize();
const RIM0 = new THREE.Vector3(0.7, 0.35, -0.75).normalize();
const KEY_DIR = KEY0.clone(), RIM_DIR = RIM0.clone();
const key = new THREE.DirectionalLight(0xfff2e0, 2.6); scene.add(key);
const rim = new THREE.DirectionalLight(0xffe0c0, 1.2); scene.add(rim);
scene.add(new THREE.HemisphereLight(0xfff6ee, 0x9a7a66, 1.1));

// drag orbits the camera around the cat; the lights travel with it so every side is lit like a studio shot
const orbit = { az: 0, el: 0, v: 0, zoom: 1, lastDrag: -99 };
function placeCamera(cam, az, el, zoom = 1) {
  const off = CAM_POS.clone().sub(PIVOT);
  const r = off.length() * zoom, el0 = Math.asin(off.y / off.length()), az0 = Math.atan2(off.x, off.z), e = el0 + el;
  cam.position.set(Math.sin(az0 + az) * Math.cos(e), Math.sin(e), Math.cos(az0 + az) * Math.cos(e)).multiplyScalar(r).add(PIVOT);
  cam.lookAt(CAM_LOOK.clone().sub(PIVOT).applyAxisAngle(Y_AXIS, az).add(PIVOT));
  KEY_DIR.copy(KEY0).applyAxisAngle(Y_AXIS, az); RIM_DIR.copy(RIM0).applyAxisAngle(Y_AXIS, az);
  key.position.copy(KEY_DIR).multiplyScalar(5); rim.position.copy(RIM_DIR).multiplyScalar(5);
}
placeCamera(camera, 0, 0);

// backdrop is rendered inside WebGL so the fur's alpha-to-coverage edges blend against the real colour
function backdrop(cat, W, H, glowY = 0.62) {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const x = cv.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, cat.bg[0]); g.addColorStop(1, cat.bg[1]);
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  const r = Math.max(W, H) * 0.55, glow = x.createRadialGradient(W / 2, H * glowY, 10, W / 2, H * glowY, r);
  glow.addColorStop(0, 'rgba(255,255,255,0.7)'); glow.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = glow; x.fillRect(0, 0, W, H);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function setBackdrop() {
  if (scene.background) scene.background.dispose();
  scene.background = backdrop(rig.cat, 360, Math.round(360 / camera.aspect));
}

function resize() {
  const r = stage.getBoundingClientRect();
  renderer.setSize(r.width, r.height, false);
  camera.aspect = r.width / r.height;
  // keep the whole cat in frame on narrow screens
  camera.fov = camera.aspect < 0.62 ? 30 * (0.62 / camera.aspect) ** 0.85 : 30;
  camera.updateProjectionMatrix();
  setBackdrop();
}

// ───────────────────────── fur shader ─────────────────────────
const G = { // uniforms shared by every fur part of the active cat
  uTime: { value: 0 },
  uHit: { value: new THREE.Vector4(0, 0.6, 0.6, 0) },
  uRip: { value: new THREE.Vector2(0, 0) },
  uSquash: { value: 0 },
  uShear: { value: new THREE.Vector2() },
  uLift: { value: 0 },
  uTwist: { value: 0 },
  uWind: { value: new THREE.Vector3() },
  uShake: { value: 0 }, // sideways body shake after a slap (feet stay planted)
  uPuff: { value: new THREE.Vector2(0, -9) }, // x: how puffed the fur is, y: z of the smoothing wave (fur ahead of it is already flat)
  uKey: { value: KEY_DIR },
  uRimDir: { value: RIM_DIR },
};

const FUR_VS = /* glsl */`
attribute float aShell;
uniform float uFurLen, uDroop, uW, uTw, uLift, uSquash, uTwist, uShake, uPlant;
uniform vec4 uHit; uniform vec2 uRip, uShear, uPuff; uniform vec3 uWind;
uniform vec3 uScale; uniform vec4 uBald[3]; uniform float uStripeAmt;
varying vec3 vP; varying vec3 vN; varying vec3 vWorld; varying float vH; varying float vBald; varying float vWarp;

vec3 hash33(vec3 p){ p = fract(p*vec3(0.1031,0.1030,0.0973)); p += dot(p, p.yxz+33.33); return fract((p.xxy+p.yxx)*p.zyx); }
float vnoise(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  float n000=hash33(i).x, n100=hash33(i+vec3(1,0,0)).x, n010=hash33(i+vec3(0,1,0)).x, n110=hash33(i+vec3(1,1,0)).x;
  float n001=hash33(i+vec3(0,0,1)).x, n101=hash33(i+vec3(1,0,1)).x, n011=hash33(i+vec3(0,1,1)).x, n111=hash33(i+vec3(1,1,1)).x;
  return mix(mix(mix(n000,n100,f.x),mix(n010,n110,f.x),f.y),mix(mix(n001,n101,f.x),mix(n011,n111,f.x),f.y),f.z); }

vec3 deform(vec3 p, vec3 n, float w){
  float wz = w * smoothstep(-0.8, 0.45, p.z);
  // poke dent + ripple around the touch point
  float d = length(p - uHit.xyz);
  p -= n * w * (uHit.w * exp(-d*d/0.03) + uRip.x * sin(d*26.0 - uRip.y) * exp(-d*4.5));
  // squash / stretch about the floor
  p.y *= 1.0 - uSquash*wz;
  p.x *= 1.0 + 0.55*uSquash*wz;
  p.z = 0.25 + (p.z-0.25)*(1.0 + 0.3*uSquash*wz);
  // jelly shear (top lags behind)
  p.xz += uShear * max(p.y, 0.0) * wz;
  // shake it off: the body sways sideways, more the higher up, paws planted
  p.x += uShake * w * max(p.y - 0.08, 0.0);
  // looking back: chest and shoulders bend toward the turned head, paws stay planted
  p.x += uTwist * uTw * 0.34 * (1.0 - smoothstep(-1.0, 0.15, p.z)) * smoothstep(0.1, 0.75, p.y);
  // elevator butt: bend the rear upward around the shoulders; hind legs stretch instead, paws stay on the floor
  float a = uLift * mix(wz, smoothstep(-0.8, 0.45, p.z) * smoothstep(-0.7, 0.9, position.y), uPlant); vec3 q = p - vec3(0.0, 0.0, -0.75);
  p = vec3(0.0, 0.0, -0.75) + vec3(q.x, q.y*cos(a) + q.z*sin(a), -q.y*sin(a) + q.z*cos(a));
  return p;
}

void main(){
  float h = aShell;
  vec3 wp = (modelMatrix * vec4(position, 1.0)).xyz;
  // cofactor matrix = inverse-transpose up to a positive scale: three cross products instead of a per-vertex inverse
  mat3 m3 = mat3(modelMatrix);
  vec3 wn = normalize(mat3(cross(m3[1], m3[2]), cross(m3[2], m3[0]), cross(m3[0], m3[1])) * normal);
  vP = position * uScale;
  // the stripe warp is low-frequency: per vertex is enough and spares every fur fragment eight hashes
  vWarp = uStripeAmt > 0.0 ? vnoise(vP*6.0)*1.6 : 0.0;
  float bald = 1.0;
  for(int i=0;i<3;i++){ float bd = length(vP - uBald[i].xyz); bald *= smoothstep(uBald[i].w, uBald[i].w*1.9, bd); }
  vBald = bald;
  // startled puff: fur stands up and lengthens; it smooths back as a wave from head to tail
  float pf = uPuff.x * smoothstep(uPuff.y - 0.3, uPuff.y + 0.3, wp.z);
  wp = deform(wp, wn, uW);
  float len = uFurLen * mix(0.18, 1.0, bald) * (1.0 + 1.1 * pf);
  wp += wn * len * h;
  wp += (vec3(0.0, -uDroop * (1.0 - min(pf, 1.0)), 0.0) + uWind * uW) * h * h;
  vN = wn; vWorld = wp; vH = h;
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
}`;

const FUR_FS = /* glsl */`
uniform vec3 uColA, uColB, uKey, uRimDir, uSky, uGround, uLightCol, uRimCol;
uniform float uDensity, uThick, uRootDark, uSpec, uSpecPow, uRimAmt, uTip, uShells;
uniform vec4 uStripe; uniform float uStripeAmt;
varying vec3 vP; varying vec3 vN; varying vec3 vWorld; varying float vH; varying float vBald; varying float vWarp;

vec3 hash33(vec3 p){ p = fract(p*vec3(0.1031,0.1030,0.0973)); p += dot(p, p.yxz+33.33); return fract((p.xxy+p.yxx)*p.zyx); }

float strand(vec3 q, float h, out float shade){
  vec3 c = floor(q); vec3 f = fract(q);
  vec3 r = hash33(c);
  float top = mix(0.5, 1.0, r.x);
  shade = r.y;
  if (h > top) return 0.0;
  float rad = uThick * (1.0 - h/top);
  // strand position inside its cell, derived from the same hash (one hash per strand, not two)
  vec3 o = fract(r.zxy * 7.13 + r.yzx * 3.71);
  float d = length(f - (0.25 + 0.5*o));
  return smoothstep(rad, rad*0.55, d);
}

void main(){
  float h = vH;
  vec3 q = vP * uDensity / max(vBald, 0.35);
  float s1, s2;
  float a = h < 0.001 ? 1.0 : max(strand(q, h, s1), strand(q*1.37 + 5.3, h, s2));
  if (a < 0.02) discard;
  // colour: base + tabby stripes + per-strand variation + dark roots / bright tips
  vec3 col = uColA;
  if (uStripeAmt > 0.0) {
    float st = sin(dot(vP, uStripe.xyz)*uStripe.w + vWarp);
    col = mix(col, uColB, uStripeAmt * smoothstep(0.15, 0.75, st));
  }
  col *= 0.86 + 0.28*s1;
  col *= mix(uRootDark, 1.0, pow(h, 0.6));
  col *= mix(1.0, uTip, h*h);

  vec3 N = normalize(vN);
  vec3 V = normalize(cameraPosition - vWorld);
  float diff = clamp((dot(N, uKey) + 0.5)/1.5, 0.0, 1.0);
  vec3 amb = mix(uGround, uSky, N.y*0.5+0.5);
  vec3 H = normalize(uKey + V);
  float th = dot(N, H);
  float spec = pow(max(th, 0.0), uSpecPow) * uSpec * (0.6 + 0.4*h);
  float rimF = pow(1.0 - max(dot(N, V), 0.0), 2.5) * uRimAmt * (0.35 + h);
  float back = max(dot(N, uRimDir), 0.0);
  vec3 c = col * (amb + diff * uLightCol) + spec * vec3(0.75, 0.8, 1.0) + rimF * uRimCol * (0.6 + back);
  gl_FragColor = vec4(c, a);
  #include <colorspace_fragment>
}`;

// fur hides facets, so the shells use a coarse sphere (a third of the old triangles); small beads coarser still
const sphereGeo = new THREE.SphereGeometry(1, 28, 18);
const beadGeo = new THREE.SphereGeometry(1, 16, 10);
const furGeoCache = new Map();
function furGeometry(base, shells) {
  const k = base.uuid + ':' + shells;
  if (furGeoCache.has(k)) return furGeoCache.get(k);
  const g = new THREE.InstancedBufferGeometry().copy(base);
  g.setAttribute('aShell', new THREE.InstancedBufferAttribute(new Float32Array(shells), 1));
  g.userData.shells = shells;
  setShells(g, 1);
  furGeoCache.set(k, g);
  return g;
}
// quality tiers thin the shells out while keeping the full fur length (shells are re-spaced, not cut off)
function setShells(g, mul) {
  const N = g.userData.shells, n = Math.min(N, Math.max(4, Math.round(N * mul))), a = g.attributes.aShell;
  for (let i = 0; i < n; i++) a.array[i] = i / (n - 1);
  a.needsUpdate = true; g.instanceCount = n;
}

function furMaterial(cat, o = {}) {
  const f = cat.fur;
  const u = {
    ...G,
    uFurLen: { value: f.len * (o.len ?? 1) },
    uDroop: { value: f.droop * (o.len ?? 1) },
    uW: { value: o.w ?? 0 },
    uPlant: { value: o.plant ?? 0 },
    uTw: { value: o.tw ?? ((o.w ?? 0) > 0 ? 1 : 0) },
    uScale: { value: new THREE.Vector3(1, 1, 1) },
    uBald: { value: (o.bald || []).concat([[0, 0, 99, 0], [0, 0, 99, 0], [0, 0, 99, 0]]).slice(0, 3).map((b) => new THREE.Vector4(...b)) },
    uColA: { value: new THREE.Color(o.col || cat.colA) },
    uColB: { value: new THREE.Color(cat.colB) },
    uStripe: { value: new THREE.Vector4(...(o.stripe || [0, 1, 0.3, 22])) },
    uStripeAmt: { value: (o.stripeAmt ?? 1) * (o.col ? 0 : 1) * (cat.id === 'orange' ? 0.9 : 0) },
    uDensity: { value: f.density * (o.density ?? 1) },
    uThick: { value: f.thick },
    uRootDark: { value: f.rootDark },
    uSpec: { value: f.spec }, uSpecPow: { value: f.specPow },
    uRimAmt: { value: f.rim }, uTip: { value: f.tip }, uShells: { value: f.shells },
    uSky: { value: new THREE.Color(cat.id === 'orange' ? '#c9b8a8' : '#8c8ca6') },
    uGround: { value: new THREE.Color(cat.id === 'orange' ? '#6b4a36' : '#2c2a3a') },
    uLightCol: { value: new THREE.Color('#fff1e2').multiplyScalar(1.05) },
    uRimCol: { value: new THREE.Color(cat.id === 'orange' ? '#ffd7a8' : '#b9c4ff') },
  };
  // alpha drives coverage only; keep the framebuffer's alpha at 1 so the page never shows through the fur
  return new THREE.ShaderMaterial({
    uniforms: u, vertexShader: FUR_VS, fragmentShader: FUR_FS, alphaToCoverage: true,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.ZeroFactor,
    blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
  });
}

function furMesh(cat, geo, o) {
  const shells = Math.max(4, Math.round(cat.fur.shells * (o.shellMul ?? 1)));
  const m = new THREE.Mesh(furGeometry(geo, shells), furMaterial(cat, o));
  m.frustumCulled = false;
  return m;
}

// ───────────────────────── cat builder ─────────────────────────
const Z_AXIS = new THREE.Vector3(0, 0, 1);
function std(color, rough = 0.5, extra = {}) {
  return new THREE.MeshPhysicalMaterial({ color, roughness: rough, ...extra });
}

function eyeTexture(cat) {
  const W = 256, H = 128, cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const x = cv.getContext('2d'), img = x.createImageData(W, H);
  const ci = new THREE.Color(cat.iris), co = new THREE.Color(cat.irisOut);
  const irisR = Math.sin(1.22), pupR = irisR * cat.pupil;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const phi = (i / W) * Math.PI * 2, th = (j / H) * Math.PI;
    const dx = -Math.cos(phi) * Math.sin(th), dy = Math.cos(th), dz = Math.sin(phi) * Math.sin(th);
    const r = Math.hypot(dx, dy);
    let c;
    if (dz < 0 || r > irisR) c = [20, 14, 12];
    else {
      const pu = (dx / (pupR * cat.slit)) ** 2 + (dy / pupR) ** 2;
      if (pu < 1) c = [8, 6, 6];
      else {
        const t = r / irisR;
        const ang = Math.atan2(dy, dx);
        const streak = 0.85 + 0.15 * Math.sin(ang * 37 + Math.sin(ang * 11) * 3);
        const col = ci.clone().lerp(co, t ** 1.6).multiplyScalar(streak * (t > 0.9 ? lerp(1, 0.35, (t - 0.9) / 0.1) : 1));
        c = [col.r * 255, col.g * 255, col.b * 255];
      }
    }
    const k = (j * W + i) * 4;
    img.data[k] = c[0]; img.data[k + 1] = c[1]; img.data[k + 2] = c[2]; img.data[k + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function blushTexture() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64;
  const x = cv.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,120,130,0.9)'); g.addColorStop(1, 'rgba(255,120,130,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(cv);
}
function shadowTexture() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const x = cv.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(60,30,10,0.42)'); g.addColorStop(0.6, 'rgba(60,30,10,0.18)'); g.addColorStop(1, 'rgba(60,30,10,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(cv);
}
// paw-pad skin: fine pebbled grain with darker creases (real toe beans are leathery, not glossy plastic)
function padTexture() {
  const N = 128, cv = document.createElement('canvas'); cv.width = cv.height = N;
  const x = cv.getContext('2d');
  x.fillStyle = '#e4e4e4'; x.fillRect(0, 0, N, N);
  let seed = 7; const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 520; i++) { // pebbles
    const px = r() * N, py = r() * N, rad = 2 + r() * 3.2, v = 236 + r() * 19 | 0;
    for (const [ox, oy] of [[0, 0], [N, 0], [-N, 0], [0, N], [0, -N]]) {
      const g = x.createRadialGradient(px + ox, py + oy, 0, px + ox, py + oy, rad);
      g.addColorStop(0, `rgb(${v},${v},${v})`); g.addColorStop(1, 'rgba(200,200,200,0)');
      x.fillStyle = g; x.beginPath(); x.arc(px + ox, py + oy, rad, 0, 7); x.fill();
    }
  }
  x.strokeStyle = 'rgba(150,150,150,0.6)'; x.lineWidth = 1;
  for (let i = 0; i < 14; i++) { // creases
    let px = r() * N, py = r() * N; x.beginPath(); x.moveTo(px, py);
    for (let k = 0; k < 4; k++) { px += (r() - 0.5) * 22; py += (r() - 0.5) * 22; x.lineTo(px, py); }
    x.stroke();
  }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 2);
  return t;
}
const BLUSH_TEX = blushTexture(), SHADOW_TEX = shadowTexture(), PAD_TEX = padTexture();

function ellipsoid(cat, parent, pos, scl, o = {}) {
  const m = furMesh(cat, o.geo || sphereGeo, o);
  m.position.set(...pos); m.scale.set(...scl);
  m.material.uniforms.uScale.value.set(...scl);
  if (o.rot) m.rotation.set(...o.rot);
  parent.add(m);
  return m;
}

function buildCat(cat) {
  const root = new THREE.Group();
  const w = cat.w, L = cat.legs;
  const body = [];
  const add = (pos, scl, o) => { const m = ellipsoid(cat, root, pos, scl, o); body.push(m); return m; };

  // body: cat faces -z, its rear toward the default camera at +z
  const cols = []; // ellipsoids the tail must slide over instead of passing through
  const col = (m) => { cols.push({ c: m.position.clone(), r: m.scale.clone() }); return m; };
  col(add([0, 0.56 * L, -0.25], [0.56 * w, 0.5, 0.85], { w: 1, stripe: [0, 0, 1, 15] }));
  col(add([0, 0.55 * L, 0.3], [0.5 * w, 0.47, 0.4], { w: 1, stripe: [0, 1, 0.2, 14] }));
  const hind = [], front = []; // per side: meshes that lift together when the cat treads / kneads
  const proxies = []; // hit volumes for parts not in `body`
  for (const s of [-1, 1]) {
    col(add([s * 0.3 * w, 0.46 * L, 0.3], [0.33 * w, 0.41, 0.4], { w: 1, stripe: [0, 1, 0.3, 16] }));
    const leg = col(add([s * 0.33 * w, 0.17, 0.46], [0.13, 0.17 * L, 0.13], { w: 0.5, plant: 1, stripe: [0, 1, 0, 30] }));
    // hind foot, toes forward (-z). Like a real cat the beans are on the sole, facing the floor: a three-lobed
    // main pad at the heel side and four oval toe beans in an arc. They show when the paw lifts and flips back.
    const PA = [0.125, 0.085, 0.165];
    const foot = new THREE.Group(); foot.position.set(s * 0.36 * w, PA[1], 0.5); root.add(foot);
    const sole = ellipsoid(cat, foot, [0, 0, 0], PA, { w: 0, len: 0.6, col: cat.colW, bald: [[0, -0.08, 0.04, 0.075], [0, -0.06, -0.085, 0.07]] });
    cols.push({ c: foot.position.clone(), r: new THREE.Vector3(...PA) });
    proxies.push([foot.position.clone(), new THREE.Vector3(...PA)]);
    const hp = new THREE.Group(); foot.add(hp); // hind beans, tucked away while the foot is planted
    const beanM = std(cat.bean, 0.55, { map: PAD_TEX, bumpMap: PAD_TEX, bumpScale: 1.2, clearcoat: 0.25, clearcoatRoughness: 0.45, sheen: 0.4, sheenColor: new THREE.Color(cat.bean).lerp(new THREE.Color('#ffffff'), 0.5) });
    const onSole = (x, z, sx, sz, th = 0.02) => { // pad bulging out of the sole at (x, z), tilted to the surface
      const y = -PA[1] * Math.sqrt(Math.max(0.02, 1 - (x / PA[0]) ** 2 - (z / PA[2]) ** 2));
      const n = new THREE.Vector3(x / PA[0] ** 2, y / PA[1] ** 2, z / PA[2] ** 2).normalize();
      const m = new THREE.Mesh(sphereGeo, beanM); m.scale.set(sx, th, sz);
      m.position.set(x, y, z).addScaledVector(n, th * 0.55); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), n);
      hp.add(m); return m;
    };
    onSole(0, 0.035, 0.078, 0.056, 0.03); // main pad body …
    for (const lx of [-0.035, 0, 0.035]) onSole(lx * 1.25, 0.08, 0.032, 0.028, 0.026); // … and its three heel-side lobes
    const toes = [[-0.06, -0.062], [-0.021, -0.09], [0.021, -0.09], [0.06, -0.062]].map(([x, z]) => {
      const m = onSole(x, z, 0.032, 0.036, 0.028); return { m, x, z, p: m.position.clone() };
    });
    hind.push({ leg, ly: leg.position.y, foot, rest: foot.position.clone(), ankle: [PA[1], leg.position.z - foot.position.z], toes, sole, hp });
    const fleg = col(add([s * 0.17 * w, 0.27 * L, -0.96], [0.1, 0.25 * L, 0.11], { w: 0, stripe: [0, 1, 0, 30] }));
    const paw = add([s * 0.17 * w, 0.06, -1.02], [0.1, 0.065, 0.16], { w: 0, len: 0.6, col: cat.id === 'orange' ? cat.colW : null, bald: [[0, -0.06, 0.05, 0.085], [0, -0.055, -0.06, 0.08]] });
    // front-paw beans live on the sole like the hind ones; they only show when the paw lifts and tips toward you
    const FP = [0.1, 0.065, 0.16], pg = new THREE.Group(); pg.position.copy(paw.position); root.add(pg);
    const fbeanM = std(cat.bean, 0.5, { map: PAD_TEX, bumpMap: PAD_TEX, bumpScale: 1.2, clearcoat: 0.3, clearcoatRoughness: 0.4, sheen: 0.4, sheenColor: new THREE.Color(cat.bean).lerp(new THREE.Color('#ffffff'), 0.5) });
    const onFSole = (x, z, sx, sz, th) => {
      const y = -FP[1] * Math.sqrt(Math.max(0.02, 1 - (x / FP[0]) ** 2 - (z / FP[2]) ** 2));
      const n = new THREE.Vector3(x / FP[0] ** 2, y / FP[1] ** 2, z / FP[2] ** 2).normalize();
      const m = new THREE.Mesh(sphereGeo, fbeanM); m.scale.set(sx, th, sz);
      m.position.set(x, y, z).addScaledVector(n, th * 0.55); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), n);
      pg.add(m); return m;
    };
    onFSole(0, 0.062, 0.078, 0.062, 0.034); // palm pad
    for (const lx of [-0.045, 0, 0.045]) onFSole(lx * 1.1, 0.118, 0.032, 0.026, 0.028); // heel lobes
    for (const [x, z] of [[-0.066, -0.04], [-0.024, -0.078], [0.024, -0.078], [0.066, -0.04]]) onFSole(x, z, 0.032, 0.036, 0.03); // toe beans: kept under the paw so the front stays furry
    paw.userData.pg = pg;
    front.push([fleg, paw, pg].map((m) => ({ m, y: m.position.y, z: m.position.z })));
  }
  col(add([0, 0.8 * L, -0.8], [0.36 * w, 0.4, 0.32], { w: 0, tw: 1, stripe: [0, 1, 0, 18] }));

  // tail: chain of furry beads, driven by springs each frame
  const tail = [];
  for (let i = 0; i < cat.tail.n; i++) {
    const r = lerp(cat.tail.r0, cat.tail.r1, i / (cat.tail.n - 1));
    const m = ellipsoid(cat, root, [0, 0, 0], [r, r, r * 1.6], { geo: beadGeo, w: 0, len: 1.15, shellMul: 0.8, stripe: [0, 0, 0, 0], stripeAmt: 0 });
    if (cat.id === 'orange' && i % 4 >= 2) m.material.uniforms.uColA.value.set(cat.colB).lerp(new THREE.Color(cat.colA), 0.35);
    if (cat.id === 'orange' && i >= cat.tail.n - 2) m.material.uniforms.uColA.value.set(cat.colB);
    tail.push({ m, r, p: 0, y: 0, vp: 0, vy: 0 });
  }

  // head sits at the front of the body; it is modelled facing +z and turned to face forward (-z) at rest
  const neck = new THREE.Group(); neck.position.set(0, 1.16 * L, -1.0); root.add(neck);
  const head = new THREE.Group(); head.scale.setScalar(1.2); neck.add(head);
  const hw = cat.headW;
  const eyeX = 0.135 * hw, eyeY = 0.035, eyeZ = 0.3;
  const baldEyes = [[-eyeX, eyeY, eyeZ - 0.02, 0.072], [eyeX, eyeY, eyeZ - 0.02, 0.072], [0, -0.07, 0.34, 0.06]];
  const fur = [];
  const hadd = (pos, scl, o = {}) => {
    const bald = baldEyes.map(([x, y, z, r]) => [x - pos[0], y - pos[1], z - pos[2], r]);
    const m = ellipsoid(cat, head, pos, scl, { bald, ...o }); fur.push(m); return m;
  };
  hadd([0, 0, 0], [0.4 * hw, 0.35, 0.36], { len: 0.65, stripe: [1, 0, 0, 40], stripeAmt: 0.8 });
  for (const s of [-1, 1]) hadd([s * 0.17 * hw, -0.09, 0.09], [0.22 * hw, 0.17, 0.2], { len: cat.id === 'orange' ? 1.25 : 0.8 });
  for (const s of [-1, 1]) hadd([s * 0.062, -0.105, 0.29], [0.085, 0.07, 0.07], { len: 0.35, col: cat.colW, density: 1.6 });
  hadd([0, -0.18, 0.24], [0.08, 0.05, 0.07], { len: 0.35, col: cat.colW, density: 1.6 });

  // ears
  const ears = [];
  const coneGeo = new THREE.ConeGeometry(0.15, 0.3, 24, 4);
  for (const s of [-1, 1]) {
    const ear = new THREE.Group(); ear.position.set(s * 0.2 * hw, 0.22, -0.02); ear.rotation.set(-0.15, 0, -s * 0.32);
    head.add(ear);
    const outer = furMesh(cat, coneGeo, { w: 0, len: 0.4, stripe: [0, 0, 0, 0], stripeAmt: 0 });
    outer.position.y = 0.11; outer.scale.set(1, 1, 0.5); outer.material.uniforms.uScale.value.set(1, 1, 0.5);
    ear.add(outer);
    const inner = new THREE.Mesh(coneGeo, std(cat.id === 'orange' ? '#f6b1a6' : '#6e5560', 0.7));
    inner.position.set(0, 0.1, 0.045); inner.scale.set(0.72, 0.82, 0.3); ear.add(inner);
    ears.push(ear);
  }

  // eyes + lids
  const eyeTex = eyeTexture(cat);
  const eyeMat = std('#ffffff', 0.12, { map: eyeTex, clearcoat: 1, clearcoatRoughness: 0.05 });
  // the eye sits almost flush in the face (flattened along its view axis) with an upper and a lower lid,
  // each edged by a dark lash line: closing makes an almond slit, not a furry ball over a bulging eye
  const upGeo = furGeometry(new THREE.SphereGeometry(1, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), 4);
  const loGeo = furGeometry(new THREE.SphereGeometry(1, 32, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), 4);
  const lashPts = []; for (let a = -1.45; a <= 1.4501; a += 0.145) lashPts.push(new THREE.Vector3(Math.sin(a), 0, Math.cos(a)));
  const lashGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(lashPts), 24, 0.075, 6);
  const lashMat = new THREE.MeshBasicMaterial({ color: cat.id === 'orange' ? '#3a1d0e' : '#020203' });
  const eyes = [], lids = [];
  for (const s of [-1, 1]) {
    const eg = new THREE.Group(); eg.position.set(s * eyeX, eyeY, eyeZ + 0.02); eg.rotation.set(0, s * 0.28, s * 0.14);
    eg.scale.set(1, 1, 0.62); head.add(eg);
    const ball = new THREE.Mesh(sphereGeo, eyeMat); ball.scale.set(0.075, 0.075, 0.058); eg.add(ball);
    const hl = new THREE.Mesh(sphereGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    hl.scale.setScalar(0.017); hl.position.set(-0.024, 0.026, 0.05); eg.add(hl);
    const hl2 = hl.clone(); hl2.scale.setScalar(0.008); hl2.position.set(0.02, -0.022, 0.054); eg.add(hl2);
    const pair = [];
    for (const [geo, rad, lw] of [[upGeo, 0.079, 1], [loGeo, 0.0775, 0.6]]) {
      const pv = new THREE.Group(); eg.add(pv);
      const lid = new THREE.Mesh(geo, furMaterial(cat, { w: 0, len: 0.22, stripeAmt: 0 }));
      lid.frustumCulled = false; lid.scale.set(rad, rad, rad * 0.8); lid.material.uniforms.uScale.value.set(rad, rad, rad * 0.8);
      lid.material.uniforms.uRootDark.value = lerp(cat.fur.rootDark, 1, 0.45); // match the short fur around the eye, not a lighter disc
      lid.material.uniforms.uSpec.value *= 0.2; lid.material.uniforms.uRimAmt.value *= 0.4; // a matte lid, not a glossy bead
      const lash = new THREE.Mesh(lashGeo, lashMat); lash.scale.set(rad * 1.02, rad * lw, rad * 0.83);
      pv.add(lid, lash); pair.push(pv);
    }
    eyes.push(eg); lids.push(pair);
  }

  // nose, mouth, whiskers, blush
  const nose = new THREE.Mesh(sphereGeo, std(cat.nose, 0.35, { clearcoat: 0.6 }));
  nose.scale.set(0.036, 0.022, 0.022); nose.position.set(0, -0.05, 0.352); head.add(nose);
  const mouthMat = new THREE.MeshBasicMaterial({ color: cat.id === 'orange' ? '#5a2a14' : '#120f16' });
  for (const s of [-1, 1]) {
    const c = new THREE.CatmullRomCurve3([[0, -0.072, 0.352], [s * 0.025, -0.105, 0.35], [s * 0.055, -0.093, 0.338]].map((p) => new THREE.Vector3(...p)));
    head.add(new THREE.Mesh(new THREE.TubeGeometry(c, 12, 0.0055, 6), mouthMat));
  }
  const mouth = new THREE.Mesh(sphereGeo, std('#a3384a', 0.6)); mouth.scale.set(0.04, 0.001, 0.02); mouth.position.set(0, -0.12, 0.33); head.add(mouth);
  const whiskerMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
  const whiskers = new THREE.Group(); head.add(whiskers);
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
    const y0 = -0.095 - i * 0.018, ang = (i - 1) * 0.16;
    const pts = [[s * 0.1, y0, 0.32], [s * 0.26, y0 + Math.sin(ang) * 0.08 + 0.01, 0.31], [s * 0.42, y0 + Math.sin(ang) * 0.16 - 0.03, 0.26]];
    whiskers.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), 10, 0.0032, 4), whiskerMat));
  }
  const blushes = [];
  for (const s of [-1, 1]) {
    const b = new THREE.Mesh(new THREE.CircleGeometry(0.075, 24), new THREE.MeshBasicMaterial({ map: BLUSH_TEX, transparent: true, opacity: 0, depthWrite: false }));
    b.position.set(s * 0.19 * hw, -0.06, 0.33); b.rotation.y = s * 0.45; b.renderOrder = 5; head.add(b); blushes.push(b);
  }

  // floor shadow
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: SHADOW_TEX, transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.set(0, 0.002, -0.15); shadow.scale.set(2.0 * w, 2.9, 1); root.add(shadow);

  // invisible hit proxies at rest shape
  const proxyMat = new THREE.MeshBasicMaterial({ visible: false });
  const buttProxy = new THREE.Group(); root.add(buttProxy);
  for (const [c, r] of body.map((m) => [m.position, m.scale]).concat(proxies)) {
    const p = new THREE.Mesh(sphereGeo, proxyMat); p.position.copy(c); p.scale.copy(r).multiplyScalar(1.2); buttProxy.add(p);
  }
  const headProxy = new THREE.Mesh(sphereGeo, proxyMat); headProxy.scale.set(0.5 * hw, 0.5, 0.45); head.add(headProxy);

  return { cat, root, body, tail, neck, head, ears, eyes, lids, mouth, whiskers, blushes, shadow, buttProxy, headProxy, hind, front, cols,
    neckBase: neck.position.clone(), tailBase: new THREE.Vector3(0, 0.66 * L, 0.66) };
}

// ───────────────────────── springs / state ─────────────────────────
class Spring {
  constructor(k, c, x = 0) { this.k = k; this.c = c; this.x = x; this.v = 0; this.t = x; }
  step(dt) { this.v += (-this.k * (this.x - this.t) - this.c * this.v) * dt; this.x += this.v * dt; }
}

function makeState(cat) {
  const { k, c } = cat.spring;
  return {
    squash: new Spring(k, c), shX: new Spring(k * 1.4, c * 0.9), shZ: new Spring(k * 1.4, c * 0.9),
    dent: new Spring(420, 15), rip: 0, ripPhase: 0,
    lift: new Spring(30, 8), tailUp: new Spring(cat.id === 'orange' ? 26 : 70, cat.id === 'orange' ? 6 : 9),
    bob: new Spring(160, 9), tilt: new Spring(90, 7),
    hy: new Spring(cat.look.k, cat.look.c), lookUntil: -9, lookSide: 1, // head yaw away from "facing forward"
    step: new Spring(40, 10), stepPh: 0, kneadPh: 0, // hind-paw treading / front-paw kneading at the peak
    lid: new Spring(140, 16, cat.lidRest), earL: new Spring(220, 9), earR: new Spring(220, 9),
    mouth: new Spring(240, 18), pop: new Spring(160, 11, 1),
    puff: 0, pf: 0, // startle size of the last slap (big when calm, small once it is enjoying it); pf = shown
    blush: 0, heat: 0, happy: 0, lastTap: -9, lastPet: -9, purrGlow: 0, blinkAt: 2, tailSway: 0, breath: 0,
    hit: new THREE.Vector3(0, 0.6, 0.65),
  };
}

const rigs = CATS.map(buildCat);
rigs.forEach((r) => { r.root.visible = false; scene.add(r.root); });
let ci = 0, rig = rigs[0], S = makeState(rig.cat);

// mirror of the shader deform, for things that hang off the body (tail base)
function deformPoint(p, w) {
  const v = p.clone();
  const wz = w * THREE.MathUtils.smoothstep(v.z, -0.8, 0.45);
  v.y *= 1 - G.uSquash.value * wz;
  v.x *= 1 + 0.55 * G.uSquash.value * wz;
  v.z = 0.25 + (v.z - 0.25) * (1 + 0.3 * G.uSquash.value * wz);
  v.x += G.uShear.value.x * Math.max(v.y, 0) * wz; v.z += G.uShear.value.y * Math.max(v.y, 0) * wz;
  const ss = THREE.MathUtils.smoothstep;
  v.x += G.uShake.value * w * Math.max(v.y - 0.08, 0);
  v.x += G.uTwist.value * 0.34 * (1 - ss(v.z, -1.0, 0.15)) * ss(v.y, 0.1, 0.75);
  const a = G.uLift.value * wz, qy = v.y, qz = v.z + 0.75;
  v.y = qy * Math.cos(a) + qz * Math.sin(a); v.z = -0.75 - qy * Math.sin(a) + qz * Math.cos(a);
  return v;
}

// on narrow phones a head turned back over the shoulder can leave the frame: slide the camera sideways
// (no rotation, no zoom) just far enough to keep the whole face on screen, and drift back when it turns away
const _hv = new THREE.Vector3(), _right = new THREE.Vector3();
let pan = 0;
function keepFaceInFrame(dt) {
  camera.updateMatrixWorld();
  const c = rig.head.getWorldPosition(_hv), dist = c.distanceTo(camera.position);
  c.project(camera);
  const halfW = dist * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * camera.aspect;
  const lim = 1 - (0.62 * rig.cat.headW) / halfW - 0.03; // head + cheek fur + ears, in NDC
  const want = (Math.max(0, c.x - lim) - Math.max(0, -lim - c.x)) * halfW;
  pan += (want - pan) * (1 - Math.exp(-dt * 6));
  _right.setFromMatrixColumn(camera.matrixWorld, 0);
  camera.position.addScaledVector(_right, pan);
  camera.updateMatrixWorld();
}

let T = 0;
function update(dt) {
  T += dt;
  const cat = rig.cat;
  S.heat = Math.max(0, S.heat - dt * (T - S.lastTap < 0.9 ? 0.4 : 2.2));
  const h = S.heat;
  // fixed ~4 ms substeps: the same motion at 30, 60 or 120 fps
  const ns = Math.max(1, Math.ceil(dt * 240 - 1e-6));
  for (const sp of [S.squash, S.shX, S.shZ, S.dent, S.lift, S.tailUp, S.bob, S.tilt, S.hy, S.step, S.lid, S.earL, S.earR, S.mouth, S.pop]) {
    for (let i = 0; i < ns; i++) sp.step(dt / ns);
  }
  if (combo && performance.now() / 1000 - lastTapAt > 1.2) endCombo();
  S.rip *= Math.exp(-dt * 3.2); S.ripPhase += dt * 34;
  S.blush = Math.max(0, S.blush - dt * 0.35);

  // mood targets: the more (and faster) you pat, the further it goes —
  // look back → squint → elevator butt + tail straight up and quivering → treading hind paws + kneading
  const petting = T - S.lastPet < 1.2;
  S.happy = clamp((h - 2.5) / 3, 0, 1);
  S.lift.t = clamp((h - 1.5) / 5, 0, 1) * 0.34;
  S.step.t = clamp((h - 5) / 3, 0, 1);
  S.stepPh += dt * Math.PI * 2 * (cat.id === 'orange' ? 2.1 : 2.8);
  S.kneadPh += dt * Math.PI * 2 * (cat.id === 'orange' ? 1.5 : 2.0);
  const sleepyLid = cat.lidRest;
  let lidT = lerp(sleepyLid, 0.87, Math.max(S.happy, petting ? 1 : 0)); // 0.87 ≈ blissful slits, not closed
  if (T > S.blinkAt) { lidT = 1.05; if (T > S.blinkAt + 0.12) S.blinkAt = T + rnd(2.2, 5.5); }
  S.lid.t = lidT;
  // head: faces forward at rest; after a pat it turns back over the shoulder toward you (the camera)
  if (T < S.lookUntil || (S.happy > 0.6 && T - S.lastTap < 1.6)) {
    const nk = rig.neck.position, az = Math.atan2(camera.position.x - nk.x, camera.position.z - nk.z);
    let d = Math.atan2(Math.sin(az - Math.PI), Math.cos(az - Math.PI)); // wrap to (-π, π]
    // camera (nearly) behind the cat: commit to one shoulder instead of flipping between them
    if (Math.abs(d) > 2.3) d = (S.hy.t !== 0 && Math.abs(S.hy.t) > 1 ? Math.sign(S.hy.t) : Math.abs(d) > 3.0 ? S.lookSide : Math.sign(d)) * 2.45;
    S.hy.t = clamp(d, -2.45, 2.45);
  } else S.hy.t = 0.12 * Math.sin(T * 0.37);
  S.tailUp.t = clamp(h / 4, 0, 1);
  S.tailSway += dt * (cat.id === 'orange' ? 1.4 : 2.6) * (1 + h * 0.3);
  // background purr: swells slowly (~5 s to full) while you keep patting, fades slowly (~8 s) after you stop
  const touched = T - Math.max(S.lastTap, S.lastPet) < 1.2;
  S.purrGlow = clamp(S.purrGlow + (touched ? dt * 0.2 : -dt * 0.12), 0, 1);
  audio.setPurr(S.purrGlow);
  // camera: drag inertia, then drift back to the butt view once left alone
  if (!dragging) {
    orbit.az += orbit.v * dt; orbit.v *= Math.exp(-dt * 4);
    if (T - orbit.lastDrag > 6) {
      const home = Math.round(orbit.az / (Math.PI * 2)) * Math.PI * 2;
      const k = 1 - Math.exp(-dt * 1.1);
      orbit.az += (home - orbit.az) * k; orbit.el -= orbit.el * k; orbit.zoom += (1 - orbit.zoom) * k;
    }
  }
  placeCamera(camera, orbit.az, orbit.el, orbit.zoom);
  keepFaceInFrame(dt);
  if (T - S.lastTap < 1.5 || petting) playT += dt;
  if (!wrapped && playT >= WRAP_S) wrapUp();
}

// soft limit: linear for small motion, eases into a hard ceiling — the body can never invert or sink
const eyeTmp = new THREE.Vector3();
let eyeCam = null; // camera the eyes look into (null = the live view)
const soft = (x, lo, hi) => (x >= 0 ? hi * Math.tanh(x / hi) : lo * Math.tanh(x / lo));

function applyState(dt = 1 / 60) {
  const cat = rig.cat;
  G.uSquash.value = soft(S.squash.x, 0.16, 0.3);
  G.uShear.value.set(soft(S.shX.x, 0.2, 0.2), soft(S.shZ.x, 0.2, 0.2));
  G.uLift.value = S.lift.x;
  if (S.lift.x > 0.17 && !document.body.dataset.buttUp) document.body.dataset.buttUp = '1'; // first butt-raise: site.js may show the tip hint
  G.uHit.value.set(S.hit.x, S.hit.y, S.hit.z, S.dent.x);
  G.uRip.value.set(S.rip, S.ripPhase);
  G.uWind.value.set(soft(-S.shX.v * 0.02, 0.06, 0.06), soft(S.squash.v * 0.015, 0.06, 0.06), soft(-S.shZ.v * 0.02, 0.06, 0.06));
  G.uTime.value = T;

  // breathing: while purring the chest swells in step with the actual breath cycle being played
  const ph = audio.breathPhase();
  const br = ph >= 0 ? (0.5 - 0.5 * Math.cos(ph * Math.PI * 2)) * 0.026 - 0.008 : Math.sin(T * (cat.id === 'orange' ? 1.6 : 2.2)) * 0.012;
  S.breath = br;
  rig.root.scale.set(1 + br * 0.5, 1 + br, 1).multiplyScalar(1 + soft(S.pop.x - 1, 0.14, 0.1));

  // startle → shake it off → fur smooths back from head to tail, like a hand stroking it flat
  const since = T - S.lastTap;
  if (since > 1.6) S.puff = 0;
  S.pf += (S.puff - S.pf) * (1 - Math.exp(-dt * 22));
  const shk = since > 0.3 && since < 0.85 ? Math.sin(((since - 0.3) / 0.55) * Math.PI) * S.pf : 0;
  const ang = (since - 0.3) * Math.PI * 2 * 8.5;
  G.uShake.value = Math.sin(ang) * shk * 0.1;
  const wave = clamp((since - 0.8) / 0.75, 0, 1);
  G.uPuff.value.set(S.pf * (rig.cat.puff ?? 1), wave > 0 ? lerp(-1.9, 2.3, wave) : -9);

  // head + neck: turning back bends the neck toward that shoulder and twists the chest with it
  const turn = clamp(S.hy.x / 2.45, -1, 1), side = -Math.sign(turn) * Math.abs(turn) ** 0.8; // +1 = over the cat's left (+x)
  G.uTwist.value = side * 0.75;
  const nb = rig.neckBase.clone();
  nb.x += side * 0.12; nb.z += Math.abs(side) * 0.16; nb.y -= Math.abs(side) * 0.05;
  rig.neck.position.copy(deformPoint(nb, 1));
  const bob = soft(S.bob.x, 0.08, 0.08), tilt = soft(S.tilt.x, 0.3, 0.3);
  rig.head.position.y = bob + Math.sin(T * 1.6) * 0.008;
  rig.head.rotation.set(-0.12 + bob * 1.2 - Math.abs(side) * 0.1, Math.PI + S.hy.x, tilt - side * 0.22 + Math.sin(T * 0.7) * 0.02 + Math.sin(ang - 0.7) * shk * 0.22);

  // treading hind paws (alternate, toe beans flash) + front paws kneading
  const st = S.step.x;
  rig.hind.forEach((h, k) => {
    // a real treading step: the leg lifts, the paw hangs from the ankle heel-up with its sole flipped back
    // toward you, toe beans spreading; pressing down closes them again
    const s = Math.max(0, Math.sin(S.stepPh + k * Math.PI)) * st, s2 = s * s * (3 - 2 * s);
    const a = 1.35 * s2, lift = 0.07 * s2, [ky, kz] = h.ankle, c = Math.cos(a), sn = Math.sin(a);
    h.foot.rotation.x = -a;
    h.foot.position.set(h.rest.x, h.rest.y + lift + ky - (ky * c + kz * sn), h.rest.z + kz - (-ky * sn + kz * c));
    h.leg.position.y = h.ly + lift;
    const spread = 1 + 0.22 * s2;
    h.hp.scale.setScalar(THREE.MathUtils.smoothstep(s2, 0.12, 0.5) * 0.999 + 0.001); // no pink peeking out under a planted foot
    h.toes.forEach((t) => { t.m.position.x = t.p.x * spread; t.m.position.z = t.p.z - 0.012 * s2; t.m.rotation.y = t.x * 3 * s2; });
  });
  rig.front.forEach((leg, k) => {
    const up = Math.max(0, Math.sin(S.kneadPh + k * Math.PI)) * 0.06 * st;
    leg.forEach((o) => { o.m.position.y = o.y + up; o.m.position.z = o.z - up * 0.5; });
    // kneading: the raised paw tips sole-toward-you so the beans show, then presses back down
    const f = Math.min(1, up / 0.06), a = 1.5 * f * f * (3 - 2 * f);
    leg[1].m.rotation.x = -a; leg[2].m.rotation.x = -a;
    leg[2].m.scale.setScalar(THREE.MathUtils.smoothstep(f, 0.12, 0.5) * 0.999 + 0.001); // beans stay tucked inside the paw until it lifts
  });
  // lid closure 0 = wide open … 1 = shut; the lids' front edges meet a little below centre
  const lc = clamp(S.lid.x, 0, 1);
  const yu = lerp(0.85, -0.5, lc), yl = lerp(-0.8, -0.5, THREE.MathUtils.smoothstep(lc, 0.45, 1));
  rig.lids.forEach(([up, lo]) => { up.rotation.x = Math.asin(-yu); lo.rotation.x = Math.asin(-Math.min(yl, yu)); });
  rig.eyes.forEach((e) => {
    e.children[1].visible = e.children[2].visible = lc < 0.72; // no glints on a narrowed lid
    // the eyeball turns to meet your eye (the camera), within what an eye socket allows; the glints stay put
    const b = e.children[0], v = e.worldToLocal(eyeTmp.copy((eyeCam || camera).position));
    v.z *= 0.62; // undo the socket's flattening so the angles are true
    const front = v.z > 0 ? 1 : 0, k = 1 - Math.exp(-dt * 14);
    b.rotation.y += (front * clamp(Math.atan2(v.x, v.z), -0.42, 0.42) - b.rotation.y) * k;
    b.rotation.x += (front * clamp(-Math.atan2(v.y, Math.hypot(v.x, v.z)), -0.3, 0.3) - b.rotation.x) * k;
  });
  const eL = soft(S.earL.x, 0.5, 0.45), eR = soft(S.earR.x, 0.5, 0.45);
  rig.ears[0].rotation.x = -0.15 - eL; rig.ears[1].rotation.x = -0.15 - eR;
  rig.ears[0].rotation.z = 0.32 + eL * 0.4; rig.ears[1].rotation.z = -0.32 - eR * 0.4;
  rig.mouth.scale.y = Math.max(0.001, S.mouth.x * 0.03);
  rig.whiskers.rotation.x = bob * 0.8;
  rig.blushes.forEach((b) => { b.material.opacity = clamp(S.blush, 0, 0.85); });
  rig.shadow.scale.set(2.0 * cat.w * (1 + G.uSquash.value * 0.4), 2.9 * (1 - S.lift.x * 0.4), 1);

  // tail chain with follow-through
  const tc = cat.tail, up = clamp(S.tailUp.x, -0.15, 1.12), n = tc.n; // springy, but never extrapolate the pose
  let p = deformPoint(rig.tailBase, 1);
  const seg = tc.len / n;
  const quiver = clamp((S.heat - 3) / 4, 0, 1) * clamp(up, 0, 1); // excited cats vibrate a raised tail
  const furPad = cat.fur.len * 0.8;
  const cols = rig.cols.map((o) => ({ c: deformPoint(o.c, 1), r: o.r }));
  const u = new THREE.Vector3();
  const ts = Math.max(1, Math.ceil(dt * 240 - 1e-6)), th = dt / ts;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), b = rig.tail[i];
    const rest = tc.rest, hi = tc.up;
    const tip = THREE.MathUtils.smoothstep(t, 0.6, 1) * quiver; // …strongest in the last third: the tip shivers
    const tp = lerp(rest[0], hi[0], up) + lerp(rest[1], hi[1], up) * t * t + Math.sin(T * 47 + i * 0.7) * 0.03 * quiver * t + Math.sin(T * 78 + i * 1.3) * 0.09 * tip;
    const sway = Math.sin(S.tailSway - i * 0.45) * (0.12 + up * 0.18) * t + Math.sin(T * 41 - i * 0.9) * 0.07 * quiver * t + Math.sin(T * 71 - i * 1.6) * 0.16 * tip;
    const ty = lerp(rest[2], hi[2], up) + lerp(rest[3], hi[3], up) * t + sway;
    const kk = 260 * (1 - t * 0.75), cc = 14 * (1 - t * 0.5);
    for (let s = 0; s < ts; s++) { // real elapsed time in fixed substeps, so 30/60/120 fps move the tail identically
      b.vp += (-kk * (b.p - tp) - cc * b.vp) * th; b.p += b.vp * th;
      if (b.p > 1.35) { b.p = 1.35; b.vp = Math.min(b.vp, 0); } // past vertical the tail would flip over the head
      b.vy += (-kk * (b.y - ty) - cc * b.vy) * th; b.y += b.vy * th;
    }
    const d = new THREE.Vector3(Math.sin(b.y) * Math.cos(b.p), Math.sin(b.p), Math.cos(b.y) * Math.cos(b.p));
    if (i > 0) {
      p = p.clone().addScaledVector(d, seg);
      // slide over the body instead of passing through it: push the bead out of every body ellipsoid
      const m = (b.r * 0.85 + furPad) * Math.min(1, i / 4); // the root grows out of the rump, so ease in
      for (const o of cols) {
        u.set((p.x - o.c.x) / (o.r.x + m), (p.y - o.c.y) / (o.r.y + m), (p.z - o.c.z) / (o.r.z + m));
        const l = u.length();
        if (l < 1 && l > 1e-4) { u.multiplyScalar(1 / l); p.set(o.c.x + u.x * (o.r.x + m), o.c.y + u.y * (o.r.y + m), o.c.z + u.z * (o.r.z + m)); }
      }
    }
    p.y = Math.max(p.y, b.r * 0.9);
    b.m.position.copy(p); b.m.quaternion.setFromUnitVectors(Z_AXIS, d);
  }
}

// ───────────────────────── audio ─────────────────────────
// Everything is a real recording. Each pat plays a real pat on Kun's own cat (from the video the promo opens
// with); now and then, every 5–6 pats (never closer than 2.5 s, however fast you pat), Kun's cat gives one short meow
// (Coal's is the same voice a little lower). The purr is the main sound: it swells slowly while you pat and
// fades slowly once you stop.
const audio = (() => {
  const AC = window.AudioContext || window.webkitAudioContext;
  const ctx = AC ? new AC() : null;
  const VOL = 0.9;
  let master, comp, purrBus, muted = false, buffers = {}, meow = null, lastMeow = '', lastPat = '', purr = null, curPurrLevel = 0;
  // iOS: play through the ringer/silent switch like a media player would
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* not supported */ }
  if (ctx) {
    comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.release.value = 0.2;
    master = ctx.createGain(); master.gain.value = VOL; master.connect(comp); comp.connect(ctx.destination);
    // phone speakers can't reproduce the ~25 Hz rumble: saturate the low band into harmonics and add them
    // back in the 300–900 Hz range, so the purr's flutter is still audible without headphones
    purrBus = ctx.createGain(); purrBus.connect(master);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 260;
    const sat = ctx.createWaveShaper(), curve = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) { const x = (i / 511.5 - 1) * 4; curve[i] = Math.tanh(x) * 0.8; }
    sat.curve = curve; sat.oversample = '2x';
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 520; bp.Q.value = 0.6;
    const mid = ctx.createGain(); mid.gain.value = 0.32;
    purrBus.connect(lp); lp.connect(sat); sat.connect(bp); bp.connect(mid); mid.connect(master);
  }
  const MEOWS = ['m1', 'm2', 'm3', 'm4'], PATS = ['p1', 'p2', 'p3', 'p4', 'p5'];

  async function load(name, url) {
    const r = await fetch(url); const ab = await r.arrayBuffer();
    buffers[name] = await new Promise((res, rej) => ctx.decodeAudioData(ab, res, rej));
  }
  const ready = ctx ? Promise.all([
    ...CATS.map((c) => load(c.id, c.purr)), ...[...MEOWS, ...PATS].map((m) => load(m, `audio/kun/${m}.mp3`)),
  ]).catch((e) => console.warn('audio', e)) : Promise.resolve();

  // The purr is never a loop. Each recording is cut into its real breath cycles (quiet inhale → loud exhale),
  // cut in the middle of the steady inhale. Cycles are re-sequenced at random with ±5 % tempo/pitch jitter,
  // the odd longer pause, and equal-power cross-fades, so the rhythm breathes and never repeats.
  const XF = 0.16, FADE_IN = new Float32Array(32), FADE_OUT = new Float32Array(32);
  for (let i = 0; i < 32; i++) { FADE_IN[i] = Math.sin((i / 31) * Math.PI / 2); FADE_OUT[i] = Math.cos((i / 31) * Math.PI / 2); }
  function startPurr(id) {
    if (!ctx || !buffers[id]) return;
    if (purr) stopPurr(0.08);
    const g = ctx.createGain(); g.gain.value = 0; g.connect(purrBus);
    const cuts = CATS.find((c) => c.id === id).cuts;
    purr = { g, id, cuts, next: ctx.currentTime + 0.05, last: -1, srcs: [], sched: [] }; curPurrLevel = 0;
  }
  function stopPurr(tc) {
    const t = ctx.currentTime, old = purr; purr = null;
    old.g.gain.cancelScheduledValues(t); old.g.gain.setTargetAtTime(0, t, tc);
    old.srcs.forEach((s) => { try { s.stop(t + tc * 6); } catch (e) { /* not started */ } });
  }
  function schedulePurr() {
    const P = purr, now = ctx.currentTime;
    if (P.next < now) P.next = now + 0.03;
    while (P.next < now + 0.8) {
      let k; do k = Math.floor(Math.random() * (P.cuts.length - 1)); while (k === P.last && P.cuts.length > 2);
      P.last = k;
      const a = P.cuts[k], b = P.cuts[k + 1];
      const rate = rnd(0.95, 1.05);
      const s = ctx.createBufferSource(); s.buffer = buffers[P.id]; s.playbackRate.value = rate;
      const e = ctx.createGain(), xf = XF / rate, dur = (b - a + XF) / rate, t0 = P.next - xf / 2;
      e.gain.setValueAtTime(0, 0);
      e.gain.setValueCurveAtTime(FADE_IN, Math.max(t0, now), xf);
      e.gain.setValueCurveAtTime(FADE_OUT, t0 + dur - xf, xf);
      s.connect(e); e.connect(P.g); s.start(Math.max(t0, now), a - XF / 2); s.stop(t0 + dur + 0.02);
      P.srcs.push(s); s.onended = () => { P.srcs = P.srcs.filter((x) => x !== s); };
      P.sched.push({ t: P.next, d: (b - a) / rate });
      if (P.sched.length > 4) P.sched.shift();
      P.next += (b - a) / rate + (Math.random() < 0.2 ? rnd(0.03, 0.08) : 0); // now and then a slightly longer breath
    }
  }
  // the first sound can land while the context is still waking up from that same touch: play it once it runs
  function whenRunning(fn) {
    if (!ctx || muted) return false;
    if (ctx.state !== 'running') { ctx.resume().then(() => { if (ctx.state === 'running' && !muted) fn(); }); return false; }
    return true;
  }

  return {
    ctx, ready,
    unlock() {
      if (!ctx) return;
      if (ctx.state !== 'running') ctx.resume();
      if (!purr || purr.id !== rig.cat.id) ready.then(() => { if (!purr || purr.id !== rig.cat.id) startPurr(rig.cat.id); });
    },
    switchCat() { if (ctx && purr) ready.then(() => startPurr(rig.cat.id)); },
    // level 0..1, already smoothed by the caller (slow rise while patting, slow fade after)
    setPurr(level) {
      if (!purr || muted || ctx.state !== 'running') return;
      schedulePurr();
      const target = level <= 0.01 ? 0 : level;
      if (Math.abs(target - curPurrLevel) > 0.01) { curPurrLevel = target; purr.g.gain.setTargetAtTime(target, ctx.currentTime, 0.15); }
    },
    // 0..1 position inside the breath cycle that is sounding right now (-1 when silent)
    breathPhase() {
      if (!purr || muted || curPurrLevel === 0) return -1;
      const t = ctx.currentTime, c = purr.sched.find((o) => t >= o.t && t < o.t + o.d);
      return c ? (t - c.t) / c.d : -1;
    },
    // one real pat sample on every pat; withMeow adds one short meow (it replaces a meow that is still sounding).
    // Returns how long the meow lasts (0 when none), for the mouth.
    pat(power, cat, withMeow) {
      if (!whenRunning(() => this.pat(power, cat, withMeow))) return 0;
      const t = ctx.currentTime;
      const pk = pick(PATS.filter((m) => m !== lastPat && buffers[m])); lastPat = pk;
      if (pk) {
        const s = ctx.createBufferSource(); s.buffer = buffers[pk]; s.playbackRate.value = rnd(0.94, 1.06);
        const g = ctx.createGain(); g.gain.value = 0.55 * power;
        s.connect(g); g.connect(master); s.start(t);
      }
      if (!withMeow) return 0;
      const m = pick(MEOWS.filter((x) => x !== lastMeow && buffers[x]));
      if (!m) return 0;
      if (meow) { const h = meow; h.g.gain.cancelScheduledValues(t); h.g.gain.setValueAtTime(h.g.gain.value, t); h.g.gain.linearRampToValueAtTime(0, t + 0.01); try { h.s.stop(t + 0.012); } catch (e) { /* ended */ } }
      lastMeow = m;
      const rate = cat.meow.rate * rnd(0.98, 1.02);
      const s = ctx.createBufferSource(); s.buffer = buffers[m]; s.playbackRate.value = rate;
      const mg = ctx.createGain(); mg.gain.value = cat.meow.gain;
      s.connect(mg); mg.connect(master); s.start(t + 0.03);
      meow = { s, g: mg }; s.onended = () => { if (meow && meow.s === s) meow = null; };
      return buffers[m].duration / rate;
    },
    setMuted(m) {
      muted = m; if (!ctx) return;
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t); master.gain.setTargetAtTime(m ? 0 : VOL, t, 0.012);
      if (m) {
        if (meow) { try { meow.s.stop(t + 0.06); } catch (e) { /* ended */ } meow = null; }
        if (purr) { const id = purr.id; stopPurr(0.012); startPurr(id); } // drop every queued breath: nothing replays on unmute
      }
    },
    get muted() { return muted; },
    recordStream() { const d = ctx.createMediaStreamDestination(); comp.connect(d); return d.stream; },
  };
})();

// ───────────────────────── haptics ─────────────────────────
const hapticSwitch = (() => {
  const l = document.createElement('label'); l.ariaHidden = 'true';
  l.style.cssText = 'position:fixed;left:-200px;top:0;opacity:0;pointer-events:none';
  const i = document.createElement('input'); i.type = 'checkbox'; i.setAttribute('switch', ''); i.tabIndex = -1;
  l.appendChild(i); document.body.appendChild(l); return l;
})();
function haptic(ms) {
  if (navigator.vibrate) navigator.vibrate(ms); else hapticSwitch.click(); // iOS 18+: switch toggle gives a tick
}

// ───────────────────────── fx / ui ─────────────────────────
const fx = $('#fx');
let taps = 0, combo = 0, lastTapAt = 0, firstTap = true, meowIn = 0, lastMeowAt = -99;
const stats = { down: 0, cancel: 0, slap: 0, pet: 0 };

function popText(x, y, txt, cls = '') {
  const el = document.createElement('div'); el.className = 'pop ' + cls; el.textContent = txt;
  el.style.left = x + 'px'; el.style.top = y + 'px';
  el.style.setProperty('--dx', rnd(-40, 40) + 'px'); el.style.setProperty('--rot', rnd(-18, 18) + 'deg');
  fx.appendChild(el); setTimeout(() => el.remove(), 1100);
}
function ring(x, y) {
  const el = document.createElement('div'); el.className = 'ring'; el.style.left = x + 'px'; el.style.top = y + 'px';
  fx.appendChild(el); setTimeout(() => el.remove(), 600);
}
function hearts(n) {
  const v = rig.head.getWorldPosition(new THREE.Vector3()).project(camera);
  const r = stage.getBoundingClientRect();
  for (let i = 0; i < n; i++) {
    setTimeout(() => popText((v.x * 0.5 + 0.5) * r.width + rnd(-50, 50), (-v.y * 0.5 + 0.5) * r.height - 60, pick(['❤', '💗', '♡']), 'heart'), i * 90);
  }
}
function setLine(t) { const m = $('#line'); m.textContent = t; m.classList.remove('flash'); void m.offsetWidth; m.classList.add('flash'); }
function bumpCount() {
  const c = $('#num'); c.textContent = taps; c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); setUnit();
  const cb = $('#combo');
  if (combo >= 3) { cb.textContent = TX().combo + combo; cb.classList.add('on'); cb.classList.remove('bump'); void cb.offsetWidth; cb.classList.add('bump'); }
}
// the streak badge only lives while the streak does
function endCombo() { combo = 0; $('#combo').classList.remove('on', 'bump'); }

const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();

function slap(px, py, hitPoint) {
  const cat = rig.cat, now = performance.now() / 1000;
  taps++; stats.slap++;
  const gap = now - lastTapAt;
  combo = gap < 0.75 ? combo + 1 : 1; lastTapAt = now;
  const pt = lerp(1, 0.4, S.happy); // fur puffs on impact; less once it is enjoying it
  S.puff = T - S.lastTap < 1.5 ? Math.max(S.puff * 0.9, pt) : pt;
  S.lastTap = T; S.heat = Math.min(S.heat + 1, 14);
  const p = clamp(0.75 + combo * 0.05, 0.75, 1.15);
  // local poke + body squash + jelly + tail flick
  if (hitPoint) S.hit.copy(hitPoint); else S.hit.set(rnd(-0.2, 0.2), 0.62, 0.68);
  S.dent.x = 0.085 * p; S.dent.v = REDUCE ? 0 : -0.9 * p; // C1: release springs the dent back past rest before it settles
  S.rip = 0.018 * p; S.ripPhase = 0;
  // every slap lands, but a body that is already squashed has less room left: impulses shrink with the
  // remaining headroom and velocities are capped, so rapid taps can't pump the springs into resonance
  const room = clamp(1 - Math.max(0, S.squash.x) / 0.45, 0.2, 1);
  S.squash.v = Math.min(S.squash.v + 4.2 * p * room, 4.5); S.squash.x = Math.max(S.squash.x, 0.05);
  const side = clamp(S.hit.x * 3, -1, 1);
  S.shX.v = clamp(S.shX.v + (side * 1.6 + rnd(-0.5, 0.5)) * p, -2.5, 2.5); S.shZ.v = clamp(S.shZ.v - 1.2 * p, -2.5, 2.5);
  S.tailUp.v = Math.min(S.tailUp.v + 5 * p, 6);
  const whip = taps % 2 ? 1 : -1; // tail whips side to side on alternate slaps
  rig.tail.forEach((b, i) => { const f = p * (i / rig.tail.length); b.vp = Math.min(b.vp + 1.5 * f, 4); b.vy = clamp(b.vy + whip * rnd(4, 6) * f, -8, 8); });
  S.lookSide = S.hit.x < 0 ? 1 : -1; // over the patted side's shoulder
  setTimeout(() => { S.lookUntil = T + cat.look.hold + (REDUCE ? 0 : 0.6); }, cat.look.delay); // "who touched my butt?" — turn and look back, and (C1) hold the stare ~0.6 s longer
  const react = () => {
    S.bob.v = Math.min(S.bob.v + 1.4 * p, 2.5); S.tilt.v = clamp(S.tilt.v + (Math.random() < 0.5 ? -1 : 1) * 2.2, -4, 4);
    S.earL.v = Math.min(S.earL.v + rnd(4, 8), 10); S.earR.v = Math.min(S.earR.v + rnd(4, 8), 10);
    S.blush = Math.min(1, S.blush + 0.35);
    S.pop.v = Math.min(S.pop.v + 0.6, 1.2);
  };
  cat.spring.delay ? setTimeout(react, cat.spring.delay) : react();

  // one short meow every 5–6 pats; at least 2.5 s apart, so patting faster never makes the cat meow faster
  const withMeow = --meowIn <= 0 && now - lastMeowAt >= 2.5;
  if (withMeow) { meowIn = 5 + (Math.random() < 0.5 ? 0 : 1); lastMeowAt = now; }
  const said = audio.pat(p * 0.8, cat, withMeow);
  haptic(combo > 5 ? 22 : 14);
  if (said) mouthOpen(said * 900);
  if (firstTap) { firstTap = false; $('#hint').classList.add('gone'); setLine(cat.lines.first); }
  else if (combo === 8 || combo === 20 || (combo > 20 && combo % 15 === 0)) hearts(5);
  else if (combo === 4) hearts(2);

  const P = TX().pop, words = combo < 4 ? P.soft : combo < 9 ? P.mid : P.big;
  // C1: on the first few pats the body speaks first — the pop word follows the rebound, the ring waits for a streak
  const fx1 = () => { popText(px, py - 20, pick(words), combo >= 9 ? 'big' : ''); if (combo >= 4 && !REDUCE) ring(px, py); };
  if (combo < 4 && !REDUCE) setTimeout(fx1, 160); else fx1();
  bumpCount();
  if (taps === 5 || taps === 15 || (taps > 15 && taps % 12 === 0)) setLine(pick(combo >= 8 ? cat.lines.high : cat.lines.mid));
}

// mouth opens for the meow (pats) or a silent "mrrp" (pets)
let mouthTimer = 0;
function mouthOpen(ms) { S.mouth.t = 1; clearTimeout(mouthTimer); mouthTimer = setTimeout(() => { S.mouth.t = 0; }, ms); }

function pet(face, px, py) {
  stats.pet++; $('#hint').classList.add('gone'); // petting is its own reaction; only slaps count toward "拍了 N 下"
  S.lastPet = T; S.heat = Math.min(S.heat + 0.6, 14); S.lookUntil = T + 1.4;
  S.tilt.v += face ? (Math.random() < 0.5 ? -3 : 3) : 0; S.bob.v -= face ? 0.3 : 1.2;
  S.earL.v -= 5; S.earR.v -= 5; S.blush = Math.min(1, S.blush + 0.5);
  if (Math.random() < 0.3) mouthOpen(200);
  haptic(8);
  popText(px, py - 20, pick(face ? TX().pop.face : TX().pop.pet), 'soft');
  if (Math.random() < 0.4) setLine(pick(rig.cat.lines.pet));
  hearts(1);
}

// A touch is only a slap/pet if it starts on the cat and lifts without sliding or pinching.
// The finger landing already dents the fur (instant feedback); the slap itself commits on release,
// so a drag that happens to start on the cat just turns the camera. Empty space never counts.
const touches = new Map();
let dragging = false;
function onDown(e) {
  e.preventDefault();
  stats.down++;
  audio.unlock();
  const r = canvas.getBoundingClientRect();
  const px = e.clientX - r.left, py = e.clientY - r.top;
  ndc.set((px / r.width) * 2 - 1, -(py / r.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const hh = raycaster.intersectObject(rig.headProxy, false)[0];
  const hb = hh ? null : raycaster.intersectObject(rig.buttProxy, true)[0];
  const target = hh ? { face: rig.head.worldToLocal(hh.point.clone()).y < 0.0 } : hb ? { point: hb.point.clone() } : null;
  if (hb) { // the fur gives under the fingertip, and the whole body sinks a little with it (C1: press in)
    S.hit.copy(hb.point); S.dent.x = Math.max(S.dent.x, REDUCE ? 0.035 : 0.06);
    if (!REDUCE) S.squash.x = Math.max(S.squash.x, 0.07);
  }
  const pinch = touches.size === 1; // second finger down: possible pinch, the first finger is no longer a tap
  touches.set(e.pointerId, { x0: e.clientX, y0: e.clientY, lx: e.clientX, ly: e.clientY, px, py, target, drag: false });
  if (pinch) { const [a, b] = [...touches.values()]; a.pinch0 = b.pinch0 = Math.hypot(a.lx - b.lx, a.ly - b.ly); }
  try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* synthetic or already released */ }
  if (DEBUG) $('#dbg').textContent = JSON.stringify(stats);
}
function onMove(e) {
  const g = touches.get(e.pointerId);
  if (!g) return;
  if (!g.drag && Math.hypot(e.clientX - g.x0, e.clientY - g.y0) > 10) { g.drag = true; $('#hint').classList.add('gone'); }
  if (touches.size === 2) { // pinch: dolly in for a close-up
    const [a, b] = [...touches.values()], o = a === g ? b : a;
    const d0 = Math.hypot(g.lx - o.lx, g.ly - o.ly), d1 = Math.hypot(e.clientX - o.lx, e.clientY - o.ly);
    if (Math.abs(d1 - (g.pinch0 || d1)) > 12) { a.drag = b.drag = a.pinched = b.pinched = true; }
    if (g.pinched && d0 > 20) { orbit.zoom = clamp(orbit.zoom * d0 / d1, 0.68, 1.2); orbit.lastDrag = T; }
  } else if (g.drag && touches.size === 1 && !g.pinched) {
    const dx = e.clientX - g.lx, dy = e.clientY - g.ly;
    orbit.az -= dx * 0.011; orbit.el = clamp(orbit.el + dy * 0.004, -0.3, 0.35);
    const now = performance.now(), de = Math.max(8, now - (g.lt || now - 16)) / 1000;
    orbit.v = lerp(orbit.v, (-dx * 0.011) / de, 0.5); orbit.lastDrag = T; dragging = true; g.lt = now;
  }
  g.lx = e.clientX; g.ly = e.clientY;
}
function onUp(e) {
  audio.unlock(); // iOS only lets a touch *end* start audio
  const g = touches.get(e.pointerId);
  touches.delete(e.pointerId);
  if (g && g.drag && performance.now() - (g.lt || 0) > 90) orbit.v = 0; // held still before letting go: no fling
  dragging = [...touches.values()].some((o) => o.drag);
  if (g && g.target && !g.drag) {
    if (g.target.point) slap(g.px, g.py, g.target.point); else pet(g.target.face, g.px, g.py);
  }
  if (DEBUG) $('#dbg').textContent = JSON.stringify(stats);
}
canvas.addEventListener('pointerdown', onDown, { passive: false });
canvas.addEventListener('pointermove', onMove);
// Plain wheel/trackpad scroll goes to the page (details below the cat); only a pinch (ctrl+wheel) zooms.
canvas.addEventListener('wheel', (e) => { if (!e.ctrlKey) return; e.preventDefault(); orbit.zoom = clamp(orbit.zoom * Math.exp(e.deltaY * 0.0015), 0.68, 1.2); orbit.lastDrag = T; }, { passive: false });
canvas.addEventListener('pointerup', onUp);
canvas.addEventListener('pointercancel', (e) => {
  stats.cancel++; touches.delete(e.pointerId); dragging = [...touches.values()].some((o) => o.drag);
  if (DEBUG) $('#dbg').textContent = JSON.stringify(stats);
});
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
if (DEBUG) $('#dbg').hidden = false;

// ───────────────────────── switching cats ─────────────────────────
function useCat(i) {
  ci = i; rigs.forEach((r, k) => { r.root.visible = k === i; });
  rig = rigs[i]; S = makeState(rig.cat); S.pop.x = 0.86; S.pop.v = 2.5;
  const c = rig.cat;
  document.documentElement.style.setProperty('--bg1', c.bg[0]);
  document.documentElement.style.setProperty('--bg2', c.bg[1]);
  document.documentElement.style.setProperty('--ink', c.ink);
  document.querySelectorAll('.chip').forEach((b, k) => b.classList.toggle('on', k === i));
  setLine(c.lines.idle);
  endCombo();
  setBackdrop();
  audio.switchCat();
}
document.querySelectorAll('.chip').forEach((b, k) => b.addEventListener('click', () => { audio.unlock(); if (k !== ci) useCat(k); }));
document.querySelectorAll('#lang [data-l]').forEach((s) => s.addEventListener('click', () => {
  if (s.dataset.l === lang) return;
  lang = s.dataset.l;
  try { localStorage.setItem('lang', lang); } catch (e) { /* private mode */ }
  applyLang(); setUnit(); setLine(rig.cat.lines.idle);
}));
// sound is on from the start (it sounds on the first pat, the earliest moment browsers allow); one button mutes it
let earTimer = setTimeout(() => $('#ear').classList.add('gone'), 6000);
$('#mute').addEventListener('click', () => {
  if (audio.muted) audio.unlock();
  audio.setMuted(!audio.muted);
  const m = audio.muted;
  $('#mute').classList.toggle('off', m);
  $('#mute span').textContent = m ? TX().soundOn : TX().soundOff;
  $('#ear').classList.remove('gone'); clearTimeout(earTimer);
  if (!m) earTimer = setTimeout(() => $('#ear').classList.add('gone'), 4500);
});

// ~30 s of play: a natural "done" moment you can share or simply walk away from
const WRAP_S = Number(new URLSearchParams(location.search).get('wrap')) || 30;
let playT = 0, wrapped = false;
function wrapUp() {
  wrapped = true;
  S.heat = Math.max(S.heat, 8); S.lastPet = T;
  hearts(6); mouthOpen(500);
  setLine(TX().wrap);
  const d = $('#done'); d.classList.add('on');
  $('#sharebtn').classList.add('glow');
  setTimeout(() => d.classList.remove('on'), 7000);
}
$('#done').addEventListener('click', () => { $('#done').classList.remove('on'); $('#sharebtn').click(); });

// ───────────────────────── share card ─────────────────────────
function feeling(n) {
  return TX().feel[n === 0 ? 0 : n === 1 ? 1 : n < 10 ? 2 : n < 40 ? 3 : n < 100 ? 4 : 5];
}

function renderCatImage(W, H, bgCanvas) {
  // pose the cat in a calm, happy "photo" pose regardless of what it was doing
  const save = { sq: G.uSquash.value, sh: G.uShear.value.clone(), lf: G.uLift.value, hit: G.uHit.value.clone(), rip: G.uRip.value.clone() };
  const saveS = S;
  // fixed "photo" pose: rear to camera, head turned back over the shoulder, eyes wide open and on you
  const cam = camera.clone(); placeCamera(cam, 0, 0); cam.aspect = W / H; cam.fov = 27; cam.updateProjectionMatrix();
  eyeCam = cam;
  S = makeState(rig.cat); S.lid.x = 0; S.hy.x = -2.45; S.blush = 0.55; S.tailUp.x = rig.cat.id === 'orange' ? 0 : 0.55; S.lift.x = 0.05;
  rig.tail.forEach((b) => { b.p = 0; b.y = 0; b.vp = 0; b.vy = 0; });
  for (let i = 0; i < 60; i++) applyState(); // let the tail settle
  G.uSquash.value = 0; G.uShear.value.set(0, 0); G.uHit.value.w = 0; G.uRip.value.set(0, 0); G.uLift.value = 0.05;
  const rt = new THREE.WebGLRenderTarget(W, H, { samples: 4 });
  rt.texture.colorSpace = THREE.SRGBColorSpace;
  const bgSave = scene.background, bgTex = new THREE.CanvasTexture(bgCanvas); bgTex.colorSpace = THREE.SRGBColorSpace;
  scene.background = bgTex;
  furGeoCache.forEach((g) => setShells(g, 1)); // the share card is a one-off frame: always full fur
  renderer.setRenderTarget(rt); renderer.render(scene, cam); renderer.setRenderTarget(null);
  furGeoCache.forEach((g) => setShells(g, TIERS[quality.tier].sh));
  scene.background = bgSave; bgTex.dispose();
  const px = new Uint8Array(W * H * 4); renderer.readRenderTargetPixels(rt, 0, 0, W, H, px); rt.dispose();
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const x = cv.getContext('2d'), img = x.createImageData(W, H);
  for (let y = 0; y < H; y++) img.data.set(px.subarray((H - 1 - y) * W * 4, (H - y) * W * 4), y * W * 4);
  x.putImageData(img, 0, 0);
  eyeCam = null;
  S = saveS; Object.assign(G.uHit.value, save.hit); G.uSquash.value = save.sq; G.uShear.value.copy(save.sh); G.uLift.value = save.lf; G.uRip.value.copy(save.rip);
  return cv;
}

function roundRect(x, X, Y, W, H, R) { x.beginPath(); x.roundRect(X, Y, W, H, R); }

// where the card sends people. SITE_URL is the config item (e.g. 'digital-cat.pages.dev'); leave it empty and the card
// prints the public host the page is really served from, and nothing at all on localhost / IP / LAN — never a guessed domain
const SITE_URL = '';
const siteAddr = () => {
  if (SITE_URL) return SITE_URL.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const h = location.hostname;
  if (!h || h === 'localhost' || /^[\d.]+$/.test(h) || h.includes(':') || h.endsWith('.local')) return '';
  return h + location.pathname.replace(/index\.html$/, '').replace(/\/$/, '');
};

async function makeCard() {
  const c = rig.cat, W = 1080, H = 1920, ink = c.ink, hot = c.id === 'orange' ? '#ff7a1a' : '#6b5cff';
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const x = cv.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, c.bg[0]); g.addColorStop(0.55, c.bg[1]); g.addColorStop(1, hot);
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  // light burst behind the cat: alternating rays that fade out from its body
  const CX = W / 2, CY = 1130;
  x.save(); x.translate(CX, CY);
  for (let k = 0; k < 28; k++) {
    const a0 = (k / 28) * Math.PI * 2, a1 = a0 + Math.PI / 28;
    x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, 1500, a0, a1); x.closePath();
    x.fillStyle = 'rgba(255,255,255,0.16)'; x.fill();
  }
  x.restore();
  const glow = x.createRadialGradient(CX, CY, 60, CX, CY, 720); glow.addColorStop(0, 'rgba(255,255,255,0.95)'); glow.addColorStop(0.45, 'rgba(255,255,255,0.45)'); glow.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = glow; x.fillRect(0, 0, W, H);
  x.font = '60px sans-serif'; x.globalAlpha = 0.16; x.fillStyle = ink;
  [[90, 250, -20], [985, 330, 25], [110, 1180, 15], [975, 1060, -30], [150, 700, -10], [930, 640, 12]].forEach(([px, py, r]) => {
    x.save(); x.translate(px, py); x.rotate(r * Math.PI / 180); x.fillText('🐾', -30, 20); x.restore();
  });
  x.globalAlpha = 1;
  const F = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif';
  x.textAlign = 'center';
  const K = TX().card;
  const fit = (t, px, max, wt = 800) => { do x.font = `${wt} ${px}px ${F}`; while (x.measureText(t).width > max && --px > 12); }; // longer languages shrink, never overflow
  // header pill
  x.font = `600 38px ${F}`;
  const pill = K.pill(new Date());
  const pw = x.measureText(pill).width + 80;
  x.fillStyle = 'rgba(255,255,255,0.75)'; roundRect(x, (W - pw) / 2, 96, pw, 72, 36); x.fill();
  x.fillStyle = ink; x.fillText(pill, W / 2, 145);
  fit(K.title, 70, 880); x.fillText(K.title, W / 2, 282);
  // the count: big, outlined, with a colour sweep and a soft drop glow
  x.font = `900 280px ${F}`;
  const num = String(taps), nw = x.measureText(num).width, unit = ' ' + K.unit(taps);
  x.font = `800 84px ${F}`; const uw = x.measureText(unit).width;
  const sx = W / 2 - (nw + uw) / 2, by = 560;
  x.textAlign = 'left'; x.font = `900 280px ${F}`; x.lineJoin = 'round';
  x.save(); x.shadowColor = hot; x.shadowBlur = 50; x.lineWidth = 26; x.strokeStyle = '#fff'; x.strokeText(num, sx, by); x.restore();
  const ng = x.createLinearGradient(0, by - 230, 0, by); ng.addColorStop(0, hot); ng.addColorStop(1, ink);
  x.fillStyle = ng; x.fillText(num, sx, by);
  x.font = `800 84px ${F}`; x.lineWidth = 14; x.strokeStyle = '#fff'; x.strokeText(unit, sx + nw, by); x.fillStyle = ink; x.fillText(unit, sx + nw, by);
  x.textAlign = 'center';
  // the cat is rendered over an exact crop of the card so fur edges blend with the real backdrop
  const crop = document.createElement('canvas'); crop.width = 1080; crop.height = 1080;
  crop.getContext('2d').drawImage(cv, 0, 600, 1080, 1080, 0, 0, 1080, 1080);
  x.drawImage(renderCatImage(1080, 1080, crop), 0, 600);
  // stamp: a tilted seal, the way a finished report gets signed off
  const done = taps >= 10;
  x.save(); x.translate(860, 760); x.rotate(-0.24); x.globalAlpha = 0.9;
  x.strokeStyle = '#e8322c'; x.fillStyle = '#e8322c'; x.lineWidth = 9;
  x.beginPath(); x.arc(0, 0, 118, 0, Math.PI * 2); x.stroke();
  x.lineWidth = 3; x.beginPath(); x.arc(0, 0, 101, 0, Math.PI * 2); x.stroke();
  const st = K.stamp; fit(st[0], 58, 180, 900); x.fillText(st[0], 0, -8); fit(st[done ? 1 : 2], 58, 180, 900); x.fillText(st[done ? 1 : 2], 0, 56);
  x.restore();
  // bottom panel: the line people actually read, who kept you company, and where to go
  x.fillStyle = 'rgba(255,255,255,0.86)'; roundRect(x, 50, 1590, W - 100, 290, 44); x.fill();
  x.fillStyle = ink; fit(feeling(taps), 56, 920); x.fillText(feeling(taps), W / 2, 1680);
  fit(K.company(c), 38, 920, 500); x.globalAlpha = 0.7; x.fillText(K.company(c), W / 2, 1745);
  x.globalAlpha = 1;
  const addr = siteAddr(), line = addr ? K.tryIt(addr) : K.slogan;
  fit(line, 40, 840, 700); const aw = x.measureText(line).width + 70;
  x.fillStyle = ink; roundRect(x, (W - aw) / 2, 1782, aw, 70, 35); x.fill();
  x.fillStyle = '#fff'; x.fillText(line, W / 2, 1830);
  return new Promise((res) => cv.toBlob(res, 'image/png'));
}

let cardBlob = null;
$('#sharebtn').addEventListener('click', async () => {
  audio.unlock();
  cardBlob = await makeCard();
  $('#cardimg').src = await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(cardBlob); });
  $('#card').classList.add('on');
});
$('#savebtn').addEventListener('click', async () => {
  if (!cardBlob) return;
  const name = TX().card.file(taps);
  const file = new File([cardBlob], name, { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] }) && /Mobi|Android|iPhone|iPad/.test(navigator.userAgent)) {
    try { await navigator.share({ files: [file], text: TX().shareText + ' https://cat.kunkunzheten.top/' }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(cardBlob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  $('#savebtn').textContent = TX().saved; setTimeout(() => { $('#savebtn').textContent = TX().ui.save; }, 1600);
});
$('#closebtn').addEventListener('click', () => $('#card').classList.remove('on'));

// ───────────────────────── loop ─────────────────────────
// quality tiers: pixel ratio × shell density. Startup times a few real frames on this device's GPU and picks the
// best tier that fits a 60 fps budget; while running, a slow stretch steps down one tier (and steps back if that
// didn't help, e.g. a phone in low-power mode capped at 30 fps).
const TIERS = [{ pr: 2, sh: 1 }, { pr: 1.6, sh: 0.8 }, { pr: 1.3, sh: 0.62 }, { pr: 1, sh: 0.5 }, { pr: 0.8, sh: 0.4 }];
const quality = { tier: 0, count: TIERS.length, locked: false, gpuMs: [] };
function setTier(t) {
  quality.tier = t;
  const T = TIERS[t];
  pixelRatio = Math.min(window.devicePixelRatio || 1, T.pr);
  renderer.setPixelRatio(pixelRatio); resize();
  furGeoCache.forEach((g) => setShells(g, T.sh));
}
quality.lock = (t) => { if (t < 0) { quality.locked = false; return; } quality.locked = true; setTier(t); };
function calibrate() {
  const gl = renderer.getContext(), px = new Uint8Array(4);
  const one = () => { renderer.render(scene, camera); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); };
  for (let t = 0; t < TIERS.length; t++) {
    setTier(t);
    one(); one(); // warm-up: shader compile, buffer upload
    const t0 = performance.now(); for (let k = 0; k < 4; k++) one();
    const ms = (performance.now() - t0) / 4;
    quality.gpuMs.push(+ms.toFixed(1));
    if (ms < 11) return; // leaves headroom for the sim + compositor within 16.7 ms
  }
}
const qParam = new URLSearchParams(location.search).get('q');
const SHOW_FPS = new URLSearchParams(location.search).has('fps');

let last = performance.now(), paused = false;
const win = { n: 0, sum: 0, prevAvg: 0, steppedFrom: -1, skip: 30 };
function watchdog(ms) {
  if (quality.locked || ms > 100) return; // tab switches / stalls say nothing about the GPU
  if (win.skip > 0) { win.skip--; return; }
  win.n++; win.sum += ms;
  if (win.n < 60) return;
  const avg = win.sum / win.n; win.n = 0; win.sum = 0;
  if (win.steppedFrom >= 0) {
    // the last step down bought nothing (vsync-capped device): undo it and stop adapting
    if (avg > win.prevAvg * 0.92) { setTier(win.steppedFrom); quality.locked = true; }
    win.steppedFrom = -1;
  } else if (avg > 18.5 && quality.tier < TIERS.length - 1) {
    win.prevAvg = avg; win.steppedFrom = quality.tier; setTier(quality.tier + 1); win.skip = 20;
  }
}
let fpsT = 0, fpsN = 0;
function frame(now) {
  const ms = now - last, dt = Math.min(0.05, ms / 1000); last = now;
  if (!paused) { update(dt); applyState(dt); }
  renderer.render(scene, camera);
  watchdog(ms);
  if (SHOW_FPS) {
    fpsN++; fpsT += ms;
    if (fpsT > 500) { $('#dbg').textContent = `${Math.round(fpsN * 1000 / fpsT)} fps · 档${quality.tier} · ${pixelRatio}x · ${quality.gpuMs.join('/')}ms`; fpsN = 0; fpsT = 0; }
  }
  requestAnimationFrame(frame);
}
window.addEventListener('resize', resize);
resize();
useCat(0);
if (qParam !== null) quality.lock(clamp(+qParam | 0, 0, TIERS.length - 1));
else calibrate();
if (SHOW_FPS) $('#dbg').hidden = false;
requestAnimationFrame(frame);

// hooks for scripted demo recording
window.__cat = { audio, stats, get taps() { return taps; }, useCat, get rig() { return rig; }, get S() { return S; }, G, camera, orbit, renderer, scene, quality,
  // deterministic stepping for frame-rate tests: pause the rAF sim and advance it by hand
  pause(v) { paused = v; }, step(dt) { update(dt); applyState(dt); }, slap: (x, y, p) => slap(x, y, p),
  // still frame from any camera (review sheets): PNG data URL
  snap(pos, look, fov, W, H) {
    const cam = new THREE.PerspectiveCamera(fov, W / H, 0.05, 50); cam.position.set(...pos); cam.lookAt(...look);
    const rt = new THREE.WebGLRenderTarget(W, H, { samples: 4 }); rt.texture.colorSpace = THREE.SRGBColorSpace;
    renderer.setRenderTarget(rt); renderer.render(scene, cam); renderer.setRenderTarget(null);
    const px = new Uint8Array(W * H * 4); renderer.readRenderTargetPixels(rt, 0, 0, W, H, px); rt.dispose();
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const x = cv.getContext('2d'), img = x.createImageData(W, H);
    for (let y = 0; y < H; y++) img.data.set(px.subarray((H - 1 - y) * W * 4, (H - y) * W * 4), y * W * 4);
    x.putImageData(img, 0, 0); return cv.toDataURL('image/png');
  },
  // worst tail-bead penetration into the (deformed) body ellipsoids
  pen() {
    let w = 0; const cs = rig.cols.map((o) => ({ c: deformPoint(o.c, 1), r: o.r }));
    rig.tail.forEach((b, k) => { if (k < 4) return; for (const o of cs) { const p = b.m.position; w = Math.max(w, 1 - Math.hypot((p.x - o.c.x) / o.r.x, (p.y - o.c.y) / o.r.y, (p.z - o.c.z) / o.r.z)); } });
    return w;
  } };

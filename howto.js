/* How-to-play animation for Picrossweeper.
   Plain JavaScript, no dependencies: include it with <script src="howto.js"></script> and it builds
   its own page (canvas, caption, controls). The puzzle, its clue digits and every move in the
   animation are derived at load time from the solution picture below, by a tiny solver that only
   uses the two basic deductions, so the demo can never show a move that isn't forced by logic.   */
(() => {
'use strict';

/* ---------- Themes: the tile-related tokens from the game's CSS, shared via localStorage ---------- */
const THEMES = {
  tavern: {bg: "#2b2620", panel: "#3a332b", ink: "#f1e7d0", muted: "#b9ad94", btn: "#4b4238", btnBorder: "#6a5e50", accent: "#d9a441", onAccent: "#2b2620", unknown: "#6b6052", light: "#f3e4b8", dark: "#24384a", xMark: "#4c5f78", clueOnLight: "#000000", clueOnDark: "#e8dcbf", clueOnUnknown: "#f7efdc", clueDoneOnLight: "#7a7a7a", clueDoneOnDark: "#5c6a7a", clueDoneOnUnknown: "#877b69"},
  proverbs: {bg: "#242746", panel: "#294d5c", ink: "#ffffff", muted: "rgba(255, 255, 255, .72)", btn: "#242746", btnBorder: "#733840", accent: "#f78e55", onAccent: "#242746", unknown: "#2c305c", light: "#f78e55", dark: "#733840", xMark: "#a8555f", clueOnLight: "#000000", clueOnDark: "#ffffff", clueOnUnknown: "#ffffff", clueDoneOnLight: "#8a8a8a", clueDoneOnDark: "#b08a8e", clueDoneOnUnknown: "#6d719a"},
  nocturne: {bg: "#1b1f26", panel: "#262c35", ink: "#e8edf2", muted: "#a3adb8", btn: "#313944", btnBorder: "#4a5563", accent: "#4fd1c5", onAccent: "#1b1f26", unknown: "#3a434f", light: "#e3ecf3", dark: "#123c47", xMark: "#6b8a99", clueOnLight: "#101418", clueOnDark: "#d7e6ea", clueOnUnknown: "#eef2f6", clueDoneOnLight: "#8a949e", clueDoneOnDark: "#4e7079", clueDoneOnUnknown: "#7d8894"},
  dracula: {bg: "#282a36", panel: "#21222c", ink: "#f8f8f2", muted: "#b4b8cc", btn: "#44475a", btnBorder: "#6272a4", accent: "#bd93f9", onAccent: "#282a36", unknown: "#3c3f52", light: "#f8f8f2", dark: "#4f3a8c", xMark: "#ff79c6", clueOnLight: "#282a36", clueOnDark: "#f8f8f2", clueOnUnknown: "#f8f8f2", clueDoneOnLight: "#9a9aa4", clueDoneOnDark: "#9c8fc8", clueDoneOnUnknown: "#7c809a"},
  neon: {bg: "#0b0f1a", panel: "#131a2b", ink: "#e6f7ff", muted: "#8fb3c9", btn: "#1c2740", btnBorder: "#2f4a6e", accent: "#00e5ff", onAccent: "#0b0f1a", unknown: "#1b2438", light: "#dffbff", dark: "#3d1466", xMark: "#ff2bd6", clueOnLight: "#0b0f1a", clueOnDark: "#f3e6ff", clueOnUnknown: "#e6f7ff", clueDoneOnLight: "#7fa3ad", clueDoneOnDark: "#8a6aa8", clueDoneOnUnknown: "#5a6a85"},
  marquee: {bg: "#f2f2f2", panel: "#ffffff", ink: "#141414", muted: "#5c5c5c", btn: "#ececec", btnBorder: "#d0d0d0", accent: "#db2027", onAccent: "#ffffff", unknown: "#bdbdbd", light: "#ffffff", dark: "#1a1a1a", xMark: "#db2027", clueOnLight: "#141414", clueOnDark: "#f2f2f2", clueOnUnknown: "#141414", clueDoneOnLight: "#a8a8a8", clueDoneOnDark: "#6b6b6b", clueDoneOnUnknown: "#9a9a9a"},
  redline: {bg: "#0d0d0d", panel: "#161616", ink: "#f5f5f5", muted: "#9a9a9a", btn: "#1f1f1f", btnBorder: "#333333", accent: "#ff1e3c", onAccent: "#0d0d0d", unknown: "#232323", light: "#f5f5f5", dark: "#3a0a10", xMark: "#ff1e3c", clueOnLight: "#0d0d0d", clueOnDark: "#f5d9dc", clueOnUnknown: "#f5f5f5", clueDoneOnLight: "#9a9a9a", clueDoneOnDark: "#8a5a60", clueDoneOnUnknown: "#707070"},
  circuit: {bg: "#0d0d0d", panel: "#161616", ink: "#f0f0f0", muted: "#9a9a9a", btn: "#1f1f1f", btnBorder: "#333333", accent: "#2fd66d", onAccent: "#0d0d0d", unknown: "#242424", light: "#e8fff0", dark: "#123a1f", xMark: "#2fd66d", clueOnLight: "#0d0d0d", clueOnDark: "#d8ffe4", clueOnUnknown: "#f0f0f0", clueDoneOnLight: "#9a9a9a", clueDoneOnDark: "#5a8a68", clueDoneOnUnknown: "#707070"},
};
const readTheme = () => { try { return localStorage.getItem('pw.theme'); } catch { return null; } };
const themeName = THEMES[readTheme()] ? readTheme() : 'tavern';
let C = THEMES[themeName];

/* ---------- The puzzle: a mushroom, with a clue set the two basic deductions fully solve ---------- */
const PICTURE = [
  '..####..',
  '.######.',
  '########',
  '########',
  '...##...',
  '...##...',
  '..####..',
  '........',
];
const CLUES = [[0,1],[0,6],[1,3],[1,4],[2,0],[2,2],[2,5],[2,7],[4,1],[4,6],[5,3],[5,6],[6,1],[7,4],[7,7]];
const H = PICTURE.length, W = PICTURE[0].length;
const SOL = PICTURE.map(row => [...row].map(ch => (ch === '#' ? 1 : 0)));
const U = -1, DARK = 0, LIGHT = 1;

function block(r, c) {
  const out = [];
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    const y = r + dr, x = c + dc;
    if (y >= 0 && x >= 0 && y < H && x < W) out.push([y, x]);
  }
  return out;
}
const inBlock = (r, c, y, x) => Math.abs(r - y) <= 1 && Math.abs(c - x) <= 1;
const clueNum = new Map(CLUES.map(([r, c]) => [r * W + c, block(r, c).reduce((s, [y, x]) => s + SOL[y][x], 0)]));
const clueAt = (r, c) => clueNum.get(r * W + c);

/* Solve with only the two single-clue deductions, always moving to the usable clue nearest the last one. */
function planSolve() {
  const g = SOL.map(row => row.map(() => U));
  const steps = [];
  let last = [0, 0];
  for (;;) {
    let best = null;
    for (const [r, c] of CLUES) {
      const n = clueAt(r, c);
      let lit = 0; const unk = [];
      for (const [y, x] of block(r, c)) {
        if (g[y][x] === LIGHT) lit++;
        else if (g[y][x] === U) unk.push([y, x]);
      }
      if (!unk.length) continue;
      const value = lit === n ? DARK : lit + unk.length === n ? LIGHT : null;
      if (value === null) continue;
      const dist = Math.abs(r - last[0]) + Math.abs(c - last[1]);
      if (!best || dist < best.dist) best = { r, c, n, lit, unk, value, dist, before: g.map(row => row.slice()) };
    }
    if (!best) break;
    for (const [y, x] of best.unk) g[y][x] = best.value;
    steps.push(best);
    last = [best.r, best.c];
  }
  const solved = g.every((row, y) => row.every((v, x) => v === SOL[y][x]));
  if (!solved) console.error('howto: the clue set does not solve the picture with the basic deductions');
  return steps;
}

/* ---------- Page scaffolding, built from JS ---------- */
document.title = document.title || 'How to play Picrossweeper';
const css = document.createElement('style');
css.textContent = `
  .hw-root { box-sizing: border-box; max-width: 640px; margin: 0 auto; padding: 24px 16px 48px; color: var(--hw-ink);
             font: 16px/1.55 Georgia, "Times New Roman", serif; }
  .hw-root * { box-sizing: border-box; }
  .hw-top { display: flex; flex-wrap: wrap; gap: 8px 16px; align-items: baseline; justify-content: space-between; }
  .hw-root h1 { font-size: 26px; margin: 0; }
  .hw-root a { color: var(--hw-accent); }
  .hw-top { align-items: center; }
  .hw-nav { display: flex; gap: 10px; font-size: 14px; }
  .hw-nav a { text-decoration: none; color: var(--hw-ink); background: var(--hw-btn); border: 1px solid var(--hw-btn-border);
             border-radius: 6px; padding: 6px 12px; }
  .hw-nav a:hover { filter: brightness(1.15); }
  .hw-nav a.primary { background: var(--hw-accent); color: var(--hw-on-accent); border-color: var(--hw-accent); font-weight: bold; }
  .hw-stage { margin-top: 16px; display: flex; justify-content: center; }
  .hw-stage canvas { display: block; max-width: 100%; cursor: pointer; }
  .hw-cap { min-height: 7em; margin-top: 12px; text-align: center; }
  .hw-cap b { display: block; font-size: 18px; }
  .hw-cap span { display: block; color: var(--hw-muted); }
  .hw-cap em { display: block; font-style: normal; color: var(--hw-accent); margin-top: 4px; }
  .hw-step { display: flex; gap: 12px; justify-content: center; align-items: stretch; margin-top: 4px; }
  .hw-step button { font: inherit; cursor: pointer; border-radius: 8px; }
  .hw-step [data-act="next"] { font-size: 16px; font-weight: bold; padding: 8px 24px; min-width: 8em;
             background: var(--hw-accent); color: var(--hw-on-accent); border: 2px solid var(--hw-accent); }
  .hw-step [data-act="back"] { font-size: 15px; padding: 8px 16px; color: var(--hw-ink); background: var(--hw-btn);
             border: 1px solid var(--hw-btn-border); }
  .hw-step button:disabled { opacity: .4; cursor: default; }
  .hw-hint { text-align: center; font-size: 14px; color: var(--hw-muted); margin-top: 10px; }
  .hw-hint kbd { font: 12px/1 ui-monospace, Consolas, monospace; padding: 2px 6px; border-radius: 4px;
             border: 1px solid var(--hw-btn-border); background: var(--hw-btn); color: var(--hw-ink); }
  .hw-count { font-size: 14px; color: var(--hw-muted); }
  .hw-bar { height: 6px; border-radius: 3px; background: var(--hw-btn); margin: 10px 0 12px; cursor: pointer; overflow: hidden; }
  .hw-bar div { height: 100%; width: 0; background: var(--hw-accent); }
  .hw-ctl { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: center; font-size: 14px; }
`;
document.head.appendChild(css);

const root = document.createElement('div');
root.className = 'hw-root';
root.innerHTML = `
  <div class="hw-top">
    <h1>How to play</h1>
    <div class="hw-nav"><a href="index.html">Home</a><a href="tutorial.html">Full tutorial</a><a class="primary" href="single.html">Play ↗</a></div>
  </div>
  <div class="hw-stage"><canvas aria-label="Animated walkthrough of solving a small Picrossweeper puzzle"></canvas></div>
  <div class="hw-cap" aria-live="polite"><b></b><span></span><em></em></div>
  <div class="hw-step">
    <button data-act="back">◀ Back</button>
    <button data-act="next">Next ▶</button>
  </div>
  <div class="hw-hint">
    Back: <b>right-click</b>, <kbd>Backspace</kbd> or <kbd>←</kbd> &nbsp;·&nbsp;
    Next: <b>left-click</b>, <kbd>Space</kbd> or <kbd>→</kbd>
  </div>
  <div class="hw-bar" title="Click to jump to a step"><div></div></div>
  <div class="hw-ctl">
    <span class="hw-count"></span>
    <a href="#" data-act="restart">↻ Restart</a>
  </div>`;
document.body.appendChild(root);

const canvas = root.querySelector('canvas');
const ctx = canvas.getContext('2d');
const capTitle = root.querySelector('.hw-cap b');
const capSub = root.querySelector('.hw-cap span');
const capTip = root.querySelector('.hw-cap em');
const capBox = root.querySelector('.hw-cap');
const countEl = root.querySelector('.hw-count');
const bar = root.querySelector('.hw-bar');
const barFill = bar.firstElementChild;
const nextBtn = root.querySelector('[data-act="next"]');
const backBtn = root.querySelector('[data-act="back"]');

function applyTheme() {
  C = THEMES[themeName];
  document.body.style.margin = '0';
  document.body.style.background = C.bg;
  const s = root.style;
  s.setProperty('--hw-ink', C.ink); s.setProperty('--hw-muted', C.muted); s.setProperty('--hw-accent', C.accent);
  s.setProperty('--hw-on-accent', C.onAccent); s.setProperty('--hw-btn', C.btn); s.setProperty('--hw-btn-border', C.btnBorder);
}
applyTheme();

/* ---------- Timeline: a flat list of timed events plus cursor tweens, built once ---------- */
const events = [];   // { t, fn(t) } mutating `st`
const moves = [];    // { t0, t1, from:[r,c], to:[r,c] } in tile units
let T = 0;
const REST = [H - 0.4, W - 1.5];
let cur = REST.slice();
const ev = (fn) => events.push({ t: T, fn });
const wait = (ms) => { T += ms; };
function move(r, c, ms) {
  const d = Math.hypot(r - cur[0], c - cur[1]);
  ms = ms ?? Math.min(700, 260 + d * 70);
  if (d < 0.01) return;
  moves.push({ t0: T, t1: T + ms, from: cur, to: [r, c] });
  cur = [r, c];
  T += ms;
}
/* Every caption() starts a new step: playback halts just before it until the user asks to continue. */
const stops = [];
function caption(title, sub = '', tip = '') {
  if (T > 0) stops.push(T - 1);
  ev((t) => setCaption(title, sub, tip, t));
}
const focus = (r, c) => ev((t) => { st.focus = { r, c, t }; });
function pressAt(btn) { const at = cur.slice(); ev((t) => { st.btn = btn; st.ripples.push({ r: at[0], c: at[1], t, btn }); }); }
const release = () => ev(() => { st.btn = null; });
const mark = (r, c, v) => ev((t) => setTile(r, c, v, t));

function click(r, c, btn, v) {
  move(r, c); wait(140);
  pressAt(btn); mark(r, c, v); wait(170);
  release(); wait(140);
}
function drag(tiles, btn, v) {
  const [r0, c0] = tiles[0];
  move(r0, c0); wait(140);
  pressAt(btn); mark(r0, c0, v);
  for (const [r, c] of tiles.slice(1)) { move(r, c, 230); mark(r, c, v); }
  wait(160); release(); wait(140);
}
/* contiguous same-row runs, so a step's tiles can be painted with one drag per run */
function runs(tiles) {
  const sorted = tiles.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const out = [];
  for (const t of sorted) {
    const run = out[out.length - 1];
    const prev = run && run[run.length - 1];
    if (prev && prev[0] === t[0] && prev[1] + 1 === t[1]) run.push(t); else out.push([t]);
  }
  return out;
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
function explain(s) {
  const k = s.unk.length;
  if (s.value === DARK) {
    if (s.n === 0) return [`This 0 means there are no light tiles in its block.`, `All ${plural(k, 'unknown tile')} around it are dark.`];
    return [`This ${s.n} already has ${plural(s.n, 'light tile')} in its block.`, `The count is met, so the other ${plural(k, 'unknown tile')} must be dark.`];
  }
  const need = s.n - s.lit;
  const head = s.lit ? `This ${s.n} needs ${need} more light tile${need === 1 ? '' : 's'}.` : `This ${s.n} needs ${plural(s.n, 'light tile')}.`;
  return [head, `Only ${plural(k, 'tile')} ${k === 1 ? 'is' : 'are'} still unknown, so ${k === 1 ? 'it is' : 'all of them are'} light.`];
}

function build() {
  const steps = planSolve();
  const doneSeen = new Set();
  let shownLight = false, shownDark = false, shownDrag = false, shownClear = false, shownDone = false;

  caption('Every tile is secretly light or dark.', 'Work out which, and a picture appears. Some tiles show a number.');
  wait(600);
  const first = steps[0];
  caption('A number counts the light tiles in its 3×3 block.', 'The numbered tile counts itself. At the edge of the board the block is smaller.');
  move(first.r, first.c);
  focus(first.r, first.c);
  wait(500);

  steps.forEach((s) => {
    const [title, sub] = explain(s);
    const btn = s.value === LIGHT ? 'L' : 'R';

    if (s.value === LIGHT && shownLight && !shownClear) {
      // one deliberate misclick, to show that clicking again clears a tile
      const [y, x] = pickOutside(s);
      caption('Clicked the wrong tile? Click it again to clear it.', 'Clicking with the same button puts the tile back to unknown.');
      ev(() => { st.focus = null; });
      click(y, x, 'L', LIGHT); wait(500);
      click(y, x, 'L', U); wait(300);
      shownClear = true;
    }

    const tips = [];
    if (s.value === LIGHT && !shownLight) { tips.push('Left-click marks a tile light.'); shownLight = true; }
    if (s.value === DARK && !shownDark) { tips.push('Right-click marks a tile dark. Dark tiles get an ✕.'); shownDark = true; }
    if (!shownDrag && runs(s.unk).some(run => run.length > 1)) { tips.push('Hold the button and drag to mark several tiles at once.'); shownDrag = true; }
    caption(title, sub, tips.join(' '));
    move(s.r, s.c);
    focus(s.r, s.c);
    wait(900);
    for (const run of runs(s.unk)) {
      if (run.length > 1) drag(run, btn, s.value);
      else click(run[0][0], run[0][1], btn, s.value);
    }
    wait(300);

    // after this step, did any clue get its whole block marked for the first time?
    const g = s.before.map(row => row.slice());
    for (const [y, x] of s.unk) g[y][x] = s.value;
    const newlyDone = CLUES.filter(([r, c]) => !doneSeen.has(r * W + c) && block(r, c).every(([y, x]) => g[y][x] !== U));
    newlyDone.forEach(([r, c]) => doneSeen.add(r * W + c));
    if (newlyDone.length && !shownDone) {
      const [r, c] = newlyDone[0];
      caption('The number turns grey once every tile in its block is marked.', 'Grey means there is nothing left to read from that clue. It does not mean the answer is right.');
      move(r, c);
      focus(r, c);
      wait(500);
      shownDone = true;
    }
  });

  caption('Every tile is marked, and the picture is finished.', 'Every puzzle can be solved like this, one clue at a time, with no guessing.');
  ev(() => { st.focus = null; });
  move(REST[0], REST[1]);
  ev((t) => { st.winAt = t; });
  wait(1200);
}

function pickOutside(s) {
  const cand = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (s.before[y][x] === U && !inBlock(s.r, s.c, y, x)) cand.push([Math.abs(y - s.r) + Math.abs(x - s.c), y, x]);
  }
  cand.sort((a, b) => a[0] - b[0]);
  return cand[0].slice(1);
}

/* ---------- Mutable playback state, rebuilt by reset() ---------- */
let st;
function reset() {
  st = {
    g: SOL.map(row => row.map(() => U)),
    changed: SOL.map(row => row.map(() => -1e9)),
    doneAt: new Map(),     // clue index -> time its block became fully marked
    focus: null, btn: null, ripples: [], winAt: null, capAt: 0,
  };
  capTitle.textContent = ''; capSub.textContent = ''; capTip.textContent = '';
}
function setTile(r, c, v, t) {
  st.g[r][c] = v;
  st.changed[r][c] = t;
  for (const [cr, cc] of CLUES) {
    if (!inBlock(cr, cc, r, c)) continue;
    const key = cr * W + cc;
    const full = block(cr, cc).every(([y, x]) => st.g[y][x] !== U);
    if (full && !st.doneAt.has(key)) st.doneAt.set(key, t);
    if (!full) st.doneAt.delete(key);
  }
}
function setCaption(title, sub, tip, t) {
  capTitle.textContent = title;
  capSub.textContent = sub;
  capTip.textContent = tip;
  st.capAt = t;
}

/* ---------- Drawing ---------- */
const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.pow(1 - x, 3));
const easeInOut = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const backOut = (x) => { if (x >= 1) return 1; const k = 1.9; x -= 1; return 1 + (k + 1) * x * x * x + k * x * x; };
let L = {};           // layout, recomputed on resize

function layout() {
  const avail = Math.min(root.clientWidth - 32, 560);
  const G = 3, P = 6, M = 30;
  // fit the width, and leave room below the board for the caption and the Next button without scrolling
  const byWidth = (avail - 2 * M - 2 * P - (W - 1) * G) / W;
  const byHeight = (window.innerHeight - 400 - 2 * P - (H - 1) * G) / (H + 1.2);
  const S = Math.max(24, Math.min(56, Math.floor(Math.min(byWidth, byHeight))));
  const bw = W * S + (W - 1) * G + 2 * P, bh = H * S + (H - 1) * G + 2 * P;
  const cw = bw + 2 * M, ch = bh + 12 + Math.round(S * 0.3 + 46 * Math.max(0.8, S / 44));
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
  canvas.style.width = cw + 'px'; canvas.style.height = ch + 'px';
  L = { S, G, P, M, bw, bh, cw, ch, dpr, ox: M, oy: 12 };
}
const tx = (c) => L.ox + L.P + c * (L.S + L.G);    // left edge of column c (fractional allowed)
const ty = (r) => L.oy + L.P + r * (L.S + L.G);

function roundRect(x, y, w, h, rad) {
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad); ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad); ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function cursorAt(t) {
  let pos = REST;
  for (const m of moves) {
    if (t < m.t0) break;
    pos = t >= m.t1 ? m.to : m.from.map((v, i) => v + (m.to[i] - v) * easeInOut((t - m.t0) / (m.t1 - m.t0)));
  }
  return pos;
}

function draw(t) {
  const { S, dpr } = L;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, L.cw, L.ch);
  const win = st.winAt === null ? 0 : ease((t - st.winAt) / 900);

  ctx.fillStyle = C.panel;
  roundRect(L.ox, L.oy, L.bw, L.bh, 8); ctx.fill();

  const focusK = st.focus ? ease((t - st.focus.t) / 300) : 0;
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    const v = st.g[r][c];
    const pop = backOut(Math.min(1, (t - st.changed[r][c]) / 240));
    const sc = 0.78 + 0.22 * pop;
    const x = tx(c) + S / 2, y = ty(r) + S / 2, s = S * sc;
    ctx.fillStyle = v === LIGHT ? C.light : v === DARK ? C.dark : C.unknown;
    roundRect(x - s / 2, y - s / 2, s, s, 3); ctx.fill();

    const n = clueAt(r, c);
    if (v === DARK && n === undefined && win < 1) {       // the ✕ on a dark tile
      ctx.save();
      ctx.globalAlpha = 0.9 * (1 - win);
      ctx.strokeStyle = C.xMark; ctx.lineWidth = Math.max(2, S * 0.08); ctx.lineCap = 'butt';
      const a = s * 0.2;
      ctx.beginPath(); ctx.moveTo(x - a, y - a); ctx.lineTo(x + a, y + a); ctx.moveTo(x + a, y - a); ctx.lineTo(x - a, y + a); ctx.stroke();
      ctx.restore();
    }
    if (n !== undefined && win < 1) {
      const done = st.doneAt.get(r * W + c);
      const dk = done === undefined ? 0 : ease((t - done) / 500);
      const live = v === LIGHT ? C.clueOnLight : v === DARK ? C.clueOnDark : C.clueOnUnknown;
      const grey = v === LIGHT ? C.clueDoneOnLight : v === DARK ? C.clueDoneOnDark : C.clueDoneOnUnknown;
      ctx.font = `bold ${Math.round(s * 0.55)}px Georgia, "Times New Roman", serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.globalAlpha = (1 - dk) * (1 - win); ctx.fillStyle = live; ctx.fillText(n, x, y + 1);
      ctx.globalAlpha = dk * (1 - win); ctx.fillStyle = grey; ctx.fillText(n, x, y + 1);
      ctx.globalAlpha = 1;
    }
  }

  if (st.focus && focusK > 0) drawFocus(st.focus, focusK);

  for (const rp of st.ripples) {
    const k = (t - rp.t) / 450;
    if (k < 0 || k > 1) continue;
    const { r, c } = rp;
    ctx.save();
    ctx.globalAlpha = 1 - k;
    ctx.strokeStyle = C.accent; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(tx(c) + S / 2, ty(r) + S / 2, S * (0.25 + 0.45 * ease(k)), 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  st.ripples = st.ripples.filter(rp => t - rp.t < 450);

  const [cr, cc] = cursorAt(t);
  drawCursor(tx(cc) + S * 0.74, ty(cr) + S * 0.74, st.btn);
}

function drawFocus({ r, c }, k) {
  const { S } = L;
  const r0 = Math.max(0, r - 1), r1 = Math.min(H - 1, r + 1), c0 = Math.max(0, c - 1), c1 = Math.min(W - 1, c + 1);
  const x0 = tx(c0) - 4, y0 = ty(r0) - 4, x1 = tx(c1) + S + 4, y1 = ty(r1) + S + 4;
  // dim everything outside the block so the eye goes to the nine tiles that matter
  ctx.save();
  ctx.globalAlpha = 0.55 * k;
  ctx.fillStyle = C.bg;
  ctx.beginPath();
  ctx.rect(L.ox, L.oy, L.bw, L.bh);
  ctx.rect(x1, y0, x0 - x1, y1 - y0);     // reversed winding cuts the block out
  ctx.fill('evenodd');
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = k;
  ctx.strokeStyle = C.accent; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
  roundRect(x0, y0, x1 - x0, y1 - y0, 5); ctx.stroke();
  ctx.setLineDash([]); ctx.lineWidth = 3;
  roundRect(tx(c) - 1.5, ty(r) - 1.5, S + 3, S + 3, 4); ctx.stroke();
  ctx.restore();
}

function drawCursor(x, y, btn) {
  const u = Math.max(0.8, L.S / 44);
  ctx.save();
  ctx.translate(x, y); ctx.scale(u, u);
  ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 4; ctx.shadowOffsetY = 1;
  ctx.beginPath();                            // arrow pointer
  ctx.moveTo(0, 0); ctx.lineTo(0, 20); ctx.lineTo(5, 15.5); ctx.lineTo(8.5, 23); ctx.lineTo(11.5, 21.6);
  ctx.lineTo(8, 14.3); ctx.lineTo(14.5, 14.3); ctx.closePath();
  ctx.fillStyle = '#ffffff'; ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#111111'; ctx.lineWidth = 1.3; ctx.lineJoin = 'round'; ctx.stroke();

  ctx.translate(17, 16);                      // mouse with the pressed button lit
  const mw = 16, mh = 22;
  ctx.fillStyle = '#f4f4f4'; ctx.strokeStyle = '#111111'; ctx.lineWidth = 1.2;
  roundRect(0, 0, mw, mh, 7); ctx.fill(); ctx.stroke();
  if (btn) {
    ctx.save();
    roundRect(0, 0, mw, mh, 7); ctx.clip();
    ctx.fillStyle = C.accent;
    ctx.fillRect(btn === 'L' ? 0 : mw / 2, 0, mw / 2, 9);
    ctx.restore();
  }
  ctx.beginPath(); ctx.moveTo(0, 9); ctx.lineTo(mw, 9); ctx.moveTo(mw / 2, 0); ctx.lineTo(mw / 2, 9); ctx.stroke();
  ctx.restore();
}

/* ---------- Playback: a step plays through, then waits for the user to continue ---------- */
build();
const END = T;
const starts = [0, ...stops];              // step k plays from starts[k] to ends[k]
const ends = [...stops, END];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let t = 0, next = 0, last = null, stepIx = 0, playing = false;

function runEventsTo(target) {
  while (next < events.length && events[next].t <= target) events[next].fn(events[next++].t);
}
function seek(target) {
  reset();
  t = target; next = 0;
  runEventsTo(t);
  st.ripples = [];
}
function goStep(k) {
  stepIx = Math.max(0, Math.min(ends.length - 1, k));
  seek(starts[stepIx]);
  playing = true;
  if (reduceMotion) { seek(ends[stepIx]); playing = false; }   // show each step's result without the motion
  updateControls();
}
function advance() {
  goStep(stepIx === ends.length - 1 ? 0 : stepIx + 1);
}
function updateControls() {
  const atEnd = stepIx === ends.length - 1;
  backBtn.disabled = stepIx === 0;
  nextBtn.textContent = atEnd ? '↻ Start over' : 'Next ▶';
  countEl.textContent = `${stepIx + 1} / ${ends.length}`;
}
nextBtn.addEventListener('click', advance);
backBtn.addEventListener('click', () => goStep(stepIx - 1));
root.querySelector('[data-act="restart"]').addEventListener('click', (e) => { e.preventDefault(); goStep(0); });
// left-click anywhere goes on, right-click goes back; controls, links and the progress bar keep their own clicks
const ownClicks = (e) => e.target instanceof Element && e.target.closest('button, a, .hw-bar');
document.addEventListener('click', (e) => { if (e.button === 0 && !ownClicks(e)) advance(); });
document.addEventListener('contextmenu', (e) => { if (!ownClicks(e)) { e.preventDefault(); goStep(stepIx - 1); } });
bar.addEventListener('click', (e) => {
  const rect = bar.getBoundingClientRect();
  const target = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * END;
  let k = 0;
  while (k + 1 < starts.length && starts[k + 1] <= target) k++;
  goStep(k);
});
document.addEventListener('keydown', (e) => {
  // a focused button keeps Space/Enter (a focused Next already advances on them)
  if (e.target instanceof HTMLButtonElement && (e.code === 'Space' || e.code === 'Enter')) return;
  if (e.code === 'ArrowRight' || e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); advance(); }
  else if (e.code === 'ArrowLeft' || e.code === 'Backspace') { e.preventDefault(); goStep(stepIx - 1); }
});
window.addEventListener('resize', layout);

function frame(now) {
  const dt = last === null ? 0 : Math.min(100, now - last);
  last = now;
  if (playing) {
    t = Math.min(t + dt, ends[stepIx]);
    runEventsTo(t);
    if (t >= ends[stepIx]) { playing = false; updateControls(); }
  }
  capBox.style.opacity = String(0.25 + 0.75 * ease((t - st.capAt) / 300));
  // while waiting, the Next button pulses so it is clear what to press
  nextBtn.style.boxShadow = playing ? 'none' : `0 0 0 ${(2 + 2 * Math.sin(now / 350)).toFixed(1)}px ${C.accent}55`;
  barFill.style.width = (100 * t / END).toFixed(2) + '%';
  draw(t);
  requestAnimationFrame(frame);
}
layout();
goStep(0);
requestAnimationFrame(frame);
})();

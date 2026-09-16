/* 소리 — 그림과 같은 규칙을 따른다. 조용하고, 느리고, 튀지 않는다.

   음원 파일을 받지 않는다. 전부 그 자리에서 만든다.
   덕분에 무게가 0 이고, 바깥으로 나가는 요청도 없다.

   브라우저는 사람이 한 번 건드리기 전까지 소리를 내주지 않는다.
   오프닝의 `빛은 입자이면서 파동이다` 를 누르는 순간이 그 자리다.
   최초의 관측이 소리도 연다. */

import { RATE } from './anim.js';

const KEY = 'boida.sound';

let ctx = null;
let master = null;
let noise = null;              /* 한 번 만들어 모두가 나눠 쓴다 */
let muted = false;

try { muted = localStorage.getItem(KEY) === 'off'; } catch (e) { /* 막아 둔 브라우저 */ }

/* 전체 크기. 휴대폰 스피커에서도 들려야 한다. */
const LEVEL = 1.7;

const beds = new Map();        /* 상시 소리 */
const wanted = new Set();      /* 아직 소리를 열기 전에 켜 달라고 한 것들 */

export const isMuted = () => muted;
export const isOn = () => Boolean(ctx);

/* ------------------------------------------------------------------
   재료
   ------------------------------------------------------------------ */

/** 분홍 잡음. 흰 잡음은 비가 아니라 지지직 소리가 된다. */
function makeNoise(seconds = 4) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  const fade = Math.floor(ctx.sampleRate * 0.05);

  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + w * 0.0990460;
      b1 = 0.96300 * b1 + w * 0.2965164;
      b2 = 0.57000 * b2 + w * 1.0526913;
      d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.16;
    }
    /* 끝과 처음을 겹쳐 둔다. 안 그러면 되돌 때마다 딸깍한다. */
    for (let i = 0; i < fade; i++) {
      const t = i / fade;
      d[len - fade + i] = d[len - fade + i] * (1 - t) + d[i] * t;
    }
  }
  return buf;
}

/** 아주 느린 흔들림. 소리가 판에 박히지 않게 한다. */
function wobble(param, { rate, depth, base = 1 }) {
  const osc = ctx.createOscillator();
  const amt = ctx.createGain();
  osc.frequency.value = rate;
  amt.gain.value = depth;
  osc.connect(amt).connect(param);
  param.value = base;
  osc.start();
  return osc;
}

/**
 * 상시 소리 한 겹.
 * 잡음을 걸러 낸 것이 전부다. 악기 소리는 쓰지 않는다.
 */
function makeBed({ filters, gain, sway }) {
  const src = ctx.createBufferSource();
  src.buffer = noise;
  src.loop = true;

  let node = src;
  const made = filters.map(({ type, freq, q = 0.7 }) => {
    const f = ctx.createBiquadFilter();
    f.type = type; f.frequency.value = freq; f.Q.value = q;
    node.connect(f);
    node = f;
    return f;
  });

  /* 흔들림과 여닫이를 따로 둔다. 꺼졌을 때 흔들림이 새어 나오지 않도록. */
  const sw = ctx.createGain();
  const fade = ctx.createGain();
  fade.gain.value = 0;
  node.connect(sw).connect(fade).connect(master);
  src.start();

  if (sway) {
    if (sway.on === 'freq') wobble(made[0].frequency, { ...sway, base: made[0].frequency.value });
    else wobble(sw.gain, sway);
  } else {
    sw.gain.value = 1;
  }

  return { fade, top: gain };
}

/* 세계에 상시로 깔리는 것들 */
const BEDS = {
  /* 늘 있는 공기. 거의 들리지 않지만 없으면 화면이 죽어 있다.
     너무 낮게 잡으면 휴대폰 스피커가 아예 내보내지 못한다. */
  air: () => makeBed({
    filters: [{ type: 'bandpass', freq: 420, q: 0.5 }, { type: 'lowpass', freq: 900 }],
    gain: 0.022,
    sway: { on: 'gain', rate: 0.05, depth: 0.45 },
  }),
  rain: () => makeBed({
    filters: [{ type: 'highpass', freq: 520 }, { type: 'lowpass', freq: 5200, q: 0.5 }],
    gain: 0.082,
    sway: { on: 'gain', rate: 0.11, depth: 0.16 },
  }),
  river: () => makeBed({
    filters: [{ type: 'lowpass', freq: 760, q: 1.1 }, { type: 'highpass', freq: 140 }],
    gain: 0.066,
    sway: { on: 'freq', rate: 0.07, depth: 190 },
  }),
};

/* ------------------------------------------------------------------
   여는 자리
   ------------------------------------------------------------------ */

/** 소리를 연다. 시계가 실제로 돌기 시작하면 resolve 한다.
    갓 만든 자리는 아직 멈춰 있어서, 바로 울리면 그 한 번을 삼킨다. */
export function unlock() {
  if (ctx) return ctx.state === 'running' ? Promise.resolve() : ctx.resume();

  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return Promise.resolve();

  /* iOS 의 무음 스위치는 웹 오디오까지 막는다.
     이 소리는 벨소리가 아니라 재생이라고 알려 주면 지나갈 수 있다. */
  try {
    if (navigator.audioSession) navigator.audioSession.type = 'playback';
  } catch (e) { /* 모르는 브라우저는 그냥 지나간다 */ }

  try { ctx = new AC(); } catch (e) { return Promise.resolve(); }

  /* 겹쳐도 찌그러지지 않게 마지막에 한 번 눌러 담는다 */
  const cap = ctx.createDynamicsCompressor();
  cap.threshold.value = -12;
  cap.knee.value = 24;
  cap.ratio.value = 4;
  cap.attack.value = 0.006;
  cap.release.value = 0.25;
  cap.connect(ctx.destination);

  master = ctx.createGain();
  master.gain.value = muted ? 0 : LEVEL;
  master.connect(cap);
  noise = makeNoise();

  ambience('air', true, 6000);
  wanted.forEach((name) => ambience(name, true, 2000));
  wanted.clear();

  /* 다른 데를 보고 있을 때는 조용히 멈춘다 */
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend();
    else ctx.resume();
  });

  return ctx.state === 'running' ? Promise.resolve() : ctx.resume();
}

export function setMuted(on) {
  muted = Boolean(on);
  try { localStorage.setItem(KEY, muted ? 'off' : 'on'); } catch (e) { /* 위와 같다 */ }
  /* 손잡이가 두 군데 있다. 한쪽을 만지면 다른 쪽도 따라온다. */
  dispatchEvent(new CustomEvent('boida:sound'));
  if (!ctx) return;
  const t = ctx.currentTime;
  master.gain.cancelScheduledValues(t);
  master.gain.setValueAtTime(master.gain.value, t);
  master.gain.linearRampToValueAtTime(muted ? 0 : LEVEL, t + 0.5);
}

/* ------------------------------------------------------------------
   쓰는 자리
   ------------------------------------------------------------------ */

/** 상시 소리를 켜고 끈다. 언제나 천천히 드나든다. */
export function ambience(name, on, duration = 3000) {
  if (!BEDS[name]) return;
  if (!ctx) { if (on) wanted.add(name); else wanted.delete(name); return; }

  let bed = beds.get(name);
  if (!bed) {
    if (!on) return;
    bed = BEDS[name]();
    beds.set(name, bed);
  }
  const t = ctx.currentTime;
  const to = on ? bed.top : 0;
  bed.fade.gain.cancelScheduledValues(t);
  bed.fade.gain.setValueAtTime(bed.fade.gain.value, t);
  bed.fade.gain.linearRampToValueAtTime(to, t + (duration * RATE) / 1000);
}

/** 한 번 울리고 사라지는 것들 */
const CUES = {
  /* 최초의 관측. 낮게 한 번 울리고 숨이 지나간다. */
  spark() {
    swell({ freq: 58, peak: 0.16, attack: 0.02, decay: 2.4 });
    breath({ freq: 900, q: 0.8, peak: 0.05, attack: 0.05, decay: 1.6 });
  },
  /* 알아냈다. 그릇을 스친 것처럼, 음정을 세우지 않는다. */
  right() {
    swell({ freq: 196.00, peak: 0.055, attack: 0.012, decay: 1.9 });
    swell({ freq: 293.66, peak: 0.032, attack: 0.02,  decay: 1.5, delay: 0.04 });
  },
  /* 세계가 바뀌기 시작한다 */
  reveal() {
    swell({ freq: 73.42, peak: 0.1, attack: 0.5, decay: 3.2 });
    breath({ freq: 480, q: 0.6, peak: 0.028, attack: 0.9, decay: 2.6 });
  },
  /* 한 바퀴가 닫혔다 */
  cycle() {
    swell({ freq: 98.00,  peak: 0.085, attack: 0.06, decay: 4.4 });
    swell({ freq: 146.83, peak: 0.05,  attack: 0.1,  decay: 3.8, delay: 0.07 });
    swell({ freq: 196.00, peak: 0.03,  attack: 0.14, decay: 3.2, delay: 0.14 });
  },
};

export function cue(name) {
  if (!ctx || muted || !CUES[name]) return;
  CUES[name]();
}

/** 낮은 배음 하나. 붙었다 아주 길게 사라진다. */
function swell({ freq, peak, attack, decay, delay = 0 }) {
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  const lp = ctx.createBiquadFilter();
  osc.type = 'sine';
  osc.frequency.value = freq;
  lp.type = 'lowpass'; lp.frequency.value = 1400;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  osc.connect(lp).connect(g).connect(master);
  osc.start(t);
  osc.stop(t + attack + decay + 0.1);
}

/** 지나가는 숨. 잡음을 아주 좁게 걸러 쓴다. */
function breath({ freq, q, peak, attack, decay, delay = 0 }) {
  const t = ctx.currentTime + delay;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  src.loop = true;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  src.connect(bp).connect(g).connect(master);
  src.start(t, Math.random() * 3);
  src.stop(t + attack + decay + 0.1);
}

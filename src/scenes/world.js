/* 세계 — 질문이 피어나고, 알아낸 것이 실제로 나타나는 자리.
   화면을 처음 봤을 때 버튼보다 세계가 먼저 보여야 한다. */

import { tween, ease, wait, nextFrame } from '../core/anim.js';
import { buildCloud, formCloud, driftCloud, thickenCloud, stirCloud } from '../art/cloud.js';
import { buildRainLayer, addDrops } from '../art/rain.js';
import { buildGrowth, setStage, growPulse, settleStage } from '../art/growth.js';
import { buildLayer, fadeIn } from '../art/layer.js';
import { GROWTH_STAGES, WATER_LAYERS, preload, isReady } from '../art/assets.js';
import { NODES } from '../data/nodes.js';
import { state, markSolved, opensOf, isSolved } from '../core/state.js';
import { stageRect } from '../core/stage.js';
import { openQuiz } from './quiz.js';
import { openArticle } from './article.js';

const NODE_REST = 0.40;          // 평소의 희미함
const CLOUD_AT  = { left: 37, top: 20, width: 52, src: 'assets/cloud-3.webp' };
const GROWTH_AT = { left: 40, top: 82, width: 23 };

/* 비가 땅에 닿은 뒤 생기는 층. 그림이 올라오면 이 자리에 놓인다. */
const SOIL_AT = { left: 50, top: 84, width: 100, src: WATER_LAYERS.soil };

/* 연출이 끝났을 때의 큰 나무. 돌려놓을 때도 같은 값을 쓴다. */
const TREE_GROWN = { x: 1.581, y: 1.535 };

const el = {};
let cloud = null;
let growth = null;
let busy = false;
let onChange = null;

export function mountWorld({ onStateChange } = {}) {
  onChange = onStateChange;
  el.art   = document.getElementById('world-art');
  el.fx    = document.getElementById('sky-fx');
  el.wet   = document.getElementById('wet');
  el.nodes = document.getElementById('nodes');
  el.layer = document.getElementById('world-layer');

  const grain = document.createElement('div');
  grain.id = 'paper-fx';
  el.layer.insertBefore(grain, el.nodes);

  /* 구름은 첫 문제 직후에 필요하다. 미리 받아 둔다.
     자라는 그림은 한참 뒤에 쓰이므로 비가 올 때 받는다. */
  preload([CLOUD_AT.src]);
}

/* ------------------------------------------------------------------
   질문 노드 — 카드가 아니라, 세계 위에 떠오른 생각
   ------------------------------------------------------------------ */

function addNode(node) {
  const at = anchorOf(node);
  const n = document.createElement('div');
  n.className = 'qnode' + (node.disabled ? ' is-disabled' : '');
  n.dataset.node = node.id;
  n.style.left = `${(at.x * 100).toFixed(2)}%`;
  n.style.top  = `${(at.y * 100).toFixed(2)}%`;

  const x = at.x;
  if (x <= 0.4) {
    n.style.setProperty('--anchor', '0');
    n.style.textAlign = 'left';
    n.style.maxWidth = `${Math.min(84, (1 - x) * 100 - 4).toFixed(0)}%`;
  } else if (x >= 0.6) {
    n.style.setProperty('--anchor', '-100%');
    n.style.textAlign = 'right';
    n.style.maxWidth = `${Math.min(84, x * 100 - 4).toFixed(0)}%`;
  } else {
    n.style.maxWidth = '84%';
  }

  if (!node.disabled) {
    n.setAttribute('role', 'button');
    n.setAttribute('tabindex', '0');
  }

  const span = document.createElement('span');
  span.innerHTML = node.label.split('\n').join('<br>');
  span.style.setProperty('--drift-dur', `${(12 + Math.random() * 7).toFixed(1)}s`);
  span.style.setProperty('--drift-delay', `${(-Math.random() * 9).toFixed(1)}s`);
  n.appendChild(span);
  el.nodes.appendChild(n);
  return n;
}

/** 아주 천천히 선명해진다 */
export async function showNode(id, { delay = 0 } = {}) {
  const node = NODES[id];
  if (!node || el.nodes.querySelector(`[data-node="${id}"]`)) return;
  await wait(delay);
  const n = addNode(node);
  await nextFrame();
  n.style.opacity = String(node.disabled ? 0.2 : NODE_REST);
  await wait(1400);
}

/* 방금 생긴 것의 곁. 화면 비율이 달라져도 따라간다. */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

const NEAR = {
  cloud() {
    const n = el.fx.querySelector('.cloud-body');
    if (!n) return null;
    const b = stageRect();
    const r = n.getBoundingClientRect();
    if (!r.height) return null;
    return { x: (r.left + r.width / 2 - b.left) / b.width,
             y: (r.bottom + 30 - b.top) / b.height };
  },
  growth() {
    const n = [...el.fx.querySelectorAll('.growth-stage')]
      .find((i) => !i.dataset.missing && parseFloat(i.style.opacity || 0) > 0.1);
    if (n) {
      const b = stageRect();
      const r = n.getBoundingClientRect();
      if (r.height) return { x: (r.left + r.width / 2 - b.left) / b.width,
                             y: (r.top - 24 - b.top) / b.height };
    }
    /* 아직 아무것도 자라지 않았으면 자랄 자리 바로 위 */
    return { x: GROWTH_AT.left / 100, y: (GROWTH_AT.top - 9) / 100 };
  },
};

function anchorOf(node) {
  const find = node.near && NEAR[node.near];
  const p = find && find();
  if (!p) return node.at;
  return { x: clamp(p.x, 0.16, 0.84), y: clamp(p.y, 0.08, 0.86) };
}

const eachNode = (fn) => el.nodes.querySelectorAll('.qnode').forEach(fn);

function dimOthers(chosen) {
  eachNode((n) => n.classList.add(n === chosen ? 'is-chosen' : 'is-dimmed'));
}
function restoreNodes() {
  eachNode((n) => n.classList.remove('is-dimmed', 'is-chosen'));
}

/* ------------------------------------------------------------------
   세계의 변화 1 — 구름
   ------------------------------------------------------------------ */

async function revealCloud() {
  /* 하늘의 한 부분이 아주 옅어진다 */
  const hush = document.createElement('div');
  hush.className = 'sky-hush';
  hush.style.left = `${CLOUD_AT.left}%`;
  hush.style.top = `${CLOUD_AT.top}%`;
  el.fx.appendChild(hush);

  await tween({
    from: 0, to: 0.5, duration: 1100, easing: ease.inOut,
    onUpdate: (v) => { hush.style.opacity = v.toFixed(3); },
  });
  tween({
    from: 0.5, to: 0, duration: 5200, easing: ease.inOut,
    onUpdate: (v) => { hush.style.opacity = v.toFixed(3); },
    onDone: () => hush.remove(),
  });
  await wait(180);

  /* 안개 같은 작은 형태들이 모여 하나의 구름이 된다 */
  cloud = buildCloud(CLOUD_AT);
  el.fx.appendChild(cloud.anchor);
  await nextFrame();

  await formCloud(cloud, { duration: 5000 });
  await wait(900);
  driftCloud(cloud);
  state.cloudVisible = true;
}

/* ------------------------------------------------------------------
   세계의 변화 2 — 비
   ------------------------------------------------------------------ */

async function revealRain() {
  if (!cloud) return;

  /* 다음 장면에서 쓸 그림을 지금 받아 둔다 */
  preload([...Object.values(GROWTH_STAGES), ...Object.values(WATER_LAYERS)]);

  /* 1. 구름 자체가 먼저 조금 변한다 */
  await thickenCloud(cloud, { to: 0.52, duration: 2400 });

  /* 2. 내부에 미세한 움직임 */
  stirCloud(cloud, { duration: 8000 });
  await wait(1200);

  const rain = buildRainLayer(cloud.drift);

  /* 3. 첫 물방울 하나 */
  addDrops(rain, 1, { once: true, delays: [0], opacity: 0.6 });
  await wait(2300);

  /* 4. 아주 드문 간격으로 몇 방울 */
  addDrops(rain, 4, { once: true, delays: [0, 0.8, 1.7, 2.5], opacity: 0.55 });
  await wait(3100);

  /* 5. 점차 일정한 비가 된다 */
  addDrops(rain, 58);
  tween({
    duration: 4200, easing: ease.inOut,
    onUpdate: (v) => { rain.style.opacity = v.toFixed(3); },
  });

  /* 6. 땅이 젖는다 */
  await tween({
    duration: 6500, delay: 900, easing: ease.inOut,
    onUpdate: (v) => { el.wet.style.opacity = v.toFixed(3); },
  });
  state.rainVisible = true;
}

/* ------------------------------------------------------------------
   세계의 변화 3 — 비가 그치고 새싹이 올라온다
   ------------------------------------------------------------------ */

async function plantGround() {
  if (growth) return;
  growth = buildGrowth(GROWTH_AT);
  el.fx.appendChild(growth.anchor);
  await nextFrame();
}

/** 내리던 비가 잦아든다 */
async function stopRain() {
  const layer = cloud && cloud.drift.querySelector('.rain');
  if (!layer) return;
  await tween({
    from: 1, to: 0, duration: 3000, easing: ease.inOut,
    onUpdate: (v) => { layer.style.opacity = v.toFixed(3); },
    onDone: () => layer.remove(),
  });
  /* 비를 다 쏟은 구름은 다시 조금 옅어진다 */
  if (cloud) {
    tween({
      from: 0.52, to: 0.16, duration: 2600, easing: ease.inOut,
      onUpdate: (v) => { cloud.dense.style.opacity = v.toFixed(3); },
    });
  }
  state.rainVisible = false;
}

async function revealSprout() {
  await stopRain();
  await wait(500);
  await plantGround();
  await setStage(growth, 'sprout', { duration: 2600 });
  state.sproutVisible = true;
}

/* ------------------------------------------------------------------
   세계의 변화 4 — 어린나무
   ------------------------------------------------------------------ */

async function revealYoungTree() {
  await plantGround();

  /* 씨앗 안에 저장돼 있던 것에 기대던 생명이,
     이제 바깥의 빛을 쓰기 시작한다 */
  if (!isReady(GROWTH_STAGES.youngTree)) {
    await setStage(growth, 'youngTree', { duration: 2600 });
    state.plantVisible = true;
    return;
  }

  const light = document.createElement('div');
  light.className = 'sun-touch';
  light.style.left = `${GROWTH_AT.left}%`;
  light.style.top = `${GROWTH_AT.top - 12}%`;
  el.fx.appendChild(light);

  await tween({
    from: 0, to: 0.6, duration: 1600, easing: ease.inOut,
    onUpdate: (v) => { light.style.opacity = v.toFixed(3); },
  });

  await setStage(growth, 'youngTree', { duration: 2600 });

  /* 빛은 완전히 사라지지 않는다. 이제 이 나무가 쓰는 것이다. */
  await tween({
    from: 0.6, to: 0.12, duration: 2400, easing: ease.inOut,
    onUpdate: (v) => { light.style.opacity = v.toFixed(3); },
  });
  state.plantVisible = true;
}

/* ------------------------------------------------------------------
   세계의 변화 5 — 빗물이 땅으로 들어간다
   ------------------------------------------------------------------ */

/** 땅에 얹히는 층. 구름·비·나무보다 아래, 먼저 깔린 땅 층보다 위에 들어간다. */
function addGround(node) {
  node.classList.add('is-ground');
  const last = [...el.fx.querySelectorAll(':scope > .is-ground')].pop();
  if (last) last.after(node); else el.fx.prepend(node);
}

/** 그림이 아직 올라오지 않은 층은 조용히 건너뛴다 */
async function addWaterLayer(at, { to = 1, duration = 2600 } = {}) {
  if (!isReady(at.src)) return;
  const l = buildLayer(at.src, at);
  addGround(l.anchor);
  await nextFrame();
  await fadeIn(l, { to, duration });
}

/* ------------------------------------------------------------------
   강 — 낮은 곳으로 모인 물

   그림은 한 장이고, 원래 그 골짜기에 있었던 것처럼 보이면 된다.
   생기는 순간에만 한 번 드러나고, 그 뒤로는 그냥 세계의 일부다.
   ------------------------------------------------------------------ */

const RIVER_SRC = WATER_LAYERS.river;

/** 세계 그림 바로 위, 구름·비·나무보다 아래에 놓는다 */
function buildRiver() {
  const anchor = document.createElement('div');
  anchor.className = 'river-anchor';
  const img = document.createElement('img');
  img.className = 'river-img';
  img.alt = '';
  img.decoding = 'async';
  img.addEventListener('error', () => {
    img.dataset.missing = '1';
    img.hidden = true;
    img.style.display = 'none';
  });
  img.src = RIVER_SRC;
  anchor.appendChild(img);
  addGround(anchor);
  state.riverVisible = true;
  return img;
}

const riverEl = () => el.fx.querySelector('.river-img');

/* 물빛 → 형태 → 수면의 반사. 세 단계의 결. */
const lerp = (a, b, t) => a + (b - a) * t;
const waterFilter = (t) =>
  `saturate(${lerp(0.22, 1, t).toFixed(3)}) brightness(${lerp(1.14, 1, t).toFixed(3)})`;

async function revealRiver() {
  if (riverEl()) return;
  if (!isReady(RIVER_SRC)) {
    /* 아직 못 받았으면 시간을 끌지 않는다. 받아졌으면 그냥 거기 있고,
       없는 파일이면 error 핸들러가 조용히 숨긴다. */
    settleRiver();
    return;
  }
  const img = buildRiver();
  await nextFrame();

  const edge = (v) => img.style.setProperty('--edge', `${v.toFixed(2)}%`);
  edge(13);
  img.style.filter = waterFilter(0);

  /* 1. 지평선 쪽에 아주 희미한 물빛 */
  await tween({
    duration: 810, easing: ease.inOut,
    onUpdate: (t) => {
      edge(13 + t * 11);
      img.style.opacity = (t * 0.42).toFixed(3);
    },
  });

  /* 2. 강의 형태가 지평선에서 앞쪽으로 이어진다 */
  await tween({
    duration: 1350, easing: ease.inOut,
    onUpdate: (t) => {
      edge(24 + t * 76);
      img.style.opacity = lerp(0.42, 0.86, t).toFixed(3);
      img.style.filter = waterFilter(t * 0.45);
    },
  });

  /* 3. 마지막으로 수면의 반사가 드러난다 */
  await tween({
    duration: 810, easing: ease.inOut,
    onUpdate: (t) => {
      img.style.opacity = lerp(0.86, 1, t).toFixed(3);
      img.style.filter = waterFilter(lerp(0.45, 1, t));
    },
  });
  img.style.filter = '';
}

/** 이미 알아낸 강. 연출 없이 그냥 거기 있다. */
function settleRiver() {
  if (riverEl()) return;
  const img = buildRiver();
  img.style.setProperty('--edge', '100%');
  img.style.opacity = '1';
}

async function revealSoilWater() {
  /* 1. 물을 받아들인 땅은 색이 더 짙어진다.
     비가 그친 뒤의 젖은 땅(#wet)은 이미 떠 있으므로 그 위에 한 겹 더 얹는다. */
  const deep = document.createElement('div');
  deep.className = 'soil-deep';
  addGround(deep);
  await nextFrame();
  await tween({
    from: 0, to: 1, duration: 2600, easing: ease.inOut,
    onUpdate: (v) => { deep.style.opacity = v.toFixed(3); },
  });

  /* 2. 들어간 물은 사라지지 않는다. 지표 아래 공극으로 옮겨 간다. */
  await addWaterLayer(SOIL_AT, { to: 0.88, duration: 3000 });

  state.soilWaterVisible = true;

  /* 3. 미처 들어가지 못한 물은 낮은 곳으로 모여 강이 된다 */
  await revealRiver();
}

/* ------------------------------------------------------------------
   세계의 변화 6 — 같은 일이 반복되어 큰 나무가 된다
   ------------------------------------------------------------------ */

async function revealMatureTree() {
  await plantGround();

  /* 생장 → 분기 → 달라진 몸이 다음 성장의 조건이 된다 → 다시 생장.
     나무를 절차적으로 그리지 않는다. 같은 규칙이 되풀이되는 것만 보인다. */
  const ROUNDS = [
    { x: 1.02, y: 1.07 },   // 위로 자란다
    { x: 1.07, y: 1.02 },   // 옆으로 갈라진다
    { x: 1.04, y: 1.05 },   // 다시 자란다
  ];
  for (const r of ROUNDS) {
    await growPulse(growth, { ...r, duration: 1100 });
    await wait(420);
  }

  /* 큰 나무는 갈아 끼워지는 것이 아니라, 자라던 흐름 위에서 이어진다 */
  await setStage(growth, 'matureTree', { duration: 3400 });
  await growPulse(growth, { x: 1.52, y: 1.52, duration: 3200 });

  /* 마지막으로 수관이 조금 더 넓어진다. 끝나면 TREE_GROWN 만큼 자라 있다. */
  await growPulse(growth, { x: 1.04, y: 1.01, duration: 1600 });
  state.matureTreeVisible = true;
}

const EFFECTS = {
  cloud: revealCloud,
  rain:  revealRain,
  seed:  revealSprout,
  plant: revealYoungTree,
  water: revealSoilWater,
  tree:  revealMatureTree,
};

/* ------------------------------------------------------------------
   노드 하나의 전체 흐름
   ------------------------------------------------------------------ */

async function choose(nodeEl, node) {
  if (busy || node.disabled) return;
  busy = true;

  dimOthers(nodeEl);
  await wait(880);

  await openQuiz(node);        // 맞힐 때까지 돌아오지 않는다

  /* 글을 읽고, 나오는 문제가 있으면 그 아래에서 이어 푼다.
     한 질문은 여기까지 지나야 끝난다. */
  await openArticle(node);

  markSolved(node.id);
  onChange && onChange();

  /* 답을 얻은 질문은 물러나고, 알아낸 것이 세계에 남는다 */
  restoreNodes();
  nodeEl.style.opacity = '0';
  await wait(800);
  nodeEl.remove();

  await wait(300);
  const effect = EFFECTS[node.effect];
  if (effect) await effect();

  await wait(700);
  /* 새 질문이 떠오르는 동안에도 누를 수 있어야 한다 */
  busy = false;
  for (const next of opensOf(node.id)) await showNode(next);
}

export function wireNodes() {
  const act = (e) => {
    const n = e.target.closest('.qnode');
    if (!n || n.classList.contains('is-disabled')) return;
    if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
    if (e.type === 'keydown') e.preventDefault();
    const node = NODES[n.dataset.node];
    if (node) choose(n, node);
  };
  el.nodes.addEventListener('click', act);
  el.nodes.addEventListener('keydown', act);
}

/** 도감을 볼 때는 세계 위의 질문을 잠시 물린다 */
export function hideNodes(on) {
  el.nodes.style.transition = 'opacity calc(.7s * var(--rate)) var(--ease-quiet)';
  el.nodes.style.opacity = on ? '0' : '1';
}

/* 지난번에 보던 세계를 소리 없이 돌려놓는다.
   알아낸 질문만 저장하고, 나머지는 전부 여기에서 되짚는다.
   어떤 연출도 다시 틀지 않는다. `#from=` 지름길도 이 길을 쓴다. */
export async function restoreWorld() {
  preload([CLOUD_AT.src, ...Object.values(GROWTH_STAGES), ...Object.values(WATER_LAYERS)]);

  if (isSolved('cloudWhite')) {
    cloud = buildCloud(CLOUD_AT);
    el.fx.appendChild(cloud.anchor);
    await nextFrame();
    await formCloud(cloud, { duration: 0 });
    driftCloud(cloud);
    state.cloudVisible = true;
  }

  if (isSolved('rainStart')) {
    el.wet.style.opacity = '1';
    /* 비는 새싹이 올라오면서 그친다 */
    if (cloud && !isSolved('seedWater')) {
      cloud.dense.style.opacity = '0.52';
      const rain = buildRainLayer(cloud.drift);
      addDrops(rain, 58);
      rain.style.opacity = '1';
      state.rainVisible = true;
    } else if (cloud) {
      cloud.dense.style.opacity = '0.16';
    }
  }

  if (isSolved('waterInfiltration')) {
    const deep = document.createElement('div');
    deep.className = 'soil-deep';
    deep.style.opacity = '1';
    addGround(deep);
    if (isReady(SOIL_AT.src)) {
      const l = buildLayer(SOIL_AT.src, SOIL_AT);
      l.img.style.opacity = '0.88';
      addGround(l.anchor);
    }
    state.soilWaterVisible = true;
    settleRiver();
  }

  const stage = isSolved('treeForm')     ? 'matureTree'
              : isSolved('plantGrowth')  ? 'youngTree'
              : isSolved('seedWater')    ? 'sprout' : null;
  if (stage) {
    await plantGround();
    settleStage(growth, stage, stage === 'matureTree' ? TREE_GROWN : {});
    state.sproutVisible = true;
    state.plantVisible = stage !== 'sprout';
    state.matureTreeVisible = stage === 'matureTree';
  }
}

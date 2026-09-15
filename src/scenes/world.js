/* 세계 — 질문이 피어나고, 알아낸 것이 실제로 나타나는 자리.
   화면을 처음 봤을 때 버튼보다 세계가 먼저 보여야 한다. */

import { tween, ease, wait, nextFrame } from '../core/anim.js';
import { buildLandscape, VB } from '../art/landscape.js';
import { buildCloud, formCloud, driftCloud, thickenCloud, stirCloud } from '../art/cloud.js';
import { buildRainLayer, addDrops, buildWetGround } from '../art/rain.js';
import { NODES } from '../data/nodes.js';
import { state, markSolved } from '../core/state.js';
import { openQuiz } from './quiz.js';
import { openArticle } from './article.js';

const NODE_REST = 0.32;          // 평소의 희미함
const CLOUD_AT  = { x: 288, y: 402, scale: 1.22 };

const el = {};
const cloud = { group: null, parts: null };
let busy = false;
let onChange = null;

export function mountWorld({ onStateChange } = {}) {
  onChange = onStateChange;
  el.art   = document.getElementById('world-art');
  el.fx    = document.getElementById('sky-fx');
  el.nodes = document.getElementById('nodes');
  el.layer = document.getElementById('world-layer');

  el.art.innerHTML = buildLandscape();
  el.fx.innerHTML  = `<svg viewBox="0 0 ${VB.w} ${VB.h}"
                           preserveAspectRatio="xMidYMid slice"
                           xmlns="http://www.w3.org/2000/svg"></svg>`;
  el.fxSvg = el.fx.querySelector('svg');

  const grain = document.createElement('div');
  grain.id = 'paper-fx';
  el.layer.insertBefore(grain, el.nodes);
}

/* ------------------------------------------------------------------
   질문 노드 — 카드가 아니라, 세계 위에 떠오른 생각
   ------------------------------------------------------------------ */

function addNode(node) {
  const n = document.createElement('div');
  n.className = 'qnode' + (node.disabled ? ' is-disabled' : '');
  n.dataset.node = node.id;
  n.style.left = `${node.at.x * 100}%`;
  n.style.top  = `${node.at.y * 100}%`;

  const x = node.at.x;
  if (x <= 0.4) {
    n.style.setProperty('--anchor', '0');
    n.style.textAlign = 'left';
    n.style.maxWidth = `${Math.min(84, (1 - x) * 100 - 4).toFixed(0)}vw`;
  } else if (x >= 0.6) {
    n.style.setProperty('--anchor', '-100%');
    n.style.textAlign = 'right';
    n.style.maxWidth = `${Math.min(84, x * 100 - 4).toFixed(0)}vw`;
  } else {
    n.style.maxWidth = '84vw';
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
  n.style.opacity = String(node.disabled ? 0.13 : NODE_REST);
  await wait(1400);
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
  const hush = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
  hush.setAttribute('cx', String(CLOUD_AT.x + 208));
  hush.setAttribute('cy', String(CLOUD_AT.y + 84));
  hush.setAttribute('rx', '330');
  hush.setAttribute('ry', '190');
  hush.setAttribute('fill', '#fdf8ec');
  hush.setAttribute('opacity', '0');
  el.fxSvg.appendChild(hush);

  await tween({
    from: 0, to: 0.4, duration: 1900, easing: ease.inOut,
    onUpdate: (v) => hush.setAttribute('opacity', v.toFixed(3)),
  });
  tween({
    from: 0.4, to: 0, duration: 5200, easing: ease.inOut,
    onUpdate: (v) => hush.setAttribute('opacity', v.toFixed(3)),
  });
  await wait(450);

  /* 안개 같은 작은 형태들이 모여 하나의 구름이 된다 */
  const built = buildCloud({ ...CLOUD_AT, scattered: true, seed: 5150 });
  el.fxSvg.insertAdjacentHTML('beforeend', built.markup);
  cloud.group = el.fxSvg.querySelector(`[data-cloud="${built.id}"]`);
  cloud.parts = built.parts;

  await formCloud(cloud.group, cloud.parts, { duration: 4600 });
  await wait(900);
  driftCloud(cloud.group, { ...CLOUD_AT, speed: 0.45 });
  state.cloudVisible = true;
}

/* ------------------------------------------------------------------
   세계의 변화 2 — 비
   ------------------------------------------------------------------ */

async function revealRain() {
  if (!cloud.group) return;

  /* 1. 구름 자체가 먼저 조금 변한다 */
  await thickenCloud(cloud.group, { to: 0.26, duration: 2400 });

  /* 2. 내부에 미세한 움직임 */
  stirCloud(cloud.group, cloud.parts, { duration: 7000 });
  await wait(1100);

  const rain = buildRainLayer();
  cloud.group.appendChild(rain);

  /* 3. 첫 물방울 하나 */
  addDrops(rain, 1, { once: true, delays: [0], opacity: 0.4 });
  await wait(2200);

  /* 4. 아주 드문 간격으로 몇 방울 */
  addDrops(rain, 4, { once: true, delays: [0, 0.7, 1.6, 2.4], opacity: 0.36 });
  await wait(3000);

  /* 5. 점차 일정한 비가 된다 */
  addDrops(rain, 46);
  rain.style.opacity = '0';
  tween({
    duration: 4200, easing: ease.inOut,
    onUpdate: (v) => { rain.style.opacity = v.toFixed(3); },
  });

  /* 6. 땅이 젖는다 */
  el.fxSvg.insertAdjacentHTML('afterbegin', buildWetGround());
  const wet = el.fxSvg.querySelector('.wet');
  await tween({
    duration: 6500, delay: 900, easing: ease.inOut,
    onUpdate: (v) => wet.setAttribute('opacity', v.toFixed(3)),
  });
  state.rainVisible = true;
}

const EFFECTS = { cloud: revealCloud, rain: revealRain };

/* ------------------------------------------------------------------
   노드 하나의 전체 흐름
   ------------------------------------------------------------------ */

async function choose(nodeEl, node) {
  if (busy || node.disabled) return;
  busy = true;

  dimOthers(nodeEl);
  await wait(880);

  await openQuiz(node);        // 맞힐 때까지 돌아오지 않는다
  markSolved(node.id);
  onChange && onChange();

  await openArticle(node);     // 읽고 나면 세계로 돌아온다

  /* 답을 얻은 질문은 물러나고, 알아낸 것이 세계에 남는다 */
  restoreNodes();
  nodeEl.style.opacity = '0';
  await wait(1300);
  nodeEl.remove();

  await wait(700);
  const effect = EFFECTS[node.effect];
  if (effect) await effect();

  await wait(2000);
  await showNode(node.next || 'plantWater');

  busy = false;
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
  el.nodes.style.transition = 'opacity .7s var(--ease-quiet)';
  el.nodes.style.opacity = on ? '0' : '1';
}

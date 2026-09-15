/* 세계 — 질문이 피어나고, 알아낸 것이 나타나는 자리.
   화면을 처음 봤을 때 버튼보다 세계가 먼저 보여야 한다. */

import { tween, ease, wait, nextFrame } from '../core/anim.js';
import { buildLandscape, VB } from '../art/landscape.js';
import { buildCloud, formCloud, driftCloud } from '../art/cloud.js';
import { QUESTIONS } from '../data/knowledge.js';
import { openQuiz, openPreview } from './quiz.js';

const NODE_REST = 0.30;   // 평소의 희미함
let busy = false;

const el = {};

export function mountWorld() {
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
   질문 노드
   ------------------------------------------------------------------ */

function addNode(q) {
  const n = document.createElement('div');
  n.className = 'qnode';
  n.dataset.q = q.id;
  n.style.left = `${q.at.x * 100}%`;
  n.style.top  = `${q.at.y * 100}%`;

  /* 놓인 자리에 따라 기대는 방향이 달라진다.
     가운데는 가운데로, 가장자리는 화면 안쪽으로. */
  const x = q.at.x;
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
  n.setAttribute('role', 'button');
  n.setAttribute('tabindex', '0');
  const span = document.createElement('span');
  span.textContent = q.text;
  span.style.setProperty('--drift-dur', `${(11 + Math.random() * 7).toFixed(1)}s`);
  span.style.setProperty('--drift-delay', `${(-Math.random() * 9).toFixed(1)}s`);
  n.appendChild(span);
  el.nodes.appendChild(n);
  return n;
}

/** 세계 위에 생각이 떠오르듯 — 한꺼번에가 아니라 하나씩 */
export async function bloomQuestions(ids, { gap = 1500, first = 0 } = {}) {
  await wait(first);
  for (const id of ids) {
    const q = QUESTIONS[id];
    if (!q || el.nodes.querySelector(`[data-q="${id}"]`)) continue;
    const n = addNode(q);
    await nextFrame();
    n.style.opacity = String(NODE_REST);
    await wait(gap);
  }
}

function dimOthers(chosen) {
  el.nodes.querySelectorAll('.qnode').forEach((n) => {
    if (n === chosen) n.classList.add('is-chosen');
    else n.classList.add('is-dimmed');
  });
}

function restoreNodes() {
  el.nodes.querySelectorAll('.qnode').forEach((n) => {
    n.classList.remove('is-dimmed', 'is-chosen');
  });
}

/* ------------------------------------------------------------------
   구름이 나타난다
   ------------------------------------------------------------------ */

const CLOUD_AT = { x: 288, y: 402, scale: 1.22 };

async function revealCloud() {
  /* 1. 하늘 한 부분이 아주 희미해진다 */
  const hush = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
  hush.setAttribute('cx', String(CLOUD_AT.x + 210));
  hush.setAttribute('cy', String(CLOUD_AT.y + 86));
  hush.setAttribute('rx', '330');
  hush.setAttribute('ry', '190');
  hush.setAttribute('fill', '#fdf8ec');
  hush.setAttribute('opacity', '0');
  el.fxSvg.appendChild(hush);

  await tween({
    from: 0, to: 0.4, duration: 2000, easing: ease.inOut,
    onUpdate: (v) => hush.setAttribute('opacity', v.toFixed(3)),
  });
  tween({
    from: 0.4, to: 0, duration: 5200, easing: ease.inOut,
    onUpdate: (v) => hush.setAttribute('opacity', v.toFixed(3)),
  });

  await wait(500);

  /* 2~3. 작은 흰 형태들이 모여 구름의 형태가 된다 */
  const cloud = buildCloud({ ...CLOUD_AT, scattered: true, seed: 5150 });
  el.fxSvg.insertAdjacentHTML('beforeend', cloud.markup);
  const g = el.fxSvg.querySelector(`[data-cloud="${cloud.id}"]`);

  await formCloud(g, cloud.parts, { duration: 5400 });

  /* 4. 완성된 구름이 아주 천천히 움직이기 시작한다 */
  await wait(1000);
  driftCloud(g, { ...CLOUD_AT, speed: 0.45 });

  return g;
}

/* ------------------------------------------------------------------
   질문 하나의 전체 흐름
   ------------------------------------------------------------------ */

async function choose(node, q, ctx) {
  if (busy) return;
  busy = true;

  dimOthers(node);
  await wait(950);

  if (q.kind === 'preview') {
    await openPreview(q);
    restoreNodes();
    busy = false;
    return;
  }

  await openQuiz(q);

  /* 답을 얻은 질문은 세계에서 물러나고, 알아낸 것이 그 자리에 남는다 */
  restoreNodes();
  node.style.opacity = '0';
  await wait(1400);
  node.remove();

  ctx.state.solved.add(q.id);

  await wait(700);
  await revealCloud();

  ctx.state.discovered.add(q.rewards);
  ctx.state.justFound = q.rewards;
  ctx.onDiscovery && ctx.onDiscovery(q.rewards);

  /* 7. 알아낸 것 주변에 새로운 질문들이 피어난다 */
  await bloomQuestions(['cloudFall', 'darkCloud', 'cloudWeight'],
                       { first: 2200, gap: 1700 });

  busy = false;
}

export function wireQuestions(ctx) {
  const act = (e) => {
    const n = e.target.closest('.qnode');
    if (!n) return;
    if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
    if (e.type === 'keydown') e.preventDefault();
    const q = QUESTIONS[n.dataset.q];
    if (q) choose(n, q, ctx);
  };
  el.nodes.addEventListener('click', act);
  el.nodes.addEventListener('keydown', act);
}

/** 도감을 볼 때는 세계 위의 질문을 잠시 물린다 */
export function hideNodes(on) {
  el.nodes.style.transition = 'opacity .7s var(--ease-quiet)';
  el.nodes.style.opacity = on ? '0' : '1';
}

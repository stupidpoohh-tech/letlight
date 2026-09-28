/* 세계의 상태.

   알아낸 질문만 이 기기에 아주 작게 남는다. 그 밖의 것(구름 · 비 · 강 ·
   자란 나무)은 전부 거기에서 되짚어 낸다. 상태를 두 군데에 두지 않는다.
   `#reset` 을 붙여 열면 지운다. */

import { NODES, NODE_ORDER } from '../data/nodes.js';
import { clearResume } from './resume.js';
import { clearNotes } from './notes.js';

const KEY = 'boida.progress.v1';

/** 알아낸 것, 읽다 만 자리, 한 번만 하던 안내를 함께 지운다.
    소리 설정은 진행이 아니므로 그대로 둔다. */
export function clearProgress() {
  try { localStorage.removeItem(KEY); } catch (e) { /* 저장을 막아 둔 브라우저 */ }
  clearResume();
  clearNotes();
}

function loadSolved() {
  try {
    const raw = localStorage.getItem(KEY);
    const ids = raw ? JSON.parse(raw) : [];
    return Array.isArray(ids) ? ids.filter((id) => NODES[id]) : [];
  } catch (e) {
    return [];
  }
}

function saveSolved() {
  try { localStorage.setItem(KEY, JSON.stringify(state.solvedOrder)); } catch (e) { /* 위와 같다 */ }
}

if (typeof location !== 'undefined' && location.hash.includes('reset')) clearProgress();

export const state = {
  openingComplete: false,
  /* locked | available | solved */
  nodes: Object.fromEntries(
    Object.keys(NODES).map((id, i) => [id, i === 0 ? 'available' : 'locked'])
  ),
  /* 최근 발견 순서 (백과사전 표시용) */
  solvedOrder: [],
  cloudVisible: false,
  rainVisible: false,
  sproutVisible: false,
  plantVisible: false,
  soilWaterVisible: false,
  matureTreeVisible: false,
  riverVisible: false,
  energyVisible: false,
  bloomVisible: false,
  pollinatorVisible: false,
  fruitVisible: false,
  eaterVisible: false,
};

export const statusOf  = (id) => state.nodes[id];
export const isSolved  = (id) => state.nodes[id] === 'solved';
export const solvedIds = () => NODE_ORDER.filter(isSolved);
export const availableIds = () => NODE_ORDER.filter((id) => state.nodes[id] === 'available');

/** 한 질문이 여는 다음 질문들. 하나일 수도, 갈라질 수도 있다. */
export const opensOf = (id) =>
  [].concat((NODES[id] && NODES[id].next) || []).filter(Boolean);

function unlock(id) {
  state.nodes[id] = 'solved';
  if (!state.solvedOrder.includes(id)) state.solvedOrder.push(id);
  opensOf(id).forEach((next) => {
    if (state.nodes[next] === 'locked') state.nodes[next] = 'available';
  });
}

/* 지난번에 알아낸 것들을 그대로 돌려놓는다 */
loadSolved().forEach(unlock);

export function markSolved(id) {
  unlock(id);
  saveSolved();
}

/** 최근에 알아낸 질문. 콘텐츠 순서가 아니라 실제로 끝낸 순서다.
    solvedOrder 가 이미 그 순서를 들고 있으므로 따로 저장하지 않는다. */
export const recentSolved = (n = 3) =>
  state.solvedOrder.filter((id) => NODES[id]).slice(-n).reverse();

/** 지금 공개된 질문. 데이터에 실제로 들어 있는 것이 전부다. */
export const openIds = () => NODE_ORDER.filter((id) => NODES[id]);

/** 지금 공개된 질문을 모두 알아냈는가.
    한 고리를 닫은 것과는 다른 이야기다. 공개된 질문 전체를 본다. */
export const allOpenSolved = () => openIds().every(isSolved);

/** 강은 물이 어디로 가는지 알아낸 뒤에야 생긴다 */
export const riverUnlocked = () => isSolved('waterInfiltration');

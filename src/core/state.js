/* 세계의 상태. 저장하지 않는다. 새로고침하면 처음부터다. */

import { NODES, NODE_ORDER } from '../data/nodes.js';

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
};

export const statusOf  = (id) => state.nodes[id];
export const isSolved  = (id) => state.nodes[id] === 'solved';
export const solvedIds = () => NODE_ORDER.filter(isSolved);

/** 한 질문이 여는 다음 질문들. 하나일 수도, 갈라질 수도 있다. */
export const opensOf = (id) =>
  [].concat((NODES[id] && NODES[id].next) || []).filter(Boolean);

export function markSolved(id) {
  state.nodes[id] = 'solved';
  if (!state.solvedOrder.includes(id)) state.solvedOrder.push(id);
  opensOf(id).forEach((next) => {
    if (state.nodes[next] === 'locked') state.nodes[next] = 'available';
  });
}

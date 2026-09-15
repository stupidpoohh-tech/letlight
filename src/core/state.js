/* 세계의 상태. 저장하지 않는다. 새로고침하면 처음부터다. */

import { NODES, NODE_ORDER } from '../data/nodes.js';

export const state = {
  openingComplete: false,
  /* locked | available | solved */
  nodes: Object.fromEntries(
    Object.keys(NODES).map((id, i) => [id, i === 0 ? 'available' : 'locked'])
  ),
  cloudVisible: false,
  rainVisible: false,
};

export const statusOf  = (id) => state.nodes[id];
export const isSolved  = (id) => state.nodes[id] === 'solved';
export const solvedIds = () => NODE_ORDER.filter(isSolved);

export function markSolved(id) {
  state.nodes[id] = 'solved';
  const next = NODES[id] && NODES[id].next;
  if (next && state.nodes[next] === 'locked') state.nodes[next] = 'available';
}

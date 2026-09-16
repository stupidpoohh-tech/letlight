/* 순환 — 질문 몇 개가 모여 한 바퀴를 이루면 고리가 닫힌다.

   고리가 닫히기 전까지 세계는 가만히 있다.
   닫히고 나면 그 고리에 속한 것들이 움직이기 시작한다.

   다른 고리를 더하려면 여기에 항목 하나를 쓰면 된다.
   판정은 여전히 state.js 의 solved 하나로만 한다. */

import { isSolved } from '../core/state.js';

export const CYCLES = {
  waterCycle: {
    id: 'waterCycle',
    title: '물의 순환',
    en: 'The Water Cycle',
    lead: '같은 물이 모습만 바꾸며\n하늘과 땅을 돌아 제자리로 온다.',

    /* 고리에 적히는 이름. 아직 질문이 없는 자리도 함께 그린다. */
    ring: ['구름', '비', '강', '증발'],

    /* 이 질문들을 다 알아내면 고리가 닫힌다.
       마지막은 증발한 물이 다시 구름이 되기까지를 보는 질문이다.
       증발 질문이 따로 생기면 여기에 한 줄 더하면 된다. */
    requiredNodes: ['cloudWhite', 'rainStart', 'waterInfiltration', 'waterLatentHeat'],

    badge: 'assets/jem-drop.webp',
    slot: 'drop',

    /* 닫히고 나면 움직이기 시작하는 것들 */
    animates: ['cloud', 'river'],
  },
};

export const CYCLE_ORDER = ['waterCycle'];

/* 보석함. 한 바퀴를 닫을 때마다 제 자리에 보석이 놓인다.

   자리와 크기는 보석함 그림에서 잰 값이다 (그림 크기 대비 %).
   아직 주인이 없는 자리는 비어 있다. */
export const JEM_BOX = 'assets/jem-box.webp';

export const JEM_SLOTS = [
  { key: 'drop',  gem: 'assets/jem-drop.webp',
    at: { left: 21.22, top: 48.82, width: 8.35 } },
  { key: 'hex',   gem: 'assets/jem-hex.webp',
    at: { left: 37.53, top: 48.53, width: 8.03 } },
  { key: 'round', gem: 'assets/jem-round.webp',
    at: { left: 52.88, top: 49.97, width: 10.03 } },
  { key: 'heart', gem: 'assets/jem-heart.webp',
    at: { left: 69.33, top: 50.27, width: 10.83 } },
];

/** 그 자리를 채운 순환. 아직 아무도 없으면 undefined. */
export const cycleInSlot = (key) =>
  CYCLE_ORDER.find((id) => CYCLES[id].slot === key && cycleClosed(id));

export const cycleClosed = (id) =>
  ((CYCLES[id] && CYCLES[id].requiredNodes) || []).every(isSolved);

export const closedCycles = () => CYCLE_ORDER.filter(cycleClosed);

/** 이 질문을 알아내면서 방금 닫힌 고리. 없으면 undefined. */
export const cycleClosedBy = (nodeId) => CYCLE_ORDER.find(
  (id) => CYCLES[id].requiredNodes.includes(nodeId) && cycleClosed(id)
);

/** 지금 움직여야 하는 세계 요소들 */
export const livingElements = () =>
  new Set(closedCycles().flatMap((id) => CYCLES[id].animates));

export const badgeSrcs = () => CYCLE_ORDER.map((id) => CYCLES[id].badge);

/* 백과사전이 보여 줄 세 가지 축.

     질문(Question)  — nodes.js 가 이미 갖고 있다
     세계(World)     — 질문이 가리키는 대상
     원리(Concept)   — 질문이 열어 준 개념

   세계와 원리는 nodes.js 의 노드를 묶어 보여 주기 위한 표시용 묶음이다.
   진행 판정은 그대로 state.js 가 한다. */

import { NODES, CONCEPTS } from './nodes.js';
import { isSolved } from '../core/state.js';

/* 앞으로 열릴 것까지 포함한 전체 수. 시안의 2/12 · 3/18 을 따른다. */
export const WORLD_TOTAL = 12;
export const CONCEPT_TOTAL = 18;

export const WORLDS = {
  cloud: {
    title: '구름', en: 'Cloud', plate: 'cloud',
    lead: '하늘에 떠 있는 미세한 물방울과 얼음 결정의 집합',
    questions: ['cloudWhite'],
    concepts: ['scattering'],
  },
  rain: {
    title: '비', en: 'Rain', plate: 'rain',
    lead: '성장한 강수 입자가 땅으로 떨어지는 현상',
    questions: ['rainStart'],
    concepts: ['growth'],
  },
  plant: {
    title: '식물', en: 'Plant', plate: 'plant',
    lead: '햇빛과 물로 살아가는 생명의 세계',
    questions: ['seedWater', 'plantGrowth'],
    concepts: ['imbibition', 'photosynthesis', 'carbonFixation'],
  },
  fog: {
    title: '안개', en: 'Fog',
    lead: '공기 중의 작은 물방울이 만들어내는 풍경',
    questions: [], concepts: [],
  },
  wind: {
    title: '바람', en: 'Wind',
    lead: '보이지 않지만 세상을 움직이는 공기의 흐름',
    questions: [], concepts: [],
  },
};

export const WORLD_ORDER = ['cloud', 'rain', 'plant', 'fog', 'wind'];

/* 원리의 관계. CONCEPTS(이름·영문)는 nodes.js 가 갖고 있다. */
export const CONCEPT_META = {
  scattering: {
    first: 'cloudWhite', worlds: ['cloud'], ahead: '안개',
    lead: '빛이 입자를 만나 원래 진행하던 방향에서 벗어나\n여러 방향으로 퍼지는 현상.',
    siblings: ['레일리 산란', '파장', '굴절률'],
  },
  growth: {
    first: 'rainStart', worlds: ['rain'], ahead: '눈',
    lead: '구름방울이 훨씬 큰 강수 입자로 자라야\n비로소 비가 된다.',
    siblings: ['충돌·병합', '종단속도', '베르게론–핀데이젠 과정'],
  },
  imbibition: {
    first: 'seedWater', worlds: ['plant'], ahead: '뿌리',
    lead: '마른 조직이 물을 머금으면서\n멈춰 있던 활동이 다시 가능해지는 과정.',
    siblings: ['대사', '효소', '세포호흡', '휴면'],
  },
  photosynthesis: {
    first: 'plantGrowth', worlds: ['plant'], ahead: '숲',
    lead: '빛 에너지를 써서 공기 중의 탄소로\n스스로 유기물을 만드는 과정.',
    siblings: ['엽록체', '엽록소', 'ATP', 'NADPH', '기공'],
  },
  carbonFixation: {
    first: 'plantGrowth', worlds: ['plant'], ahead: '탄소 순환',
    lead: '공기 중에 흩어져 있던 탄소가\n유기물 안으로 들어오는 단계.',
    siblings: ['캘빈 회로', '루비스코', '독립영양생물'],
  },
};

export const CONCEPT_ORDER = [
  'scattering', 'growth', 'imbibition', 'photosynthesis', 'carbonFixation',
];

/* ------------------------------------------------------------------
   진행에서 끌어오는 것들
   ------------------------------------------------------------------ */

export const worldFound   = (id) => (WORLDS[id]?.questions || []).some(isSolved);
export const conceptFound = (id) => isSolved(CONCEPT_META[id]?.first);

export const foundWorlds   = () => WORLD_ORDER.filter(worldFound);
export const foundConcepts = () => CONCEPT_ORDER.filter(conceptFound);

/** 한 세계에서 지금까지 알아낸 질문 수와 원리 수 */
export function worldCount(id) {
  const w = WORLDS[id] || { questions: [], concepts: [] };
  return {
    questions: w.questions.filter(isSolved).length,
    concepts: w.concepts.filter(conceptFound).length,
  };
}

/** 이 원리를 여는 질문들 (알아낸 것 + 아직인 것) */
export function conceptQuestions(id) {
  return Object.values(NODES)
    .filter((n) => [].concat(n.concept || []).includes(id))
    .map((n) => n.id);
}

export const conceptName = (id) => CONCEPTS[id]?.name || id;

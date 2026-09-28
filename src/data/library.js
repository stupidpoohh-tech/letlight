/* 백과사전이 보여 줄 세 가지 축.

     질문(Question)  — nodes.js 가 이미 갖고 있다
     세계(World)     — 질문이 가리키는 대상
     원리(Concept)   — 질문이 열어 준 개념

   세계와 원리는 nodes.js 의 노드를 묶어 보여 주기 위한 표시용 묶음이다.
   진행 판정은 그대로 state.js 가 한다. */

import { NODES, CONCEPTS } from './nodes.js';
import { isSolved } from '../core/state.js';

/* 진행의 분모는 지금 실제로 찾아갈 수 있는 것에서 센다.
   시안의 12 · 18 같은 고정값을 쓰면, 갈 수 있는 길이 없는 항목까지
   아직 못 한 일처럼 보인다.

     공개됨(open)   이 질문들을 지나면 닿을 수 있다
     준비 중        아직 그 세계로 가는 질문이 데이터에 없다

   분모는 공개된 것만 센다. 준비 중인 것은 따로 세어 옆에 적는다. */

export const WORLDS = {
  cloud: {
    title: '구름', en: 'Cloud', plate: 'cloud',
    lead: '하늘에 떠 있는 미세한 물방울과 얼음 결정의 집합',
    questions: ['cloudWhite', 'waterLatentHeat'],
    concepts: ['scattering', 'latentHeat'],
  },
  rain: {
    title: '비', en: 'Rain', plate: 'rain',
    lead: '성장한 강수 입자가 땅으로 떨어지는 현상',
    questions: ['rainStart', 'waterInfiltration'],
    concepts: ['growth', 'infiltration', 'runoff'],
  },
  plant: {
    title: '식물', en: 'Plant', plate: 'plant',
    lead: '햇빛과 물로 살아가는 생명의 세계',
    questions: ['seedWater', 'plantGrowth', 'treeForm', 'treeBloom',
                'flowerGuide', 'treeFruit', 'fruitEater'],
    concepts: ['imbibition', 'photosynthesis', 'carbonFixation',
               'selfOrganization', 'plasticity', 'dormancy', 'photoperiod',
               'floralGuide', 'pollination', 'doubleFertilization', 'fruitSet',
               'ripening', 'seedDispersal'],
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
    siblings: ['발아', '대사', '효소', '세포호흡', '휴면', '앱시스산', '지베렐린', '배근'],
  },
  photosynthesis: {
    first: 'plantGrowth', worlds: ['plant'], ahead: '숲',
    lead: '빛 에너지를 써서 공기 중의 탄소로\n스스로 유기물을 만드는 과정.',
    siblings: ['엽록체', '엽록소', 'ATP', 'NADPH', '기공'],
  },
  carbonFixation: {
    first: 'plantGrowth', worlds: ['plant'], ahead: '탄소 순환',
    lead: '공기 중에 흩어져 있던 탄소가\n유기물 안으로 들어오는 단계.',
    siblings: ['캘빈 회로', '루비스코', '무기질 영양소', '독립영양생물'],
  },
  infiltration: {
    first: 'waterInfiltration', worlds: ['rain'], ahead: '지하수',
    lead: '물이 흙 입자 사이의 공극으로 들어가\n땅속을 따라 이동하는 과정.',
    siblings: ['공극', '포화', '모세관력', '대공극', '토양 다짐'],
  },
  runoff: {
    first: 'waterInfiltration', worlds: ['rain'], ahead: '하천',
    lead: '땅이 받아들이지 못한 물이 지표에 남아\n낮은 곳으로 모여 흐르는 현상.',
    siblings: ['침투초과 유출', '포화초과 유출', '강우 강도', '포화'],
  },
  selfOrganization: {
    first: 'treeForm', worlds: ['plant'], ahead: '패턴',
    lead: '가까운 것들끼리의 국소적인 상호작용만으로\n전체의 규칙적인 형태가 나타나는 성질.',
    siblings: ['줄기 정단분열조직', '옥신', 'PIN 단백질', '엽서', '액아', '정아우세'],
  },
  plasticity: {
    first: 'treeForm', worlds: ['plant'], ahead: '적응',
    lead: '같은 유전형이 자란 환경에 따라\n서로 다른 형태로 나타나는 성질.',
    siblings: ['사이토키닌', '스트리고락톤', '식물 구조', '수관', '공간 경쟁'],
  },
  latentHeat: {
    first: 'waterLatentHeat', worlds: ['cloud'], ahead: '대기 순환',
    lead: '온도를 바꾸지 않으면서 상변화에 드나드는 에너지.\n온도계에는 보이지 않는다.',
    siblings: ['증발', '응결', '엔탈피', '상변화', '단열 냉각', '단열감률', '대기 순환'],
  },
  dormancy: {
    first: 'treeBloom', worlds: ['plant'], ahead: '계절',
    lead: '기온이 잠깐 오른다고 깨어나지 않도록\n눈이 스스로 걸어 두는 잠금.',
    siblings: ['꽃눈', '저온요구도', '눈트임', '생식생장', '내생휴면'],
  },
  photoperiod: {
    first: 'treeBloom', worlds: ['plant'], ahead: '개화',
    lead: '하루 가운데 밝은 시간의 길이.\n식물은 이것으로 계절의 자리를 읽는다.',
    siblings: ['광수용체', '일주기 시계', 'FT 단백질', '플로리겐', '체관'],
  },
  floralGuide: {
    first: 'flowerGuide', worlds: ['plant'], ahead: '감각',
    lead: '꽃에 닿은 곤충이 어디에 내려앉고 어느 쪽으로 움직일지에\n영향을 주는 시각적 단서.',
    siblings: ['자외선 반사', '꽃잎 대비', '착지', '보상 학습', '꽃의 향'],
  },
  pollination: {
    first: 'flowerGuide', worlds: ['plant'], ahead: '열매',
    lead: '움직이지 못하는 식물이\n움직이는 동물의 몸에 꽃가루를 실어 보내는 일.',
    siblings: ['수술', '암술머리', '꽃가루', '꿀', '수분자', '공진화'],
  },
  doubleFertilization: {
    first: 'treeFruit', worlds: ['plant'], ahead: '씨앗',
    lead: '속씨식물에서 한 번의 수정으로\n배가 될 계통과 배젖이 될 계통이 함께 시작되는 일.',
    siblings: ['꽃가루관', '밑씨', '난세포', '중앙세포', '배젖', '종자'],
  },
  fruitSet: {
    first: 'treeFruit', worlds: ['plant'], ahead: '열매',
    lead: '수정을 신호로 씨방의 억제가 풀리고\n본격적인 과실 성장이 시작되는 전환.',
    siblings: ['씨방', '옥신', '지베렐린', '사이토키닌', '단위결실', '에틸렌'],
  },
  ripening: {
    first: 'fruitEater', worlds: ['plant'], ahead: '향',
    lead: '지키던 열매가 부르는 열매로 바뀌는 동안\n맛과 굳기와 색이 함께 달라지는 과정.',
    siblings: ['전분', '당', '세포벽', '엽록소', '카로티노이드', '안토시아닌', '에틸렌'],
  },
  seedDispersal: {
    first: 'fruitEater', worlds: ['plant'], ahead: '숲',
    lead: '걷지 못하는 식물이 과육을 내주고\n씨앗의 이동을 얻는 거래.',
    siblings: ['육질과', '종자 포식자', '소화관 통과', '어미나무', '정착'],
  },
};

export const CONCEPT_ORDER = [
  'scattering', 'growth', 'infiltration', 'runoff', 'latentHeat',
  'imbibition', 'photosynthesis', 'carbonFixation',
  'selfOrganization', 'plasticity', 'dormancy', 'photoperiod',
  'floralGuide', 'pollination', 'doubleFertilization', 'fruitSet',
  'ripening', 'seedDispersal',
];

/* ------------------------------------------------------------------
   진행에서 끌어오는 것들
   ------------------------------------------------------------------ */

export const worldFound   = (id) => (WORLDS[id]?.questions || []).some(isSolved);
export const conceptFound = (id) => isSolved(CONCEPT_META[id]?.first);

export const foundWorlds   = () => WORLD_ORDER.filter(worldFound);
export const foundConcepts = () => CONCEPT_ORDER.filter(conceptFound);

/** 갈 수 있는 길이 데이터에 있는가 */
export const worldOpen   = (id) => ((WORLDS[id] || {}).questions || []).some((q) => NODES[q]);
export const conceptOpen = (id) => Boolean(NODES[(CONCEPT_META[id] || {}).first]);

export const openWorlds    = () => WORLD_ORDER.filter(worldOpen);
export const openConcepts  = () => CONCEPT_ORDER.filter(conceptOpen);
export const comingWorlds   = () => WORLD_ORDER.filter((id) => !worldOpen(id));
export const comingConcepts = () => CONCEPT_ORDER.filter((id) => !conceptOpen(id));

/* 지금 세어지는 분모 */
export const worldTotal   = () => openWorlds().length;
export const conceptTotal = () => openConcepts().length;

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

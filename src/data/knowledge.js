/* 프로토타입 지식 데이터 — 최소한만.
   이후 지식 그래프는 별도로 관리하되, 이번 단계에서는 이 파일이 전부다. */

export const CONCEPTS = {
  scattering: { id: 'scattering', name: '빛의 산란', en: 'Scattering of Light' },
  duality:    { id: 'duality',    name: '빛의 이중성', en: 'Wave–Particle Duality' },
};

/* ------------------------------------------------------------------
   질문
   kind: 'playable'  이번 프로토타입에서 실제로 풀 수 있다
         'preview'   눌러볼 수는 있으나 아직 열리지 않았다
   ------------------------------------------------------------------ */

export const QUESTIONS = {
  cloudWhite: {
    id: 'cloudWhite',
    kind: 'playable',
    text: '구름은 왜 흰색으로 보일까?',
    short: '구름은 왜 흰색일까?',
    at: { x: 0.50, y: 0.30 },
    rewards: 'cloud',
    concept: 'scattering',
    quiz: {
      prompt: '구름은 왜 흰색으로 보일까?',
      choices: [
        { key: 'A', text: '구름 자체가 흰 빛을 만들기 때문에' },
        { key: 'B', text: '물방울과 얼음 결정이 여러 색의 빛을 비슷하게 흩뜨리기 때문에' },
        { key: 'C', text: '파란 하늘의 색을 반사하기 때문에' },
        { key: 'D', text: '물은 원래 흰색이기 때문에' },
      ],
      answer: 'B',
      explain: [
        '구름 속의 작은 물방울과 얼음 결정은\n햇빛의 여러 색을 비교적 고르게 흩뜨립니다.',
        '여러 색의 빛이 함께 눈에 들어오기 때문에\n구름은 흰색에 가깝게 보입니다.',
      ],
    },
  },

  skyBlue: {
    id: 'skyBlue',
    kind: 'preview',
    text: '하늘은 왜 파랄까?',
    at: { x: 0.10, y: 0.150 },
    hint: '같은 햇빛인데 하늘과 구름의 색이 다릅니다.\n흩어지는 방식이 다르기 때문입니다.',
  },

  shadow: {
    id: 'shadow',
    kind: 'preview',
    text: '그림자는 왜 생길까?',
    at: { x: 0.88, y: 0.745 },
    hint: '빛이 지나가지 못한 자리가 남습니다.\n그림자의 모양은 빛의 성질을 알려 줍니다.',
  },

  /* 구름을 얻은 뒤 구름 주변에 피어나는 질문들 */
  darkCloud: {
    id: 'darkCloud',
    kind: 'preview',
    text: '먹구름은 왜 회색일까?',
    branch: 'cloud',
    at: { x: 0.08, y: 0.425 },
    hint: '같은 물방울이 모여 있는데 색이 달라집니다.\n두께가 관계있습니다.',
  },
  cloudFall: {
    id: 'cloudFall',
    kind: 'preview',
    text: '구름은 왜 떨어지지 않을까?',
    branch: 'cloud',
    at: { x: 0.92, y: 0.335 },
    hint: '구름은 분명히 무겁습니다.\n그런데도 떠 있습니다.',
  },
  cloudWeight: {
    id: 'cloudWeight',
    kind: 'preview',
    text: '구름 하나는 얼마나 무거울까?',
    branch: 'cloud',
    at: { x: 0.15, y: 0.575 },
    hint: '눈으로 보기에는 가볍습니다.\n숫자로 보면 놀랍습니다.',
  },
};

/* ------------------------------------------------------------------
   도감
   ------------------------------------------------------------------ */

export const ENTRIES = {
  light: {
    id: 'light',
    name: '빛',
    en: 'Light',
    plate: 'light',
    caption: '처음의 관측',
    foundBy: '빛은 입자이면서 파동이다.',
    core: '빛은 입자처럼 헤아려지기도 하고\n파동처럼 퍼지기도 한다.\n어느 한쪽만으로는 세계를 설명할 수 없다.',
    concept: 'duality',
    unknown: ['빛은 얼마나 빠를까?', '빛은 무엇으로 되어 있을까?'],
    footnote: '이 항목은 세계가 나타나기 전에 기록되었다.',
  },
  cloud: {
    id: 'cloud',
    name: '구름',
    en: 'Cloud',
    plate: 'cloud',
    caption: '흰 구름, 맑은 날의 것',
    foundBy: '구름은 왜 흰색으로 보일까?',
    core: '구름 속 작은 물방울과 얼음 결정은\n여러 색의 빛을 비교적 고르게 산란시킨다.',
    concept: 'scattering',
    unknown: ['왜 구름은 떠 있을까?', '먹구름은 왜 회색일까?', '구름 하나는 얼마나 무거울까?'],
    footnote: '산란은 하늘의 색도 함께 설명한다. 아직 확인되지 않았다.',
  },
};

/* 도감에 자리만 있고 아직 채워지지 않은 항목들 */
export const ENTRY_ORDER = ['light', 'cloud', '???', '???', '???'];

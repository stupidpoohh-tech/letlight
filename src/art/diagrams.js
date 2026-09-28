/* 설명 도식 — 글로 따라가기 어려운 관계 하나만 그림으로 보여 준다.

   장식이 아니다. 본문이 이미 말한 관계를 눈으로 한 번에 잡게 하는 것이
   전부다. 그래서 규칙을 좁게 잡았다.

     · 두 조건을 나란히 두고 하나만 다르게 한다
     · 라벨은 SVG 안에 굽지 않는다. 제목과 설명은 HTML 글자로 둔다
        (그림이 줄어들어도 글자는 줄지 않는다)
     · 색은 무엇이 움직이는지(빛 · 물)만 거든다. 뜻은 화살표의 방향과
        라벨이 나른다
     · 화살표의 수는 양이 아니다. 개념도라고 밝힌다

   그리는 것은 여기, 읽는 문장(캡션)은 nodes.js 에 있다.
   색과 굵기는 styles/codex.css 의 `.fig-art` 한 벌이 정한다. */

/** 선 하나와 그 끝의 화살촉. marker 를 쓰지 않아 id 가 부딪칠 일이 없다. */
function arrow(x1, y1, x2, y2, { head = 5, cls = 'ray' } = {}) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const p = (t) => `${(x2 - head * Math.cos(a + t)).toFixed(1)},${(y2 - head * Math.sin(a + t)).toFixed(1)}`;
  return `<path class="${cls}" d="M${x1} ${y1} L${x2} ${y2}"/>`
       + `<path class="${cls} head" d="M${p(-0.45)} L${x2} ${y2} L${p(0.45)}"/>`;
}

const svg = (inner) =>
  `<svg viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${inner}</svg>`;

/* ------------------------------------------------------------------
   1. 빛이 지나는 길 — 같은 물, 다른 구조
   ------------------------------------------------------------------ */

/** 한 덩어리로 모인 물.
    빛은 대체로 지나가되 경계에서 방향이 꺾이고, 일부는 되비친다.
    꺾이는 각을 보여 주려고 그릇을 넓고 낮게 잡았다. */
function lightThroughBody() {
  const cup = 'M34 40 L34 104 Q34 116 46 116 L154 116 Q166 116 166 104 L166 40';
  const water = 'M35 56 L35 104 Q35 115 46 115 L154 115 Q165 115 165 104 L165 56 Z';
  return svg(`
    <path class="waterfill" d="${water}"/>
    <path class="vessel" d="${cup}"/>
    <path class="surface" d="M35 56 L165 56"/>
    ${/* 들어오는 빛 */ ''}
    <path class="ray" d="M26 6 L86 56"/>
    ${/* 경계에서 일부는 되비친다 */ ''}
    ${arrow(86, 56, 112, 34, { head: 4, cls: 'ray thin' })}
    ${/* 물 속에서는 선 쪽으로 더 꺾인다 */ ''}
    <path class="ray" d="M86 56 L128 115"/>
    ${arrow(128, 115, 152, 135, { cls: 'ray' })}
  `);
}

/** 수많은 작은 물방울.
    한 줄기가 방울마다 갈라져 여러 방향으로 — 되돌아 나오는 쪽까지 — 나간다. */
function lightThroughDrops() {
  /* 방울 자리는 손으로 잡았다. 수와 크기에 뜻은 없다. */
  const hit = [[88, 46], [132, 64], [58, 76], [104, 92], [70, 110]];
  const rest = [[20, 30], [46, 54], [24, 100], [50, 132], [96, 124], [118, 18],
    [150, 96], [178, 104], [158, 128], [186, 34], [126, 108], [76, 20],
    [166, 70], [34, 66], [92, 68], [140, 40], [110, 136], [14, 122]];
  const drop = ([x, y], r) => `<circle class="drop" cx="${x}" cy="${y}" r="${r}"/>`;

  return svg(`
    ${rest.map((d) => drop(d, 3)).join('')}
    ${hit.map((d) => drop(d, 3.6)).join('')}
    ${/* 들어오는 빛 한 줄기 */ ''}
    <path class="ray" d="M26 6 L84 42"/>
    ${/* 첫 방울에서 갈라진다 — 앞으로도, 옆으로도, 왔던 쪽으로도 */ ''}
    ${arrow(88, 42, 96, 8, { cls: 'ray' })}
    ${arrow(84, 44, 44, 34, { cls: 'ray' })}
    <path class="ray" d="M92 48 L128 62"/>
    <path class="ray" d="M84 48 L62 72"/>
    ${/* 만나는 방울마다 또 갈라진다 */ ''}
    ${arrow(137, 64, 180, 56, { cls: 'ray' })}
    ${arrow(135, 60, 168, 30, { cls: 'ray' })}
    <path class="ray" d="M129 68 L108 88"/>
    ${arrow(53, 74, 14, 64, { cls: 'ray' })}
    <path class="ray" d="M60 81 L68 106"/>
    ${arrow(107, 96, 140, 130, { cls: 'ray' })}
    ${arrow(100, 96, 78, 130, { cls: 'ray' })}
    ${arrow(66, 113, 28, 130, { cls: 'ray' })}
  `);
}

/* ------------------------------------------------------------------
   2. 물이 들어갈 길 — 같은 비, 다른 표면

   두 칸이 다른 것은 표면의 상태 하나뿐이다. 비도, 흙 알갱이도, 아래의
   빈 자리도 같은 자리에 같은 수로 둔다. 그래야 무엇이 갈랐는지 보인다.
   ------------------------------------------------------------------ */

const SAME_RAIN = [20, 52, 84, 116, 148, 180]
  .map((x) => `<path class="rain" d="M${x} 4 l-6 22"/>`).join('');

const GROUND = '<path class="ground" d="M6 46 L194 46"/>';

const GRAINS = [[22, 70], [46, 64], [74, 68], [100, 62], [130, 70], [158, 64], [184, 72],
  [34, 96], [62, 90], [92, 102], [118, 92], [146, 98], [174, 90],
  [26, 126], [56, 120], [88, 128], [116, 124], [144, 132], [176, 120]]
  .map(([x, y]) => `<circle class="grain" cx="${x}" cy="${y}" r="2.6"/>`).join('');

/* 아래쪽의 빈 자리. 두 칸에 똑같이 남아 있다 —
   다져진 쪽에도 빈 자리는 있다. 없는 것은 거기까지 가는 길이다. */
const PORES = [[34, 80], [64, 104], [96, 78], [124, 108], [154, 84],
  [74, 130], [140, 126], [180, 104], [44, 116]]
  .map(([x, y]) => `<ellipse class="pore" cx="${x}" cy="${y}" rx="5.4" ry="3.2"/>`).join('');

/** 밟혀 다져진 표면 — 표면의 공극이 눌려 납작해져 길이 끊겼다. */
function soilSealed() {
  const squashed = [];
  for (let x = 14; x <= 190; x += 16) {
    squashed.push(`<ellipse class="pore squashed" cx="${x}" cy="${51}" rx="7.6" ry="1.3"/>`);
  }
  return svg(`
    ${SAME_RAIN}
    <path class="waterfill" d="M40 46 C56 36 118 36 134 46 Z"/>
    <path class="wateredge" d="M40 46 C56 36 118 36 134 46"/>
    ${GROUND}
    ${squashed.join('')}
    ${GRAINS}
    ${PORES}
    ${/* 조금은 들어가지만 멀리 가지 못한다 */ ''}
    ${arrow(72, 34, 72, 57, { head: 4, cls: 'flow thin dash' })}
    ${/* 갈 곳을 잃은 물이 지표를 따라 흐른다 */ ''}
    ${arrow(136, 40, 190, 40, { cls: 'flow' })}
  `);
}

/** 뿌리와 굴이 길을 이어 둔 표면 — 표면에서 안쪽까지 통로가 이어진다. */
function soilOpen() {
  const pipes = `
    <path class="pipe" d="M54 46 C52 62 46 74 42 96"/>
    <path class="pipe" d="M50 62 C44 66 40 74 36 84"/>
    <path class="pipe" d="M112 46 C116 62 110 76 118 102"/>
    <path class="pipe" d="M162 46 C156 60 170 72 163 92 C158 108 168 116 164 130"/>`;
  return svg(`
    ${SAME_RAIN}
    <path class="waterfill" d="M158 46 C166 41 174 41 180 46 Z"/>
    <path class="wateredge" d="M158 46 C166 41 174 41 180 46"/>
    ${GROUND}
    ${pipes}
    ${GRAINS}
    ${PORES}
    ${/* 통로를 따라 안쪽까지 */ ''}
    ${arrow(54, 30, 44, 92, { cls: 'flow' })}
    ${arrow(112, 30, 118, 98, { cls: 'flow' })}
    ${arrow(162, 30, 164, 88, { cls: 'flow' })}
    ${/* 그래도 전부 들어가지는 않는다 */ ''}
    ${arrow(180, 40, 194, 40, { head: 4, cls: 'flow thin' })}
  `);
}

/* ------------------------------------------------------------------
   도식 목록
   ------------------------------------------------------------------ */

const FIGURES = {
  /* 구름 — 같은 물이 어떤 구조로 있느냐에 따라 빛이 나가는 길이 달라진다 */
  lightPath: {
    key: '금색 선은 빛이 지나간 길이고, 화살표는 빛이 나아가는 방향입니다. 파란 윤곽은 물입니다.',
    fine: '보여 주려는 경로만 그린 그림입니다. 방울의 수와 크기, 선의 개수에는 뜻이 없습니다.',
    panels: [
      {
        title: '한 덩어리로 모인 물',
        note: '빛은 대체로 지나갑니다. 경계에서 방향이 꺾이고, 일부는 되비칩니다.',
        art: lightThroughBody,
      },
      {
        title: '수많은 작은 물방울',
        note: '빛이 방울을 만날 때마다 방향을 바꾸어, 되돌아 나오는 쪽까지 여러 방향으로 퍼집니다.',
        art: lightThroughDrops,
      },
    ],
  },

  /* 침투·유출 — 표면에서 안쪽으로 이어지는 길이 있는가 */
  waterWay: {
    key: '아래로 향한 화살표는 땅 안으로 들어간 물, 옆으로 향한 화살표는 지표를 따라 흐른 물, 점선은 가다가 멈춘 물입니다. 비와 흙 알갱이, 아래의 빈 자리는 두 칸에 똑같이 두었습니다.',
    fine: '깊이와 알갱이 크기는 실제 축척이 아닙니다. 화살표는 방향만 가리킵니다. 젖었는지 말랐는지가 아니라, 길이 이어져 있는지를 견준 그림입니다.',
    panels: [
      {
        title: '밟혀 다져진 표면',
        note: '표면의 공극이 눌려 납작해지면 안쪽으로 가는 길이 좁아지거나 끊깁니다. 아래에 빈 자리가 남아 있어도 물은 위에 남아 흐를 수 있습니다.',
        art: soilSealed,
      },
      {
        title: '뿌리와 굴이 길을 이어 둔 표면',
        note: '큰 통로가 표면에서 안쪽까지 이어져 물이 빠르게 들어갈 수 있습니다. 그래도 미처 들어가지 못한 물은 표면에 남습니다.',
        art: soilOpen,
      },
    ],
  },
};

/** 도식 하나. 없는 이름이면 null 이라, 부르는 쪽에서 자리를 만들지 않는다.
    무엇을 보라는 말(caption)이 그림보다 앞에 온다. 범례와 단서는 뒤에 둔다. */
export function diagram(id) {
  const f = FIGURES[id];
  if (!f) return null;
  const panels = f.panels.map((p) => `
    <div class="fig-panel">
      <h4 class="fig-panel-t">${p.title}</h4>
      <div class="fig-art">${p.art()}</div>
      <p class="fig-panel-n">${p.note}</p>
    </div>`).join('');

  return {
    head: '<span class="fig-tag">개념도</span> ',
    body: `<div class="fig-pair">${panels}</div>
      <p class="fig-key">${f.key}</p>
      <p class="fig-fine">${f.fine}</p>`,
  };
}

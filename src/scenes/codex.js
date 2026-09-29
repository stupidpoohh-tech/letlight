/* 백과사전 — 알아낸 세계와 원리의 기록.

   질문 → 세계 → 원리 세 축을 오가는 작은 아카이브.
   화면 하나를 갈아 끼우는 방식이고, 뒤로 가기는 스택으로 되돌린다. */

import { openSheet, closeSheet, br, focusStart, blockWorld } from '../core/sheet.js';
import { pushRoute } from '../core/route.js';
import { NODES, CONCEPTS } from '../data/nodes.js';
import {
  WORLDS, WORLD_ORDER, CONCEPT_META, CONCEPT_ORDER,
  worldFound, conceptFound, worldOpen, conceptOpen,
  foundWorlds, foundConcepts, worldTotal, conceptTotal,
  comingWorlds, comingConcepts,
  worldCount, conceptQuestions, conceptName,
} from '../data/library.js';
import { isSolved, clearProgress, allOpenSolved, recentSolved } from '../core/state.js';
import { CYCLES, closedCycles, openCycles, cycleClosed,
  JEM_BOX, JEM_SLOTS, cycleInSlot } from '../data/cycles.js';
import { thumb } from '../art/plates.js';
import { mark, ring } from '../art/marks.js';
import { renderArticle } from './article.js';
import { badgeArt, hasBadge } from './cycle.js';
import { isMuted, setMuted, unlock } from '../core/sound.js';

const sheet = () => document.getElementById('codex');

const ARROW = `<svg class="ex-arrow" viewBox="0 0 24 12" aria-hidden="true">
    <path d="M1 6h21M17 1.5 22.5 6 17 10.5" fill="none" stroke="currentColor"
          stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const LOCK = `<svg class="ex-lock" viewBox="0 0 16 18" aria-hidden="true">
    <rect x="2.2" y="7.5" width="11.6" height="9" rx="1.4" fill="none"
          stroke="currentColor" stroke-width="1.3"/>
    <path d="M5 7.5V5a3 3 0 0 1 6 0v2.5" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>`;

/* 아직 발견하지 않은 것과, 갈 길이 아직 없는 것은 다르다. */
const SOON = `<svg class="ex-lock ex-lock--soon" viewBox="0 0 16 18" aria-hidden="true">
    <circle cx="8" cy="9" r="6.2" fill="none" stroke="currentColor" stroke-width="1.3"
            stroke-dasharray="2.6 3"/></svg>`;

const ORBIT = `<svg class="ex-orbit" viewBox="0 0 120 100" fill="none" aria-hidden="true">
    <ellipse cx="60" cy="50" rx="46" ry="20" stroke="#b4b8a8" stroke-width="1"/>
    <ellipse cx="60" cy="50" rx="46" ry="20" stroke="#b4b8a8" stroke-width="1"
             transform="rotate(58 60 50)"/>
    <line x1="6" y1="50" x2="114" y2="50" stroke="#d6d8cd" stroke-width="1" stroke-dasharray="3 4"/>
    <line x1="60" y1="8" x2="60" y2="92" stroke="#d6d8cd" stroke-width="1" stroke-dasharray="3 4"/>
    <circle cx="60" cy="50" r="12" fill="none" stroke="#2f312c" stroke-width="1.2"/>
    <path d="M52 46 L68 54M54 42 L66 58" stroke="#2f312c" stroke-width=".8" opacity=".45"/>
    <circle cx="103" cy="38" r="3.2" fill="#b4b8a8"/>
    <circle cx="26" cy="63" r="2.6" fill="#b4b8a8"/>
  </svg>`;

const two = (n) => String(n).padStart(2, '0');

const setRow = (cls, name, state, extra = '') => `
  <button class="ex-set ${cls}" type="button" ${extra}>
    <span class="ex-set-name">${name}</span>
    <span class="ex-set-state">${state}</span>
  </button>`;

/* 소리와 진행. 세계 화면에는 손잡이를 두지 않는다. */
const settings = () => `
  <div class="ex-settings">
    ${setRow('ex-sound', '소리', isMuted() ? '끔' : '켬',
             `aria-pressed="${!isMuted()}"`)}
    ${setRow('ex-reset', '진행', '초기화')}
    <div class="ex-reset-sure" hidden>
      <p class="ex-reset-warn">알아낸 질문과 지금까지 변한 세계가 모두 지워집니다.<br>
        되돌릴 수 없습니다.</p>
      <div class="ex-reset-pick">
        <button class="ex-reset-yes" type="button">지운다</button>
        <button class="ex-reset-no" type="button">그만두기</button>
      </div>
    </div>
  </div>`;

const MADE = `
  <footer class="ex-made">
    <span class="ex-made-by">만든사람 DADA</span>
    <a class="ex-made-home" href="https://dada-town.com/"
       target="_blank" rel="noopener noreferrer" aria-label="DADA 홈페이지로">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3.5 10.6 12 3.8l8.5 6.8V20a.9.9 0 0 1-.9.9h-4.4v-6H8.8v6H4.4a.9.9 0 0 1-.9-.9z"
              stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
      </svg>
    </a>
  </footer>`;

/* ------------------------------------------------------------------
   화면 스택
   ------------------------------------------------------------------ */

/* 지나온 길. 한 칸은 { screen, arg } 이고, 보던 자리(scroll·focus)를 함께 든다.
   기록(route.js)에는 screen·arg 만 넘긴다. 보던 자리는 이번 방문에서만 쓴다. */
let stack = [{ screen: 'home' }];
let onExit = null;

/* 그리는 순번. 늦게 끝난 옛 렌더가 새 화면을 덮지 않게 한다. */
let painting = 0;

const topOf = () => stack[stack.length - 1];

/* 길에서 덜어 낸 칸의 자리도 잠깐 들고 있는다. 기기의 앞으로 가기나
   세계에 다녀오는 길에서 그 칸이 다시 만들어질 때, 보던 높이를 잃지
   않게 하기 위해서다. 이번 판에서만 쓰고 저장하지 않는다.
   도감의 화면 수만큼만 쌓이므로 따로 비우지 않는다. */
const seenAt = new Map();
const spot = (t) => `${t.screen}|${t.arg || ''}`;

/** 지금 화면에서 보던 자리를 적어 둔다 */
function remember() {
  const t = topOf();
  if (!t) return;
  const el = sheet();
  t.scroll = el.scrollTop;
  const a = document.activeElement;
  const g = a && el.contains(a) ? a.closest('[data-go]') : null;
  t.focus = g
    ? `[data-go="${g.dataset.go}"]${g.dataset.arg ? `[data-arg="${g.dataset.arg}"]` : ''}`
    : null;
  seenAt.set(spot(t), { scroll: t.scroll, focus: t.focus });
}

/** 길에 새로 놓는 칸. 전에 본 적이 있으면 그때 자리를 들고 온다. */
function madeOf(t) {
  const had = seenAt.get(spot(t));
  return had
    ? { screen: t.screen, arg: t.arg, scroll: had.scroll, focus: had.focus }
    : { screen: t.screen, arg: t.arg };
}

/** 기록에 넘길 만큼만 남긴 길 */
export const codexTrail = () => stack.map(({ screen, arg }) => ({ screen, arg }));

const sameTrail = (a, b) => a.length === b.length
  && a.every((t, i) => t.screen === b[i].screen && t.arg === b[i].arg);

/** 기록 한 칸이 시킨 대로 길을 맞춘다.
    되돌아온 자리는 보던 위치를 그대로 쓰고, 새 자리는 처음부터 본다.
    이미 그 길에 서 있으면 다시 그리지 않는다. */
export function setCodexTrail(trail, { restore = false } = {}) {
  const want = (trail && trail.length ? trail : [{ screen: 'home' }])
    .filter((t) => SCREENS[t.screen]);
  if (!want.length) want.push({ screen: 'home' });
  if (sameTrail(want, stack)) return;
  remember();

  /* 같은 칸이면 보던 자리를 잃지 않게 이어 붙인다 */
  const next = want.map((t, i) => {
    const had = stack[i];
    return (had && had.screen === t.screen && had.arg === t.arg) ? had : madeOf(t);
  });
  stack = next;
  paint({ restore });
}

const go = (screen, arg) => {
  if (!SCREENS[screen]) return;
  /* 같은 자리로 또 가지 않는다. 전환 중에 두 번 눌려도 길이 겹치지 않는다. */
  const t = topOf();
  if (t && t.screen === screen && t.arg === arg) return;
  remember();
  stack.push({ screen, arg });
  /* 먼저 그리고 기록을 남긴다. 기록이 돌아오기를 기다리는 사이에
     옛 화면이 한 번 더 눌리는 일이 없다. */
  paint({ restore: false });
  pushRoute({ view: 'codex', trail: codexTrail() });
};

/** 도감 안의 뒤로. 적힌 이름 그대로 한 칸 위로 간다.

    기기의 뒤로 가기와는 다른 일이다. 그쪽은 실제로 지나온 기록을 따르므로,
    도감 글에서 세계에 들렀다 돌아왔다면 세계로 간다. 그런데 화면 위의
    버튼에는 `백과사전` 이라고 적혀 있다. 적힌 곳과 가는 곳이 달라지는
    자리가 여기였다. 그래서 이 버튼은 기록을 거스르지 않고, 길에서 한 칸을
    덜어 낸 다음 그 자리를 새 기록으로 남긴다. */
const back = () => {
  remember();
  if (stack.length > 1) {
    stack.pop();
    paint({ restore: true });
    pushRoute({ view: 'codex', trail: codexTrail() });
    return;
  }
  /* 길의 처음이다. 버튼에도 `세계로` 라고 적혀 있다. */
  onExit && onExit();
};

/* ------------------------------------------------------------------
   공통 조각
   ------------------------------------------------------------------ */

/* 뒤로 갈 자리의 이름. 화면마다 적어 두면 실제로 돌아가는 곳과 어긋난다.
   그래서 지나온 길에서 바로 앞 칸을 보고 정한다. */
function backLabel() {
  const prev = stack[stack.length - 2];
  if (!prev) return '세계로';
  if (prev.screen === 'home')     return '백과사전';
  if (prev.screen === 'worlds')   return '세계';
  if (prev.screen === 'concepts') return '원리';
  if (prev.screen === 'world')    return (WORLDS[prev.arg] || {}).title || '세계';
  if (prev.screen === 'concept')  return (CONCEPTS[prev.arg] || {}).name || '원리';
  if (prev.screen === 'cycle')    return (CYCLES[prev.arg] || {}).title || '순환';
  return '뒤로';
}

/* 화면을 열면 초점은 이 페이지에서 시작한다. 제목이 아니라 페이지를 잡는
   이유는, 제목 뒤로 탭을 누르면 `뒤로` 가 건너뛰어지기 때문이다.
   페이지에는 이름을 붙여 두므로 어디인지는 그대로 읽힌다. */
const page = (inner, mod = '') => `
  <div class="ex-page ${mod}" data-focus tabindex="-1" role="group">
    <button class="ex-back" type="button">
      <svg viewBox="0 0 20 14" aria-hidden="true"><path d="M19 7H1M7 1 1 7l6 6"
        fill="none" stroke="currentColor" stroke-width="1.4"
        stroke-linecap="round" stroke-linejoin="round"/></svg>
      <span>${backLabel()}</span>
    </button>
    ${inner}
  </div>`;

const title = (kicker, head, sub) => `
  <div class="ex-head">
    <span class="ex-rule"></span>
    ${kicker ? `<p class="ex-kicker">${kicker}</p>` : ''}
    <h2 class="ex-title">${br(head)}</h2>
    ${sub ? `<p class="ex-sub">${br(sub)}</p>` : ''}
  </div>`;

/** 질문 한 줄 */
function questionRow(id, { locked = false } = {}) {
  const n = NODES[id];
  if (!n) return '';
  if (locked) {
    return `<li><div class="ex-row is-locked" aria-disabled="true">
        <span class="ex-row-lock">${LOCK}</span>
        <p class="ex-row-title">${br(n.label)}</p>
        ${ARROW}
      </div></li>`;
  }
  return `<li><button class="ex-row" type="button" data-go="article" data-arg="${id}">
      <span class="ex-thumb">${thumb(n.article.plate)}</span>
      <p class="ex-row-title">${br(n.label)}</p>
      ${ARROW}
    </button></li>`;
}

/** 보석함. 한 바퀴를 닫을 때마다 제 자리에 보석이 놓인다. */
function jemBox() {
  const gems = JEM_SLOTS.map((s) => {
    const id = cycleInSlot(s.key);
    if (!id) return '';
    const c = CYCLES[id];
    return `<button class="ex-jem" type="button" data-go="cycle" data-arg="${id}"
                    aria-label="${c.title}"
                    style="left:${s.at.left}%;top:${s.at.top}%;width:${s.at.width}%">
        <img src="${s.gem}" alt="" decoding="async">
      </button>`;
  }).join('');

  return `<div class="ex-jembox">
      <img class="ex-jembox-img" src="${JEM_BOX}" alt="" decoding="async">
      ${gems}
    </div>`;
}

/* ------------------------------------------------------------------
   1. 백과사전 홈
   ------------------------------------------------------------------ */

function renderHome() {
  const cycles = closedCycles();

  const block = (n, kicker, name, found, total, soon, art, target) => `
    <button class="ex-block" type="button" data-go="${target}"
            aria-label="${name} ${found}/${total}${soon ? `, 준비 중 ${soon}` : ''}">
      <span class="ex-block-no">${two(n)}</span>
      <span class="ex-block-art">${art}</span>
      <span class="ex-block-text">
        <span class="ex-block-kicker">${kicker}</span>
        <span class="ex-block-name">${name}</span>
        <span class="ex-block-count">${found} / ${total}${
          soon ? `<span class="ex-block-soon">준비 중 ${soon}</span>` : ''}</span>
      </span>
      ${ARROW}
    </button>`;

  const done = allOpenSolved();
  const opening = openCycles();
  const empty = JEM_SLOTS.length - cycles.length;
  const recent = recentSolved(3);

  return page(`
    ${title('', '알아낸 세계와 원리의 기록', '호기심이 만들어내는, 더 넓은 세상의 지도.')}

    ${done ? `<p class="ex-alldone">지금 공개된 세계를 모두 발견했어요</p>` : ''}

    <div class="ex-blocks">
      ${block(1, '발견한 세계', '세계', foundWorlds().length, worldTotal(),
              comingWorlds().length,
              `<span class="ex-block-img">${thumb('cloud')}</span>`, 'worlds')}
      ${block(2, '발견한 원리', '원리', foundConcepts().length, conceptTotal(),
              comingConcepts().length, ORBIT, 'concepts')}
    </div>

    <section class="ex-section ex-section--recent">
      <div class="ex-section-head">
        <h3 class="ex-section-title">최근 알아낸 질문</h3>
        ${recent.length ? '<span class="ex-section-note">끝낸 차례대로</span>' : ''}
      </div>
      ${recent.length
        ? `<ul class="ex-list">${recent.map((id) => questionRow(id)).join('')}</ul>`
        : '<p class="ex-empty">세계에서 첫 질문을 알아보세요</p>'}
    </section>

    <section class="ex-section">
      <div class="ex-section-head">
        <h3 class="ex-section-title">발견한 순환</h3>
        <span class="ex-section-note">한 바퀴가 닫힌 것</span>
      </div>
      ${jemBox()}
      ${cycles.length
        ? `<p class="ex-jembox-names">${cycles.map((id) => CYCLES[id].title).join(' · ')}${
            empty > 0 ? `<span class="ex-jembox-soon">· 남은 자리는 준비 중</span>` : ''}</p>`
        : '<p class="ex-jembox-names is-empty">아직 닫힌 고리가 없습니다</p>'}

      ${/* 그리다 만 고리도 들여다볼 수 있다. 무엇이 남았는지 보라는 자리다. */ ''}
      ${opening.length ? `<ul class="ex-list ex-list--opening">
        ${opening.map((id) => `<li><button class="ex-row ex-row--cycle" type="button"
            data-go="cycle" data-arg="${id}">
            <span class="ex-row-title">${CYCLES[id].title}</span>
            <span class="ex-row-note">그리다 만 고리</span>
            ${ARROW}
          </button></li>`).join('')}
      </ul>` : ''}
    </section>

    ${settings()}

    ${MADE}
  `, `ex-page--home${done ? ' ex-page--note' : ''}`);
}

/* ------------------------------------------------------------------
   2. 세계 목록
   ------------------------------------------------------------------ */

function worldRow(id) {
  const w = WORLDS[id];
  const found = worldFound(id);
  const c = worldCount(id);
  if (!found) {
    const soon = !worldOpen(id);
    return `<li><div class="ex-entry ${soon ? 'is-soon' : 'is-locked'}" aria-disabled="true">
        <span class="ex-entry-art">${w.plate ? thumb(w.plate) : ''}</span>
        <span class="ex-entry-text">
          <span class="ex-entry-name">${soon ? SOON : LOCK}${w.title}</span>
          <span class="ex-entry-lead">${br(w.lead)}</span>
          <span class="ex-entry-meta">${soon ? '준비 중' : '아직 발견하지 않음'}</span>
        </span>
      </div></li>`;
  }
  return `<li><button class="ex-entry" type="button" data-go="world" data-arg="${id}">
      <span class="ex-entry-art">${thumb(w.plate)}</span>
      <span class="ex-entry-text">
        <span class="ex-entry-name">${w.title}</span>
        <span class="ex-entry-lead">${br(w.lead)}</span>
        <span class="ex-entry-meta">질문 ${c.questions} · 원리 ${c.concepts}</span>
      </span>
      ${ARROW}
    </button></li>`;
}

function renderWorlds() {
  const found = WORLD_ORDER.filter(worldFound);
  const near  = WORLD_ORDER.filter((id) => !worldFound(id) && worldOpen(id));
  const soon  = WORLD_ORDER.filter((id) => !worldOpen(id));
  return page(`
    ${title('', '발견한 현상과 존재', '')}
    <ul class="ex-entries">${found.map(worldRow).join('')}</ul>
    ${near.length ? `
      <h3 class="ex-section-title ex-section-title--gap">아직 발견하지 않은 세계</h3>
      <ul class="ex-entries">${near.map(worldRow).join('')}</ul>` : ''}
    ${soon.length ? `
      <h3 class="ex-section-title ex-section-title--gap">준비 중인 세계</h3>
      <p class="ex-soon-note">아직 이곳으로 가는 질문이 없습니다.
        지금 세어지는 진행에는 들어가지 않습니다.</p>
      <ul class="ex-entries">${soon.map(worldRow).join('')}</ul>` : ''}
  `);
}

/* ------------------------------------------------------------------
   3. 세계 상세
   ------------------------------------------------------------------ */

function renderWorld(id) {
  const w = WORLDS[id];
  const qs = w.questions.filter(isSolved);
  const cs = w.concepts.filter(conceptFound);
  return page(`
    <p class="ex-crumb">세계 <span>/</span> ${w.title}</p>
    <div class="ex-hero">${w.plate ? thumb(w.plate) : ''}</div>
    <h2 class="ex-title ex-title--detail">${w.title}</h2>
    <p class="ex-lead">${br(w.lead)}.</p>

    <section class="ex-section">
      <h3 class="ex-section-title">발견한 질문</h3>
      <ul class="ex-list">${qs.map((q) => questionRow(q)).join('')}</ul>
    </section>

    ${cs.length ? `
      <section class="ex-section">
        <h3 class="ex-section-title">연결된 원리</h3>
        <ul class="ex-links">
          ${cs.map((c) => `<li><button class="ex-link" type="button"
              data-go="concept" data-arg="${c}">${conceptName(c)}${ARROW}</button></li>`).join('')}
        </ul>
      </section>` : ''}
  `);
}

/* ------------------------------------------------------------------
   4. 원리 목록
   ------------------------------------------------------------------ */

function conceptRow(id) {
  const c = CONCEPTS[id];
  const m = CONCEPT_META[id];
  if (!conceptFound(id)) {
    const soon = !conceptOpen(id);
    return `<li><div class="ex-entry ${soon ? 'is-soon' : 'is-locked'}" aria-disabled="true">
        <span class="ex-entry-art">${mark(id)}</span>
        <span class="ex-entry-text">
          <span class="ex-entry-name">${soon ? SOON : LOCK}${c.name}</span>
          <span class="ex-entry-lead">${br(m.lead)}</span>
          <span class="ex-entry-meta">${soon ? '준비 중' : '아직 발견하지 않음'}</span>
        </span>
      </div></li>`;
  }
  return `<li><button class="ex-entry" type="button" data-go="concept" data-arg="${id}">
      <span class="ex-entry-art">${mark(id)}</span>
      <span class="ex-entry-text">
        <span class="ex-entry-name">${c.name}</span>
        <span class="ex-entry-lead">${br(m.lead)}</span>
        <span class="ex-entry-meta">${c.en}</span>
      </span>
      ${ARROW}
    </button></li>`;
}

function renderConcepts() {
  const found = CONCEPT_ORDER.filter(conceptFound);
  const near  = CONCEPT_ORDER.filter((id) => !conceptFound(id) && conceptOpen(id));
  const soon  = CONCEPT_ORDER.filter((id) => !conceptOpen(id));
  return page(`
    ${title('', '알아낸 원리', '')}
    <ul class="ex-entries">${found.map(conceptRow).join('')}</ul>
    ${near.length ? `
      <h3 class="ex-section-title ex-section-title--gap">아직 발견하지 않은 원리</h3>
      <ul class="ex-entries">${near.map(conceptRow).join('')}</ul>` : ''}
    ${soon.length ? `
      <h3 class="ex-section-title ex-section-title--gap">준비 중인 원리</h3>
      <p class="ex-soon-note">아직 이곳으로 가는 질문이 없습니다.
        지금 세어지는 진행에는 들어가지 않습니다.</p>
      <ul class="ex-entries">${soon.map(conceptRow).join('')}</ul>` : ''}
  `);
}

/* ------------------------------------------------------------------
   5. 원리 상세 — 이 화면의 핵심은 관계다
   ------------------------------------------------------------------ */

function renderConcept(id) {
  const c = CONCEPTS[id];
  const m = CONCEPT_META[id];
  const n = CONCEPT_ORDER.indexOf(id) + 1;
  const first = NODES[m.first];
  const world = WORLDS[m.worlds[0]];
  const qs = conceptQuestions(id);

  const rel = (cls, kicker, body, go, arg) => (go
    ? `<button class="ex-rel ${cls}" type="button" data-go="${go}" data-arg="${arg}">
         <span class="ex-rel-dot"></span>
         <p class="ex-rel-kicker">${kicker}</p>
         <p class="ex-rel-body">${br(body)}</p>
         ${ARROW}
       </button>`
    : `<div class="ex-rel ${cls}">
         <span class="ex-rel-dot"></span>
         <p class="ex-rel-kicker">${kicker}</p>
         <p class="ex-rel-body">${br(body)}</p>
       </div>`);

  return page(`
    ${title(`CONCEPT ${two(n)}`, c.name, m.lead)}

    <div class="ex-web">
      ${rel('is-tl', '처음 만난 곳', first ? first.label : '—',
            first ? 'article' : null, m.first)}
      ${rel('is-tr', '보이는 세계', world ? world.title : '—',
            world && worldFound(m.worlds[0]) ? 'world' : null, m.worlds[0])}

      <div class="ex-web-center">
        ${mark(id)}
        <p class="ex-web-name">${c.name}</p>
        <p class="ex-web-en">${c.en}</p>
      </div>

      ${rel('is-bl', '함께 이해한 것', m.siblings.join(' · '), null)}
      ${rel('is-br', '다음에 다시 나타날 곳', m.ahead, null)}
    </div>

    <section class="ex-section ex-section--ruled">
      <h3 class="ex-section-title">관련 질문</h3>
      <ul class="ex-list">
        ${qs.map((q) => questionRow(q, { locked: !isSolved(q) })).join('')}
      </ul>
    </section>
  `);
}

/* ------------------------------------------------------------------
   5-1. 순환 상세
   ------------------------------------------------------------------ */

/* 고리가 닫히기 전과 뒤는 다른 화면이다.

   닫히기 전에는 **아직 모르는 관계**를, 닫힌 뒤에는 **한 바퀴를 이루는
   인과**를 보여 준다. 푼 문제의 수를 순환을 이해한 정도로 바꿔 세지 않는다.
   그래서 이 화면 어디에도 숫자가 없다. */
function stepRow(st) {
  const known = isSolved(st.node);
  const n = NODES[st.node];
  return `<li class="ex-step${known ? ' is-known' : ''}">
      <span class="ex-step-label">${st.label}</span>
      ${known
        ? `<button class="ex-step-ask" type="button" data-go="article" data-arg="${st.node}">
             ${br(n.label)}</button>`
        : '<span class="ex-step-wait">아직 모르는 관계</span>'}
    </li>`;
}

function renderCycle(id) {
  const c = CYCLES[id];
  const closed = cycleClosed(id);
  const steps = c.steps || [];
  const left = steps.filter((st) => !isSolved(st.node));

  return page(`
    <p class="ex-crumb">순환 <span>/</span> ${c.title}</p>
    ${closed && hasBadge(c) ? `<div class="ex-hero ex-hero--badge">${badgeArt(c)}</div>` : ''}
    <h2 class="ex-title ex-title--detail">${c.title}</h2>
    <p class="ex-lead">${closed ? br(c.lead) : '아직 한 바퀴가 닫히지 않았습니다.'}</p>

    <section class="ex-section">
      <h3 class="ex-section-title">${closed ? '한 바퀴' : '그리다 만 고리'}</h3>
      <div class="ex-ring${closed ? '' : ' is-open'}">${ring(c.ring)}</div>
      ${closed ? `<p class="ex-ring-line">${[...c.ring, c.ring[0]].join(' → ')}</p>` : ''}
    </section>

    <section class="ex-section ex-section--ruled">
      <div class="ex-section-head">
        <h3 class="ex-section-title">${closed ? '무엇이 무엇을 부르는가' : '남은 관계'}</h3>
        <span class="ex-section-note">${closed
          ? '자리마다 그것을 설명한 질문'
          : (left.length === steps.length
              ? '아직 아무 자리도 이어지지 않았습니다'
              : '아직 이어지지 않은 자리가 있습니다')}</span>
      </div>
      <ul class="ex-steps">${steps.map(stepRow).join('')}</ul>
    </section>
  `);
}

/* ------------------------------------------------------------------
   6. 글
   ------------------------------------------------------------------ */

function renderArticleScreen(id) {
  /* 도감에서는 글 아래에 푼 문제도 접어 둔다. 학습 중에는 붙이지 않는다. */
  return page(`<div class="ex-article">${renderArticle(NODES[id], { withQuiz: true })}</div>`);
}

/* ------------------------------------------------------------------ */

const SCREENS = {
  home:     renderHome,
  worlds:   renderWorlds,
  concepts: renderConcepts,
  world:    renderWorld,
  concept:  renderConcept,
  cycle:    renderCycle,
  article:  renderArticleScreen,
};

function paint({ restore = false } = {}) {
  const mine = ++painting;
  const el = sheet();
  const top = topOf();
  el.innerHTML = SCREENS[top.screen](top.arg);
  /* 새 화면은 처음부터, 되돌아온 화면은 보던 자리부터 */
  el.scrollTop = restore ? (top.scroll || 0) : 0;

  /* 리스너는 매번 새로 그려지는 페이지에 건다.
     시트(#codex)에 걸면 화면을 옮길 때마다 쌓인다. */
  const pageEl = el.querySelector('.ex-page');

  pageEl.querySelector('.ex-back').addEventListener('click', back);

  const snd = pageEl.querySelector('.ex-sound');
  if (snd) snd.addEventListener('click', () => {
    unlock();                       /* 누른 김에 소리를 연다 */
    setMuted(!isMuted());
    snd.setAttribute('aria-pressed', String(!isMuted()));
    snd.querySelector('.ex-set-state').textContent = isMuted() ? '끔' : '켬';
    snd.setAttribute('aria-pressed', String(!isMuted()));
  });

  /* 초기화는 한 번 더 묻는다. 되돌릴 수 없는 일이다. */
  const reset = pageEl.querySelector('.ex-reset');
  const sure  = pageEl.querySelector('.ex-reset-sure');
  if (reset && sure) {
    const ask = (on) => {
      sure.hidden = !on;
      reset.querySelector('.ex-set-state').textContent = on ? '정말?' : '초기화';
      reset.classList.toggle('is-asking', on);
      if (on) sure.querySelector('.ex-reset-no').focus({ preventScroll: true });
    };
    reset.addEventListener('click', () => ask(sure.hidden));
    sure.querySelector('.ex-reset-no').addEventListener('click', () => ask(false));
    sure.querySelector('.ex-reset-yes').addEventListener('click', () => {
      clearProgress();
      /* 세계를 손으로 되돌리지 않는다. 처음부터 다시 연다. */
      location.replace(location.pathname + location.search);
    });
  }
  pageEl.querySelectorAll('.ex-thumb-img').forEach((img) => {
    img.addEventListener('error', () => { img.style.visibility = 'hidden'; });
  });

  pageEl.addEventListener('click', (e) => {
    const t = e.target.closest('[data-go]');
    if (t) go(t.dataset.go, t.dataset.arg);
  });

  /* 지금 어느 화면인지 이름을 붙인다 */
  const named = pageEl.querySelector('.ex-title, .ex-crumb, .article-title');
  pageEl.setAttribute('aria-label',
    named ? named.textContent.replace(/\s+/g, ' ').trim() : '백과사전');

  requestAnimationFrame(() => {
    if (mine !== painting) return;          /* 그 사이 화면이 또 바뀌었다 */
    pageEl.classList.add('is-in');

    /* 글이 다 자리를 잡은 뒤라야 보던 높이가 맞다 */
    if (restore && top.scroll) {
      el.scrollTop = Math.min(top.scroll, Math.max(0, el.scrollHeight - el.clientHeight));
    }

    /* 초점과 스크롤이 서로 싸우지 않게, 초점은 스크롤을 건드리지 않고 옮긴다.
       고르던 것이 사라졌으면 화면의 시작점으로 간다. */
    const want = restore && top.focus ? pageEl.querySelector(top.focus) : null;
    if (want) want.focus({ preventScroll: true });
    else focusStart(el);
  });
}

/** 도감을 연다. 지나온 길은 지우지 않는다.
 *  세계 탭에 잠깐 다녀와도 보던 화면과 자리가 그대로다.
 *
 *  @param {object} o
 *  @param {Function} o.onExit  홈에서 뒤로 갈 때 — 세계로 돌아간다 */
export async function openCodex({ onExit: exit, trail } = {}) {
  onExit = exit;
  if (trail) {
    const want = trail.filter((t) => SCREENS[t.screen]);
    stack = want.length
      ? want.map((t, i) => {
          const had = stack[i];
          return (had && had.screen === t.screen && had.arg === t.arg) ? had : madeOf(t);
        })
      : [{ screen: 'home' }];
  }
  paint({ restore: true });
  /* 도감은 모달이 아니다. 아래 메뉴는 열려 있는 동안에도 쓸 수 있다.
     뒤에 남은 세계의 질문만 초점에서 뺀다. */
  blockWorld(true);
  await openSheet(sheet(), { modal: false, focus: false });
  const t = topOf();
  const want = t.focus ? sheet().querySelector(t.focus) : null;
  if (want) want.focus({ preventScroll: true }); else focusStart(sheet());
}

export async function closeCodex() {
  remember();
  await closeSheet(sheet());
  blockWorld(false);
}

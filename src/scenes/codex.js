/* 백과사전 — 알아낸 세계와 원리의 기록.

   질문 → 세계 → 원리 세 축을 오가는 작은 아카이브.
   화면 하나를 갈아 끼우는 방식이고, 뒤로 가기는 스택으로 되돌린다. */

import { openSheet, closeSheet, br } from '../core/sheet.js';
import { NODES, CONCEPTS } from '../data/nodes.js';
import {
  WORLDS, WORLD_ORDER, WORLD_TOTAL, CONCEPT_TOTAL,
  CONCEPT_META, CONCEPT_ORDER, worldFound, conceptFound,
  foundWorlds, foundConcepts, worldCount, conceptQuestions, conceptName,
} from '../data/library.js';
import { state, isSolved } from '../core/state.js';
import { CYCLES, closedCycles } from '../data/cycles.js';
import { thumb } from '../art/plates.js';
import { mark, ring } from '../art/marks.js';
import { renderArticle } from './article.js';
import { badgeArt, hasBadge } from './cycle.js';
import { isMuted, setMuted, unlock } from '../core/sound.js';
import { clearProgress } from '../core/state.js';

const sheet = () => document.getElementById('codex');

const ARROW = `<svg class="ex-arrow" viewBox="0 0 24 12" aria-hidden="true">
    <path d="M1 6h21M17 1.5 22.5 6 17 10.5" fill="none" stroke="currentColor"
          stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const LOCK = `<svg class="ex-lock" viewBox="0 0 16 18" aria-hidden="true">
    <rect x="2.2" y="7.5" width="11.6" height="9" rx="1.4" fill="none"
          stroke="currentColor" stroke-width="1.3"/>
    <path d="M5 7.5V5a3 3 0 0 1 6 0v2.5" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>`;

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

let stack = [];
let onExit = null;

const go   = (screen, arg) => { stack.push({ screen, arg }); paint(); };
const back = () => { stack.pop(); stack.length ? paint() : onExit && onExit(); };

/* ------------------------------------------------------------------
   공통 조각
   ------------------------------------------------------------------ */

const page = (backLabel, inner) => `
  <div class="ex-page">
    <button class="ex-back" type="button">
      <svg viewBox="0 0 20 14" aria-hidden="true"><path d="M19 7H1M7 1 1 7l6 6"
        fill="none" stroke="currentColor" stroke-width="1.4"
        stroke-linecap="round" stroke-linejoin="round"/></svg>
      <span>${backLabel}</span>
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
    return `<li class="ex-row is-locked">
        <span class="ex-row-lock">${LOCK}</span>
        <p class="ex-row-title">${br(n.label)}</p>
        ${ARROW}
      </li>`;
  }
  return `<li class="ex-row" data-go="article" data-arg="${id}" role="button" tabindex="0">
      <span class="ex-thumb">${thumb(n.article.plate)}</span>
      <p class="ex-row-title">${br(n.label)}</p>
      ${ARROW}
    </li>`;
}

/** 배지 한 칸. 그림이 아직이면 같은 자리에 고리 도식이 들어간다. */
function badgeRow(id) {
  const c = CYCLES[id];
  return `<li class="ex-badge" data-go="cycle" data-arg="${id}"
              role="button" tabindex="0">
      <span class="ex-badge-art">${badgeArt(c, { small: true })}</span>
      <span class="ex-badge-text">
        <span class="ex-badge-name">${c.title}</span>
        <span class="ex-badge-en">${c.en}</span>
      </span>
      ${ARROW}
    </li>`;
}

/* ------------------------------------------------------------------
   1. 백과사전 홈
   ------------------------------------------------------------------ */

function renderHome() {
  const recent = [...state.solvedOrder].reverse();
  const locked = Object.keys(NODES).filter((id) => !isSolved(id));
  const cycles = closedCycles();

  const block = (n, kicker, name, found, total, art, target) => `
    <button class="ex-block" type="button" data-go="${target}">
      <span class="ex-block-no">${two(n)}</span>
      <span class="ex-block-art">${art}</span>
      <span class="ex-block-text">
        <span class="ex-block-kicker">${kicker}</span>
        <span class="ex-block-name">${name}</span>
        <span class="ex-block-count">${found} / ${total}</span>
      </span>
      ${ARROW}
    </button>`;

  return page('백과사전', `
    ${title('', '알아낸 세계와 원리의 기록', '호기심이 만들어내는, 더 넓은 세상의 지도.')}

    <div class="ex-blocks">
      ${block(1, '발견한 세계', '세계', foundWorlds().length, WORLD_TOTAL,
              `<span class="ex-block-img">${thumb('cloud')}</span>`, 'worlds')}
      ${block(2, '발견한 원리', '원리', foundConcepts().length, CONCEPT_TOTAL,
              ORBIT, 'concepts')}
    </div>

    ${cycles.length ? `
      <section class="ex-section">
        <div class="ex-section-head">
          <h3 class="ex-section-title">발견한 순환</h3>
          <span class="ex-section-note">한 바퀴가 닫힌 것</span>
        </div>
        <ul class="ex-badges">${cycles.map(badgeRow).join('')}</ul>
      </section>` : ''}

    ${recent.length ? `
      <section class="ex-section">
        <h3 class="ex-section-title">최근 발견</h3>
        <ul class="ex-list">${recent.map((id) => questionRow(id)).join('')}</ul>
      </section>` : ''}

    ${locked.length ? `
      <section class="ex-section">
        <div class="ex-section-head">
          <h3 class="ex-section-title">더 알아볼 것</h3>
          <span class="ex-section-note">아직 발견하지 못한 주제</span>
        </div>
        <ul class="ex-list">${locked.map((id) => questionRow(id, { locked: true })).join('')}</ul>
      </section>` : ''}

    ${settings()}

    ${MADE}
  `);
}

/* ------------------------------------------------------------------
   2. 세계 목록
   ------------------------------------------------------------------ */

function worldRow(id) {
  const w = WORLDS[id];
  const found = worldFound(id);
  const c = worldCount(id);
  if (!found) {
    return `<li class="ex-entry is-locked">
        <span class="ex-entry-art">${w.plate ? thumb(w.plate) : ''}</span>
        <span class="ex-entry-text">
          <span class="ex-entry-name">${LOCK}${w.title}</span>
          <span class="ex-entry-lead">${br(w.lead)}</span>
        </span>
        ${ARROW}
      </li>`;
  }
  return `<li class="ex-entry" data-go="world" data-arg="${id}" role="button" tabindex="0">
      <span class="ex-entry-art">${thumb(w.plate)}</span>
      <span class="ex-entry-text">
        <span class="ex-entry-name">${w.title}</span>
        <span class="ex-entry-lead">${br(w.lead)}</span>
        <span class="ex-entry-meta">질문 ${c.questions} · 원리 ${c.concepts}</span>
      </span>
      ${ARROW}
    </li>`;
}

function renderWorlds() {
  const found = WORLD_ORDER.filter(worldFound);
  const rest  = WORLD_ORDER.filter((id) => !worldFound(id));
  return page('세계', `
    ${title('', '발견한 현상과 존재', '')}
    <ul class="ex-entries">${found.map(worldRow).join('')}</ul>
    ${rest.length ? `
      <h3 class="ex-section-title ex-section-title--gap">아직 더 열릴 세계</h3>
      <ul class="ex-entries">${rest.map(worldRow).join('')}</ul>` : ''}
  `);
}

/* ------------------------------------------------------------------
   3. 세계 상세
   ------------------------------------------------------------------ */

function renderWorld(id) {
  const w = WORLDS[id];
  const qs = w.questions.filter(isSolved);
  const cs = w.concepts.filter(conceptFound);
  return page('세계', `
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
          ${cs.map((c) => `<li data-go="concept" data-arg="${c}" role="button" tabindex="0">
              ${conceptName(c)}${ARROW}</li>`).join('')}
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
    return `<li class="ex-entry is-locked">
        <span class="ex-entry-art">${mark(id)}</span>
        <span class="ex-entry-text">
          <span class="ex-entry-name">${LOCK}${c.name}</span>
          <span class="ex-entry-lead">${br(m.lead)}</span>
        </span>
        ${ARROW}
      </li>`;
  }
  return `<li class="ex-entry" data-go="concept" data-arg="${id}" role="button" tabindex="0">
      <span class="ex-entry-art">${mark(id)}</span>
      <span class="ex-entry-text">
        <span class="ex-entry-name">${c.name}</span>
        <span class="ex-entry-lead">${br(m.lead)}</span>
        <span class="ex-entry-meta">${c.en}</span>
      </span>
      ${ARROW}
    </li>`;
}

function renderConcepts() {
  const found = CONCEPT_ORDER.filter(conceptFound);
  const rest  = CONCEPT_ORDER.filter((id) => !conceptFound(id));
  return page('원리', `
    ${title('', '알아낸 원리', '')}
    <ul class="ex-entries">${found.map(conceptRow).join('')}</ul>
    ${rest.length ? `
      <h3 class="ex-section-title ex-section-title--gap">아직 더 열릴 원리</h3>
      <ul class="ex-entries">${rest.map(conceptRow).join('')}</ul>` : ''}
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

  const rel = (cls, kicker, body, go, arg) => `
    <div class="ex-rel ${cls}"${go ? ` data-go="${go}" data-arg="${arg}" role="button" tabindex="0"` : ''}>
      <span class="ex-rel-dot"></span>
      <p class="ex-rel-kicker">${kicker}</p>
      <p class="ex-rel-body">${br(body)}</p>
      ${go ? ARROW : ''}
    </div>`;

  return page('원리', `
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

function renderCycle(id) {
  const c = CYCLES[id];
  const qs = c.requiredNodes.filter(isSolved);
  return page('백과사전', `
    <p class="ex-crumb">순환 <span>/</span> ${c.title}</p>
    ${hasBadge(c) ? `<div class="ex-hero ex-hero--badge">${badgeArt(c)}</div>` : ''}
    <h2 class="ex-title ex-title--detail">${c.title}</h2>
    <p class="ex-lead">${br(c.lead)}</p>

    <section class="ex-section">
      <h3 class="ex-section-title">한 바퀴</h3>
      <div class="ex-ring">${ring(c.ring)}</div>
      <p class="ex-ring-line">${[...c.ring, c.ring[0]].join(' → ')}</p>
    </section>

    <section class="ex-section">
      <h3 class="ex-section-title">이 고리를 이룬 질문</h3>
      <ul class="ex-list">${qs.map((q) => questionRow(q)).join('')}</ul>
    </section>
  `);
}

/* ------------------------------------------------------------------
   6. 글
   ------------------------------------------------------------------ */

function renderArticleScreen(id) {
  return page('백과사전', `<div class="ex-article">${renderArticle(NODES[id])}</div>`);
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

function paint() {
  const el = sheet();
  const top = stack[stack.length - 1];
  el.innerHTML = SCREENS[top.screen](top.arg);
  el.scrollTop = 0;

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

  const act = (e) => {
    const t = e.target.closest('[data-go]');
    if (!t) return;
    if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
    if (e.type === 'keydown') e.preventDefault();
    go(t.dataset.go, t.dataset.arg);
  };
  pageEl.addEventListener('click', act);
  pageEl.addEventListener('keydown', act);

  requestAnimationFrame(() => pageEl.classList.add('is-in'));
}

/** @param {object} o
 *  @param {Function} o.onExit  홈에서 뒤로 갈 때 — 세계로 돌아간다 */
export async function openCodex({ onExit: exit } = {}) {
  onExit = exit;
  stack = [{ screen: 'home' }];
  paint();
  await openSheet(sheet());
}

export async function closeCodex() {
  await closeSheet(sheet());
  stack = [];
}

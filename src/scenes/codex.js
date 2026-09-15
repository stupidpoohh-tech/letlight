/* 도감 — 손으로 모은 기록.
   이번 프로토타입에서는 한 장을 제대로 만든다. */

import { openSheet, closeSheet, br } from '../core/sheet.js';
import { ENTRIES, ENTRY_ORDER, CONCEPTS } from '../data/knowledge.js';
import { plate } from '../art/plates.js';

const sheet = () => document.getElementById('codex');

function renderIndex(state) {
  const rows = ENTRY_ORDER.map((key, i) => {
    const e = ENTRIES[key];
    const open = e && state.discovered.has(key);
    if (!open) {
      return `<li class="codex-row is-locked">
          <div class="codex-thumb">${plate('unknown')}</div>
          <div>
            <p class="codex-row-name">???</p>
            <p class="codex-row-en">아직 발견하지 않음</p>
          </div>
        </li>`;
    }
    return `<li class="codex-row" data-entry="${e.id}" role="button" tabindex="0">
        <div class="codex-thumb">${plate(e.plate)}</div>
        <div>
          <p class="codex-row-name">${e.name}</p>
          <p class="codex-row-en">${e.en}</p>
        </div>
      </li>`;
  }).join('');

  const found = ENTRY_ORDER.filter((k) => ENTRIES[k] && state.discovered.has(k)).length;

  return `<div class="codex-inner">
      <div class="codex-head">
        <h2 class="codex-title">백과사전</h2>
        <span class="codex-count">${found} / ${ENTRY_ORDER.length}</span>
      </div>
      <ul class="codex-list">${rows}</ul>
      <p class="footnote">알아낸 것만 이 책에 남는다.</p>
    </div>`;
}

function renderEntry(e) {
  const concept = CONCEPTS[e.concept];
  const unknown = e.unknown.map((t) => `<li><span>???</span>${t}</li>`).join('');

  return `<div class="codex-inner">
      <button class="entry-back" type="button">← 백과사전</button>

      <div class="plate">
        ${plate(e.plate)}
        <p class="plate-cap">${e.caption}</p>
      </div>

      <h2 class="entry-name">${e.name}</h2>
      <p class="entry-en">${e.en}</p>

      <div class="field">
        <p class="field-label">처음 발견한 질문</p>
        <p class="field-body quote">${br(e.foundBy)}</p>
      </div>

      <div class="field">
        <p class="field-label">핵심 지식</p>
        <p class="field-body">${br(e.core)}</p>
      </div>

      ${concept ? `<div class="field">
        <p class="field-label">발견한 개념</p>
        <p class="field-body">${concept.name}<br>
          <span class="field-en">${concept.en}</span></p>
      </div>` : ''}

      <div class="rule"></div>

      <div class="field">
        <p class="field-label">아직 알아내지 못한 것</p>
        <ul class="unknown-list">${unknown}</ul>
      </div>

      <p class="footnote">${e.footnote}</p>
    </div>`;
}

let onLeave = null;

export async function openCodex(state, { onClose } = {}) {
  const el = sheet();
  onLeave = onClose;

  const showIndex = () => {
    el.innerHTML = renderIndex(state);
    el.scrollTop = 0;
    el.querySelectorAll('.codex-row[data-entry]').forEach((row) => {
      const go = () => showEntry(ENTRIES[row.dataset.entry]);
      row.addEventListener('click', go);
      row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
      });
    });
  };

  const showEntry = (e) => {
    el.innerHTML = renderEntry(e);
    el.scrollTop = 0;
    el.querySelector('.entry-back').addEventListener('click', showIndex);
  };

  showIndex();

  /* 가장 최근에 발견한 것이 있으면 그 장을 바로 편다 */
  if (state.justFound && ENTRIES[state.justFound]) {
    showEntry(ENTRIES[state.justFound]);
    state.justFound = null;
  }

  await openSheet(el);
}

export async function closeCodex() {
  await closeSheet(sheet());
  if (onLeave) onLeave();
}

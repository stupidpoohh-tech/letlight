/* 도감 — 알아낸 것만 이 책에 남는다.
   완료율도, 경험치도 표시하지 않는다. */

import { openSheet, closeSheet } from '../core/sheet.js';
import { NODES, NODE_ORDER, CONCEPTS } from '../data/nodes.js';
import { isSolved } from '../core/state.js';
import { renderArticle } from './article.js';
import { plate } from '../art/plates.js';

const sheet = () => document.getElementById('codex');

function renderIndex() {
  const rows = NODE_ORDER.map((id) => {
    const node = NODES[id];
    if (!isSolved(id)) {
      return `<li class="codex-row is-locked">
          <div class="codex-thumb">${plate('unknown')}</div>
          <div>
            <p class="codex-row-name">???</p>
            <p class="codex-row-en">아직 알아내지 않음</p>
          </div>
        </li>`;
    }
    const c = CONCEPTS[node.concept];
    return `<li class="codex-row" data-node="${id}" role="button" tabindex="0">
        <div class="codex-thumb">${plate(node.article.plate)}</div>
        <div>
          <p class="codex-row-name">${node.label.split('\n').join(' ')}</p>
          <p class="codex-row-en">${c ? c.name : ''}</p>
        </div>
      </li>`;
  }).join('');

  return `<div class="codex-inner">
      <div class="codex-head">
        <h2 class="codex-title">백과사전</h2>
      </div>
      <ul class="codex-list">${rows}</ul>
      <p class="footnote">알아낸 것만 이 책에 남는다.</p>
    </div>`;
}

function renderEntry(node) {
  return `<div class="codex-inner">
      <button class="entry-back" type="button">← 백과사전</button>
      <div class="plate">${plate(node.article.plate)}</div>
      ${renderArticle(node)}
    </div>`;
}

let onLeave = null;

export async function openCodex({ onClose } = {}) {
  const el = sheet();
  onLeave = onClose;

  const showIndex = () => {
    el.innerHTML = renderIndex();
    el.scrollTop = 0;
    el.querySelectorAll('.codex-row[data-node]').forEach((row) => {
      const go = () => showEntry(NODES[row.dataset.node]);
      row.addEventListener('click', go);
      row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
      });
    });
  };

  const showEntry = (node) => {
    el.innerHTML = renderEntry(node);
    el.scrollTop = 0;
    el.querySelector('.entry-back').addEventListener('click', showIndex);
  };

  showIndex();
  await openSheet(el);
}

export async function closeCodex() {
  await closeSheet(sheet());
  if (onLeave) onLeave();
}

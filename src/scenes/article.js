/* 지식 — 알아낸 것을 읽는 자리.
   이 화면에서는 글이 주인공이다. */

import { openSheet, closeSheet, chrome, br } from '../core/sheet.js';
import { CONCEPTS } from '../data/nodes.js';
import { CONCEPT_META } from '../data/library.js';
import { plate } from '../art/plates.js';
import { hasExitQuiz } from './quiz.js';

const sheet = () => document.getElementById('article');

/* 승인본의 소제목(### )과 강조(**…**)를 그대로 살린다 */
const fmt = (t) => br(t).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

const block = (t) => (t.startsWith('### ')
  ? `<h3 class="article-h">${fmt(t.slice(4))}</h3>`
  : `<p>${fmt(t)}</p>`);

export function renderArticle(node) {
  const ids = [].concat(node.concept || []);
  const found = ids.map((id) => CONCEPTS[id]).filter(Boolean);
  const linked = ids
    .flatMap((id) => (CONCEPT_META[id] ? CONCEPT_META[id].siblings : []))
    .slice(0, 3);

  const art = plate(node.article.plate);

  return `
    ${linked.length ? `<p class="article-rel">
        <b>연결 원리</b><span>|</span>${linked.join(' · ')}</p>` : ''}

    ${art ? `<div class="article-plate">${art}</div>` : ''}

    <h2 class="article-title">${br(node.article.title)}</h2>
    ${found.map((c) => `
      <p class="article-concept">${c.name}</p>
      <p class="article-concept-en">${c.en}</p>`).join('')}

    <div class="article-rule"></div>

    <div class="article-body">
      ${node.article.body.map(block).join('')}
    </div>`;
}

/** 문제를 맞힌 뒤 읽는다.
    다 읽으면 세계로 돌아가거나, 한 번 더 생각해 본다. */
export function openArticle(node) {
  const el = sheet();
  const next = hasExitQuiz(node);
  el.innerHTML = `
    <div class="article-inner">
      ${renderArticle(node)}
      <div class="article-foot">
        <button class="quiet-action is-on" type="button">${
          next ? '한 번 더 생각해보기' : '세계로 돌아가기'}</button>
      </div>
    </div>`;

  return new Promise(async (resolve) => {
    chrome(false);
    await openSheet(el);
    el.querySelector('.quiet-action').addEventListener('click', async () => {
      /* 문제가 한 번 더 남았으면 세계의 것들을 다시 꺼내지 않는다 */
      chrome(!next);
      await closeSheet(el);
      resolve();
    }, { once: true });
  });
}

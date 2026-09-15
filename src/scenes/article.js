/* 지식 — 알아낸 것을 읽는 자리.
   모달 카드가 아니라, 세계 위로 조용히 올라오는 한 편의 글. */

import { openSheet, closeSheet, chrome, br } from '../core/sheet.js';
import { CONCEPTS } from '../data/nodes.js';

const sheet = () => document.getElementById('article');

export function renderArticle(node, { concept = true } = {}) {
  const c = CONCEPTS[node.concept];
  return `
    <h2 class="article-title">${br(node.article.title)}</h2>
    ${c ? `<p class="article-concept">${c.name}<span>${c.en}</span></p>` : ''}
    <div class="article-body">
      ${node.article.body.map((t) => `<p>${br(t)}</p>`).join('')}
    </div>`;
}

/** 문제를 맞힌 뒤 읽는다. 다 읽으면 세계로 돌아간다. */
export function openArticle(node) {
  const el = sheet();
  el.innerHTML = `
    <div class="article-inner">
      ${renderArticle(node)}
      <div class="article-foot">
        <button class="quiet-action is-on" type="button">세계로 돌아가기</button>
      </div>
    </div>`;

  return new Promise(async (resolve) => {
    chrome(false);
    await openSheet(el);
    el.querySelector('.quiet-action').addEventListener('click', async () => {
      chrome(true);
      await closeSheet(el);
      resolve();
    }, { once: true });
  });
}

/* 보이ㄷㅏ — Let There Be Light
   First Playable Prototype

   알수록 보이ㄷㅏ */

import { wait } from './core/anim.js';
import { state, solvedIds } from './core/state.js';
import { runOpening } from './scenes/opening.js';
import { mountWorld, showNode, wireNodes, hideNodes } from './scenes/world.js';
import { openCodex, closeCodex } from './scenes/codex.js';

const nav = document.getElementById('nav');
const navItems = [...nav.querySelectorAll('.nav-item')];
const codexBtn = navItems.find((b) => b.dataset.view === 'codex');

let view = 'world';
let switching = false;

async function goto(next) {
  if (switching || next === view) return;
  switching = true;
  navItems.forEach((b) => b.classList.toggle('is-active', b.dataset.view === next));

  if (next === 'codex') {
    view = 'codex';
    hideNodes(true);
    await openCodex({ onClose: () => hideNodes(false) });
    codexBtn.classList.remove('is-fresh');
  } else {
    view = 'world';
    await closeCodex();
  }
  switching = false;
}

nav.addEventListener('click', (e) => {
  const b = e.target.closest('.nav-item');
  if (b) goto(b.dataset.view);
});

async function start() {
  /* 도감에 새로 들어온 것이 있음을 아주 조용히 알린다 */
  mountWorld({ onStateChange: () => {
    if (solvedIds().length) codexBtn.classList.add('is-fresh');
  }});

  const skip = location.hash.includes('skip');

  if (skip) {
    document.getElementById('veil').style.opacity = '0';
    document.getElementById('world-layer').style.setProperty('--mr', '400vmax');
    document.getElementById('opening').remove();
  } else {
    await runOpening();
  }
  state.openingComplete = true;

  /* UI 는 세계가 자리를 잡은 뒤에야 조용히 올라온다 */
  await wait(skip ? 200 : 1200);
  nav.classList.add('is-on');
  nav.setAttribute('aria-hidden', 'false');

  wireNodes();

  /* 세계가 완전히 드러난 뒤 잠시 아무 일도 일어나지 않는다 */
  await showNode('cloudWhite', { delay: skip ? 500 : 1900 });
}

start();

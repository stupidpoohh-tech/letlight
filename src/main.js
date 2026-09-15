/* 보이ㄷㅏ — Let There Be Light
   First Playable Prototype

   알수록 보이ㄷㅏ */

import { installDefs } from './art/defs.js';
import { wait } from './core/anim.js';
import { runOpening } from './scenes/opening.js';
import { mountWorld, bloomQuestions, wireQuestions, hideNodes } from './scenes/world.js';
import { openCodex, closeCodex } from './scenes/codex.js';

const state = {
  discovered: new Set(['light']),   // 빛은 오프닝에서 이미 관측되었다
  solved: new Set(),
  justFound: null,
  view: 'world',
};

const nav = document.getElementById('nav');
const navItems = [...nav.querySelectorAll('.nav-item')];

function setNavView(view) {
  navItems.forEach((b) => b.classList.toggle('is-active', b.dataset.view === view));
}

let switching = false;

async function goto(view) {
  if (switching || view === state.view) return;
  switching = true;
  setNavView(view);

  if (view === 'codex') {
    state.view = 'codex';
    hideNodes(true);
    await openCodex(state, { onClose: () => hideNodes(false) });
    navItems.find((b) => b.dataset.view === 'codex').classList.remove('is-fresh');
  } else {
    state.view = 'world';
    await closeCodex();
  }
  switching = false;
}

nav.addEventListener('click', (e) => {
  const b = e.target.closest('.nav-item');
  if (b) goto(b.dataset.view);
});

async function start() {
  installDefs();
  mountWorld();

  const skip = location.hash.includes('skip');

  if (skip) {
    document.getElementById('veil').style.opacity = '0';
    document.getElementById('world-layer').style.setProperty('--mr', '400vmax');
    document.getElementById('opening').remove();
  } else {
    await runOpening();
  }

  /* UI 는 세계가 자리를 잡은 뒤에야 조용히 올라온다 */
  await wait(skip ? 200 : 1200);
  nav.classList.add('is-on');
  nav.setAttribute('aria-hidden', 'false');

  wireQuestions({
    state,
    onDiscovery: () => {
      navItems.find((b) => b.dataset.view === 'codex').classList.add('is-fresh');
    },
  });

  /* 월드가 완전히 등장한 후 잠시 아무 일도 일어나지 않는다 */
  await bloomQuestions(['skyBlue', 'cloudWhite', 'shadow'],
                       { first: skip ? 600 : 2600, gap: 1800 });
}

start();

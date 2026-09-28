/* 읽다 만 자리.

   알아낸 질문은 state.js 가 하나의 목록으로 들고 있다. 여기는 그것과 별개로,
   아직 끝나지 않은 질문들이 각각 어디까지 갔는지를 기억한다.
   갈래가 둘로 나뉘어도 서로의 자리를 덮어쓰지 않는다.

   세계의 모습은 저장하지 않는다. 그것은 지금까지처럼 알아낸 질문에서
   되짚어 낸다. 상태를 두 군데에 두지 않는 원칙은 그대로다.

   저장을 막아 둔 브라우저에서도 앱이 멈추지 않아야 한다.
   그래서 읽고 쓰는 모든 자리를 감싸 두고, 실패하면 기억이 없는 것처럼 군다. */

import { NODES } from '../data/nodes.js';

const KEY = 'boida.resume.v1';
const VERSION = 1;

/* 한 질문을 지나는 동안 거치는 자리 */
export const STEP = {
  quiz:    'quiz',     // 들어가는 문제를 푸는 중
  article: 'article',  // 글을 읽는 중 (나오는 문제가 있으면 그 아래까지)
  door:    'door',     // 나오는 문제까지 맞혔고, 아직 세계로 돌아가지 않았다
};

const STEPS = new Set(Object.values(STEP));

let held = null;   // { [nodeId]: { step, scroll } }

function write() {
  try {
    if (!held || !Object.keys(held).length) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, JSON.stringify({ v: VERSION, nodes: held }));
  } catch (e) { /* 저장을 막아 둔 브라우저. 이번 판에서만 이어진다. */ }
}

/** 형태가 맞고, 아직 살아 있는 질문의 자리만 남긴다. */
function sift(raw, isSolved) {
  const out = {};
  if (!raw || typeof raw !== 'object' || raw.v !== VERSION) return out;
  const nodes = raw.nodes;
  if (!nodes || typeof nodes !== 'object') return out;

  for (const [id, d] of Object.entries(nodes)) {
    const node = NODES[id];
    if (!node || !d || typeof d !== 'object') continue;
    if (!STEPS.has(d.step)) continue;
    /* 이미 알아낸 질문의 기록은 남아 있을 이유가 없다 */
    if (isSolved && isSolved(id)) continue;
    /* 나오는 문제가 없는 질문은 그 단계로 갈 수 없다 */
    if (d.step === STEP.door && !node.exitQuiz) continue;
    out[id] = { step: d.step, scroll: Math.max(0, Number(d.scroll) || 0) };
  }
  return out;
}

function all(isSolved) {
  if (held) return held;
  let raw = null;
  try {
    const s = localStorage.getItem(KEY);
    raw = s ? JSON.parse(s) : null;
  } catch (e) { raw = null; }
  const kept = sift(raw, isSolved);
  held = kept;
  /* 버릴 것이 있었으면 그만큼 줄여서 다시 써 둔다 */
  if (raw && Object.keys((raw.nodes || {})).length !== Object.keys(kept).length) write();
  return held;
}

/** 이 질문을 어디까지 봤는가. 없으면 null. */
export function resumeOf(id, isSolved) {
  const d = all(isSolved)[id];
  return d ? { node: id, step: d.step, scroll: d.scroll } : null;
}

/** 읽다 만 질문이 하나라도 있는가 */
export const anyResume = (isSolved) => Object.keys(all(isSolved)).length > 0;

/** 지금 자리를 남긴다. 같은 값이면 쓰지 않는다. */
export function saveResume({ node, step, scroll = 0 }) {
  if (!node || !NODES[node] || !STEPS.has(step)) return;
  const map = all();
  const now = map[node];
  const next = { step, scroll: Math.max(0, Math.round(scroll)) };
  if (now && now.step === next.step && now.scroll === next.scroll) return;
  map[node] = next;
  write();
}

/** 읽던 자리만 고쳐 쓴다. 단계는 그대로 둔다. */
export function saveScroll(node, scroll) {
  const d = all()[node];
  if (!d) return;
  saveResume({ node, step: d.step, scroll });
}

/** 한 질문의 자리를 지운다. 이름이 없으면 전부 지운다. */
export function clearResume(node) {
  if (node === undefined) { held = {}; write(); return; }
  const map = all();
  if (!(node in map)) return;
  delete map[node];
  write();
}

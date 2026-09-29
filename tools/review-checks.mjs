/* 배포 후 점검에서 드러난 자리들을 다시 밟아 보는 검사.

   화면 없이 저장·복원만 본다. 브라우저에서 눈으로 볼 일(전환 중 누르기,
   뒤로 가기, 초점)은 여기서 다루지 않는다. 그쪽은 따로 확인한다.

   돌리는 법:  node tools/review-checks.mjs
*/

import { NODES, NODE_ORDER } from '../src/data/nodes.js';

/* ------------------------------------------------------------------
   기억을 흉내 낸다. 새 판을 열 때마다 모듈을 다시 읽어야
   메모리에 남은 값이 아니라 저장된 값에서 되살아나는지 볼 수 있다.
   ------------------------------------------------------------------ */

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};

let stamp = 0;
/** 새로 켠 판. 저장된 것만 들고 시작한다. */
const fresh = () => import(`../src/core/resume.js?v=${++stamp}`);

const KEY = 'boida.resume.v1';

/* ------------------------------------------------------------------
   검사 틀
   ------------------------------------------------------------------ */

const results = [];
const ok = (name, pass, note = '') => {
  results.push({ name, pass, note });
  console.log(`  ${pass ? '통과' : '실패'}  ${name}${note ? ` — ${note}` : ''}`);
};

const hasExit = (id) => Boolean(NODES[id].exitQuiz);

/* ------------------------------------------------------------------
   1. 콘텐츠 — 노드가 서로 이어지고, 정답이 보기 안에 있는가
   ------------------------------------------------------------------ */

console.log('1. 콘텐츠');
{
  const reach = new Set(['cloudWhite']);
  let added = true;
  while (added) {
    added = false;
    for (const id of [...reach]) {
      for (const next of [].concat(NODES[id].next || [])) {
        if (NODES[next] && !reach.has(next)) { reach.add(next); added = true; }
      }
    }
  }
  const lost = NODE_ORDER.filter((id) => !reach.has(id));
  ok('열한 질문에 모두 닿는다', lost.length === 0, lost.join(', '));

  const badKey = [];
  for (const id of NODE_ORDER) {
    for (const [what, q] of [['들어가는', NODES[id].quiz], ['나오는', NODES[id].exitQuiz]]) {
      if (!q) continue;
      const keys = q.choices.map((c) => c.key);
      if (!keys.includes(q.answer)) badKey.push(`${id}/${what}`);
      if (new Set(keys).size !== keys.length) badKey.push(`${id}/${what} 보기 중복`);
    }
  }
  ok('정답이 보기 안에 있다', badKey.length === 0, badKey.join(', '));
}

/* ------------------------------------------------------------------
   2. 읽다 만 자리 — 새로 켜도 그대로인가

   점검에서 드러난 자리: 나오는 문제가 없는 질문(treeForm · waterLatentHeat)은
   글을 여는 순간 door 를 저장하는데, 다시 켜면 그 기록이 통째로 버려졌다.
   ------------------------------------------------------------------ */

console.log('\n2. 읽다 만 자리');
{
  const lost = [];
  for (const id of NODE_ORDER) {
    store.clear();
    const a = await fresh();
    /* 글을 열면 article, 문이 열리면 door 를 남긴다 */
    a.saveResume({ node: id, step: a.STEP.article, scroll: 640 });
    if (!hasExit(id)) a.saveResume({ node: id, step: a.STEP.door, scroll: 640 });

    const b = await fresh();                 // 새로 켠다
    const back = b.resumeOf(id, () => false);
    if (!back || back.scroll !== 640) lost.push(id);
    else if (!hasExit(id) && back.step !== b.STEP.door) lost.push(`${id}(단계 ${back.step})`);
  }
  ok('열한 질문 모두 새 판에서 되살아난다', lost.length === 0, lost.join(', '));

  /* 나오는 문제가 없는 두 질문을 따로 한 번 더 */
  const noExit = NODE_ORDER.filter((id) => !hasExit(id));
  const kept = [];
  for (const id of noExit) {
    store.clear();
    const a = await fresh();
    a.saveResume({ node: id, step: a.STEP.door, scroll: 300 });
    const b = await fresh();
    const back = b.resumeOf(id, () => false);
    kept.push(`${id}:${back ? back.step : '없음'}`);
  }
  ok('나오는 문제가 없는 질문의 door 기록이 남는다',
    kept.every((s) => s.endsWith(':door')), kept.join(' '));
}

/* ------------------------------------------------------------------
   3. 접기와 읽던 높이

   점검에서 드러난 자리: 글을 다시 열 때 저장하면서 folds 를 빠뜨렸고,
   단계가 바뀔 때 scroll 을 0 으로 덮었다.
   ------------------------------------------------------------------ */

console.log('\n3. 접기와 읽던 높이');
{
  const id = 'rainStart';
  store.clear();
  let a = await fresh();
  a.saveResume({ node: id, step: a.STEP.article, scroll: 1200, folds: [0] });

  /* 다시 들어와 같은 자리를 한 번 더 적는다 — 펼친 대목을 잃지 않아야 한다 */
  const mine = a.resumeOf(id, () => false);
  a.saveResume({ node: id, step: a.STEP.article, scroll: mine.scroll, folds: mine.folds });
  let back = (await fresh()).resumeOf(id, () => false);
  ok('다시 들어와도 펼친 대목이 남는다',
    back && String(back.folds) === '0' && back.scroll === 1200,
    back ? `folds=${back.folds} scroll=${back.scroll}` : '기록 없음');

  /* 단계만 바뀌어도 높이와 펼친 대목은 그대로여야 한다 */
  a = await fresh();
  const now = a.resumeOf(id, () => false);
  a.saveResume({ node: id, step: a.STEP.door, scroll: now.scroll, folds: now.folds });
  back = (await fresh()).resumeOf(id, () => false);
  ok('단계가 바뀌어도 높이와 펼친 대목이 남는다',
    back && back.step === 'door' && back.scroll === 1200 && String(back.folds) === '0',
    back ? `${back.step} scroll=${back.scroll} folds=${back.folds}` : '기록 없음');

  /* 본문이 바뀌면 높이는 다른 자리를 가리키므로 버린다 */
  store.clear();
  store.set(KEY, JSON.stringify({ v: 1, nodes: {
    [id]: { step: 'article', scroll: 5000, folds: [0], len: 3 },
  } }));
  back = (await fresh()).resumeOf(id, () => false);
  ok('본문 길이가 달라진 옛 기록은 높이만 버린다',
    back && back.step === 'article' && back.scroll === 0 && back.folds.length === 0,
    back ? `scroll=${back.scroll}` : '기록 없음');
}

/* ------------------------------------------------------------------
   4. 갈래가 둘일 때 서로 덮지 않는가
   ------------------------------------------------------------------ */

console.log('\n4. 두 갈래');
{
  store.clear();
  const a = await fresh();
  a.saveResume({ node: 'seedWater', step: a.STEP.article, scroll: 800, folds: [0] });
  a.saveResume({ node: 'waterInfiltration', step: a.STEP.quiz });
  const b = await fresh();
  const one = b.resumeOf('seedWater', () => false);
  const two = b.resumeOf('waterInfiltration', () => false);
  ok('두 갈래의 자리가 각각 남는다',
    one && one.scroll === 800 && two && two.step === 'quiz');

  /* 한쪽을 끝내면 그쪽만 지워진다 */
  const c = await fresh();
  c.clearResume('seedWater');
  const d = await fresh();
  ok('한쪽을 끝내도 다른 쪽은 남는다',
    !d.resumeOf('seedWater', () => false) && Boolean(d.resumeOf('waterInfiltration', () => false)));

  /* 이미 알아낸 질문의 기록은 되살리지 않는다 */
  const e = await fresh();
  ok('알아낸 질문의 기록은 되살리지 않는다',
    !e.resumeOf('waterInfiltration', (id) => id === 'waterInfiltration'));
}

/* ------------------------------------------------------------------
   5. 망가진 값이 들어 있어도 앱이 멈추지 않는가
   ------------------------------------------------------------------ */

console.log('\n5. 망가진 기록');
{
  const bad = [
    ['빈 값', ''],
    ['JSON 아님', '{{{'],
    ['판이 다름', JSON.stringify({ v: 99, nodes: { cloudWhite: { step: 'article' } } })],
    ['없는 질문', JSON.stringify({ v: 1, nodes: { 없는질문: { step: 'article' } } })],
    ['없는 단계', JSON.stringify({ v: 1, nodes: { cloudWhite: { step: '어디쯤' } } })],
    ['높이가 글자', JSON.stringify({ v: 1, nodes: { cloudWhite: { step: 'article', scroll: '아주', len: NODES.cloudWhite.article.body.length } } })],
    ['folds 가 글자', JSON.stringify({ v: 1, nodes: { cloudWhite: { step: 'article', folds: '01', len: NODES.cloudWhite.article.body.length } } })],
  ];
  const broke = [];
  for (const [what, raw] of bad) {
    store.clear();
    store.set(KEY, raw);
    try {
      const m = await fresh();
      const r = m.resumeOf('cloudWhite', () => false);
      if (r && (typeof r.scroll !== 'number' || Number.isNaN(r.scroll) || !Array.isArray(r.folds))) {
        broke.push(`${what}(모양)`);
      }
    } catch (e) { broke.push(`${what}(${e.message})`); }
  }
  ok('망가진 기록을 만나도 멈추지 않는다', broke.length === 0, broke.join(', '));
}

/* ------------------------------------------------------------------ */

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length}개 중 ${results.length - failed.length}개 통과`);
if (failed.length) {
  console.error('실패: ' + failed.map((r) => r.name).join(', '));
  process.exit(1);
}

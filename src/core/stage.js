/* 무대의 크기와 자리.

   PC 에서는 화면 전체가 아니라 가운데 놓인 모바일 폭의 틀 안에서 돌아간다.
   그래서 화면(viewport) 좌표가 아니라 무대 좌표로 재야 한다. */

export const stageEl = () => document.getElementById('stage');

export const stageRect = () => stageEl().getBoundingClientRect();

/** 화면 좌표를 무대 안의 좌표로 옮긴다 */
export function toStage(clientX, clientY) {
  const r = stageRect();
  return { x: clientX - r.left, y: clientY - r.top };
}

/** 무대 높이를 --vh 로 내보낸다. vh 는 화면 높이라 틀 안에서는 맞지 않는다. */
export function syncStageUnits() {
  const r = stageRect();
  document.documentElement.style.setProperty('--vh', `${(r.height / 100).toFixed(3)}px`);
}

/* 그림 파일의 자리.
   아직 올라오지 않은 그림이 있어도 화면이 깨지지 않게, 준비된 것만 기억해 둔다. */

export const GROWTH_STAGES = {
  sprout:    'assets/sprout.webp',      // 새싹
  youngTree: 'assets/young-tree.webp',  // 어린나무
};

const ready = new Set();

export function preload(paths) {
  paths.forEach((src) => {
    const img = new Image();
    img.onload = () => ready.add(src);
    img.src = src;
  });
}

export const isReady = (src) => ready.has(src);

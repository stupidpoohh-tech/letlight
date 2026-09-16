/* 그림 파일의 자리.
   아직 올라오지 않은 그림이 있어도 화면이 깨지지 않게, 준비된 것만 기억해 둔다. */

export const GROWTH_STAGES = {
  sprout:     'assets/sprout.webp',      // 새싹
  youngTree:  'assets/young-tree.webp',  // 어린나무
  matureTree: 'assets/mature-tree.webp', // 큰 나무
};

/* 비가 땅에 닿은 뒤. 그림이 아직 없으면 그 층은 조용히 빠진다. */
export const WATER_LAYERS = {
  soil: 'assets/soil-water.webp',    // 지표 아래의 물
  flow: 'assets/surface-flow.webp',  // 낮은 곳으로 모인 작은 물길
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

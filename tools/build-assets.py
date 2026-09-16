#!/usr/bin/env python3
"""올린 원본 그림을 게임이 쓸 수 있는 형태로 만든다.

  home.png    시안이라 상태바·톱니·하단바가 함께 그려져 있다.
              위쪽 UI 를 지우고, 아래쪽 하단바를 잘라 낸 배경을 만든다.
  cloudN.png  투명 여백을 잘라 내고 줄인다.

원본을 다시 올린 뒤에는 다시 돌려야 한다:

    python3 tools/build-assets.py
"""

from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets"

# home.png 시안에서 읽어 낸 경계
UI_TOP = 176            # 이 위로는 상태바와 톱니바퀴가 있다
CLEAN_X = (300, 560)    # 그 높이에서 UI 가 지나가지 않는 가로 구간
NAV_TOP = 1462      # 이 아래로는 시안의 하단바

WORLD_WIDTH = 1180
CLOUD_WIDTH = 760

# 자라는 단계.  { 만들어질 이름: 루트에 올린 원본 }
GROWTH = {
    "sprout":     "tree1.png",   # 새싹
    "young-tree": "tree2.png",   # 어린나무
    "mature-tree": "tree3.png",  # 큰 나무
}
GROWTH_WIDTH = 520


def build_world(src: Path, dst: Path):
    im = Image.open(src).convert("RGB")
    w, h = im.size

    # 위쪽 UI 를 덮는다. 그 자리는 균일한 크림색 띠이므로,
    # 같은 높이의 깨끗한 가로 구간을 옆으로 이어 붙이면 티가 나지 않는다.
    # (아래 띠를 세로로 반복하면 줄무늬가 생긴다)
    strip = im.crop((CLEAN_X[0], 0, CLEAN_X[1], UI_TOP))
    sw = CLEAN_X[1] - CLEAN_X[0]
    for x in range(0, w, sw):
        im.paste(strip, (x, 0))

    # 시안의 하단바를 잘라 낸다. 그 자리는 게임의 하단바가 덮는다.
    im = im.crop((0, 0, w, NAV_TOP))

    im = im.resize((WORLD_WIDTH, round(im.height * WORLD_WIDTH / w)), Image.LANCZOS)
    im.save(dst, "WEBP", quality=80, method=6)
    return im.size


def build_cutout(src: Path, dst: Path, max_width: int):
    """투명 여백을 잘라 내고 줄인다. 구름 · 씨앗 · 식물 모두 같은 방식이다."""
    im = Image.open(src).convert("RGBA")
    box = im.getchannel("A").getbbox()
    if box:
        im = im.crop(box)
    if im.width > max_width:
        im = im.resize((max_width, round(im.height * max_width / im.width)), Image.LANCZOS)
    im.save(dst, "WEBP", quality=84, method=6)
    return im.size


def main():
    OUT.mkdir(exist_ok=True)
    total = 0

    src = ROOT / "home.png"
    if src.exists():
        dst = OUT / "world.webp"
        size = build_world(src, dst)
        kb = dst.stat().st_size / 1024
        total += kb
        print(f"  {dst.name:16s} {size[0]}x{size[1]}  {kb:6.1f} KB"
              f"  (원본 {src.stat().st_size/1024/1024:.1f} MB)")

    jobs = [(ROOT / f"cloud{i}.png", OUT / f"cloud-{i}.webp", CLOUD_WIDTH) for i in range(1, 6)]
    jobs += [(ROOT / src, OUT / f"{name}.webp", GROWTH_WIDTH) for name, src in GROWTH.items()]

    missing = []
    for src, dst, width in jobs:
        if not src.exists():
            missing.append(src.name)
            continue
        size = build_cutout(src, dst, width)
        kb = dst.stat().st_size / 1024
        total += kb
        print(f"  {dst.name:24s} {size[0]}x{size[1]}  {kb:6.1f} KB"
              f"  (원본 {src.stat().st_size/1024/1024:.1f} MB)")

    print(f"합계 {total:.1f} KB")
    if missing:
        print("아직 없는 원본:", ", ".join(missing))


if __name__ == "__main__":
    main()

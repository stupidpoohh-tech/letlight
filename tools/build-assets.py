#!/usr/bin/env python3
"""올린 원본 그림을 게임이 쓸 수 있는 형태로 만든다.

  home.png    시안이라 상태바·톱니·하단바가 함께 그려져 있다.
              위쪽 UI 를 지우고, 아래쪽 하단바를 잘라 낸 배경을 만든다.
  cloudN.png  투명 여백을 잘라 내고 줄인다.

원본을 다시 올린 뒤에는 다시 돌려야 한다:

    python3 tools/build-assets.py
"""

from pathlib import Path
from PIL import Image, ImageFilter

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

# 강.  후보로 river1~5.png 를 올려 두었고, 그중 하나만 세계에 쓴다.
# 나머지는 지우지 않고 variant 후보로 남겨 둔다.
RIVER_MAIN = "river2.png"
RIVER_WIDTH = 640

# 보석함과 보석.  올려 주신 그림은 흰 바탕의 jpg 라서 바탕을 지워야 한다.
JEM_BOX = "jembox.jpg"
JEM_BOX_WIDTH = 900

JEMS = {
    "jem-drop":  "jem3.jpg",   # 물방울 · 파랑 — 물의 순환
    "jem-hex":   "jem4.jpg",   # 육각 · 금빛
    "jem-round": "jem1.jpg",   # 원 · 초록
    "jem-heart": "jem2.jpg",   # 하트 · 붉은빛
}
JEM_WIDTH = 300


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


def build_gem(src: Path, dst: Path, max_width: int):
    """흰 바탕 위에 그린 보석에서 바탕만 지운다.

    안쪽의 옅은 면까지 함께 지우면 보석에 구멍이 뚫린다.
    줄과 칸의 양 끝에서 안쪽으로 들어오는 방식으로,
    바깥의 흰 바탕만 골라 낸다."""
    import numpy as np

    im = Image.open(src).convert("RGB")
    a = np.asarray(im).astype(np.int16)
    ink = a.min(axis=2) < 243          # 그림이 있는 자리

    h, w = ink.shape
    cols = np.arange(w)[None, :]
    rows = np.arange(h)[:, None]

    def span(mask, axis):
        any_ = mask.any(axis=axis, keepdims=True)
        idx = np.where(axis == 1, cols, rows)
        first = np.where(mask, idx, 10**6).min(axis=axis, keepdims=True)
        last = np.where(mask, idx, -1).max(axis=axis, keepdims=True)
        return any_ & (idx >= first) & (idx <= last)

    inside = span(ink, 1) & span(ink, 0)   # 줄과 칸 양쪽에서 안쪽

    alpha = Image.fromarray((inside * 255).astype("uint8"), "L")
    alpha = alpha.filter(ImageFilter.GaussianBlur(1.2))   # 가장자리를 부드럽게

    out = im.convert("RGBA")
    out.putalpha(alpha)
    box = alpha.point(lambda v: 255 if v > 8 else 0).getbbox()
    if box:
        out = out.crop(box)
    if out.width > max_width:
        out = out.resize((max_width, round(out.height * max_width / out.width)), Image.LANCZOS)
    out.save(dst, "WEBP", quality=88, method=6)
    return out.size


def build_flat(src: Path, dst: Path, max_width: int):
    """바탕이 있는 그대로 줄이기만 한다. 보석함처럼 종이째 쓰는 그림."""
    im = Image.open(src).convert("RGB")
    if im.width > max_width:
        im = im.resize((max_width, round(im.height * max_width / im.width)), Image.LANCZOS)
    im.save(dst, "WEBP", quality=86, method=6)
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
    jobs += [(ROOT / RIVER_MAIN, OUT / "river.webp", RIVER_WIDTH)]


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

    # 보석함은 종이째, 보석은 바탕을 지워서
    extra = [(ROOT / JEM_BOX, OUT / "jem-box.webp", JEM_BOX_WIDTH, build_flat)]
    extra += [(ROOT / src, OUT / f"{name}.webp", JEM_WIDTH, build_gem)
              for name, src in JEMS.items()]
    for src, dst, width, fn in extra:
        if not src.exists():
            missing.append(src.name)
            continue
        size = fn(src, dst, width)
        kb = dst.stat().st_size / 1024
        total += kb
        print(f"  {dst.name:24s} {size[0]}x{size[1]}  {kb:6.1f} KB"
              f"  (원본 {src.stat().st_size/1024/1024:.1f} MB)")

    print(f"합계 {total:.1f} KB")
    if missing:
        print("아직 없는 원본:", ", ".join(missing))


if __name__ == "__main__":
    main()

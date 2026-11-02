"""Trace the real signature from signature-original-dark.jpg.

Blue ink on black -> ink mask -> skeleton -> ordered stroke polylines ->
SVG paths (left-to-right writing order, local ink thickness per stroke).

Outputs:
  src/data/signatureStrokes.js   (single source of truth for the app)
  src/assets/signature.svg       (static asset, same strokes)
  src/assets/debug-mask.png      (ink mask, for verification)
  src/assets/debug-skeleton.png  (centerlines, for verification)
"""
import re
import numpy as np
from PIL import Image
from skimage.morphology import skeletonize
from scipy import ndimage

SRC = "src/assets/signature-original-dark.jpg"
JS_OUT = "src/data/signatureStrokes.js"
SVG_OUT = "src/assets/signature.svg"
MIN_STROKE_PX = 40          # ignore dust / specks
RESAMPLE_EVERY = 12        # image px between path points
THRESHOLD = 80             # blue-channel ink threshold


def ink_mask():
    a = np.array(Image.open(SRC).convert("RGB"))
    mask = a[..., 2] > THRESHOLD
    # close tiny gaps in thin ink
    mask = ndimage.binary_closing(mask, iterations=2)
    return a.shape[:2], mask


def walk_multi(component_points):
    """Order skeleton pixels into as many clean sub-polylines as needed.

    Keeps walking from dead-ends / unvisited pixels so closed loops and
    dense cursive clusters get fully covered, not just one pass.
    Returns a list of ordered point lists.
    """
    pts = set(component_points)
    dirs = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]

    def neighbors(p):
        y, x = p
        return [(y + dy, x + dx) for dy, dx in dirs if (y + dy, x + dx) in pts]

    endpoints = [p for p in pts if len(neighbors(p)) == 1]

    polys = []
    unvisited = set(pts)
    # first pass starts from leftmost endpoint for natural order
    queue = sorted(endpoints, key=lambda p: (p[1], p[0])) + [p for p in pts]
    while unvisited:
        # next start: first queued point still unvisited, else any unvisited
        start = next((s for s in queue if s in unvisited),
                     min(unvisited, key=lambda p: (p[1], p[0])))
        path = [start]
        unvisited.discard(start)
        prev, cur = None, start
        while True:
            cand = [n for n in neighbors(cur) if n in unvisited]
            if not cand:
                break
            if prev is not None and len(cand) > 1:
                dy, dx = cur[0] - prev[0], cur[1] - prev[1]
                cand.sort(key=lambda n: (n[0] - cur[0]) * dy + (n[1] - cur[1]) * dx,
                          reverse=True)
            nxt = cand[0]
            unvisited.discard(nxt)
            prev, cur = cur, nxt
            path.append(nxt)
        if len(path) >= 8:
            polys.append(path)
    return polys


def resample(pts, every=RESAMPLE_EVERY):
    out = [pts[0]]
    last = pts[0]
    acc = 0.0
    for p in pts[1:]:
        d = ((p[0] - last[0]) ** 2 + (p[1] - last[1]) ** 2) ** 0.5
        acc += d
        if acc >= every:
            out.append(p)
            last = p
            acc = 0.0
    out.append(pts[-1])
    return out


def to_d(pts):
    """(y,x) image coords -> svg 'M ... L ...' (y is fine as-is, svg y-down)."""
    if len(pts) < 2:
        return None
    s = f"M {pts[0][1]} {pts[0][0]}"
    for y, x in pts[1:]:
        s += f" L {x} {y}"
    return s


def main():
    shape, mask = ink_mask()
    H, W = shape
    skel = skeletonize(mask)
    Image.fromarray((~mask).astype(np.uint8) * 255).save("src/assets/debug-mask.png")
    Image.fromarray((~skel).astype(np.uint8) * 255).save("src/assets/debug-skeleton.png")

    # per-stroke thickness: half-width = distance to background at skeleton px
    dist = ndimage.distance_transform_edt(mask)

    struct = np.ones((3, 3), dtype=int)
    labels, n = ndimage.label(skel, structure=struct)
    strokes = []
    for i in range(1, n + 1):
        comp_pts = np.argwhere(labels == i)
        if len(comp_pts) < MIN_STROKE_PX:
            continue
        polys = walk_multi([tuple(p) for p in comp_pts])
        if not polys:
            continue
        for walked in polys:
            ordered = resample(walked)
            if len(ordered) < 4:
                continue
            # orient each stroke top-left -> bottom-right, matching the
            # left-to-right writing flow (A→B→C→D→E)
            if sum(ordered[0]) > sum(ordered[-1]):
                ordered = ordered[::-1]
            thickness = float(np.median([dist[y, x] for y, x in ordered])) * 2
            strokes.append({
                "d": to_d(ordered),
                "w": max(3.0, min(14.0, thickness)),
                "first": ordered[0],   # (y, x)
                "last": ordered[-1],
                "npts": len(ordered),
                "pts": ordered,
            })

    # ---- writing order: A ladder, B slash, C cursive, D cluster, E flourish ----
    # Blocks identified geometrically; within each block strokes are chained
    # by pen continuity: the next stroke always starts closest to where the
    # previous one ended (that is how cursive fragments flow left-to-right).
    from math import hypot
    for s in strokes:
        xs = [p[1] for p in s["pts"]]
        ys = [p[0] for p in s["pts"]]
        s["cx"], s["cy"] = sum(xs) / len(xs), sum(ys) / len(ys)
        s["maxx"], s["miny"] = max(xs), min(ys)

    def block_of(s):
        # E: finishing flourish reaching the far top-right corner
        if s["last"][1] > 1300:
            return "E"
        # B: the single long connecting slash
        if s["npts"] >= 150:
            return "B"
        # A: top-left chevron ladder
        if s["maxx"] < 485 and s["miny"] < 400:
            return "A"
        # C vs D: cursive letter-line (ends in the upper half) vs loop/underline
        # (ends in the lower half). The pen writes the name line, then the loop.
        if s["last"][0] <= 470:
            return "C"
        return "D"
    blocks = {}
    for s in strokes:
        blocks.setdefault(block_of(s), []).append(s)

    def dist(a, b):
        return hypot(a[0] - b[0], a[1] - b[1])

    def chain(block, start_point):
        rem = list(block)
        cur = min(rem, key=lambda s: dist(s["first"], start_point))
        rem.remove(cur)
        out = [cur]
        while rem:
            cur = min(rem, key=lambda s: dist(s["first"], out[-1]["last"]))
            rem.remove(cur)
            out.append(cur)
        return out

    ordered = []
    prev_end = (0, 0)
    a = blocks.get("A", [])
    if a:
        top = min(a, key=lambda s: (s["first"][0], s["first"][1]))
        a_chained = chain(a, top["first"])
        ordered += a_chained
        prev_end = a_chained[-1]["last"]
    ordered += blocks.get("B", [])
    for key in ("C", "D"):
        bl = blocks.get(key, [])
        if bl:
            chained = chain(bl, prev_end)
            ordered += chained
            prev_end = chained[-1]["last"]
    e = blocks.get("E", [])
    if e:
        chained = chain(e, prev_end)
        ordered += chained
    strokes[:] = ordered
    print("block sizes:", {k: len(v) for k, v in sorted(blocks.items())})

    # ---- visual verification: render strokes on top of the ink mask ----
    from PIL import ImageDraw
    ref = Image.open("src/assets/debug-mask.png").convert("RGB")
    dr = ImageDraw.Draw(ref)
    for s in strokes:
        coords = []
        for part in s["d"].split(" M "):
            seg = [tuple(map(int, p.split())) for p in part.replace("M ", "").split(" L ")]
            coords.append(seg)
        for seg in coords:
            dr.line(seg, fill=(255, 0, 0), width=3)
    ref.save("src/assets/debug-trace-overlay.png")
    print(f"wrote src/assets/debug-trace-overlay.png (red = traced strokes over mask)")

    # ---- write JS module ----
    js = ["/* Auto-traced from signature-original-dark.jpg by trace_signature.py. */",
          f'export const SIGNATURE_VIEWBOX = "0 0 {W} {H}";', "", "export const SIGNATURE_STROKES = ["]
    for s in strokes:
        js.append(f"  {{ d: {s['d']!r}, w: {s['w']:.1f} }},")
    js.append("];")
    with open(JS_OUT, "w") as f:
        f.write("\n".join(js) + "\n")

    # ---- write static SVG ----
    svg = [f'<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}" fill="none" '
           f'xmlns="http://www.w3.org/2000/svg">']
    for s in strokes:
        svg.append(f'  <path class="sig-stroke" d="{s["d"]}" stroke="#ff5a3c" '
                   f'stroke-width="{s["w"]:.1f}" stroke-linecap="round" '
                   f'stroke-linejoin="round"/>')
    svg.append("</svg>")
    with open(SVG_OUT, "w") as f:
        f.write("\n".join(svg) + "\n")

    print(f"traced {len(strokes)} strokes "
          f"(total points: {sum(s['npts'] for s in strokes)})")


if __name__ == "__main__":
    main()

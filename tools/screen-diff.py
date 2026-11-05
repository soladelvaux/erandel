#!/usr/bin/env python3
"""Compares two folders of screenshots (same file names) and prints, per image, the share of pixels
that changed noticeably (any channel differs by more than 24 of 255) and the mean difference.
Writes side-by-side images (baseline | current) for the most changed ones into the output folder.
Usage: python3 tools/screen-diff.py BASELINE_DIR CURRENT_DIR OUT_DIR [threshold_percent]"""
import sys, os
from PIL import Image, ImageChops
base, cur, out = sys.argv[1:4]
limit = float(sys.argv[4]) if len(sys.argv) > 4 else 100
os.makedirs(out, exist_ok=True)
rows = []
for f in sorted(os.listdir(base)):
    if not f.endswith('.png') or not os.path.exists(os.path.join(cur, f)):
        continue
    a = Image.open(os.path.join(base, f)).convert('RGB'); b = Image.open(os.path.join(cur, f)).convert('RGB')
    if a.size != b.size:
        rows.append((f, 100.0, 255.0)); continue
    d = ImageChops.difference(a, b)
    px = list(d.getdata()) if hasattr(d, 'getdata') else []
    changed = sum(1 for p in px if max(p) > 24) / len(px) * 100
    mean = sum(sum(p) for p in px) / (len(px) * 3)
    rows.append((f, changed, mean))
    if changed >= limit:
        s = Image.new('RGB', (a.width * 2, a.height)); s.paste(a, (0, 0)); s.paste(b, (a.width, 0)); s.save(os.path.join(out, 'cmp-' + f))
for f, c, m in sorted(rows, key=lambda r: -r[1]):
    print(f'{c:6.1f}% changed  mean {m:5.1f}  {f}')

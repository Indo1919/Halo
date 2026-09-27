"""Halo brand geometry: ring mark, outlined wordmark, lockups. Pure functions returning SVG path data."""
import math, os, sys
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FONT = os.path.join(ROOT, 'assets/fonts/Geist-Variable-latin.ttf')

INK, SIGNAL, CANVAS, WHITE, MIDNIGHT = '#0A0A0A', '#FF4405', '#F7F7F5', '#FFFFFF', '#0F1114'

def f(v):
    s = ('%.3f' % v).rstrip('0').rstrip('.')
    return '0' if s in ('-0', '') else s

def _P(cx, cy, R, a):
    t = math.radians(a)
    return (cx + R * math.sin(t), cy - R * math.cos(t))

def ring_piece(cx, cy, r, sw, a0, a1, gap):
    """Annular piece from cut at a0 to cut at a1 (degrees, 0 = 12 o'clock, clockwise).
    Cuts are parallel-sided slits of width `gap` centred on the radial line."""
    Ro, Ri, h = r + sw / 2, r - sw / 2, gap / 2
    so = a0 + math.degrees(math.asin(h / Ro)); si = a0 + math.degrees(math.asin(h / Ri))
    eo = a1 - math.degrees(math.asin(h / Ro)); ei = a1 - math.degrees(math.asin(h / Ri))
    lo = 1 if (eo - so) > 180 else 0
    li = 1 if (ei - si) > 180 else 0
    p = [_P(cx, cy, Ro, so), _P(cx, cy, Ro, eo), _P(cx, cy, Ri, ei), _P(cx, cy, Ri, si)]
    return ('M%s %sA%s %s 0 %d 1 %s %sL%s %sA%s %s 0 %d 0 %s %sZ' % (
        f(p[0][0]), f(p[0][1]), f(Ro), f(Ro), lo, f(p[1][0]), f(p[1][1]),
        f(p[2][0]), f(p[2][1]), f(Ri), f(Ri), li, f(p[3][0]), f(p[3][1])))

# Master mark: 100-unit artboard. Small-size variant is heavier with wider cuts so it survives 16px.
MASTER = dict(r=37, sw=11, seg=(0, 90), gap=5.0)
SMALL = dict(r=36, sw=15, seg=(0, 90), gap=8.0)

def mark_paths(cx=50, cy=50, scale=1.0, spec=MASTER):
    r, sw, gap = spec['r'] * scale, spec['sw'] * scale, spec['gap'] * scale
    s0, s1 = spec['seg']
    seg = ring_piece(cx, cy, r, sw, s0, s1, gap)
    ring = ring_piece(cx, cy, r, sw, s1, s0 + 360, gap)
    return ring, seg

def mark_outer_diameter(scale=1.0, spec=MASTER):
    return (spec['r'] * 2 + spec['sw']) * scale

# ---------- wordmark ----------
_inst = None
def _font():
    global _inst
    if _inst is None:
        vf = TTFont(FONT)
        _inst = instancer.instantiateVariableFont(vf, {'wght': 600})
    return _inst

def _kern(font, left, right):
    gpos = font['GPOS'].table
    idx = set()
    for fr in gpos.FeatureList.FeatureRecord:
        if fr.FeatureTag == 'kern':
            idx.update(fr.Feature.LookupListIndex)
    for li in sorted(idx):
        lk = gpos.LookupList.Lookup[li]
        for st in lk.SubTable:
            if lk.LookupType == 9:
                st = st.ExtSubTable
            if getattr(st, 'LookupType', 2) != 2 or not hasattr(st, 'Coverage'):
                continue
            cov = st.Coverage.glyphs
            if left not in cov:
                continue
            if st.Format == 1:
                for pvr in st.PairSet[cov.index(left)].PairValueRecord:
                    if pvr.SecondGlyph == right:
                        return getattr(pvr.Value1, 'XAdvance', 0) or 0
            elif st.Format == 2:
                c1 = st.ClassDef1.classDefs.get(left, 0)
                c2 = st.ClassDef2.classDefs.get(right, 0)
                v = getattr(st.Class1Record[c1].Class2Record[c2].Value1, 'XAdvance', 0) or 0
                if v:
                    return v
    return 0

def wordmark(text='Halo', tracking=-0.03):
    """Returns dict(path, width, cap, bbox) in font units (UPM 1000), y-down, baseline at y=0."""
    font = _font()
    cmap = font.getBestCmap(); gs = font.getGlyphSet(); hmtx = font['hmtx']
    upm = font['head'].unitsPerEm
    names = [cmap[ord(c)] for c in text]
    x = 0.0; parts = []; kerns = []
    bp = BoundsPen(gs)
    xmin = ymin = 1e9; xmax = ymax = -1e9
    for i, g in enumerate(names):
        sp = SVGPathPen(gs, ntos=f)
        gs[g].draw(TransformPen(sp, (1, 0, 0, -1, x, 0)))
        parts.append(sp.getCommands())
        b = BoundsPen(gs); gs[g].draw(TransformPen(b, (1, 0, 0, -1, x, 0)))
        if b.bounds:
            xmin, ymin = min(xmin, b.bounds[0]), min(ymin, b.bounds[1])
            xmax, ymax = max(xmax, b.bounds[2]), max(ymax, b.bounds[3])
        adv = hmtx[g][0]
        if i < len(names) - 1:
            k = _kern(font, g, names[i + 1]); kerns.append(k)
            x += adv + k + tracking * upm
        else:
            x += adv
    cap = font['OS/2'].sCapHeight
    return dict(path=''.join(parts), advance=x, bbox=(xmin, ymin, xmax, ymax), cap=cap, kerns=kerns, names=names)

if __name__ == '__main__':
    w = wordmark()
    print('glyphs', w['names'], 'kerns', w['kerns'], 'bbox', [round(v, 1) for v in w['bbox']], 'cap', w['cap'], 'adv', round(w['advance'], 1))
    print(mark_paths())

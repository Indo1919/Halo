"""Generates the Halo logo system (SVG) and a render manifest for PNG exports."""
import sys, os, json, math
sys.path.insert(0, os.path.dirname(__file__))
from geometry import *

B = os.path.join(ROOT, 'brand')
K_MARK, K_GAP = 1.3, 0.3          # mark = 1.3x cap height; gap = 0.3x mark
W = wordmark()
CAP = W['cap']
jobs = []                          # (svg, png, w, h)

def svg(vb, body, title='Halo'):
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="%s" role="img" aria-label="%s">'
            '<title>%s</title>%s</svg>\n') % (vb, title, title, body)

def write(rel, text):
    p = os.path.join(B, rel); os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, 'w').write(text); return p

def mark_body(ring, seg, cx=50, cy=50, scale=1.0, spec=MASTER):
    r, s = mark_paths(cx, cy, scale, spec)
    return '<path fill="%s" d="%s"/><path fill="%s" d="%s"/>' % (ring, r, seg, s)

# ---- marks (100 artboard, 7.5 unit inherent margin trimmed to the ring) ----
MARKS = {'color': (INK, SIGNAL), 'reversed': (CANVAS, SIGNAL), 'black': (INK, INK), 'white': (WHITE, WHITE)}
for name, (ring, seg) in MARKS.items():
    p = write('logo/mark/halo-mark-%s.svg' % name, svg('7.5 7.5 85 85', mark_body(ring, seg), 'Halo mark'))
    for z in (512, 1024):
        jobs.append((p, 'logo/mark/png/halo-mark-%s-%d.png' % (name, z), z, z))
# small-size optical variant
for name, (ring, seg) in MARKS.items():
    write('logo/mark/halo-mark-small-%s.svg' % name, svg('6 6 88 88', mark_body(ring, seg, spec=SMALL), 'Halo mark'))

# ---- wordmark ----
bx0, by0, bx1, by1 = W['bbox']
for name, col in (('ink', INK), ('white', WHITE)):
    p = write('logo/wordmark/halo-wordmark-%s.svg' % name,
              svg('%s %s %s %s' % (f(bx0), f(-CAP), f(bx1 - bx0), f(CAP + by1)),
                  '<path fill="%s" d="%s"/>' % (col, W['path']), 'Halo'))
    jobs.append((p, 'logo/wordmark/png/halo-wordmark-%s-1200.png' % name, 1200, round(1200 * (CAP + by1) / (bx1 - bx0))))

# ---- lockups ----
def horizontal(ring, seg, word):
    D = K_MARK * CAP; s = D / mark_outer_diameter(); cy = -CAP / 2
    body = mark_body(ring, seg, cx=D / 2 - 7.5 * 0, cy=cy, scale=s) if False else None
    r, sg = mark_paths(cx=D / 2, cy=cy, scale=s)
    x0 = D + K_GAP * D - bx0
    top = cy - D / 2
    width = x0 + bx1
    body = ('<path fill="%s" d="%s"/><path fill="%s" d="%s"/><path fill="%s" transform="translate(%s 0)" d="%s"/>'
            % (ring, r, seg, sg, word, f(x0), W['path']))
    return '%s %s %s %s' % (f(0), f(top), f(width), f(D)), body, width / D

def stacked(ring, seg, word):
    D = 2.1 * CAP; s = D / mark_outer_diameter()
    wordw = bx1 - bx0; width = max(D, wordw)
    cx = width / 2; cy = D / 2
    r, sg = mark_paths(cx=cx, cy=cy, scale=s)
    gap = 0.42 * D
    base = D + gap + CAP
    x0 = (width - wordw) / 2 - bx0
    body = ('<path fill="%s" d="%s"/><path fill="%s" d="%s"/><path fill="%s" transform="translate(%s %s)" d="%s"/>'
            % (ring, r, seg, sg, word, f(x0), f(base), W['path']))
    return '0 0 %s %s' % (f(width), f(base + by1)), body, width / (base + by1)

LOCK = {'color': (INK, SIGNAL, INK), 'reversed': (CANVAS, SIGNAL, CANVAS), 'black': (INK, INK, INK), 'white': (WHITE, WHITE, WHITE)}
for name, cols in LOCK.items():
    vb, body, ratio = horizontal(*cols)
    p = write('logo/lockup/halo-lockup-horizontal-%s.svg' % name, svg(vb, body))
    jobs.append((p, 'logo/lockup/png/halo-lockup-horizontal-%s-1600.png' % name, 1600, round(1600 / ratio)))
    vb, body, ratio = stacked(*cols)
    p = write('logo/lockup/halo-lockup-stacked-%s.svg' % name, svg(vb, body))
    jobs.append((p, 'logo/lockup/png/halo-lockup-stacked-%s-1200.png' % name, round(1200 * ratio), 1200))

# ---- app icon (continuous-corner squircle, flat) ----
def squircle(size, n=5.0, steps=720):
    a = size / 2; pts = []
    for i in range(steps):
        t = 2 * math.pi * i / steps
        c, s_ = math.cos(t), math.sin(t)
        x = a + a * math.copysign(abs(c) ** (2 / n), c)
        y = a + a * math.copysign(abs(s_) ** (2 / n), s_)
        pts.append('%s %s' % (f(x), f(y)))
    return 'M' + 'L'.join(pts) + 'Z'

def app_icon(bg, ring, seg, masked=True, size=1024, frac=0.56):
    D = frac * size; s = D / mark_outer_diameter()
    r, sg = mark_paths(cx=size / 2, cy=size / 2, scale=s)
    shape = '<path fill="%s" d="%s"/>' % (bg, squircle(size)) if masked else '<rect width="%d" height="%d" fill="%s"/>' % (size, size, bg)
    return '0 0 %d %d' % (size, size), shape + '<path fill="%s" d="%s"/><path fill="%s" d="%s"/>' % (ring, r, seg, sg)

ICONS = {'dark': (INK, CANVAS, SIGNAL), 'light': (CANVAS, INK, SIGNAL)}
for name, cols in ICONS.items():
    vb, body = app_icon(*cols, masked=True)
    p = write('app-icon/halo-app-icon-%s.svg' % name, svg(vb, body, 'Halo app icon'))
    for z in (1024, 512, 256):
        jobs.append((p, 'app-icon/png/halo-app-icon-%s-%d.png' % (name, z), z, z))
    vb, body = app_icon(*cols, masked=False)
    p = write('app-icon/halo-app-icon-%s-fullbleed.svg' % name, svg(vb, body, 'Halo app icon'))
    jobs.append((p, 'app-icon/png/halo-app-icon-%s-fullbleed-1024.png' % name, 1024, 1024))
# PWA / touch icons (full-bleed; platforms apply their own mask). Maskable keeps glyph inside 80% safe zone.
vb, body = app_icon(*ICONS['dark'], masked=False)
p = write('favicon/icon-fullbleed.svg', svg(vb, body, 'Halo'))
for z, nm in ((180, 'apple-touch-icon.png'), (192, 'icon-192.png'), (512, 'icon-512.png')):
    jobs.append((p, 'favicon/' + nm, z, z))
vb, body = app_icon(*ICONS['dark'], masked=False, frac=0.46)
p = write('favicon/icon-maskable.svg', svg(vb, body, 'Halo'))
jobs.append((p, 'favicon/icon-maskable-512.png', 512, 512))

# ---- favicon: adaptive SVG (small-size geometry) + tile PNGs for legacy ----
r, sg = mark_paths(spec=SMALL)
fav = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="4 4 92 92"><style>.r{fill:#0A0A0A}'
       '@media (prefers-color-scheme:dark){.r{fill:#F7F7F5}}</style>'
       '<path class="r" d="%s"/><path fill="#FF4405" d="%s"/></svg>\n') % (r, sg)
write('favicon/favicon.svg', fav)
def tile(size_units=100):
    rr, ss = mark_paths(cx=50, cy=50, scale=0.84, spec=SMALL)
    return ('<rect width="100" height="100" rx="22" fill="%s"/><path fill="%s" d="%s"/><path fill="%s" d="%s"/>'
            % (INK, CANVAS, rr, SIGNAL, ss))
p = write('favicon/favicon-tile.svg', svg('0 0 100 100', tile(), 'Halo'))
for z in (16, 32, 48, 64):
    jobs.append((p, 'favicon/favicon-%d.png' % z, z, z))

json.dump(jobs, open(os.path.join(ROOT, 'tools/brand/render-jobs.json'), 'w'), indent=0)
print('svgs written; %d png jobs' % len(jobs))

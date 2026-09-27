"""Generates brand/guidelines/index.html — the Halo brand guidelines (16:9 pages, 1920x1080)."""
import json, os, sys, html as H
sys.path.insert(0, os.path.dirname(__file__))
from geometry import mark_paths, MASTER, SMALL, wordmark, f as fmt

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'brand/guidelines/index.html')
CONTRAST = json.load(open(os.path.join(ROOT, 'brand/tokens/contrast.json')))
RING, SEG = mark_paths()
SRING, SSEG = mark_paths(spec=SMALL)
W = wordmark()
INK, SIG, CAN, MID, TINT, DEEP = '#0A0A0A', '#FF4405', '#F7F7F5', '#0F1114', '#FFEDE5', '#C2360A'

def mark(size, ring=INK, seg=SIG, extra='', vb='7.5 7.5 85 85', small=False):
    r, s = (SRING, SSEG) if small else (RING, SEG)
    return '<svg width="%s" height="%s" viewBox="%s" %s><path fill="%s" d="%s"/><path fill="%s" d="%s"/></svg>' % (size, size, vb, extra, ring, r, seg, s)

def lock(h, ring=INK, seg=SIG, word=INK, family=None):
    # horizontal lockup built from the same rules as brand/logo (mark = 1.3x cap, gap = 0.3x mark)
    cap = W['cap']; D = 1.3 * cap
    bx0, by0, bx1, by1 = W['bbox']
    scale = D / 85.0
    r, s = mark_paths(cx=D / 2, cy=-cap / 2, scale=scale)
    x0 = D + 0.3 * D - bx0; width = x0 + bx1; top = -cap / 2 - D / 2
    word_svg = ('<path fill="%s" transform="translate(%s 0)" d="%s"/>' % (word, fmt(x0), W['path'])) if not family else \
        ('<text x="%s" y="0" fill="%s" style="font-family:%s;font-size:%spx">Halo</text>' % (fmt(x0), word, family, int(cap * 1.38)))
    return ('<svg height="%s" viewBox="0 %s %s %s" style="display:block;overflow:visible"><path fill="%s" d="%s"/><path fill="%s" d="%s"/>%s</svg>'
            % (h, fmt(top), fmt(width), fmt(D), ring, r, seg, s, word_svg))

PAGES = []
def page(eyebrow, title, lede, body, cls='', num=True):
    PAGES.append((eyebrow, title, lede, body, cls, num))

CSS = r"""
@font-face{font-family:Geist;src:url(../../assets/fonts/Geist-Variable-latin.woff2) format('woff2');font-weight:100 900}
@font-face{font-family:'Geist Mono';src:url(../../assets/fonts/GeistMono-Variable-latin.woff2) format('woff2');font-weight:100 900}
@page{size:1920px 1080px;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#E4E4DF}
body{font-family:Geist,sans-serif;color:#0A0A0A;-webkit-font-smoothing:antialiased;print-color-adjust:exact;-webkit-print-color-adjust:exact}
.page{width:1920px;height:1080px;position:relative;overflow:hidden;background:#F7F7F5;margin:0 auto 24px;padding:112px 120px 0;page-break-after:always;break-after:page}
@media print{.page{margin:0}}
.page.dark{background:#0F1114;color:#F2F2EF}
.eb{font:500 18px/1 'Geist Mono',monospace;letter-spacing:.06em;text-transform:uppercase;color:#6B6B66;display:flex;align-items:center;gap:14px}
.eb i{width:10px;height:10px;background:#FF4405;display:inline-block}
.dark .eb{color:#9B9C98}
h1.t{font:600 72px/1.02 Geist;letter-spacing:-.04em;margin-top:28px;max-width:1300px}
.lede{font:400 26px/1.45 Geist;letter-spacing:-.01em;color:#4B4B47;margin-top:24px;max-width:980px}
.dark .lede{color:#B8B9B5}
.body{position:absolute;left:120px;right:120px;top:420px;bottom:120px}
.pf{position:absolute;left:120px;right:120px;bottom:44px;display:flex;justify-content:space-between;font:400 15px/1 Geist;color:#8A8A85}
.pf b{font-weight:500;color:#6B6B66}
.dark .pf,.dark .pf b{color:#6E7076}
.grid{display:grid;gap:24px}
.c2{grid-template-columns:repeat(2,1fr)}.c3{grid-template-columns:repeat(3,1fr)}.c4{grid-template-columns:repeat(4,1fr)}
.card{background:#fff;border-radius:24px;box-shadow:0 0 0 1px #E6E6E1;padding:36px;position:relative}
.dark .card{background:#16181C;box-shadow:0 0 0 1px #262A30}
.lab{font:500 15px/1 'Geist Mono';letter-spacing:.04em;text-transform:uppercase;color:#8A8A85}
.h3{font:600 30px/1.15 Geist;letter-spacing:-.022em;margin-top:18px}
.p{font:400 20px/1.5 Geist;color:#4B4B47;margin-top:12px}
.dark .p{color:#B8B9B5}
.mono{font-family:'Geist Mono';letter-spacing:0}
.sq{display:inline-block;width:12px;height:12px;background:#FF4405}
.row{display:flex;align-items:center}
.do,.dont{font:600 15px/1 'Geist Mono';letter-spacing:.04em;text-transform:uppercase;display:inline-flex;align-items:center;gap:10px}
.do::before,.dont::before{content:'';width:12px;height:12px;display:inline-block}
.do::before{background:#12744A}.dont::before{background:#C0262D}
.cover .body{inset:0}
.tile{border-radius:20px;display:grid;place-items:center;position:relative;overflow:hidden}
.cap{font:400 18px/1.4 Geist;color:#4B4B47;margin-top:16px}
.cap b{color:#0A0A0A;font-weight:600}
"""

# ---------- 01 Cover ----------
cover = ('<div style="position:absolute;right:-260px;top:-180px">' + mark(1200, ring='#1B1E23', seg=SIG) + '</div>'
         '<div style="position:absolute;left:120px;top:120px">' + lock(56, ring=CAN, word=CAN) + '</div>'
         '<div style="position:absolute;left:120px;bottom:150px"><div class="eb"><i></i>Brand guidelines</div>'
         '<div style="font:600 128px/.95 Geist;letter-spacing:-.05em;margin-top:32px">Your work,<br>represented.</div>'
         '<div style="font:400 24px/1.4 Geist;color:#9B9C98;margin-top:36px">Version 1.0 · September 2026</div></div>')
page('', '', '', cover, 'dark cover', num=False)

# ---------- 02 Contents ----------
toc = [('Brand', ['Why Halo exists', 'What we believe', 'Personality', 'Voice and tone']),
       ('Logo', ['The logo', 'Anatomy and construction', 'Lockups', 'Clear space and minimum size', 'Color versions', 'Misuse']),
       ('Color', ['Palette', 'Proportion', 'Accessible pairings']),
       ('Type and motif', ['Typography', 'Type scale', 'Motif system', 'Iconography']),
       ('In use', ['Product interface', 'App icon and favicon', 'Print and email', 'Social and web', 'Assets and contact'])]
n = 3; cols = []
for sec, items in toc:
    li = ''.join('<div class="row" style="justify-content:space-between;padding:14px 0;border-top:1px solid #E6E6E1;font:400 22px/1 Geist"><span>%s</span><span class="mono" style="color:#8A8A85;font-size:18px">%02d</span></div>' % (H.escape(t), n + i) for i, t in enumerate(items))
    n += len(items)
    cols.append('<div><div class="lab" style="margin-bottom:18px">%s</div>%s</div>' % (sec, li))
page('Contents', 'Inside', '', '<div class="grid" style="grid-template-columns:repeat(5,1fr);gap:40px;position:absolute;left:0;right:0;top:-120px">' + ''.join(cols) + '</div>')

# ---------- 03 Why ----------
page('Brand · 01', '', '',
     '<div style="position:absolute;left:0;top:-230px;right:0"><div style="font:600 112px/1.02 Geist;letter-spacing:-.048em;max-width:1560px">“Because I’m tired of being paperwork for my own work.”</div>'
     '<div class="row" style="gap:16px;margin-top:40px;font:500 18px/1 \'Geist Mono\';color:#6B6B66;letter-spacing:.04em;text-transform:uppercase"><span class="sq"></span>Why Halo exists</div>'
     '<p class="lede" style="margin-top:56px;max-width:1180px">Every week, capable people lose hours to writing status updates, sitting in status meetings and grooming tickets. Halo takes that coordination work off their plate. It turns the signal they already create into updates in their own voice, so the work speaks for itself.</p></div>', 'why')

# ---------- 04 Beliefs ----------
beliefs = [('IC-first', 'Halo speaks for the person, never about them. If a choice makes someone feel watched, it’s wrong, even if a manager would love it.'),
           ('Signal, not paperwork', 'Halo populates itself from work that already happened. Nobody should maintain a tool so the tool can describe their work.'),
           ('Right altitude', 'The same truth, written for whoever asks: detail for a teammate, risk for a manager, one sentence for an executive.'),
           ('Visible restraint', 'Trust comes from showing what was held back. “Redacted: 1 private topic” beats silent omission.')]
page('Brand · 02', 'What we believe', 'Four principles decide every product and brand call. When two ideas conflict, the one that protects the individual wins.',
     '<div class="grid c4">' + ''.join('<div class="card" style="height:420px"><div class="mono" style="font-size:18px;color:#8A8A85">0%d</div><div class="h3" style="margin-top:120px">%s</div><p class="p">%s</p></div>' % (i + 1, t, H.escape(d)) for i, (t, d) in enumerate(beliefs)) + '</div>')

# ---------- 05 Personality ----------
traits = [('Calm', 'Unhurried, clear, generous with space.', 'Loud, urgent, busy.'), ('Precise', 'Specific facts, sources shown, numbers that add up.', 'Vague, hype, invented stats.'),
          ('On your side', 'An advocate that protects your time and privacy.', 'A monitor, a scorecard, a boss.'), ('Quietly confident', 'Says what it knows, admits what it doesn’t.', 'Hedging, apologetic, smug.')]
page('Brand · 03', 'Personality', 'If Halo were a colleague, it would be the calm, precise one who always has your back and never needs credit.',
     '<div class="grid c4">' + ''.join('<div class="card" style="height:430px"><div class="h3" style="margin-top:0;font-size:40px">%s</div><div style="margin-top:110px"><span class="do">Is</span><p class="p" style="margin-top:12px">%s</p></div><div style="margin-top:28px"><span class="dont">Is not</span><p class="p" style="margin-top:12px;color:#8A8A85">%s</p></div></div>' % (t, H.escape(a), H.escape(b)) for t, a, b in traits) + '</div>')

# ---------- 06 Voice ----------
pairs = [('Heads up: the selector needs a day more than planned. New target is Thursday.', 'URGENT!!! Timeline slipping on CHK-142, will circle back ASAP.'),
         ('4 updates need you. It takes about two minutes.', 'You have 4 pending items requiring immediate review.'),
         ('Halo held back 1 update that matches a private topic.', 'Some content was filtered for compliance reasons.'),
         ('Rosa asked about Checkout v3. Here’s exactly what Halo said.', 'Your manager has been monitoring your activity.')]
rules = ['Sentence case, plain words.', 'Say “share”, not “report”.', 'No exclamation marks, no emojis.', 'Never “monitor”, “track you” or “productivity score”.']
page('Brand · 04', 'Voice and tone', 'Write like a trusted teammate: warm, direct and brief. Halo always speaks in first person on the individual’s behalf.',
     '<div class="grid" style="grid-template-columns:420px 1fr;gap:48px"><div>' + ''.join('<div class="row" style="gap:14px;padding:18px 0;border-top:1px solid #E6E6E1;font:500 21px/1.3 Geist"><span class="sq"></span>%s</div>' % H.escape(r) for r in rules) + '</div>'
     '<div class="grid c2" style="gap:16px">' + ''.join('<div class="card" style="padding:26px 30px"><span class="do">Say</span><p style="font:400 21px/1.45 Geist;margin-top:14px">%s</p></div><div class="card" style="padding:26px 30px;background:#F1F1EE;box-shadow:none"><span class="dont">Not</span><p style="font:400 21px/1.45 Geist;margin-top:14px;color:#8A8A85;text-decoration:line-through;text-decoration-color:#C0262D55">%s</p></div>' % (H.escape(a), H.escape(b)) for a, b in pairs) + '</div></div>')

# ---------- 07 Logo ----------
page('Logo · 05', 'The logo', 'A precise ring with a single Signal segment. The ring is the boundary Halo keeps around your work; the segment is the one thing that matters right now.',
     '<div class="grid c2" style="height:100%"><div class="tile" style="background:#fff;box-shadow:0 0 0 1px #E6E6E1">' + lock(150) + '</div><div class="tile" style="background:#0F1114">' + lock(150, ring=CAN, word=CAN) + '</div></div>')

# ---------- 08 Construction ----------
def construction():
    g = ''.join('<line x1="%d" y1="0" x2="%d" y2="100" stroke="#E6E6E1" stroke-width=".15"/><line x1="0" y1="%d" x2="100" y2="%d" stroke="#E6E6E1" stroke-width=".15"/>' % (i, i, i, i) for i in range(0, 101, 5))
    ann = ('<circle cx="50" cy="50" r="37" fill="none" stroke="#1D5BD8" stroke-width=".25" stroke-dasharray="1 1"/>'
           '<line x1="50" y1="50" x2="76.16" y2="76.16" stroke="#1D5BD8" stroke-width=".3"/><text x="64" y="61" fill="#1D5BD8" font-size="2.6" font-family="Geist Mono">r = 37</text>'
           '<line x1="0" y1="50" x2="100" y2="50" stroke="#8A8A85" stroke-width=".2" stroke-dasharray=".8 .8"/><line x1="50" y1="0" x2="50" y2="100" stroke="#8A8A85" stroke-width=".2" stroke-dasharray=".8 .8"/>'
           '<line x1="7.5" y1="96" x2="18.5" y2="96" stroke="#0A0A0A" stroke-width=".3"/><text x="7.5" y="99.2" font-size="2.4" font-family="Geist Mono">stroke 11</text>'
           '<text x="80" y="10" font-size="2.6" font-family="Geist Mono" fill="#C2360A">90° segment</text>'
           '<text x="54" y="5.2" font-size="2.4" font-family="Geist Mono">cut 5</text>')
    return '<svg viewBox="-4 -4 108 108" width="640" height="640">' + g + '<path fill="%s" d="%s"/><path fill="%s" d="%s"/>' % (INK, RING, SIG, SEG) + ann + '</svg>'
spec = [('Artboard', '100 × 100 units'), ('Ring', 'radius 37, stroke 11'), ('Segment', '0° to 90°, clockwise from 12 o’clock'), ('Cuts', 'parallel-sided, 5 units wide'), ('Small sizes', 'below 24 px use the heavier variant: radius 36, stroke 15, cuts 8'), ('Wordmark', 'Geist SemiBold, −3% tracking, outlined')]
page('Logo · 06', 'Anatomy and construction', '',
     '<div style="position:absolute;left:0;top:-190px">' + construction() + '</div><div style="position:absolute;left:760px;right:0;top:-150px">'
     '<p class="lede" style="margin-top:0">The mark is geometric and flat. Never redraw it; always use the master files.</p>' +
     ''.join('<div class="row" style="justify-content:space-between;padding:20px 0;border-top:1px solid #E6E6E1;font:400 22px/1.3 Geist"><span style="color:#6B6B66">%s</span><span class="mono" style="font-size:20px">%s</span></div>' % (a, H.escape(b)) for a, b in spec) + '</div>')

# ---------- 09 Lockups ----------
wm = '<svg height="92" viewBox="%s %s %s %s"><path d="%s"/></svg>' % (fmt(W['bbox'][0]), fmt(-W['cap']), fmt(W['bbox'][2] - W['bbox'][0]), fmt(W['cap'] + W['bbox'][3]), W['path'])
stacked = '<img src="../logo/lockup/halo-lockup-stacked-color.svg" style="height:240px">'
items = [('Horizontal', 'The default. Use it whenever there is room.', lock(92)), ('Stacked', 'For square and tall spaces: app stores, merch, social.', stacked),
         ('Mark', 'When Halo is already named nearby: app icon, favicon, avatar.', mark(150)), ('Wordmark', 'Only in running text-heavy contexts where the mark repeats elsewhere.', wm)]
page('Logo · 07', 'Lockups', 'Mark and wordmark keep a fixed relationship: the mark is 1.3× the cap height, and the gap is 0.3× the mark.',
     '<div class="grid c4" style="height:100%">' + ''.join('<div><div class="tile" style="background:#fff;box-shadow:0 0 0 1px #E6E6E1;height:360px">%s</div><div class="cap"><b>%s.</b> %s</div></div>' % (v, t, H.escape(d)) for t, d, v in items) + '</div>')

# ---------- 10 Clear space ----------
X = 44
clear = ('<div style="position:relative;display:inline-block;padding:%dpx;outline:2px dashed #FF4405;outline-offset:0;background:#fff">' % (2 * X) + lock(120) +
         ''.join('<span style="position:absolute;%s;width:%dpx;height:%dpx;background:#FFEDE5;display:grid;place-items:center;font:500 15px \'Geist Mono\';color:#C2360A">2X</span>' % (pos, 2 * X, 2 * X) for pos in ['left:0;top:0', 'right:0;top:0', 'left:0;bottom:0', 'right:0;bottom:0']) + '</div>')
sizes = ''.join('<div style="text-align:center"><div style="height:90px;display:grid;place-items:end center">%s</div><div class="mono" style="margin-top:14px;font-size:16px;color:#6B6B66">%s</div></div>' % (v, l) for v, l in
                [(mark(16, small=True, vb='6 6 88 88'), '16 px · small'), (mark(24), '24 px'), (mark(32), '32 px'), (lock(24), 'Lockup min 80 px'), (lock(40), '20 mm print')])
page('Logo · 08', 'Clear space and minimum size', 'Keep a clear space of 2X around the logo, where X is the ring’s stroke width. Nothing enters that space.',
     '<div class="grid c2" style="gap:48px;height:100%"><div class="tile" style="background:#F1F1EE">' + clear + '</div><div class="tile" style="background:#fff;box-shadow:0 0 0 1px #E6E6E1"><div class="row" style="gap:56px;align-items:flex-end">' + sizes + '</div></div></div>')

# ---------- 11 Color versions ----------
vers = [('#FFFFFF', lock(88), 'Color on light. The default.'), (MID, lock(88, ring=CAN, word=CAN), 'Reversed on Midnight or Ink.'),
        (SIG, lock(88, ring=INK, seg=INK, word=INK), 'Ink on Signal. Never white on Signal.'), ('#0A0A0A', lock(88, ring='#fff', seg='#fff', word='#fff'), 'White, for single-color and photography.')]
page('Logo · 09', 'Color versions', 'Four versions cover every surface. Pick the one with the strongest contrast; never recolor parts of the mark.',
     '<div class="grid c4" style="height:100%">' + ''.join('<div><div class="tile" style="background:%s;height:380px;box-shadow:0 0 0 1px #E6E6E1">%s</div><div class="cap">%s</div></div>' % (bg, v, t) for bg, v, t in vers) + '</div>')

# ---------- 12 Misuse ----------
grad = '<defs><linearGradient id="gg" x1="0" x2="1"><stop offset="0" stop-color="#FF4405"/><stop offset="1" stop-color="#FFB800"/></linearGradient></defs>'
mis = [('Don’t rotate the mark.', '<div style="transform:rotate(135deg)">' + mark(120) + '</div>'),
       ('Don’t make the ring orange.', mark(120, ring=SIG)),
       ('Don’t add gradients or glow.', '<svg width="120" height="120" viewBox="7.5 7.5 85 85" style="filter:drop-shadow(0 0 10px #FF4405)">' + grad + '<path fill="url(#gg)" d="%s"/><path fill="url(#gg)" d="%s"/></svg>' % (RING, SEG)),
       ('Don’t outline it.', '<svg width="120" height="120" viewBox="7.5 7.5 85 85"><path fill="none" stroke="#0A0A0A" stroke-width="1.2" d="%s"/><path fill="none" stroke="#FF4405" stroke-width="1.2" d="%s"/></svg>' % (RING, SEG)),
       ('Don’t stretch or squash.', '<div style="transform:scaleX(1.5)">' + lock(56) + '</div>'),
       ('Don’t change the typeface.', lock(64, family='Georgia, serif')),
       ('Don’t place it on busy imagery.', '<div style="background:repeating-linear-gradient(45deg,#FF8A5C 0 14px,#2F6FDB 14px 28px,#FFD166 28px 42px);position:absolute;inset:0"></div><div style="position:relative">' + lock(64) + '</div>'),
       ('Don’t add shadows or effects.', '<div style="filter:drop-shadow(6px 6px 0 #9A5B07) drop-shadow(0 12px 18px rgba(0,0,0,.5))">' + lock(64) + '</div>')]
page('Logo · 10', 'Misuse', 'The logo only works when it’s exact. These are the mistakes we see most.',
     '<div class="grid c4" style="gap:20px">' + ''.join('<div><div class="tile" style="background:#fff;height:210px;box-shadow:0 0 0 1px #E6E6E1">%s<span style="position:absolute;left:16px;top:16px;width:14px;height:14px;background:#C0262D"></span></div><div class="cap" style="margin-top:12px">%s</div></div>' % (v, t) for t, v in mis) + '</div>')

# ---------- 13 Palette ----------
sw = [('Canvas', CAN, '247 247 245', '0 0 1 3', 'Backgrounds, paper, the calm default.', '#0A0A0A'), ('Ink', INK, '10 10 10', '0 0 0 96', 'Type, the ring, primary actions.', '#F7F7F5'),
      ('Signal', SIG, '255 68 5', '0 73 98 0', 'The segment. Attention, progress, live. Flat only.', '#0A0A0A'), ('Midnight', MID, '15 17 20', '25 15 0 92', 'Dark surfaces and reversed brand moments.', '#F2F2EF'),
      ('Signal Tint', TINT, '255 237 229', '0 7 10 0', 'Quiet highlights behind Signal Deep text.', '#0A0A0A'), ('Signal Deep', DEEP, '194 54 10', '0 72 95 24', 'Orange text and links on light backgrounds.', '#FFFFFF')]
page('Color · 11', 'Palette', 'Mostly Canvas and Ink. Signal is used sparingly, so when it appears, it means something.',
     '<div class="grid" style="grid-template-columns:repeat(6,1fr);gap:16px;height:100%">' + ''.join(
         '<div style="border-radius:22px;background:%s;color:%s;padding:28px;display:flex;flex-direction:column;box-shadow:0 0 0 1px #E6E6E1"><div style="font:600 30px/1.1 Geist;letter-spacing:-.02em">%s</div><div style="flex:1"></div><div class="mono" style="font-size:17px;line-height:1.7">%s<br>RGB %s<br>CMYK %s</div><div style="font:400 16px/1.4 Geist;margin-top:14px;opacity:.8">%s</div></div>' % (hx, fg, n, hx, rgb, cmyk, d)
         for n, hx, rgb, cmyk, d, fg in sw) + '</div><div class="mono" style="position:absolute;left:0;bottom:-52px;font-size:15px;color:#8A8A85">Nearest Pantone for Signal: Orange 021 C. Always proof on press.</div>')

# ---------- 14 Proportion ----------
bar = ''.join('<div style="flex:%s;background:%s;display:flex;align-items:flex-end;padding:20px;color:%s;font:500 18px \'Geist Mono\'">%s%%</div>' % (w, c, fg, w) for w, c, fg in [(60, CAN, '#6B6B66'), (25, INK, '#F7F7F5'), (10, MID, '#9B9C98'), (5, SIG, '#0A0A0A')])
comp = [('<div style="background:#F7F7F5;height:100%;padding:36px;display:flex;flex-direction:column;justify-content:space-between">' + lock(40) + '<div style="font:600 44px/1.05 Geist;letter-spacing:-.035em">4 updates<br>need you</div><div style="height:8px;border-radius:4px;background:#ECECE8;overflow:hidden"><div style="width:34%;height:100%;background:#FF4405"></div></div></div>'),
        ('<div style="background:#0F1114;height:100%;padding:36px;display:grid;place-items:center">' + mark(180, ring='#F7F7F5') + '</div>'),
        ('<div style="background:#fff;height:100%;padding:36px;display:flex;flex-direction:column;gap:14px;justify-content:center"><div class="row" style="gap:12px;font:500 20px Geist"><span class="sq"></span>Urgent</div><div class="row" style="gap:12px;font:500 20px Geist"><span class="sq" style="background:#0A0A0A"></span>High</div><div class="row" style="gap:12px;font:500 20px Geist"><span class="sq" style="background:#fff;box-shadow:inset 0 0 0 2px #6B6B66"></span>Low</div></div>')]
page('Color · 12', 'Proportion', 'Signal is always a segment, never the whole ring. Keep it to about five percent of any composition.',
     '<div style="display:flex;height:150px;border-radius:22px;overflow:hidden;box-shadow:0 0 0 1px #E6E6E1">' + bar + '</div><div class="grid c3" style="margin-top:32px;height:300px">' + ''.join('<div style="border-radius:22px;overflow:hidden;box-shadow:0 0 0 1px #E6E6E1">%s</div>' % c for c in comp) + '</div>')

# ---------- 15 Accessibility ----------
def rows(mode):
    out = []
    names = {'text': 'Text', 'text-2': 'Secondary text', 'text-3': 'Tertiary text', 'accent-text': 'Signal Deep text' if mode == 'light' else 'Signal text',
             'success': 'Success', 'warning': 'Warning', 'danger': 'Danger', 'info': 'Info'}
    line = '#E6E6E1' if mode == 'light' else '#262A30'
    ok = '#12744A' if mode == 'light' else '#4ADE80'
    for fg in ['text', 'text-2', 'text-3', 'accent-text', 'success', 'warning', 'danger', 'info']:
        a = CONTRAST['%s %s/bg' % (mode, fg)]; b = CONTRAST['%s %s/surface' % (mode, fg)]
        grade = 'AAA' if min(a, b) >= 7 else 'AA'
        out.append('<div class="row" style="justify-content:space-between;padding:12px 0;border-top:1px solid ' + line + ';font:400 19px Geist"><span>' + names[fg] + '</span>'
                   '<span class="mono" style="font-size:17px">' + ('%.2f  \u00b7  %.2f' % (a, b)) + '<b style="color:' + ok + ';margin-left:14px;display:inline-block;width:44px;text-align:right">' + grade + '</b></span></div>')
    return ''.join(out)
page('Color · 13', 'Accessible pairings', 'Every text color in the product meets WCAG 2.2 AA (4.5:1) in both light and dark. Ink on Signal passes at %.2f:1; white on Signal does not, so never use it.' % CONTRAST['ink on signal'],
     '<div class="grid c2" style="gap:24px;height:100%%"><div class="card" style="padding:28px 36px;overflow:hidden"><div class="row lab" style="justify-content:space-between;margin-bottom:10px"><span>Light</span><span>on canvas · on surface</span></div>%s</div><div class="card" style="padding:28px 36px;background:#0F1114;color:#F2F2EF;box-shadow:none;overflow:hidden"><div class="row lab" style="justify-content:space-between;margin-bottom:10px"><span>Dark</span><span>on midnight · on surface</span></div>%s</div></div>' % (rows('light'), rows('dark')))

# ---------- 16 Typography ----------
page('Type · 14', 'Typography', 'One family, two voices. Geist carries every word in the product and the brand; Geist Mono handles data: keys, times and estimates.',
     '<div class="grid" style="grid-template-columns:1.3fr 1fr;gap:24px;height:100%"><div class="card" style="overflow:hidden"><div class="lab">Geist · SemiBold, Medium, Regular</div><div style="font:600 300px/.9 Geist;letter-spacing:-.05em;margin-top:24px">Aa</div><div style="font:400 26px/1.5 Geist;color:#4B4B47;margin-top:18px">ABCDEFGHIJKLMNOPQRSTUVWXYZ<br>abcdefghijklmnopqrstuvwxyz 0123456789</div></div>'
     '<div class="card" style="background:#0F1114;color:#F2F2EF;box-shadow:none"><div class="lab">Geist Mono · data</div><div class="mono" style="font-size:46px;line-height:1.5;margin-top:36px">CHK-142<br>2:40 PM<br>11.5h left<br><span style="color:#FF6A38">85%</span> likely</div><div style="font:400 17px/1.5 Geist;color:#9B9C98;margin-top:30px">Both typefaces are free under the SIL Open Font License 1.1.</div></div></div>')

# ---------- 17 Type scale ----------
scale = [('Display XL', '64 / 64 · 600 · −4%', 64, 600, -0.04, 'Your work, represented.'), ('Display', '44 / 48 · 600 · −3.5%', 44, 600, -0.035, 'One dial, three levels of trust'),
         ('Title 1', '28 / 34 · 600 · −2.5%', 28, 600, -0.025, 'Good afternoon, Maya'), ('Title 3', '17 / 24 · 600', 17, 600, -0.012, 'Checkout v3: error states kickoff'),
         ('Body', '14 / 21 · 400', 14, 400, -0.005, 'Routine updates share themselves. Sensitive ones wait for you.'), ('Caption', '12 / 16 · 500', 12, 500, 0, 'Shared automatically · 2m ago'), ('Micro', '11 / 14 · 600 · +4% · caps', 11, 600, 0.04, "TODAY'S DIGEST")]
page('Type · 15', 'Type scale', 'A short scale with tight tracking at large sizes. Hierarchy comes from size and weight, never from color alone.',
     ''.join('<div class="row" style="padding:14px 0;border-top:1px solid #E6E6E1;gap:40px"><span style="width:180px;font:500 18px Geist;color:#6B6B66">%s</span><span class="mono" style="width:300px;font-size:16px;color:#8A8A85">%s</span><span style="font:%d %dpx/1.15 Geist;letter-spacing:%sem">%s</span></div>' % (a, b, w, min(s * 1.6, 72) if s > 30 else s * 1.6, t, H.escape(x)) for a, b, s, w, t, x in scale))

# ---------- 18 Motif ----------
def dial(sw):
    import math
    r = 40; c = 2 * math.pi * r
    return '<svg width="120" height="120" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" stroke="#ECECE8" stroke-width="10"/><circle cx="50" cy="50" r="40" fill="none" stroke="#FF4405" stroke-width="10" stroke-dasharray="%.1f %.1f" transform="rotate(-90 50 50)"/></svg>' % (c * sw / 360, c)
motif = [('Boundary', 'The ring as a container: avatars, progress, frames. It says “this is yours.”',
          '<div class="row" style="gap:18px"><span style="width:96px;height:96px;border-radius:50%;box-shadow:0 0 0 7px #0A0A0A inset;display:grid;place-items:center;font:600 30px Geist">MC</span>' + mark(96) + '</div>'),
         ('Segment', 'The Signal arc marks the one thing that matters: progress, attention, live.',
          '<div style="width:100%;height:10px;border-radius:5px;background:#ECECE8;overflow:hidden"><div style="width:38%;height:100%;background:#FF4405"></div></div>'),
         ('Dial', 'Trust as a spectrum. The segment grows with automation: 45°, 150°, 270°.', '<div class="row" style="gap:10px">' + dial(45) + dial(150) + dial(270) + '</div>'),
         ('Absence', 'Negative space and redaction bars. Showing what was held back builds trust.',
          '<div style="display:inline-flex;align-items:center;gap:12px;height:48px;padding:0 18px;border-radius:12px;background:#fff;box-shadow:inset 0 0 0 1px #E6E6E1;font:500 19px Geist"><span style="display:inline-flex;gap:4px"><i style="width:22px;height:12px;background:#0A0A0A;border-radius:3px;display:block"></i><i style="width:12px;height:12px;background:#0A0A0A;border-radius:3px;display:block"></i></span>Redacted: 1 private topic</div>')]
page('Motif · 16', 'Motif system', 'Four ideas, all drawn from the mark. Use them to build layouts, illustrations and motion.',
     '<div class="grid c4" style="height:100%">' + ''.join('<div class="card" style="display:flex;flex-direction:column"><div style="height:200px;display:grid;place-items:center;background:#F7F7F5;border-radius:16px">%s</div><div class="h3">%s</div><p class="p">%s</p></div>' % (v, t, H.escape(d)) for t, d, v in motif) + '</div>')

# ---------- 19 Icons ----------
ICONS = ['home', 'digest', 'ask', 'ticket', 'calendar', 'team', 'history', 'sources', 'privacy', 'settings', 'search', 'plus', 'check', 'bell', 'sparkle', 'wand', 'dial', 'subtasks',
         'timer', 'flag', 'link', 'lock', 'eye-off', 'fingerprint', 'wave', 'broadcast', 'manager', 'exec', 'teammate', 'git-pr', 'frame', 'video', 'mail', 'message', 'send', 'share',
         'download', 'refresh', 'undo', 'pause-circle', 'sun', 'moon', 'keyboard', 'command', 'filter', 'board', 'focus', 'split']

ICON_JS = r"""
var g = document.getElementById('icongrid');
ICONS.forEach(function (n) {
  var d = document.createElement('div'); d.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px';
  d.innerHTML = H.icon(n, 32);
  var t = document.createElement('span'); t.style.cssText = 'font:400 11px Geist Mono;color:#8A8A85'; t.textContent = n;
  d.appendChild(t); g.appendChild(d);
});
document.getElementById('bigicon').innerHTML = H.icon('digest', 300);
"""
page('Type · 17', 'Iconography', 'Drawn for Halo on a 24 px grid with a 1.5 px stroke, round caps and joins, and no fills. Light enough to sit beside Geist without shouting.',
     '<div class="grid" style="grid-template-columns:520px 1fr;gap:32px;height:100%"><div class="card" style="display:grid;place-items:center;padding:0;color:#0A0A0A">'
     '<div id="bigicon" style="width:360px;height:360px;background-image:linear-gradient(#ECECE8 1px,transparent 1px),linear-gradient(90deg,#ECECE8 1px,transparent 1px);background-size:15px 15px;display:grid;place-items:center"></div>'
     '<div class="mono" style="position:absolute;bottom:26px;left:36px;font-size:15px;color:#8A8A85">24 grid · 2 px padding · 1.5 stroke</div></div>'
     '<div class="card" style="padding:28px"><div id="icongrid" style="display:grid;grid-template-columns:repeat(12,1fr);gap:18px 0;color:#0A0A0A"></div></div></div>'
     '<script src="../../src/js/core/icons.js"></script><script>var ICONS=' + json.dumps(ICONS) + ';' + ICON_JS + '</script>')

# ---------- 20 Product UI ----------
shot = lambda src, cap: '<div><div style="border-radius:18px;overflow:hidden;box-shadow:0 0 0 1px #E6E6E1,0 30px 60px -30px rgba(10,10,10,.3)"><img src="%s" style="width:100%%;display:block"></div><div class="cap">%s</div></div>' % (src, cap)
page('In use · 18', 'Product interface', 'The brand shows up in the product as restraint: calm hierarchy, one primary action per view, and Signal only where attention is due.',
     '<div class="grid c2" style="gap:40px">' + shot('img/ui-home-light.png', '<b>Home.</b> What Halo is saying about you, at three altitudes.') + shot('img/ui-digest-dark.png', '<b>Digest, dark.</b> The once-a-day decision point.') + '</div>')

# ---------- 21 App icon ----------
icons = ''.join('<div style="text-align:center"><img src="../app-icon/halo-app-icon-dark.svg" style="width:%dpx;height:%dpx;display:block;margin:0 auto"><div class="mono" style="font-size:15px;color:#8A8A85;margin-top:14px">%d</div></div>' % (s, s, s) for s in (220, 120, 64, 40))
tab = lambda dark: ('<div style="display:inline-flex;align-items:center;gap:12px;height:52px;padding:0 20px;border-radius:14px 14px 0 0;background:%s;color:%s;font:500 18px Geist"><img src="../favicon/favicon-32.png" style="width:20px;height:20px">Halo · Home</div>' % (('#26282C', '#F2F2EF') if dark else ('#FFFFFF', '#0A0A0A')))
page('In use · 19', 'App icon and favicon', 'The mark sits on Ink with a Canvas ring, so it holds up on any wallpaper. Platforms apply their own corner mask to the full-bleed file.',
     '<div class="grid" style="grid-template-columns:1.4fr 1fr;gap:32px;height:100%"><div class="card row" style="justify-content:space-around;align-items:flex-end;padding-bottom:60px">' + icons + '</div>'
     '<div class="grid" style="gap:20px"><div class="card" style="display:grid;place-items:center;background:#ECECE8;box-shadow:none">' + tab(False) + '</div><div class="card" style="display:grid;place-items:center;background:#1A1C20;box-shadow:none">' + tab(True) + '</div></div></div>')

# ---------- 22 Print and email ----------
card_front = '<div style="width:540px;height:310px;border-radius:18px;background:#0A0A0A;display:grid;place-items:center;box-shadow:0 24px 50px -24px rgba(0,0,0,.5)">' + lock(64, ring=CAN, word=CAN) + '</div>'
card_back = ('<div style="width:540px;height:310px;border-radius:18px;background:#fff;padding:44px;display:flex;flex-direction:column;box-shadow:0 0 0 1px #E6E6E1,0 24px 50px -24px rgba(0,0,0,.25);position:relative">' + mark(40) +
             '<div style="margin-top:auto"><div style="font:600 30px Geist;letter-spacing:-.02em">Alex Morgan</div><div style="font:400 20px Geist;color:#6B6B66;margin-top:6px">Head of Design</div><div class="mono" style="font-size:17px;margin-top:24px;line-height:1.6">alex@myhalo.co<br>myhalo.co</div></div><span style="position:absolute;right:44px;bottom:44px;width:14px;height:14px;background:#FF4405"></span></div>')
sig = ('<div class="card" style="padding:32px 36px"><div style="font:400 19px/1.6 Geist;color:#4B4B47">Thanks so much,</div><div style="height:1px;background:#E6E6E1;margin:22px 0"></div><div class="row" style="gap:18px">' + mark(44) +
       '<div><div style="font:600 20px Geist">Alex Morgan</div><div style="font:400 17px Geist;color:#6B6B66">Head of Design · Halo</div><div class="mono" style="font-size:15px;color:#C2360A;margin-top:4px">myhalo.co</div></div></div></div>')
page('In use · 20', 'Print and email', 'Business cards pair a reversed front with a quiet back. Email signatures use the mark at 44 px and Signal Deep for the link.',
     '<div class="row" style="gap:32px;align-items:flex-start">' + card_front + card_back + '<div style="flex:1;min-width:0">' + sig +
     '<p class="p" style="margin-top:24px;font-size:18px">Card: 85 × 55 mm, uncoated 400 gsm. Ink prints as rich black (60/40/40/100); Signal is a spot color, never a tint.</p></div></div>')

# ---------- 23 Social and web ----------
slide = ('<div style="aspect-ratio:16/9;border-radius:16px;background:#0F1114;color:#F2F2EF;padding:36px;display:flex;flex-direction:column;align-items:flex-start;justify-content:space-between;box-shadow:0 0 0 1px #262A30">' + lock(32, ring=CAN, word=CAN) +
         '<div style="font:600 44px/1.05 Geist;letter-spacing:-.035em">Checkout v3<br>design review</div><div class="mono" style="font-size:14px;color:#9B9C98">Brightwater · Q4</div></div>')
page('In use · 21', 'Social and web', 'Midnight carries the brand on social and in presentations. The website leads with the product, not with illustration.',
     '<div class="grid" style="grid-template-columns:1fr 1fr;gap:28px;height:100%">'
     '<div style="display:flex;flex-direction:column;gap:18px;min-height:0"><img src="../social/og-image.png" style="height:380px;width:auto;max-width:100%;border-radius:16px;display:block;box-shadow:0 0 0 1px #E6E6E1;object-fit:cover">'
     '<div class="row" style="gap:20px"><img src="../social/social-avatar-400.png" style="width:96px;height:96px;border-radius:50%;display:block"><div class="cap" style="margin:0"><b>Link previews and profiles.</b> 1200 × 630 for links, 400 × 400 avatar, 1500 × 500 banner.</div></div></div>'
     '<div style="display:flex;flex-direction:column;gap:18px;min-height:0"><div style="height:250px">' + slide.replace('aspect-ratio:16/9;', 'height:100%;') + '</div>'
     '<div style="height:260px;border-radius:16px;overflow:hidden;box-shadow:0 0 0 1px #E6E6E1"><img src="img/ui-welcome.png" style="width:100%;display:block"></div></div></div>')

# ---------- 24 Assets ----------
tree = '''brand/
  logo/mark/        halo-mark-{color,reversed,black,white}.svg + png/
                    halo-mark-small-*.svg        (below 24 px)
  logo/wordmark/    halo-wordmark-{ink,white}.svg
  logo/lockup/      halo-lockup-{horizontal,stacked}-{color,reversed,black,white}.svg
  app-icon/         halo-app-icon-{dark,light}[-fullbleed].svg + png/
  favicon/          favicon.svg  favicon.ico  apple-touch-icon.png  icon-*.png
  social/           og-image.png  social-banner-1500x500.png  social-avatar-400.png
  tokens/           tokens.json (W3C design tokens)  tokens.css  contrast.json'''
page('In use · 22', 'Assets and contact', 'Always start from these files. Name exports as halo-<asset>-<variant>-<size>.',
     '<div class="grid" style="grid-template-columns:1.5fr 1fr;gap:32px;height:100%"><div class="card" style="background:#0F1114;color:#F2F2EF;box-shadow:none"><pre class="mono" style="font-size:19px;line-height:1.75;white-space:pre-wrap">' + H.escape(tree) + '</pre></div>'
     '<div class="card" style="display:flex;flex-direction:column"><div class="lab">Questions and approvals</div><div style="font:600 44px/1.1 Geist;letter-spacing:-.03em;margin-top:24px">brand@myhalo.co</div><p class="p">If something isn’t covered here, ask before you ship it. We’d rather help early than fix it later.</p><div style="margin-top:auto">' + lock(48) + '</div></div></div>')

# ---------- Render ----------
out = ['<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Halo · Brand guidelines</title><style>%s</style></head><body>' % CSS]
total = len(PAGES)
for i, (eb, title, lede, body, cls, num) in enumerate(PAGES):
    hd = ''
    if eb: hd += '<div class="eb"><i></i>%s</div>' % eb
    if title: hd += '<h1 class="t">%s</h1>' % H.escape(title)
    if lede: hd += '<p class="lede">%s</p>' % H.escape(lede)
    foot = '<div class="pf"><span><b>Halo</b> · Brand guidelines</span><span>%02d</span></div>' % (i + 1) if num else ''
    out.append('<section class="page %s">%s<div class="body">%s</div>%s</section>' % (cls, hd, body, foot))
out.append('</body></html>')
os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, 'w').write('\n'.join(out))
print('pages', total, 'bytes', os.path.getsize(OUT))

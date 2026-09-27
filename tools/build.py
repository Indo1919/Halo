"""Build Halo into self-contained HTML files.
   dist/index.html        — GitHub Pages entry (loads optional halo.config.js, links favicons + manifest)
   dist/halo-artifact.html — fragment for publishing as a Claude artifact (no external files at all)
usage: python3 tools/build.py"""
import base64, os, re, json, datetime
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src')
b64 = lambda p: base64.b64encode(open(p, 'rb').read()).decode()

html = open(os.path.join(SRC, 'index.html')).read()
def block(name):
    m = re.search(r'<!-- build:%s -->(.*?)<!-- /build:%s -->' % (name, name), html, re.S)
    return m.group(0), m.group(1)

# CSS: concatenate in order, inline fonts, strip comments
css_full, css_inner = block('css')
css = []
for href in re.findall(r'href="([^"]+\.css)"', css_inner):
    text = open(os.path.join(SRC, href)).read()
    def font(m):
        path = os.path.normpath(os.path.join(SRC, os.path.dirname(href), m.group(1)))
        return "url(data:font/woff2;base64,%s)" % b64(path)
    text = re.sub(r"url\('([^']+\.woff2)'\)", font, text)
    css.append('/* %s */\n%s' % (href, text))
css = '\n'.join(css)
css = re.sub(r'/\*(?!\s*(src|styles)/).*?\*/', '', css, flags=re.S)       # drop comments (keep file markers)
css = re.sub(r'\n\s*\n+', '\n', css)

# JS: concatenate in order (skip the external config), then boot
js_full, js_inner = block('js')
parts = []
for src in re.findall(r'<script src="([^"]+)"></script>', js_inner):
    if src.endswith('halo.config.js'): continue
    parts.append('/* ---- %s ---- */\n%s' % (src, open(os.path.join(SRC, src)).read()))
js = '\n'.join(parts) + '\nH.boot();\n'
assert '</script' not in js.lower(), 'script terminator inside JS'

head_full, _ = block('head')
stamp = datetime.date.today().isoformat()
fav_svg = open(os.path.join(ROOT, 'brand/favicon/favicon.svg')).read()

# 1) GitHub Pages build
pages_head = '\n'.join([
  '<link rel="icon" href="brand/favicon/favicon.svg" type="image/svg+xml">',
  '<link rel="icon" href="brand/favicon/favicon-32.png" sizes="32x32" type="image/png">',
  '<link rel="apple-touch-icon" href="brand/favicon/apple-touch-icon.png">',
  '<link rel="manifest" href="manifest.webmanifest">',
  '<meta property="og:type" content="website">',
  '<meta property="og:title" content="Halo · Your work, represented.">',
  '<meta property="og:description" content="Halo turns the signal you already create into status updates in your own voice.">',
  '<meta property="og:image" content="brand/social/og-image.png">',
  '<meta name="twitter:card" content="summary_large_image">',
  '<meta name="generator" content="Halo build %s">' % stamp])
out = html.replace(head_full, pages_head)
out = out.replace(css_full, '<style>\n%s\n</style>' % css)
out = out.replace(js_full, '<script src="halo.config.js"></script>\n<script>\n%s</script>' % js)
open(os.path.join(ROOT, 'dist/index.html'), 'w').write(out)
open(os.path.join(ROOT, 'index.html'), 'w').write(out)          # GitHub Pages serves the repo root

# 2) Artifact fragment: <title> first, no doctype/html/head/body, no external files
body = re.search(r'<body>(.*?)<!-- build:js -->', html, re.S).group(1)
metas = re.findall(r'<meta name="(?:viewport|description|theme-color)"[^>]*>', html)
frag = '\n'.join(['<title>Halo</title>'] + metas + [
  '<link rel="icon" href="data:image/svg+xml;base64,%s">' % base64.b64encode(fav_svg.encode()).decode(),
  '<style>\n%s\n</style>' % css,
  # Artifact viewers pad :root for phone safe areas, so size the one-screen app to 100% rather than 100vh.
  '<style>html,body{height:100%}#root{height:100%}.app{height:100%}.fs,.si,.ob{min-height:100%}</style>',
  body.strip(),
  '<script>\nwindow.HALO_CONFIG = { proxyUrl: \'\' };\n%s</script>' % js])
open(os.path.join(ROOT, 'dist/halo-artifact.html'), 'w').write(frag)
for f in ('index.html', 'halo-artifact.html'):
    print('%-20s %7.1f KB' % (f, os.path.getsize(os.path.join(ROOT, 'dist', f)) / 1024))

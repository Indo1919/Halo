// Exports the welcome explainer (src/js/screens/explainer.js) as a silent, seamless loop, frame by frame.
// usage: node tools/film/explainer.mjs [out=film/halo-explainer-loop.mp4] [fps=30] [theme=light]
//        node tools/film/explainer.mjs stills:4.7,10.9 outDir      (QA stills)
let chromium; try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = await import('/opt/node-tools/node_modules/playwright/index.mjs')); }
import { spawn } from 'child_process';
import path from 'path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const [, , target = path.join(root, 'film/halo-explainer-loop.mp4'), arg2 = '30', theme = 'light'] = process.argv;
// Lay out at the composition's own size (1080x608) and rasterize at 16/9 of that, so text is set natively, not scaled.
const W = 1080, Hh = 608, DPR = 1920 / 1080;
const b = await chromium.launch({ args: ['--font-render-hinting=none'] });   // even glyph spacing at any scale
const p = await b.newPage({ viewport: { width: W, height: Hh }, deviceScaleFactor: DPR, colorScheme: theme, reducedMotion: 'reduce' });
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto('file://' + root + '/index.html?theme=' + theme + '#/welcome');
await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} }); await p.reload();
await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(600);
// Full-bleed stage: the explainer fills the frame, without the page, the rail or the rounded frame.
await p.addStyleTag({ content: `.wl-ex{position:fixed;inset:0;margin:0;max-width:none;z-index:9999;background:var(--bg-sunken)}
  .ex-rail{display:none}.ex-frame{border-radius:0;box-shadow:none;width:${W}px;height:${Hh}px;aspect-ratio:auto;max-width:none}` });
await p.waitForTimeout(300);
const mode = await p.evaluate(() => H.explainer.state().mode);
if (mode !== 'wide') throw new Error('expected the wide composition, got ' + mode);
const seek = t => p.evaluate(t => { H.explainer.seek(t); return new Promise(r => requestAnimationFrame(() => r())); }, t);
if (target.startsWith('stills:')) {
  const times = target.slice(7).split(',').map(Number), dir = arg2;
  for (const t of times) { await seek(t); await p.screenshot({ path: `${dir}/loop-${String(t).replace('.', '_')}.png` }); }
  console.log('stills', times.length, errs.length ? 'ERRORS: ' + errs.join(' | ') : 'ok');
} else {
  const fps = +arg2, D = await p.evaluate(() => H.explainer.D), N = Math.round(D * fps);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-', '-vf', 'crop=1920:1080:0:0', '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
    '-crf', '20', '-preset', 'slow', '-tune', 'animation', '-movflags', '+faststart', target], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let i = 0; i < N; i++) {
    await seek(i / fps);
    const buf = await p.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 270 === 0) console.log('frame', i, '/', N, ((Date.now() - t0) / 1000).toFixed(0) + 's');
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  console.log('done', target, N, 'frames', errs.length ? 'ERRORS: ' + errs.slice(0, 3).join(' | ') : 'no errors');
}
await b.close();

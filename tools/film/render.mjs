// Renders the Halo film frame by frame and encodes with ffmpeg (H.264, yuv420p).
// usage: node tools/film/render.mjs wide|vertical out.mp4 [fps]
//        node tools/film/render.mjs wide stills:5,13.5,16 outDir     (QA stills as PNG)
let chromium; try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = await import('/opt/node-tools/node_modules/playwright/index.mjs')); }
import { spawn } from 'child_process';
import path from 'path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const [, , format = 'wide', target = 'film.mp4', arg3 = '30'] = process.argv;
const W = format === 'vertical' ? 1080 : 1920, Hh = format === 'vertical' ? 1920 : 1080;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: W, height: Hh }, deviceScaleFactor: 1 });
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto('file://' + root + '/film/src/film.html' + (format === 'vertical' ? '?format=vertical' : ''));
await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(600);
const seek = t => p.evaluate(t => { window.seek(t); return new Promise(r => requestAnimationFrame(() => r())); }, t);
if (target.startsWith('stills:')) {
  const times = target.slice(7).split(',').map(Number), dir = arg3;
  for (const t of times) { await seek(t); await p.screenshot({ path: `${dir}/${format}-${String(t).replace('.', '_')}.png` }); }
  console.log('stills', times.length, errs.length ? 'ERRORS: ' + errs.join(' | ') : 'ok');
} else {
  const fps = +arg3, dur = await p.evaluate(() => window.DURATION), N = Math.round(dur * fps);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', '-tune', 'animation', '-movflags', '+faststart', target], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let i = 0; i < N; i++) {
    await seek(i / fps);
    const buf = await p.screenshot({ type: 'jpeg', quality: 94 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 300 === 0) console.log('frame', i, '/', N, ((Date.now() - t0) / 1000).toFixed(0) + 's');
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  console.log('done', target, N, 'frames', errs.length ? 'ERRORS: ' + errs.slice(0, 3).join(' | ') : 'no errors');
}
await b.close();

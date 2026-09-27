// QA stills of the welcome explainer at exact times.
// usage: node tools/explainer-qa.mjs outDir [width=1440] [height=900] [theme=light|dark] [times=keys|t1,t2,...] [file=src/index.html]
let chromium; try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = await import('/opt/node-tools/node_modules/playwright/index.mjs')); }
import path from 'path';
import fs from 'fs';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const [, , out = '/tmp/ex', w = '1440', h = '900', theme = 'light', times = 'keys', file = 'src/index.html'] = process.argv;
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +(process.env.DPR || 1), colorScheme: theme === 'dark' ? 'dark' : 'light' });
const errs = [];
p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
p.on('pageerror', e => errs.push('pageerror: ' + e.message));
await p.goto('file://' + root + '/' + file + '?theme=' + theme + '#/welcome');
await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await p.reload();
await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(700);
const list = times === 'keys' ? await p.evaluate(() => H.explainer.CH.map(c => c.key)) : times.split(',').map(Number);
const el = await p.$('#wl-ex');
if (process.env.PAGE) await p.screenshot({ path: `${out}/page-${w}-${theme}.png` });
for (const t of list) {
  await p.evaluate(t => { H.explainer.seek(t); return new Promise(r => requestAnimationFrame(() => r())); }, t);
  await el.screenshot({ path: `${out}/ex-${w}-${theme}-${String(t).replace('.', '_')}.png` });
}
const st = await p.evaluate(() => H.explainer.state());
const relevant = errs.filter(e => !/ERR_FILE_NOT_FOUND|Failed to load resource/.test(e));
console.log('stills', list.length, JSON.stringify(st), relevant.length ? '\n' + relevant.join('\n') : '(no errors)');
await b.close();

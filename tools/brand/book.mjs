// Exports brand/guidelines/index.html to PDF and per-page PNG previews.
// usage: node tools/brand/book.mjs [pngDir]
let chromium; try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = await import('/opt/node-tools/node_modules/playwright/index.mjs')); }
import path from 'path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const pngDir = process.argv[2];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
const errs = [];
p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto('file://' + root + '/brand/guidelines/index.html');
await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(700);
const n = await p.evaluate(() => document.querySelectorAll('.page').length);
if (pngDir) {
  const pages = await p.$$('.page');
  for (let i = 0; i < pages.length; i++) await pages[i].screenshot({ path: `${pngDir}/p${String(i + 1).padStart(2, '0')}.png` });
}
await p.emulateMedia({ media: 'print' });
await p.pdf({ path: root + '/brand/Halo-Brand-Guidelines.pdf', width: '1920px', height: '1080px', printBackground: true, preferCSSPageSize: true });
console.log('pages', n, errs.length ? 'ERRORS: ' + errs.join(' | ') : 'no errors'); await b.close();

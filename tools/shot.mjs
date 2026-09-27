// usage: node tools/shot.mjs <html> <png> [width] [height] [fullPage] [scale]
let chromium; try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = await import('/opt/node-tools/node_modules/playwright/index.mjs')); }
const [,, src, out, w = '1400', h = '900', full = '1', scale = '1'] = process.argv;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +scale });
await p.goto('file://' + (src.startsWith('/') ? src : process.cwd() + '/' + src));
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(250);
const ok = await p.evaluate(() => [...document.fonts].map(f => f.family + ':' + f.status).join(', '));
await p.screenshot({ path: out, fullPage: full === '1' });
await b.close();
console.log('shot', out, '| fonts:', ok);

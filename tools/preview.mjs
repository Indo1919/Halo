// Screenshot a route of the dev build and report console errors.
// usage: node tools/preview.mjs '#/home' out.png [width=1440] [height=900] [theme=light|dark] [full=0|1] [extra-query]
let chromium; try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = await import('/opt/node-tools/node_modules/playwright/index.mjs')); }
import path from 'path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const [, , route = '#/home', out = '/tmp/halo.png', w = '1440', h = '900', theme = 'light', full = '0', extra = ''] = process.argv;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1, colorScheme: theme === 'dark' ? 'dark' : 'light' });
const errs = [];
p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
p.on('pageerror', e => errs.push('pageerror: ' + e.message));
await p.goto('file://' + root + '/src/index.html?skip-onboarding&theme=' + theme + (extra ? '&' + extra : '') + route);
await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(600);
if (process.env.ACTIONS) { for (const a of process.env.ACTIONS.split(';;')) { await p.evaluate(a); await p.waitForTimeout(450); } }
await p.screenshot({ path: out, fullPage: full === '1' });
const relevant = errs.filter(e => !/ERR_FILE_NOT_FOUND|Failed to load resource/.test(e));
console.log('shot', out, relevant.length ? '\n' + relevant.join('\n') : '(no errors)');
await b.close();

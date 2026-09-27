let chromium; try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = await import('/opt/node-tools/node_modules/playwright/index.mjs')); }
import path from 'path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 1700 } });
await p.goto('file://' + root + '/tools/brand/social.html'); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(200);
for (const [id, out] of [['og', 'og-image.png'], ['banner', 'social-banner-1500x500.png'], ['avatar', 'social-avatar-400.png']])
  await (await p.$('#' + id)).screenshot({ path: root + '/brand/social/' + out });
await b.close(); console.log('social ok');

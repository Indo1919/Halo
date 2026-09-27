// Renders SVG -> PNG with transparency at exact pixel sizes. usage: node tools/brand/render.mjs
let chromium; try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = await import('/opt/node-tools/node_modules/playwright/index.mjs')); }
import fs from 'fs'; import path from 'path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const jobs = JSON.parse(fs.readFileSync(path.join(root, 'tools/brand/render-jobs.json')));
const tmp = path.join(root, 'tools/brand/.render.html');
const b = await chromium.launch();
const p = await b.newPage({ deviceScaleFactor: 1 });
for (const [svg, out, w, h] of jobs) {
  const o = path.join(root, 'brand', out); fs.mkdirSync(path.dirname(o), { recursive: true });
  const abs = path.isAbsolute(svg) ? svg : path.join(root, svg);
  fs.writeFileSync(tmp, `<!doctype html><html><body style="margin:0;background:transparent"><img src="file://${abs}" style="width:${w}px;height:${h}px;display:block"></body></html>`);
  await p.setViewportSize({ width: w, height: h });
  await p.goto('file://' + tmp); await p.waitForFunction(() => document.images[0].complete);
  await p.screenshot({ path: o, omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } });
}
fs.unlinkSync(tmp); await b.close(); console.log('rendered', jobs.length);

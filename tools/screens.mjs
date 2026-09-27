// Captures README screenshots from the built index.html. usage: node tools/screens.mjs
let chromium; try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = await import('/opt/node-tools/node_modules/playwright/index.mjs')); }
import path from 'path'; import fs from 'fs';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.join(root, 'docs/screenshots'); fs.mkdirSync(out, { recursive: true });
const shots = [
  ['welcome', '#/welcome', 1440, 900, 'light', 'H.explainer.seek(4.7)', 300], ['welcome-explainer', '#/welcome', 1440, 900, 'light', "H.explainer.seek(10.9); document.getElementById('wl-ex').scrollIntoView({ block: 'center' })", 400], ['home', '#/home', 1440, 900, 'light'], ['home-dark', '#/home', 1440, 900, 'dark'],
  ['digest', '#/digest', 1440, 900, 'light'], ['ask', '#/ask', 1440, 900, 'light', "H.askSend('Summarize my week for Rosa')", 3200],
  ['tickets-board', '#/tickets', 1440, 900, 'light', "H.act.setPref('ticketsView','board')", 400], ['ticket', '#/tickets/CHK-142', 1440, 900, 'light'],
  ['calendar', '#/calendar', 1440, 900, 'light'], ['recap', '#/recap/kickoff', 1440, 900, 'light'], ['voice', '#/privacy/voice', 1440, 900, 'dark'],
  ['phone-home', '#/home', 390, 844, 'light'], ['phone-digest', '#/digest', 390, 844, 'dark']
];
const b = await chromium.launch({ args: ['--font-render-hinting=none'] });
for (const [name, route, w, h, theme, action, wait] of shots) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2, colorScheme: theme });
  await p.goto('file://' + root + '/index.html?skip-onboarding&theme=' + theme + route);
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
  if (action) { await p.evaluate(action); await p.waitForTimeout(wait || 400); }
  await p.screenshot({ path: path.join(out, name + '.png') }); await p.close();
}
await b.close(); console.log('screens', shots.length);

// End-to-end walk through the built app from a clean first run. usage: node tools/e2e.mjs <siteDir> <outDir>
let chromium; try { ({ chromium } = await import('playwright')); } catch { ({ chromium } = await import('/opt/node-tools/node_modules/playwright/index.mjs')); }
const [, , site, out] = process.argv;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
p.on('pageerror', e => errs.push('pageerror: ' + e.message));
const wait = ms => p.waitForTimeout(ms);
const click = async (sel, label) => { try { await p.click(sel, { timeout: 3000 }); await wait(250); } catch (e) { errs.push('CLICK FAIL ' + (label || sel) + ': ' + e.message.split('\n')[0]); } };
const shot = async n => p.screenshot({ path: `${out}/${n}.png` });
await p.goto('file://' + site + '/index.html'); await wait(700);
console.log('start route', await p.evaluate(() => location.hash));
await click('[data-action="wl-start"]', 'get started');
await click('[data-action="si-sso"][data-p="google"]', 'google');
await click('[data-action="sso-pick"]', 'pick account');
console.log('after sign in', await p.evaluate(() => location.hash));
for (let i = 0; i < 7; i++) { await click('#ob-cta', 'ob step ' + i); await wait(200); }
await wait(4500); await shot('e2e-warmup');
await click('#ob-cta', 'open halo'); await wait(1400);
console.log('after onboarding', await p.evaluate(() => location.hash), 'tour active', await p.evaluate(() => H.tour && H.tour.active));
for (let i = 0; i < 6; i++) { await p.keyboard.press('ArrowRight'); await wait(250); }
await shot('e2e-home');
// Digest
await p.evaluate(() => H.go('#/digest')); await wait(500);
await click('[data-action="dg-decide"][data-s="approved"]', 'approve first');
await click('[data-action="dg-all"]', 'approve all');
await shot('e2e-digest');
// Ask
await p.evaluate(() => H.go('#/ask')); await wait(400);
await click('[data-action="ask-suggest"]', 'suggestion'); await wait(3500); await shot('e2e-ask');
// Tickets
await p.evaluate(() => H.go('#/tickets')); await wait(400);
await p.evaluate(() => H.act.setPref('ticketsView', 'board')); await wait(400); await shot('e2e-board');
await p.evaluate(() => H.act.setPref('ticketsView', 'list')); await wait(300);
await p.evaluate(() => H.go('#/tickets/CHK-142')); await wait(500);
await click('.check[aria-checked="false"]', 'subtask check'); await shot('e2e-ticket');
// Calendar + recap
await p.evaluate(() => H.go('#/calendar')); await wait(500);
await click('[data-action="cal-ev"]', 'calendar event'); await wait(300); await shot('e2e-cal-sheet');
await p.keyboard.press('Escape'); await wait(300);
await p.evaluate(() => H.go('#/recap/kickoff')); await wait(500);
const created = await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /Create 1 ticket/.test(x.textContent)); if (b) { b.click(); return true; } return false; });
await wait(600); console.log('recap create clicked', created, 'recap state', await p.evaluate(() => JSON.stringify(H.store.state.recaps.kickoff)));
await shot('e2e-recap');
// Team, history, sources, privacy, settings
for (const r of ['#/team', '#/team/leo', '#/history', '#/history/asks', '#/history/activity', '#/sources', '#/sources/notion', '#/privacy', '#/privacy/boundaries', '#/privacy/data', '#/settings', '#/settings/trust', '#/settings/notifications', '#/settings/appearance', '#/settings/ai', '#/settings/workspace', '#/settings/keyboard', '#/settings/about', '#/nope']) {
  await p.evaluate(r => H.go(r), r); await wait(350);
  const empty = await p.evaluate(() => (document.querySelector('.page') || document.body).innerText.trim().length);
  if (empty < 40) errs.push('SPARSE ' + r + ' (' + empty + ' chars)');
}
// Global surfaces
await p.evaluate(() => H.go('#/home')); await wait(300);
await p.keyboard.press('Control+k'); await wait(300); await p.keyboard.type('CHK-139'); await wait(300); await p.keyboard.press('Enter'); await wait(500);
console.log('palette nav ->', await p.evaluate(() => location.hash));
await p.keyboard.press('n'); await wait(400); await shot('e2e-quickadd'); await p.keyboard.press('Escape'); await wait(300);
await p.keyboard.press(']'); await wait(300); console.log('mode after ]', await p.evaluate(() => H.store.state.prefs.mode));
await p.evaluate(() => H.act.setPref('theme', 'dark')); await wait(300); await p.evaluate(() => H.go('#/home')); await wait(500); await shot('e2e-home-dark');
await p.setViewportSize({ width: 390, height: 844 }); await wait(400); await shot('e2e-phone-home');
await p.evaluate(() => H.go('#/digest')); await wait(400); await shot('e2e-phone-digest');
console.log(errs.length ? 'ISSUES:\n' + errs.join('\n') : 'no issues');
await b.close();

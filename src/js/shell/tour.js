/* Product tour: a short spotlight walk-through of the core ideas. */
(function (H) {
  'use strict';
  var esc = H.esc, ui = H.ui;
  var STEPS = [
    { sel: '[data-tour="status"]', title: 'This is what Halo says about you', body: 'Halo keeps this current from the work you already do. Switch the audience to see how the same truth reads for your team, your manager or leadership.' },
    { sel: '[data-tour="digest"]', title: 'Your once-a-day decision point', body: 'Routine updates share themselves. Anything touching dates, people or low-confidence claims waits here for a two-minute review.' },
    { sel: '[data-tour="trust"]', title: 'One dial for how much Halo shares', body: 'Curated, Balanced or Ambient. Turn it any time with [ and ]. Private topics are never shared, whatever the setting.', desktop: true },
    { sel: '[data-tour="recap"]', title: 'Meetings become tickets', body: 'When a meeting ends, Halo drafts the ticket and subtasks from what was decided, with honest estimates.' },
    { sel: '.nav-item[href="#/ask"]', title: 'Ask Halo anything', body: 'Where a ticket stands, what shipped this week, or how to phrase an update for Rosa. Answers come in your voice.', desktop: true },
    { sel: '.nav-item[href="#/tickets"]', title: 'Estimates that learn your pace', body: 'Three-point estimates adjust to how long your finished work actually took, so your week stays honest.', desktop: true }
  ];
  var t = H.tour = { active: false, i: 0, steps: [] };
  function phone() { return window.innerWidth < 761; }
  function available() { return STEPS.filter(function (s) { return !(s.desktop && phone()) && document.querySelector(s.sel); }); }

  t.start = function () {
    if (H.route.name !== 'home') { H.go('#/home'); setTimeout(t.start, 450); return; }
    ui.close(true); ui.closeMenu();
    t.steps = available(); if (!t.steps.length) return;
    t.active = true; t.i = 0; H.render();
  };
  t.stop = function (finished) {
    if (!t.active) return;
    t.active = false; H.store.commit(function (s) { s.session.tourDone = true; });
    ui.toast(finished ? 'You’re all set. Press ? any time for shortcuts.' : 'Tour closed. Find it again under Help.', { icon: finished ? 'check-circle' : 'compass' });
  };
  t.next = function () { if (t.i < t.steps.length - 1) { t.i++; scrollTo(); H.render(); } else t.stop(true); };
  t.prev = function () { if (t.i > 0) { t.i--; scrollTo(); H.render(); } };
  function scrollTo() { var s = t.steps[t.i], el = s && document.querySelector(s.sel); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }

  t.render = function () {
    if (!t.active) return '';
    var s = t.steps[t.i]; if (!s) return '';
    var p = t.pos && t.pos.i === t.i ? t.pos : null;
    var spotStyle = p && p.spot ? 'left:' + p.spot[0] + 'px;top:' + p.spot[1] + 'px;width:' + p.spot[2] + 'px;height:' + p.spot[3] + 'px;opacity:' + (phone() ? 0 : 1) : 'opacity:0';
    var cardStyle = p ? (p.card ? 'left:' + p.card[0] + 'px;top:' + p.card[1] + 'px;opacity:1' : 'opacity:1') : 'opacity:0';
    return '<div class="tr-block" data-key="tr-block"></div><div class="tr-spot" id="tr-spot" data-key="tr-spot" style="' + spotStyle + '"></div>' +
      '<div class="tr-card" id="tr-card" role="dialog" aria-modal="true" aria-label="Product tour" data-key="tr-card" style="' + cardStyle + '">' +
      '<div class="row gap-2"><span class="kicker">' + ui.mark(14) + '<span>Tour · ' + (t.i + 1) + ' of ' + t.steps.length + '</span></span><button type="button" class="icon-btn xs ml-auto" data-action="tour-skip" aria-label="Close tour" data-tip="Close tour">' + H.icon('x', 14) + '</button></div>' +
      '<h3>' + esc(s.title) + '</h3><p>' + esc(s.body) + '</p>' +
      '<div class="tr-foot"><div class="tr-dots">' + t.steps.map(function (x, j) { return '<i class="' + (j === t.i ? 'on' : '') + '"></i>'; }).join('') + '</div><span class="grow"></span>' +
        (t.i > 0 ? ui.btn('Back', { kind: 'ghost', size: 'sm', action: 'tour-prev' }) : ui.btn('Skip', { kind: 'ghost', size: 'sm', action: 'tour-skip' })) +
        ui.btn(t.i === t.steps.length - 1 ? 'Done' : 'Next', { kind: 'primary', size: 'sm', action: 'tour-next', attrs: { autofocus: true } }) + '</div></div>';
  };
  function position() {
    if (!t.active) return;
    var s = t.steps[t.i], el = s && document.querySelector(s.sel), spot = document.getElementById('tr-spot'), card = document.getElementById('tr-card');
    if (!card) return;
    if (!el) { t.steps = available(); if (!t.steps.length) return t.stop(); t.i = Math.min(t.i, t.steps.length - 1); return H.render(); }
    var r = el.getBoundingClientRect(), pad = 6, vw = window.innerWidth, vh = window.innerHeight;
    t.pos = { i: t.i, spot: [Math.round(r.left - pad), Math.round(r.top - pad), Math.round(r.width + pad * 2), Math.round(r.height + pad * 2)], card: null };
    if (spot) { spot.style.opacity = phone() ? '0' : '1'; spot.style.left = t.pos.spot[0] + 'px'; spot.style.top = t.pos.spot[1] + 'px'; spot.style.width = t.pos.spot[2] + 'px'; spot.style.height = t.pos.spot[3] + 'px'; }
    card.style.opacity = '1';
    if (phone()) return;
    var cw = card.offsetWidth, ch = card.offsetHeight, gap = 16, left, top;
    if (r.right + gap + cw < vw - 12) { left = r.right + gap; top = r.top; }
    else if (r.bottom + gap + ch < vh - 12) { left = r.left; top = r.bottom + gap; }
    else if (r.top - gap - ch > 12) { left = r.left; top = r.top - gap - ch; }
    else { left = r.left - gap - cw; top = r.top; }
    left = Math.max(12, Math.min(left, vw - cw - 12)); top = Math.max(12, Math.min(top, vh - ch - 12));
    t.pos.card = [Math.round(left), Math.round(top)];
    card.style.left = t.pos.card[0] + 'px'; card.style.top = t.pos.card[1] + 'px';
  }
  var raf = null;
  function schedule() { if (!t.active) return; cancelAnimationFrame(raf); raf = requestAnimationFrame(position); }
  var paint = H.render; // reposition after every paint
  H.render = function () { paint(); if (t.active) setTimeout(schedule, 30); };
  window.addEventListener('resize', schedule);
  document.addEventListener('scroll', schedule, true);
  document.addEventListener('keydown', function (e) {
    if (!t.active) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); t.next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); t.prev(); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); t.stop(false); H.render(); }
  }, true);
  H.actions['tour-next'] = function () { t.next(); };
  H.actions['tour-prev'] = function () { t.prev(); };
  H.actions['tour-skip'] = function () { t.stop(false); H.render(); };
})(window.H = window.H || {});

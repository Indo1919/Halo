/* Halo launch film — deterministic timeline. window.seek(t) renders the frame at t seconds.
   ?format=vertical renders the 15-second 9:16 cut. Everything is drawn with the product's own components. */
(function () {
  'use strict';
  var ui = H.ui, VERTICAL = /format=vertical/.test(location.search);
  document.body.setAttribute('data-format', VERTICAL ? 'vertical' : 'wide');
  var stage = document.getElementById('stage');
  var RING = 'M92.426 52.5A42.5 42.5 0 1 1 47.5 7.574L47.5 18.599A31.5 31.5 0 1 0 81.401 52.5Z';
  var SEG = 'M52.5 7.574A42.5 42.5 0 0 1 92.426 47.5L81.401 47.5A31.5 31.5 0 0 0 52.5 18.599Z';
  var AUD = [{ v: 'team', label: 'Team', icon: 'teammate' }, { v: 'manager', label: 'Manager', icon: 'manager' }, { v: 'exec', label: 'Leadership', icon: 'exec' }];
  var LINES = {
    team: 'Payment method selector is in hi-fi. Cards and bank transfer are done, wallets are next, and error-state flows land Thursday.',
    manager: 'Checkout v3 design is moving: payment methods in hi-fi, wallet placement in review. One risk: the selector slips a day.',
    exec: 'Checkout v3 design is on track for October.'
  };

  /* ---------- helpers ---------- */
  var clamp = function (v, a, b) { return Math.min(b == null ? 1 : b, Math.max(a || 0, v)); };
  var P = function (t, a, b) { return clamp((t - a) / (b - a)); };
  var E = {
    out: function (x) { return 1 - Math.pow(1 - x, 3); },
    inOut: function (x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; },
    expo: function (x) { return x >= 1 ? 1 : 1 - Math.pow(2, -10 * x); },
    back: function (x) { var c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }
  };
  var lerp = function (a, b, x) { return a + (b - a) * x; };
  function mk(parent, html, cls, style) {
    var d = document.createElement('div'); if (cls) d.className = cls; if (style) d.style.cssText = style; d.innerHTML = html || ''; parent.appendChild(d); return d;
  }
  function tf(el, o) {
    el.style.opacity = o.op == null ? 1 : o.op;
    el.style.transform = 'translate(' + (o.x || 0) + 'px,' + (o.y || 0) + 'px) scale(' + (o.s == null ? 1 : o.s) + ') rotate(' + (o.r || 0) + 'deg)';
    if (o.blur != null) el.style.filter = o.blur > 0.05 ? 'blur(' + o.blur.toFixed(2) + 'px)' : 'none';
  }
  function words(el, text) {
    el.innerHTML = text.split(/(\s+)/).map(function (w) { return /^\s+$/.test(w) ? w.replace(/\n/g, '<br>') : '<span class="w">' + H.esc(w) + '</span>'; }).join('');
    return Array.prototype.slice.call(el.querySelectorAll('.w'));
  }
  function reveal(spans, p, spread) {
    spread = spread || 2.4; var n = spans.length;
    spans.forEach(function (s, i) { var x = E.out(clamp(p * (n + spread) - i, 0, spread) / spread); s.style.opacity = x; s.style.transform = 'translateY(' + ((1 - x) * 28).toFixed(1) + 'px)'; });
  }
  function fadeIO(t, a, b, fi, fo) { fi = fi || 0.5; fo = fo || 0.5; return Math.min(E.out(P(t, a, a + fi)), 1 - E.inOut(P(t, b - fo, b))); }
  function markSvg(size, ringColor, segColor) {
    return '<svg width="' + size + '" height="' + size + '" viewBox="7.5 7.5 85 85"><path fill="' + ringColor + '" d="' + RING + '"/><path fill="' + (segColor || '#FF4405') + '" d="' + SEG + '"/></svg>';
  }
  function wordmark(h, color) {
    return '<svg height="' + h + '" viewBox="79.999 -710 1961.803 722" style="display:block"><path fill="' + color + '" d="' + WORD + '"/></svg>';
  }
  var WORD = '';
  var SCENES = [];
  function scene(a, b, cls, build) { var el = mk(stage, '', 'scene ' + (cls || '')); var fn = build(el); SCENES.push({ a: a, b: b, el: el, fn: fn }); }
  function setSeg(root, v) { Array.prototype.forEach.call(root.querySelectorAll('.seg-item'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === v)); }); }
  function statusCard(aud) {
    return '<section class="card hero" style="width:760px;min-height:0;box-shadow:0 0 0 1px #E6E6E1,0 40px 80px -40px rgba(10,10,10,.28)">' +
      '<div class="hero-top"><span class="kicker">' + ui.mark(16) + '<span>What Halo is saying about you</span></span><div class="ml-auto">' + ui.seg('a', AUD, aud, { size: 'sm' }) + '</div></div>' +
      '<p class="hero-text" data-text style="min-height:96px"></p>' +
      '<div class="hero-foot"><div class="row gap-2 wrap" data-srcs>' + ui.src('figma', 'Payment methods') + ui.src('jira', 'CHK-142') + ui.src('zoom', 'Error states kickoff') +
      '<span class="redacted-chip"><span class="bars"><i></i><i></i></span>Redacted: 1 private topic</span></div></div></section>';
  }
  function dgCard(o) {
    return '<article class="card dg-card" style="width:680px;box-shadow:0 0 0 1px #E6E6E1,0 24px 50px -30px rgba(10,10,10,.25)"><div class="dg-head"><span class="dg-kind">' + H.icon(o.icon, 16) + '</span>' +
      '<div class="grow"><div class="dg-title">' + o.title + '</div><div class="meta"><span>' + o.when + '</span></div></div><span class="aud-btn">' + H.icon(o.aud === 'Manager' ? 'manager' : 'teammate', 14) + '<span>' + o.aud + '</span></span></div>' +
      '<div class="dg-reason">' + H.icon('info', 14) + '<span>' + o.reason + '</span></div><div class="text-block dg-text">' + o.text + '</div>' +
      '<div class="dg-actions"><span class="btn btn-primary btn-sm" data-approve>' + H.icon('check', 16) + '<span>Approve</span></span><span class="btn btn-sm">' + H.icon('edit', 16) + '<span>Edit</span></span><span class="btn btn-sm">' + H.icon('clock', 16) + '<span>Hold</span></span></div></article>';
  }
  var CURSOR = '<svg class="cursor" viewBox="0 0 24 24"><path d="M4.5 2.5 19 13.6l-6.6 1.1 3.9 7.4-3.1 1.6-3.9-7.5-4.8 4.4z" fill="#fff" stroke="#0A0A0A" stroke-width="1.4" stroke-linejoin="round"/></svg>';
  function dial(sweep, size) {
    var r = 40, c = 2 * Math.PI * r;
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" stroke="#ECECE8" stroke-width="10"/><circle cx="50" cy="50" r="40" fill="none" stroke="#FF4405" stroke-width="10" stroke-dasharray="' + (c * sweep / 360).toFixed(1) + ' ' + c.toFixed(1) + '" transform="rotate(-90 50 50)"/></svg>';
  }
  function notif(o) {
    return '<div class="notif">' + H.brandTile(o.b, 48) + '<div style="min-width:0;flex:1"><div class="row" style="gap:10px"><span class="notif-t">' + H.esc(o.t) + '</span><span class="notif-time">' + o.time + '</span></div><div class="notif-b">' + H.esc(o.m) + '</div></div></div>';
  }
  var NOTES = [
    { b: 'slack', t: 'Priya Nair', m: 'Can you send a quick status on checkout before 10?', time: '9:02' },
    { b: 'jira', t: 'Jira', m: 'CHK-142 hasn’t been updated in 3 days.', time: '9:02' },
    { b: 'gcal', t: 'Checkout standup', m: 'Starts in 5 minutes · please add your update', time: '9:03' },
    { b: 'slack', t: 'Nora Lindqvist', m: 'Where are we on the payment selector?', time: '9:03' },
    { b: 'gmail', t: 'Rosa Delgado', m: 'Weekly status doc: fill in your section by Friday', time: '9:04' },
    { b: 'gcal', t: 'Weekly status review', m: 'Thursday · 2:00 PM · 30 min', time: '9:04' },
    { b: 'slack', t: 'Leo Martins', m: 'Did the error states get scoped yet?', time: '9:05' },
    { b: 'jira', t: 'Jira', m: '3 tickets need estimates', time: '9:05' }
  ];

  /* ================= WIDE (16:9, 84s) ================= */
  function buildWide() {
    // S1 — the problem
    scene(0, 12.6, 'dark', function (el) {
      var clock = mk(el, 'Monday, 9:02 AM', 'abs mono', 'left:160px;top:96px;font-size:28px;color:#9B9C98');
      var POS = [[170, 250, -2], [1150, 170, 1.5], [660, 470, -1], [1180, 600, 2], [230, 660, 1.2], [700, 110, -1.5], [1240, 380, -2.2], [540, 320, 1]];
      var cards = NOTES.map(function (n, i) { var c = mk(el, notif(n), 'abs', 'left:' + POS[i][0] + 'px;top:' + POS[i][1] + 'px'); return c; });
      var line = mk(el, '', 'abs cap', 'left:160px;right:160px;top:370px;text-align:center;color:#F2F2EF;font-size:92px');
      var spans = words(line, 'Because I’m tired of being\npaperwork for my own work.');
      return function (t) {
        var out = 1 - E.inOut(P(t, 11.9, 12.6));
        tf(clock, { op: E.out(P(t, 0.2, 1.0)) * (1 - P(t, 6.8, 7.6)) });
        cards.forEach(function (c, i) {
          var a = 1.0 + i * 0.66, p = E.back(P(t, a, a + 0.45)), dim = E.inOut(P(t, 6.6, 7.8));
          tf(c, { op: clamp(P(t, a, a + 0.25)) * (1 - dim * 0.88) * out, y: (1 - p) * 30 + dim * 20, s: (0.92 + 0.08 * p) * (1 - dim * 0.04), r: POS[i][2], blur: dim * 6 });
        });
        reveal(spans, P(t, 7.7, 9.8), 3); line.style.opacity = out;
      };
    });
    // S2 — logo reveal
    scene(12.2, 19.2, 'canvas', function (el) {
      var wipe = mk(el, '', 'abs', 'inset:0;background:#0F1114');
      var M = 200, cap = M / 1.3, wh = cap * 722 / 710, ww = wh * 1961.803 / 722, gap = 0.3 * M, total = M + gap + ww;
      var cx = 960, cy = 470;
      var ringBox = mk(el, markSvg(M, '#0A0A0A', 'transparent'), 'abs', 'left:' + (cx - M / 2) + 'px;top:' + (cy - M / 2) + 'px;width:' + M + 'px;height:' + M + 'px');
      var segBox = mk(el, markSvg(M, 'transparent', '#FF4405'), 'abs', 'left:' + (cx - M / 2) + 'px;top:' + (cy - M / 2) + 'px;width:' + M + 'px;height:' + M + 'px');
      var word = mk(el, wordmark(wh, '#0A0A0A'), 'abs', 'left:' + (cx - total / 2 + M + gap) + 'px;top:' + (cy - wh / 2 + 2) + 'px');
      var tag = mk(el, 'Your work, represented.', 'abs', 'left:0;right:0;top:640px;text-align:center;font:500 52px/1 var(--font-sans);letter-spacing:-0.035em;color:#4B4B47');
      return function (t) {
        var w = E.inOut(P(t, 12.2, 13.3));
        wipe.style.clipPath = 'circle(' + (1 - w) * 1200 + 'px at 50% 50%)'; wipe.style.opacity = 1;
        wipe.style.clipPath = 'circle(' + ((1 - w) * 1250).toFixed(1) + 'px at 960px 470px)';
        var a = E.inOut(P(t, 13.2, 14.3)) * 270, b = E.out(P(t, 14.25, 14.75)) * 90;
        ringBox.style.webkitMaskImage = ringBox.style.maskImage = 'conic-gradient(from 90deg, #000 ' + a.toFixed(2) + 'deg, transparent ' + a.toFixed(2) + 'deg)';
        segBox.style.webkitMaskImage = segBox.style.maskImage = 'conic-gradient(from 0deg, #000 ' + b.toFixed(2) + 'deg, transparent ' + b.toFixed(2) + 'deg)';
        var slide = E.inOut(P(t, 14.9, 15.8)), dx = -(total / 2 - M / 2) * slide;
        var out = 1 - E.inOut(P(t, 18.6, 19.2));
        tf(ringBox, { x: dx, op: out }); tf(segBox, { x: dx, op: out, s: 1 + 0.06 * Math.sin(Math.PI * P(t, 14.6, 15.0)) });
        var wIn = E.out(P(t, 15.35, 16.1)); tf(word, { x: (1 - wIn) * 36, op: wIn * out });
        tf(tag, { y: (1 - E.out(P(t, 16.0, 16.8))) * 20, op: E.out(P(t, 16.0, 16.8)) * out });
      };
    });
    // S3 — signal in, update out
    scene(18.9, 30.8, 'canvas', function (el) {
      var h1 = mk(el, '', 'abs cap-md', 'left:0;right:0;top:130px;text-align:center');
      var s1 = words(h1, 'Halo reads the signal you already create.');
      var h2 = mk(el, '', 'abs cap-md', 'left:0;right:0;top:130px;text-align:center');
      var s2 = words(h2, 'And writes the update in your voice.');
      var ids = ['gcal', 'slack', 'figma', 'github', 'jira', 'zoom'], names = ['Calendar', 'Slack', 'Figma', 'GitHub', 'Jira', 'Zoom'];
      var X = ids.map(function (_, i) { return 385 + i * 230; });
      var svg = mk(el, '<svg width="1920" height="1080">' + X.map(function (x, i) { return '<path id="ln' + i + '" d="M' + x + ' 560 Q ' + x + ' 760 960 800" fill="none" stroke="#D5D5CF" stroke-width="2" stroke-dasharray="6 8"/>'; }).join('') + '</svg>', 'line-sv');
      var tiles = ids.map(function (id, i) { return mk(el, H.brandTile(id, 120, 'tinted') + '<div class="lbl">' + names[i] + '</div>', 'abs', 'left:' + (X[i] - 60) + 'px;top:360px;width:120px;text-align:center'); });
      var dots = []; for (var i = 0; i < 12; i++) dots.push(mk(el, '', 'abs', 'left:0;top:0;width:14px;height:14px;border-radius:50%;background:#FF4405'));
      var ring = mk(el, '<div style="width:190px;height:190px;border-radius:52px;background:#fff;box-shadow:0 0 0 1px #E6E6E1,0 20px 50px -24px rgba(10,10,10,.3);display:grid;place-items:center">' + markSvg(120, '#0A0A0A') + '</div>', 'abs', 'left:865px;top:760px');
      var card = mk(el, statusCard('team'), 'abs scaled', 'left:390px;top:330px;transform-origin:0 0');
      var txt = card.querySelector('[data-text]'), foot = card.querySelector('[data-srcs]');
      return function (t) {
        var inA = fadeIO(t, 18.9, 30.8, 0.5, 0.4);
        reveal(s1, P(t, 19.3, 20.6)); h1.style.opacity = 1 - E.inOut(P(t, 25.2, 25.8));
        reveal(s2, P(t, 25.9, 27.1)); h2.style.opacity = E.out(P(t, 25.9, 26.2)) * (1 - E.inOut(P(t, 30.3, 30.8)));
        var gone = E.inOut(P(t, 25.0, 25.9));
        tiles.forEach(function (tl, i) { var p = E.back(P(t, 19.8 + i * 0.12, 20.4 + i * 0.12)); tf(tl, { op: clamp(P(t, 19.8 + i * 0.12, 20.1 + i * 0.12)) * (1 - gone), y: (1 - p) * 40 - gone * 30, s: 0.9 + 0.1 * p }); });
        svg.style.opacity = E.out(P(t, 20.6, 21.2)) * (1 - gone);
        dots.forEach(function (d, k) {
          var i = k % 6, lap = Math.floor(k / 6), start = 21.0 + i * 0.23 + lap * 0.9, u = ((t - start) / 1.5);
          if (t < start || t > 25.2 || u < 0) { d.style.opacity = 0; return; }
          u = u % 1; var x0 = X[i], y0 = 560, cx = X[i], cy = 760, x1 = 960, y1 = 800;
          var x = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * cx + u * u * x1, y = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * cy + u * u * y1;
          d.style.opacity = Math.min(1, u * 6, (1 - u) * 6) * (1 - gone); d.style.transform = 'translate(' + (x - 7).toFixed(1) + 'px,' + (y - 7).toFixed(1) + 'px)';
        });
        var pulse = 1 + 0.035 * Math.sin((t - 21) * 5.2) * P(t, 21, 21.5) * (1 - P(t, 24.6, 25));
        tf(ring, { op: E.out(P(t, 20.2, 20.8)) * (1 - gone), s: (0.9 + 0.1 * E.back(P(t, 20.2, 20.9))) * pulse, y: -gone * 60 });
        var c = E.out(P(t, 25.7, 26.5));
        tf(card, { op: c * (1 - E.inOut(P(t, 30.3, 30.8)) * 0), y: (1 - c) * 40, s: 1.5 });
        var full = LINES.team, n = Math.round(full.length * P(t, 26.6, 29.2));
        txt.innerHTML = H.esc(full.slice(0, n)) + (n < full.length && t > 26.4 ? '<span style="display:inline-block;width:3px;height:1em;margin-left:3px;vertical-align:-3px;background:#FF4405"></span>' : '');
        foot.style.opacity = E.out(P(t, 29.1, 29.6));
        el.style.opacity = inA;
      };
    });
    // S4 — altitude
    scene(30.5, 42.6, 'canvas', function (el) {
      var h = mk(el, '', 'abs cap-md', 'left:0;right:0;top:130px;text-align:center'); var sp = words(h, 'Same truth. Right altitude.');
      var card = mk(el, statusCard('team'), 'abs scaled', 'left:390px;top:330px;transform:scale(1.5)');
      var txt = card.querySelector('[data-text]'); txt.textContent = LINES.team;
      var note = mk(el, '', 'abs', 'left:0;right:0;top:790px;text-align:center;font:500 32px/1 var(--font-sans);color:#6B6B66;letter-spacing:-0.01em');
      var KEY = [[30.5, 'team', 'For your team: the detail.'], [33.6, 'manager', 'For your manager: progress and risk.'], [37.3, 'exec', 'For leadership: one sentence.'], [40.6, 'team', 'Written from the same facts, in your voice.']];
      return function (t) {
        var k = KEY[0]; KEY.forEach(function (x) { if (t >= x[0]) k = x; });
        var near = Math.min.apply(null, KEY.slice(1).map(function (x) { return Math.abs(t - x[0]); }));
        var dip = clamp(near / 0.28);
        setSeg(card, k[1]); txt.textContent = LINES[k[1]]; txt.style.opacity = 0.15 + 0.85 * E.out(dip);
        note.textContent = k[2]; note.style.opacity = E.out(dip) * E.out(P(t, 31.2, 31.8));
        reveal(sp, P(t, 30.7, 31.9));
        el.style.opacity = 1 - E.inOut(P(t, 42.1, 42.6));
      };
    });
    // S5 — digest, then the trust dial
    scene(42.3, 57.0, 'canvas', function (el) {
      var h = mk(el, '', 'abs', 'left:0;right:0;top:92px;text-align:center;font:600 58px/1.1 var(--font-sans);letter-spacing:-0.04em');
      var sp = words(h, 'Routine updates share themselves.\nSensitive ones wait for you.');
      var left = mk(el, '<div class="row" style="gap:12px;font:600 24px var(--font-sans);margin-bottom:18px">Shared automatically<span class="count-pill quiet" style="font-size:18px">8</span></div>', 'abs', 'left:150px;top:318px;width:720px');
      var AUTO = ['Standup posted to #checkout-standup', 'CHK-142 moved to In progress', 'INV-88 marked Done after PR #479 merged', 'Linked PR #482 to CHK-138'];
      var rows = AUTO.map(function (a) { var r = mk(left, '<span class="ok">' + H.icon('check', 18) + '</span><span>' + a + '</span>', 'row-st', 'margin-bottom:12px'); return r; });
      var right = mk(el, '<div class="row" style="gap:10px;font:600 19px var(--font-sans);margin-bottom:14px">Needs you<span class="count-pill" data-count style="font-size:13px;min-width:22px;height:22px">3</span></div>', 'abs', 'left:980px;top:318px;width:700px;transform-origin:0 0');
      var d1 = mk(right, dgCard({ icon: 'timer', title: 'CHK-142 target moves one day', when: '40m ago', aud: 'Manager', reason: 'Changes a date your manager tracks', text: 'Heads up: the selector needs about a day more than planned. New target is Thursday.' }), '', 'position:relative');
      var ok1 = mk(right, '<div class="row-st" style="width:680px;padding:18px 20px;font-size:17px"><span class="ok">' + H.icon('check', 18) + '</span><span><b style="font-weight:600">Shared with your manager.</b> Rosa will see it the next time she asks.</span></div>', 'abs', 'left:0;top:40px');
      var d2 = mk(right, dgCard({ icon: 'alert', title: 'Blocker that names Leo', when: '30m ago', aud: 'Team', reason: 'Mentions a teammate. Check the tone before it posts', text: 'Waiting on the 3DS error-code list from Leo before I can finish the failure states.' }), '', 'position:relative;margin-top:18px');
      var cur = mk(el, CURSOR, 'abs', 'left:0;top:0;width:34px;height:34px');
      var count = right.querySelector('[data-count]');
      var h2 = mk(el, '', 'abs cap-md', 'left:0;right:0;top:120px;text-align:center'); var sp2 = words(h2, 'One dial. You set the trust.');
      var MODES = [['Curated', 45, 'All 12 wait for you'], ['Balanced', 150, '4 wait for you'], ['Ambient', 270, 'None wait. Private items drop.']];
      var dials = MODES.map(function (m, i) { return mk(el, '<div class="dialbox">' + dial(m[1], 120) + '<h4>' + m[0] + '</h4><p>' + m[2] + '</p></div>', 'abs', 'left:' + (330 + i * 450) + 'px;top:360px'); });
      var target = null;
      return function (t) {
        var A = 1 - E.inOut(P(t, 49.6, 50.3));
        reveal(sp, P(t, 42.6, 43.8)); h.style.opacity = A;
        tf(left, { op: E.out(P(t, 43.0, 43.5)) * A, y: 0 });
        rows.forEach(function (r, i) { var p = E.out(P(t, 43.3 + i * 0.35, 43.8 + i * 0.35)); r.style.opacity = p; r.style.transform = 'translateX(' + ((1 - p) * -24).toFixed(1) + 'px)'; });
        tf(right, { op: E.out(P(t, 43.8, 44.4)) * A, y: (1 - E.out(P(t, 43.8, 44.6))) * 30, s: 1.22 });
        if (!target && t >= 44.7) { var b = d1.querySelector('[data-approve]').getBoundingClientRect(), s = stage.getBoundingClientRect(); target = [b.left - s.left + b.width * 0.45, b.top - s.top + b.height * 0.55]; }
        var mv = E.inOut(P(t, 45.4, 46.6)), clickP = P(t, 46.7, 46.95), tg = target || [1540, 1010];
        var cx = lerp(1540, tg[0], mv), cy = lerp(1010, tg[1], mv);
        cur.style.opacity = E.out(P(t, 45.2, 45.5)) * (1 - P(t, 48.2, 48.6)) * A;
        cur.style.transform = 'translate(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px) scale(' + (1 - 0.18 * Math.sin(Math.PI * clickP)) + ')';
        var done = E.out(P(t, 46.95, 47.4));
        d1.style.opacity = 1 - done; ok1.style.opacity = done * (1 - E.inOut(P(t, 48.4, 48.9)));
        var collapse = E.inOut(P(t, 48.5, 49.2));
        d2.style.transform = 'translateY(' + (-collapse * (d1.offsetHeight + 18)).toFixed(1) + 'px)';
        count.textContent = t >= 47.0 ? '2' : '3';
        reveal(sp2, P(t, 50.2, 51.2)); h2.style.opacity = E.out(P(t, 50.2, 50.5)) * (1 - E.inOut(P(t, 56.5, 57.0)));
        var active = t < 52.2 ? 1 : t < 53.8 ? 2 : t < 55.2 ? 0 : 1;
        dials.forEach(function (d, i) {
          var p = E.back(P(t, 50.4 + i * 0.15, 51.0 + i * 0.15));
          tf(d, { op: clamp(P(t, 50.4 + i * 0.15, 50.7 + i * 0.15)) * (1 - E.inOut(P(t, 56.5, 57.0))), y: (1 - p) * 40, s: i === active ? 1.04 : 0.98 });
          d.firstChild.className = 'dialbox' + (i === active && t > 51.0 ? ' on' : '');
        });
      };
    });
    // S6 — meeting to tickets
    scene(56.7, 67.0, 'canvas', function (el) {
      var h = mk(el, '', 'abs', 'left:0;right:0;top:92px;text-align:center;font:600 58px/1.1 var(--font-sans);letter-spacing:-0.04em');
      var sp = words(h, 'A meeting ends.\nThe plan is already drafted.');
      var ppl = ['priya', 'leo', 'sam', 'hana'].map(function (id) { return H.PEOPLE[id]; });
      var meet = mk(el, '<div class="card" style="width:560px;padding:30px;box-shadow:0 0 0 1px #E6E6E1,0 30px 60px -36px rgba(10,10,10,.3)"><div class="row" style="gap:16px">' + H.brandTile('zoom', 56) +
        '<div><div style="font:600 18px var(--font-sans);color:#6B6B66">Just ended · 1:30 – 2:15 PM</div><div style="font:600 28px/1.2 var(--font-sans);letter-spacing:-0.02em;margin-top:6px">Checkout v3: error states kickoff</div></div></div>' +
        '<div class="row" style="gap:12px;margin-top:26px">' + ui.avatarStack(ppl, 'md', 4) + '<span style="font:400 20px var(--font-sans);color:#6B6B66">5 people</span><span class="badge badge-info badge-lg" style="margin-left:auto;font-size:15px">' + H.icon('wand', 12) + 'Recap ready</span></div></div>', 'abs', 'left:150px;top:420px');
      var arrow = mk(el, '<svg width="170" height="40"><path d="M4 20 H150 M136 8 L152 20 L136 32" fill="none" stroke="#0A0A0A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="200" stroke-dashoffset="200"/></svg>', 'abs', 'left:735px;top:520px');
      var subs = [
        ['maya', 'Audit current decline and error messages', '1.5–4h'], ['leo', 'Map processor error codes to buyer-facing states', '2–6h'],
        ['maya', 'Design declined and expired card recovery', '4–9h'], ['maya', 'Design 3DS failure and timeout states', '3–8h'],
        ['priya', 'Write error copy with Content', '1.5–4h'], ['hana', 'Instrument error events in the funnel', '1–3h']];
      var tk = mk(el, '<div class="card" style="width:900px;padding:30px 34px;box-shadow:0 0 0 1px #E6E6E1,0 30px 60px -36px rgba(10,10,10,.3)">' +
        '<div class="row" style="gap:12px;font:500 18px var(--font-sans);color:#6B6B66">' + H.icon('sparkle', 18) + '<span>Drafted by Halo from this meeting</span><span class="key" style="margin-left:auto;font-size:18px">CHK-154</span></div>' +
        '<div class="row" style="gap:14px;margin-top:14px"><span class="prio prio-high" style="width:14px;height:14px"></span><span style="font:600 34px/1.15 var(--font-sans);letter-spacing:-0.025em">Checkout error and recovery states</span></div>' +
        '<div style="margin-top:20px" data-subs>' + subs.map(function (s) { return '<div class="subrow">' + ui.avatar(H.PEOPLE[s[0]], 'md', { tip: false }) + '<span>' + s[1] + '</span><span class="est">' + s[2] + '</span></div>'; }).join('') + '</div>' +
        '<div class="row" data-total style="gap:14px;margin-top:18px;padding-top:18px;border-top:1px solid #ECECE8;font:400 21px var(--font-sans);color:#4B4B47">' + H.icon('timer', 20) + '<span><b style="color:#0A0A0A;font-weight:600">About 22h</b> across four people · estimates adjusted to each person’s pace</span></div></div>', 'abs', 'left:930px;top:250px');
      var rows = Array.prototype.slice.call(tk.querySelectorAll('.subrow')), total = tk.querySelector('[data-total]'), path = arrow.querySelector('path');
      return function (t) {
        var out = 1 - E.inOut(P(t, 66.5, 67.0));
        reveal(sp, P(t, 57.0, 58.2)); h.style.opacity = out;
        var m = E.out(P(t, 57.6, 58.3)); tf(meet, { op: m * out, y: (1 - m) * 30 });
        path.setAttribute('stroke-dashoffset', (200 * (1 - E.inOut(P(t, 58.4, 59.0)))).toFixed(1)); arrow.style.opacity = out;
        var k = E.out(P(t, 58.9, 59.5)); tf(tk, { op: k * out, x: (1 - k) * 30 });
        rows.forEach(function (r, i) { var p = E.out(P(t, 59.6 + i * 0.5, 60.0 + i * 0.5)); r.style.opacity = p; r.style.transform = 'translateY(' + ((1 - p) * 14).toFixed(1) + 'px)'; });
        total.style.opacity = E.out(P(t, 62.9, 63.5));
      };
    });
    // S7 — speaks for you, not about you
    scene(66.8, 75.0, 'dark', function (el) {
      var h = mk(el, '', 'abs cap', 'left:0;right:0;top:120px;text-align:center;color:#F2F2EF;font-size:76px'); var sp = words(h, 'Halo speaks for you, not about you.');
      var rosa = H.PEOPLE.rosa;
      var ask = mk(el, '<div style="width:820px;padding:34px;border-radius:28px;background:#16181C;box-shadow:0 0 0 1px #262A30">' +
        '<div class="row" style="gap:16px">' + ui.avatar(rosa, 'lg', { tip: false }) + '<div><div style="font:600 24px var(--font-sans)">Rosa asked your Halo</div><div style="font:400 19px var(--font-sans);color:#9B9C98;margin-top:4px">Design Director · 3h ago</div></div></div>' +
        '<div style="font:500 30px/1.3 var(--font-sans);letter-spacing:-0.015em;margin-top:26px">“Where is Checkout v3 design at?”</div>' +
        '<div style="margin-top:20px;padding:20px 22px;border-radius:16px;background:#1C1F24;font:400 22px/1.5 var(--font-sans);color:#C3C4C0">Payment methods are in hi-fi and wallet placement is in review. Error states kicked off today.</div>' +
        '<div class="row" style="gap:10px;margin-top:18px;padding:12px 16px;border-radius:12px;background:rgba(255,68,5,.14);color:#FF6A38;font:500 19px var(--font-sans)">' + H.icon('lock', 16) + 'Held back 1 update still waiting in your digest</div></div>', 'abs', 'left:150px;top:330px;transform-origin:0 0;transform:scale(1.08)');
      var pts = [['redact', 'Redacted: 1 private topic', 'Private topics never leave your Halo.'], ['eye', 'Every question, in the open', 'You see exactly what Halo said about you.'], ['fingerprint', 'Your voice is yours', 'Export or delete your voice model any time.']];
      var items = pts.map(function (p, i) { return mk(el, '<div class="row" style="gap:18px;align-items:flex-start"><span style="width:52px;height:52px;border-radius:15px;display:grid;place-items:center;background:#1C1F24;box-shadow:inset 0 0 0 1px #2A2E35;color:' + (i === 0 ? '#FF6A38' : '#F2F2EF') + ';flex:none">' + H.icon(p[0], 24) + '</span><div><div style="font:600 27px var(--font-sans);letter-spacing:-0.015em">' + p[1] + '</div><div style="font:400 21px/1.4 var(--font-sans);color:#9B9C98;margin-top:6px">' + p[2] + '</div></div></div>', 'abs', 'left:1110px;top:' + (400 + i * 150) + 'px;width:640px'); });
      return function (t) {
        var fin = E.out(P(t, 66.8, 67.3)), out = 1 - E.inOut(P(t, 74.5, 75.0));
        el.style.opacity = fin * out;
        reveal(sp, P(t, 67.2, 68.6));
        var a = E.out(P(t, 68.4, 69.1)); tf(ask, { op: a, y: (1 - a) * 30, s: 1.08 });
        items.forEach(function (it, i) { var p = E.out(P(t, 69.6 + i * 0.8, 70.2 + i * 0.8)); tf(it, { op: p, x: (1 - p) * 30 }); });
      };
    });
    // S8 — end card
    scene(74.7, 84.2, 'canvas', function (el) {
      var M = 150, cap = M / 1.3, wh = cap * 722 / 710, ww = wh * 1961.803 / 722, gap = 0.3 * M, total = M + gap + ww, x0 = 960 - total / 2, cy = 430;
      var lock = mk(el, markSvg(M, '#0A0A0A') , 'abs', 'left:' + x0 + 'px;top:' + (cy - M / 2) + 'px');
      var word = mk(el, wordmark(wh, '#0A0A0A'), 'abs', 'left:' + (x0 + M + gap) + 'px;top:' + (cy - wh / 2 + 2) + 'px');
      var tag = mk(el, 'Your work, represented.', 'abs', 'left:0;right:0;top:590px;text-align:center;font:600 64px/1 var(--font-sans);letter-spacing:-0.042em');
      var url = mk(el, '<span class="pill"><span class="dotx"></span>Now in early access</span><span class="mono" style="font-size:30px;color:#4B4B47;margin-left:24px">myhalo.co</span>', 'abs', 'left:0;right:0;top:720px;display:flex;justify-content:center;align-items:center');
      return function (t) {
        var a = E.out(P(t, 74.9, 75.8)), b = E.out(P(t, 75.6, 76.4)), c = E.out(P(t, 76.3, 77.1));
        tf(lock, { op: a, s: 0.94 + 0.06 * a }); tf(word, { op: a, x: (1 - a) * 20 });
        tf(tag, { op: b, y: (1 - b) * 20 }); tf(url, { op: c, y: (1 - c) * 16 });
      };
    });
    return 84;
  }

  /* ================= VERTICAL (9:16, 15s) ================= */
  function buildVertical() {
    scene(0, 3.5, 'dark', function (el) {
      var h = mk(el, '', 'abs cap', 'left:80px;right:80px;top:330px;text-align:center;font-size:104px;color:#F2F2EF'); var sp = words(h, 'Still writing\nstatus updates?');
      var POS = [[150, 820, -2], [220, 1080, 1.8], [130, 1340, -1.2]];
      var cards = NOTES.slice(0, 3).map(function (n, i) { return mk(el, notif(n), 'abs', 'left:' + POS[i][0] + 'px;top:' + POS[i][1] + 'px;transform-origin:0 0'); });
      return function (t) {
        reveal(sp, P(t, 0.15, 1.1));
        cards.forEach(function (c, i) { var a = 0.9 + i * 0.45, p = E.back(P(t, a, a + 0.4)); tf(c, { op: clamp(P(t, a, a + 0.2)), y: (1 - p) * 30, s: 1.25 * (0.92 + 0.08 * p), r: POS[i][2] }); });
        el.style.opacity = 1 - E.inOut(P(t, 3.1, 3.5));
      };
    });
    scene(3.3, 7.8, 'canvas', function (el) {
      var h = mk(el, '', 'abs cap', 'left:60px;right:60px;top:230px;text-align:center;font-size:88px'); var sp = words(h, 'Halo writes them\nin your voice.');
      var card = mk(el, statusCard('team'), 'abs', 'left:65px;top:700px;transform-origin:0 0');
      var txt = card.querySelector('[data-text]');
      return function (t) {
        reveal(sp, P(t, 3.5, 4.4));
        var c = E.out(P(t, 3.9, 4.6)); tf(card, { op: c, y: (1 - c) * 40, s: 1.25 });
        var v = t < 5.2 ? 'team' : t < 6.5 ? 'manager' : 'exec'; setSeg(card, v);
        var near = Math.min(Math.abs(t - 5.2), Math.abs(t - 6.5)); txt.textContent = LINES[v]; txt.style.opacity = 0.15 + 0.85 * E.out(clamp(near / 0.25));
        el.style.opacity = 1 - E.inOut(P(t, 7.4, 7.8));
      };
    });
    scene(7.6, 11.8, 'canvas', function (el) {
      var h = mk(el, '', 'abs cap', 'left:60px;right:60px;top:230px;text-align:center;font-size:88px'); var sp = words(h, 'You approve\nwhat matters.');
      var pill = mk(el, '<span class="pill" data-p><span class="dotx"></span><span data-n>4 updates need you</span></span>', 'abs', 'left:0;right:0;top:560px;display:flex;justify-content:center');
      var d = mk(el, dgCard({ icon: 'timer', title: 'CHK-142 target moves one day', when: '40m ago', aud: 'Manager', reason: 'Changes a date your manager tracks', text: 'Heads up: the selector needs about a day more than planned. New target is Thursday.' }), 'abs', 'left:115px;top:700px;transform-origin:0 0');
      var ok = mk(el, '<div class="row-st" style="width:850px;padding:26px 28px;font-size:26px"><span class="ok">' + H.icon('check', 18) + '</span><span><b style="font-weight:600">Shared with your manager.</b></span></div>', 'abs', 'left:115px;top:760px');
      var cur = mk(el, CURSOR, 'abs', 'left:0;top:0;width:44px;height:44px'), target = null, n = pill.querySelector('[data-n]');
      return function (t) {
        reveal(sp, P(t, 7.8, 8.7));
        var c = E.out(P(t, 8.1, 8.7)); tf(d, { op: c * (1 - E.out(P(t, 10.3, 10.7))), y: (1 - c) * 40, s: 1.25 }); tf(pill, { op: E.out(P(t, 8.3, 8.8)) });
        if (!target && t >= 8.8) { var b = d.querySelector('[data-approve]').getBoundingClientRect(), s = stage.getBoundingClientRect(); target = [b.left - s.left + b.width * 0.5, b.top - s.top + b.height * 0.55]; }
        var mv = E.inOut(P(t, 9.1, 9.9)), click = P(t, 10.0, 10.25);
        cur.style.opacity = E.out(P(t, 8.9, 9.2)) * (1 - P(t, 11.0, 11.4));
        var tg = target || [900, 1650];
        cur.style.transform = 'translate(' + lerp(900, tg[0], mv).toFixed(1) + 'px,' + lerp(1650, tg[1], mv).toFixed(1) + 'px) scale(' + (1 - 0.18 * Math.sin(Math.PI * click)) + ')';
        ok.style.opacity = E.out(P(t, 10.3, 10.8)); n.textContent = t >= 10.3 ? '3 updates need you' : '4 updates need you';
        el.style.opacity = 1 - E.inOut(P(t, 11.4, 11.8));
      };
    });
    scene(11.6, 15.1, 'canvas', function (el) {
      var M = 220;
      var mark = mk(el, markSvg(M, '#0A0A0A'), 'abs', 'left:' + (540 - M / 2) + 'px;top:600px');
      var cap = 0.62 * M, wh = cap * 722 / 710;
      var word = mk(el, wordmark(wh, '#0A0A0A'), 'abs', 'left:0;right:0;top:' + (600 + M + 70) + 'px;display:flex;justify-content:center');
      var tag = mk(el, 'Your work,<br>represented.', 'abs', 'left:0;right:0;top:1190px;text-align:center;font:600 76px/1.05 var(--font-sans);letter-spacing:-0.045em');
      var url = mk(el, 'myhalo.co', 'abs mono', 'left:0;right:0;top:1420px;text-align:center;font-size:36px;color:#4B4B47');
      return function (t) {
        var a = E.out(P(t, 11.8, 12.6)), b = E.out(P(t, 12.4, 13.2)), c = E.out(P(t, 13.0, 13.7));
        tf(mark, { op: a, s: 0.9 + 0.1 * E.back(P(t, 11.8, 12.6)) }); tf(word, { op: a, y: (1 - a) * 16 }); tf(tag, { op: b, y: (1 - b) * 20 }); tf(url, { op: c });
      };
    });
    return 15;
  }

  WORD = window.HALO_WORD || '';   // outlined wordmark path, generated from brand/logo/wordmark (see assets.js)
  window.DURATION = VERTICAL ? buildVertical() : buildWide();
  window.seek = function (t) {
    SCENES.forEach(function (s) { var on = t >= s.a && t < s.b; s.el.style.display = on ? 'block' : 'none'; if (on) s.fn(t); });
  };
  window.seek(0);
})();

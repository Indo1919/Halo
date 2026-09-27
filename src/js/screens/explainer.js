/* Halo in 36 seconds: the explainer that plays by itself under the welcome headline.
   One deterministic timeline, seek(t), drawn with Halo's own components, so it is sharp at any size,
   costs no download and always matches the product. Two compositions: wide (16:9) and tall (3:4, phones).
   It behaves like a muted hero video: starts on its own, loops, holds still when it is off screen, the tab
   is hidden or a dialog is open, respects reduced motion, and always shows a pause control (WCAG 2.2.2). */
(function (H) {
  'use strict';
  var esc = H.esc;

  var CH = [
    { id: 'signal',   label: 'Signal',   cap: 'Halo reads the signal you already create.',       a: 0,    b: 5.8,  key: 4.7 },
    { id: 'update',   label: 'Update',   cap: 'Then it writes your update, in your voice.',      a: 5.8,  b: 11.6, key: 10.9 },
    { id: 'altitude', label: 'Altitude', cap: 'Same truth, at the right altitude.',              a: 11.6, b: 17.4, key: 14.1 },
    { id: 'digest',   label: 'Digest',   cap: 'Routine shares itself. Sensitive waits for you.', a: 17.4, b: 23.8, key: 19.8 },
    { id: 'ask',      label: 'Ask',      cap: 'Colleagues ask your Halo. You see every answer.', a: 23.8, b: 29.8, key: 28.9 },
    { id: 'plan',     label: 'Plan',     cap: 'A meeting ends. The plan is already drafted.',    a: 29.8, b: 36,   key: 35.1 }
  ];
  var D = 36, SIZE = { wide: [1080, 608], tall: [360, 480] };
  var AUD = [{ v: 'team', label: 'Team', icon: 'teammate' }, { v: 'manager', label: 'Manager', icon: 'manager' }, { v: 'exec', label: 'Leadership', icon: 'exec' }];
  var LINES = {
    team: 'Payment method selector is in hi-fi. Cards and bank transfer are done, wallets are next, and error-state flows land Thursday.',
    manager: 'Checkout v3 design is moving: payment methods in hi-fi, wallet placement in review. One risk: the selector slips a day.',
    exec: 'Checkout v3 design is on track for October.'
  };
  var NOTE = { team: ['teammate', 'For your team: the detail.'], manager: ['manager', 'For your manager: progress and risk.'], exec: ['exec', 'For leadership: one sentence.'] };
  var SIG = [['gcal', 'Calendar', 'Kickoff ended'], ['slack', 'Slack', '4 new messages'], ['figma', 'Figma', '3 frames edited'], ['github', 'GitHub', 'PR #482 merged'], ['jira', 'Jira', 'CHK-142 moved'], ['zoom', 'Zoom', 'Recap ready']];
  var CURSOR = '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M4.5 2.5 19 13.6l-6.6 1.1 3.9 7.4-3.1 1.6-3.9-7.5-4.8 4.4z" fill="#fff" stroke="#0A0A0A" stroke-width="1.4" stroke-linejoin="round"/></svg>';

  /* ---------- timeline helpers ---------- */
  var clamp = function (v, a, b) { return Math.min(b == null ? 1 : b, Math.max(a || 0, v)); };
  var P = function (t, a, b) { return clamp((t - a) / (b - a)); };
  var E = {
    out: function (x) { return 1 - Math.pow(1 - x, 3); },
    inOut: function (x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; },
    back: function (x) { var c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }
  };
  var lerp = function (a, b, x) { return a + (b - a) * x; };
  function mk(parent, html, cls, style) {
    var d = document.createElement('div'); if (cls) d.className = cls; if (style) d.style.cssText = style;
    d.innerHTML = html || ''; parent.appendChild(d); return d;
  }
  // Write opacity/transform only when they change; fully transparent layers stop painting.
  function tf(el, o) {
    var v = o.op == null ? 1 : o.op, ops = v >= 0.999 ? '1' : v <= 0.001 ? '0' : v.toFixed(3);
    var tr = 'translate(' + (o.x || 0).toFixed(1) + 'px,' + (o.y || 0).toFixed(1) + 'px)' + (o.s != null ? ' scale(' + o.s.toFixed(4) + ')' : '');
    if (el._op !== ops) { el._op = ops; el.style.opacity = ops; el.style.visibility = ops === '0' ? 'hidden' : ''; }
    if (el._tr !== tr) { el._tr = tr; el.style.transform = tr; }
  }
  function op(el, v) { tf(el, { op: v }); }
  function words(el, text) {
    el.innerHTML = text.split(/(\s+)/).map(function (w) { return /^\s+$/.test(w) ? ' ' : '<span class="w">' + esc(w) + '</span>'; }).join('');
    return Array.prototype.slice.call(el.querySelectorAll('.w'));
  }
  function reveal(spans, p) {
    var n = spans.length, spread = 2.2;
    spans.forEach(function (s, i) { var x = E.out(clamp(p * (n + spread) - i, 0, spread) / spread); tf(s, { op: x, y: (1 - x) * 12 }); });
  }
  function setText(el, s, caret) {
    var k = s + (caret ? '‸' : '');
    if (el._k === k) return; el._k = k;
    el.innerHTML = esc(s) + (caret ? '<span class="ex-caret"></span>' : '');
  }
  function setHtml(el, html) { if (el._h !== html) { el._h = html; el.innerHTML = html; } }
  function setSeg(root, v) {
    if (root._seg === v) return; root._seg = v;
    Array.prototype.forEach.call(root.querySelectorAll('.seg-item'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === v)); });
  }
  // Position in canvas units, independent of transforms (offset chain).
  function pos(el, root) { var x = 0, y = 0, n = el; while (n && n !== root) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; } return { x: x, y: y, w: el.offsetWidth, h: el.offsetHeight }; }
  function redacted() { return '<span class="redacted-chip"><span class="bars"><i></i><i></i></span>Redacted: 1 private topic</span>'; }
  function dg(o) {
    return '<div class="dg-head"><span class="dg-kind">' + H.icon(o.icon, 16) + '</span><div class="grow"><div class="dg-title">' + esc(o.title) + '</div><div class="meta"><span>' + esc(o.when) + '</span></div></div>' +
      '<span class="aud-btn">' + H.icon(o.aud === 'Manager' ? 'manager' : 'teammate', 14) + '<span>' + o.aud + '</span></span></div>' +
      '<div class="dg-reason">' + H.icon('info', 14) + '<span>' + esc(o.reason) + '</span></div><div class="text-block dg-text">' + esc(o.text) + '</div>' +
      '<div class="dg-actions"><span class="btn btn-primary btn-sm" data-approve>' + H.icon('check', 16) + '<span>Approve</span></span><span class="btn btn-sm">' + H.icon('edit', 16) + '<span>Edit</span></span><span class="btn btn-sm">' + H.icon('clock', 16) + '<span>Hold</span></span></div>';
  }

  /* ---------- the six chapters ---------- */
  function build(canvas, mode) {
    var ui = H.ui, wide = mode === 'wide', W = SIZE[mode][0], HH = SIZE[mode][1], scenes = [];
    function scene(a, b, make) { var el = mk(canvas, '', 'ex-scene'); el.style.display = 'none'; scenes.push({ a: a, b: b, el: el, fn: make(el), on: false }); }
    function at(el) { return pos(el, canvas); }
    function cursor(parent) { return mk(parent, CURSOR, 'ex-cursor'); }

    // Captions: one per chapter, word by word.
    CH.forEach(function (c) {
      scene(c.a, c.b, function (el) {
        var cap = mk(el, '', 'ex-cap'), sp = words(cap, c.cap);
        return function (t) { reveal(sp, P(t, c.a + 0.1, c.a + 0.95)); op(cap, 1 - E.inOut(P(t, c.b - 0.35, c.b))); };
      });
    });

    // 01 Signal: six sources light up and flow into Halo.
    scene(0, 5.8, function (el) {
      var g = wide ? { ts: 64, cx: function (i) { return 540 + (i - 2.5) * 150; }, top: 128, y0: 270, cy: 392, rx: 540, ry: 440, rs: 104 }
                   : { ts: 44, cx: function (i) { return 40 + i * 56; }, top: 110, y0: 162, cy: 262, rx: 180, ry: 318, rs: 92 };
      var lines = mk(el, '<svg class="ex-lines" width="' + W + '" height="' + HH + '" viewBox="0 0 ' + W + ' ' + HH + '">' + SIG.map(function (s, i) {
        var x = g.cx(i); return '<path d="M' + x + ' ' + g.y0 + ' Q ' + x + ' ' + g.cy + ' ' + g.rx + ' ' + g.ry + '"/>';
      }).join('') + '</svg>', 'ex-abs', 'left:0;top:0;width:' + W + 'px;height:' + HH + 'px');
      var tiles = SIG.map(function (s, i) {
        return mk(el, H.brandTile(s[0], g.ts, 'tinted') + (wide ? '<div class="ex-tl">' + s[1] + '</div>' : ''), 'ex-abs ex-tile', 'left:' + (g.cx(i) - 60) + 'px;top:' + g.top + 'px;width:120px');
      });
      var chips = wide ? SIG.map(function (s, i) { return mk(el, esc(s[2]), 'ex-abs ex-chip', 'left:' + (g.cx(i) - 66) + 'px;top:232px;width:132px'); }) : [];
      var dots = []; for (var k = 0; k < 12; k++) dots.push(mk(el, '', 'ex-dot'));
      var ring = mk(el, ui.mark(Math.round(g.rs * 0.56)) + '<span class="ex-count">0</span>', 'ex-abs ex-ring', 'left:' + (g.rx - g.rs / 2) + 'px;top:' + g.ry + 'px;width:' + g.rs + 'px;height:' + g.rs + 'px');
      var count = ring.querySelector('.ex-count');
      var latest = wide ? null : mk(el, '', 'ex-abs ex-latest', 'left:0;right:0;top:428px');
      var start = function (i, lap) { return 1.45 + i * 0.3 + lap * 1.25; }, TRAV = 1.2;
      return function (t) {
        var out = E.inOut(P(t, 5.2, 5.75));
        tiles.forEach(function (tl, i) { var a = 0.2 + i * 0.07, p = E.back(P(t, a, a + 0.55)); tf(tl, { op: P(t, a, a + 0.25) * (1 - out), y: (1 - p) * 20 - out * 12 }); });
        chips.forEach(function (c, i) { var a = 1.0 + i * 0.26, p = E.out(P(t, a, a + 0.35)); tf(c, { op: p * (1 - out), y: (1 - p) * -8 - out * 12 }); });
        op(lines, E.out(P(t, 1.1, 1.7)) * (1 - out));
        var n = 0, last = -1, pulse = 0;
        dots.forEach(function (d, k) {
          var i = k % 6, lap = Math.floor(k / 6), s0 = start(i, lap), u = (t - s0) / TRAV, arr = t - (s0 + TRAV);
          if (arr >= 0 && lap === 0) { n++; last = i; }
          if (arr >= 0 && arr < 0.35) pulse = Math.max(pulse, Math.sin(Math.PI * arr / 0.35));
          if (u < 0 || u > 1 || t > 5.2) { op(d, 0); return; }
          var e = E.inOut(u), x0 = g.cx(i), y0 = g.y0, x = (1 - e) * (1 - e) * x0 + 2 * (1 - e) * e * x0 + e * e * g.rx, y = (1 - e) * (1 - e) * y0 + 2 * (1 - e) * e * g.cy + e * e * g.ry;
          tf(d, { op: Math.min(1, u * 8, (1 - u) * 8), x: x - 4, y: y - 4 });
        });
        var r = E.back(P(t, 0.7, 1.3));
        tf(ring, { op: P(t, 0.7, 1.0) * (1 - out), s: (0.88 + 0.12 * r) * (1 + 0.05 * pulse), y: -out * 12 });
        setHtml(count, String(n)); tf(count, { op: n ? 1 : 0, s: 1 + 0.22 * pulse });
        if (latest) {
          setHtml(latest, last < 0 ? '' : '<span class="ex-chip is-inline">' + H.brandMark(SIG[last][0], 14) + '<span>' + esc(SIG[last][2]) + '</span></span>');
          tf(latest, { op: (last < 0 ? 0 : 1) * (1 - out), y: -out * 12 });
        }
      };
    });

    // 02 Update + 03 Altitude: one status card, typed in your voice, then re-cut for each audience.
    scene(5.8, 17.4, function (el) {
      var col = mk(el, '', 'ex-abs ex-colm', 'left:0;right:0;top:' + (wide ? 188 : 96) + 'px');
      var card = mk(col, '<div class="hero-top"><span class="kicker">' + ui.mark(14) + '<span>What Halo is saying about you</span></span><div class="ml-auto">' + ui.seg('ex-aud', AUD, 'team', { size: 'sm', action: 'noop' }) + '</div></div>' +
        '<p class="hero-text" data-text></p>' +
        '<div class="hero-foot"><div class="row gap-2 wrap" data-foot>' + ui.src('figma', 'Payment methods') + ui.src('jira', 'CHK-142') + (wide ? ui.src('zoom', 'Error states kickoff') : '') + redacted() + '</div></div>', 'card hero ex-status');
      var below = mk(col, '', 'ex-below');
      var voice = mk(below, H.icon('fingerprint', 16) + '<span>' + (wide ? 'Written in your voice, learned only from samples you chose' : 'Written in your voice') + '</span>', 'ex-pill');
      var note = mk(below, '', 'ex-note');
      var txt = card.querySelector('[data-text]'), foot = card.querySelector('[data-foot]');
      var cur = cursor(el), tg = null, home = wide ? [900, 560] : [300, 450];
      return function (t, entered) {
        if (entered || !tg) {
          var items = card.querySelectorAll('.seg-item'), m = at(items[1]), x = at(items[2]);
          tg = { m: [m.x + m.w * 0.55, m.y + m.h * 0.6], x: [x.x + x.w * 0.55, x.y + x.h * 0.6] };
        }
        var inP = E.out(P(t, 5.9, 6.5)), out = E.inOut(P(t, 16.95, 17.4));
        tf(card, { op: inP * (1 - out), y: (1 - inP) * 20 - out * 10 });
        var aud = t < 12.9 ? 'team' : t < 14.7 ? 'manager' : 'exec', dip = clamp(Math.min(Math.abs(t - 12.9), Math.abs(t - 14.7)) / 0.22);
        if (t < 11.6) {
          var full = LINES.team, n = Math.round(full.length * P(t, 6.8, 9.3));
          setText(txt, full.slice(0, n), n < full.length && t > 6.6); op(txt, 1);
        } else { setText(txt, LINES[aud], false); op(txt, 0.12 + 0.88 * E.out(dip)); }
        setSeg(card, aud);
        op(foot, E.out(P(t, 9.3, 9.8)));
        var v = E.out(P(t, 9.9, 10.4)); tf(voice, { op: v * (1 - E.inOut(P(t, 11.25, 11.6))), y: (1 - v) * 8 });
        setHtml(note, H.icon(NOTE[aud][0], 16) + '<span>' + NOTE[aud][1] + '</span>');
        var nIn = E.out(P(t, 11.8, 12.25)); tf(note, { op: nIn * (1 - out) * (0.1 + 0.9 * E.out(dip)), y: (1 - nIn) * 8 });
        // The cursor previews the other audiences, the way you can on Home.
        var c1 = E.inOut(P(t, 12.15, 12.75)), c2 = E.inOut(P(t, 13.95, 14.5));
        var cx = lerp(lerp(home[0], tg.m[0], c1), tg.x[0], c2), cy = lerp(lerp(home[1], tg.m[1], c1), tg.x[1], c2);
        var press = Math.max(Math.sin(Math.PI * P(t, 12.78, 12.98)), Math.sin(Math.PI * P(t, 14.53, 14.73)));
        tf(cur, { op: E.out(P(t, 11.9, 12.2)) * (1 - E.inOut(P(t, 15.3, 15.7))), x: cx, y: cy, s: 1 - 0.16 * press });
      };
    });

    // 04 Digest: routine work shares itself; the sensitive item waits for one tap.
    scene(17.4, 23.8, function (el) {
      var AUTO = ['Standup posted to #checkout-standup', 'CHK-142 moved to In progress', 'PR #482 linked to CHK-138'];
      var left = mk(el, wide ? '<div class="ex-h">Shared automatically<span class="count-pill quiet">8</span></div>' : '', 'ex-abs', wide ? 'left:64px;top:140px;width:440px' : 'left:12px;top:96px;width:336px');
      var rows = (wide ? AUTO : ['<b>8 routine updates</b> shared themselves']).map(function (a) {
        return mk(left, '<span class="ex-ok">' + H.icon('check', 14) + '</span><span>' + (wide ? esc(a) : a) + '</span>', 'ex-row');
      });
      var more = wide ? mk(left, '5 more today, each with its sources', 'ex-more') : null;
      var trust = wide ? mk(left, H.shell.dial(1, 44) + '<div><div class="eyebrow">Trust mode</div><div class="ex-stops"><span>Curated</span><b>Balanced</b><span>Ambient</span></div></div>', 'ex-trust') : null;
      var right = mk(el, '<div class="ex-h">Needs you<span class="count-pill" data-n>4</span></div>', 'ex-abs', wide ? 'left:576px;top:140px;width:440px' : 'left:12px;top:156px;width:336px');
      var stack = mk(right, '', 'ex-stack');
      var d1 = mk(stack, dg({ icon: 'timer', title: 'CHK-142 target moves one day', when: '40m ago', aud: 'Manager', reason: 'Changes a date your manager tracks', text: 'Heads up: the selector needs about a day more than planned. New target is Thursday.' }), 'card dg-card ex-dg');
      var d2 = mk(stack, dg({ icon: 'alert', title: 'Blocker that names Leo', when: '30m ago', aud: 'Team', reason: 'Mentions a teammate. Check the tone first', text: 'Waiting on the 3DS error-code list from Leo before I can finish the failure states.' }), 'card dg-card ex-dg');
      var done = mk(stack, '<span class="ex-ok">' + H.icon('check', 14) + '</span><span><b>Shared with your manager.</b> ' + (wide ? 'Rosa sees it the next time she asks.' : '') + '</span>', 'ex-row ex-done');
      var count = right.querySelector('[data-n]'), cur = cursor(el), tg = null, lift = 0, home = wide ? [1000, 590] : [320, 470];
      return function (t, entered) {
        if (entered || !tg) { var b = at(d1.querySelector('[data-approve]')); tg = [b.x + b.w * 0.45, b.y + b.h * 0.55]; lift = d1.offsetHeight + 12; }
        var out = E.inOut(P(t, 23.35, 23.8));
        tf(left, { op: E.out(P(t, 17.6, 18.0)) * (1 - out), y: -out * 10 });
        rows.forEach(function (r, i) { var p = E.out(P(t, 17.8 + i * 0.25, 18.2 + i * 0.25)); tf(r, { op: p, x: (1 - p) * -16 }); });
        if (more) op(more, E.out(P(t, 18.6, 19.0)));
        if (trust) { var tp = E.out(P(t, 18.9, 19.4)); tf(trust, { op: tp, y: (1 - tp) * 10 }); }
        var rp = E.out(P(t, 17.75, 18.35)); tf(right, { op: rp * (1 - out), y: (1 - rp) * 18 - out * 10 });
        var mv = E.inOut(P(t, 19.95, 20.8)), press = Math.sin(Math.PI * P(t, 20.85, 21.05));
        tf(cur, { op: E.out(P(t, 19.7, 19.95)) * (1 - E.inOut(P(t, 21.7, 22.0))), x: lerp(home[0], tg[0], mv), y: lerp(home[1], tg[1], mv), s: 1 - 0.16 * press });
        var ok = E.out(P(t, 21.05, 21.22)), dn = E.out(P(t, 21.2, 21.45));
        tf(d1, { op: 1 - ok, s: 1 - 0.02 * ok });
        tf(done, { op: dn * (1 - E.inOut(P(t, 22.0, 22.3))), y: (1 - dn) * 6 });
        tf(d2, { y: -lift * E.inOut(P(t, 22.1, 22.7)) });
        setHtml(count, t >= 21.1 ? '3' : '4');
      };
    });

    // 05 Ask: someone asks your Halo; it answers from your sources and says what it held back.
    scene(23.8, 29.8, function (el) {
      var rosa = H.PEOPLE.rosa, ANSWER = 'Payment methods are in hi-fi and wallet placement is in review. Error states kicked off today.';
      var col = mk(el, '', 'ex-abs ex-colm', 'left:0;right:0;top:' + (wide ? 132 : 96) + 'px');
      var card = mk(col, '<div class="ex-ask-hd">' + ui.avatar(rosa, wide ? 'lg' : 'md', { tip: false }) + '<div class="grow" style="min-width:0"><div class="ex-ask-who">Rosa asked your Halo</div><div class="ex-ask-role">Design Director · just now</div></div>' +
          (wide ? '<span class="badge badge-lg">' + H.icon('manager', 12) + 'Manager view</span>' : '') + '</div>' +
        '<div class="ex-ask-q">“Where is Checkout v3 design at?”</div>' +
        '<div class="ex-ask-a"><span class="ex-ask-me">' + ui.mark(16) + '</span><div class="text-block" data-a></div></div>' +
        '<div class="row gap-2 wrap ex-ask-foot" data-foot>' + ui.src('figma', 'Payment methods') + ui.src('jira', 'CHK-142') + redacted() + '</div>' +
        '<div class="ex-held" data-held>' + H.icon('lock', 14) + '<span>Held back 1 update that is still waiting in your digest</span></div>', 'card ex-ask');
      var notice = wide ? mk(col, H.icon('eye', 16) + '<span>You see every question and every answer, and you can correct it.</span>', 'ex-note') : null;
      var a = card.querySelector('[data-a]'), foot = card.querySelector('[data-foot]'), held = card.querySelector('[data-held]');
      return function (t) {
        var inP = E.out(P(t, 24.0, 24.6)), out = E.inOut(P(t, 29.35, 29.8));
        tf(card, { op: inP * (1 - out), y: (1 - inP) * 20 - out * 10 });
        var n = Math.round(ANSWER.length * P(t, 25.0, 26.9)); setText(a, ANSWER.slice(0, n), n < ANSWER.length && t > 24.9);
        op(foot, E.out(P(t, 26.9, 27.3)));
        var h = E.out(P(t, 27.4, 27.9)); tf(held, { op: h, y: (1 - h) * 6 });
        if (notice) { var np = E.out(P(t, 28.0, 28.4)); tf(notice, { op: np * (1 - out), y: (1 - np) * 8 }); }
      };
    });

    // 06 Plan: the meeting that just ended becomes a ticket with estimated, assigned subtasks.
    scene(29.8, 36, function (el) {
      var ppl = ['priya', 'leo', 'sam', 'hana'].map(function (id) { return H.PEOPLE[id]; });
      var meet = mk(el, '<div class="row gap-3">' + H.brandTile('zoom', wide ? 44 : 36) + '<div class="grow" style="min-width:0"><div class="ex-meet-when">Just ended · 1:30 – 2:15 PM</div><div class="ex-meet-title">Error states kickoff</div></div></div>' +
        '<div class="row gap-2 ex-meet-foot">' + ui.avatarStack(ppl, 'sm', 4) + '<span class="ex-meet-n">5 people</span><span class="badge badge-info ml-auto">' + H.icon('wand', 12) + 'Recap ready</span></div>',
        'card ex-abs ex-meet', wide ? 'left:56px;top:226px;width:380px' : 'left:12px;top:92px;width:336px');
      var arrow = mk(el, wide ? '<svg width="64" height="24" viewBox="0 0 64 24"><path d="M3 12 H58 M49 4 L58 12 L49 20" pathLength="100"/></svg>'
                              : '<svg width="24" height="26" viewBox="0 0 24 26"><path d="M12 3 V22 M5 15 L12 22 L19 15" pathLength="100"/></svg>', 'ex-abs ex-arrow', wide ? 'left:444px;top:274px' : 'left:168px;top:190px');
      var path = arrow.querySelector('path');
      var SUBS = [['maya', 'Audit current decline and error messages', '1.5–4h'], ['leo', 'Map processor error codes to buyer states', '2–6h'], ['maya', 'Design declined and expired card recovery', '4–9h'], ['maya', 'Design 3DS failure and timeout states', '3–8h']];
      var shown = wide ? SUBS : SUBS.slice(0, 3);
      var tk = mk(el, '<div class="ex-tk-hd">' + H.icon('sparkle', 14) + '<span>Drafted by Halo from this meeting</span><span class="key ml-auto">CHK-154</span></div>' +
        '<div class="ex-tk-title">' + ui.prio('high') + '<span>Checkout error and recovery states</span></div>' +
        '<div class="ex-subs">' + shown.map(function (s) { return '<div class="ex-sub">' + ui.avatar(H.PEOPLE[s[0]], 'sm', { tip: false }) + '<span class="grow truncate">' + esc(s[1]) + '</span><span class="ex-est">' + s[2] + '</span></div>'; }).join('') +
          (wide ? '<div class="ex-sub ex-sub-more">+2 more subtasks</div>' : '') + '</div>' +
        '<div class="ex-total">' + H.icon('timer', 16) + '<span><b>About 22h</b> across four people' + (wide ? '' : ' · 6 subtasks') + '</span></div>', 'card ex-abs ex-tk', wide ? 'left:524px;top:132px;width:500px' : 'left:12px;top:222px;width:336px');
      var subs = Array.prototype.slice.call(tk.querySelectorAll('.ex-sub')), total = tk.querySelector('.ex-total');
      return function (t) {
        var out = E.inOut(P(t, 35.45, 35.95));
        var m = E.out(P(t, 30.0, 30.6)); tf(meet, { op: m * (1 - out), y: (1 - m) * 18 - out * 10 });
        var ar = E.inOut(P(t, 30.75, 31.25)); path.style.strokeDashoffset = (100 * (1 - ar)).toFixed(1); op(arrow, (ar > 0 ? 1 : 0) * (1 - out));
        var k = E.out(P(t, 31.1, 31.7)); tf(tk, { op: k * (1 - out), x: wide ? (1 - k) * 20 : 0, y: (wide ? 0 : (1 - k) * 16) - out * 10 });
        subs.forEach(function (r, i) { var p = E.out(P(t, 31.8 + i * 0.3, 32.15 + i * 0.3)); tf(r, { op: p, y: (1 - p) * 8 }); });
        op(total, E.out(P(t, 33.3, 33.8)));
      };
    });

    return {
      seek: function (t) {
        scenes.forEach(function (s) {
          var on = t >= s.a && t < s.b, entered = on && !s.on;
          if (on !== s.on) { s.el.style.display = on ? '' : 'none'; s.on = on; }
          if (on) s.fn(t, entered);
        });
      }
    };
  }

  /* ---------- player ---------- */
  var X = null;
  function mount(host, o) {
    o = o || {};
    if (X && X.host === host && host.contains(X.root)) return;
    destroy();
    var root = document.createElement('div'); root.className = 'ex-root';
    root.innerHTML = '<div class="ex-frame" inert aria-hidden="true"><div class="ex-canvas"></div></div>' +
      '<div class="ex-rail">' +
        '<button type="button" class="ex-play" data-ex="toggle"></button>' +
        '<div class="ex-chs">' + CH.map(function (c, i) {
          return '<button type="button" class="ex-ch" data-ex="ch" data-i="' + i + '" aria-label="Chapter ' + (i + 1) + ' of ' + CH.length + ': ' + c.label + '"><span class="ex-ch-bar"><i></i></span><span class="ex-ch-lbl"><span class="ex-ch-n">0' + (i + 1) + '</span>' + c.label + '</span></button>';
        }).join('') + '</div>' +
        '<span class="ex-now" aria-hidden="true"></span>' + (o.extra || '') +
      '</div>' +
      '<p class="sr-only">Halo in ' + D + ' seconds. ' + CH.map(function (c, i) { return (i + 1) + ', ' + c.label + ': ' + c.cap; }).join(' ') + '</p>';
    host.appendChild(root);
    X = { host: host, root: root, frame: root.querySelector('.ex-frame'), canvas: root.querySelector('.ex-canvas'), now: root.querySelector('.ex-now'), btn: root.querySelector('.ex-play'),
      mode: null, api: null, t: 0, want: !o.reduced, reduced: !!o.reduced, inView: true, raf: 0, last: 0 };
    X.chs = Array.prototype.map.call(root.querySelectorAll('.ex-ch'), function (b) { return { el: b, bar: b.querySelector('i') }; });
    if (X.reduced) X.t = CH[0].key;
    root.addEventListener('click', onClick);
    if (window.ResizeObserver) { X.ro = new ResizeObserver(layout); X.ro.observe(host); } else window.addEventListener('resize', layout);
    if (window.IntersectionObserver) {
      X.io = new IntersectionObserver(function (es) { if (!X) return; var e = es[es.length - 1]; X.inView = e.isIntersecting && e.intersectionRatio >= 0.12; sync(); }, { threshold: [0, 0.12, 0.5] });
      X.io.observe(X.frame);
    }
    document.addEventListener('visibilitychange', sync);
    layout(); draw(); sync();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (X && X.root === root) { X.mode = null; layout(); draw(); } });
  }
  function layout() {
    if (!X) return;
    var mode = (X.host.clientWidth || 1080) < 600 ? 'tall' : 'wide';
    if (mode !== X.mode) {
      X.mode = mode; X.frame.classList.remove('is-wide', 'is-tall'); X.frame.classList.add('is-' + mode);
      X.canvas.className = 'ex-canvas is-' + mode; X.canvas.innerHTML = '';
      X.canvas.style.width = SIZE[mode][0] + 'px'; X.canvas.style.height = SIZE[mode][1] + 'px';
      X.api = build(X.canvas, mode); draw();
    }
    X.canvas.style.transform = 'scale(' + (X.frame.clientWidth / SIZE[mode][0]).toFixed(5) + ')';
  }
  function chapterAt(t) { var i = 0; for (var k = 0; k < CH.length; k++) if (t >= CH[k].a) i = k; return i; }
  function draw() {
    if (!X || !X.api) return;
    X.api.seek(X.t);
    var i = chapterAt(X.t), still = X.reduced && !X.want;
    X.chs.forEach(function (c, k) {
      var p = k < i ? 1 : k > i ? 0 : still ? 1 : clamp((X.t - CH[k].a) / (CH[k].b - CH[k].a));
      var tr = 'scaleX(' + p.toFixed(4) + ')'; if (c._tr !== tr) { c._tr = tr; c.bar.style.transform = tr; }
      var on = k === i; if (c._on !== on) { c._on = on; c.el.classList.toggle('is-on', on); if (on) c.el.setAttribute('aria-current', 'step'); else c.el.removeAttribute('aria-current'); }
    });
    setHtml(X.now, '<span class="ex-ch-n">0' + (i + 1) + '</span>' + CH[i].label);
  }
  function sync() {
    if (!X) return;
    var run = X.want && X.inView && !document.hidden;
    if (run && !X.raf) { X.last = 0; X.raf = requestAnimationFrame(tick); }
    if (!run && X.raf) { cancelAnimationFrame(X.raf); X.raf = 0; }
    if (X.btn._w !== X.want) {
      X.btn._w = X.want; X.btn.innerHTML = H.icon(X.want ? 'pause' : 'play', 16);
      X.btn.setAttribute('aria-label', X.want ? 'Pause the Halo explainer' : 'Play the Halo explainer');
      X.btn.setAttribute('data-tip', X.want ? 'Pause' : 'Play');
    }
  }
  function tick(now) {
    if (!X) return;
    X.raf = requestAnimationFrame(tick);
    var dt = X.last ? Math.min(0.1, (now - X.last) / 1000) : 0; X.last = now;
    if (H.view && H.view.overlay) return;   // a dialog is open: hold still underneath it
    X.t = (X.t + dt) % D; draw();
  }
  function onClick(e) {
    var b = e.target.closest('[data-ex]'); if (!b || !X) return;
    if (b.getAttribute('data-ex') === 'toggle') { X.want = !X.want; sync(); return; }
    var i = +b.getAttribute('data-i');
    if (X.reduced && !X.want) X.t = CH[i].key; else { X.t = CH[i].a + 0.001; X.want = true; }
    draw(); sync();
  }
  function destroy() {
    if (!X) return;
    if (X.raf) cancelAnimationFrame(X.raf);
    if (X.ro) X.ro.disconnect(); else window.removeEventListener('resize', layout);
    if (X.io) X.io.disconnect();
    document.removeEventListener('visibilitychange', sync);
    X.root.removeEventListener('click', onClick);
    X = null;
  }

  H.explainer = {
    CH: CH, D: D, mount: mount, destroy: destroy,
    // QA + export hooks: hold on an exact frame, or resume.
    seek: function (t) { if (!X) return; X.want = false; X.t = t; draw(); sync(); },
    play: function () { if (X) { X.want = true; sync(); } },
    state: function () { return X ? { t: X.t, mode: X.mode, running: !!X.raf, want: X.want, inView: X.inView } : null; }
  };
})(window.H = window.H || {});

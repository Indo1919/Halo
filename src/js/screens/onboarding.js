/* First run: welcome (myhalo.co), sign in, and onboarding. */
(function (H) {
  'use strict';
  var esc = H.esc, ui = H.ui, q = H.q, F = H.fmt, U = H.util;
  var BASE = /\/src\/index\.html$/.test(location.pathname) ? '../' : '';
  var G_LOGO = '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';
  var MS_LOGO = '<svg width="16" height="16" viewBox="0 0 22 22" aria-hidden="true"><rect width="10" height="10" fill="#F25022"/><rect x="12" width="10" height="10" fill="#7FBA00"/><rect y="12" width="10" height="10" fill="#00A4EF"/><rect x="12" y="12" width="10" height="10" fill="#FFB900"/></svg>';
  var AUD = [{ v: 'team', label: 'Team', icon: 'teammate' }, { v: 'manager', label: 'Manager', icon: 'manager' }, { v: 'exec', label: 'Leadership', icon: 'exec' }];
  var LINES = {
    team: 'Payment method selector is in hi-fi. Cards and bank transfer are done, wallets are next, and error-state flows land Thursday.',
    manager: 'Checkout v3 design is moving: payment methods in hi-fi, wallet placement in review. One risk: the selector slips a day.',
    exec: 'Checkout v3 design is on track for October.'
  };
  var view = { aud: 'team', timer: null, email: '', sent: false, provider: null, conn: {}, warm: 0, warmTimer: null, role: 'design', team: 'Checkout', samples: { s1: true, s2: true, s3: true } };

  function lockup(h, dark) { return '<span class="wl-lockup" style="font-size:' + h + 'px">' + ui.mark(Math.round(h * 1.15), dark) + '<span>Halo</span></span>'; }
  function seen() { if (!H.store.state.session.welcomeSeen) H.store.commit(function (s) { s.session.welcomeSeen = true; }, { render: false }); }
  function reduced() { return matchMedia('(prefers-reduced-motion: reduce)').matches || H.store.state.prefs.motion === 'reduce'; }

  /* ---------------- Welcome ---------------- */
  function stage() {
    var a = view.aud;
    return '<div class="wl-stage" aria-label="Halo, shown with sample data" role="img">' +
      '<div class="wl-win"><div class="wl-win-bar"><i></i><i></i><i></i><span>myhalo.co</span></div>' +
      '<div class="wl-win-body">' +
        '<div class="wl-status card"><div class="row gap-2 wrap"><span class="kicker">' + ui.mark(14) + '<span>What Halo is saying about you</span></span><span class="ml-auto">' + ui.seg('wl-aud', AUD, a, { action: 'wl-aud', size: 'sm' }) + '</span></div>' +
          '<p class="wl-status-text" data-key="wl-' + a + '">' + esc(LINES[a]) + '</p>' +
          '<div class="row gap-2 wrap">' + ui.src('figma', 'Payment methods') + ui.src('jira', 'CHK-142') + ui.src('zoom', 'Kickoff') + '<span class="redacted-chip"><span class="bars"><i></i><i></i></span>Redacted: 1 private topic</span></div></div>' +
        '<div class="wl-side">' +
          '<div class="card wl-mini"><div class="eyebrow">Today’s digest</div><div class="wl-num">4</div><div class="t-callout c-2">updates need you. 8 shared themselves.</div><div class="btn btn-primary btn-sm btn-block mt-4" aria-hidden="true">Review now</div></div>' +
          '<div class="card wl-mini"><div class="row gap-2"><span class="eyebrow">Trust mode</span><strong class="ml-auto t-callout">Balanced</strong></div><div class="wl-dial">' + H.shell.dial(1, 52) + '<div class="wl-dial-stops"><span>Curated</span><b>Balanced</b><span>Ambient</span></div></div></div>' +
        '</div>' +
        '<div class="wl-flow">' + ['gcal', 'slack', 'figma', 'github', 'jira', 'zoom'].map(function (id, i) { return '<span class="wl-flow-tile" style="--d:' + (i * 90) + 'ms">' + H.brandTile(id, 40) + '</span>'; }).join('') +
          '<span class="wl-flow-line"></span><span class="wl-flow-ring">' + ui.mark(30) + '</span></div>' +
      '</div></div></div>';
  }
  function welcome() {
    var sec = function (id, cls, body) { return '<section id="' + id + '" class="wl-sec ' + (cls || '') + '"><div class="wl-wrap">' + body + '</div></section>'; };
    var steps = [
      ['sources', 'Connect what you already use', 'Calendar, Slack, Figma, GitHub, Jira and Zoom. Halo reads only what you connect, and only what each source lists.'],
      ['wand', 'Halo drafts in your voice', 'It notices what changed and writes the update the way you would, sized for whoever’s asking.'],
      ['dial', 'You decide what’s shared', 'One dial: Curated, Balanced or Ambient. Anything sensitive waits for your once-a-day digest.']
    ];
    var trust = [
      ['lock', 'Private stays private', 'Pick the topics Halo never touches. Anything that matches is dropped before a draft exists.'],
      ['redact', 'Visible restraint', 'When Halo holds something back, it says so. “Redacted: 1 private topic” beats silent omission.'],
      ['eye', 'Every question, in the open', 'When someone asks your Halo about you, you see exactly what it said, and you can correct it.'],
      ['fingerprint', 'Your voice is yours', 'Your voice model trains only on samples you approve. Export or delete it any time.']
    ];
    return '<div class="wl">' +
      '<header class="wl-nav"><div class="wl-wrap row gap-4">' + lockup(22) +
        '<nav class="wl-links hide-phone"><a href="#how" data-action="wl-scroll" data-to="how">How it works</a><a href="#altitude" data-action="wl-scroll" data-to="altitude">Altitude</a><a href="#privacy" data-action="wl-scroll" data-to="privacy">Privacy</a></nav>' +
        '<span class="grow"></span>' + ui.btn('Sign in', { kind: 'ghost', size: 'sm', action: 'wl-start' }) + ui.btn('Get started', { kind: 'primary', size: 'sm', action: 'wl-start' }) + '</div></header>' +
      '<section class="wl-hero"><div class="wl-wrap">' +
        '<span class="wl-pill"><span class="dot dot-accent"></span>Now in early access</span>' +
        '<h1 class="wl-h1">Your work,<br>represented.</h1>' +
        '<p class="wl-sub">Halo turns the signal you already create, like meetings, commits and design edits, into status updates in your own voice. You\u2019ll never write another one.</p>' +
        '<div class="wl-ctas">' + ui.btn('Get started', { kind: 'accent', size: 'xl', action: 'wl-start', trail: H.icon('arrow-right', 18) }) + ui.btn('Watch the film', { size: 'xl', icon: 'play-circle', action: 'wl-film' }) + '</div>' +
        '<p class="wl-fine">Works with Google Calendar, Slack, Figma, GitHub, Jira and Zoom.</p>' +
        stage() + '</div></section>' +
      sec('how', '', '<div class="wl-sec-hd"><span class="eyebrow">How it works</span><h2>Status that writes itself.<br><span class="c-3">Sharing you control.</span></h2></div>' +
        '<div class="wl-steps">' + steps.map(function (s, i) { return '<div class="wl-step"><span class="wl-step-n">0' + (i + 1) + '</span><span class="wl-step-ic">' + H.icon(s[0], 22) + '</span><h3>' + esc(s[1]) + '</h3><p>' + esc(s[2]) + '</p></div>'; }).join('') + '</div>') +
      sec('altitude', 'wl-alt', '<div class="wl-alt-grid"><div><span class="eyebrow">Same truth, right altitude</span><h2>One update.<br>Three audiences.</h2><p class="wl-p">Your teammate needs the detail. Your manager needs the risk. Your VP needs one sentence. Halo writes each one from the same facts, in your voice.</p></div>' +
        '<div class="wl-alt-cards">' + AUD.map(function (x) { return '<div class="card wl-alt-card"><div class="row gap-2">' + H.icon(x.icon, 16) + '<span class="t-medium">For ' + x.label.toLowerCase() + '</span></div><p>' + esc(LINES[x.v]) + '</p></div>'; }).join('') + '</div></div>') +
      sec('privacy', 'wl-dark', '<div class="wl-sec-hd"><span class="eyebrow">Built on trust</span><h2>Halo speaks for you,<br>not about you.</h2></div><div class="wl-trust">' + trust.map(function (t) { return '<div class="wl-trust-item"><span class="wl-trust-ic">' + H.icon(t[0], 20) + '</span><h3>' + esc(t[1]) + '</h3><p>' + esc(t[2]) + '</p></div>'; }).join('') + '</div>') +
      sec('why', 'wl-quote', '<blockquote>“Because I’m tired of being paperwork for my own work.”</blockquote><p class="wl-quote-by">Why we built Halo</p>') +
      sec('start', 'wl-final', '<h2>Let your work speak for itself.</h2><p class="wl-p">Setup takes about four minutes. Nothing is shared until you say so.</p><div class="wl-ctas">' + ui.btn('Get started', { kind: 'accent', size: 'xl', action: 'wl-start', trail: H.icon('arrow-right', 18) }) + '</div>') +
      '<footer class="wl-foot"><div class="wl-wrap row gap-4 wrap">' + lockup(16) + '<span class="c-3">© 2026 Halo · myhalo.co</span><span class="grow"></span><button type="button" class="link-quiet" data-action="wl-legal" data-v="privacy">Privacy</button><button type="button" class="link-quiet" data-action="wl-legal" data-v="terms">Terms</button><button type="button" class="link-quiet" data-action="wl-legal" data-v="security">Security</button></div></footer>' +
    '</div>';
  }
  function startCycle() {
    stopCycle(); if (reduced()) return;
    view.timer = setInterval(function () {
      if (H.route.name !== 'welcome' || document.hidden) return;
      var order = ['team', 'manager', 'exec']; view.aud = order[(order.indexOf(view.aud) + 1) % 3]; H.render();
    }, 3200);
  }
  function stopCycle() { if (view.timer) { clearInterval(view.timer); view.timer = null; } }

  H.screens.welcome = {
    title: 'Halo', fullscreen: true, public: true, docTitle: function () { return 'Halo · Your work, represented.'; },
    render: welcome,
    after: function () { if (!view.timer) startCycle(); },
    leave: stopCycle,
    actions: {
      'wl-start': function () { seen(); stopCycle(); H.go('#/signin'); },
      'wl-aud': function (el) { view.aud = el.dataset.v; startCycle(); H.render(); },
      'wl-scroll': function (el) { var t = document.getElementById(el.dataset.to); if (t) t.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' }); },
      'wl-film': function () { ui.open('film'); },
      'wl-legal': function (el) { ui.open('legal', { v: el.dataset.v }); }
    }
  };

  H.overlays.film = {
    kind: 'modal', size: 'wide', title: 'The Halo film',
    render: function () {
      return '<div class="modal-hd"><div class="grow"><h2>Meet Halo</h2><p>A 90-second look at what Halo does and why.</p></div>' + ui.iconBtn('x', 'Close', 'close') + '</div>' +
        '<div class="modal-bd"><div class="film-frame"><video id="film-v" controls playsinline preload="metadata" poster="' + BASE + 'film/halo-film-poster.jpg"><source src="' + BASE + 'film/halo-launch-film.mp4" type="video/mp4"></video>' +
        '<div class="film-missing" hidden>' + ui.mark(28, true) + '<p>The film plays from the <b>film</b> folder next to this app. Open it from the project to watch.</p></div></div></div>';
    },
    onOpen: function (root) {
      var v = root.querySelector('#film-v'); if (!v) return;
      var miss = function () { var m = root.querySelector('.film-missing'); if (m) { m.hidden = false; v.style.visibility = 'hidden'; } };
      v.addEventListener('error', miss, true); var src = v.querySelector('source'); if (src) src.addEventListener('error', miss);
      try { var p = v.play(); if (p && p.catch) p.catch(function () { /* autoplay may be blocked; controls remain */ }); } catch (e) { /* ignore */ }
    }
  };
  var LEGAL = {
    privacy: ['Privacy', ['Halo reads only the sources you connect, and only the data each one lists. Raw content is processed inside your Halo and is never shown to anyone, including your manager.', 'Updates leave your Halo only when you approve them or your trust mode allows it. Private topics are dropped before a draft exists.', 'You can export or delete everything, including your voice model, at any time.']],
    terms: ['Terms', ['Halo is provided to your organization under its agreement with us. You own your content and your updates.', 'Don’t use Halo to monitor other people. It is built to speak for the person who owns it.', 'Early access features may change. We’ll tell you before anything that affects your data does.']],
    security: ['Security', ['Data is encrypted in transit and at rest. Access is scoped to the minimum each source allows.', 'Model requests go through Halo’s servers or your own key, never through third parties you didn’t choose.', 'Report a vulnerability to security@myhalo.co. We respond within one business day.']]
  };
  H.overlays.legal = {
    kind: 'modal', title: 'Legal',
    render: function (p) {
      var d = LEGAL[p.v] || LEGAL.privacy;
      return '<div class="modal-hd"><div class="grow"><h2>' + d[0] + '</h2><p>The short version. Plain words, no surprises.</p></div>' + ui.iconBtn('x', 'Close', 'close') + '</div><div class="modal-bd col gap-3">' + d[1].map(function (t) { return '<p class="t-body c-2">' + esc(t) + '</p>'; }).join('') + '</div><div class="modal-ft">' + ui.btn('Done', { kind: 'primary', action: 'close' }) + '</div>';
    }
  };

  /* ---------------- Sign in ---------------- */
  H.screens.signin = {
    title: 'Sign in', fullscreen: true, public: true, docTitle: function () { return 'Sign in · Halo'; },
    render: function () {
      var form = view.sent
        ? '<div class="si-sent rise"><div class="si-sent-ic">' + H.icon('mail', 26) + '</div><h1 class="si-h1">Check your inbox</h1><p class="si-sub">We sent a sign-in link to <b>' + esc(view.email) + '</b>. It expires in 15 minutes.</p>' +
          ui.btn('Open the sign-in link', { kind: 'primary', size: 'lg', block: true, action: 'si-continue' }) + '<button type="button" class="link-quiet t-callout mt-4" data-action="si-reset">Use a different email</button></div>'
        : '<h1 class="si-h1">Get started with Halo</h1><p class="si-sub">Use your work account. You’ll connect your tools in the next step.</p>' +
          '<div class="col gap-2 mt-8"><button type="button" class="btn btn-lg btn-block si-sso" data-action="si-sso" data-p="google">' + G_LOGO + '<span>Continue with Google</span></button>' +
          '<button type="button" class="btn btn-lg btn-block si-sso" data-action="si-sso" data-p="microsoft">' + MS_LOGO + '<span>Continue with Microsoft</span></button></div>' +
          '<div class="si-or"><span>or</span></div>' +
          '<form class="col gap-2" data-submit="si-email"><label class="sr-only" for="si-mail">Work email</label><input id="si-mail" class="input input-lg" type="email" placeholder="name@company.com" autocomplete="email" value="' + esc(view.email) + '" data-input="si-mail-in">' +
          ui.btn('Continue with email', { size: 'lg', block: true, attrs: { type: 'submit' } }) + '</form>' +
          '<p class="si-fine">By continuing you agree to the <button type="button" class="link-quiet" data-action="wl-legal" data-v="terms">Terms</button> and <button type="button" class="link-quiet" data-action="wl-legal" data-v="privacy">Privacy</button> notice. Halo never asks for your password.</p>';
      return '<div class="si"><div class="si-form"><a class="si-brand" href="#/welcome" data-nav="#/welcome">' + lockup(20) + '</a><div class="si-inner">' + form + '</div><p class="si-foot">© 2026 Halo · myhalo.co</p></div>' +
        '<aside class="si-art" aria-hidden="true"><div class="si-art-ring">' + ui.mark(420, true) + '</div><div class="si-art-copy"><p class="si-art-q">Your work, represented.</p><p class="si-art-s">Halo speaks for you, not about you.</p></div>' +
        '<div class="si-art-card card"><div class="row gap-2"><span class="kicker">' + ui.mark(14) + '<span>Shared automatically</span></span><span class="ml-auto t-caption c-3">2m ago</span></div><p class="t-callout mt-2">Started high fidelity on the payment method selector. Wallets are next.</p><div class="row gap-2 mt-3">' + ui.src('figma', 'Payment methods') + ui.src('jira', 'CHK-142') + '</div></div></aside></div>';
    },
    actions: {
      'si-sso': function (el) { view.provider = el.dataset.p; ui.open('sso', { p: el.dataset.p }); },
      'si-mail-in': function (el) { view.email = el.value; },
      'si-email': function () {
        var v = (view.email || '').trim();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) { var i = document.getElementById('si-mail'); if (i) { i.classList.add('is-invalid'); i.focus(); } ui.toast('Enter a work email like name@company.com', { icon: 'alert' }); return; }
        view.sent = true; H.render();
      },
      'si-reset': function () { view.sent = false; H.render(); },
      'si-continue': function () { finishSignIn(); },
      'wl-legal': function (el) { ui.open('legal', { v: el.dataset.v }); }
    }
  };
  function finishSignIn() { view.sent = false; seen(); H.go('#/onboarding/workspace'); }
  H.overlays.sso = {
    kind: 'modal', size: 'narrow', title: 'Choose an account',
    render: function (p) {
      var me = H.PEOPLE.maya, g = p.p === 'google';
      return '<div class="sso"><div class="sso-hd">' + (g ? G_LOGO : MS_LOGO) + '<span>Sign in with ' + (g ? 'Google' : 'Microsoft') + '</span></div>' +
        '<h2 class="t-title-2 mt-5">Choose an account</h2><p class="t-callout c-3 mt-1">to continue to <b class="c-1">Halo</b></p>' +
        '<div class="group mt-5"><button type="button" class="item has-lead clickable" data-action="sso-pick" autofocus>' + ui.avatar(me, 'md', { tip: false }) + '<span class="grow"><span class="item-title" style="display:block">' + esc(me.name) + '</span><span class="item-sub">' + esc(me.email) + '</span></span>' + H.icon('chevron-right', 16, 'c-3') + '</button>' +
        '<button type="button" class="item has-lead clickable" data-action="sso-other"><span class="lead-ic" style="width:32px;height:32px;border-radius:50%">' + H.icon('user', 16) + '</span><span class="grow item-title">Use another account</span></button></div>' +
        '<p class="t-caption c-3 mt-5" style="font-weight:400">Halo will see your name, email and profile picture. It never sees your password.</p></div>';
    },
    actions: {
      'sso-pick': function () { ui.close(true); ui.toast('Signed in as ' + H.PEOPLE.maya.email, { icon: 'check-circle' }); finishSignIn(); },
      'sso-other': function () { ui.toast('This preview uses the sample Brightwater account', { icon: 'info' }); }
    }
  };

  /* ---------------- Onboarding ---------------- */
  var STEPS = ['workspace', 'role', 'sources', 'trust', 'voice', 'boundaries', 'digest', 'warmup'];
  var REC = ['gcal', 'slack', 'figma', 'github', 'jira', 'zoom'];
  var SAMPLES = [
    ['s1', '#checkout-design', 'Posted three layout options for the payment method selector. Leaning toward the segmented list, since it keeps wallets visible without a menu.'],
    ['s2', '#checkout-eng', 'Heads up: wallet buttons stay above the card form on mobile. Sam is checking Google Pay sizing before we lock it.'],
    ['s3', 'Direct update', 'Quick update: invoice PDF header is in handoff a day early. Next up is the selector for Checkout v3.']
  ];
  function voicePreview() {
    var t = H.store.state.voice.tone, len = t.length, form = t.formality;
    var base = len < 40 ? 'Selector is in hi-fi; wallets next. Aiming for Thursday.' : len < 70 ? 'The payment method selector is in hi-fi: cards and bank transfer are done, and wallets are next. Aiming for Thursday.' : 'The payment method selector is in high fidelity. Cards and bank transfer are designed and reviewed, wallets are next, and I’m aiming to hand everything off on Thursday once Sam confirms Google Pay sizing.';
    return (form < 40 ? 'Quick update: ' + base.charAt(0).toLowerCase() + base.slice(1) : form > 65 ? 'Status: ' + base : base);
  }
  function stepBody(step) {
    var s = H.store.state;
    switch (step) {
      case 'workspace': return head('Join your team on Halo', 'We found Brightwater from your email address. Your teammates are already here.') +
        '<div class="card ob-ws"><span class="ob-ws-logo">B</span><div class="grow"><div class="t-title-3">Brightwater</div><div class="t-callout c-3">brightwater.co · 48 people</div></div>' + ui.avatarStack(['sam', 'priya', 'leo', 'hana', 'nora'].map(q.person), 'sm', 5) + '</div>' +
        '<p class="ob-note">' + H.icon('lock', 12) + ' Joining a workspace doesn’t share anything. Each person’s Halo is their own.</p>';
      case 'role': return head('What do you do?', 'Halo uses this to know which tools and words matter to your work.') +
        '<div class="ob-roles">' + [['design', 'Design', 'frame'], ['eng', 'Engineering', 'git-commit'], ['product', 'Product', 'target'], ['data', 'Data', 'chart'], ['other', 'Something else', 'sparkle']].map(function (r) {
          return '<button type="button" class="choice ob-role" aria-checked="' + (view.role === r[0]) + '" data-action="ob-role" data-v="' + r[0] + '"><span class="ob-role-ic">' + H.icon(r[2], 20) + '</span><span class="item-title">' + r[1] + '</span></button>';
        }).join('') + '</div>' +
        '<div class="field mt-6"><label for="ob-team">Team</label><select id="ob-team" class="select input-lg" data-change="ob-team">' + ['Checkout', 'Invoices', 'Platform', 'Growth'].map(function (t) { return '<option' + (view.team === t ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select></div>';
      case 'sources':
        var all = REC.every(function (id) { return s.sources[id].status === 'connected' || s.sources[id].status === 'error'; });
        return head('Connect what you already use', 'Halo drafts updates from the work you already do. It reads only what you connect.') +
          '<div class="group ob-src">' + REC.map(function (id) {
            var meta = q.source(id), on = meta.status === 'connected' || meta.status === 'error', busy = view.conn[id] === 'busy';
            return '<div class="item has-lead">' + H.brandTile(id, 36) + '<span class="grow" style="min-width:0"><span class="item-title" style="display:block">' + esc(H.brands[id].name) + '</span><span class="item-sub truncate" style="display:block">' + esc(meta.reads[0]) + '</span></span>' +
              (on ? '<span class="ob-ok">' + H.icon('check', 14) + 'Connected</span>' : ui.btn(busy ? 'Connecting' : 'Connect', { size: 'sm', action: 'ob-connect', attrs: { 'data-id': id }, cls: busy ? 'is-loading' : '' })) + '</div>';
          }).join('') + '</div>' +
          '<div class="row gap-3 mt-4">' + (all ? '<span class="t-callout c-3">All set. You can add more sources later.</span>' : ui.btn('Connect all six', { kind: 'ghost', size: 'sm', icon: 'plus', action: 'ob-connect-all' })) + '</div>' +
          '<p class="ob-note">' + H.icon('lock', 12) + ' Halo never reads direct messages, private channels or event descriptions marked private.</p>';
      case 'trust':
        var m = s.prefs.mode, eff = { curated: 'All 12 of today’s updates would wait for you.', balanced: '4 would wait for you. 8 routine ones would share themselves.', ambient: 'None would wait. The one private item would be dropped, and everything is logged.' };
        return head('How much should Halo share on its own?', 'This is one dial, not three products. You can turn it any time with [ and ].') +
          '<div class="ob-modes">' + H.shell.MODES.map(function (x, i) {
            return '<button type="button" class="choice ob-mode" aria-checked="' + (m === x.v) + '" data-action="ob-mode" data-v="' + x.v + '">' + H.shell.dial(i, 56) + '<span class="t-title-3 mt-3" style="display:block">' + x.label + (x.v === 'balanced' ? ' <span class="badge badge-accent" style="vertical-align:2px">Recommended</span>' : '') + '</span><span class="t-callout c-3" style="display:block;margin-top:4px">' + esc(x.note) + '</span></button>';
          }).join('') + '</div>' +
          '<div class="banner mt-5">' + H.icon('digest', 16) + '<span><strong>Today, with your work:</strong> ' + eff[m] + '</span></div>';
      case 'voice':
        var t = s.voice.tone;
        return head('Teach Halo your voice', 'Pick a few things you’ve written. Halo learns how you sound, and the model never leaves your Halo.') +
          '<div class="col gap-2">' + SAMPLES.map(function (x) {
            var on = view.samples[x[0]];
            return '<button type="button" class="choice ob-sample" aria-checked="' + on + '" data-action="ob-sample" data-v="' + x[0] + '">' + ui.check(on, 'noop', { tabindex: '-1', 'aria-hidden': 'true' }, 'square') + '<span class="grow"><span class="t-caption c-3 row gap-1" style="font-weight:500">' + H.brandMark('slack', 12) + esc(x[1]) + '</span><span class="t-callout" style="display:block;margin-top:4px">' + esc(x[2]) + '</span></span></button>';
          }).join('') + '</div>' +
          '<div class="ob-sliders mt-6">' + [['length', 'Concise', 'Detailed'], ['formality', 'Casual', 'Formal']].map(function (x) {
            return '<div class="ob-slider"><span>' + x[1] + '</span><input type="range" min="0" max="100" value="' + t[x[0]] + '" data-input="ob-tone" data-k="' + x[0] + '" aria-label="' + x[1] + ' to ' + x[2] + '"><span>' + x[2] + '</span></div>';
          }).join('') + '</div>' +
          '<div class="card ob-preview mt-4"><span class="kicker">' + ui.mark(14) + '<span>How you’ll sound</span></span><p id="ob-prev">' + esc(voicePreview()) + '</p></div>';
      case 'boundaries':
        return head('Set your boundaries', 'Anything that touches these topics is dropped before a draft exists. When Halo holds something back, it tells you.') +
          '<div class="group-title">Private topics</div><div class="group">' + s.privacy.topics.map(function (tp) {
            return '<div class="item"><span class="grow"><span class="item-title" style="display:block">' + esc(tp.label) + '</span><span class="item-sub">' + esc(tp.hint) + '</span></span>' + ui.switch(tp.on, 'ob-topic', { 'data-id': tp.id, 'aria-label': tp.label }) + '</div>';
          }).join('') + '</div>' +
          '<div class="group-title mt-6">Never share</div><div class="group">' + [['dm', 'Direct messages'], ['private', 'Events marked private'], ['oneonone', 'Anything from 1:1s']].map(function (r) {
            return '<div class="item"><span class="grow item-title">' + r[1] + '</span><span class="badge">' + H.icon('lock', 12) + 'Always</span></div>';
          }).join('') + '</div>' +
          '<div class="banner mt-5"><span class="redacted-chip"><span class="bars"><i></i><i></i></span>Redacted: 1 private topic</span><span>This is what visible restraint looks like. Only you see what was held back.</span></div>';
      case 'digest':
        var cur = s.prefs.digestTime;
        return head('When should your digest arrive?', 'Once a day, Halo asks you about the few updates that need a human. It takes about two minutes.') +
          '<div class="ob-times">' + [['12:00', '12:00 PM', 'Midday'], ['16:30', '4:30 PM', 'End of day'], ['17:30', '5:30 PM', 'Before you log off']].map(function (x) {
            return '<button type="button" class="choice ob-time" aria-checked="' + (cur === x[0]) + '" data-action="ob-time" data-v="' + x[0] + '"><span class="t-title-2 num">' + x[1] + '</span><span class="t-callout c-3">' + x[2] + (x[0] === '16:30' ? ' · recommended' : '') + '</span></button>';
          }).join('') + '</div>' +
          '<div class="group-title mt-6">Tell me when it’s ready</div><div class="group">' +
            '<div class="item"><span class="grow item-title">In Halo</span>' + ui.switch(true, 'noop', { disabled: true, 'aria-label': 'In Halo, always on' }) + '</div>' +
            '<div class="item"><span class="grow item-title">Push notification</span>' + ui.switch(s.prefs.notify.push, 'ob-notify', { 'data-k': 'push', 'aria-label': 'Push' }) + '</div>' +
            '<div class="item"><span class="grow item-title">Email</span>' + ui.switch(s.prefs.notify.email, 'ob-notify', { 'data-k': 'email', 'aria-label': 'Email' }) + '</div></div>';
      case 'warmup':
        var tasks = [['gcal', 'Reading this week’s calendar'], ['figma', 'Looking at your Figma files'], ['jira', 'Matching Jira tickets to your work'], ['github', 'Linking pull requests'], ['slack', 'Learning your voice from samples you chose']];
        var done = view.warm >= tasks.length;
        return '<div class="ob-warm">' + (done ? '<div class="ob-warm-ic done">' + H.icon('check', 28) + '</div>' : '<div class="ob-warm-ic"><span class="ob-spin">' + ui.mark(40) + '</span></div>') +
          '<h1 class="ob-h1">' + (done ? 'Your first digest is ready' : 'Halo is getting to know your work') + '</h1>' +
          '<p class="ob-sub">' + (done ? 'Here’s what Halo drafted from today. Routine updates are shared for you; the rest wait for a quick decision.' : 'This takes a few seconds. Nothing is shared yet.') + '</p>' +
          '<div class="group ob-tasks">' + tasks.map(function (x, i) {
            var st = i < view.warm ? 'done' : i === view.warm ? 'busy' : 'todo';
            return '<div class="item has-lead ' + st + '">' + H.brandTile(x[0], 28) + '<span class="grow item-title" style="font-weight:400">' + x[1] + '</span>' + (st === 'done' ? '<span class="ob-ok">' + H.icon('check', 14) + '</span>' : st === 'busy' ? '<span class="ob-dots"><i></i><i></i><i></i></span>' : '') + '</div>';
          }).join('') + '</div>' +
          (done ? '<div class="ob-sum"><div><span class="stat-num">12</span><span class="stat-label">Updates drafted</span></div><div><span class="stat-num">8</span><span class="stat-label">Routine, shared for you</span></div><div><span class="stat-num c-accent">4</span><span class="stat-label">Need you</span></div></div>' : '') + '</div>';
    }
    return '';
  }
  function head(t, sub) { return '<h1 class="ob-h1">' + esc(t) + '</h1><p class="ob-sub">' + esc(sub) + '</p>'; }
  function runWarm() {
    if (view.warmTimer) return;
    view.warm = 0;
    view.warmTimer = setInterval(function () {
      if (H.route.name !== 'onboarding' || H.route.parts[0] !== 'warmup') { clearInterval(view.warmTimer); view.warmTimer = null; return; }
      view.warm++; H.render(); if (view.warm >= 5) { clearInterval(view.warmTimer); view.warmTimer = null; }
    }, reduced() ? 150 : 720);
  }
  function go(step) { H.go('#/onboarding/' + step); }
  function next() {
    var i = STEPS.indexOf(H.route.parts[0] || 'workspace');
    if (i < STEPS.length - 1) go(STEPS[i + 1]); else finish();
  }
  function finish() {
    H.store.commit(function (s) { s.session.onboarded = true; s.session.welcomeSeen = true; s.session.tourDone = false; });
    H.go('#/home');
    setTimeout(function () { if (H.tour) H.tour.start(); }, 650);
  }

  H.screens.onboarding = {
    title: 'Set up Halo', fullscreen: true, public: true, docTitle: function () { return 'Set up · Halo'; },
    render: function (r) {
      var step = STEPS.indexOf(r.parts[0]) >= 0 ? r.parts[0] : 'workspace', i = STEPS.indexOf(step);
      var last = step === 'warmup', ready = last && view.warm >= 5;
      var cta = { workspace: 'Join workspace', role: 'Continue', sources: 'Continue', trust: 'Use ' + H.store.state.prefs.mode.charAt(0).toUpperCase() + H.store.state.prefs.mode.slice(1), voice: 'Continue', boundaries: 'Continue', digest: 'Finish setup', warmup: 'Open Halo' }[step];
      return '<div class="ob"><header class="ob-top">' + lockup(18) + '<div class="ob-prog" role="progressbar" aria-valuemin="1" aria-valuemax="' + STEPS.length + '" aria-valuenow="' + (i + 1) + '">' + STEPS.map(function (x, j) { return '<i class="' + (j < i ? 'done' : j === i ? 'now' : '') + '"></i>'; }).join('') + '</div>' +
        '<span class="t-caption c-3 nowrap">Step ' + (i + 1) + ' of ' + STEPS.length + '</span></header>' +
        '<main class="ob-main"><div class="ob-body" data-key="ob-' + step + '">' + stepBody(step) + '</div></main>' +
        '<footer class="ob-foot"><div class="ob-foot-in">' + (i > 0 && !last ? ui.btn('Back', { kind: 'ghost', icon: 'arrow-left', action: 'ob-back' }) : '<span></span>') + '<span class="grow"></span>' +
          (['sources', 'voice', 'boundaries'].indexOf(step) >= 0 ? ui.btn('Skip for now', { kind: 'ghost', action: 'ob-next' }) : '') +
          ui.btn(cta, { kind: 'primary', size: 'lg', action: 'ob-next', disabled: last && !ready, trail: last ? '' : H.icon('arrow-right', 16), attrs: { id: 'ob-cta' } }) + '</div></footer></div>';
    },
    after: function (root, r) { if (r.parts[0] === 'warmup' && view.warm < 5) runWarm(); },
    keys: { Enter: function () { var b = document.getElementById('ob-cta'); if (b && !b.disabled) next(); } },
    actions: {
      'ob-next': function () { next(); },
      'ob-back': function () { var i = STEPS.indexOf(H.route.parts[0]); go(STEPS[Math.max(0, i - 1)]); },
      'ob-role': function (el) { view.role = el.dataset.v; H.render(); },
      'ob-team': function (el) { view.team = el.value; },
      'ob-connect': function (el) { connect(el.dataset.id); },
      'ob-connect-all': function () { REC.forEach(function (id, i) { setTimeout(function () { connect(id); }, i * 160); }); },
      'ob-mode': function (el) { H.act.setMode(el.dataset.v, true); },
      'ob-sample': function (el) { var k = el.dataset.v; view.samples[k] = !view.samples[k]; H.render(); },
      'ob-tone': function (el) { H.store.state.voice.tone[el.dataset.k] = +el.value; H.store.save(); var p = document.getElementById('ob-prev'); if (p) p.textContent = voicePreview(); },
      'ob-topic': function (el) { var id = el.dataset.id; H.store.commit(function (s) { s.privacy.topics.forEach(function (t) { if (t.id === id) t.on = !t.on; }); }); },
      'ob-time': function (el) { var v = el.dataset.v; H.store.commit(function (s) { s.prefs.digestTime = v; s.digest.closesAt = H.slot(0, v); }); },
      'ob-notify': function (el) { var k = el.dataset.k; H.store.commit(function (s) { s.prefs.notify[k] = !s.prefs.notify[k]; }); },
      'noop': function () { }
    }
  };
  function connect(id) {
    var s = H.store.state.sources[id]; if (!s || s.status === 'connected' || view.conn[id]) return;
    view.conn[id] = 'busy'; H.render();
    setTimeout(function () { view.conn[id] = null; H.store.commit(function (st) { st.sources[id].status = 'connected'; st.sources[id].error = null; st.sources[id].sync = 0; }); }, 650);
  }
})(window.H = window.H || {});

/* Shell: sidebar, top bar, phone bars, command palette, global overlays and actions. */
(function (H) {
  'use strict';
  var esc = H.esc, ui = H.ui, q = H.q;
  var shell = H.shell = {};

  var NAV = [
    { id: 'home', label: 'Home', icon: 'home', nav: '#/home', key: 'H' },
    { id: 'digest', label: 'Digest', icon: 'digest', nav: '#/digest', key: 'D' },
    { id: 'ask', label: 'Ask Halo', icon: 'ask', nav: '#/ask', key: 'A' },
    { id: 'tickets', label: 'Tickets', icon: 'ticket', nav: '#/tickets', key: 'T' },
    { id: 'calendar', label: 'Calendar', icon: 'calendar', nav: '#/calendar', key: 'C' },
    { id: 'team', label: 'Team', icon: 'team', nav: '#/team', key: 'M' },
    { id: 'history', label: 'History', icon: 'history', nav: '#/history', key: 'Y' }
  ];
  var NAV2 = [
    { id: 'sources', label: 'Sources', icon: 'sources', nav: '#/sources', key: 'S' },
    { id: 'privacy', label: 'Voice & privacy', icon: 'privacy', nav: '#/privacy', key: 'P' },
    { id: 'settings', label: 'Settings', icon: 'settings', nav: '#/settings', key: ',' }
  ];
  shell.NAV = NAV.concat(NAV2);
  var MODES = [
    { v: 'curated', label: 'Curated', note: 'You approve everything before it’s shared.' },
    { v: 'balanced', label: 'Balanced', note: 'Routine updates share themselves. Sensitive ones wait for you.' },
    { v: 'ambient', label: 'Ambient', note: 'Halo shares as it goes and logs everything it does.' }
  ];
  shell.MODES = MODES;

  function navItem(n, active) {
    var trail = '';
    if (n.id === 'digest') { var c = q.pendingCount(); if (c) trail = '<span class="count-pill" aria-label="' + c + ' waiting">' + c + '</span>'; }
    if (n.id === 'tickets') { var open = q.myTickets().filter(function (t) { return t.status !== 'done'; }).length; trail = '<span class="count">' + open + '</span>'; }
    if (n.id === 'sources' && q.connected().some(function (s) { return H.store.state.sources[s.id].status === 'error'; })) trail = '<span class="dot dot-warning" aria-label="Needs attention"></span>';
    return '<a class="nav-item" href="' + n.nav + '" data-nav="' + n.nav + '"' + (active ? ' aria-current="page"' : '') + ' data-tip-side="right">' +
      H.icon(n.icon, 18) + '<span>' + esc(n.label) + '</span>' + (trail ? '<span class="trail">' + trail + '</span>' : '') + '</a>';
  }
  function activeId(r) {
    var map = { recap: 'calendar', person: 'team' };
    return map[r.name] || r.name;
  }

  shell.sidebar = function (r) {
    var s = H.store.state, me = q.me(), a = activeId(r), mode = s.prefs.mode, m = MODES.filter(function (x) { return x.v === mode; })[0];
    return '<aside class="sidebar' + (H.view.drawer ? ' is-open' : '') + '" id="sidebar" aria-label="Primary">' +
      '<button class="ws" type="button" data-action="ws-menu" aria-haspopup="menu"><span class="ws-mark">' + ui.mark(18, true) + '</span>' +
        '<span class="grow"><span class="ws-name" style="display:block">' + esc(s.workspace.name) + '</span><span class="ws-sub">Halo · ' + esc(s.workspace.plan) + '</span></span>' + H.icon('chevrons-up-down', 16, 'c-3') + '</button>' +
      '<div class="row gap-2" style="margin-bottom:10px">' +
        '<button class="side-search" type="button" data-action="palette" style="margin:0">' + H.icon('search', 16) + '<span>Search</span><span class="kbd">' + H.util.mod + '</span><span class="kbd" style="margin-left:2px">K</span></button>' +
        '<button class="icon-btn hide-phone" type="button" data-action="quick-add" data-tip="New" data-kbd="N" aria-label="New" style="flex:none;background:var(--surface);box-shadow:0 0 0 1px var(--border)">' + H.icon('plus', 18) + '</button>' +
      '</div>' +
      '<nav class="nav">' + NAV.map(function (n) { return navItem(n, a === n.id); }).join('') +
        '<div class="nav-label">Your Halo</div>' + NAV2.map(function (n) { return navItem(n, a === n.id); }).join('') + '</nav>' +
      '<div class="side-spacer"></div>' +
      '<div class="trust" data-tour="trust"><div class="trust-hd">' + H.icon('dial', 15) + '<span>Trust mode</span><strong class="ml-auto">' + m.label + '</strong>' +
        '<button type="button" class="icon-btn xs" data-action="trust-info" data-tip="How trust modes work" aria-label="How trust modes work">' + H.icon('info', 14) + '</button></div>' +
        '<div class="trust-track" role="radiogroup" aria-label="Trust mode">' + MODES.map(function (x) {
          return '<button type="button" class="trust-stop" role="radio" aria-checked="' + (x.v === mode) + '" aria-pressed="' + (x.v === mode) + '" data-action="set-mode" data-v="' + x.v + '" data-tip="' + esc(x.note) + '">' + x.label + '</button>';
        }).join('') + '</div>' +
        '<p class="trust-note">' + esc(m.note) + '</p></div>' +
      '<button class="me" type="button" data-action="me-menu" aria-haspopup="menu">' + ui.avatar(me, 'md', { tip: false }) +
        '<span class="grow"><span class="me-name truncate" style="display:block">' + esc(me.name) + '</span><span class="me-sub truncate" style="display:block">' + esc(me.role) + '</span></span>' + H.icon('more', 16, 'c-3') + '</button>' +
    '</aside>';
  };

  shell.render = function (r, scr) {
    var s = H.store.state, crumbs = scr.crumbs ? scr.crumbs(r) : [{ label: scr.title }];
    var unread = q.unread(), pend = q.pendingCount();
    var crumbHtml = crumbs.map(function (c, i) {
      var last = i === crumbs.length - 1;
      return (i ? '<span class="sep">/</span>' : '') + (c.nav && !last ? '<a href="' + c.nav + '" data-nav="' + c.nav + '">' + esc(c.label) + '</a>' : '<span class="' + (last ? 'here truncate' : '') + '">' + esc(c.label) + '</span>');
    }).join('');
    var bell = '<button type="button" class="icon-btn" data-action="notifications" data-tip="Notifications" aria-label="Notifications' + (unread ? ', ' + unread + ' unread' : '') + '">' + H.icon('bell', 18) + (unread ? '<span class="bell-dot"></span>' : '') + '</button>';
    var tabs = [NAV[0], NAV[1], NAV[2], NAV[3]];
    var a = activeId(r);
    return '<div class="app" data-key="app">' +
      shell.sidebar(r) + (H.view.drawer ? '<div class="scrim" data-action="drawer-close" style="z-index:57"></div>' : '') +
      '<main class="main" id="main">' +
        (s.privacy.paused ? '<div class="paused-strip">' + H.icon('pause-circle', 16) + '<span>Halo is paused. Nothing is being observed or shared.</span><button type="button" data-action="resume">Resume</button></div>' : '') +
        '<header class="topbar"><nav class="crumbs" aria-label="Breadcrumb">' + crumbHtml + '</nav>' +
          '<div class="actions">' + (scr.toolbar ? scr.toolbar(r) : '') +
            '<button type="button" class="icon-btn" data-action="help-menu" aria-haspopup="menu" data-tip="Help" aria-label="Help">' + H.icon('help', 18) + '</button>' + bell +
          '</div></header>' +
        '<div class="mbar"><button type="button" class="icon-btn" data-action="drawer" aria-label="Menu">' + H.icon('sidebar', 20) + '</button>' +
          '<div class="title truncate">' + esc(crumbs[crumbs.length - 1].label) + '</div>' +
          '<div class="actions"><button type="button" class="icon-btn" data-action="palette" aria-label="Search">' + H.icon('search', 20) + '</button>' +
          '<button type="button" class="icon-btn" data-action="quick-add" aria-label="New">' + H.icon('plus', 20) + '</button>' + bell + '</div></div>' +
        '<div class="content" id="content"><div class="page ' + (scr.pageClass ? (typeof scr.pageClass === 'function' ? scr.pageClass(r) : scr.pageClass) : '') + ' screen-enter" data-key="pg-' + r.name + '-' + (r.parts[0] || '') + '">' + scr.render(r) + '</div></div>' +
        '<nav class="tabbar" aria-label="Tabs">' + tabs.map(function (n) {
          return '<a class="tab-btn" href="' + n.nav + '" data-nav="' + n.nav + '"' + (a === n.id ? ' aria-current="page"' : '') + '>' + H.icon(n.icon, 22) + '<span>' + (n.id === 'ask' ? 'Ask' : n.label) + '</span>' + (n.id === 'digest' && pend ? '<span class="count-pill">' + pend + '</span>' : '') + '</a>';
        }).join('') + '<button type="button" class="tab-btn" data-action="drawer">' + H.icon('more', 22) + '<span>More</span></button></nav>' +
      '</main></div>';
  };

  /* ---------- Command palette ---------- */
  function paletteItems(text) {
    var t = (text || '').trim().toLowerCase(), groups = [];
    var match = function (s) { if (!t) return true; s = s.toLowerCase(); return t.split(/\s+/).every(function (w) { return s.indexOf(w) >= 0; }); };
    var go = shell.NAV.filter(function (n) { return match('go to ' + n.label); }).map(function (n) { return { icon: n.icon, text: n.label, sub: '', run: function () { H.go(n.nav); }, keys: 'G ' + n.key }; });
    var acts = [
      { icon: 'plus', text: 'New ticket', run: function () { H.ui.open('quickadd', { type: 'ticket' }); }, keys: 'N' },
      { icon: 'edit', text: 'Post an update', run: function () { H.ui.open('quickadd', { type: 'update' }); } },
      { icon: 'clock', text: 'Log time', run: function () { H.ui.open('quickadd', { type: 'time' }); } },
      { icon: 'calendar-plus', text: 'Book focus time', run: function () { H.ui.open('booktime', {}); } },
      { icon: 'digest', text: 'Review digest', run: function () { H.go('#/digest'); } },
      { icon: 'dial', text: 'Trust mode: Curated', run: function () { H.act.setMode('curated'); } },
      { icon: 'dial', text: 'Trust mode: Balanced', run: function () { H.act.setMode('balanced'); } },
      { icon: 'dial', text: 'Trust mode: Ambient', run: function () { H.act.setMode('ambient'); } },
      { icon: H.isDark() ? 'sun' : 'moon', text: H.isDark() ? 'Switch to light appearance' : 'Switch to dark appearance', run: function () { H.act.setPref('theme', H.isDark() ? 'light' : 'dark'); } },
      { icon: H.store.state.privacy.paused ? 'play-circle' : 'pause-circle', text: H.store.state.privacy.paused ? 'Resume Halo' : 'Pause Halo', run: function () { H.act.pause(!H.store.state.privacy.paused); } },
      { icon: 'keyboard', text: 'Keyboard shortcuts', run: function () { H.ui.open('shortcuts'); }, keys: '?' },
      { icon: 'compass', text: 'Take the product tour', run: function () { H.tour && H.tour.start(); } }
    ].filter(function (x) { return match(x.text); });
    var tix = H.store.state.tickets.filter(function (x) { return t && match(x.key + ' ' + x.title); }).slice(0, 6).map(function (x) {
      return { lead: H.ui.status(x.status, false), text: x.title, sub: x.key, run: function () { H.go('#/tickets/' + x.key); } };
    });
    var ppl = Object.keys(H.PEOPLE).filter(function (id) { return id !== H.store.state.me && t && match(H.PEOPLE[id].name + ' ' + H.PEOPLE[id].role); }).slice(0, 4).map(function (id) {
      var p = H.PEOPLE[id]; return { lead: H.ui.avatar(p, 'xs', { tip: false }), text: p.name, sub: p.role, run: function () { H.go('#/team/' + id); } };
    });
    if (tix.length) groups.push({ label: 'Tickets', items: tix });
    if (ppl.length) groups.push({ label: 'People', items: ppl });
    if (go.length) groups.push({ label: 'Go to', items: go });
    if (acts.length) groups.push({ label: 'Actions', items: acts });
    if (t) groups.push({ label: 'Ask Halo', items: [{ icon: 'sparkle', text: 'Ask “' + text.trim() + '”', run: function () { H.go('#/ask'); setTimeout(function () { H.askSend && H.askSend(text.trim()); }, 60); } }] });
    return groups;
  }
  shell.openPalette = function () { ui.closeMenu(); H.view.palette = { q: '', hot: 0 }; H.render(); setTimeout(function () { var i = document.getElementById('palette-q'); if (i) i.focus(); }, 30); };
  shell.closePalette = function () { H.view.palette = null; H.render(); };
  shell.renderPalette = function () {
    var p = H.view.palette; if (!p) return '';
    var groups = paletteItems(p.q), flat = [], n = 0;
    groups.forEach(function (g) { g.items.forEach(function (it) { flat.push(it); }); });
    p._flat = flat; p.hot = Math.min(p.hot, Math.max(0, flat.length - 1));
    return '<div class="scrim" data-action="palette-close" data-key="p-scrim" style="z-index:79;background:rgba(15,17,20,.2)"></div>' +
      '<div class="palette" role="dialog" aria-label="Command palette" data-key="palette">' +
      '<div class="palette-in">' + H.icon('search', 18, 'c-3') + '<input id="palette-q" type="text" autocomplete="off" spellcheck="false" placeholder="Search tickets, people, actions, or ask Halo" data-input="palette-q" data-enter="palette-go" value="' + esc(p.q) + '" aria-label="Search">' + '<span class="kbd">esc</span></div>' +
      '<div class="palette-list" role="listbox">' + (flat.length ? groups.map(function (g) {
        return '<div class="palette-group">' + esc(g.label) + '</div>' + g.items.map(function (it) {
          var i = n++;
          return '<button type="button" class="palette-item' + (i === p.hot ? ' is-hot' : '') + '" role="option" aria-selected="' + (i === p.hot) + '" data-action="palette-run" data-i="' + i + '">' + (it.lead || H.icon(it.icon, 18)) + '<span class="truncate">' + esc(it.text) + (it.sub ? '<span class="sub">' + esc(it.sub) + '</span>' : '') + '</span>' + (it.keys ? '<span class="trail">' + ui.kbd(it.keys) + '</span>' : '') + '</button>';
        }).join('');
      }).join('') : '<div class="empty" style="padding:32px 16px"><p>No matches. Press Enter to ask Halo instead.</p></div>') + '</div>' +
      '<div class="palette-ft"><span>' + ui.kbd('↑ ↓') + ' to move</span><span><span class="kbd">↵</span> to open</span><span class="ml-auto">' + H.icon('logo', 14) + ' Halo</span></div></div>';
  };
  document.addEventListener('keydown', function (e) {
    var p = H.view.palette; if (!p || e.target.id !== 'palette-q') return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); var len = (p._flat || []).length; if (!len) return;
      p.hot = (p.hot + (e.key === 'ArrowDown' ? 1 : -1) + len) % len; H.renderNow();
      var hot = document.querySelector('.palette-item.is-hot'); if (hot) hot.scrollIntoView({ block: 'nearest' });
    }
  });

  /* ---------- Global actions ---------- */
  var A = H.actions;
  A['palette'] = function () { shell.openPalette(); };
  A['palette-close'] = function () { shell.closePalette(); };
  A['palette-q'] = function (el) { H.view.palette.q = el.value; H.view.palette.hot = 0; H.render(); };
  A['palette-run'] = function (el) { var it = H.view.palette._flat[+el.dataset.i]; H.view.palette = null; H.render(); if (it) it.run(); };
  A['palette-go'] = function () {
    var p = H.view.palette; if (!p) return; var it = (p._flat || [])[p.hot];
    if (!it && p.q.trim()) { var text = p.q.trim(); H.view.palette = null; H.go('#/ask'); setTimeout(function () { H.askSend && H.askSend(text); }, 60); return; }
    H.view.palette = null; H.render(); if (it) it.run();
  };
  A['overlay-close'] = function () { ui.close(); };
  A['close'] = function () { ui.close(); };
  A['drawer'] = function () { H.view.drawer = true; H.render(); };
  A['drawer-close'] = function () { H.view.drawer = false; H.render(); };
  A['set-mode'] = function (el) { H.act.setMode(el.dataset.v); };
  A['trust-info'] = function () { ui.open('trust'); };
  A['quick-add'] = function (el) { ui.open('quickadd', { type: el && el.dataset.type }); };
  A['resume'] = function () { H.act.pause(false); };
  A['notifications'] = function () { ui.open('notifications'); };
  A['nav'] = function (el) { H.go(el.dataset.to); };
  A['seg'] = function (el) { H.act.setPref(el.dataset.name, el.dataset.v); };
  A['open'] = function (el) { ui.open(el.dataset.overlay, Object.assign({}, el.dataset)); };
  A['copy'] = function (el) { H.util.copy(el.dataset.text || '').then(function (ok) { ui.toast(ok === false ? 'Couldn\u2019t copy here. Select the text and copy it instead.' : 'Copied to clipboard', { icon: ok === false ? 'alert' : 'copy' }); }); };
  A['ws-menu'] = function (el) {
    ui.menu(el, [
      { label: 'Brightwater · 48 members' },
      { icon: 'building', text: 'Workspace settings', nav: '#/settings/workspace' },
      { icon: 'user-plus', text: 'Invite teammates', action: 'invite' },
      { sep: true },
      { icon: 'sources', text: 'Manage sources', nav: '#/sources' },
      { icon: 'gift', text: 'What’s new in Halo', action: 'open', attrs: { 'data-overlay': 'whatsnew' } }
    ], { width: 240 });
  };
  A['me-menu'] = function (el) {
    var t = H.store.state.prefs.theme;
    ui.menu(el, [
      { label: H.PEOPLE[H.store.state.me].email },
      { icon: 'user', text: 'Profile', nav: '#/settings/profile' },
      { icon: 'fingerprint', text: 'Voice & privacy', nav: '#/privacy' },
      { icon: 'settings', text: 'Settings', nav: '#/settings', kbd: 'G ,' },
      { sep: true },
      { label: 'Appearance' },
      { icon: 'monitor', text: 'System', action: 'theme', attrs: { 'data-v': 'system' }, checked: t === 'system' },
      { icon: 'sun', text: 'Light', action: 'theme', attrs: { 'data-v': 'light' }, checked: t === 'light' },
      { icon: 'moon', text: 'Dark', action: 'theme', attrs: { 'data-v': 'dark' }, checked: t === 'dark' },
      { sep: true },
      { icon: H.store.state.privacy.paused ? 'play-circle' : 'pause-circle', text: H.store.state.privacy.paused ? 'Resume Halo' : 'Pause Halo', action: 'toggle-pause' },
      { icon: 'log-out', text: 'Sign out', action: 'sign-out' }
    ], { side: 'top', width: 250 });
  };
  A['help-menu'] = function (el) {
    ui.menu(el, [
      { icon: 'compass', text: 'Product tour', action: 'tour' },
      { icon: 'keyboard', text: 'Keyboard shortcuts', action: 'open', attrs: { 'data-overlay': 'shortcuts' }, kbd: '?' },
      { icon: 'gift', text: 'What’s new', action: 'open', attrs: { 'data-overlay': 'whatsnew' } },
      { icon: 'book', text: 'Help center', action: 'open', attrs: { 'data-overlay': 'help' } },
      { sep: true },
      { icon: 'dial', text: 'How trust modes work', action: 'trust-info' },
      { icon: 'refresh', text: 'Reset demo workspace', action: 'reset-demo' }
    ], { align: 'end', width: 240 });
  };
  A['theme'] = function (el) { H.act.setPref('theme', el.dataset.v); };
  A['toggle-pause'] = function () { H.act.pause(!H.store.state.privacy.paused); };
  A['tour'] = function () { if (H.tour) H.tour.start(); };
  A['invite'] = function () { ui.open('invite'); };
  A['sign-out'] = function () { H.store.commit(function (s) { s.session.onboarded = false; s.session.welcomeSeen = false; }); H.go('#/welcome'); };
  A['reset-demo'] = function () { ui.open('confirm', { title: 'Reset the demo workspace?', body: 'This restores Brightwater’s sample data and clears your changes. Your appearance settings stay.', ok: 'Reset workspace', danger: true, run: 'reset-demo-go' }); };
  A['reset-demo-go'] = function () { ui.close(true); H.store.reset(true); H.go('#/home'); ui.toast('Demo workspace restored', { icon: 'refresh' }); };

  /* ---------- Global overlays ---------- */
  var O = H.overlays;
  O.confirm = {
    kind: 'modal', size: 'narrow', title: 'Confirm',
    render: function (p) {
      return '<div class="modal-hd"><div class="grow"><h2>' + esc(p.title) + '</h2>' + (p.body ? '<p>' + esc(p.body) + '</p>' : '') + '</div></div>' +
        '<div class="modal-ft" style="border:0;padding-top:20px">' + ui.btn('Cancel', { action: 'close' }) + ui.btn(p.ok || 'Confirm', { kind: p.danger ? 'danger-solid' : 'primary', action: 'confirm-ok', attrs: { autofocus: true } }) + '</div>';
    },
    actions: { 'confirm-ok': function () { var p = H.view.overlay.params; H.dispatch(p.run, null, null); } }
  };

  O.notifications = {
    kind: 'sheet', title: 'Notifications',
    render: function () {
      var list = H.store.state.notifications.slice().sort(function (a, b) { return b.t - a.t; });
      return '<div class="sheet-hd"><h2 class="t-title-3 grow">Notifications</h2>' + ui.btn('Mark all read', { kind: 'ghost', size: 'sm', action: 'notif-read', disabled: !q.unread() }) + ui.iconBtn('settings', 'Notification settings', 'nav', { attrs: { 'data-to': '#/settings/notifications' } }) + ui.iconBtn('x', 'Close', 'close') + '</div>' +
        '<div class="sheet-bd">' + (list.length ? list.map(function (n) {
          return '<button type="button" class="notif" data-action="notif-open" data-id="' + n.id + '">' + (n.unread ? '<span class="unread" aria-label="Unread"></span>' : '') +
            '<span class="lead-ic" style="width:32px;height:32px;border-radius:9px;display:grid;place-items:center;background:var(--surface-2);color:var(--text-2);flex:none">' + H.icon(n.icon, 16) + '</span>' +
            '<span class="grow"><span class="notif-title" style="display:block">' + esc(n.title) + '</span><span class="notif-body" style="display:block">' + esc(n.body) + '</span><span class="notif-time" style="display:block">' + H.fmt.rel(H.at(n.t)) + '</span></span></button>';
        }).join('') : ui.empty('bell', 'You’re all caught up', 'Halo tells you when something needs a decision. Nothing does right now.')) + '</div>';
    },
    actions: {
      'notif-read': function () { H.act.readAll(); },
      'notif-open': function (el) {
        var n = H.store.state.notifications.filter(function (x) { return x.id === el.dataset.id; })[0];
        H.store.commit(function (s) { s.notifications.forEach(function (x) { if (x.id === n.id) x.unread = false; }); }, { render: false });
        ui.close(true); if (n && n.nav) H.go(n.nav);
      }
    }
  };

  O.shortcuts = {
    kind: 'modal', size: 'wide', title: 'Keyboard shortcuts',
    render: function () {
      var M = H.util.mod, groups = [
        ['General', [['Search and commands', M + ' K'], ['New ticket or update', 'N'], ['Keyboard shortcuts', '?'], ['Close panel or menu', 'esc']]],
        ['Go to', [['Home', 'G H'], ['Digest', 'G D'], ['Ask Halo', 'G A'], ['Tickets', 'G T'], ['Calendar', 'G C'], ['Team', 'G M'], ['History', 'G Y'], ['Settings', 'G ,']]],
        ['Digest', [['Approve focused update', 'A'], ['Hold for tomorrow', 'H'], ['Edit', 'E'], ['Approve all routine', 'shift A']]],
        ['Trust mode', [['More control', '['], ['More automation', ']']]]
      ];
      return '<div class="modal-hd"><div class="grow"><h2>Keyboard shortcuts</h2><p>Halo works without a mouse. Press ? anywhere to see this again.</p></div>' + ui.iconBtn('x', 'Close', 'close') + '</div>' +
        '<div class="modal-bd"><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px 32px">' + groups.map(function (g) {
          return '<div><div class="eyebrow" style="margin-bottom:8px">' + g[0] + '</div>' + g[1].map(function (r) {
            return '<div class="row" style="height:34px;border-bottom:1px solid var(--hairline)"><span class="t-callout grow">' + esc(r[0]) + '</span><span class="row gap-1">' + ui.kbd(r[1]) + '</span></div>';
          }).join('') + '</div>';
        }).join('') + '</div></div>';
    }
  };

  O.trust = {
    kind: 'modal', size: 'wide', title: 'Trust modes',
    render: function () {
      var mode = q.mode(), counts = { curated: 12, balanced: 4, ambient: 0 };
      var rows = {
        curated: ['Nothing is shared until you approve it', 'Every update waits in your digest', 'Best when you’re new to Halo or on a sensitive project'],
        balanced: ['Routine updates share themselves', 'Estimates, blockers and anything about people waits for you', 'The default. Most people stay here'],
        ambient: ['Halo shares as it goes, with sources on every update', 'A live activity log lets you correct anything after the fact', 'Private topics are dropped automatically']
      };
      return '<div class="modal-hd"><div class="grow"><h2>One dial, three levels of trust</h2><p>You decide how much Halo can share without asking. Change it any time with [ and ].</p></div>' + ui.iconBtn('x', 'Close', 'close') + '</div>' +
        '<div class="modal-bd"><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">' + MODES.map(function (m, i) {
          var on = m.v === mode;
          return '<div class="card" style="padding:18px;' + (on ? 'box-shadow:0 0 0 1.5px var(--text)' : '') + '">' +
            shell.dial(i, 56) +
            '<div class="row gap-2 mt-4"><h3 class="t-title-3">' + m.label + '</h3>' + (on ? ui.badge('Current', 'solid') : '') + '</div>' +
            '<div class="t-callout c-3 mt-1">' + (counts[m.v] ? counts[m.v] + ' of today’s 12 updates would wait for you' : 'None of today’s updates would wait for you') + '</div>' +
            '<ul class="mt-4 col gap-2">' + rows[m.v].map(function (r) { return '<li class="row gap-2 t-callout" style="align-items:flex-start">' + H.icon('check', 14, 'c-3') + '<span>' + esc(r) + '</span></li>'; }).join('') + '</ul>' +
            '<div class="mt-5">' + (on ? ui.btn('In use', { block: true, disabled: true }) : ui.btn('Use ' + m.label, { block: true, kind: 'primary', action: 'trust-pick', attrs: { 'data-v': m.v } })) + '</div></div>';
        }).join('') + '</div>' +
        '<div class="banner mt-5">' + H.icon('lock', 16) + '<span>Whatever the mode, your private topics are never shared, and every update shows the sources it came from.</span></div></div>';
    },
    actions: { 'trust-pick': function (el) { H.act.setMode(el.dataset.v); } }
  };
  // Dial illustration: ring with the Signal segment sweeping further as automation grows.
  shell.dial = function (level, size) {
    size = size || 48; var sweep = [45, 150, 270][level], r = 20, c = 2 * Math.PI * r;
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="' + r + '" fill="none" stroke="var(--surface-3)" stroke-width="5"/>' +
      '<circle cx="24" cy="24" r="' + r + '" fill="none" stroke="var(--accent)" stroke-width="5" stroke-dasharray="' + (c * sweep / 360).toFixed(1) + ' ' + c.toFixed(1) + '" transform="rotate(-90 24 24)"/></svg>';
  };

  O.whatsnew = {
    kind: 'modal', title: 'What’s new',
    render: function () {
      var items = [
        ['1.4', 'Estimates that learn your pace', 'Three-point estimates now adjust to how long your finished work actually took, and warn you before a week overflows.'],
        ['1.3', 'Meeting recaps become tickets', 'When a meeting ends, Halo drafts the ticket and subtasks, estimated and ready to assign.'],
        ['1.2', 'Voice fingerprint', 'See exactly what your voice model learned, and export or delete it any time.'],
        ['1.1', 'Ambient mode', 'Let Halo share as it goes, with a live activity log you can correct.']
      ];
      return '<div class="modal-hd"><div class="grow"><h2>What’s new in Halo</h2><p>Recent releases, newest first.</p></div>' + ui.iconBtn('x', 'Close', 'close') + '</div>' +
        '<div class="modal-bd col gap-5">' + items.map(function (it) {
          return '<div class="row gap-4" style="align-items:flex-start"><span class="badge badge-mono">v' + it[0] + '</span><div><div class="t-title-3" style="font-size:15px">' + esc(it[1]) + '</div><p class="t-callout c-3 mt-1">' + esc(it[2]) + '</p></div></div>';
        }).join('') + '</div>';
    }
  };

  O.help = {
    kind: 'modal', size: 'wide', title: 'Help center',
    render: function () {
      var faq = [
        ['What does Halo share, and with whom?', 'Only what you’ve approved or what your trust mode allows. Each update is written for one audience (your team, your manager or leadership), and every one lists its sources.'],
        ['Can my manager see everything I do?', 'No. Halo speaks for you, not about you. Managers see your published updates at the level of detail you choose in Voice & privacy. Raw activity is never shown to anyone.'],
        ['What happens to private topics?', 'Anything that matches a private topic is dropped before it reaches a draft. You’ll see a “Redacted” chip so you know Halo held something back.'],
        ['How does Halo learn my voice?', 'From writing samples you opt in, per source. Training stays inside your Halo, and you can export or delete the model any time.'],
        ['Where do estimates come from?', 'Three-point estimates (best case, likely, worst case), adjusted by how your finished work compared to its estimates.']
      ];
      return '<div class="modal-hd"><div class="grow"><h2>Help center</h2><p>Short answers to the questions people ask most.</p></div>' + ui.iconBtn('x', 'Close', 'close') + '</div>' +
        '<div class="modal-bd"><div class="group">' + faq.map(function (f, i) {
          return '<details class="faq"' + (i === 0 ? ' open' : '') + '><summary class="item clickable"><span class="item-title grow">' + esc(f[0]) + '</span>' + H.icon('chevron-down', 16, 'c-3') + '</summary><p class="t-callout c-2" style="padding:0 16px 16px">' + esc(f[1]) + '</p></details>';
        }).join('') + '</div>' +
        '<div class="banner mt-4">' + H.icon('mail', 16) + '<span>Still stuck? Write to <strong>support@myhalo.co</strong>. A person answers within one business day.</span></div></div>';
    }
  };

  O.invite = {
    kind: 'modal', title: 'Invite teammates',
    render: function () {
      return '<div class="modal-hd"><div class="grow"><h2>Invite teammates</h2><p>Halo works best when your whole team has one. Each person controls their own.</p></div>' + ui.iconBtn('x', 'Close', 'close') + '</div>' +
        '<div class="modal-bd col gap-4"><div class="field"><label for="inv">Email addresses</label><input id="inv" class="input" placeholder="name@brightwater.co, name@brightwater.co" autofocus></div>' +
        '<div class="field"><label>Or share a link</label><div class="row gap-2"><input class="input mono" readonly value="myhalo.co/join/brightwater-7fk2"><button type="button" class="btn" data-action="copy" data-text="https://myhalo.co/join/brightwater-7fk2">' + H.icon('copy', 16) + 'Copy</button></div><span class="hint">Anyone with a @brightwater.co email can join.</span></div></div>' +
        '<div class="modal-ft">' + ui.btn('Cancel', { action: 'close' }) + ui.btn('Send invites', { kind: 'primary', action: 'invite-send' }) + '</div>';
    },
    actions: { 'invite-send': function () { var v = (document.getElementById('inv') || {}).value || ''; var n = v.split(/[\s,;]+/).filter(function (x) { return /@/.test(x); }).length; ui.close(); ui.toast(n ? 'Invites sent to ' + H.util.plural(n, 'person', 'people') : 'Invite link is ready to share', { icon: 'mail' }); } }
  };
})(window.H = window.H || {});

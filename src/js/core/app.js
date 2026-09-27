/* Router, render loop, event delegation and keyboard shortcuts. */
(function (H) {
  'use strict';
  H.screens = H.screens || {};
  H.actions = H.actions || {};
  H.route = { name: 'home', parts: [], path: '#/home' };

  H.parseRoute = function (hash) {
    var h = String(hash || '').replace(/^#\/?/, ''), q = '';
    var qi = h.indexOf('?'); if (qi >= 0) { q = h.slice(qi + 1); h = h.slice(0, qi); }
    var parts = h.split('/').filter(Boolean).map(decodeURIComponent);
    var query = {}; q.split('&').forEach(function (kv) { if (!kv) return; var p = kv.split('='); query[p[0]] = decodeURIComponent(p[1] || ''); });
    return { name: parts[0] || 'home', parts: parts.slice(1), query: query, path: '#/' + parts.join('/') };
  };
  H.go = function (path, replace) {
    if (location.hash === path) { H.route = H.parseRoute(path); H.render(); return; }
    if (replace && history.replaceState) { history.replaceState(null, '', path); onRoute(); } else location.hash = path;
  };
  H.back = function (fallback) { if (history.length > 1 && H._navCount > 1) history.back(); else H.go(fallback || '#/home'); };
  H._navCount = 0;

  function guard(r) {
    var s = H.store.state;
    if (!s.session.onboarded && !(H.screens[r.name] && H.screens[r.name].public)) return H.parseRoute(s.session.welcomeSeen ? '#/onboarding' : '#/welcome');
    if (!H.screens[r.name]) return { name: 'notfound', parts: [], query: {}, path: r.path };
    return r;
  }
  function onRoute() {
    H._navCount++;
    var prev = H.route;
    H.route = guard(H.parseRoute(location.hash || '#/home'));
    H.ui.closeMenu(); H.ui.hideTip();
    if (H.view.overlay && !H.view.overlay.sticky) H.view.overlay = null;
    if (H.view.drawer) H.view.drawer = false;
    var scr = H.screens[prev.name];
    if (scr && scr.leave && prev.name !== H.route.name) scr.leave();
    H.render();
    var c = document.getElementById('content'); if (c && (prev.name !== H.route.name || prev.parts[0] !== H.route.parts[0])) c.scrollTop = 0;
    if (H.route.name !== 'welcome' && H.route.name !== 'onboarding' && H.store.state.session.onboarded) { H.store.state.session.lastRoute = H.route.path; H.store.save(); }
  }
  window.addEventListener('hashchange', onRoute);

  /* ---------- Render loop ---------- */
  var queued = false;
  H.render = function () {
    if (queued) return; queued = true;
    requestAnimationFrame(function () { queued = false; paint(); });
  };
  H.renderNow = function () { queued = false; paint(); };
  function applyPrefs() {
    var p = H.store.state.prefs, de = document.documentElement;
    if (p.theme === 'light' || p.theme === 'dark') de.setAttribute('data-theme', p.theme); else de.removeAttribute('data-theme');
    if (p.motion === 'reduce') de.setAttribute('data-motion', 'reduce'); else de.removeAttribute('data-motion');
  }
  H.isDark = function () {
    var de = document.documentElement, t = de.getAttribute('data-theme');
    return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  };
  function paint() {
    applyPrefs();
    var r = H.route = guard(H.route), scr = H.screens[r.name] || H.screens.notfound;
    var root = document.getElementById('root'), html;
    try {
      html = (scr.fullscreen || !H.store.state.session.onboarded)
        ? '<div class="fs fs-' + r.name + '" data-key="fs-' + r.name + '">' + scr.render(r) + '</div>'
        : H.shell.render(r, scr);
    } catch (err) {
      console.error(err);
      html = '<div class="fs" data-key="crash"><div class="empty" style="min-height:100vh;justify-content:center">' +
        '<div class="empty-art">' + H.icon('alert', 28) + '</div><h3>Something went wrong on this screen</h3><p>Your workspace is safe. Try going back home.</p>' +
        '<div class="mt-4"><a class="btn btn-primary" href="#/home">Go to Home</a></div></div></div>';
    }
    H.morph(root, html);
    H.morph(document.getElementById('overlay'), H.ui.renderOverlay() + (H.view.palette && H.shell ? H.shell.renderPalette() : '') + (H.tour && H.tour.render ? H.tour.render() : ''));
    document.title = (scr.docTitle ? scr.docTitle(r) : scr.title ? scr.title + ' · Halo' : 'Halo');
    if (scr.after) { try { scr.after(root, r); } catch (e) { console.error(e); } }
    if (H.view.overlay) { var od = H.overlays[H.view.overlay.name]; if (od && od.after) od.after(document.getElementById('overlay'), H.view.overlay.params); }
  }

  /* ---------- Event delegation ---------- */
  function handlers() {
    var list = [], o = H.view.overlay;
    if (o && H.overlays[o.name] && H.overlays[o.name].actions) list.push(H.overlays[o.name].actions);
    var scr = H.screens[H.route.name]; if (scr && scr.actions) list.push(scr.actions);
    list.push(H.actions);
    return list;
  }
  H.dispatch = function (name, el, e) {
    var hs = handlers();
    for (var i = 0; i < hs.length; i++) if (hs[i][name]) { hs[i][name](el, e, el ? el.dataset : {}); return true; }
    console.warn('No handler for action', name); return false;
  };
  document.addEventListener('click', function (e) {
    var inMenu = e.target.closest('.popover');
    var el = e.target.closest('[data-action]'), nav = e.target.closest('[data-nav]');
    if (H.ui.menuOpen() && !inMenu) {
      // clicking the element that opened it toggles; anything else just closes
      H.ui.closeMenu();
      if (el && el.getAttribute('aria-haspopup')) { e.preventDefault(); return; }
    }
    if (el && nav && el !== nav && el.contains(nav)) el = null;   // the deeper target wins
    if (el) {
      if (el.tagName === 'A') e.preventDefault();
      if (el.disabled) return;
      H.dispatch(el.getAttribute('data-action'), el, e);
      if (inMenu) H.ui.closeMenu();
      return;
    }
    if (nav) { e.preventDefault(); if (inMenu) H.ui.closeMenu(); H.go(nav.getAttribute('data-nav')); }
  });
  document.addEventListener('input', function (e) { var el = e.target.closest('[data-input]'); if (el) H.dispatch(el.getAttribute('data-input'), el, e); });
  document.addEventListener('change', function (e) { var el = e.target.closest('[data-change]'); if (el) H.dispatch(el.getAttribute('data-change'), el, e); });
  document.addEventListener('submit', function (e) { var f = e.target.closest('[data-submit]'); if (f) { e.preventDefault(); H.dispatch(f.getAttribute('data-submit'), f, e); } });

  /* ---------- Keyboard ---------- */
  var chord = null, chordTimer = null;
  var GO = { h: '#/home', d: '#/digest', a: '#/ask', t: '#/tickets', c: '#/calendar', m: '#/team', y: '#/history', s: '#/sources', p: '#/privacy', ',': '#/settings' };
  document.addEventListener('keydown', function (e) {
    var k = e.key, mod = e.metaKey || e.ctrlKey;
    if (k === 'Escape') {
      if (H.ui.menuOpen()) { H.ui.closeMenu(); e.preventDefault(); return; }
      if (H.view.palette) { H.shell.closePalette(); e.preventDefault(); return; }
      if (H.view.overlay) { H.ui.close(); e.preventDefault(); return; }
      if (H.view.drawer) { H.view.drawer = false; H.render(); return; }
    }
    // Enter-to-submit on inputs that ask for it
    if (k === 'Enter' && !e.shiftKey && e.target.getAttribute && e.target.getAttribute('data-enter') && !e.isComposing) {
      e.preventDefault(); H.dispatch(e.target.getAttribute('data-enter'), e.target, e); return;
    }
    if (k === 'Enter' && mod && e.target.getAttribute && e.target.getAttribute('data-mod-enter')) { e.preventDefault(); H.dispatch(e.target.getAttribute('data-mod-enter'), e.target, e); return; }
    if (!H.store.state.session.onboarded) {
      var pub = H.screens[H.route.name];
      if (pub && pub.keys && pub.keys[k] && !H.util.isTyping(e) && !H.view.overlay && !mod) { e.preventDefault(); pub.keys[k](e); }
      return;
    }
    if (mod && (k === 'k' || k === 'K')) { e.preventDefault(); H.view.palette ? H.shell.closePalette() : H.shell.openPalette(); return; }
    if (H.util.isTyping(e) || mod || e.altKey) return;
    if (H.view.overlay || H.view.palette) return;
    if (chord === 'g') { clearTimeout(chordTimer); chord = null; if (GO[k.toLowerCase()]) { e.preventDefault(); H.go(GO[k.toLowerCase()]); } return; }
    if (k === 'g') { chord = 'g'; chordTimer = setTimeout(function () { chord = null; }, 900); return; }
    if (k === '/') { e.preventDefault(); H.shell.openPalette(); return; }
    if (k === 'n' || k === 'N') { e.preventDefault(); H.ui.open('quickadd', {}); return; }
    if (k === '?') { e.preventDefault(); H.ui.open('shortcuts'); return; }
    if (k === '[') { e.preventDefault(); var order = ['curated', 'balanced', 'ambient'], i = order.indexOf(H.q.mode()); if (i > 0) H.act.setMode(order[i - 1]); return; }
    if (k === ']') { e.preventDefault(); var ord = ['curated', 'balanced', 'ambient'], j = ord.indexOf(H.q.mode()); if (j < 2) H.act.setMode(ord[j + 1]); return; }
    var scr = H.screens[H.route.name]; if (scr && scr.keys && scr.keys[k]) { e.preventDefault(); scr.keys[k](e); }
  });

  // Focus trap inside open dialogs
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab' || !H.view.overlay) return;
    var root = document.querySelector('#overlay [role="dialog"]'); if (!root) return;
    var f = Array.prototype.filter.call(root.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'), function (x) { return !x.disabled && x.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  if (window.matchMedia) {
    try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { H.render(); }); } catch (e) { /* old browsers */ }
  }

  H.boot = function () {
    H.store.load();
    var s = H.store.state;
    if (/[?&]skip-onboarding\b/.test(location.search)) { s.session.onboarded = true; s.session.welcomeSeen = true; s.session.tourDone = true; }
    var th = /[?&]theme=(light|dark)/.exec(location.search); if (th) s.prefs.theme = th[1];
    var start = location.hash || (s.session.onboarded ? (s.session.lastRoute || '#/home') : '#/welcome');
    H.route = guard(H.parseRoute(start));
    if (location.hash !== H.route.path && history.replaceState) history.replaceState(null, '', H.route.path);
    H.renderNow();
    document.documentElement.classList.add('is-ready');
    if (H.ai && H.ai.init) H.ai.init();
  };
})(window.H = window.H || {});

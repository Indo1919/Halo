/* UI kit: markup helpers + overlay, menu, tooltip and toast managers. */
(function (H) {
  'use strict';
  var esc = H.esc, ui = H.ui = {};
  H.view = { overlay: null, menu: null, palette: null };   // ephemeral, never persisted
  H.overlays = {};

  function attrs(o) {
    if (!o) return '';
    return Object.keys(o).map(function (k) { var v = o[k]; if (v === false || v == null) return ''; return v === true ? ' ' + k : ' ' + k + '="' + esc(v) + '"'; }).join('');
  }
  ui.attrs = attrs;

  ui.btn = function (label, o) {
    o = o || {};
    var c = 'btn' + (o.kind ? ' btn-' + o.kind : '') + (o.size ? ' btn-' + o.size : '') + (o.block ? ' btn-block' : '') + (!label ? ' btn-icon' : '') + (o.cls ? ' ' + o.cls : '');
    var a = Object.assign({ type: 'button', class: c, 'data-action': o.action, 'data-tip': o.tip, 'aria-label': !label ? (o.tip || o.icon) : null, disabled: o.disabled }, o.attrs || {});
    return '<button' + attrs(a) + '>' + (o.icon ? H.icon(o.icon, o.iconSize || (o.size === 'lg' || o.size === 'xl' ? 18 : 16)) : '') + (label ? '<span>' + esc(label) + '</span>' : '') + (o.kbd ? '<span class="kbd">' + esc(o.kbd) + '</span>' : '') + (o.trail || '') + '</button>';
  };
  ui.iconBtn = function (icon, tip, action, o) {
    o = o || {};
    return '<button' + attrs(Object.assign({ type: 'button', class: 'icon-btn' + (o.size ? ' ' + o.size : '') + (o.cls ? ' ' + o.cls : ''), 'data-action': action, 'data-tip': tip, 'aria-label': tip, 'aria-pressed': o.pressed }, o.attrs || {})) + '>' + H.icon(icon, o.iconSize || 18) + (o.extra || '') + '</button>';
  };
  ui.kbd = function (keys) { return String(keys).split(' ').map(function (k) { return '<span class="kbd">' + esc(k) + '</span>'; }).join(''); };

  var HUES = ['#2F6FDB', '#1F8A70', '#C2410C', '#7C3AED', '#B45309', '#0E7490', '#BE185D', '#4D7C0F', '#6D28D9', '#0369A1'];
  ui.hue = function (id) { return HUES[H.util.hash(String(id)) % HUES.length]; };
  ui.avatar = function (p, size, o) {
    o = o || {}; if (!p) return '';
    return '<span class="avatar' + (size ? ' ' + size : '') + '" style="--hue:' + (p.hue || ui.hue(p.id)) + '"' + (o.tip === false ? '' : ' data-tip="' + esc(p.name) + '"') + ' role="img" aria-label="' + esc(p.name) + '">' + esc(H.util.initials(p.name)) + (o.presence ? '<span class="presence"></span>' : '') + '</span>';
  };
  ui.avatarStack = function (people, size, max) {
    max = max || 4; var shown = people.slice(0, max), more = people.length - shown.length;
    return '<span class="avatar-stack">' + shown.map(function (p) { return ui.avatar(p, size); }).join('') + (more > 0 ? '<span class="avatar avatar-more ' + (size || '') + '">+' + more + '</span>' : '') + '</span>';
  };
  var PRIO = { urgent: 'Urgent', high: 'High', medium: 'Medium', low: 'Low' };
  ui.prio = function (p) { return '<span class="prio prio-' + p + '" data-tip="' + (PRIO[p] || p) + ' priority" role="img" aria-label="' + (PRIO[p] || p) + ' priority"></span>'; };
  ui.prioLabel = function (p) { return PRIO[p] || p; };
  var STATUS = { todo: 'To do', progress: 'In progress', review: 'In review', done: 'Done', blocked: 'Blocked' };
  ui.statusLabel = function (s) { return STATUS[s] || s; };
  ui.status = function (s, tip) { return '<span class="status status-' + s + '"' + (tip === false ? '' : ' data-tip="' + STATUS[s] + '"') + ' role="img" aria-label="' + STATUS[s] + '"></span>'; };
  ui.badge = function (text, kind, icon, o) { o = o || {}; return '<span class="badge' + (kind ? ' badge-' + kind : '') + (o.cls ? ' ' + o.cls : '') + '"' + (o.tip ? ' data-tip="' + esc(o.tip) + '"' : '') + '>' + (icon ? H.icon(icon, 12) : '') + esc(text) + '</span>'; };
  ui.src = function (sid, label, o) {
    o = o || {}; var b = H.brands[sid]; label = label || (b ? b.name : sid);
    var tag = o.action ? 'button' : 'span';
    return '<' + tag + ' class="src"' + (o.action ? ' type="button" data-action="' + o.action + '"' + attrs(o.attrs) : '') + (o.tip ? ' data-tip="' + esc(o.tip) + '"' : '') + '>' + H.brandMark(sid, 14) + '<span class="truncate">' + esc(label) + '</span></' + tag + '>';
  };
  ui.seg = function (name, options, value, o) {
    o = o || {};
    return '<div class="seg' + (o.size ? ' seg-' + o.size : '') + (o.block ? ' seg-block' : '') + '" role="group" aria-label="' + esc(o.label || name) + '">' + options.map(function (op) {
      return '<button type="button" class="seg-item" aria-pressed="' + (op.v === value) + '" data-action="' + (o.action || 'seg') + '" data-name="' + esc(name) + '" data-v="' + esc(op.v) + '"' + (op.tip ? ' data-tip="' + esc(op.tip) + '"' : '') + '>' + (op.icon ? H.icon(op.icon, 14) : '') + (op.label ? '<span>' + esc(op.label) + '</span>' : '') + (op.count != null ? '<span class="key" style="margin-left:2px">' + op.count + '</span>' : '') + '</button>';
    }).join('') + '</div>';
  };
  ui.switch = function (on, action, a) {
    return '<button' + attrs(Object.assign({ type: 'button', role: 'switch', class: 'switch', 'aria-checked': String(!!on), 'data-action': action }, a || {})) + '></button>';
  };
  ui.check = function (on, action, a, cls) {
    return '<button' + attrs(Object.assign({ type: 'button', role: 'checkbox', class: 'check' + (cls ? ' ' + cls : ''), 'aria-checked': String(!!on), 'data-action': action }, a || {})) + '>' + H.icon('check', 12) + '</button>';
  };
  ui.ring = function (v, size, stroke, color, track) {
    size = size || 40; stroke = stroke || 4; var r = (size - stroke) / 2, c = 2 * Math.PI * r, off = c * (1 - H.util.clamp(v, 0, 1));
    return '<svg class="ring-svg" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" aria-hidden="true"><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" stroke="' + (track || 'var(--surface-3)') + '" stroke-width="' + stroke + '"/><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" stroke="' + (color || 'var(--text)') + '" stroke-width="' + stroke + '" stroke-dasharray="' + c.toFixed(2) + '" stroke-dashoffset="' + off.toFixed(2) + '"/></svg>';
  };
  ui.bar = function (v, cls) { return '<div class="bar' + (cls ? ' ' + cls : '') + '" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(v * 100) + '"><span style="width:' + (H.util.clamp(v, 0, 1) * 100).toFixed(1) + '%"></span></div>'; };
  ui.empty = function (icon, title, body, action) {
    return '<div class="empty"><div class="empty-art">' + H.icon(icon, 28) + '</div><h3>' + esc(title) + '</h3>' + (body ? '<p>' + esc(body) + '</p>' : '') + (action ? '<div class="mt-4">' + action + '</div>' : '') + '</div>';
  };
  ui.mark = function (size, dark) {
    // The Halo mark (ring + Signal segment), geometry matches brand/logo/mark.
    size = size || 20;
    return '<svg width="' + size + '" height="' + size + '" viewBox="7.5 7.5 85 85" aria-hidden="true"><path fill="' + (dark ? '#F7F7F5' : 'currentColor') + '" d="M92.426 52.5A42.5 42.5 0 1 1 47.5 7.574L47.5 18.599A31.5 31.5 0 1 0 81.401 52.5Z"/><path fill="#FF4405" d="M52.5 7.574A42.5 42.5 0 0 1 92.426 47.5L81.401 47.5A31.5 31.5 0 0 0 52.5 18.599Z"/></svg>';
  };
  ui.wordmark = function (h) {
    return '<span class="wordmark" style="display:inline-flex;align-items:center;gap:' + Math.round(h * 0.3) + 'px;font:600 ' + Math.round(h * 0.92) + 'px/1 var(--font-sans);letter-spacing:-0.03em">' + ui.mark(h) + 'Halo</span>';
  };

  /* ---------- Overlays (modal / sheet) ---------- */
  var lastFocus = null;
  ui.open = function (name, params) {
    if (!H.overlays[name]) { console.warn('Unknown overlay', name); return; }
    ui.closeMenu(); lastFocus = document.activeElement;
    H.view.overlay = { name: name, params: params || {} };
    H.render();
    requestAnimationFrame(function () {
      var root = document.getElementById('overlay'); if (!root) return;
      var def = H.overlays[name]; if (def.onOpen) def.onOpen(root, params || {});
      var f = root.querySelector('[autofocus]') || root.querySelector('input, textarea, select, button:not(.icon-btn)');
      if (f) f.focus({ preventScroll: true });
    });
  };
  ui.close = function (instant) {
    if (!H.view.overlay) return;
    var root = document.getElementById('overlay');
    var done = function () { H.view.overlay = null; H.render(); if (lastFocus && document.contains(lastFocus)) { try { lastFocus.focus({ preventScroll: true }); } catch (e) { /* ignore */ } } };
    if (instant || !root || !root.firstElementChild) return done();
    Array.prototype.forEach.call(root.children, function (c) { c.classList.add('is-closing'); });
    setTimeout(done, 130);
  };
  ui.renderOverlay = function () {
    var o = H.view.overlay; if (!o) return '';
    var def = H.overlays[o.name]; if (!def) return '';
    var kind = def.kind || 'modal', size = typeof def.size === 'function' ? def.size(o.params) : def.size;
    return '<div class="scrim" data-action="overlay-close" data-key="scrim"></div><div class="' + kind + (size ? ' ' + size : '') + '" role="dialog" aria-modal="true" aria-label="' + esc(def.title || o.name) + '" data-key="ov-' + o.name + '">' + def.render(o.params) + '</div>';
  };

  /* ---------- Menus / popovers ---------- */
  var menuEl = null, menuAnchor = null;
  ui.menu = function (anchor, items, o) {
    o = o || {};
    if (menuEl && menuAnchor === anchor) { ui.closeMenu(); return; }
    ui.closeMenu(); hideTip();
    menuAnchor = anchor;
    menuEl = document.createElement('div'); menuEl.className = 'popover'; menuEl.setAttribute('role', 'menu');
    if (o.width) menuEl.style.minWidth = o.width + 'px';
    menuEl.innerHTML = o.html || items.map(function (it) {
      if (it.sep) return '<div class="menu-sep"></div>';
      if (it.label && !it.action && !it.nav) return '<div class="menu-label">' + esc(it.label) + '</div>';
      var a = Object.assign({ type: 'button', role: it.checked != null ? 'menuitemradio' : 'menuitem', class: 'menu-item' + (it.danger ? ' danger' : ''), 'data-action': it.action, 'data-nav': it.nav, 'aria-checked': it.checked != null ? String(!!it.checked) : null }, it.attrs || {});
      return '<button' + attrs(a) + '>' + (it.icon ? H.icon(it.icon, 16) : (it.lead || '')) + '<span class="truncate">' + esc(it.text) + '</span>' + (it.kbd ? '<span class="trail">' + ui.kbd(it.kbd) + '</span>' : '') + (it.hint ? '<span class="trail">' + esc(it.hint) + '</span>' : '') + (it.checked != null ? '<span class="check-mark">' + H.icon('check', 14) + '</span>' : '') + '</button>';
    }).join('');
    document.body.appendChild(menuEl);
    place(menuEl, anchor, o.align || 'start', o.side || 'bottom');
    var first = menuEl.querySelector('.menu-item'); if (first && o.focus !== false) first.focus({ preventScroll: true });
    menuEl.addEventListener('keydown', function (e) {
      var items = Array.prototype.slice.call(menuEl.querySelectorAll('.menu-item')), i = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); (items[i + 1] || items[0]).focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); (items[i - 1] || items[items.length - 1]).focus(); }
      if (e.key === 'Tab') { ui.closeMenu(); }
    });
    return menuEl;
  };
  ui.closeMenu = function () { if (menuEl) { menuEl.remove(); menuEl = null; if (menuAnchor && document.contains(menuAnchor) && document.activeElement === document.body) { try { menuAnchor.focus({ preventScroll: true }); } catch (e) { /* ignore */ } } menuAnchor = null; } };
  ui.menuOpen = function () { return !!menuEl; };
  function place(el, anchor, align, side) {
    var r = anchor.getBoundingClientRect(), w = el.offsetWidth, h = el.offsetHeight, vw = window.innerWidth, vh = window.innerHeight, pad = 8;
    var top = side === 'top' ? r.top - h - 6 : r.bottom + 6;
    if (side !== 'top' && top + h > vh - pad) top = Math.max(pad, r.top - h - 6);
    var left = align === 'end' ? r.right - w : r.left;
    left = Math.max(pad, Math.min(left, vw - w - pad));
    el.style.top = Math.round(top) + 'px'; el.style.left = Math.round(left) + 'px';
    el.style.setProperty('--origin', (align === 'end' ? 'top right' : 'top left'));
  }
  ui.place = place;

  /* ---------- Tooltips ---------- */
  var tipEl = null, tipTimer = null, tipFor = null;
  function hideTip() { clearTimeout(tipTimer); tipFor = null; if (tipEl) { tipEl.remove(); tipEl = null; } }
  function showTip(t) {
    var text = t.getAttribute('data-tip'); if (!text || menuEl) return;
    tipEl = document.createElement('div'); tipEl.className = 'tooltip'; tipEl.setAttribute('role', 'tooltip');
    tipEl.innerHTML = esc(text) + (t.getAttribute('data-kbd') ? ui.kbd(t.getAttribute('data-kbd')) : '');
    document.body.appendChild(tipEl);
    var r = t.getBoundingClientRect(), w = tipEl.offsetWidth, h = tipEl.offsetHeight;
    var top = r.top - h - 8; if (top < 6) top = r.bottom + 8;
    var left = Math.max(6, Math.min(r.left + r.width / 2 - w / 2, window.innerWidth - w - 6));
    tipEl.style.top = top + 'px'; tipEl.style.left = left + 'px';
  }
  document.addEventListener('mouseover', function (e) {
    var t = e.target.closest ? e.target.closest('[data-tip]') : null;
    if (t === tipFor) return; hideTip(); if (!t || matchMedia('(hover: none)').matches) return;
    tipFor = t; tipTimer = setTimeout(function () { if (tipFor === t && document.contains(t)) showTip(t); }, 420);
  });
  document.addEventListener('mousedown', hideTip, true);
  document.addEventListener('scroll', hideTip, true);
  ui.hideTip = hideTip;

  /* ---------- Toasts ---------- */
  var toastRoot = null;
  ui.toast = function (msg, o) {
    o = o || {};
    if (!toastRoot) { toastRoot = document.createElement('div'); toastRoot.className = 'toasts'; toastRoot.setAttribute('role', 'status'); toastRoot.setAttribute('aria-live', 'polite'); document.body.appendChild(toastRoot); }
    var t = document.createElement('div'); t.className = 'toast';
    t.innerHTML = H.icon(o.icon || 'check-circle', 16, o.icon === 'alert' ? '' : 'ok') + '<span>' + esc(msg) + '</span>' + (o.undo || o.action ? '<button type="button">' + esc(o.actionLabel || 'Undo') + '</button>' : '');
    toastRoot.appendChild(t);
    while (toastRoot.children.length > 3) toastRoot.firstChild.remove();
    var gone = false, kill = function () { if (gone) return; gone = true; t.classList.add('out'); setTimeout(function () { t.remove(); }, 220); };
    var b = t.querySelector('button'); if (b) b.addEventListener('click', function () { kill(); (o.undo || o.action)(); });
    setTimeout(kill, o.duration || (o.undo ? 6000 : 3200));
  };
})(window.H = window.H || {});

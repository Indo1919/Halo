/* Tickets — everything you own (or your team is on), as a grouped list or a board.
   '#/tickets/:key' is delegated to the detail view in ticket.js (H.ticketDetail). */
(function (H) {
  'use strict';
  var esc = H.esc, ui = H.ui, q = H.q, F = H.fmt, U = H.util;
  var STATUSES = ['todo', 'progress', 'review', 'blocked', 'done'];
  var GROUPS = ['progress', 'review', 'blocked', 'todo', 'done'];   // list order
  var COLUMNS = ['todo', 'progress', 'review', 'done'];             // board: blocked cards live in In progress
  var PRIOS = ['urgent', 'high', 'medium', 'low'];
  var RANK = { urgent: 0, high: 1, medium: 2, low: 3 };
  var SORTS = [{ v: 'due', label: 'Due date', icon: 'calendar' }, { v: 'prio', label: 'Priority', icon: 'flag' }, { v: 'created', label: 'Recently created', icon: 'clock' }];
  var view = { projects: [], prios: [], sort: 'due', search: '', collapsed: { done: true } };
  var drag = null;

  /* ---------- Shared helpers (ticket.js uses these too) ---------- */
  var X = H.tix = {};
  X.STATUSES = STATUSES;
  X.find = function (s, key) { for (var i = 0; i < s.tickets.length; i++) if (s.tickets[i].key === key) return s.tickets[i]; return null; };
  X.url = function (key) { return String(location.href).split('#')[0] + '#/tickets/' + key; };
  X.copyLink = function (key) { U.copy(X.url(key)).then(function () { ui.toast('Link to ' + key + ' copied', { icon: 'link' }); }); };
  X.left = function (t) { return t.status === 'done' ? 0 : q.remaining(t) * q.pace(); };
  X.subs = function (t) { var s = t.subtasks || []; return { done: s.filter(function (x) { return x.done; }).length, total: s.length }; };
  X.due = function (t) {
    if (t.due == null) return { text: 'No date', cls: 'c-3', tip: 'No due date', state: 'none' };
    var d = H.at(t.due), n = U.dayDiff(d, H.now()), open = t.status !== 'done';
    var state = !open ? 'done' : t.due < 0 ? 'overdue' : n <= 1 ? 'soon' : 'later';
    return { text: F.day(d), date: d, state: state,
      cls: state === 'overdue' ? 'c-danger' : state === 'soon' ? 'c-accent' : state === 'done' ? 'c-3' : 'c-2',
      tip: (state === 'overdue' ? 'Overdue. It was due ' : 'Due ') + F.dateLong(d) + ' at ' + F.time(d) };
  };
  X.statusItems = function (t, action) {
    return [{ label: 'Set status' }].concat(STATUSES.map(function (s) {
      return { lead: '<span class="menu-lead">' + ui.status(s, false) + '</span>', text: ui.statusLabel(s), action: action || 'tk-set-status', attrs: { 'data-tk': t.key, 'data-v': s, role: 'menuitemradio' }, checked: t.status === s };
    }));
  };
  // Activity entries live on the ticket, so they survive reloads and Undo restores them with everything else.
  X.log = function (x, entry) { x.activity = (x.activity || []).concat([Object.assign({ id: U.uid('ac'), t: 0, who: H.store.state.me }, entry)]); };

  /* ---------- Actions added to H.act ---------- */
  H.act.setTicketStatus = function (key, status, o) {
    o = o || {};
    var t = q.ticket(key); if (!t || t.status === status) return false;
    var snap = H.store.snapshot(), from = t.status;
    H.store.commit(function (s) {
      var x = X.find(s, key); if (!x) return;
      x.status = status; if (status === 'done') x.done = 0;
      X.log(x, { kind: 'status', from: from, to: status });
    });
    var undo = function () { H.store.restore(snap); };
    if (status === 'done') { H.chime(); ui.toast('Done. Halo will share this with your team.', { undo: undo }); }
    else if (!o.quiet) ui.toast(key + ' moved to ' + ui.statusLabel(status), { icon: 'ticket', undo: undo });
    return true;
  };
  // Patch a ticket, log what changed, toast with Undo.
  H.act.editTicket = function (key, patch, entry, toast) {
    var snap = H.store.snapshot();
    H.store.commit(function (s) { var x = X.find(s, key); if (!x) return; Object.assign(x, patch); if (entry) X.log(x, entry); });
    if (toast) ui.toast(toast, { icon: 'ticket', undo: function () { H.store.restore(snap); } });
  };
  H.act.deleteTicket = function (key) {
    var snap = H.store.snapshot();
    H.store.commit(function (s) {
      s.tickets = s.tickets.filter(function (t) { return t.key !== key; });
      s.events = s.events.filter(function (e) { return !(e.kind === 'focus' && e.ticket === key); });
      if (s.recaps && s.recaps.kickoff && s.recaps.kickoff.created === key) s.recaps.kickoff.created = null;
    });
    return snap;
  };
  H.act.commentTicket = function (key, text) {
    H.store.commit(function (s) { var x = X.find(s, key); if (x) X.log(x, { kind: 'comment', text: text }); });
  };

  /* ---------- Data ---------- */
  function scope() { return H.store.state.prefs.ticketsScope || 'mine'; }
  function inScope(t) { var me = H.store.state.me, sc = scope(); return sc === 'mine' ? t.owner === me : sc === 'team' ? t.owner !== me : true; }
  function matches(t) {
    if (view.projects.length && view.projects.indexOf(t.project) < 0) return false;
    if (view.prios.length && view.prios.indexOf(t.prio) < 0) return false;
    var words = view.search.trim().toLowerCase().split(/\s+/).filter(Boolean), hay = (t.key + ' ' + t.title).toLowerCase();
    return words.every(function (w) { return hay.indexOf(w) >= 0; });
  }
  function sorter() {
    var due = function (t) { return t.due == null ? 1e9 : t.due; };
    if (view.sort === 'prio') return function (a, b) { return RANK[a.prio] - RANK[b.prio] || due(a) - due(b); };
    if (view.sort === 'created') return function (a, b) { return (b.created || 0) - (a.created || 0); };
    return function (a, b) { return due(a) - due(b) || RANK[a.prio] - RANK[b.prio]; };
  }
  function visible() { return H.store.state.tickets.filter(inScope).filter(matches).sort(sorter()); }
  function filtersOn() { return view.projects.length + view.prios.length + (view.search.trim() ? 1 : 0); }

  /* ---------- Toolbar ---------- */
  function filterBtn(kind, label, icon, n) {
    return ui.btn(label, { size: 'sm', icon: icon, action: 'tk-filter', cls: n ? 'is-on' : '', attrs: { 'data-f': kind, 'aria-haspopup': 'menu' },
      trail: (n ? '<span class="count">' + n + '</span>' : '') + H.icon('chevron-down', 14, 'tl-caret') });
  }
  function toolbar() {
    var s = H.store.state, me = s.me, lay = s.prefs.ticketsView || 'list', sort = SORTS.filter(function (x) { return x.v === view.sort; })[0];
    var open = function (fn) { return s.tickets.filter(function (t) { return t.status !== 'done' && fn(t); }).length; };
    return '<div class="tl-bar">' +
      '<div class="tl-bar-left">' +
        ui.seg('ticketsScope', [
          { v: 'mine', label: 'My tickets', count: open(function (t) { return t.owner === me; }), tip: 'Open tickets you own' },
          { v: 'team', label: 'Team', count: open(function (t) { return t.owner !== me; }), tip: 'Open tickets your teammates own' },
          { v: 'all', label: 'All', count: open(function () { return true; }), tip: 'Every open ticket in Checkout v3, Invoices 2.0 and Harbor' }
        ], scope(), { label: 'Whose tickets' }) +
        ui.seg('ticketsView', [{ v: 'list', label: 'List', icon: 'list' }, { v: 'board', label: 'Board', icon: 'board' }], lay, { label: 'Layout' }) +
      '</div>' +
      '<div class="tl-bar-right">' +
        filterBtn('project', 'Project', 'layers', view.projects.length) +
        filterBtn('prio', 'Priority', 'flag', view.prios.length) +
        ui.btn(sort.label, { size: 'sm', icon: 'sort', action: 'tk-sort', attrs: { 'aria-haspopup': 'menu', 'aria-label': 'Sort by ' + sort.label }, trail: H.icon('chevron-down', 14, 'tl-caret') }) +
        '<div class="input-wrap tl-search">' + H.icon('search', 14) +
          '<input class="input input-sm" type="text" placeholder="Filter by key or title" value="' + esc(view.search) + '" data-input="tk-search" aria-label="Filter tickets by key or title" autocomplete="off" spellcheck="false">' +
          (view.search ? '<button type="button" class="icon-btn xs trail" data-action="tk-search-clear" aria-label="Clear the text filter" data-tip="Clear">' + H.icon('x', 14) + '</button>' : '') +
        '</div>' +
      '</div></div>';
  }
  function chips() {
    var out = [];
    view.projects.forEach(function (p) { out.push(chip('<span class="key">' + p + '</span>' + esc(H.PROJECTS[p].name), 'Project ' + H.PROJECTS[p].name, 'project', p)); });
    view.prios.forEach(function (p) { out.push(chip(ui.prio(p) + esc(ui.prioLabel(p)) + ' priority', ui.prioLabel(p) + ' priority', 'prio', p)); });
    if (view.search.trim()) out.push(chip(H.icon('search', 12) + '“' + esc(view.search.trim()) + '”', 'text filter', 'search', ''));
    if (!out.length) return '';
    return '<div class="tl-chips" aria-label="Active filters">' + out.join('') + (out.length > 1 ? ui.btn('Clear all', { kind: 'ghost', size: 'xs', action: 'tk-clear' }) : '') + '</div>';
  }
  function chip(html, name, f, v) {
    return '<button type="button" class="chip chip-sm tl-chip" data-action="tk-unfilter" data-f="' + f + '" data-v="' + esc(v) + '" aria-label="Remove filter: ' + esc(name) + '">' + html + '<span class="tl-chip-x">' + H.icon('x', 12) + '</span></button>';
  }

  /* ---------- List ---------- */
  function row(t) {
    var me = H.store.state.me, owner = q.person(t.owner), sc = X.subs(t), due = X.due(t), left = X.left(t), open = t.status !== 'done', href = '#/tickets/' + t.key;
    var leftTxt = open && left >= 0.05 ? F.hours(left) + ' left' : '';
    return '<div class="tl-row' + (open ? '' : ' is-done') + '" data-key="tl-' + t.key + '" data-nav="' + href + '">' +
      '<button type="button" class="tl-status" data-action="tk-status" data-tk="' + t.key + '" aria-haspopup="menu" aria-label="Status: ' + ui.statusLabel(t.status) + '. Change status">' + ui.status(t.status, false) + '</button>' +
      '<span class="tl-prio">' + ui.prio(t.prio) + '</span>' +
      '<span class="key tl-key">' + t.key + '</span>' +
      '<span class="tl-main"><a class="tl-title truncate" href="' + href + '" data-nav="' + href + '">' + esc(t.title) + '</a>' +
        '<span class="tl-meta show-phone"><span class="key">' + t.key + '</span><span class="' + due.cls + '">' + due.text + '</span>' + (leftTxt ? '<span>' + leftTxt + '</span>' : '') + '</span>' +
        '<span class="tl-quick">' + (t.owner === me && open ? ui.iconBtn('calendar-plus', 'Book time', 'tk-book', { size: 'sm', iconSize: 16, attrs: { 'data-tk': t.key } }) : '') +
          ui.iconBtn('link', 'Copy link', 'tk-copy', { size: 'sm', iconSize: 16, attrs: { 'data-tk': t.key } }) + '</span></span>' +
      '<span class="tl-subs">' + (sc.total ? '<span class="tl-ring" data-tip="' + sc.done + ' of ' + sc.total + ' subtasks done">' + ui.ring(sc.done / sc.total, 14, 2, sc.done === sc.total ? 'var(--success)' : 'var(--text-2)') + '<span class="num">' + sc.done + '/' + sc.total + '</span></span>' : '') + '</span>' +
      '<span class="tl-left num"' + (leftTxt ? ' data-tip="Remaining estimate, adjusted to your pace"' : '') + '>' + leftTxt + '</span>' +
      '<span class="tl-due ' + due.cls + '" data-tip="' + esc(due.tip) + '">' + due.text + '</span>' +
      '<span class="tl-owner">' + ui.avatar(owner, 'sm') + '</span>' +
    '</div>';
  }
  function group(status, list) {
    var closed = !!view.collapsed[status];
    return '<section class="tl-group" data-key="tg-' + status + '" aria-label="' + ui.statusLabel(status) + '">' +
      '<button type="button" class="tl-group-hd" data-action="tk-collapse" data-s="' + status + '" aria-expanded="' + !closed + '">' +
        H.icon('chevron-down', 14, 'tl-chev') + ui.status(status, false) + '<span>' + ui.statusLabel(status) + '</span><span class="tl-count num">' + list.length + '</span>' +
        (closed ? '<span class="tl-group-hint">Show</span>' : '') + '</button>' +
      (closed ? '' : '<div class="tl-rows">' + list.map(row).join('') + '</div>') +
    '</section>';
  }

  /* ---------- Board ---------- */
  function card(t) {
    var owner = q.person(t.owner), sc = X.subs(t), due = X.due(t), left = X.left(t), blocked = t.status === 'blocked', href = '#/tickets/' + t.key;
    return '<article class="tb-card' + (blocked ? ' is-blocked' : '') + (t.status === 'done' ? ' is-done' : '') + '" draggable="true" data-drag="' + t.key + '" data-key="tbk-' + t.key + '" data-nav="' + href + '">' +
      '<div class="tb-card-top"><span class="key">' + t.key + '</span>' + ui.prio(t.prio) + (blocked ? ui.badge('Blocked', 'danger') : '') +
        '<button type="button" class="tb-card-status" data-action="tk-status" data-tk="' + t.key + '" aria-haspopup="menu" aria-label="Status: ' + ui.statusLabel(t.status) + '. Move to another column" data-tip="Move">' + ui.status(t.status, false) + H.icon('chevron-down', 12) + '</button></div>' +
      '<a class="tb-card-title" href="' + href + '" data-nav="' + href + '" draggable="false">' + esc(t.title) + '</a>' +
      (blocked && t.blocker ? '<p class="tb-blocker">' + H.icon('alert', 12) + '<span>' + esc(t.blocker) + '</span></p>' : '') +
      '<div class="tb-card-prog">' + ui.bar(q.progress(t), 'thin' + (t.status === 'done' ? ' success' : '')) + (sc.total ? '<span class="num" data-tip="Subtasks done">' + sc.done + '/' + sc.total + '</span>' : '') + '</div>' +
      '<div class="tb-card-ft"><span class="' + due.cls + '" data-tip="' + esc(due.tip) + '">' + H.icon('calendar', 12) + due.text + '</span>' +
        (left >= 0.05 ? '<span class="c-3 num">' + F.hours(left) + ' left</span>' : '') + '<span class="tb-card-owner">' + ui.avatar(owner, 'sm') + '</span></div>' +
    '</article>';
  }
  function board(list) {
    return '<div class="tb-board" data-key="tb-board">' + COLUMNS.map(function (s) {
      var items = list.filter(function (t) { return s === 'progress' ? (t.status === 'progress' || t.status === 'blocked') : t.status === s; });
      if (s === 'progress') items.sort(function (a, b) { return (b.status === 'blocked') - (a.status === 'blocked'); });
      var blocked = items.filter(function (t) { return t.status === 'blocked'; }).length;
      return '<section class="tb-col" data-drop="' + s + '" data-key="tbc-' + s + '" aria-label="' + ui.statusLabel(s) + ', ' + U.plural(items.length, 'ticket') + '">' +
        '<div class="tb-col-hd">' + ui.status(s, false) + '<span>' + ui.statusLabel(s) + '</span><span class="tl-count num">' + items.length + '</span>' +
          (blocked ? '<span class="ml-auto">' + ui.badge(blocked + ' blocked', 'danger') + '</span>' : '') + '</div>' +
        '<div class="tb-cards">' + (items.length ? items.map(card).join('') : '<div class="tb-empty">' + (s === 'done' ? 'Finished work lands here' : 'Drag a ticket here') + '</div>') + '</div></section>';
    }).join('') + '</div>';
  }

  /* ---------- Page ---------- */
  function lede() {
    var sc = scope();
    if (sc === 'mine') {
      var mine = q.myTickets().filter(function (t) { return t.status !== 'done'; }), hrs = mine.reduce(function (a, t) { return a + X.left(t); }, 0);
      return U.plural(mine.length, 'open ticket') + ', about ' + F.hours(hrs) + ' of work at your pace. Halo keeps each status current as you work.';
    }
    if (sc === 'team') return 'What your teammates own. Their statuses update as they work, so there’s nothing to chase.';
    return 'Every ticket in Checkout v3, Invoices 2.0 and Harbor.';
  }
  function renderList() {
    var s = H.store.state, lay = s.prefs.ticketsView || 'list', list = visible(), any = s.tickets.filter(inScope).length;
    var html = '<header class="page-hd"><div class="grow"><h1>Tickets</h1><p class="lede">' + esc(lede()) + '</p></div>' +
      '<div class="actions">' + ui.btn('New ticket', { kind: 'primary', icon: 'plus', action: 'tk-new' }) + '</div></header>' + toolbar() + chips();
    if (!list.length) {
      html += '<div class="card tl-empty">' + (any
        ? ui.empty('search', 'No tickets match', 'Nothing in this view fits your filters. Try another project or priority, or clear them.', ui.btn('Clear filters', { action: 'tk-clear' }))
        : ui.empty('ticket', scope() === 'mine' ? 'You don’t own any tickets yet' : 'No tickets here yet', 'Create one, or let Halo draft them from your next meeting.', ui.btn('New ticket', { kind: 'primary', icon: 'plus', action: 'tk-new' }))) + '</div>';
    } else if (lay === 'board') {
      html += board(list) + '<p class="tb-hint hide-phone">' + H.icon('grip', 14) + 'Drag cards between columns, or use the status button on a card.</p>';
    } else {
      html += '<div class="tl-list">' + GROUPS.map(function (g) { var l = list.filter(function (t) { return t.status === g; }); return l.length ? group(g, l) : ''; }).join('') + '</div>';
    }
    return html;
  }

  /* ---------- Menus ---------- */
  function openFilter(anchor, kind, focusIdx) {
    var inView = H.store.state.tickets.filter(inScope), sel = kind === 'project' ? view.projects : view.prios;
    var items = kind === 'project'
      ? Object.keys(H.PROJECTS).map(function (k) {
        return { lead: '<span class="menu-lead"><span class="key">' + k + '</span></span>', text: H.PROJECTS[k].name, hint: String(inView.filter(function (t) { return t.project === k; }).length),
          action: 'tk-filter-toggle', attrs: { 'data-f': 'project', 'data-v': k, role: 'menuitemcheckbox' }, checked: sel.indexOf(k) >= 0 };
      })
      : PRIOS.map(function (p) {
        return { lead: '<span class="menu-lead">' + ui.prio(p) + '</span>', text: ui.prioLabel(p), hint: String(inView.filter(function (t) { return t.prio === p; }).length),
          action: 'tk-filter-toggle', attrs: { 'data-f': 'prio', 'data-v': p, role: 'menuitemcheckbox' }, checked: sel.indexOf(p) >= 0 };
      });
    var list = [{ label: kind === 'project' ? 'Show projects' : 'Show priorities' }].concat(items, sel.length ? [{ sep: true }, { icon: 'x', text: 'Clear', action: 'tk-filter-clear', attrs: { 'data-f': kind } }] : []);
    var m = ui.menu(anchor, list, { width: 248, focus: focusIdx == null });
    if (m && focusIdx != null) { m.style.animation = 'none'; var its = m.querySelectorAll('.menu-item'); if (its[focusIdx]) its[focusIdx].focus({ preventScroll: true }); }
  }

  /* ---------- Drag and drop (board) ---------- */
  function clearOver() { Array.prototype.forEach.call(document.querySelectorAll('.tb-col.is-over'), function (c) { c.classList.remove('is-over'); }); }
  function endDrag() { clearOver(); Array.prototype.forEach.call(document.querySelectorAll('.tb-card.is-dragging'), function (c) { c.classList.remove('is-dragging'); }); document.documentElement.classList.remove('tb-dragging'); drag = null; }
  document.addEventListener('dragstart', function (e) {
    var c = e.target && e.target.closest ? e.target.closest('[data-drag]') : null; if (!c) return;
    var col = c.closest('[data-drop]');
    drag = { key: c.getAttribute('data-drag'), from: col ? col.getAttribute('data-drop') : null };
    try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', drag.key); } catch (err) { /* older browsers */ }
    ui.closeMenu(); ui.hideTip();
    requestAnimationFrame(function () { c.classList.add('is-dragging'); document.documentElement.classList.add('tb-dragging'); });
  });
  document.addEventListener('dragover', function (e) {
    if (!drag) return; var col = e.target && e.target.closest ? e.target.closest('[data-drop]') : null; if (!col) return;
    e.preventDefault(); try { e.dataTransfer.dropEffect = 'move'; } catch (err) { /* ignore */ }
    if (!col.classList.contains('is-over')) { clearOver(); col.classList.add('is-over'); }
  });
  document.addEventListener('dragleave', function (e) {
    if (!drag) return; var col = e.target && e.target.closest ? e.target.closest('[data-drop]') : null;
    if (col && !col.contains(e.relatedTarget)) col.classList.remove('is-over');
  });
  document.addEventListener('drop', function (e) {
    if (!drag) return; var col = e.target && e.target.closest ? e.target.closest('[data-drop]') : null; if (!col) return;
    e.preventDefault();
    var to = col.getAttribute('data-drop'), key = drag.key, from = drag.from; endDrag();
    if (to && to !== from) H.act.setTicketStatus(key, to);
  });
  document.addEventListener('dragend', endDrag);

  /* ---------- Actions ---------- */
  function reopenFilter(f, idx) {
    requestAnimationFrame(function () { var a = document.querySelector('[data-action="tk-filter"][data-f="' + f + '"]'); if (a) openFilter(a, f, idx); });
  }
  var actions = {
    'tk-new': function () { ui.open('quickadd', { type: 'ticket' }); },
    'tk-status': function (el) { var t = q.ticket(el.dataset.tk); if (t) ui.menu(el, X.statusItems(t), { width: 200 }); },
    'tk-set-status': function (el) { H.act.setTicketStatus(el.dataset.tk, el.dataset.v); },
    'tk-book': function (el) { ui.open('booktime', { key: el.dataset.tk }); },
    'tk-copy': function (el) { X.copyLink(el.dataset.tk); },
    'tk-collapse': function (el) { var s = el.dataset.s; view.collapsed[s] = !view.collapsed[s]; H.render(); },
    'tk-filter': function (el) { openFilter(el, el.dataset.f); },
    'tk-filter-toggle': function (el) {
      var f = el.dataset.f, v = el.dataset.v, arr = f === 'project' ? view.projects : view.prios, i = arr.indexOf(v);
      if (i >= 0) arr.splice(i, 1); else arr.push(v);
      var idx = Array.prototype.indexOf.call(el.parentNode.querySelectorAll('.menu-item'), el);
      H.render(); reopenFilter(f, idx);
    },
    'tk-filter-clear': function (el) { if (el.dataset.f === 'project') view.projects = []; else view.prios = []; H.render(); },
    'tk-sort': function (el) {
      ui.menu(el, [{ label: 'Sort by' }].concat(SORTS.map(function (s) { return { icon: s.icon, text: s.label, action: 'tk-sort-set', attrs: { 'data-v': s.v, role: 'menuitemradio' }, checked: view.sort === s.v }; })), { width: 220 });
    },
    'tk-sort-set': function (el) { view.sort = el.dataset.v; H.render(); },
    'tk-search': function (el) { view.search = el.value; H.render(); },
    'tk-search-clear': function () { view.search = ''; H.render(); var i = document.querySelector('.tl-search input'); if (i) { i.value = ''; i.focus(); } },
    'tk-unfilter': function (el) {
      var f = el.dataset.f, v = el.dataset.v;
      if (f === 'project') view.projects = view.projects.filter(function (x) { return x !== v; });
      else if (f === 'prio') view.prios = view.prios.filter(function (x) { return x !== v; });
      else { view.search = ''; var i = document.querySelector('.tl-search input'); if (i) i.value = ''; }
      H.render();
    },
    'tk-clear': function () { view.projects = []; view.prios = []; view.search = ''; var i = document.querySelector('.tl-search input'); if (i) i.value = ''; H.render(); }
  };

  /* ---------- Screen ---------- */
  var merged = false;
  function mergeDetail() {
    if (merged || !H.ticketDetail) return; merged = true;
    Object.keys(H.ticketDetail.actions || {}).forEach(function (k) { if (!actions[k]) actions[k] = H.ticketDetail.actions[k]; });
  }
  function keyOf(r) { return String(r.parts[0] || '').toUpperCase(); }
  function isDetail(r) { return !!(r.parts && r.parts[0] && H.ticketDetail); }
  H.screens.tickets = {
    title: 'Tickets',
    docTitle: function (r) { if (!isDetail(r)) return 'Tickets · Halo'; var t = q.ticket(keyOf(r)); return (t ? t.key + ' ' + t.title : 'Ticket not found') + ' · Halo'; },
    crumbs: function (r) { return isDetail(r) ? H.ticketDetail.crumbs(r) : [{ label: 'Tickets' }]; },
    pageClass: function (r) { return isDetail(r) ? 'td-page' : 'wide tl-page'; },
    render: function (r) { mergeDetail(); return isDetail(r) ? H.ticketDetail.render(r) : renderList(r); },
    after: function (root, r) { if (isDetail(r) && H.ticketDetail.after) H.ticketDetail.after(root, r); },
    keys: {
      e: function () { if (isDetail(H.route) && H.ticketDetail.keys) H.ticketDetail.keys.e(); },
      s: function () { if (isDetail(H.route) && H.ticketDetail.keys) H.ticketDetail.keys.s(); },
      b: function () { if (!isDetail(H.route)) H.act.setPref('ticketsView', (H.store.state.prefs.ticketsView || 'list') === 'list' ? 'board' : 'list'); }
    },
    actions: actions
  };
})(window.H = window.H || {});

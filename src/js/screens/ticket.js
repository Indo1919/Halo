/* Ticket detail ('#/tickets/:key') — rendered by the Tickets screen through H.ticketDetail.
   Title, description, subtasks and activity on the left; details, the estimate and time on the right. */
(function (H) {
  'use strict';
  var esc = H.esc, ui = H.ui, q = H.q, F = H.fmt, U = H.util, X = H.tix;
  var PER_DAY = 5;                                   // focus hours in a typical workday
  var PEOPLE_ORDER = ['maya', 'sam', 'priya', 'leo', 'hana', 'nora', 'rosa', 'ethan'];
  var AUD = { team: 'your team', manager: 'your manager', exec: 'leadership' };
  var view = { key: null, editTitle: false, focusTitle: false, titleDraft: '', editDesc: false, focusDesc: false, descDraft: '', comment: '',
    suggest: null, estOpen: false, howOpen: false, busyUpdate: false, pop: null };

  function reset(key) {
    view.key = key; view.editTitle = view.editDesc = false; view.suggest = null; view.estOpen = view.howOpen = false; view.comment = ''; view.busyUpdate = false;
  }
  function cur() { return view.key ? q.ticket(view.key) : null; }
  function num(v) { var r = Math.round(v * 2) / 2; return r % 1 ? r.toFixed(1) : String(r); }
  function span(a, b) { return b < 1 ? Math.round(a * 60) + '–' + Math.round(b * 60) + 'm' : num(a) + '–' + num(b) + 'h'; }
  // Best and worst case for what's left, at your pace (the ends of the range bar).
  function bounds(t) {
    var pace = q.pace(), subs = (t.subtasks || []).filter(function (s) { return !s.done && s.est; });
    if (t.subtasks && t.subtasks.length) return { best: subs.reduce(function (a, s) { return a + (+s.est.o || 0); }, 0) * pace, worst: subs.reduce(function (a, s) { return a + (+s.est.p || 0); }, 0) * pace };
    var lg = t.logged || 0; return { best: Math.max(0, t.est.o - lg) * pace, worst: Math.max(0, t.est.p - lg) * pace };
  }
  function dayWord(d) { var n = U.dayDiff(d, H.now()); return n === 0 ? 'today' : n === 1 ? 'tomorrow' : F.day(d); }
  function isWeekend(d) { var w = d.getDay(); return w === 0 || w === 6; }
  function nextBiz(d) { var x = U.addDays(d, 1); while (isWeekend(x)) x = U.addDays(x, 1); return x; }
  function bizBetween(a, b) { var n = 0, x = U.startOfDay(a), end = U.startOfDay(b); while (x < end) { x = nextBiz(x); n++; } return n; }
  function name(id) { var me = H.store.state.me; return id === me ? 'You' : id === 'halo' ? 'Halo' : (q.person(id) || { name: 'Someone' }).name; }

  /* ---------- Estimates (added to H.q) ---------- */
  // What's left, as a three-point range, already multiplied by your pace.
  H.q.remainingRange = function (t) {
    if (!t || t.status === 'done') return { mean: 0, sd: 0, low: 0, high: 0, p85: 0 };
    var e, pace = q.pace();
    if (t.subtasks && t.subtasks.length) e = U.rollup(t.subtasks.filter(function (s) { return !s.done && s.est; }));
    else {
      var p = U.pert(t.est.o, t.est.m, t.est.p), m = Math.max(0, p.mean - (t.logged || 0));
      e = { mean: m, sd: p.sd, low: Math.max(0, m - p.sd), high: m + p.sd, p85: m + p.sd * 1.04 };
    }
    return { mean: e.mean * pace, sd: e.sd * pace, low: e.low * pace, high: e.high * pace, p85: e.p85 * pace };
  };
  // Walk forward through workdays at about five focus hours each, starting with what's left of today.
  H.q.finishDate = function (hours) {
    var now = H.now(), day = U.startOfDay(now), h = now.getHours() + now.getMinutes() / 60;
    var avail = isWeekend(day) ? 0 : PER_DAY * U.clamp((17.5 - h) / 8.5, 0, 1), left = hours || 0, guard = 0;
    while (left > avail + 1e-6 && guard++ < 180) { left -= avail; day = nextBiz(day); avail = PER_DAY; }
    return day;
  };

  /* ---------- Header ---------- */
  function statusBtn(t) {
    return '<button type="button" class="btn td-status-btn" data-action="td-status" aria-haspopup="menu" aria-label="Status: ' + ui.statusLabel(t.status) + '. Change status" data-kbd="S" data-tip="Change status">' +
      ui.status(t.status, false) + '<span>' + ui.statusLabel(t.status) + '</span>' + H.icon('chevron-down', 14, 'td-caret') + '</button>';
  }
  function header(t) {
    var proj = H.PROJECTS[t.project] || { name: t.project };
    var title = view.editTitle
      ? '<input id="td-title-in" class="td-title-input" value="' + esc(view.titleDraft) + '" maxlength="160" data-input="td-title-draft" data-enter="td-title-save" data-esc="td-title-cancel" aria-label="Ticket title">'
      : '<div class="td-title-row"><h1 class="td-title" data-action="td-title-edit">' + esc(t.title) + '</h1>' +
        ui.iconBtn('edit', 'Rename', 'td-title-edit', { size: 'sm', iconSize: 16, cls: 'td-title-btn', attrs: { 'data-kbd': 'E' } }) + '</div>';
    return '<header class="page-hd td-hd"><div class="grow td-hd-main">' +
      '<div class="td-eyebrow">' + ui.status(t.status) + '<span class="key">' + esc(t.key) + '</span><span class="td-dot"></span><span>' + esc(proj.name) + '</span></div>' + title + '</div>' +
      '<div class="actions">' + statusBtn(t) +
        ui.btn('Update your team', { kind: 'primary', icon: 'sparkle', action: 'td-update', cls: view.busyUpdate ? 'is-loading' : '', attrs: { 'data-tip': 'Halo drafts an update about this ticket in your voice' } }) +
        ui.iconBtn('more', 'More actions', 'td-more', { attrs: { 'aria-haspopup': 'menu' } }) + '</div></header>';
  }

  /* ---------- Main column ---------- */
  function origin(t) {
    if (!t.origin) return '';
    var o = t.origin, n = (t.subtasks || []).length;
    return '<div class="td-origin"><span class="td-origin-ic">' + H.icon(o.kind === 'meeting' ? 'split' : 'wand', 16) + '</span>' +
      '<div class="grow"><div class="td-origin-title">Created from <b>' + esc(o.label) + '</b><span class="c-3"> · ' + F.day(H.at(o.t)) + '</span></div>' +
      '<div class="td-origin-sub">Halo drafted ' + (n ? (n === 1 ? 'this subtask' : 'these ' + n + ' subtasks') + ' and their estimates' : 'this ticket') + ' from what was decided in the meeting. Change anything that’s off.</div></div>' +
      (o.recap ? ui.btn('Open recap', { size: 'sm', action: 'nav', attrs: { 'data-to': '#/recap/' + o.recap } }) : '') + '</div>';
  }
  function blocked(t) {
    if (t.status !== 'blocked') return '';
    return '<div class="td-blocked">' + H.icon('alert', 16) + '<div class="grow"><b>Blocked</b><span>' + esc(t.blocker || 'Halo mentions this in your next update, so nobody has to ask.') + '</span></div></div>';
  }
  function desc(t) {
    if (view.editDesc) {
      return '<div class="td-desc-edit"><textarea id="td-desc-in" class="textarea" rows="4" data-input="td-desc-draft" data-mod-enter="td-desc-save" data-esc="td-desc-cancel" aria-label="Description" placeholder="What is this about, and what does done look like?">' + esc(view.descDraft) + '</textarea>' +
        '<div class="row gap-2 mt-2"><span class="hint grow hide-phone">' + H.util.mod + ' ↵ to save, esc to cancel</span>' + ui.btn('Cancel', { size: 'sm', action: 'td-desc-cancel' }) + ui.btn('Save', { kind: 'primary', size: 'sm', action: 'td-desc-save' }) + '</div></div>';
    }
    return '<div class="td-desc' + (t.desc ? '' : ' is-empty') + '"><p data-action="td-desc-edit">' + esc(t.desc || 'Add a description so Halo can explain this ticket well in your updates.') + '</p>' +
      ui.iconBtn('edit', 'Edit description', 'td-desc-edit', { size: 'sm', iconSize: 16, cls: 'td-desc-btn' }) + '</div>';
  }
  function subRow(t, s) {
    var owner = q.person(s.owner || t.owner) || q.me();
    return '<div class="td-sub' + (s.done ? ' is-done' : '') + '" data-key="sub-' + s.id + '">' +
      ui.check(s.done, 'td-sub-toggle', { 'data-id': s.id, 'aria-label': (s.done ? 'Mark not done: ' : 'Mark done: ') + s.title }, view.pop === s.id ? 'pop' : '') +
      '<span class="td-sub-title">' + esc(s.title) + '</span>' +
      (s.est ? '<span class="td-sub-est num" data-tip="Best case to worst case">' + span(s.est.o, s.est.p) + '</span>' : '') +
      '<button type="button" class="td-sub-owner" data-action="td-sub-owner" data-id="' + s.id + '" aria-haspopup="menu" aria-label="Owner: ' + esc(owner.name) + '. Reassign" data-tip="' + esc(owner.name) + '">' + ui.avatar(owner, 'sm', { tip: false }) + '</button>' +
      ui.iconBtn('trash', 'Remove subtask', 'td-sub-del', { size: 'sm', iconSize: 16, cls: 'td-sub-del', attrs: { 'data-id': s.id } }) +
    '</div>';
  }
  function suggestions(t) {
    var sg = view.suggest; if (!sg) return '';
    var hd = '<div class="td-sug-hd"><span class="td-sug-kicker">' + H.icon('sparkle', 14) + 'Halo suggests</span><span class="c-3 t-callout hide-phone">From the title and description</span>' +
      '<span class="ml-auto">' + ui.iconBtn('x', 'Dismiss suggestions', 'td-sug-close', { size: 'sm', iconSize: 16 }) + '</span></div>';
    if (sg.loading) {
      return '<div class="card td-sug" aria-busy="true">' + hd + [72, 58, 80, 46].map(function (w) {
        return '<div class="td-sug-row"><span class="skeleton" style="width:18px;height:18px;border-radius:5px"></span><span class="skeleton" style="height:12px;width:' + w + '%"></span></div>';
      }).join('') + '</div>';
    }
    if (sg.error) return '<div class="card td-sug">' + hd + '<div class="banner banner-warning" style="margin:4px 12px 12px">' + H.icon('alert', 16) + '<span class="grow">Halo couldn’t suggest subtasks just now. Nothing was changed.</span>' + ui.btn('Try again', { size: 'xs', action: 'td-suggest' }) + '</div></div>';
    if (!sg.items.length) return '<div class="card td-sug">' + hd + '<p class="td-sug-empty">' + H.icon('check-circle', 16) + 'Nothing to add. Your subtasks already cover what this ticket describes.</p></div>';
    var n = sg.items.filter(function (x) { return x.on; }).length;
    return '<div class="card td-sug">' + hd + sg.items.map(function (it, i) {
      var o = q.person(it.owner);
      return '<div class="td-sug-row' + (it.on ? '' : ' is-off') + '">' + ui.check(it.on, 'td-sug-pick', { 'data-i': i, 'aria-label': 'Include ' + it.title }, 'square') +
        '<span class="grow td-sug-title">' + esc(it.title) + '</span><span class="td-sub-est num">' + span(it.o, it.p) + '</span>' + ui.avatar(o, 'sm') + '</div>';
    }).join('') +
      '<div class="td-sug-ft"><span class="hint grow">' + n + ' of ' + sg.items.length + ' selected</span>' + ui.btn('Dismiss', { kind: 'ghost', size: 'sm', action: 'td-sug-close' }) + ui.btn('Add selected', { kind: 'primary', size: 'sm', action: 'td-sug-add', disabled: !n }) + '</div></div>';
  }
  function subtasks(t) {
    var subs = t.subtasks || [], sc = X.subs(t);
    return '<section class="section td-subs"><div class="section-hd"><h2>Subtasks</h2>' +
      (subs.length ? '<span class="sub num">' + sc.done + ' of ' + sc.total + '</span><span class="td-subs-bar hide-phone">' + ui.bar(sc.done / sc.total, 'thin' + (sc.done === sc.total ? ' success' : '')) + '</span>' : '') +
      '<div class="actions">' + ui.btn('Suggest with Halo', { kind: 'ghost', size: 'sm', icon: 'sparkle', action: 'td-suggest', cls: view.suggest && view.suggest.loading ? 'is-loading' : '' }) + '</div></div>' +
      '<div class="card td-sub-list">' + subs.map(function (s) { return subRow(t, s); }).join('') +
        '<div class="td-sub-add">' + H.icon('plus', 16) + '<input id="td-sub-in" class="td-sub-input" placeholder="Add a subtask" data-enter="td-sub-add" aria-label="Add a subtask, then press Enter" autocomplete="off"><span class="kbd hide-phone">↵</span></div></div>' +
      suggestions(t) + '</section>';
  }
  function shared(t) {
    var re = new RegExp('\\b' + t.key.replace(/[-]/g, '\\-') + '\\b');
    return q.published().filter(function (p) {
      return p.ticket === t.key || re.test(p.text || '') || (p.sources || []).some(function (s) { return re.test(s[1] || ''); });
    });
  }
  function activity(t) {
    var items = [], i = 0, me = H.store.state.me;
    var push = function (o) { o.i = i++; items.push(o); };
    if (t.origin) push({ t: t.created, mark: true, html: '<b>Halo</b> drafted this from <b>' + esc(t.origin.label) + '</b>' });
    else push({ t: t.created, ic: 'plus', html: '<b>' + esc(name(t.owner)) + '</b> created this ticket' });
    shared(t).forEach(function (p) { push({ t: p.t, mark: true, html: '<b>Halo</b> shared an update with ' + (AUD[p.audience] || 'your team') + (p.via === 'approved' ? '<span class="c-3"> after you approved it</span>' : ''), quote: p.text }); });
    (t.activity || []).forEach(function (a) {
      var who = '<b>' + esc(name(a.who)) + '</b> ';
      if (a.kind === 'comment') push({ t: a.t, comment: a });
      else if (a.kind === 'status') push({ t: a.t, lead: ui.status(a.to, false), html: who + 'moved this to <b>' + ui.statusLabel(a.to) + '</b>' + (a.from ? '<span class="c-3"> from ' + ui.statusLabel(a.from) + '</span>' : '') + (a.note ? '<span class="c-3"> · ' + esc(a.note) + '</span>' : '') });
      else if (a.kind === 'prio') push({ t: a.t, lead: ui.prio(a.to), html: who + 'set priority to <b>' + ui.prioLabel(a.to) + '</b>' });
      else if (a.kind === 'owner') push({ t: a.t, ic: 'user', html: who + 'assigned this to <b>' + esc((q.person(a.to) || {}).name || 'someone') + '</b>' });
      else if (a.kind === 'due') push({ t: a.t, ic: 'calendar', html: a.to == null ? who + 'removed the due date' : who + 'set the due date to <b>' + F.day(H.at(a.to)) + '</b>' });
      else if (a.kind === 'project') push({ t: a.t, ic: 'layers', html: who + 'moved this to <b>' + esc((H.PROJECTS[a.to] || {}).name || a.to) + '</b>' });
      else if (a.kind === 'title') push({ t: a.t, ic: 'edit', html: who + 'renamed this to <b>' + esc(a.text) + '</b>' });
      else if (a.kind === 'desc') push({ t: a.t, ic: 'file-text', html: who + 'edited the description' });
      else if (a.kind === 'subtasks') push({ t: a.t, ic: 'subtasks', html: who + 'added ' + U.plural(a.n, 'subtask') + (a.from === 'halo' ? ' Halo suggested' : '') });
    });
    items.sort(function (a, b) { return a.t - b.t || a.i - b.i; });
    var feed = items.map(function (x) {
      var when = '<time class="td-ev-time" data-tip="' + esc(F.relLong(H.at(x.t))) + '">' + esc(F.rel(H.at(x.t))) + '</time>';
      if (x.comment) {
        var p = x.comment.who === me ? q.me() : q.person(x.comment.who);
        return '<li class="td-ev is-comment">' + ui.avatar(p, 'sm') + '<div class="td-cmt"><div class="td-cmt-hd"><b>' + esc(p ? p.name : 'Someone') + '</b>' + when + '</div><p>' + esc(x.comment.text) + '</p></div></li>';
      }
      return '<li class="td-ev"><span class="td-ev-ic">' + (x.mark ? ui.mark(14) : x.lead || H.icon(x.ic, 14)) + '</span><div class="td-ev-body"><div class="td-ev-line"><span>' + x.html + '</span>' + when + '</div>' +
        (x.quote ? '<p class="td-ev-quote">' + esc(x.quote) + '</p>' : '') + '</div></li>';
    }).join('');
    return '<section class="section td-activity"><div class="section-hd"><h2>Activity</h2></div><ol class="td-feed">' + feed + '</ol>' +
      '<div class="td-cmt-box">' + ui.avatar(q.me(), 'sm', { tip: false }) + '<div class="grow"><label for="td-cmt" class="sr-only">Leave a comment</label>' +
        '<textarea id="td-cmt" class="textarea" rows="2" placeholder="Leave a comment" data-input="td-cmt-draft" data-mod-enter="td-cmt-send">' + esc(view.comment) + '</textarea>' +
        '<div class="td-cmt-ft"><span class="hint">' + H.icon('lock', 12) + 'Comments stay on this ticket. Halo doesn’t share them.</span>' +
          ui.btn('Comment', { size: 'sm', action: 'td-cmt-send', disabled: !view.comment.trim() }) + '</div></div></div></section>';
  }

  /* ---------- Right rail ---------- */
  function prop(label, valueHtml, action, extra) {
    return '<div class="td-prop"><span class="td-prop-k">' + label + '</span><button type="button" class="td-prop-v" data-action="' + action + '" aria-haspopup="menu" aria-label="' + label + ': ' + esc(extra || '') + '. Change">' + valueHtml + '</button></div>';
  }
  function props(t) {
    var owner = q.person(t.owner) || q.me(), due = X.due(t), proj = H.PROJECTS[t.project] || { name: t.project }, watchers = (t.watchers || []).map(q.person).filter(Boolean);
    return '<section class="card td-card td-props" aria-label="Details"><div class="td-card-hd"><span class="eyebrow">Details</span></div>' +
      prop('Status', ui.status(t.status, false) + '<span>' + ui.statusLabel(t.status) + '</span>', 'td-status', ui.statusLabel(t.status)) +
      prop('Priority', '<span class="td-prop-lead">' + ui.prio(t.prio) + '</span><span>' + ui.prioLabel(t.prio) + '</span>', 'td-prio', ui.prioLabel(t.prio)) +
      prop('Assignee', ui.avatar(owner, 'xs', { tip: false }) + '<span class="truncate">' + esc(owner.name) + '</span>', 'td-assignee', owner.name) +
      prop('Project', '<span class="key">' + esc(t.project) + '</span><span class="truncate">' + esc(proj.name) + '</span>', 'td-project', proj.name) +
      prop('Due date', H.icon('calendar', 14) + '<span class="' + due.cls + '">' + (t.due != null ? due.text : 'No due date') + '</span>', 'td-due', t.due != null ? due.text : 'none') +
      '<div class="td-prop"><span class="td-prop-k">Watchers</span><div class="td-prop-v is-static">' +
        (watchers.length ? ui.avatarStack(watchers, 'sm', 5) : '<span class="c-3">Nobody yet</span>') +
        ui.iconBtn('user-plus', 'Manage watchers', 'td-watchers', { size: 'xs', iconSize: 14, cls: 'ml-auto', attrs: { 'aria-haspopup': 'menu' } }) + '</div></div></section>';
  }
  function sparkline(vals) {
    var w = 76, h = 24, pad = 4, lo = Math.min(0.85, Math.min.apply(null, vals)), hi = Math.max(1.3, Math.max.apply(null, vals));
    var x = function (i) { return pad + i * (w - pad * 2) / (vals.length - 1); }, y = function (v) { return pad + (hi - v) / (hi - lo) * (h - pad * 2); };
    var pts = vals.map(function (v, i) { return x(i).toFixed(1) + ',' + y(v).toFixed(1); }).join(' '), last = vals.length - 1;
    return '<svg class="td-spark" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Your last ' + vals.length + ' finished tickets took ' + vals.map(function (v) { return v.toFixed(2) + '×'; }).join(', ') + ' their estimates">' +
      '<line x1="0" x2="' + w + '" y1="' + y(1).toFixed(1) + '" y2="' + y(1).toFixed(1) + '" class="td-spark-base"/>' +
      '<polyline points="' + pts + '" class="td-spark-line"/>' +
      '<circle cx="' + x(last).toFixed(1) + '" cy="' + y(vals[last]).toFixed(1) + '" r="3.5" class="td-spark-dot"/>' +
      vals.map(function (v, i) { return '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(v).toFixed(1) + '" r="6" class="td-spark-hit" data-tip="' + (v >= 1 ? v.toFixed(2) + '× its estimate' : v.toFixed(2) + '× its estimate, finished early') + '"/>'; }).join('') + '</svg>';
  }
  function paceBlock() {
    var pace = q.pace(), pct = Math.round(Math.abs(pace - 1) * 100);
    return '<div class="td-pace"><span class="c-3">Your pace</span><b class="num">' + pace.toFixed(2) + '×</b>' + sparkline(q.paceHistory()) + '</div>' +
      '<p class="td-note">' + (pace >= 1 ? 'Your finished work took ' + pct + '% longer than estimated on average, so Halo adjusts for it.' : 'Your finished work took ' + pct + '% less time than estimated on average, so Halo adjusts for it.') + '</p>';
  }
  function howBlock() {
    return '<button type="button" class="td-disc td-how-btn" data-action="td-how" aria-expanded="' + view.howOpen + '">' + H.icon('info', 14) + '<span>How Halo estimates</span>' + H.icon('chevron-down', 14, 'td-disc-chev') + '</button>' +
      (view.howOpen ? '<p class="td-how">Every task gets three numbers: best case, likely and worst case. Halo weights them as (best + 4 × likely + worst) ÷ 6, and the gap between best and worst sets the range. It then scales by your pace and counts about ' + PER_DAY + ' focus hours per workday to find the date.</p>' : '');
  }
  function stepper(f, label, v, data) {
    return '<div class="td-step"><span class="td-step-k">' + label + '</span><div class="stepper td-stepper">' +
      '<button type="button" data-action="td-est-step" data-f="' + f + '" data-d="-0.5" aria-label="' + label + ' case: half an hour less">' + H.icon('minus', 12) + '</button>' +
      '<input inputmode="decimal" value="' + num(v) + '" data-input="td-est-in" data-f="' + f + '"' + (data || '') + ' aria-label="' + label + ' case, in hours">' +
      '<button type="button" data-action="td-est-step" data-f="' + f + '" data-d="0.5" aria-label="' + label + ' case: half an hour more">' + H.icon('plus', 12) + '</button></div></div>';
  }
  function inputsBlock(t) {
    var subs = t.subtasks || [];
    if (!subs.length) return '<div class="td-in-hd"><span class="td-in-k">Your estimate</span><span class="td-in-sub">hours</span></div><div class="td-est-in">' + stepper('o', 'Best', t.est.o) + stepper('m', 'Likely', t.est.m) + stepper('p', 'Worst', t.est.p) + '</div>';
    var sum = subs.reduce(function (a, s) { if (s.est) { a.o += +s.est.o || 0; a.m += +s.est.m || 0; a.p += +s.est.p || 0; } return a; }, { o: 0, m: 0, p: 0 }), roll = q.estimate(t);
    var open = view.estOpen;
    return '<div class="td-rollup"><div class="td-in-hd"><span class="td-in-k">Rolled up from ' + U.plural(subs.length, 'subtask') + '</span>' +
        '<button type="button" class="td-in-toggle" data-action="td-est-toggle" aria-expanded="' + open + '">' + (open ? 'Done' : 'Edit') + H.icon('chevron-down', 14, 'td-disc-chev') + '</button></div>' +
      '<p class="td-rollup-sum num"><b>' + num(sum.o) + 'h</b> best<span class="td-dot"></span><b>' + num(sum.m) + 'h</b> likely<span class="td-dot"></span><b>' + num(sum.p) + 'h</b> worst</p>' +
      (open ? '<div class="td-rollup-list"><div class="td-rl-row td-rl-hd"><span>Subtask</span><span>Best</span><span>Likely</span><span>Worst</span></div>' +
        subs.map(function (s) {
          var e = s.est || { o: 0, m: 0, p: 0 };
          return '<div class="td-rl-row' + (s.done ? ' is-done' : '') + '" data-key="rl-' + s.id + '"><span class="truncate" data-tip="' + esc(s.title) + '">' + esc(s.title) + '</span>' + ['o', 'm', 'p'].map(function (f) {
            return '<input class="td-mini num" inputmode="decimal" value="' + num(e[f]) + '" data-input="td-sub-est" data-id="' + s.id + '" data-f="' + f + '" aria-label="' + ({ o: 'Best case', m: 'Likely', p: 'Worst case' }[f]) + ' hours for ' + esc(s.title) + '">';
          }).join('') + '</div>';
        }).join('') +
        '<div class="td-rl-total"><span>Expected ' + F.hours(roll.mean) + ' in total, ' + F.hours(roll.mean * q.pace()) + ' at your pace</span></div></div>' : '') + '</div>';
  }
  function estimateCard(t) {
    var hd = '<div class="td-card-hd"><span class="eyebrow">Estimate</span>';
    if (t.status === 'done') {
      var total = q.estimate(t).mean, took = t.logged || 0;
      return '<section class="card td-card td-est" aria-label="Estimate">' + hd + '<span class="ml-auto">' + ui.badge('Done', 'success', 'check') + '</span></div>' +
        '<div class="td-est-big">Finished' + (t.done != null ? ' ' + dayWord(H.at(t.done)) : '') + '</div>' +
        '<p class="td-est-when">Took ' + F.hours(took) + ' against an estimate of about ' + F.hours(total) + '. It counts toward your pace.</p>' +
        '<div class="td-est-sep"></div>' + paceBlock() + howBlock() + '</section>';
    }
    var r = H.q.remainingRange(t), likely = H.q.finishDate(r.mean), sure = H.q.finishDate(r.p85);
    var dueD = t.due != null ? H.at(t.due) : null, late = dueD ? bizBetween(dueD, likely) : 0;
    var badge = !dueD ? '' : late > 0
      ? ui.badge('At risk', 'warning', 'alert', { tip: 'Likely done ' + F.day(likely) + ', ' + U.plural(late, 'workday') + ' after the ' + F.day(dueD) + ' due date' })
      : ui.badge('On track', 'success', 'check', { tip: 'Likely done by the ' + F.day(dueD) + ' due date' });
    var max = Math.max(r.high, r.p85, 0.5) * 1.15, P = function (v) { return U.clamp(v / max * 100, 0, 100).toFixed(1) + '%'; };
    var same = U.sameDay(likely, sure);
    return '<section class="card td-card td-est" aria-label="Estimate">' + hd + '<span class="ml-auto">' + badge + '</span></div>' +
      '<div class="td-est-big">' + (r.mean < 0.25 ? 'Almost done' : 'About ' + F.hours(r.mean) + ' left') + '</div>' +
      '<p class="td-est-when">Likely done <b>' + dayWord(likely) + '</b>' + (same ? '<span class="c-3">, 85% sure</span>' : '<span class="td-dot"></span>85% likely by <b>' + dayWord(sure) + '</b>') + '</p>' +
      '<div class="td-range" role="img" aria-label="Most likely ' + F.hours(r.mean) + ' left, usually between ' + F.hours(r.low) + ' and ' + F.hours(r.high) + '. 85% likely within ' + F.hours(r.p85) + '.">' +
        '<div class="td-range-track"><span class="td-range-band" style="left:' + P(r.low) + ';width:' + U.clamp((r.high - r.low) / max * 100, 0, 100).toFixed(1) + '%"></span>' +
          '<span class="td-range-p85" style="left:' + P(r.p85) + '" data-tip="85% likely within ' + F.hours(r.p85) + '"></span>' +
          '<span class="td-range-mark" style="left:' + P(r.mean) + '" data-tip="Most likely ' + F.hours(r.mean) + '"></span></div>' +
        '<div class="td-range-cap num"><span>Usually ' + span(r.low, r.high) + '</span><span>85% within ' + F.hours(r.p85) + '</span></div></div>' +
      '<div class="td-est-sep"></div>' + inputsBlock(t) + paceBlock() + howBlock() + '</section>';
  }
  function timeCard(t) {
    var total = q.estimate(t).mean * q.pace(), logged = t.logged || 0, over = logged > total, scale = Math.max(total, logged) || 1;
    var next = q.events().filter(function (e) { return e.kind === 'focus' && e.ticket === t.key && e.end > 0; })[0];
    return '<section class="card td-card td-time" aria-label="Time"><div class="td-card-hd"><span class="eyebrow">Time</span></div>' +
      '<div class="td-time-line"><span class="td-time-big">' + F.hours(logged) + '</span><span class="c-3">logged of about ' + F.hours(total) + ' expected</span></div>' +
      '<div class="td-time-bar' + (over ? ' is-over' : '') + '" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(logged / (total || 1) * 100) + '" aria-label="Time logged against the expected total">' +
        '<span style="width:' + (Math.min(logged, total) / scale * 100).toFixed(1) + '%"></span>' + (over ? '<span class="td-time-over" style="width:' + ((logged - total) / scale * 100).toFixed(1) + '%"></span>' : '') + '</div>' +
      (over ? '<p class="td-note c-warning">' + F.hours(logged - total) + ' over what was expected. Halo counts this in your pace.</p>' : '') +
      (next ? '<a class="td-next" href="#/calendar?e=' + esc(next.id) + '" data-nav="#/calendar?e=' + esc(next.id) + '">' + H.icon('calendar-check', 14) + '<span class="grow">Focus ' + dayWord(H.at(next.start)) + ', ' + F.range(H.at(next.start), H.at(next.end)) + '</span>' + H.icon('chevron-right', 14) + '</a>' : '') +
      '<div class="td-time-actions">' + ui.btn('Log time', { size: 'sm', icon: 'clock', action: 'td-log' }) + ui.btn('Book time', { size: 'sm', icon: 'calendar-plus', action: 'td-book' }) + '</div></section>';
  }
  function linksCard(t) {
    var l = t.links || []; if (!l.length) return '';
    return '<section class="card td-card td-links" aria-label="Linked"><div class="td-card-hd"><span class="eyebrow">Linked</span></div><div class="td-links-list">' + l.map(function (x) { return ui.src(x.src, x.label); }).join('') + '</div></section>';
  }

  /* ---------- Render ---------- */
  function notFound(key) {
    return '<div class="card td-404">' + ui.empty('ticket', 'We couldn’t find ' + key, 'It may have been deleted, or the link has a typo. Everything else is where you left it.',
      ui.btn('Back to tickets', { kind: 'primary', icon: 'arrow-left', action: 'nav', attrs: { 'data-to': '#/tickets' } })) + '</div>';
  }
  function render(r) {
    var key = String(r.parts[0] || '').toUpperCase(), t = q.ticket(key);
    if (view.key !== key) reset(key);
    if (!t) return notFound(key);
    return header(t) + '<div class="td">' +
      '<div class="td-left"><div class="td-content">' + origin(t) + blocked(t) + desc(t) + subtasks(t) + '</div>' + activity(t) + '</div>' +
      '<aside class="td-rail" aria-label="Ticket details">' + props(t) + estimateCard(t) + timeCard(t) + linksCard(t) + '</aside></div>';
  }

  /* ---------- Menus + helpers ---------- */
  function dueOptions() {
    var wd = (H.now().getDay() + 6) % 7, fri = wd < 4 ? 4 - wd : 11 - wd;
    return [
      { text: 'Today', v: H.slot(0, '17:00') },
      { text: F.day(H.at(H.bday(1, '17:00'))) === 'Tomorrow' ? 'Tomorrow' : F.weekday(H.at(H.bday(1, '17:00'))), v: H.bday(1, '17:00') },
      { text: wd < 4 ? 'Friday' : 'Next Friday', v: H.slot(fri, '17:00') },
      { text: 'Next week', v: H.slot(7 - wd, '17:00') }
    ];
  }
  function peopleMenu(ids, checkedFn, action, extra) {
    return ids.filter(function (id) { return H.PEOPLE[id]; }).map(function (id) {
      var p = H.PEOPLE[id];
      return { lead: ui.avatar(p, 'xs', { tip: false }), text: p.name + (id === H.store.state.me ? ' (you)' : ''), action: action, attrs: Object.assign({ 'data-v': id }, extra || {}), checked: checkedFn(id) };
    });
  }
  function openWatchers(anchor, focusIdx) {
    var t = cur(); if (!t) return;
    var ids = PEOPLE_ORDER.filter(function (id) { return id !== t.owner; });
    var m = ui.menu(anchor, [{ label: 'Watchers get Halo’s updates on this ticket' }].concat(peopleMenu(ids, function (id) { return (t.watchers || []).indexOf(id) >= 0; }, 'td-watch-toggle', { role: 'menuitemcheckbox' })), { width: 280, align: 'end', focus: focusIdx == null });
    if (m && focusIdx != null) { m.style.animation = 'none'; var its = m.querySelectorAll('.menu-item'); if (its[focusIdx]) its[focusIdx].focus({ preventScroll: true }); }
  }
  function template(t) {
    var subs = t.subtasks || [], sc = X.subs(t), r = H.q.remainingRange(t), next = subs.filter(function (s) { return !s.done; })[0];
    var lower = function (s) { return s.charAt(0).toLowerCase() + s.slice(1); };
    if (t.status === 'done') return t.title + ' (' + t.key + ') is done' + (sc.total ? ', all ' + sc.total + ' subtasks wrapped' : '') + '.';
    var s = t.title + ' (' + t.key + ') is ' + ui.statusLabel(t.status).toLowerCase() + (sc.total ? ', with ' + sc.done + ' of ' + sc.total + ' subtasks done' : '') + '.';
    s += ' About ' + F.hours(r.mean) + ' left, likely done ' + dayWord(H.q.finishDate(r.mean)) + '.';
    if (t.status === 'blocked' && t.blocker) s += ' Blocked: ' + lower(t.blocker) + '.';
    else if (next) s += ' Next up: ' + lower(next.title) + '.';
    return s;
  }
  var SUGGEST = {
    'CHK-142': [['Empty, loading and error states for the selector', 1, 2, 3], ['Rules for pre-selecting the merchant’s default', 0.5, 1, 2], ['Check wallet buttons against brand guidelines', 0.5, 1, 1.5], ['Quick usability check with three merchants', 2, 3, 5]],
    'CHK-145': [['Dark appearance variants for both wallets', 0.5, 1, 2], ['Sizing check on small Android screens', 0.5, 1, 2]],
    'CHK-139': [['Focus order map for every step', 1, 1.5, 2], ['Color contrast audit', 1, 2, 3], ['Reduced motion review', 0.5, 1, 1.5]],
    'DS-212': [['Usage guidelines with examples', 1, 2, 3], ['Migration notes for the five existing dropdowns', 1, 2, 4], ['Compact density for data tables', 1, 1.5, 3]],
    'INV-91': [['Subject lines for each reminder', 0.5, 1, 1.5], ['Where the pay link sits on mobile', 0.5, 1, 2], ['Review late-fee wording with Legal', 0.5, 1, 2]],
    'INV-88': [['Check the PDF with long business names', 0.5, 1, 1.5], ['Print preview on A4 and Letter', 0.5, 1, 2]],
    'CHK-138': [['Confirm step before removing a card', 1, 1.5, 2], ['Empty state when no cards are saved', 0.5, 1, 2]],
    'CHK-149': [['Name the funnel steps with Priya', 0.5, 1, 1.5], ['QA events on iOS and Android', 1, 2, 3]],
    'CHK-150': [['Buyer-facing copy for a retried challenge', 0.5, 1, 2], ['Agree timeout thresholds with the processor', 1, 2, 3]],
    'CHK-153': [['Audit how restaurants show tips today', 1, 2, 3], ['Tip selector with preset amounts', 2, 3, 5], ['Tax lines on a 360px screen', 1, 2, 3], ['Review with two restaurant merchants', 1, 1.5, 3]],
    'CHK-136': [['Receipt email matches the success page', 0.5, 1, 2], ['Track clicks on “Back to the store”', 0.5, 1, 1.5]],
    'INV-95': [['CSV template and validation errors', 1, 2, 3], ['Progress and partial-failure states', 1, 2, 4], ['Confirm before sending to 200 customers', 0.5, 1, 2]]
  };
  function demoSuggest(t) {
    var list = SUGGEST[t.key];
    if (!list && t.origin && t.origin.recap) return H.ai.demoDecompose().subtasks;
    if (!list) {
      var mate = (t.watchers || []).filter(function (id) { return id !== t.owner; })[0] || 'priya';
      list = [['Agree scope and what done looks like', 0.5, 1, 2], ['First pass on ' + t.title.charAt(0).toLowerCase() + t.title.slice(1), 2, 3, 5], ['Review with ' + H.PEOPLE[mate].name.split(' ')[0], 0.5, 1, 1.5], ['Handoff notes', 0.5, 1, 2]];
    }
    return list.map(function (x) { return { title: x[0], o: x[1], m: x[2], p: x[3], owner: t.owner }; });
  }
  function setEst(t, f, v) {
    H.store.commit(function (s) { var x = X.find(s, t.key); if (x) x.est[f] = v; });
  }

  /* ---------- Actions ---------- */
  var actions = {
    'td-status': function (el) { var t = cur(); if (t) ui.menu(el, X.statusItems(t), { width: 200, align: el.closest('.td-rail') ? 'end' : 'start' }); },
    'td-prio': function (el) {
      var t = cur(); if (!t) return;
      ui.menu(el, [{ label: 'Priority' }].concat(['urgent', 'high', 'medium', 'low'].map(function (p) { return { lead: '<span class="menu-lead">' + ui.prio(p) + '</span>', text: ui.prioLabel(p), action: 'td-set-prio', attrs: { 'data-v': p, role: 'menuitemradio' }, checked: t.prio === p }; })), { width: 200, align: 'end' });
    },
    'td-set-prio': function (el) { var t = cur(), v = el.dataset.v; if (t && t.prio !== v) H.act.editTicket(t.key, { prio: v }, { kind: 'prio', to: v }, 'Priority set to ' + ui.prioLabel(v)); },
    'td-assignee': function (el) {
      var t = cur(); if (!t) return;
      ui.menu(el, [{ label: 'Assign to' }].concat(peopleMenu(PEOPLE_ORDER, function (id) { return t.owner === id; }, 'td-set-owner', { role: 'menuitemradio' })), { width: 240, align: 'end' });
    },
    'td-set-owner': function (el) {
      var t = cur(), v = el.dataset.v; if (!t || t.owner === v) return;
      var p = H.PEOPLE[v];
      H.act.editTicket(t.key, { owner: v }, { kind: 'owner', to: v }, v === H.store.state.me ? 'Assigned to you' : 'Assigned to ' + p.name.split(' ')[0] + '. Their Halo picks it up from here.');
    },
    'td-project': function (el) {
      var t = cur(); if (!t) return;
      ui.menu(el, [{ label: 'Project' }].concat(Object.keys(H.PROJECTS).map(function (k) { return { lead: '<span class="menu-lead"><span class="key">' + k + '</span></span>', text: H.PROJECTS[k].name, action: 'td-set-project', attrs: { 'data-v': k, role: 'menuitemradio' }, checked: t.project === k }; })), { width: 240, align: 'end' });
    },
    'td-set-project': function (el) { var t = cur(), v = el.dataset.v; if (t && t.project !== v) H.act.editTicket(t.key, { project: v }, { kind: 'project', to: v }, 'Moved to ' + H.PROJECTS[v].name); },
    'td-due': function (el) {
      var t = cur(); if (!t) return;
      ui.menu(el, [{ label: 'Due date' }].concat(dueOptions().map(function (o) { return { icon: 'calendar', text: o.text, hint: F.dow(H.at(o.v)) + ', ' + F.date(H.at(o.v)), action: 'td-set-due', attrs: { 'data-v': String(o.v), role: 'menuitemradio' }, checked: t.due === o.v }; }),
        [{ sep: true }, { icon: 'x', text: 'No due date', action: 'td-set-due', attrs: { 'data-v': 'none' } }]), { width: 250, align: 'end' });
    },
    'td-set-due': function (el) {
      var t = cur(); if (!t) return; var v = el.dataset.v === 'none' ? null : +el.dataset.v; if (t.due === v) return;
      H.act.editTicket(t.key, { due: v }, { kind: 'due', to: v }, v == null ? 'Due date removed' : 'Due ' + F.day(H.at(v)).toLowerCase().replace(/^(mon|tue|wed|thu|fri|sat|sun)/, function (m) { return m.charAt(0).toUpperCase() + m.slice(1); }));
    },
    'td-watchers': function (el) { openWatchers(el); },
    'td-watch-toggle': function (el) {
      var t = cur(), v = el.dataset.v; if (!t) return;
      var idx = Array.prototype.indexOf.call(el.parentNode.querySelectorAll('.menu-item'), el);
      H.store.commit(function (s) { var x = X.find(s, t.key); if (!x) return; x.watchers = x.watchers || []; var i = x.watchers.indexOf(v); if (i >= 0) x.watchers.splice(i, 1); else x.watchers.push(v); });
      requestAnimationFrame(function () { var a = document.querySelector('[data-action="td-watchers"]'); if (a) openWatchers(a, idx); });
    },
    'td-more': function (el) {
      var t = cur(); if (!t) return; var wd = (H.now().getDay() + 6) % 7, nw = H.at(H.slot(7 - wd, '17:00'));
      ui.menu(el, [
        { icon: 'link', text: 'Copy link', action: 'td-copy' },
        { icon: 'calendar', text: 'Move to next week', hint: F.dow(nw) + ', ' + F.date(nw), action: 'td-next-week' },
        { icon: 'calendar-plus', text: 'Book focus time', action: 'td-book' },
        { sep: true },
        { icon: 'trash', text: 'Delete ticket', action: 'td-delete', danger: true }
      ], { align: 'end', width: 240 });
    },
    'td-copy': function () { if (view.key) X.copyLink(view.key); },
    'td-next-week': function () {
      var t = cur(); if (!t) return; var wd = (H.now().getDay() + 6) % 7, v = H.slot(7 - wd, '17:00');
      H.act.editTicket(t.key, { due: v }, { kind: 'due', to: v }, 'Moved to next week. Due ' + F.weekday(H.at(v)) + ', ' + F.date(H.at(v)) + '.');
    },
    'td-delete': function () {
      var t = cur(); if (!t) return; var n = (t.subtasks || []).length;
      ui.open('confirm', { title: 'Delete ' + t.key + '?', body: '“' + t.title + '”' + (n ? ' and its ' + U.plural(n, 'subtask') : '') + ' will be removed, and focus time booked for it is released. You can undo this right after.', ok: 'Delete ticket', danger: true, run: 'td-delete-go' });
    },
    'td-delete-go': function () {
      var key = view.key; ui.close(true); if (!key || !q.ticket(key)) return;
      var snap = H.act.deleteTicket(key); H.go('#/tickets');
      ui.toast(key + ' deleted', { icon: 'trash', undo: function () { H.store.restore(snap); } });
    },
    'td-update': function () {
      var t = cur(); if (!t || view.busyUpdate) return;
      var text = template(t); view.busyUpdate = true; H.render();
      var done = function (out) { view.busyUpdate = false; H.render(); ui.open('quickadd', { type: 'update', text: out || text }); };
      H.ai.rewrite(text, 'team').then(done, function () { done(text); });
    },
    'td-title-edit': function () { var t = cur(); if (!t || view.editTitle) return; view.editTitle = true; view.focusTitle = true; view.titleDraft = t.title; H.render(); },
    'td-title-draft': function (el) { view.titleDraft = el.value; },
    'td-title-save': function () {
      if (!view.editTitle) return; var t = cur(), v = view.titleDraft.trim(); view.editTitle = false;
      if (t && v && v !== t.title) H.act.editTicket(t.key, { title: v }, { kind: 'title', text: v }, 'Title updated'); else H.render();
      refocus('.td-title-btn');
    },
    'td-title-cancel': function () { view.editTitle = false; H.render(); refocus('.td-title-btn'); },
    'td-desc-edit': function () { var t = cur(); if (!t || view.editDesc) return; view.editDesc = true; view.focusDesc = true; view.descDraft = t.desc || ''; H.render(); },
    'td-desc-draft': function (el) { view.descDraft = el.value; },
    'td-desc-save': function () {
      var t = cur(); if (!t) return; var v = view.descDraft.trim(); view.editDesc = false;
      if (v !== (t.desc || '')) H.act.editTicket(t.key, { desc: v }, { kind: 'desc' }, 'Description saved'); else H.render();
      refocus('.td-desc-btn');
    },
    'td-desc-cancel': function () { view.editDesc = false; H.render(); refocus('.td-desc-btn'); },
    'td-sub-toggle': function (el) {
      var t = cur(); if (!t) return; var before = t.status, sid = el.dataset.id, was = (t.subtasks.filter(function (s) { return s.id === sid; })[0] || {}).done;
      view.pop = was ? null : sid;
      H.act.toggleSubtask(t.key, sid);
      var after = q.ticket(t.key);
      if (after && after.status !== before) {
        H.store.commit(function (s) { var x = X.find(s, t.key); if (x) X.log(x, { kind: 'status', from: before, to: after.status, who: 'halo', note: after.status === 'review' ? 'all subtasks done' : 'first subtask done' }); });
        ui.toast(after.status === 'review' ? 'All subtasks done. Moved to In review.' : 'Started. Moved to In progress.', { icon: 'ticket' });
      }
      setTimeout(function () { if (view.pop === sid) { view.pop = null; H.render(); } }, 420);
    },
    'td-sub-add': function (el) {
      var t = cur(), v = (el.value || '').trim(); if (!t || !v) return;
      H.act.addSubtask(t.key, v); el.value = '';
    },
    'td-sub-owner': function (el) {
      var t = cur(); if (!t) return; var s = (t.subtasks || []).filter(function (x) { return x.id === el.dataset.id; })[0]; if (!s) return;
      ui.menu(el, [{ label: 'Owner' }].concat(peopleMenu(['maya', 'sam', 'priya', 'leo', 'hana'], function (id) { return (s.owner || t.owner) === id; }, 'td-sub-owner-set', { 'data-id': s.id, role: 'menuitemradio' })), { width: 230, align: 'end' });
    },
    'td-sub-owner-set': function (el) {
      var t = cur(); if (!t) return; var sid = el.dataset.id, v = el.dataset.v;
      H.store.commit(function (s) { var x = X.find(s, t.key); (x && x.subtasks || []).forEach(function (st) { if (st.id === sid) st.owner = v; }); });
    },
    'td-sub-del': function (el) {
      var t = cur(); if (!t) return; var sid = el.dataset.id, s = t.subtasks.filter(function (x) { return x.id === sid; })[0]; if (!s) return;
      var snap = H.store.snapshot();
      H.store.commit(function (st) { var x = X.find(st, t.key); if (x) x.subtasks = x.subtasks.filter(function (y) { return y.id !== sid; }); });
      ui.toast('Removed “' + (s.title.length > 36 ? s.title.slice(0, 34) + '…' : s.title) + '”', { icon: 'trash', undo: function () { H.store.restore(snap); } });
    },
    'td-suggest': function () {
      var t = cur(); if (!t || (view.suggest && view.suggest.loading)) return; var key = t.key;
      view.suggest = { loading: true, items: [] }; H.render();
      H.ai.decompose(t.title + '\n\n' + (t.desc || '')).then(function (j) {
        if (view.key !== key || !view.suggest) return;
        var have = (t.subtasks || []).map(function (s) { return s.title.toLowerCase(); });
        var raw = j && j.live && j.subtasks && j.subtasks.length ? j.subtasks : demoSuggest(t);
        view.suggest = { loading: false, live: !!(j && j.live), items: raw.filter(function (x) { return x && x.title && have.indexOf(String(x.title).toLowerCase()) < 0; }).slice(0, 6).map(function (x) {
          return { title: String(x.title), o: +x.o || 1, m: +x.m || 2, p: +x.p || 3, owner: H.PEOPLE[x.owner] ? x.owner : t.owner, on: true };
        }) };
        H.render();
      }, function () { if (view.key === key) { view.suggest = { loading: false, error: true, items: [] }; H.render(); } });
    },
    'td-sug-pick': function (el) { var it = view.suggest && view.suggest.items[+el.dataset.i]; if (it) { it.on = !it.on; H.render(); } },
    'td-sug-close': function () { view.suggest = null; H.render(); },
    'td-sug-add': function () {
      var t = cur(); if (!t || !view.suggest) return; var sel = view.suggest.items.filter(function (x) { return x.on; }); if (!sel.length) return;
      var snap = H.store.snapshot();
      H.store.commit(function (s) {
        var x = X.find(s, t.key); if (!x) return;
        sel.forEach(function (it) { x.subtasks.push({ id: U.uid('st'), title: it.title, done: false, est: { o: it.o, m: it.m, p: it.p }, owner: it.owner }); });
        X.log(x, { kind: 'subtasks', n: sel.length, from: 'halo' });
      });
      view.suggest = null;
      ui.toast('Added ' + U.plural(sel.length, 'subtask'), { icon: 'subtasks', undo: function () { H.store.restore(snap); } });
    },
    'td-est-toggle': function () { view.estOpen = !view.estOpen; H.render(); },
    'td-how': function () { view.howOpen = !view.howOpen; H.render(); },
    'td-est-in': function (el) {
      var t = cur(), v = parseFloat(el.value); if (!t || isNaN(v) || v < 0) return; setEst(t, el.dataset.f, Math.min(v, 999));
    },
    'td-est-step': function (el) {
      var t = cur(); if (!t) return; var f = el.dataset.f, e = Object.assign({}, t.est);
      e[f] = Math.max(0, Math.round(((+e[f] || 0) + parseFloat(el.dataset.d)) * 2) / 2);
      if (f === 'o') { if (e.m < e.o) e.m = e.o; if (e.p < e.m) e.p = e.m; }
      if (f === 'm') { if (e.o > e.m) e.o = e.m; if (e.p < e.m) e.p = e.m; }
      if (f === 'p') { if (e.m > e.p) e.m = e.p; if (e.o > e.m) e.o = e.m; }
      H.store.commit(function (s) { var x = X.find(s, t.key); if (x) x.est = e; });
    },
    'td-sub-est': function (el) {
      var t = cur(), v = parseFloat(el.value), sid = el.dataset.id, f = el.dataset.f; if (!t || isNaN(v) || v < 0) return;
      H.store.commit(function (s) { var x = X.find(s, t.key); (x && x.subtasks || []).forEach(function (st) { if (st.id === sid) { st.est = st.est || { o: 0, m: 0, p: 0 }; st.est[f] = Math.min(v, 999); } }); });
    },
    'td-log': function () {
      var key = view.key, tries = 0; ui.open('quickadd', { type: 'time' });
      (function pick() {
        var sel = document.getElementById('qa-ticket');
        if (!sel) { if (tries++ < 12) setTimeout(pick, 30); return; }
        if (Array.prototype.some.call(sel.options, function (o) { return o.value === key; }) && sel.value !== key) { sel.value = key; sel.dispatchEvent(new Event('change', { bubbles: true })); }
      })();
    },
    'td-book': function () { if (view.key) ui.open('booktime', { key: view.key }); },
    'td-cmt-draft': function (el) { var had = !!view.comment.trim(); view.comment = el.value; if (had !== !!view.comment.trim()) H.render(); },
    'td-cmt-send': function () {
      var t = cur(), text = view.comment.trim(); if (!t || !text) return;
      H.act.commentTicket(t.key, text); view.comment = '';
      var ta = document.getElementById('td-cmt'); if (ta) ta.value = '';
    }
  };
  function refocus(sel) { requestAnimationFrame(function () { requestAnimationFrame(function () { var b = document.querySelector(sel); if (b && document.activeElement === document.body) b.focus({ preventScroll: true }); }); }); }

  // Escape cancels inline edits; leaving the title field saves it.
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || !e.target || !e.target.getAttribute || H.route.name !== 'tickets') return;
    var a = e.target.getAttribute('data-esc'); if (a && actions[a]) { e.preventDefault(); actions[a](e.target, e); }
  });
  document.addEventListener('focusout', function (e) {
    if (e.target && e.target.id === 'td-title-in' && view.editTitle) setTimeout(function () { if (view.editTitle && document.activeElement !== document.getElementById('td-title-in')) actions['td-title-save'](); }, 0);
  });

  H.ticketDetail = {
    crumbs: function (r) { return [{ label: 'Tickets', nav: '#/tickets' }, { label: String(r.parts[0] || '').toUpperCase() }]; },
    render: render,
    after: function () {
      if (view.editTitle && view.focusTitle) { var i = document.getElementById('td-title-in'); if (i) { view.focusTitle = false; i.focus(); i.select(); } }
      if (view.editDesc && view.focusDesc) { var ta = document.getElementById('td-desc-in'); if (ta) { view.focusDesc = false; ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); } }
    },
    keys: {
      e: function () { actions['td-title-edit'](); },
      s: function () { var b = document.querySelector('.td-hd .td-status-btn'); if (b) actions['td-status'](b); }
    },
    actions: actions
  };
})(window.H = window.H || {});

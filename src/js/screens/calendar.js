/* Calendar — the week at a glance: meetings, focus time Halo booked, and meetings Halo can cover for you.
   Events are minute offsets from H.now(); the grid runs 8:00 to 18:00. */
(function (H) {
  'use strict';
  var esc = H.esc, ui = H.ui, q = H.q, F = H.fmt, U = H.util;
  var START = 8, END = 18, PXH = 72, PXM = PXH / 60;
  var view = { day: null, scrolled: false, handledE: null };
  var mq = window.matchMedia ? matchMedia('(max-width: 760px)') : null;
  function phone() { return !!(mq && mq.matches); }
  if (mq) {
    var onMq = function () { if (H.route && H.route.name === 'calendar') { view.scrolled = false; H.render(); } };
    try { mq.addEventListener('change', onMq); } catch (e) { if (mq.addListener) mq.addListener(onMq); }
  }

  /* ---------- Helpers ---------- */
  function today() { return U.startOfDay(H.now()); }
  function isWeekend(d) { var w = d.getDay(); return w === 0 || w === 6; }
  function biz(d, n) { var x = new Date(d), step = n < 0 ? -1 : 1, left = Math.abs(n); while (left > 0) { x = U.addDays(x, step); if (!isWeekend(x)) left--; } return x; }
  function selDay() { var d = view.day || today(); while (isWeekend(d)) d = U.addDays(d, 1); return d; }
  function mode() { return phone() ? 'day' : (H.store.state.prefs.calView === 'day' ? 'day' : 'week'); }
  function evById(id) { return H.store.state.events.filter(function (e) { return e.id === id; })[0]; }
  function minOfDay(d) { return d.getHours() * 60 + d.getMinutes(); }
  function hourLabel(h) { return (h % 12 || 12) + ' ' + (h >= 12 ? 'PM' : 'AM'); }
  function weekLabel(ws) { var we = U.addDays(ws, 4); return F.date(ws) + ' – ' + (ws.getMonth() === we.getMonth() ? we.getDate() : F.date(we)); }
  function people(e) { return (e.people || []).map(q.person).filter(Boolean); }
  function firstNames(list) { var n = list.map(function (p) { return p.name.split(' ')[0]; }); return n.length < 2 ? n.join('') : n.slice(0, -1).join(', ') + ' and ' + n[n.length - 1]; }
  function coverable(e) { return e.kind === 'meeting' && !e.private && (e.cover != null || e.suggestSkip); }
  function covering(e) { return e.halo != null ? !!e.halo : !!(e.cover && !e.suggestSkip); }
  function state(e) {
    var s = { kind: e.kind === 'focus' ? 'focus' : e.private ? 'private' : 'meeting', past: e.end <= 0, live: e.start <= 0 && e.end > 0 };
    if (coverable(e)) {
      if (e.suggestSkip && e.covered) s.cover = 'skipped';
      else if (s.past && e.covered) s.cover = 'done';
      else if (!s.past && covering(e)) s.cover = 'on';
      else if (!s.past && e.suggestSkip && !e.keep) s.cover = 'suggest';
    }
    if (e.recap) s.recap = true;
    return s;
  }
  function chip(s, compact) {
    var c = function (cls, icon, text, tip) { return '<span class="cal-chip' + cls + '"' + (tip ? ' data-tip="' + esc(tip) + '"' : '') + '>' + H.icon(icon, 12) + (compact ? '' : '<span>' + text + '</span>') + '</span>'; };
    if (s.cover === 'on') return c(' is-accent', 'sparkle', 'Halo covers this', 'Halo posts your update, so you can skip it');
    if (s.cover === 'suggest') return c(' is-accent', 'sparkle', 'Halo can cover this', 'Halo can send your update instead of you attending');
    if (s.cover === 'done') return c(' is-ok', 'check', 'Update posted', 'Halo posted your update');
    if (s.cover === 'skipped') return c(' is-ok', 'check', 'Update sent', 'You’re skipping this. Halo sent your update.');
    if (s.recap && s.past) return c(' is-info', 'wand', 'Recap ready', 'Halo wrote a recap and drafted tickets');
    if (s.kind === 'private') return c('', 'lock', 'Private', 'Private. Never shared.');
    return '';
  }
  // Side-by-side columns for overlapping events.
  function layout(list) {
    var out = [], cluster = [], cols = [], end = -Infinity;
    var flush = function () { cluster.forEach(function (x) { x.cols = cols.length; }); cluster = []; cols = []; };
    list.forEach(function (e) {
      if (e.start >= end) { flush(); end = -Infinity; }
      var x = { e: e, col: 0, cols: 1 }, placed = false;
      for (var i = 0; i < cols.length; i++) if (cols[i] <= e.start) { cols[i] = e.end; x.col = i; placed = true; break; }
      if (!placed) { cols.push(e.end); x.col = cols.length - 1; }
      end = Math.max(end, e.end); cluster.push(x); out.push(x);
    });
    flush();
    return out;
  }

  /* ---------- Actions added to H.act ---------- */
  function patchEvent(id, fn) { H.store.commit(function (s) { var x = s.events.filter(function (y) { return y.id === id; })[0]; if (x) fn(x, s); }); }
  H.act.skipMeeting = function (id) {
    var e = evById(id); if (!e) return null;
    var snap = H.store.snapshot(), hid = U.uid('h');
    H.act.post(q.statusLine('manager'), 'manager', { id: hid, sources: [['halo', 'Sent instead of attending ' + e.title]] });
    patchEvent(id, function (x) { x.halo = true; x.covered = true; x.postedId = hid; });
    return snap;
  };
  H.act.unskipMeeting = function (id) {
    var e = evById(id); if (!e) return;
    patchEvent(id, function (x, s) { s.history.forEach(function (h) { if (h.id === x.postedId) h.retracted = true; }); x.halo = false; x.covered = false; delete x.postedId; });
    ui.toast('You’ll attend ' + e.title + '. Halo retracted the update it sent.', { icon: 'undo' });
  };
  H.act.setCover = function (id, on) {
    var e = evById(id); if (!e) return;
    if (e.suggestSkip) { if (on && !e.covered) H.act.skipMeeting(id); else if (!on && e.covered) H.act.unskipMeeting(id); return; }
    patchEvent(id, function (x) { x.halo = !!on; });
    ui.toast(on ? 'Halo will post your update for ' + e.title + '.' : 'You’ll attend ' + e.title + '. Halo won’t post for you.', { icon: on ? 'sparkle' : 'calendar' });
  };
  H.act.releaseEvent = function (id) {
    var e = evById(id); if (!e) return;
    var snap = H.store.snapshot();
    H.store.commit(function (s) { s.events = s.events.filter(function (x) { return x.id !== id; }); });
    ui.toast('Released ' + F.hm(e.end - e.start) + (e.ticket ? ' of focus time for ' + e.ticket : ''), { icon: 'calendar', undo: function () { H.store.restore(snap); } });
  };

  /* ---------- Grid ---------- */
  function evBlock(x, m) {
    var e = x.e, a = H.at(e.start), b = H.at(e.end), s = state(e), t = e.ticket ? q.ticket(e.ticket) : null;
    var top = (minOfDay(a) - START * 60) * PXM, h = (e.end - e.start) * PXM;
    if (top < 0) { h += top; top = 0; }
    h = Math.min(h, (END - START) * PXH - top);
    var hh = Math.max(20, h - 2), size = hh < 30 ? 'tiny' : hh < 52 ? 'small' : 'tall', day = m === 'day';
    var w = 100 / x.cols;
    var style = 'top:' + top.toFixed(1) + 'px;height:' + hh.toFixed(1) + 'px;left:calc(' + (x.col * w).toFixed(3) + '% + 2px);width:calc(' + w.toFixed(3) + '% - 4px)';
    var label = (e.kind === 'focus' ? 'Focus time for ' + (e.ticket || 'your work') : e.title) + ', ' + F.range(a, b) + ({ on: ', Halo covers this', suggest: ', Halo can cover this', done: ', Halo posted your update', skipped: ', you’re skipping this' }[s.cover] || '') + (s.kind === 'private' ? ', private' : '');
    var inner;
    if (s.kind === 'focus') {
      inner = '<span class="cal-ev-line"><span class="cal-ev-key">' + esc(e.ticket || 'Focus') + '</span>' + (day ? '<span class="cal-ev-time">' + F.range(a, b) + '</span>' : '') + '</span>' +
        (size !== 'tiny' && t ? '<span class="cal-ev-sub truncate">' + esc(t.title) + '</span>' : '') +
        (size === 'tall' || (day && size !== 'tiny') ? '<span class="cal-ev-by">' + (e.booked ? 'Booked by Halo' : 'Focus time') + '</span>' : '');
    } else {
      var who = people(e).filter(function (p) { return p.id !== H.store.state.me; });
      inner = '<span class="cal-ev-line">' + (s.kind === 'private' ? H.icon('lock', 12, 'cal-ev-lock') : '') + '<span class="cal-ev-title truncate">' + esc(e.title) + '</span>' +
        (size === 'tiny' || !day ? '' : '<span class="cal-ev-time">' + F.range(a, b) + '</span>') + '</span>' +
        (size !== 'tiny' && !day ? '<span class="cal-ev-sub">' + F.range(a, b) + '</span>' : '') +
        (day && size === 'tall' && who.length ? '<span class="cal-ev-people">' + ui.avatarStack(who, 'xs', 5) + '<span>' + esc(firstNames(who.slice(0, 3))) + (who.length > 3 ? ' and ' + (who.length - 3) + ' more' : '') + '</span></span>' : '');
    }
    var c = chip(s, !day || size === 'tiny');
    return '<button type="button" class="cal-ev is-' + s.kind + ' is-' + size + (s.past ? ' is-past' : '') + (s.live ? ' is-live' : '') + (s.cover === 'skipped' ? ' is-skipped' : '') + (x.cols > 1 ? ' is-narrow' : '') + '" style="' + style + '" data-action="cal-ev" data-id="' + esc(e.id) + '" data-key="ev-' + esc(e.id) + '" aria-label="' + esc(label) + '">' +
      inner + (c ? '<span class="cal-ev-chip">' + c + '</span>' : '') + '</button>';
  }
  function grid(days, m) {
    var now = H.now(), nowMin = minOfDay(now), gridH = (END - START) * PXH, tz = { Pacific: 'PT', Eastern: 'ET', Central: 'CT', Mountain: 'MT' }[(q.me() || {}).tz] || '';
    var head = '<div class="cal-head" style="--cols:' + days.length + '"><div class="cal-gutter"><span>' + tz + '</span></div>' + days.map(function (d) {
      var isT = U.sameDay(d, now), off = U.dayDiff(d, now), evs = q.eventsOn(d), meet = evs.filter(function (e) { return e.kind === 'meeting'; }).length;
      var focus = evs.filter(function (e) { return e.kind === 'focus'; }).reduce(function (a, e) { return a + (e.end - e.start); }, 0);
      var inner = '<span class="cal-dh-dow">' + F.dow(d) + '</span><span class="cal-dh-num">' + d.getDate() + '</span>' +
        (m === 'day' ? '<span class="cal-dh-sum">' + U.plural(meet, 'meeting') + (focus ? ' · ' + F.hm(focus) + ' focus booked' : '') + '</span>' : '');
      return m === 'week'
        ? '<button type="button" class="cal-dh' + (isT ? ' is-today' : '') + (off < 0 ? ' is-past' : '') + '" data-action="cal-open-day" data-d="' + off + '" aria-label="' + F.dateLong(d) + (isT ? ', today' : '') + '. Open the day" data-tip="Open ' + F.weekday(d) + '">' + inner + '</button>'
        : '<div class="cal-dh' + (isT ? ' is-today' : '') + (off < 0 ? ' is-past' : '') + '">' + inner + '</div>';
    }).join('') + '</div>';
    var labels = ''; for (var hr = START + 1; hr < END; hr++) labels += '<span class="cal-hr" style="top:' + ((hr - START) * PXH) + 'px">' + hourLabel(hr) + '</span>';
    var cols = days.map(function (d) {
      var isT = U.sameDay(d, now), list = q.eventsOn(d);
      return '<div class="cal-col' + (isT ? ' is-today' : '') + (U.dayDiff(d, now) < 0 ? ' is-past' : '') + '" data-key="cc-' + d.getMonth() + '-' + d.getDate() + '">' +
        layout(list).map(function (x) { return evBlock(x, m); }).join('') +
        (isT && nowMin >= START * 60 && nowMin <= END * 60 ? '<div class="cal-now" style="top:' + ((nowMin - START * 60) * PXM).toFixed(1) + 'px" data-tip="Now, ' + F.time(now) + '"></div>' : '') +
        (!list.length ? '<div class="cal-free">' + (isWeekend(d) ? '' : 'Nothing booked') + '</div>' : '') + '</div>';
    }).join('');
    return '<div class="cal-scroll" id="cal-scroll">' + head + '<div class="cal-grid" style="--cols:' + days.length + ';height:' + gridH + 'px"><div class="cal-times" aria-hidden="true">' + labels + '</div>' + cols + '</div></div>';
  }

  /* ---------- Toolbar, picker, rail ---------- */
  function bar(m, d) {
    var ws = U.weekStart(d), isNow = m === 'week' ? U.sameDay(ws, U.weekStart(H.now())) : U.sameDay(d, H.now());
    var title = m === 'week' ? weekLabel(ws) : F.weekday(d) + ', ' + F.date(d);
    var rel = isNow ? '' : m === 'week' ? (function () { var n = Math.round(U.dayDiff(ws, U.weekStart(H.now())) / 7); return n === 1 ? 'Next week' : n === -1 ? 'Last week' : n > 0 ? 'In ' + n + ' weeks' : Math.abs(n) + ' weeks ago'; })() : F.day(d);
    return '<div class="cal-bar">' +
      ui.btn('Today', { size: 'sm', action: 'cal-today', attrs: { 'data-tip': F.dateLong(H.now()), 'data-kbd': 'T' } }) +
      '<div class="cal-nav">' + ui.iconBtn('chevron-left', m === 'week' ? 'Previous week' : 'Previous day', 'cal-prev', { size: 'sm', attrs: { 'data-kbd': '←' } }) + ui.iconBtn('chevron-right', m === 'week' ? 'Next week' : 'Next day', 'cal-next', { size: 'sm', attrs: { 'data-kbd': '→' } }) + '</div>' +
      '<h1 class="cal-title">' + title + '</h1>' + (rel && rel !== 'Today' ? '<span class="cal-rel hide-phone">' + rel + '</span>' : '') +
      '<div class="cal-bar-end">' + '<span class="hide-phone">' + ui.seg('calView', [{ v: 'day', label: 'Day', tip: 'Day view (D)' }, { v: 'week', label: 'Week', tip: 'Week view (W)' }], m, { size: 'sm', label: 'Calendar view' }) + '</span>' +
        '<button type="button" class="btn btn-primary btn-sm cal-book" data-action="cal-book" aria-label="Book focus time">' + H.icon('calendar-plus', 16) + '<span class="cal-book-label">Book focus time</span></button></div></div>';
  }
  function picker(d) {
    var ws = U.weekStart(d);
    return '<div class="cal-picker" role="group" aria-label="Choose a day">' + [0, 1, 2, 3, 4].map(function (i) {
      var x = U.addDays(ws, i), sel = U.sameDay(x, d), isT = U.sameDay(x, H.now()), n = q.eventsOn(x).length;
      return '<button type="button" class="cal-pick' + (isT ? ' is-today' : '') + '" aria-pressed="' + sel + '" data-action="cal-pick" data-d="' + U.dayDiff(x, H.now()) + '" aria-label="' + F.dateLong(x) + (isT ? ', today' : '') + '">' +
        '<span class="cal-pick-dow">' + F.dow(x) + '</span><span class="cal-pick-num">' + x.getDate() + '</span><span class="cal-pick-dot' + (n ? '' : ' is-empty') + '"></span></button>';
    }).join('') + '</div>';
  }
  function rail() {
    var c = q.capacity(), over = c.need - c.free, wd = (H.now().getDay() + 6) % 7, left = 5 - wd;
    var fill = c.need <= c.free ? (c.free ? c.need / c.free : 0) : (c.need ? c.free / c.need : 0);
    var meter = '<div class="cal-meter" role="img" aria-label="' + F.hours(c.need) + ' of work due and ' + F.hours(c.free) + ' of focus time left">' +
      '<span class="cal-meter-fill" style="width:' + (fill * 100).toFixed(1) + '%"></span>' + (over > 0.5 ? '<span class="cal-meter-over"></span>' : '') + '</div>';
    var verdict = over > 0.5
      ? '<p class="cal-verdict is-warn">' + H.icon('alert', 14) + '<span>About <b>' + F.hours(over) + '</b> more than fits in the next 5 workdays.</span></p>'
      : '<p class="cal-verdict is-ok">' + H.icon('check-circle', 14) + '<span>It fits, with about <b>' + F.hours(-over) + '</b> to spare.</span></p>';
    var cap = '<section class="cal-sec"><div class="cal-sec-hd"><h2>Capacity</h2><span class="sub">Next 5 workdays</span></div>' +
      '<div class="cal-cap"><div><span class="cal-cap-num">' + F.hours(c.need) + '</span><span class="cal-cap-lbl">Work due</span></div><div><span class="cal-cap-num">' + F.hours(c.free) + '</span><span class="cal-cap-lbl">Focus time</span></div></div>' + meter + verdict + '</section>';

    var ws = U.weekStart(H.now()), horizon = H.minOf(U.addDays(today(), 8)), all = q.events().filter(coverable);
    var upcoming = all.filter(function (e) { return e.end > 0 && e.start < horizon; });
    var done = all.filter(function (e) { return e.end <= 0 && e.covered && H.at(e.start) >= ws; });
    var cover = '<section class="cal-sec"><div class="cal-sec-hd"><h2>Halo can cover</h2><span class="sub">Next 7 days</span></div>' +
      (upcoming.length ? '<div class="cal-list">' + upcoming.map(function (e) {
        var s = state(e), on = s.cover === 'on' || s.cover === 'skipped', a = H.at(e.start);
        return '<div class="cal-row" data-key="cv-' + esc(e.id) + '"><button type="button" class="cal-row-main" data-action="cal-ev" data-id="' + esc(e.id) + '"><span class="cal-row-title truncate">' + esc(e.title) + '</span>' +
          '<span class="cal-row-sub">' + F.day(a) + ', ' + F.time(a) + (s.cover === 'suggest' ? ' · <span class="c-accent">Suggested</span>' : s.cover === 'skipped' ? ' · Update sent' : '') + '</span></button>' +
          ui.switch(on, 'cal-cover', { 'data-id': e.id, 'aria-label': 'Let Halo cover ' + e.title + ' on ' + F.day(a), class: 'switch switch-sm' }) + '</div>';
      }).join('') + '</div>' : '<p class="cal-empty">Nothing else Halo can cover in the next week.</p>') +
      (done.length ? '<p class="cal-covered">' + H.icon('check-circle', 14) + '<span>Halo covered ' + U.plural(done.length, 'meeting') + ' for you this week.</span></p>' : '') + '</section>';

    var focus = q.events().filter(function (e) { return e.kind === 'focus' && e.end > 0; }).slice(0, 4);
    var fb = '<section class="cal-sec"><div class="cal-sec-hd"><h2>Focus booked</h2><div class="ml-auto">' + ui.iconBtn('plus', 'Book focus time', 'cal-book', { size: 'sm', iconSize: 16 }) + '</div></div>' +
      (focus.length ? '<div class="cal-list">' + focus.map(function (e) {
        var a = H.at(e.start), t = e.ticket ? q.ticket(e.ticket) : null;
        return '<button type="button" class="cal-focus" data-action="cal-ev" data-id="' + esc(e.id) + '" data-key="fb-' + esc(e.id) + '"><span class="cal-focus-bar"></span><span class="grow" style="min-width:0">' +
          '<span class="cal-row-title truncate"><span class="key">' + esc(e.ticket || 'Focus') + '</span> ' + esc(t ? t.title : 'Focus time') + '</span>' +
          '<span class="cal-row-sub">' + F.day(a) + ', ' + F.range(a, H.at(e.end)) + '</span></span></button>';
      }).join('') + '</div>' : '<p class="cal-empty">No focus time booked yet. Halo finds open time and protects it.</p>') + '</section>';
    return '<aside class="cal-rail" aria-label="Capacity and coverage">' + cap + cover + fb + '</aside>';
  }

  function render() {
    var m = mode(), d = selDay(), ws = U.weekStart(d);
    var days = m === 'week' ? [0, 1, 2, 3, 4].map(function (i) { return U.addDays(ws, i); }) : [d];
    return '<div class="cal cal-' + m + '">' + bar(m, d) + (phone() ? picker(d) : '') +
      '<div class="cal-body"><div class="cal-main">' + grid(days, m) + '</div>' + rail() + '</div></div>';
  }

  /* ---------- Event sheet ---------- */
  function sheetBody(e) {
    var s = state(e), a = H.at(e.start), b = H.at(e.end), me = H.store.state.me, ppl = people(e), t = e.ticket ? q.ticket(e.ticket) : null, parts = [];
    var srcRow = s.kind === 'focus'
      ? '<div class="cal-sh-row"><span class="cal-sh-ic">' + ui.mark(16) + '</span><div><div class="cal-sh-main">' + (e.booked ? 'Booked by Halo' : 'Focus time') + '</div><div class="cal-sh-sub">Shows as “Focus” on your Google Calendar. Ticket details stay private.</div></div></div>'
      : '<div class="cal-sh-row"><span class="cal-sh-ic">' + H.brandTile(e.src === 'zoom' ? 'zoom' : 'gcal', 28) + '</span><div><div class="cal-sh-main">' + (e.src === 'zoom' ? 'Zoom meeting' : 'Google Calendar') + '</div><div class="cal-sh-sub">' + (e.src === 'zoom' ? 'Transcript and recap come from Zoom' : e.recurring ? 'Repeats every weekday' : 'Synced from your work calendar') + '</div></div></div>';
    parts.push('<div class="cal-sh-sec"><div class="cal-sh-row"><span class="cal-sh-ic">' + H.icon('clock', 16) + '</span><div><div class="cal-sh-main">' + F.dateLong(a) + '</div><div class="cal-sh-sub">' + F.range(a, b) + ' · ' + F.hm(e.end - e.start) + (s.live ? ' · <span class="c-accent">Happening now</span>' : s.past ? ' · Ended ' + F.rel(b) : ' · Starts ' + F.rel(a)) + '</div></div></div>' + srcRow + '</div>');

    // Context: what Halo can do with this event
    if (s.kind === 'private') {
      parts.push('<div class="cal-sh-sec"><div class="banner">' + H.icon('lock', 16) + '<span><strong>Private. Never shared.</strong> Halo can see this time is busy, but never reads it or mentions it in an update.</span></div></div>');
    } else if (s.kind === 'focus') {
      parts.push('<div class="cal-sh-sec">' + (t ? '<a class="cal-sh-ticket" href="#/tickets/' + esc(t.key) + '" data-nav="#/tickets/' + esc(t.key) + '">' + ui.status(t.status) + '<span class="grow" style="min-width:0"><span class="key">' + esc(t.key) + '</span><span class="cal-sh-ticket-title truncate">' + esc(t.title) + '</span></span>' +
          '<span class="cal-sh-sub nowrap">' + (t.status === 'done' ? 'Done' : F.hours(q.remaining(t) * q.pace()) + ' left') + '</span>' + H.icon('chevron-right', 16, 'c-3') + '</a>'
          : '<div class="banner">' + H.icon('info', 16) + '<span>The ticket for this block no longer exists.</span></div>') +
        '<div class="cal-sh-actions">' + ui.btn('Release this time', { kind: 'danger', size: 'sm', icon: 'x-circle', action: 'cal-sh-release', attrs: { 'data-id': e.id } }) + '<span class="hint">Frees the slot on your calendar.</span></div></div>');
    } else {
      if (s.cover === 'suggest') {
        parts.push('<div class="cal-sh-sec"><div class="cal-rec"><div class="cal-rec-kicker">' + H.icon('sparkle', 14) + 'Halo’s suggestion</div><h3>Halo can send your update instead of attending</h3>' +
          '<p>This is a status round. What you’d say is already in your manager-level update, so Halo can send it to everyone here before it starts.</p>' +
          '<div class="text-block cal-rec-quote">' + esc(q.statusLine('manager')) + '</div>' +
          '<div class="cal-sh-actions">' + ui.btn('Skip and send update', { kind: 'primary', size: 'sm', icon: 'send', action: 'cal-sh-skip', attrs: { 'data-id': e.id } }) + ui.btn('Keep it', { kind: 'ghost', size: 'sm', action: 'cal-sh-keep', attrs: { 'data-id': e.id } }) + '</div></div></div>');
      } else if (s.cover === 'skipped') {
        var others = ppl.filter(function (p) { return p.id !== me; });
        parts.push('<div class="cal-sh-sec"><div class="banner banner-success">' + H.icon('check-circle', 16) + '<span class="grow"><strong>You’re skipping this.</strong> Halo sent your update to ' + esc(firstNames(others)) + '.</span>' +
          ui.btn('Undo', { size: 'xs', action: 'cal-sh-unskip', attrs: { 'data-id': e.id } }) + '</div></div>');
      } else if (s.cover === 'done') {
        var sent = q.published().filter(function (p) { return (p.id === 'd3' && U.sameDay(H.at(e.start), H.now())) || (/^standup/i.test(p.text || '') && U.sameDay(H.at(p.t), a)); })[0];
        parts.push('<div class="cal-sh-sec"><div class="banner banner-success">' + H.icon('check-circle', 16) + '<span><strong>Halo posted your update' + (sent ? ' at ' + F.time(H.at(sent.t)) : '') + '.</strong> You didn’t need to join.</span></div>' +
          (sent ? '<div class="text-block cal-rec-quote mt-3">' + esc(sent.text) + '</div>' : '') + '</div>');
      } else if (coverable(e) && !s.past) {
        var on = covering(e), isStand = /standup/i.test(e.title);
        parts.push('<div class="cal-sh-sec"><div class="cal-sh-switch">' + '<div class="grow"><div class="cal-sh-main">Let Halo cover this</div><div class="cal-sh-sub">' +
          (on ? 'Halo posts your update' + (isStand ? ' in #checkout-standup' : ' to everyone invited') + ' before it starts, so you can skip it. The invite stays on your calendar.' : 'You’ll attend. Turn this on and Halo posts your update instead.') + '</div></div>' +
          ui.switch(on, 'cal-sh-cover', { 'data-id': e.id, 'aria-label': 'Let Halo cover ' + e.title }) + '</div></div>');
      }
      if (e.recap) {
        var rc = H.store.state.recaps[e.recap] || {}, made = rc.created && q.ticket(rc.created);
        parts.push('<div class="cal-sh-sec"><div class="cal-sh-recap"><span class="cal-sh-ic">' + H.icon('wand', 16) + '</span><div class="grow"><div class="cal-sh-main">' + (made ? 'You created ' + esc(made.key) + ' from this meeting' : 'Recap ready') + '</div>' +
          '<div class="cal-sh-sub">' + (made ? esc(made.title) + ', with ' + U.plural((made.subtasks || []).length, 'subtask') + '.' : 'Halo summarized the decisions and drafted 1 ticket with 6 estimated subtasks.') + '</div></div></div>' +
          '<div class="cal-sh-actions">' + ui.btn('Open recap', { kind: made ? '' : 'primary', size: 'sm', icon: 'wand', action: 'nav', attrs: { 'data-to': '#/recap/' + e.recap } }) + (made ? ui.btn('Open ' + made.key, { kind: 'primary', size: 'sm', action: 'nav', attrs: { 'data-to': '#/tickets/' + made.key } }) : '') + '</div></div>');
      }
      if (ppl.length) {
        parts.push('<div class="cal-sh-sec"><div class="cal-sh-label">' + U.plural(ppl.length + (e.extra || 0), 'person', 'people') + '</div><ul class="cal-sh-people">' + ppl.map(function (p) {
          return '<li>' + ui.avatar(p, 'md', { tip: false }) + '<div class="grow" style="min-width:0"><div class="cal-sh-main truncate">' + esc(p.name) + (p.id === me ? ' <span class="c-3">(you)</span>' : '') + '</div><div class="cal-sh-sub truncate">' + esc(p.role) + '</div></div></li>';
        }).join('') + (e.extra ? '<li><span class="avatar md avatar-more">+' + e.extra + '</span><div class="cal-sh-sub">' + e.extra + ' more from Design</div></li>' : '') + '</ul></div>');
      }
    }
    return parts.join('');
  }
  H.overlays.calevent = {
    kind: 'sheet', title: 'Event details',
    render: function (p) {
      var e = evById(p.id);
      if (!e) return '<div class="sheet-hd"><h2 class="t-title-3 grow">Event</h2>' + ui.iconBtn('x', 'Close', 'close') + '</div><div class="sheet-bd">' + ui.empty('calendar', 'This event is gone', 'It isn’t on your calendar anymore. It may have been released or moved.') + '</div>';
      var s = state(e), icon = s.kind === 'focus' ? 'focus' : s.kind === 'private' ? 'lock' : 'calendar';
      var title = s.kind === 'focus' ? 'Focus' + (e.ticket ? ' · ' + e.ticket : '') : e.title;
      return '<div class="sheet-hd cal-sh-hd"><span class="cal-sh-kind is-' + s.kind + '">' + H.icon(icon, 16) + '</span><h2 class="t-title-3 grow truncate">' + esc(title) + '</h2>' + ui.iconBtn('x', 'Close', 'close') + '</div>' +
        '<div class="sheet-bd cal-sh">' + sheetBody(e) + '</div>';
    },
    actions: {
      'cal-sh-cover': function (el) { var e = evById(el.dataset.id); if (e) H.act.setCover(e.id, !covering(e)); },
      'cal-sh-skip': function (el) { H.act.skipMeeting(el.dataset.id); },
      'cal-sh-unskip': function (el) { H.act.unskipMeeting(el.dataset.id); },
      'cal-sh-keep': function (el) { patchEvent(el.dataset.id, function (x) { x.keep = true; }); ui.toast('Okay. It stays on your calendar, and Halo won’t suggest skipping it again.', { icon: 'calendar' }); },
      'cal-sh-release': function (el) { var id = el.dataset.id; ui.close(true); H.act.releaseEvent(id); }
    }
  };

  /* ---------- Screen ---------- */
  function move(n) {
    var m = mode(), d = selDay();
    view.day = m === 'week' ? U.addDays(U.weekStart(d), n * 7 + Math.min(4, (d.getDay() + 6) % 7)) : biz(d, n);
    H.render();
  }
  function goToday() { view.day = null; H.render(); var sc = document.getElementById('cal-scroll'); if (sc) sc.scrollTo({ top: 0.5 * PXH, behavior: 'smooth' }); }
  H.screens.calendar = {
    title: 'Calendar', crumbs: function () { return [{ label: 'Calendar' }]; }, pageClass: 'full',
    render: render,
    after: function (root, r) {
      var sc = document.getElementById('cal-scroll');
      if (sc && !view.scrolled) { view.scrolled = true; sc.scrollTop = 0.5 * PXH; }
      var id = r.query && r.query.e;
      if (id && view.handledE !== id) {
        view.handledE = id; var e = evById(id);
        if (e) { view.day = U.startOfDay(H.at(e.start)); H.render(); }
        setTimeout(function () { if (H.route.name === 'calendar') ui.open('calevent', { id: id }); }, 0);
      } else if (!id) view.handledE = null;
    },
    leave: function () { view.scrolled = false; view.handledE = null; },
    keys: {
      t: goToday, ArrowLeft: function () { move(-1); }, ArrowRight: function () { move(1); },
      d: function () { H.act.setPref('calView', 'day'); }, w: function () { H.act.setPref('calView', 'week'); }
    },
    actions: {
      'cal-today': goToday,
      'cal-prev': function () { move(-1); },
      'cal-next': function () { move(1); },
      'cal-book': function () { ui.open('booktime', {}); },
      'cal-open-day': function (el) { view.day = U.addDays(today(), +el.dataset.d); H.act.setPref('calView', 'day'); },
      'cal-pick': function (el) { view.day = U.addDays(today(), +el.dataset.d); H.render(); },
      'cal-ev': function (el) { ui.open('calevent', { id: el.dataset.id }); },
      'cal-cover': function (el) { var e = evById(el.dataset.id); if (!e) return; var s = state(e); H.act.setCover(e.id, !(s.cover === 'on' || s.cover === 'skipped')); }
    }
  };
})(window.H = window.H || {});

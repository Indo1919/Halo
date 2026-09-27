/* State, persistence, selectors (H.q) and actions (H.act). */
(function (H) {
  'use strict';
  var KEY = 'halo.workspace.v3', U = H.util;
  var store = H.store = { state: null };

  store.load = function () {
    var saved = H.storage.get(KEY, null);
    store.state = saved && saved.v === 3 ? saved : H.seed();
    // Fill any keys added after the save was written.
    var fresh = H.seed();
    Object.keys(fresh).forEach(function (k) { if (store.state[k] === undefined) store.state[k] = fresh[k]; });
    Object.keys(fresh.prefs).forEach(function (k) { if (store.state.prefs[k] === undefined) store.state.prefs[k] = fresh.prefs[k]; });
    return store.state;
  };
  var saveSoon = U.debounce(function () { H.storage.set(KEY, store.state); }, 250);
  store.save = saveSoon;
  store.commit = function (fn, o) {
    fn(store.state); saveSoon();
    if (!o || o.render !== false) H.render();
  };
  store.snapshot = function () { return U.clone(store.state); };
  store.restore = function (snap) { store.state = snap; saveSoon(); H.render(); };
  store.reset = function (keepSession) {
    var s = H.seed();
    if (keepSession) { s.session = Object.assign({}, store.state.session); s.prefs = Object.assign({}, store.state.prefs); }
    store.state = s; H.storage.set(KEY, s); H.render();
  };

  /* ---------------- Selectors ---------------- */
  var q = H.q = {};
  q.me = function () { return H.PEOPLE[store.state.me]; };
  q.person = function (id) { return H.PEOPLE[id]; };
  q.mode = function () { return store.state.prefs.mode; };
  q.ticket = function (key) { return store.state.tickets.filter(function (t) { return t.key === key; })[0]; };
  q.myTickets = function () { return store.state.tickets.filter(function (t) { return t.owner === store.state.me; }); };
  q.progress = function (t) {
    if (!t.subtasks || !t.subtasks.length) return t.status === 'done' ? 1 : t.status === 'review' ? 0.9 : t.status === 'progress' ? 0.4 : 0;
    return t.subtasks.filter(function (s) { return s.done; }).length / t.subtasks.length;
  };
  q.estimate = function (t) {
    var subs = (t.subtasks || []).filter(function (s) { return s.est; });
    return subs.length ? U.rollup(subs) : U.pert(t.est.o, t.est.m, t.est.p);
  };
  q.remaining = function (t) {
    if (t.status === 'done') return 0;
    var subs = (t.subtasks || []).filter(function (s) { return !s.done && s.est; });
    if (t.subtasks && t.subtasks.length) return U.rollup(subs).mean;
    return Math.max(0, U.pert(t.est.o, t.est.m, t.est.p).mean - (t.logged || 0));
  };
  // Pace: your actual time vs. estimate on finished work (history of completed tickets).
  var PACE = [1.1, 1.25, 0.92, 1.18, 1.08, 1.21, 0.97, 1.14];
  q.pace = function () { return PACE.reduce(function (a, b) { return a + b; }, 0) / PACE.length; };
  q.paceHistory = function () { return PACE.slice(); };

  q.digest = function () {
    var s = store.state, mode = s.prefs.mode;
    return s.digest.items.map(function (it) {
      var d = s.digest.decisions[it.id], status;
      if (d) status = d.status;
      else if (mode === 'curated') status = 'pending';
      else if (mode === 'balanced') status = it.sensitive ? 'pending' : 'auto';
      else status = it.private ? 'dropped' : 'auto';
      return Object.assign({}, it, { status: status, text: (d && d.text) || it.text, audience: (d && d.audience) || it.audience, decidedAt: d && d.t, edited: !!(d && d.text) });
    });
  };
  q.pending = function () { return q.digest().filter(function (i) { return i.status === 'pending'; }); };
  q.pendingCount = function () { return store.state.privacy.paused ? 0 : q.pending().length; };
  // Everything published, newest first: today's published digest items + history.
  q.published = function () {
    var today = q.digest().filter(function (i) { return i.status === 'auto' || i.status === 'approved'; }).map(function (i) {
      return { id: i.id, t: i.decidedAt != null ? i.decidedAt : i.t, audience: i.audience, via: i.status === 'auto' ? 'auto' : 'approved', text: i.text, sources: i.sources, ticket: i.ticket, digest: true };
    });
    return today.concat(store.state.history.filter(function (h) { return !h.retracted; })).sort(function (a, b) { return b.t - a.t; });
  };
  q.statusLine = function (audience) {
    // What Halo is currently saying about you, per audience. Built from published items only.
    var lines = {
      team: 'Payment method selector is in hi-fi (cards and bank transfer done, wallets next). Wallet placement is in review with Sam, and error-state flows land Thursday.',
      manager: 'Checkout v3 design is moving: payment methods in hi-fi, wallet placement in review, error states kicked off today. Invoice PDF header shipped this week.',
      exec: 'Checkout v3 design is on track for October. Invoice PDF improvements shipped this week.'
    };
    var d = q.digest(), estApproved = d.filter(function (i) { return i.id === 'd9' && (i.status === 'approved' || i.status === 'auto'); }).length;
    if (estApproved) { lines.manager += ' The selector moves to Thursday.'; lines.team += ' Selector target is now Thursday.'; }
    return lines[audience || 'team'];
  };
  q.redactedCount = function () { return q.digest().filter(function (i) { return i.private && i.status !== 'approved'; }).length; };
  q.events = function () { return store.state.events.slice().sort(function (a, b) { return a.start - b.start; }); };
  q.eventsOn = function (date) { return q.events().filter(function (e) { return U.sameDay(H.at(e.start), date); }); };
  q.nextEvent = function () { return q.events().filter(function (e) { return e.start > 0 && U.sameDay(H.at(e.start), H.now()); })[0]; };
  q.justEnded = function () { return q.events().filter(function (e) { return e.recap && e.end <= 0 && e.end > -180; })[0]; };
  q.capacity = function () {
    // Rolling window: the next 5 workdays from now. Free focus time = 9:00–17:30 minus meetings,
    // at a realistic 75% conversion. Need = remaining estimated work on your tickets due in that window.
    var now = H.now(), free = 0, end = null, days = 0;
    for (var off = 0; days < 5 && off < 10; off++) {
      var day = U.addDays(U.startOfDay(now), off); if (day.getDay() === 0 || day.getDay() === 6) continue; days++;
      var s = new Date(day), e = new Date(day); s.setHours(9, 0, 0, 0); e.setHours(17, 30, 0, 0); end = e;
      if (e <= now) continue; if (s < now) s = now;
      var mins = (e - s) / 60000;
      q.eventsOn(day).forEach(function (ev) {
        if (ev.kind === 'focus') return;
        var a = Math.max(H.at(ev.start), s), b = Math.min(H.at(ev.end), e); if (b > a) mins -= (b - a) / 60000;
      });
      free += Math.max(0, mins) / 60;
    }
    var limit = H.minOf(end), need = 0;
    q.myTickets().forEach(function (t) { if (t.status !== 'done' && t.due != null && t.due <= limit) need += q.remaining(t) * q.pace(); });
    return { free: free * 0.75, need: need, raw: free, until: end };
  };
  q.unread = function () { return store.state.notifications.filter(function (n) { return n.unread; }).length; };
  q.source = function (id) { var meta = H.SOURCES.filter(function (s) { return s.id === id; })[0]; return Object.assign({}, meta, store.state.sources[id] || {}); };
  q.connected = function () { return H.SOURCES.filter(function (s) { return store.state.sources[s.id] && (store.state.sources[s.id].status === 'connected' || store.state.sources[s.id].status === 'error'); }); };

  /* ---------------- Actions ---------------- */
  var act = H.act = {};
  var MODE_COPY = {
    curated: 'Curated: nothing is shared until you approve it.',
    balanced: 'Balanced: routine updates share themselves. Sensitive ones wait for you.',
    ambient: 'Ambient: Halo shares as it goes. Private topics are always dropped.'
  };
  act.modeCopy = MODE_COPY;
  act.setMode = function (mode, quiet) {
    if (store.state.prefs.mode === mode) return;
    var snap = store.snapshot();
    store.commit(function (s) { s.prefs.mode = mode; });
    if (!quiet) H.ui.toast(MODE_COPY[mode], { icon: 'dial', undo: function () { store.restore(snap); } });
  };
  act.decide = function (id, status, extra, quiet) {
    var snap = store.snapshot();
    store.commit(function (s) { s.digest.decisions[id] = Object.assign({}, s.digest.decisions[id] || {}, { status: status, t: 0 }, extra || {}); });
    if (status === 'approved') H.chime();
    if (!quiet) {
      var msg = { approved: 'Shared', held: 'Held for tomorrow’s digest', discarded: 'Won’t be shared', auto: 'Restored' }[status] || 'Updated';
      H.ui.toast(msg, { icon: status === 'approved' ? 'check-circle' : status === 'discarded' ? 'ban' : 'clock', undo: function () { store.restore(snap); } });
    }
  };
  act.approveAll = function () {
    var ids = q.pending().filter(function (i) { return !i.private; }).map(function (i) { return i.id; });
    if (!ids.length) return;
    var snap = store.snapshot();
    store.commit(function (s) { ids.forEach(function (id) { s.digest.decisions[id] = Object.assign({}, s.digest.decisions[id] || {}, { status: 'approved', t: 0 }); }); });
    H.chime(); H.ui.toast(U.plural(ids.length, 'update') + ' shared', { undo: function () { store.restore(snap); } });
  };
  act.editDigest = function (id, text, audience) {
    store.commit(function (s) { var d = s.digest.decisions[id] || {}; if (text != null) d.text = text; if (audience) d.audience = audience; d.status = d.status || 'pending'; s.digest.decisions[id] = d; });
  };
  act.resetDigest = function () { store.commit(function (s) { s.digest.decisions = {}; }); };
  act.retract = function (id) {
    var snap = store.snapshot();
    store.commit(function (s) {
      var h = s.history.filter(function (x) { return x.id === id; })[0];
      if (h) h.retracted = true; else s.digest.decisions[id] = Object.assign({}, s.digest.decisions[id] || {}, { status: 'discarded', t: 0 });
    });
    H.ui.toast('Retracted. Anyone who asks now gets the previous answer.', { icon: 'undo', undo: function () { store.restore(snap); } });
  };
  act.toggleSubtask = function (key, sid) {
    var done = false;
    store.commit(function (s) {
      var t = s.tickets.filter(function (x) { return x.key === key; })[0]; if (!t) return;
      t.subtasks.forEach(function (x) { if (x.id === sid) { x.done = !x.done; done = x.done; } });
      if (t.subtasks.every(function (x) { return x.done; }) && t.status !== 'done') t.status = 'review';
      else if (done && t.status === 'todo') t.status = 'progress';
    });
    if (done) H.chime();
  };
  act.addSubtask = function (key, title, est) {
    store.commit(function (s) { var t = s.tickets.filter(function (x) { return x.key === key; })[0]; if (t) t.subtasks.push({ id: U.uid('st'), title: title, done: false, est: est || { o: 1, m: 2, p: 3 } }); });
  };
  act.updateTicket = function (key, patch, toast) {
    store.commit(function (s) { var t = s.tickets.filter(function (x) { return x.key === key; })[0]; if (t) Object.assign(t, patch); if (patch.status === 'done' && t) t.done = 0; });
    if (toast) H.ui.toast(toast);
  };
  act.nextKey = function (project) {
    var max = 0; store.state.tickets.forEach(function (t) { if (t.project === project) max = Math.max(max, +t.key.split('-')[1]); });
    return project + '-' + (max + 1);
  };
  act.createTicket = function (t) {
    var key = act.nextKey(t.project || 'CHK');
    var ticket = Object.assign({ key: key, project: 'CHK', status: 'todo', prio: 'medium', owner: store.state.me, created: 0, est: { o: 2, m: 4, p: 8 }, logged: 0, desc: '', subtasks: [], links: [], watchers: [] }, t, { key: key });
    store.commit(function (s) { s.tickets.unshift(ticket); });
    return ticket;
  };
  act.bookTime = function (key, start, mins, quiet) {
    var t = q.ticket(key);
    store.commit(function (s) { s.events.push({ id: U.uid('focus'), title: 'Focus · ' + key, start: start, end: start + mins, kind: 'focus', ticket: key, booked: true }); });
    if (!quiet) H.ui.toast('Booked ' + H.fmt.hm(mins) + ' for ' + key + ' \u00b7 ' + H.fmt.day(H.at(start)) + ', ' + H.fmt.time(H.at(start)), { icon: 'calendar-check' });
    return t;
  };
  act.setSource = function (id, patch, toast) {
    store.commit(function (s) { s.sources[id] = Object.assign({}, s.sources[id] || {}, patch); });
    if (toast) H.ui.toast(toast, { icon: 'sources' });
  };
  act.readAll = function () { store.commit(function (s) { s.notifications.forEach(function (n) { n.unread = false; }); }); };
  act.pause = function (on) {
    store.commit(function (s) { s.privacy.paused = on; });
    H.ui.toast(on ? 'Halo is paused. Nothing is observed or shared until you resume.' : 'Halo is back on.', { icon: on ? 'pause-circle' : 'play-circle' });
  };
  act.post = function (text, audience, extra) {
    store.commit(function (s) { s.history.unshift(Object.assign({ id: U.uid('h'), t: 0, audience: audience || 'team', via: 'manual', text: text, sources: [['halo', 'Written by you']] }, extra || {})); });
    H.chime(); H.ui.toast('Shared with ' + ({ team: 'your team', manager: 'your manager', exec: 'leadership' }[audience] || 'your team'));
  };
  act.setPref = function (k, v) { store.commit(function (s) { s.prefs[k] = v; }); };
})(window.H = window.H || {});

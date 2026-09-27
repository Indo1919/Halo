/* Home — "My Halo": the calm dashboard. */
(function (H) {
  'use strict';
  var esc = H.esc, ui = H.ui, q = H.q, F = H.fmt, U = H.util;
  var view = { audience: 'team' };
  var AUD = [{ v: 'team', label: 'Team', icon: 'teammate' }, { v: 'manager', label: 'Manager', icon: 'manager' }, { v: 'exec', label: 'Leadership', icon: 'exec' }];

  function hero() {
    var s = H.store.state, a = view.audience, pub = q.published().filter(function (p) { return p.audience === a || a === 'team'; })[0];
    var red = q.redactedCount();
    var srcs = a === 'exec' ? [['jira', 'Checkout v3 epic']] : [['figma', 'Payment methods'], ['jira', a === 'team' ? 'CHK-142, CHK-145' : '5 tickets'], ['zoom', 'Error states kickoff']];
    return '<section class="card hero" data-tour="status">' +
      '<div class="hero-top"><span class="kicker">' + ui.mark(16) + '<span>What Halo is saying about you</span></span>' +
        '<span class="meta hide-phone"><span class="sep"></span><span>Updated ' + F.rel(H.at(pub ? pub.t : -12)) + '</span></span>' +
        '<div class="ml-auto">' + ui.seg('home-aud', AUD, a, { action: 'home-aud', size: 'sm', label: 'Audience' }) + '</div></div>' +
      '<p class="hero-text">' + esc(q.statusLine(a)) + '</p>' +
      '<div class="hero-foot"><div class="row gap-2 wrap">' + srcs.map(function (x) { return ui.src(x[0], x[1]); }).join('') +
        (red ? '<span class="redacted-chip" data-tip="Held back because it matches a private topic. Only you can see this."><span class="bars"><i></i><i></i></span>Redacted: ' + U.plural(red, 'private topic') + '</span>' : '') + '</div>' +
        '<div class="row gap-1 ml-auto">' + ui.btn('Edit', { kind: 'ghost', size: 'sm', icon: 'edit', action: 'home-edit' }) + ui.btn(s.privacy.paused ? 'Resume' : 'Pause', { kind: 'ghost', size: 'sm', icon: s.privacy.paused ? 'play-circle' : 'pause-circle', action: 'toggle-pause' }) + '</div></div>' +
    '</section>';
  }

  function digestCard() {
    var d = q.digest(), mode = q.mode(), pend = d.filter(function (i) { return i.status === 'pending'; }).length;
    var auto = d.filter(function (i) { return i.status === 'auto'; }).length, dropped = d.filter(function (i) { return i.status === 'dropped'; }).length;
    var decided = d.filter(function (i) { return i.status !== 'pending'; }).length;
    var closes = H.at(H.store.state.digest.closesAt);
    var body;
    if (pend) {
      body = '<div class="dc-num num">' + pend + '</div><div class="dc-label">' + (pend === 1 ? 'update needs you' : 'updates need you') + '</div>' +
        '<div class="dc-meta">' + (mode === 'curated' ? 'Curated mode: nothing is shared until you approve it.' : auto + ' shared automatically. The rest waits for you.') + '</div>' +
        '<div class="mt-5">' + ui.btn('Review now', { kind: 'primary', block: true, action: 'nav', attrs: { 'data-to': '#/digest' }, trail: '<span class="count">~' + Math.max(1, Math.round(pend * 0.5)) + ' min</span>' }) + '</div>';
    } else {
      body = '<div class="dc-done">' + H.icon('check', 22) + '</div><div class="dc-label" style="margin-top:12px">All clear for today</div>' +
        '<div class="dc-meta">' + (mode === 'ambient' ? auto + ' shared as they happened' + (dropped ? ', ' + dropped + ' dropped for privacy' : '') + '.' : 'Every update is decided. Next digest tomorrow at ' + F.time(closes) + '.') + '</div>' +
        '<div class="mt-5">' + ui.btn(mode === 'ambient' ? 'Open activity log' : 'See what was shared', { block: true, action: 'nav', attrs: { 'data-to': mode === 'ambient' ? '#/digest' : '#/history' } }) + '</div>';
    }
    return '<section class="card digest-card" data-tour="digest"><div class="row gap-2"><span class="eyebrow">Today’s digest</span><span class="ml-auto" data-tip="Share your updates before this time, or they roll to tomorrow">' + ui.badge('Closes ' + F.time(closes), '', 'clock') + '</span></div>' +
      '<div class="dc-body">' + body + '</div>' +
      '<div class="dc-ring" aria-hidden="true">' + ui.ring(decided / d.length, 44, 4, 'var(--accent)') + '<span class="num">' + decided + '/' + d.length + '</span></div></section>';
  }

  function justEnded() {
    var e = q.justEnded(), r = H.store.state.recaps.kickoff; if (!e || (r && (r.created || r.dismissed))) return '';
    return '<section class="card ended rise" data-tour="recap">' + H.brandTile(e.src || 'zoom', 40) +
      '<div class="grow"><div class="meta"><span class="t-strong c-2">Just ended</span><span class="sep"></span><span>' + F.rel(H.at(e.end)) + '</span><span class="sep"></span><span>' + U.plural(e.people.length, 'person', 'people') + '</span></div>' +
      '<div class="t-title-3 mt-1">' + esc(e.title) + '</div><div class="t-callout c-3 mt-1">Halo drafted 1 ticket and 6 estimated subtasks from what was decided.</div></div>' +
      '<div class="row gap-2 ended-actions">' + ui.btn('Not now', { kind: 'ghost', size: 'sm', action: 'ended-dismiss' }) + ui.btn('Review tickets', { kind: 'primary', size: 'sm', action: 'nav', icon: 'split', attrs: { 'data-to': '#/recap/kickoff' } }) + '</div></section>';
  }

  function today() {
    var list = q.eventsOn(H.now()), now = 0;
    var rows = list.map(function (e) {
      var past = e.end <= now, live = e.start <= now && e.end > now, a = H.at(e.start), b = H.at(e.end);
      var badge = '';
      if (e.cover && past) badge = ui.badge('Halo posted your update', 'success', 'check');
      else if (e.cover) badge = ui.badge('Halo can cover this', 'accent', 'sparkle');
      else if (e.private) badge = ui.badge('Private', '', 'lock');
      else if (e.recap && past) badge = ui.badge('Recap ready', 'info', 'wand');
      else if (e.kind === 'focus') badge = '<span class="key">' + esc(e.ticket) + '</span>';
      var who = e.people ? ui.avatarStack(e.people.filter(function (p) { return p !== 'maya'; }).map(q.person), 'xs', 3) : '';
      return '<button type="button" class="ev-row' + (past ? ' past' : '') + (live ? ' live' : '') + (e.kind === 'focus' ? ' focus' : '') + '" data-action="home-event" data-id="' + e.id + '">' +
        '<span class="ev-time num">' + F.clock(a) + '<span>' + (a.getHours() >= 12 ? 'PM' : 'AM') + '</span></span><span class="ev-bar"></span>' +
        '<span class="grow" style="min-width:0"><span class="ev-title truncate">' + esc(e.title) + '</span><span class="ev-meta">' + F.range(a, b) + (live ? ' · <b>Now</b>' : '') + '</span></span>' +
        '<span class="ev-side">' + badge + (badge ? '' : who) + '</span></button>';
    }).join('');
    return '<section class="card" data-tour="today"><div class="card-hd"><h2>Today</h2><span class="sub">' + F.dateLong(H.now()) + '</span><div class="ml-auto">' + ui.btn('Book focus time', { kind: 'ghost', size: 'sm', icon: 'calendar-plus', action: 'open', attrs: { 'data-overlay': 'booktime' } }) + '</div></div>' +
      '<div class="card-bd" style="padding:8px 10px 12px">' + (rows || ui.empty('calendar', 'A clear day', 'No meetings. Halo will protect your focus.')) + '</div></section>';
  }

  function work() {
    var mine = q.myTickets().filter(function (t) { return t.status !== 'done'; }).sort(function (a, b) { return (a.due == null ? 1e9 : a.due) - (b.due == null ? 1e9 : b.due); }).slice(0, 4);
    return '<section class="card"><div class="card-hd"><h2>Your work</h2><span class="sub">' + U.plural(q.myTickets().filter(function (t) { return t.status !== 'done'; }).length, 'open ticket') + '</span><div class="ml-auto">' + ui.btn('All tickets', { kind: 'ghost', size: 'sm', action: 'nav', attrs: { 'data-to': '#/tickets' }, trail: H.icon('chevron-right', 14) }) + '</div></div>' +
      '<div class="card-bd" style="padding:6px 10px 12px">' + mine.map(function (t) {
        var p = q.progress(t), left = q.remaining(t) * q.pace(), due = t.due != null ? H.at(t.due) : null, soon = due && U.dayDiff(due, H.now()) <= 1;
        return '<a class="tk-row" href="#/tickets/' + t.key + '" data-nav="#/tickets/' + t.key + '">' + ui.status(t.status) +
          '<span class="grow" style="min-width:0"><span class="row gap-2"><span class="key">' + t.key + '</span>' + ui.prio(t.prio) + '</span><span class="tk-title truncate">' + esc(t.title) + '</span>' +
          '<span class="row gap-3 mt-2">' + ui.bar(p, 'thin') + '<span class="t-caption c-3 nowrap num">' + Math.round(p * 100) + '%</span></span></span>' +
          '<span class="tk-side"><span class="t-caption nowrap ' + (soon ? 'c-accent' : 'c-3') + '">' + (due ? F.day(due) : 'No date') + '</span><span class="t-caption c-3 nowrap num">' + (left < 0.1 ? ui.statusLabel(t.status) : F.hours(left) + ' left') + '</span></span></a>';
      }).join('') + '</div></section>';
  }

  function week() {
    var c = q.capacity(), over = c.need - c.free, ratio = c.free ? Math.min(1, c.need / Math.max(c.free, c.need)) : 1;
    var freeW = c.need > c.free ? (c.free / c.need) * 100 : 100, needW = c.need > c.free ? 100 : (c.need / c.free) * 100;
    var shipped = q.myTickets().filter(function (t) { return t.status === 'done' && t.done != null && t.done > H.slot(-7, '00:00'); });
    var covered = H.store.state.events.filter(function (e) { return e.cover && e.covered; }).length;
    return '<section class="card"><div class="card-hd"><h2>Capacity</h2><span class="sub">Next 5 workdays</span></div><div class="card-bd">' +
      '<div class="row gap-6"><div class="stat"><span class="stat-num">' + F.hours(c.need) + '</span><span class="stat-label">Work due</span></div><div class="stat"><span class="stat-num">' + F.hours(c.free) + '</span><span class="stat-label">Focus time</span></div></div>' +
      '<div class="cap-bar mt-4" aria-hidden="true"><span class="cap-need" style="width:' + needW.toFixed(1) + '%"></span>' + (over > 0.5 ? '<span class="cap-over" style="left:' + freeW.toFixed(1) + '%"></span>' : '') + '</div>' +
      (over > 0.5 ? '<div class="banner banner-warning mt-4">' + H.icon('alert', 16) + '<span class="grow">About <strong>' + F.hours(over) + '</strong> more than fits. Moving DS-212 to next week would fix it.</span>' + ui.btn('Move it', { size: 'xs', action: 'home-rebalance' }) + '</div>'
        : '<div class="banner banner-success mt-4">' + H.icon('check-circle', 16) + '<span>Your week fits, with about ' + F.hours(-over) + ' to spare.</span></div>') +
      '<div class="divider mt-5"></div><div class="row gap-6 mt-4 wrap"><div class="stat"><span class="stat-num">' + shipped.length + '</span><span class="stat-label">Shipped this week</span></div><div class="stat"><span class="stat-num">' + covered + '</span><span class="stat-label">Standups Halo posted</span></div><div class="stat"><span class="stat-num">' + q.published().filter(function (p) { return p.t > H.slot(-7, '00:00'); }).length + '</span><span class="stat-label">Updates shared</span></div></div>' +
      '</div></section>';
  }

  function asked() {
    var list = H.store.state.asks.slice().sort(function (a, b) { return b.t - a.t; }).slice(0, 3);
    return '<section class="card"><div class="card-hd"><h2>Asked about you</h2><span class="sub hide-phone">Your Halo answered for you</span><div class="ml-auto">' + ui.btn('All', { kind: 'ghost', size: 'sm', action: 'nav', attrs: { 'data-to': '#/history/asks' }, trail: H.icon('chevron-right', 14) }) + '</div></div>' +
      '<div class="card-bd" style="padding:6px 10px 12px">' + list.map(function (a) {
        var p = q.person(a.who);
        return '<a class="list-row" href="#/history/asks" data-nav="#/history/asks">' + ui.avatar(p, 'md') + '<span class="grow" style="min-width:0"><span class="t-callout truncate" style="display:block"><b class="t-medium">' + esc(p.name.split(' ')[0]) + '</b> <span class="c-3">asked</span> “' + esc(a.q) + '”</span>' +
          '<span class="meta"><span>' + F.rel(H.at(a.t)) + '</span><span class="sep"></span><span>Answered for ' + ({ team: 'a teammate', manager: 'a manager', exec: 'leadership' }[a.audience]) + '</span>' + (a.withheld ? '<span class="sep"></span><span class="c-accent">' + a.withheld + ' held back</span>' : '') + '</span></span></a>';
      }).join('') + '</div></section>';
  }

  H.screens.home = {
    title: 'Home', crumbs: function () { return [{ label: 'Home' }]; },
    render: function () {
      var me = q.me(), first = me.name.split(' ')[0], pend = q.pendingCount();
      return '<header class="page-hd home-hd"><div><div class="eyebrow">' + F.dateLong(H.now()) + '</div><h1 class="mt-2">' + F.greeting() + ', ' + esc(first) + '</h1>' +
        '<p class="lede">' + (H.store.state.privacy.paused ? 'Halo is paused. Nothing new is being observed or shared.' : pend ? 'Halo kept your work visible today. ' + U.plural(pend, 'update needs', 'updates need') + ' a quick decision.' : 'Halo kept your work visible today. Nothing needs you right now.') + '</p></div>' +
        '<div class="actions">' + ui.btn('Post an update', { icon: 'edit', action: 'quick-add', attrs: { 'data-type': 'update' } }) + ui.btn('Ask Halo', { kind: 'primary', icon: 'sparkle', action: 'nav', attrs: { 'data-to': '#/ask' } }) + '</div></header>' +
        '<div class="home-grid">' + hero() + digestCard() + '</div>' + justEnded() +
        '<div class="grid grid-12 mt-4"><div class="span-7 col gap-4">' + today() + asked() + '</div><div class="span-5 col gap-4">' + work() + week() + '</div></div>';
    },
    actions: {
      'home-aud': function (el) { view.audience = el.dataset.v; H.render(); },
      'home-edit': function () { H.ui.open('quickadd', { type: 'update', text: q.statusLine(view.audience) }); },
      'ended-dismiss': function () { H.store.commit(function (s) { s.recaps.kickoff.dismissed = true; }); H.ui.toast('Saved for later in Calendar', { icon: 'calendar' }); },
      'home-event': function (el) {
        var e = H.store.state.events.filter(function (x) { return x.id === el.dataset.id; })[0]; if (!e) return;
        if (e.recap) return H.go('#/recap/' + e.recap);
        if (e.ticket) return H.go('#/tickets/' + e.ticket);
        H.go('#/calendar?e=' + e.id);
      },
      'home-rebalance': function () {
        var snap = H.store.snapshot();
        H.store.commit(function (s) { s.tickets.forEach(function (t) { if (t.key === 'DS-212') t.due = H.slot(9, '17:00'); }); });
        H.ui.toast('DS-212 moved to next week. Halo will tell Sam.', { icon: 'calendar', undo: function () { H.store.restore(snap); } });
      }
    }
  };
})(window.H = window.H || {});

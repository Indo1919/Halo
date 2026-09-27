/* Team — what teammates' Halos have chosen to share. Published information only, never activity. */
(function (H) {
  'use strict';
  var esc = H.esc, ui = H.ui, q = H.q, F = H.fmt, U = H.util;
  var view = { askFor: null, ask: '', answer: '', busy: false, ctl: null };
  var MODE = { curated: 'Curated', balanced: 'Balanced', ambient: 'Ambient' };
  var ORDER = ['sam', 'priya', 'leo', 'hana', 'nora'];
  var RECENT = {
    sam: [[-95, 'PR #482 for saved cards is up for review. Remove and set-default both work; error handling lands tomorrow.', 'CHK-138'],
      [['-1', '17:10'], 'Pairing with Leo on 3DS retry design as soon as sandbox access lands.', 'CHK-150'],
      [['-2', '15:50'], 'Merged the Checkout v3 success page. It’s behind the checkout-v3 flag for now.', 'CHK-136'],
      [['-3', '11:40'], 'Reviewed Maya’s wallet placement options. We’re going with wallets above the card form on mobile.', 'CHK-145']],
    priya: [[-60, 'The Checkout v3 launch plan is drafted. I’d love feedback on the merchant comms section by Wednesday.', null],
      [['-1', '16:20'], 'Talked to four restaurant merchants about tips and tax. Clear pattern: show the tip before the total, not after.', 'CHK-153'],
      [['-2', '10:30'], 'Scoped tax and tip line items for mobile. It needs design next sprint.', 'CHK-153']],
    leo: [[-140, 'Blocked on processor sandbox access for 3DS retries. The support ticket is open, so I’m on bulk-send invoices meanwhile.', 'CHK-150'],
      [['-1', '15:05'], 'Bulk-send invoices is in review. It handles 200 invoices per CSV, with clear per-row errors.', 'INV-95'],
      [['-2', '17:30'], 'Mapped the first batch of processor decline codes to buyer-facing reasons.', null]],
    hana: [[-35, 'Funnel events are live for checkout steps 1 to 3. The dashboard draft shares tomorrow.', 'CHK-149'],
      [['-2', '12:15'], 'The event schema for Checkout v3 is approved.', 'CHK-149'],
      [['-3', '14:00'], 'Early funnel read: most mobile drop-off happens on the payment method step. Details are in the funnel doc.', null]],
    nora: [[-300, 'Sprint is on track. I’m watching the 3DS sandbox dependency with the processor’s support team.', null],
      [['-1', '11:00'], 'Moved the Checkout v3 demo to Friday so error states can be included.', null]]
  };
  function tOf(x) { return Array.isArray(x) ? H.bday(+x[0], x[1]) : x; }
  function recent(id) { return (RECENT[id] || []).map(function (r) { return { t: tOf(r[0]), text: r[1], ticket: r[2] }; }); }
  function first(p) { return p.name.split(' ')[0]; }

  function pulse() {
    var tix = H.store.state.tickets, weekAgo = H.slot(-7, '00:00');
    var n = function (f) { return tix.filter(f).length; };
    var items = [
      ['In progress', n(function (t) { return t.status === 'progress'; }), 'status-progress'],
      ['In review', n(function (t) { return t.status === 'review'; }), 'status-review'],
      ['Blocked', n(function (t) { return t.status === 'blocked'; }), 'status-blocked'],
      ['Shipped this week', n(function (t) { return t.status === 'done' && t.done != null && t.done > weekAgo; }), 'status-done']
    ];
    return '<div class="card tm-pulse">' + items.map(function (x, i) {
      return (i ? '<span class="vdivider"></span>' : '') + '<div class="tm-pulse-item"><span class="status ' + x[2] + '"></span><div><div class="stat-num">' + x[1] + '</div><div class="stat-label">' + x[0] + '</div></div></div>';
    }).join('') + '<p class="tm-pulse-note">' + H.icon('lock', 12) + ' Counted from shared tickets only</p></div>';
  }

  function personCard(id) {
    var p = q.person(id), s = H.store.state.team[id]; if (!s) return '';
    return '<article class="card tm-card" data-key="p-' + id + '"><div class="row gap-3">' + ui.avatar(p, 'lg', { tip: false }) +
      '<div class="grow" style="min-width:0"><a class="tm-name" href="#/team/' + id + '" data-nav="#/team/' + id + '">' + esc(p.name) + '</a><div class="t-caption c-3" style="font-weight:400">' + esc(p.role) + '</div></div>' +
      '<span class="badge" data-tip="How much ' + esc(first(p)) + '’s Halo shares on its own">' + H.icon('dial', 12) + MODE[s.mode] + '</span></div>' +
      '<p class="tm-status">' + esc(s.status) + '</p>' +
      (s.blockers.length ? '<div class="tm-block">' + H.icon('alert', 14) + '<span>' + esc(s.blockers[0]) + '</span></div>' : '') +
      '<div class="tm-foot"><span class="meta"><span>Shared ' + F.rel(H.at(s.t)) + '</span>' + (s.focus ? '<span class="sep"></span><a class="key" href="#/tickets/' + s.focus + '" data-nav="#/tickets/' + s.focus + '">' + s.focus + '</a>' : '') + '</span>' +
      '<span class="row gap-1 ml-auto">' + ui.btn('Ask', { kind: 'ghost', size: 'xs', icon: 'sparkle', action: 'tm-ask', attrs: { 'data-q': 'What is ' + first(p) + ' working on?' } }) + ui.btn('Profile', { kind: 'ghost', size: 'xs', action: 'nav', attrs: { 'data-to': '#/team/' + id }, trail: H.icon('chevron-right', 12) }) + '</span></div></article>';
  }

  function overview() {
    var team = H.store.state.team, helpers = ORDER.filter(function (id) { return team[id] && team[id].blockers.length; });
    return '<header class="page-hd"><div><h1>Checkout team</h1><p class="lede">What your teammates’ Halos have shared. You only ever see what each person chose to publish, never their activity.</p></div>' +
      '<div class="actions">' + ui.btn('Invite', { icon: 'user-plus', action: 'invite' }) + '</div></header>' + pulse() +
      (helpers.length ? '<section class="section"><div class="section-hd"><h2>Could use a hand</h2></div>' + helpers.map(function (id) {
        var p = q.person(id), s = team[id];
        return '<div class="card tm-help">' + ui.avatar(p, 'md') + '<div class="grow"><div class="t-medium">' + esc(p.name) + ' <span class="c-3" style="font-weight:400">is blocked</span></div><div class="t-callout c-2">' + esc(s.blockers[0]) + (s.focus ? ' · <a class="key" href="#/tickets/' + s.focus + '" data-nav="#/tickets/' + s.focus + '">' + s.focus + '</a>' : '') + '</div></div>' +
          (s.helpOffered ? ui.badge('You offered to help', 'success', 'check') : ui.btn('Offer help', { size: 'sm', icon: 'reply', action: 'tm-help', attrs: { 'data-id': id } })) + '</div>';
      }).join('') + '</section>' : '') +
      '<section class="section"><div class="section-hd"><h2>Teammates</h2><span class="sub">' + ORDER.length + ' people</span></div><div class="tm-grid">' + ORDER.map(personCard).join('') + '</div></section>' +
      '<section class="section"><div class="section-hd"><h2>Who else sees your updates</h2></div><div class="group">' + ['rosa', 'ethan'].map(function (id) {
        var p = q.person(id);
        return '<a class="item has-lead clickable" href="#/team/' + id + '" data-nav="#/team/' + id + '">' + ui.avatar(p, 'md', { tip: false }) + '<span class="grow"><span class="item-title" style="display:block">' + esc(p.name) + '</span><span class="item-sub">' + esc(p.role) + ' · sees your updates at the ' + (p.exec ? 'leadership' : 'manager') + ' level</span></span><span class="item-trail">' + H.icon('chevron-right', 16) + '</span></a>';
      }).join('') + '</div></section>';
  }

  function viewerCard(p) {
    var m = H.store.state.privacy.matrix, lvl = p.exec ? 'exec' : 'manager';
    var rows = [['progress', 'Ticket progress'], ['time', 'Time spent'], ['meetings', 'Meeting notes'], ['blockers', 'Blockers'], ['activity', 'Raw activity']];
    var word = { full: 'Full detail', summary: 'Summary', hidden: 'Hidden' };
    var asks = H.store.state.asks.filter(function (a) { return a.who === p.id; });
    return '<section class="card card-pad"><div class="row gap-2"><h2 class="t-title-3">What ' + esc(first(p)) + ' sees of you</h2><a class="link ml-auto t-callout" href="#/privacy/boundaries" data-nav="#/privacy/boundaries">Change</a></div>' +
      '<p class="t-callout c-3 mt-1">' + esc(first(p)) + ' gets your updates written for ' + (p.exec ? 'leadership: one or two sentences on outcomes.' : 'a manager: outcomes, dates and risks.') + '</p>' +
      '<div class="group mt-4">' + rows.map(function (r) { var v = r[0] === 'activity' ? 'hidden' : m[r[0]][lvl]; return '<div class="item"><span class="grow item-title" style="font-weight:400">' + r[1] + '</span><span class="badge' + (v === 'full' ? ' badge-success' : v === 'summary' ? '' : ' badge-outline') + '">' + (v === 'hidden' ? H.icon('eye-off', 12) : '') + word[v] + '</span></div>'; }).join('') + '</div></section>' +
      (asks.length ? '<section class="section"><div class="section-hd"><h2>Questions ' + esc(first(p)) + ' asked about you</h2></div><div class="col gap-2">' + asks.map(function (a) {
        return '<a class="card list-row clickable" href="#/history/asks" data-nav="#/history/asks" style="padding:14px 16px">' + H.icon('message', 16, 'c-3') + '<span class="grow" style="min-width:0"><span class="t-medium" style="display:block">“' + esc(a.q) + '”</span><span class="meta">' + F.rel(H.at(a.t)) + '</span></span>' + H.icon('chevron-right', 16, 'c-3') + '</a>';
      }).join('') + '</div></section>' : '');
  }

  function profile(id) {
    var p = q.person(id);
    if (!p || id === H.store.state.me) return ui.empty('team', 'We couldn’t find that person', 'They may have left the workspace.', ui.btn('Back to team', { action: 'nav', attrs: { 'data-to': '#/team' } }));
    var s = H.store.state.team[id], tickets = H.store.state.tickets.filter(function (t) { return t.owner === id; });
    var head = '<header class="card tm-hero">' + ui.avatar(p, 'xxl', { tip: false }) + '<div class="grow" style="min-width:0"><h1 class="t-title-1">' + esc(p.name) + '</h1><p class="t-body c-3 mt-1">' + esc(p.role) + ' · ' + esc(p.team) + '</p>' +
      '<div class="row gap-2 wrap mt-3">' + (s ? ui.badge(MODE[s.mode] + ' mode', '', 'dial') : '') + ui.badge('Local time ' + F.time(H.now()), '', 'clock') + (s && s.blockers.length ? ui.badge('Blocked', 'danger', 'alert') : '') + '</div></div></header>';
    if (!s) return head + '<div class="mt-4">' + viewerCard(p) + '</div>';
    var ask = '<section class="card card-pad mt-4"><div class="row gap-2"><span class="kicker">' + ui.mark(14) + '<span>Ask ' + esc(first(p)) + '’s Halo</span></span><span class="t-caption c-3 ml-auto hide-phone">Answers only from what ' + esc(first(p)) + ' has shared</span></div>' +
      '<form class="tm-ask" data-submit="tm-ask-go"><input class="input" placeholder="What is ' + esc(first(p)) + ' focused on this week?" value="' + esc(view.askFor === id ? view.ask : '') + '" data-input="tm-ask-in" aria-label="Question">' + ui.btn(view.busy ? 'Asking' : 'Ask', { kind: 'primary', attrs: { type: 'submit' }, cls: view.busy ? 'is-loading' : '' }) + '</form>' +
      (view.askFor === id && (view.answer || view.busy) ? '<div class="text-block mt-3" id="tm-answer" data-morph="skip">' + esc(view.answer) + '</div>' : '') + '</section>';
    var list = recent(id).sort(function (a, b) { return b.t - a.t; });
    var shared = '<section class="section"><div class="section-hd"><h2>Recently shared</h2><span class="sub">by ' + esc(first(p)) + '’s Halo</span></div><div class="card" style="padding:4px 0">' + list.map(function (r) {
      return '<div class="tm-upd"><span class="tm-upd-dot"></span><div class="grow"><p>' + esc(r.text) + '</p><div class="meta mt-1"><span>' + F.rel(H.at(r.t)) + '</span>' + (r.ticket ? '<span class="sep"></span><a class="key" href="#/tickets/' + r.ticket + '" data-nav="#/tickets/' + r.ticket + '">' + r.ticket + '</a>' : '') + '</div></div></div>';
    }).join('') + '</div></section>';
    var tk = '<section class="section"><div class="section-hd"><h2>Tickets</h2><span class="sub">' + tickets.length + '</span></div><div class="card" style="padding:6px">' + (tickets.length ? tickets.map(function (t) {
      return '<a class="list-row" href="#/tickets/' + t.key + '" data-nav="#/tickets/' + t.key + '">' + ui.status(t.status) + ui.prio(t.prio) + '<span class="key">' + t.key + '</span><span class="grow truncate t-medium">' + esc(t.title) + '</span><span class="t-caption c-3 nowrap">' + (t.due != null ? F.day(H.at(t.due)) : '') + '</span></a>';
    }).join('') : '<p class="t-callout c-3" style="padding:12px">No tickets shared.</p>') + '</div></section>';
    return head + ask + '<div class="grid grid-12 mt-4"><div class="span-7">' + shared + '</div><div class="span-5">' + tk +
      '<div class="banner mt-4">' + H.icon('privacy', 16) + '<span>You’re seeing only what ' + esc(first(p)) + '’s Halo has published. Halo never shows anyone’s raw activity.</span></div></div></div>';
  }

  H.screens.team = {
    title: 'Team',
    crumbs: function (r) { var p = r.parts[0] && q.person(r.parts[0]); return p ? [{ label: 'Team', nav: '#/team' }, { label: p.name }] : [{ label: 'Team' }]; },
    pageClass: '',
    render: function (r) { return r.parts[0] ? profile(r.parts[0]) : overview(); },
    leave: function () { if (view.ctl) view.ctl.abort(); view.askFor = null; view.answer = ''; view.busy = false; },
    actions: {
      'tm-ask': function (el) { H.askSend(el.dataset.q); },
      'tm-help': function (el) { var id = el.dataset.id; H.store.commit(function (s) { s.team[id].helpOffered = true; }); ui.toast('Halo let ' + first(q.person(id)) + ' know you can help', { icon: 'reply' }); },
      'tm-ask-in': function (el) { view.askFor = H.route.parts[0]; view.ask = el.value; },
      'tm-ask-go': function () {
        var id = H.route.parts[0], p = q.person(id), text = (view.askFor === id ? view.ask : '').trim() || ('What is ' + first(p) + ' focused on this week?');
        if (view.ctl) view.ctl.abort();
        view.askFor = id; view.ask = text; view.answer = ''; view.busy = true; view.ctl = new AbortController(); H.render();
        H.ai.ask('About ' + first(p) + ' (' + p.role + '): ' + text + ' Answer only from what ' + first(p) + ' has published.', 'team', [], {
          signal: view.ctl.signal, onText: function (t) { view.answer = t; var el = document.getElementById('tm-answer'); if (el) el.textContent = t; }
        }).then(function (res) { view.answer = res.text; view.busy = false; H.render(); var el = document.getElementById('tm-answer'); if (el) el.textContent = res.text; }, function () { view.busy = false; H.render(); });
      }
    }
  };
})(window.H = window.H || {});

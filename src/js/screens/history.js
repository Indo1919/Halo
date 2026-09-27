/* History — everything shared on your behalf, every question asked about you, and everything Halo did. */
(function (H) {
  'use strict';
  var esc = H.esc, ui = H.ui, q = H.q, F = H.fmt, U = H.util;
  var view = { aud: 'all', search: '' };
  var AUD = { team: ['Team', 'teammate'], manager: ['Manager', 'manager'], exec: ['Leadership', 'exec'] };
  var VIA = { auto: 'Shared automatically', approved: 'You approved', manual: 'Written by you' };

  function dayLabel(d) { var n = U.dayDiff(d, H.now()); return n === 0 ? 'Today' : n === -1 ? 'Yesterday' : F.weekday(d) + ', ' + F.date(d); }
  function groupByDay(list, getT) {
    var groups = [], cur = null;
    list.forEach(function (x) { var d = H.at(getT(x)), k = U.startOfDay(d).getTime(); if (!cur || cur.k !== k) { cur = { k: k, label: dayLabel(d), items: [] }; groups.push(cur); } cur.items.push(x); });
    return groups;
  }
  function audBadge(a) { return '<span class="badge">' + H.icon(AUD[a][1], 12) + AUD[a][0] + '</span>'; }

  function sharedTab() {
    var s = view.search.trim().toLowerCase();
    var list = q.published().filter(function (p) { return (view.aud === 'all' || p.audience === view.aud) && (!s || p.text.toLowerCase().indexOf(s) >= 0 || (p.ticket || '').toLowerCase().indexOf(s) >= 0); });
    var chips = [['all', 'All'], ['team', 'Team'], ['manager', 'Manager'], ['exec', 'Leadership']].map(function (c) {
      return '<button type="button" class="chip chip-sm" aria-pressed="' + (view.aud === c[0]) + '" data-action="hs-aud" data-v="' + c[0] + '">' + (c[0] !== 'all' ? H.icon(AUD[c[0]][1], 14) : '') + c[1] + '</button>';
    }).join('');
    var bar = '<div class="hs-bar"><div class="row gap-2 wrap">' + chips + '</div><div class="input-wrap hs-search">' + H.icon('search', 16) + '<input class="input input-sm" placeholder="Search updates" value="' + esc(view.search) + '" data-input="hs-search" aria-label="Search updates"></div></div>';
    if (!list.length) return bar + ui.empty('history', view.search ? 'No updates match' : 'Nothing shared for this audience yet', view.search ? 'Try a ticket key or a different word.' : 'Updates show up here the moment they’re shared.');
    return bar + groupByDay(list, function (p) { return p.t; }).map(function (g) {
      return '<section class="hs-day"><h3 class="hs-day-label">' + g.label + '</h3><div class="hs-timeline">' + g.items.map(function (p) {
        return '<article class="hs-entry" data-key="h-' + p.id + '"><span class="hs-time num">' + F.clock(H.at(p.t)) + '<small>' + (H.at(p.t).getHours() >= 12 ? 'PM' : 'AM') + '</small></span><span class="hs-node"></span>' +
          '<div class="hs-card"><div class="row gap-2 wrap">' + audBadge(p.audience) + '<span class="t-caption c-3">' + VIA[p.via] + '</span>' + (p.ticket ? '<a class="key" href="#/tickets/' + p.ticket + '" data-nav="#/tickets/' + p.ticket + '">' + p.ticket + '</a>' : '') + '</div>' +
          '<p class="hs-text">' + esc(p.text) + '</p><div class="row gap-2 wrap">' + (p.sources || []).map(function (x) { return ui.src(x[0], x[1]); }).join('') + '<span class="grow"></span>' +
          '<span class="hs-actions">' + ui.btn('Copy', { kind: 'ghost', size: 'xs', icon: 'copy', action: 'copy', attrs: { 'data-text': p.text } }) + ui.btn('Retract', { kind: 'ghost', size: 'xs', icon: 'undo', action: 'hs-retract', attrs: { 'data-id': p.id } }) + '</span></div></div></article>';
      }).join('') + '</div></section>';
    }).join('');
  }

  function asksTab() {
    var list = H.store.state.asks.slice().sort(function (a, b) { return b.t - a.t; });
    return '<div class="banner banner-info">' + H.icon('eye', 16) + '<span><strong>Nothing about you happens behind your back.</strong> When someone asks your Halo about you, you see the exact answer they got, and you can correct it.</span></div>' +
      '<div class="col gap-3 mt-4">' + list.map(function (a) {
        var p = q.person(a.who);
        return '<article class="card hs-ask" data-key="a-' + a.id + '"><div class="row gap-3">' + ui.avatar(p, 'lg') + '<div class="grow" style="min-width:0"><div class="t-medium">' + esc(p.name) + ' <span class="c-3" style="font-weight:400">asked</span></div><div class="meta"><span>' + esc(p.role) + '</span><span class="sep"></span><span>' + F.rel(H.at(a.t)) + '</span></div></div>' + audBadge(a.audience) + '</div>' +
          '<p class="hs-q">“' + esc(a.q) + '”</p>' +
          '<div class="eyebrow mt-4">What Halo said</div><div class="text-block mt-2">' + esc(a.a) + '</div>' +
          '<div class="row gap-2 wrap mt-3"><span class="t-caption c-3">Used</span>' + a.used.map(function (u) { return '<span class="badge">' + H.icon(/^[A-Z]+-\d+$/.test(u) ? 'ticket' : 'file-text', 12) + esc(u) + '</span>'; }).join('') + (a.corrected ? ui.badge('Corrected by you', 'success', 'check') : '') + '</div>' +
          (a.withheld ? '<div class="hs-held">' + H.icon('lock', 14) + '<span class="grow">Held back ' + U.plural(a.withheld, 'update') + ' still waiting in your digest.</span>' + ui.btn('Open digest', { size: 'xs', action: 'nav', attrs: { 'data-to': '#/digest' } }) + '</div>' : '') +
          '<div class="row gap-2 mt-4">' + ui.btn('Correct this answer', { size: 'sm', icon: 'edit', action: 'hs-correct', attrs: { 'data-id': a.id } }) + ui.btn('Ask Halo', { kind: 'ghost', size: 'sm', icon: 'sparkle', action: 'hs-askit', attrs: { 'data-q': a.q } }) + '</div></article>';
      }).join('') + '</div>';
  }

  function activityTab() {
    var rows = [];
    q.digest().forEach(function (it) {
      var t = it.decidedAt != null ? it.decidedAt : it.t;
      rows.push({ t: it.t - 6, icon: 'eye', src: it.sources[0][0], text: 'Noticed activity in ' + it.sources.map(function (s) { return (H.brands[s[0]] || { name: s[0] }).name; }).join(' and ') });
      rows.push({ t: it.t - 2, icon: 'wand', text: 'Drafted “' + it.title + '”' });
      if (it.status === 'auto' || it.status === 'approved') rows.push({ t: t, icon: 'broadcast', text: 'Shared “' + it.title + '” with ' + AUD[it.audience][0].toLowerCase(), id: it.id, shared: true });
      if (it.status === 'dropped') rows.push({ t: t, icon: 'lock', strong: true, text: 'Dropped “' + it.title + '”. It matched a private topic, so it never left your Halo' });
      if (it.status === 'pending') rows.push({ t: it.t, icon: 'digest', text: 'Held “' + it.title + '” for your digest: ' + (it.reason || 'waiting for you').toLowerCase() });
    });
    H.store.state.asks.forEach(function (a) { rows.push({ t: a.t, icon: 'message', text: 'Answered ' + q.person(a.who).name.split(' ')[0] + '’s question: “' + a.q + '”' + (a.withheld ? ', and held back ' + a.withheld + ' unapproved update' : '') }); });
    H.store.state.history.forEach(function (h) { if (!h.retracted) rows.push({ t: h.t, icon: 'broadcast', text: (h.via === 'manual' ? 'Shared your update with ' : 'Shared an update with ') + AUD[h.audience][0].toLowerCase() + ': “' + (h.text.length > 90 ? h.text.slice(0, 88) + '…' : h.text) + '”', id: h.id, shared: true }); });
    rows.sort(function (a, b) { return b.t - a.t; });
    return '<p class="t-callout c-3" style="max-width:640px">A plain record of what Halo noticed, drafted, shared and held back for you. In Ambient mode this is how you stay in control: anything here can be corrected or retracted.</p>' +
      groupByDay(rows.slice(0, 60), function (r) { return r.t; }).map(function (g) {
        return '<section class="hs-day"><h3 class="hs-day-label">' + g.label + '</h3><div class="card" style="padding:6px 8px">' + g.items.map(function (r) {
          return '<div class="log-row' + (r.strong ? ' accent' : '') + '"><span class="log-time num">' + F.clock(H.at(r.t)) + '</span><span class="log-dot">' + (r.src ? H.brandMark(r.src, 14) : H.icon(r.icon, 13)) + '</span><span class="grow log-text">' + esc(r.text) + '</span>' +
            (r.shared ? '<span class="log-act">' + ui.btn('Retract', { kind: 'ghost', size: 'xs', action: 'hs-retract', attrs: { 'data-id': r.id } }) + '</span>' : '') + '</div>';
        }).join('') + '</div></section>';
      }).join('');
  }

  H.screens.history = {
    title: 'History', pageClass: 'narrow',
    crumbs: function (r) { var t = { asks: 'Asked about you', activity: 'Activity' }[r.parts[0]]; return t ? [{ label: 'History', nav: '#/history' }, { label: t }] : [{ label: 'History' }]; },
    render: function (r) {
      var tab = r.parts[0] === 'asks' ? 'asks' : r.parts[0] === 'activity' ? 'activity' : 'shared';
      var nShared = q.published().length, nAsks = H.store.state.asks.length;
      return '<header class="page-hd"><div><h1>History</h1><p class="lede">Everything Halo has shared for you, every question it answered about you, and everything it did along the way.</p></div></header>' +
        '<nav class="tabs" role="tablist">' +
          '<a class="tab" role="tab" href="#/history" data-nav="#/history" aria-selected="' + (tab === 'shared') + '">Shared updates <span class="key">' + nShared + '</span></a>' +
          '<a class="tab" role="tab" href="#/history/asks" data-nav="#/history/asks" aria-selected="' + (tab === 'asks') + '">Asked about you <span class="key">' + nAsks + '</span></a>' +
          '<a class="tab" role="tab" href="#/history/activity" data-nav="#/history/activity" aria-selected="' + (tab === 'activity') + '">Activity</a></nav>' +
        '<div class="hs-body">' + (tab === 'asks' ? asksTab() : tab === 'activity' ? activityTab() : sharedTab()) + '</div>';
    },
    actions: {
      'hs-aud': function (el) { view.aud = el.dataset.v; H.render(); },
      'hs-search': function (el) { view.search = el.value; H.render(); },
      'hs-retract': function (el) { H.act.retract(el.dataset.id); },
      'hs-askit': function (el) { H.askSend(el.dataset.q); },
      'hs-correct': function (el) { ui.open('ask-correct', { id: el.dataset.id }); }
    }
  };

  var fix = { text: '' };
  H.overlays['ask-correct'] = {
    kind: 'modal', title: 'Correct this answer',
    render: function (p) {
      var a = H.store.state.asks.filter(function (x) { return x.id === p.id; })[0]; if (!a) return '';
      if (fix.id !== a.id) { fix.id = a.id; fix.text = a.a; }
      var who = q.person(a.who);
      return '<div class="modal-hd"><div class="grow"><h2>Correct this answer</h2><p>' + esc(who.name.split(' ')[0]) + ' asked “' + esc(a.q) + '”. Halo will answer this way from now on.</p></div>' + ui.iconBtn('x', 'Close', 'close') + '</div>' +
        '<div class="modal-bd"><label class="label" for="fix-ta">Answer</label><textarea id="fix-ta" class="textarea mt-2" rows="5" autofocus data-input="fix-text" data-mod-enter="fix-save">' + esc(fix.text) + '</textarea>' +
        '<div class="row gap-2 mt-3"><label class="row gap-2 t-callout c-2">' + ui.check(true, 'noop', null, 'square') + '<span>Also send ' + esc(who.name.split(' ')[0]) + ' the corrected answer</span></label></div></div>' +
        '<div class="modal-ft">' + ui.btn('Cancel', { action: 'close' }) + ui.btn('Save correction', { kind: 'primary', action: 'fix-save' }) + '</div>';
    },
    actions: {
      'fix-text': function (el) { fix.text = el.value; },
      'noop': function (el) { el.setAttribute('aria-checked', el.getAttribute('aria-checked') === 'true' ? 'false' : 'true'); },
      'fix-save': function () {
        var id = fix.id, text = fix.text.trim(); if (!text) return;
        H.store.commit(function (s) { s.asks.forEach(function (a) { if (a.id === id) { a.a = text; a.corrected = true; } }); });
        fix.id = null; ui.close(); ui.toast('Saved. Halo will answer this way next time.', { icon: 'check-circle' });
      }
    }
  };
})(window.H = window.H || {});

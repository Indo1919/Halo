/* Meeting recap ('#/recap/:id') — what was decided, and the ticket + subtasks Halo drafted from it.
   Only the error-states kickoff has a recap in this workspace. */
(function (H) {
  'use strict';
  var esc = H.esc, ui = H.ui, q = H.q, F = H.fmt, U = H.util;
  var OWNERS = ['maya', 'sam', 'priya', 'leo', 'hana'];
  var view = { draft: null, loading: false, error: false, fromNotes: false, notesOpen: false, notes: '', txOpen: false, live: false, focusRow: null };

  function kickoff() {
    return H.store.state.events.filter(function (e) { return e.recap === 'kickoff'; })[0] ||
      { id: 'kickoff', title: 'Checkout v3: error states kickoff', start: H.slot(0, '13:30'), end: H.slot(0, '14:15'), people: ['maya', 'priya', 'leo', 'sam', 'hana'], src: 'zoom' };
  }
  function recapState() { var s = H.store.state; return (s.recaps && s.recaps.kickoff) || {}; }
  function created() { var k = recapState().created; return k ? q.ticket(k) : null; }
  function firstNames(ids) { var n = ids.map(function (id) { return (q.person(id) || { name: id }).name.split(' ')[0]; }); return n.length < 2 ? n.join('') : n.slice(0, -1).join(', ') + ' and ' + n[n.length - 1]; }
  function one(v) { var r = Math.round(v * 10) / 10; return (r % 1 ? r.toFixed(1) : String(r)) + 'h'; }
  function half(v) { return Math.round(v * 2) / 2; }
  function numIn(v) { var r = Math.round((+v || 0) * 100) / 100; return String(r); }

  // Written for this demo; the weekdays follow the demo clock so the story stays consistent.
  function content() {
    var mayaDay = F.weekday(H.at(H.bday(2, '17:00'))), leoDay = F.weekday(H.at(H.bday(1, '17:00')));
    return {
      summary: 'We agreed on what buyers see when a payment fails, starting with declined cards, expired cards and 3D Secure failures. Errors stay inline on the payment step so buyers can recover without leaving checkout, and every error state gets measured.',
      decisions: [
        'Design declined, expired and 3DS failure states first. Processor outages and fraud holds come later.',
        'Errors appear inline on the payment step, next to what needs fixing. No separate error page.',
        'Copy names the fix, not the code. Processor error codes stay in the logs.'
      ],
      questions: [
        'After a 3DS timeout, do we retry automatically or ask the buyer first? It depends on CHK-150.',
        'Should merchants see the decline reason in their dashboard? Priya is checking with Support.'
      ],
      actions: [
        { who: 'leo', text: 'Map processor error codes to buyer-facing states', when: leoDay },
        { who: 'maya', text: 'Declined, expired and 3DS flows ready for review', when: mayaDay },
        { who: 'priya', text: 'Error copy, written with the Content team', when: null },
        { who: 'hana', text: 'Instrument error events in the checkout funnel', when: null }
      ],
      transcript: [
        ['00:12', 'priya', 'Thanks for making time. The goal today is agreeing what buyers see when a payment fails.'],
        ['00:41', 'hana', 'Quick context: declines are the biggest drop-off after the payment step, and most of those buyers don’t try again.'],
        ['01:20', 'maya', 'Then let’s start with declined and expired cards. Those are the ones a buyer can fix on the spot.'],
        ['01:48', 'leo', 'And 3D Secure failures. A lot of those are timeouts, which is what CHK-150 is about.'],
        ['02:31', 'sam', 'Can we keep errors inline on the payment step? A separate error page loses the cart on mobile.'],
        ['02:55', 'maya', 'Agreed. Inline, next to the field that needs fixing, with one clear next step.'],
        ['03:40', 'priya', 'So, decision: declined, expired and 3DS first. Outages and fraud holds come later.'],
        ['04:18', 'leo', 'I’ll map the processor codes to buyer-facing states. There are dozens of codes, but they collapse into a handful.'],
        ['05:02', 'priya', 'Copy should name the fix, not the code. I’ll bring in Content for the wording.'],
        ['05:36', 'hana', 'I’ll add error events to the funnel so we can see which states people recover from.'],
        ['06:10', 'sam', 'Open question: after a 3DS timeout, do we retry automatically or ask the buyer?'],
        ['06:32', 'leo', 'Depends on what the processor allows. I’ll know once I have sandbox access.'],
        ['07:15', 'priya', 'One more for later: should merchants see decline reasons in their dashboard? I’ll ask Support.'],
        ['07:58', 'maya', 'I can have the declined, expired and 3DS flows ready for review by ' + mayaDay + '.'],
        ['08:20', 'leo', 'I’ll have the code map to you before then, so the flows use the real states.'],
        ['08:44', 'priya', 'Perfect. Let’s review the flows together then.']
      ]
    };
  }
  function transcriptText() { return content().transcript.map(function (l) { return (q.person(l[1]) || { name: l[1] }).name + ': ' + l[2]; }).join('\n'); }
  function fromAi(j) {
    return {
      title: String(j.title || 'Checkout error and recovery states'), summary: String(j.summary || ''),
      rows: (j.subtasks || []).map(function (s) {
        var o = Math.max(0, +s.o || 1), m = Math.max(o, +s.m || 2), p = Math.max(m, +s.p || 3);
        return { id: U.uid('rs'), title: String(s.title || ''), owner: OWNERS.indexOf(s.owner) >= 0 ? s.owner : 'maya', o: o, m: m, p: p, on: true };
      })
    };
  }
  function draft() { if (!view.draft) view.draft = fromAi(H.ai.demoDecompose()); return view.draft; }
  function estOf(r) { return { est: { o: +r.o || 0, m: +r.m || 0, p: +r.p || 0 } }; }

  /* ---------- Pieces ---------- */
  function header(ev) {
    var a = H.at(ev.start), b = H.at(ev.end), ppl = (ev.people || []).map(q.person).filter(Boolean);
    return '<header class="page-hd rc-hd"><div class="grow" style="min-width:0"><div class="eyebrow">Meeting recap</div><h1 class="mt-2">' + esc(ev.title) + '</h1>' +
      '<div class="rc-meta"><span class="rc-meta-i">' + H.icon('clock', 14) + F.range(a, b) + '</span><span class="rc-meta-i">' + H.icon('calendar', 14) + F.day(a) + ', ' + F.date(a) + '</span>' +
        '<span class="rc-meta-i">' + ui.avatarStack(ppl, 'sm', 5) + '<span>' + U.plural(ppl.length, 'person', 'people') + '</span></span>' +
        '<span class="rc-meta-i rc-srcs">' + ui.src('zoom', 'Zoom transcript') + ui.src('gdocs', 'Kickoff notes') + '</span></div></div>' +
      '<div class="actions">' + ui.btn('Open in calendar', { icon: 'calendar', action: 'nav', attrs: { 'data-to': '#/calendar?e=' + ev.id } }) + '</div></header>';
  }
  function parentBlock(d) {
    var due = H.at(H.bday(2, '17:00')), me = q.me();
    return '<div class="rc-parent"><div class="rc-parent-top"><span class="eyebrow">Parent ticket</span><span class="key">' + esc(H.act.nextKey('CHK')) + '</span></div>' +
      '<label class="sr-only" for="rc-ptitle">Ticket title</label><input id="rc-ptitle" class="rc-ptitle" value="' + esc(d.title) + '" data-input="rc-ptitle" placeholder="Name the ticket" autocomplete="off">' +
      '<div class="rc-props"><span class="rc-prop"><span class="key">CHK</span>Checkout v3</span><span class="rc-prop">' + ui.prio('high') + 'High</span>' +
        '<span class="rc-prop" data-tip="' + esc(F.dateLong(due)) + '">' + H.icon('calendar', 14) + 'Due ' + F.day(due) + '</span><span class="rc-prop">' + ui.avatar(me, 'xs', { tip: false }) + esc(me.name) + '</span></div>' +
      (d.summary ? '<p class="rc-psum">' + esc(d.summary) + '</p>' : '') + '</div>';
  }
  function table(d) {
    var head = '<div class="rc-tr rc-th" role="row"><span role="columnheader" class="rc-c-chk"><span class="sr-only">Include</span></span><span role="columnheader" class="rc-c-title">Subtask</span>' +
      '<span role="columnheader" class="rc-c-owner">Owner</span><span role="columnheader" class="rc-c-est" data-tip="Best case, likely and worst case, in hours">Best · Likely · Worst</span><span role="columnheader" class="rc-c-exp">Expected</span></div>';
    var rows = d.rows.map(function (r, i) {
      var p = q.person(r.owner) || q.me(), e = U.pert(r.o, r.m, r.p), label = r.title || 'this subtask';
      return '<div class="rc-tr' + (r.on ? '' : ' is-off') + '" role="row" data-key="rc-' + r.id + '">' +
        '<span role="cell" class="rc-c-chk">' + ui.check(r.on, 'rc-inc', { 'data-i': i, 'aria-label': 'Include ' + label }, 'square') + '</span>' +
        '<span role="cell" class="rc-c-title"><input class="rc-in" id="rc-in-' + r.id + '" value="' + esc(r.title) + '" data-input="rc-sub-title" data-i="' + i + '" aria-label="Subtask ' + (i + 1) + '" placeholder="Describe the subtask" autocomplete="off"></span>' +
        '<span role="cell" class="rc-c-owner"><button type="button" class="rc-owner" data-action="rc-owner" data-i="' + i + '" aria-haspopup="menu" aria-label="Owner: ' + esc(p.name) + '. Reassign">' + ui.avatar(p, 'xs', { tip: false }) + '<span class="truncate">' + esc(p.name.split(' ')[0]) + '</span>' + H.icon('chevron-down', 12, 'rc-caret') + '</button></span>' +
        '<span role="cell" class="rc-c-est">' + ['o', 'm', 'p'].map(function (f) {
          return '<input class="rc-num" inputmode="decimal" value="' + numIn(r[f]) + '" data-input="rc-est" data-i="' + i + '" data-f="' + f + '" aria-label="' + ({ o: 'Best case', m: 'Likely', p: 'Worst case' })[f] + ' hours for ' + esc(label) + '">';
        }).join('') + '</span>' +
        '<span role="cell" class="rc-c-exp num" data-tip="(best + 4 × likely + worst) ÷ 6">' + one(e.mean) + '</span></div>';
    }).join('');
    return '<div class="rc-table" role="table" aria-label="Drafted subtasks">' + head + rows + '</div>' +
      '<button type="button" class="rc-add" data-action="rc-add">' + H.icon('plus', 14) + 'Add a subtask</button>';
  }
  function totals(d) {
    var me = H.store.state.me, inc = d.rows.filter(function (r) { return r.on; }), roll = U.rollup(inc.map(estOf));
    var mine = inc.filter(function (r) { return r.owner === me; }), share = U.rollup(mine.map(estOf)).mean * q.pace();
    var c = q.capacity(), over = share - c.free, people = inc.map(function (r) { return r.owner; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
    var ds = q.ticket('DS-212'), move = ds && ds.owner === me && ds.status !== 'done' ? ds : q.myTickets().filter(function (t) { return t.status !== 'done' && t.prio === 'low'; })[0];
    var verdict;
    if (!mine.length) verdict = '<p class="rc-verdict">' + H.icon('info', 14) + '<span>Nothing here is assigned to you.</span></p>';
    else if (over <= 0.25) verdict = '<p class="rc-verdict is-ok">' + H.icon('check-circle', 14) + '<span><b>Fits this week</b>, with about ' + F.hours(-over) + ' of focus time to spare.</span></p>';
    else verdict = '<p class="rc-verdict is-warn">' + H.icon('alert', 14) + '<span><b>About ' + F.hours(over) + ' over</b> your ' + F.hours(c.free) + ' of focus time left this week.' +
      (move ? ' Consider moving <span class="key">' + esc(move.key) + '</span>, or give a subtask to a teammate.' : ' Consider giving a subtask to a teammate.') + '</span></p>';
    return '<div class="rc-sum">' +
      '<div class="rc-sum-cell"><div class="rc-sum-k">Team total</div><div class="rc-sum-v">' + (inc.length ? 'About ' + F.hours(roll.mean) : 'Nothing selected') + '</div>' +
        (inc.length ? '<div class="rc-sum-s">' + U.plural(inc.length, 'subtask') + ', ' + U.plural(people.length, 'person', 'people') + ' · usually ' + F.hours(roll.low) + '–' + F.hours(roll.high) + ', 85% within ' + F.hours(roll.p85) + '</div>' : '') + '</div>' +
      '<div class="rc-sum-cell"><div class="rc-sum-k">Your share</div><div class="rc-sum-v">' + (mine.length ? 'About ' + F.hours(share) + ' <span class="rc-sum-at">at your pace</span>' : '0h') + '</div>' + verdict + '</div></div>';
  }
  function skeleton() {
    return '<div class="rc-parent" aria-busy="true"><span class="skeleton" style="display:block;width:96px;height:10px"></span><span class="skeleton" style="display:block;width:58%;height:22px;margin-top:14px"></span><span class="skeleton" style="display:block;width:84%;height:12px;margin-top:16px"></span></div>' +
      '<div class="rc-table" aria-hidden="true">' + [72, 58, 80, 64, 50, 68].map(function (w) {
        return '<div class="rc-tr rc-skel"><span class="skeleton" style="width:16px;height:16px;border-radius:4px"></span><span class="skeleton" style="width:' + w + '%;height:12px"></span><span class="skeleton rc-skel-o" style="width:64px;height:12px"></span><span class="skeleton rc-skel-e" style="width:120px;height:12px"></span><span class="skeleton rc-skel-x" style="width:36px;height:12px"></span></div>';
      }).join('') + '</div>' +
      '<p class="rc-loading" role="status">' + H.icon('sparkle', 14) + 'Halo is reading ' + (view.fromNotes ? 'your notes' : 'the transcript') + ' and drafting subtasks…</p>';
  }
  function notesPanel() {
    return '<div class="rc-notes"><label for="rc-notes" class="label">Your notes</label>' +
      '<textarea id="rc-notes" class="textarea" rows="5" placeholder="Paste your own notes from the meeting. Halo drafts the ticket and subtasks from them instead of the transcript." data-input="rc-notes-in" data-mod-enter="rc-notes-go">' + esc(view.notes) + '</textarea>' +
      '<div class="rc-notes-ft"><span class="hint grow">' + H.icon('lock', 12) + ' Your notes stay in your Halo.</span>' + ui.btn('Cancel', { kind: 'ghost', size: 'sm', action: 'rc-notes' }) +
        ui.btn('Draft from my notes', { size: 'sm', icon: 'sparkle', action: 'rc-notes-go', disabled: !view.notes.trim() || view.loading }) + '</div></div>';
  }
  function hero(ev) {
    var t = created(); if (t) return successCard(t);
    var d = draft(), n = d.rows.filter(function (r) { return r.on && r.title.trim(); }).length;
    var body = view.loading ? skeleton() : parentBlock(d) + (view.error ? '<div class="banner banner-warning rc-err">' + H.icon('alert', 16) + '<span class="grow">Halo couldn’t draft a new version just now. Your current draft is unchanged.</span>' + ui.btn('Try again', { size: 'xs', action: view.fromNotes ? 'rc-notes-go' : 'rc-regen' }) + '</div>' : '') + table(d) + totals(d);
    return '<section class="card rc-hero" aria-label="Drafted ticket and subtasks">' +
      '<div class="rc-hero-hd"><span class="rc-kicker">' + H.icon('sparkle', 16) + 'Drafted by Halo from this meeting</span><div class="rc-hero-tools">' +
        ui.btn('Use my own notes', { kind: 'ghost', size: 'sm', icon: 'file-text', action: 'rc-notes', attrs: { 'aria-expanded': String(view.notesOpen) } }) +
        ui.btn('Regenerate', { size: 'sm', icon: 'refresh', action: 'rc-regen', disabled: view.loading, attrs: { 'data-tip': 'Draft it again from the transcript' } }) + '</div></div>' +
      (view.notesOpen ? notesPanel() : '') + '<div class="rc-hero-bd">' + body + '</div>' +
      '<div class="rc-hero-ft"><span class="hint grow">' + H.icon('info', 12) + ' Each owner sees their subtask in their own Halo. Nothing is created until you confirm.</span>' +
        ui.btn(n ? 'Create 1 ticket + ' + U.plural(n, 'subtask') : 'Create 1 ticket', { kind: 'primary', icon: 'plus', action: 'rc-create', disabled: view.loading || !d.title.trim() }) + '</div></section>';
  }
  function successCard(t) {
    var me = H.store.state.me, subs = t.subtasks || [];
    var others = subs.map(function (s) { return s.owner || t.owner; }).filter(function (v, i, a) { return v !== me && a.indexOf(v) === i; });
    var mine = subs.filter(function (s) { return (s.owner || t.owner) === me && !s.done; }), mineH = U.rollup(mine).mean * q.pace();
    return '<section class="card rc-done" aria-live="polite"><div class="rc-done-top"><span class="rc-done-ic">' + H.icon('check', 20) + '</span><div class="grow" style="min-width:0">' +
      '<div class="eyebrow">Created from this meeting</div><h2 class="rc-done-title"><span class="key">' + esc(t.key) + '</span>' + esc(t.title) + '</h2>' +
      '<p class="rc-done-sub">' + U.plural(subs.length, 'subtask') + (others.length ? ', with ' + esc(firstNames(others)) + ' owning theirs' : '') + '. Due ' + (t.due != null ? F.day(H.at(t.due)) : 'whenever you decide') + '.</p></div></div>' +
      '<ul class="rc-done-list">' + subs.map(function (s) {
        var o = q.person(s.owner || t.owner);
        return '<li>' + ui.status(s.done ? 'done' : 'todo', false) + '<span class="grow truncate">' + esc(s.title) + '</span><span class="rc-done-h num">' + (s.est ? one(U.pert(s.est.o, s.est.m, s.est.p).mean) : '') + '</span>' + ui.avatar(o, 'xs') + '</li>';
      }).join('') + '</ul>' +
      '<div class="rc-done-ft"><span class="hint grow">' + (mine.length ? 'Your part is about ' + F.hours(mineH) + ' at your pace.' : 'None of the subtasks are yours.') + '</span>' +
        (mine.length ? ui.btn('Book time for your part', { icon: 'calendar-plus', action: 'rc-book', attrs: { 'data-tk': t.key } }) : '') +
        ui.btn('Open ' + t.key, { kind: 'primary', action: 'nav', attrs: { 'data-to': '#/tickets/' + t.key }, trail: H.icon('arrow-right', 14) }) + '</div></section>';
  }
  function recapCard(c) {
    var shared = recapState().shared;
    return '<section class="card rc-card" aria-label="Recap"><div class="card-hd"><h2>Recap</h2><span class="sub">Written by Halo</span></div><div class="card-bd">' +
      '<p class="rc-summary">' + esc(c.summary) + '</p>' +
      '<h3 class="rc-h">Decisions</h3><ol class="rc-list rc-decisions">' + c.decisions.map(function (d, i) { return '<li><span class="rc-n num">' + (i + 1) + '</span><span>' + esc(d) + '</span></li>'; }).join('') + '</ol>' +
      '<h3 class="rc-h">Open questions</h3><ul class="rc-list rc-questions">' + c.questions.map(function (d) { return '<li>' + H.icon('help', 14) + '<span>' + esc(d) + '</span></li>'; }).join('') + '</ul>' +
      '<h3 class="rc-h">Action items</h3><ul class="rc-ai">' + c.actions.map(function (a) {
        var p = q.person(a.who);
        return '<li>' + ui.avatar(p, 'sm') + '<div class="grow" style="min-width:0"><div class="rc-ai-text">' + esc(a.text) + '</div><div class="rc-ai-meta">' + esc(p.id === H.store.state.me ? 'You' : p.name.split(' ')[0]) + (a.when ? ' · by ' + esc(a.when) : '') + '</div></div></li>';
      }).join('') + '</ul></div>' +
      '<div class="card-ft">' + (shared ? '<span class="rc-shared">' + H.icon('check-circle', 14) + 'Shared with attendees</span>' : ui.btn('Share recap with attendees', { size: 'sm', icon: 'send', action: 'rc-share' })) + '</div></section>';
  }
  function transcriptCard(c) {
    var open = view.txOpen;
    return '<section class="card rc-tx"><button type="button" class="rc-tx-hd" data-action="rc-tx" aria-expanded="' + open + '" aria-controls="rc-tx-list">' + H.brandMark('zoom', 16) + '<span class="grow">Transcript excerpt</span><span class="rc-tx-count">' + c.transcript.length + ' lines</span>' + H.icon('chevron-down', 16, 'rc-tx-chev') + '</button>' +
      (open ? '<ol class="rc-tx-list" id="rc-tx-list">' + c.transcript.map(function (l) {
        var p = q.person(l[1]);
        return '<li><span class="rc-tx-time num">' + l[0] + '</span><div class="grow" style="min-width:0"><span class="rc-tx-who">' + esc(p ? p.name.split(' ')[0] : l[1]) + '</span><p>' + esc(l[2]) + '</p></div></li>';
      }).join('') + '</ol>' : '') + '</section>';
  }

  /* ---------- Actions ---------- */
  function regenerate(text, fromNotes) {
    if (view.loading || !String(text || '').trim()) return;
    view.loading = true; view.error = false; view.fromNotes = !!fromNotes; H.render();
    H.ai.decompose(text).then(function (j) {
      if (!j || !j.subtasks || !j.subtasks.length) throw { code: 'empty' };
      view.loading = false; view.draft = fromAi(j); view.live = !!j.live; if (fromNotes) view.notesOpen = false;
      H.render(); ui.toast(fromNotes ? 'Drafted from your notes' : 'Halo drafted a fresh version', { icon: 'sparkle' });
    }).catch(function () { view.loading = false; view.error = true; H.render(); });
  }
  function row(el) { return draft().rows[+el.dataset.i]; }
  var actions = {
    'rc-ptitle': function (el) { var d = draft(), had = !!d.title.trim(); d.title = el.value; if (had !== !!d.title.trim()) H.render(); },
    'rc-sub-title': function (el) { var r = row(el); if (!r) return; var had = !!r.title.trim(); r.title = el.value; if (had !== !!r.title.trim()) H.render(); },
    'rc-est': function (el) { var r = row(el), v = parseFloat(el.value); if (!r || isNaN(v) || v < 0) return; r[el.dataset.f] = Math.min(v, 999); H.render(); },
    'rc-inc': function (el) { var r = row(el); if (r) { r.on = !r.on; H.render(); } },
    'rc-owner': function (el) {
      var r = row(el), i = el.dataset.i; if (!r) return;
      ui.menu(el, [{ label: 'Who owns this' }].concat(OWNERS.map(function (id) {
        var p = H.PEOPLE[id];
        return { lead: ui.avatar(p, 'xs', { tip: false }), text: p.name + (id === H.store.state.me ? ' (you)' : ''), hint: p.role.split(',')[0].replace('Senior ', '').replace('Staff ', ''), action: 'rc-owner-set', attrs: { 'data-i': i, 'data-v': id, role: 'menuitemradio' }, checked: r.owner === id };
      })), { width: 300 });
    },
    'rc-owner-set': function (el) { var r = row(el); if (r) { r.owner = el.dataset.v; H.render(); } },
    'rc-add': function () { var r = { id: U.uid('rs'), title: '', owner: H.store.state.me, o: 1, m: 2, p: 3, on: true }; draft().rows.push(r); view.focusRow = r.id; H.render(); },
    'rc-regen': function () { regenerate(transcriptText(), false); },
    'rc-notes': function () { view.notesOpen = !view.notesOpen; H.render(); if (view.notesOpen) setTimeout(function () { var t = document.getElementById('rc-notes'); if (t) t.focus(); }, 30); },
    'rc-notes-in': function (el) { var had = !!view.notes.trim(); view.notes = el.value; if (had !== !!view.notes.trim()) H.render(); },
    'rc-notes-go': function () { regenerate(view.notes, true); },
    'rc-tx': function () { view.txOpen = !view.txOpen; H.render(); },
    'rc-book': function (el) { ui.open('booktime', { key: el.dataset.tk }); },
    'rc-share': function () {
      var c = content();
      H.act.post(c.summary, 'team', { sources: [['zoom', 'Error states kickoff'], ['gdocs', 'Kickoff notes']] });
      H.store.commit(function (s) { s.recaps = s.recaps || {}; s.recaps.kickoff = Object.assign({}, s.recaps.kickoff, { shared: true }); });
    },
    'rc-create': function () {
      var d = draft(), me = H.store.state.me, ev = kickoff(), c = content();
      if (!d.title.trim()) { var ti = document.getElementById('rc-ptitle'); if (ti) ti.focus(); return; }
      var inc = d.rows.filter(function (r) { return r.on && r.title.trim(); }), roll = U.rollup(inc.map(estOf));
      var t = H.act.createTicket({
        title: d.title.trim(), project: 'CHK', prio: 'high', due: H.bday(2, '17:00'),
        est: inc.length ? { o: half(roll.low), m: half(roll.mean), p: half(roll.high) } : { o: 2, m: 4, p: 8 },
        desc: d.summary || c.summary,
        origin: { kind: 'meeting', label: ev.title, t: ev.end, recap: 'kickoff' },
        subtasks: inc.map(function (r) { return { id: U.uid('st'), title: r.title.trim(), done: false, est: { o: +r.o || 0, m: +r.m || 0, p: +r.p || 0 }, owner: r.owner }; }),
        watchers: (ev.people || []).filter(function (id) { return id !== me; }),
        links: [{ src: 'zoom', label: ev.title }, { src: 'gdocs', label: 'Kickoff notes' }]
      });
      H.store.commit(function (s) { s.recaps = s.recaps || {}; s.recaps.kickoff = Object.assign({}, s.recaps.kickoff, { created: t.key }); });
      H.chime();
      ui.toast(t.key + ' created with ' + U.plural(inc.length, 'subtask'), { icon: 'ticket', action: function () { H.go('#/tickets/' + t.key); }, actionLabel: 'Open' });
      var c2 = document.getElementById('content'); if (c2) c2.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  H.screens.recap = {
    title: 'Recap',
    docTitle: function () { return 'Recap · ' + kickoff().title + ' · Halo'; },
    crumbs: function () { return [{ label: 'Calendar', nav: '#/calendar' }, { label: 'Recap' }]; },
    pageClass: 'wide rc-page',
    render: function (r) {
      var id = r.parts[0] || 'kickoff';
      if (id !== 'kickoff') {
        return '<div class="card rc-404">' + ui.empty('wand', 'No recap here', 'Halo writes a recap when a meeting with a transcript ends. This one doesn’t exist, or it was removed.',
          ui.btn('Back to calendar', { kind: 'primary', icon: 'arrow-left', action: 'nav', attrs: { 'data-to': '#/calendar' } })) + '</div>';
      }
      var ev = kickoff(), c = content();
      return header(ev) + '<div class="rc">' + '<div class="rc-main">' + hero(ev) + '</div>' + '<div class="rc-side">' + recapCard(c) + transcriptCard(c) + '</div></div>';
    },
    after: function () {
      if (view.focusRow) { var i = document.getElementById('rc-in-' + view.focusRow); view.focusRow = null; if (i) i.focus(); }
    },
    actions: actions
  };
})(window.H = window.H || {});

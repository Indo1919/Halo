/* Manual input surface (Quick add: update / ticket / time) and Book time. */
(function (H) {
  'use strict';
  var esc = H.esc, ui = H.ui, q = H.q, U = H.util;
  var KEY_RE = /\b(CHK|INV|DS)-\d+\b/i, TIME_RE = /(\d+(?:\.\d+)?)\s*(h|hr|hrs|hours?|m|mins?|minutes?)\b/i;
  var draft = { type: 'update', text: '', audience: 'team', title: '', project: 'CHK', prio: 'medium', o: 2, m: 4, p: 8, due: 'week', ticket: '', mins: 60, when: 'today', note: '', busy: false };

  function parse(text) {
    var k = KEY_RE.exec(text || ''), t = TIME_RE.exec(text || ''), mins = null;
    if (t) mins = /^h/i.test(t[2]) ? Math.round(parseFloat(t[1]) * 60) : Math.round(parseFloat(t[1]));
    return { key: k ? k[0].toUpperCase() : null, mins: mins };
  }
  function dueOffset(v) { return { today: H.slot(0, '17:00'), tomorrow: H.slot(1, '17:00'), week: H.slot(Math.max(0, 4 - ((H.now().getDay() + 6) % 7)), '17:00'), next: H.slot(7, '17:00'), none: null }[v]; }

  H.overlays.quickadd = {
    kind: 'modal', title: 'New',
    render: function (p) {
      var d = draft, type = d.type, body = '', foot = '';
      if (type === 'update') {
        var ps = parse(d.text), t = ps.key && q.ticket(ps.key);
        body = '<div class="field"><label for="qa-text" class="sr-only">Update</label><textarea id="qa-text" class="textarea" rows="4" autofocus placeholder="What happened? For example: Finished wallet placement for CHK-145, took about 2h" data-input="qa-field" data-field="text" data-mod-enter="qa-submit">' + esc(d.text) + '</textarea>' +
          '<div class="row gap-2 wrap" style="min-height:24px">' +
            (t ? '<span class="badge badge-lg">' + ui.status(t.status, false) + '<span class="mono">' + t.key + '</span><span class="truncate" style="max-width:220px">' + esc(t.title) + '</span></span>' : '') +
            (ps.mins ? '<span class="badge badge-lg">' + H.icon('clock', 12) + 'Logs ' + H.fmt.hm(ps.mins) + '</span>' : '') +
            (!t && !ps.mins ? '<span class="hint">Mention a ticket key or a duration and Halo links it for you.</span>' : '') +
          '</div></div>' +
          '<div class="row gap-3 mt-4 wrap"><span class="label">Share with</span>' + ui.seg('qa-audience', [{ v: 'team', label: 'Team', icon: 'teammate' }, { v: 'manager', label: 'Manager', icon: 'manager' }, { v: 'exec', label: 'Leadership', icon: 'exec' }], d.audience, { action: 'qa-seg', size: 'sm' }) + '</div>';
        foot = ui.btn('Polish in my voice', { kind: 'ghost', icon: 'sparkle', action: 'qa-polish', disabled: !d.text.trim(), cls: d.busy ? 'is-loading' : '' }) + '<span class="grow"></span>' +
          ui.btn('Add to digest', { action: 'qa-later', disabled: !d.text.trim() }) + ui.btn('Share now', { kind: 'primary', action: 'qa-submit', disabled: !d.text.trim(), kbd: U.mod + '↵' });
      } else if (type === 'ticket') {
        var e = U.pert(d.o, d.m, d.p), pace = q.pace();
        body = '<div class="field"><label for="qa-title">Title</label><input id="qa-title" class="input" autofocus placeholder="Short and specific, like “Design declined-card state”" value="' + esc(d.title) + '" data-input="qa-field" data-field="title" data-enter="qa-submit"></div>' +
          '<div class="grid-2 mt-4" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
            '<div class="field"><label for="qa-project">Project</label><select id="qa-project" class="select" data-change="qa-field" data-field="project">' + Object.keys(H.PROJECTS).map(function (k) { return '<option value="' + k + '"' + (d.project === k ? ' selected' : '') + '>' + esc(H.PROJECTS[k].name) + '</option>'; }).join('') + '</select></div>' +
            '<div class="field"><label for="qa-due">Due</label><select id="qa-due" class="select" data-change="qa-field" data-field="due">' + [['today', 'Today'], ['tomorrow', 'Tomorrow'], ['week', 'End of this week'], ['next', 'Next week'], ['none', 'No due date']].map(function (o) { return '<option value="' + o[0] + '"' + (d.due === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div></div>' +
          '<div class="field mt-4"><span class="label">Priority</span>' + ui.seg('qa-prio', ['urgent', 'high', 'medium', 'low'].map(function (v) { return { v: v, label: ui.prioLabel(v) }; }), d.prio, { action: 'qa-seg', size: 'sm' }).replace(/<span>(Urgent|High|Medium|Low)<\/span>/g, function (m, l) { return '<span class="prio prio-' + l.toLowerCase() + '"></span>' + m; }) + '</div>' +
          '<div class="field mt-4"><span class="label">Estimate <span class="c-3 t-caption" style="font-weight:400">in hours</span></span>' +
            '<div class="row gap-3 wrap">' + [['o', 'Best case'], ['m', 'Likely'], ['p', 'Worst case']].map(function (x) {
              return '<div class="col gap-1"><span class="t-caption c-3">' + x[1] + '</span><div class="stepper"><button type="button" data-action="qa-step" data-k="' + x[0] + '" data-d="-0.5" aria-label="Less">' + H.icon('minus', 14) + '</button><input inputmode="decimal" value="' + d[x[0]] + '" data-input="qa-field" data-field="' + x[0] + '" aria-label="' + x[1] + ' hours"><button type="button" data-action="qa-step" data-k="' + x[0] + '" data-d="0.5" aria-label="More">' + H.icon('plus', 14) + '</button></div></div>';
            }).join('') + '</div>' +
            '<div class="estimate-line">' + H.icon('timer', 16) + '<span>Expect about <strong>' + H.fmt.hours(e.mean * pace) + '</strong> (' + H.fmt.hours(e.low * pace) + '–' + H.fmt.hours(e.high * pace) + '), adjusted for your pace of ' + pace.toFixed(2) + '×.</span></div></div>';
        foot = '<span class="hint grow">You can add subtasks after creating it.</span>' + ui.btn('Create ticket', { kind: 'primary', action: 'qa-submit', disabled: !d.title.trim() });
      } else {
        var open = q.myTickets().filter(function (x) { return x.status !== 'done'; });
        if (!d.ticket && open[0]) d.ticket = open[0].key;
        body = '<div class="field"><label for="qa-ticket">Ticket</label><select id="qa-ticket" class="select" data-change="qa-field" data-field="ticket">' + open.map(function (x) { return '<option value="' + x.key + '"' + (d.ticket === x.key ? ' selected' : '') + '>' + x.key + ' · ' + esc(x.title) + '</option>'; }).join('') + '</select></div>' +
          '<div class="field mt-4"><span class="label">Time spent</span><div class="row gap-2 wrap">' + [15, 30, 45, 60, 90, 120, 180].map(function (m) { return '<button type="button" class="chip" aria-pressed="' + (d.mins === m) + '" data-action="qa-mins" data-v="' + m + '">' + H.fmt.hm(m) + '</button>'; }).join('') + '</div></div>' +
          '<div class="field mt-4"><span class="label">When</span>' + ui.seg('qa-when', [{ v: 'today', label: 'Today' }, { v: 'yesterday', label: 'Yesterday' }], d.when, { action: 'qa-seg', size: 'sm' }) + '</div>' +
          '<div class="field mt-4"><label for="qa-note">Note <span class="c-3 t-caption" style="font-weight:400">optional</span></label><input id="qa-note" class="input" placeholder="What you worked on" value="' + esc(d.note) + '" data-input="qa-field" data-field="note" data-enter="qa-submit"></div>' +
          '<div class="banner mt-4">' + H.icon('info', 16) + '<span>Halo already logs time from focus blocks and edit sessions. Use this for work it can’t see, like whiteboarding or calls.</span></div>';
        foot = '<span class="grow"></span>' + ui.btn('Log ' + H.fmt.hm(d.mins), { kind: 'primary', action: 'qa-submit', disabled: !d.ticket });
      }
      return '<div class="modal-hd"><div class="grow">' + ui.seg('qa-type', [{ v: 'update', label: 'Update', icon: 'edit' }, { v: 'ticket', label: 'Ticket', icon: 'ticket' }, { v: 'time', label: 'Time', icon: 'clock' }], type, { action: 'qa-seg' }) + '</div>' + ui.iconBtn('x', 'Close', 'close') + '</div>' +
        '<div class="modal-bd">' + body + '</div><div class="modal-ft">' + foot + '</div>';
    },
    onOpen: function (root, p) { if (p && p.type) { draft.type = p.type; H.render(); } if (p && p.text) { draft.text = p.text; H.render(); } },
    actions: {
      'qa-seg': function (el) {
        var n = el.dataset.name, v = el.dataset.v;
        if (n === 'qa-type') draft.type = v; else if (n === 'qa-audience') draft.audience = v; else if (n === 'qa-prio') draft.prio = v; else if (n === 'qa-when') draft.when = v;
        H.render(); if (n === 'qa-type') setTimeout(function () { var f = document.querySelector('#overlay [autofocus]'); if (f) f.focus(); }, 30);
      },
      'qa-field': function (el) { var f = el.dataset.field; draft[f] = /^[omp]$/.test(f) ? Math.max(0, parseFloat(el.value) || 0) : el.value; H.render(); },
      'qa-step': function (el) { var k = el.dataset.k; draft[k] = Math.max(0, Math.round((draft[k] + parseFloat(el.dataset.d)) * 2) / 2); if (draft.o > draft.m) draft.m = draft.o; if (draft.m > draft.p) draft.p = draft.m; H.render(); },
      'qa-mins': function (el) { draft.mins = +el.dataset.v; H.render(); },
      'qa-polish': function () {
        if (!draft.text.trim()) return; draft.busy = true; H.render();
        H.ai.rewrite(draft.text, draft.audience).then(function (out) { draft.text = out; draft.busy = false; H.render(); var ta = document.getElementById('qa-text'); if (ta) { ta.value = out; ta.focus(); } }, function () { draft.busy = false; H.render(); });
      },
      'qa-later': function () {
        var ps = parse(draft.text);
        H.store.commit(function (s) { var id = U.uid('d'); s.digest.items.push({ id: id, kind: 'note', title: 'Your update', audience: draft.audience, conf: 1, t: 0, ticket: ps.key, text: draft.text.trim(), sources: [['halo', 'Written by you']], manual: true }); s.digest.decisions[id] = { status: 'pending', t: 0 }; });
        draft.text = ''; ui.close(); ui.toast('Added to today’s digest', { icon: 'digest' });
      },
      'qa-submit': function () {
        var d = draft;
        if (d.type === 'update') {
          if (!d.text.trim()) return; var ps = parse(d.text);
          if (ps.key && ps.mins && q.ticket(ps.key)) H.store.commit(function (s) { s.tickets.forEach(function (t) { if (t.key === ps.key) t.logged = (t.logged || 0) + ps.mins / 60; }); }, { render: false });
          H.act.post(d.text.trim(), d.audience, { ticket: ps.key }); d.text = ''; ui.close();
        } else if (d.type === 'ticket') {
          if (!d.title.trim()) return;
          var t = H.act.createTicket({ title: d.title.trim(), project: d.project, prio: d.prio, est: { o: d.o, m: d.m, p: d.p }, due: dueOffset(d.due) });
          d.title = ''; ui.close(); ui.toast(t.key + ' created', { icon: 'ticket', action: function () { H.go('#/tickets/' + t.key); }, actionLabel: 'Open' });
        } else {
          if (!d.ticket) return;
          H.store.commit(function (s) { s.tickets.forEach(function (t) { if (t.key === d.ticket) t.logged = (t.logged || 0) + d.mins / 60; }); });
          ui.close(); ui.toast('Logged ' + H.fmt.hm(d.mins) + ' on ' + d.ticket, { icon: 'clock' }); d.note = '';
        }
      }
    }
  };

  /* ---------- Book time ---------- */
  H.freeSlots = function (mins, days) {
    var out = [], now = H.now(), ev = q.events();
    for (var off = 0, found = 0; off < 10 && found < (days || 4); off++) {
      var day = U.addDays(U.startOfDay(now), off); if (day.getDay() === 0 || day.getDay() === 6) continue;
      var s = new Date(day); s.setHours(9, 0, 0, 0); var e = new Date(day); e.setHours(17, 30, 0, 0);
      if (off === 0) { var n = new Date(now); n.setMinutes(Math.ceil((n.getMinutes() + 5) / 15) * 15, 0, 0); if (n > s) s = n; }
      var busy = ev.filter(function (x) { return U.sameDay(H.at(x.start), day); }).map(function (x) { return [H.at(x.start), H.at(x.end)]; }).sort(function (a, b) { return a[0] - b[0]; });
      var cur = s, slot = null;
      for (var i = 0; i <= busy.length && !slot; i++) {
        var end = i < busy.length ? busy[i][0] : e;
        if ((end - cur) / 60000 >= mins) slot = cur;
        if (i < busy.length && busy[i][1] > cur) cur = busy[i][1];
      }
      if (slot && (e - slot) / 60000 >= mins) { out.push(H.minOf(slot)); found++; }
    }
    return out;
  };
  var bt = { key: null, mins: 90, pick: null };
  H.overlays.booktime = {
    kind: 'modal', title: 'Book focus time',
    render: function (p) {
      var open = q.myTickets().filter(function (x) { return x.status !== 'done'; });
      if (!bt.key || !q.ticket(bt.key)) bt.key = (p && p.key) || (open[0] && open[0].key);
      var t = q.ticket(bt.key), rem = t ? q.remaining(t) * q.pace() : 0;
      var slots = H.freeSlots(bt.mins, 4); if (bt.pick == null || slots.indexOf(bt.pick) < 0) bt.pick = slots[0];
      return '<div class="modal-hd"><div class="grow"><h2>Book focus time</h2><p>Halo finds open time on your calendar and protects it.</p></div>' + ui.iconBtn('x', 'Close', 'close') + '</div>' +
        '<div class="modal-bd col gap-4">' +
          '<div class="field"><label for="bt-ticket">For</label><select id="bt-ticket" class="select" data-change="bt-ticket">' + open.map(function (x) { return '<option value="' + x.key + '"' + (x.key === bt.key ? ' selected' : '') + '>' + x.key + ' · ' + esc(x.title) + '</option>'; }).join('') + '</select>' +
          (t ? '<span class="hint">About ' + H.fmt.hours(rem) + ' of work left, at your usual pace.</span>' : '') + '</div>' +
          '<div class="field"><span class="label">Length</span><div class="row gap-2 wrap">' + [30, 60, 90, 120, 180].map(function (m) { return '<button type="button" class="chip" aria-pressed="' + (bt.mins === m) + '" data-action="bt-mins" data-v="' + m + '">' + H.fmt.hm(m) + '</button>'; }).join('') + '</div></div>' +
          '<div class="field"><span class="label">Open slots</span>' + (slots.length ? '<div class="col gap-2">' + slots.map(function (m) {
            var a = H.at(m), b = H.at(m + bt.mins);
            return '<button type="button" class="choice" aria-checked="' + (m === bt.pick) + '" data-action="bt-pick" data-v="' + m + '"><span class="radio"></span><span class="grow"><span class="item-title" style="display:block">' + H.fmt.day(a) + '</span><span class="item-sub">' + H.fmt.range(a, b) + '</span></span>' + (m === slots[0] ? ui.badge('Soonest', 'accent') : '') + '</button>';
          }).join('') + '</div>' : '<div class="banner">' + H.icon('calendar', 16) + '<span>No open ' + H.fmt.hm(bt.mins) + ' block in the next few days. Try a shorter length.</span></div>') + '</div>' +
        '</div><div class="modal-ft"><span class="hint grow">' + H.icon('lock', 12) + ' Shows as “Focus” to others. Ticket details stay private.</span>' + ui.btn('Book ' + H.fmt.hm(bt.mins), { kind: 'primary', action: 'bt-book', disabled: bt.pick == null }) + '</div>';
    },
    onOpen: function (root, p) { if (p && p.key) { bt.key = p.key; H.render(); } },
    actions: {
      'bt-ticket': function (el) { bt.key = el.value; H.render(); },
      'bt-mins': function (el) { bt.mins = +el.dataset.v; bt.pick = null; H.render(); },
      'bt-pick': function (el) { bt.pick = +el.dataset.v; H.render(); },
      'bt-book': function () { if (bt.pick == null) return; ui.close(); H.act.bookTime(bt.key, bt.pick, bt.mins); bt.pick = null; }
    }
  };
})(window.H = window.H || {});

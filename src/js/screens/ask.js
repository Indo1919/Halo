/* Ask Halo — conversational query, answered in your voice at the altitude you choose. */
(function (H) {
  'use strict';
  var esc = H.esc, ui = H.ui, q = H.q, F = H.fmt, U = H.util;
  var view = { draft: '', streaming: null, ctl: null, listOpen: false };
  var AUD = [{ v: 'team', label: 'Team', icon: 'teammate' }, { v: 'manager', label: 'Manager', icon: 'manager' }, { v: 'exec', label: 'Leadership', icon: 'exec' }];
  var AUD_NAME = { team: 'Team', manager: 'Manager', exec: 'Leadership' };
  var SUGGEST = [
    ['trending', 'What did I ship this week?'], ['message', 'Draft my standup'], ['ticket', 'Where is CHK-142?'],
    ['alert', 'What’s blocking me?'], ['manager', 'Summarize my week for Rosa'], ['teammate', 'What is Sam working on?']
  ];

  function chat() { return H.store.state.chat; }
  function seed() {
    var c = chat(); if (c.seeded) return; c.seeded = true;
    var t1 = H.bday(-1, '09:12'), t2 = H.bday(-2, '16:40');
    c.threads = [
      { id: 'th_standup', title: 'Draft my standup', audience: 'team', t: t1, messages: [
        { role: 'user', text: 'Draft my standup', t: t1 },
        { role: 'assistant', audience: 'team', live: false, t: t1, text: 'Yesterday: wrapped the selector audit and shared three layout options in #checkout-design. Today: finishing the INV-88 handoff with Sam, then back on CHK-142. Blockers: none.' }] },
      { id: 'th_chk142', title: 'What changed on CHK-142 this week?', audience: 'manager', t: t2, messages: [
        { role: 'user', text: 'What changed on CHK-142 this week?', t: t2 },
        { role: 'assistant', audience: 'manager', live: false, t: t2, text: 'CHK-142 moved from wireframes to high fidelity. The audit is done, three layouts were explored, and Priya and Sam agreed on the segmented list. Cards and bank transfer are designed; wallets are next.' }] }
    ].concat(c.threads || []);
    H.store.save();
  }
  function thread(id) { return chat().threads.filter(function (t) { return t.id === id; })[0]; }
  function active(r) { var id = r && r.parts[0]; return id ? thread(id) : null; }
  function audience() { return H.store.state.prefs.askAudience || 'manager'; }

  function fmtAnswer(text) {
    var lines = String(text || '').replace(/\*\*(.+?)\*\*/g, '$1').split(/\n+/), html = '', list = false;
    lines.forEach(function (l) {
      var m = /^\s*[-•*]\s+(.*)$/.exec(l);
      var body = esc(m ? m[1] : l).replace(/\b(CHK|INV|DS)-\d+\b/g, function (k) { return '<a class="ask-key" href="#/tickets/' + k + '" data-nav="#/tickets/' + k + '">' + k + '</a>'; });
      if (m) { if (!list) { html += '<ul>'; list = true; } html += '<li>' + body + '</li>'; }
      else { if (list) { html += '</ul>'; list = false; } if (body.trim()) html += '<p>' + body + '</p>'; }
    });
    return html + (list ? '</ul>' : '');
  }
  function teammateIn(text) {
    var lower = String(text).toLowerCase();
    return Object.keys(H.PEOPLE).filter(function (id) { return id !== H.store.state.me && lower.indexOf(H.PEOPLE[id].name.split(' ')[0].toLowerCase()) >= 0; })[0];
  }

  function message(m, i, th) {
    if (m.role === 'user') return '<div class="msg user" data-key="m' + i + '"><div class="bubble">' + esc(m.text) + '</div></div>';
    var streaming = view.streaming && view.streaming.thread === th.id && view.streaming.index === i;
    var prevQ = (th.messages.slice(0, i).filter(function (x) { return x.role === 'user'; }).pop() || {}).text || '';
    var who = teammateIn(prevQ), mate = who && H.PEOPLE[who];
    var others = AUD.filter(function (a) { return a.v !== m.audience; });
    return '<div class="msg ai" data-key="m' + i + '"><span class="msg-av">' + ui.mark(16) + '</span><div class="msg-body">' +
      '<div class="msg-meta"><b>Halo</b><span class="sep"></span><span>' + H.icon(AUD.filter(function (a) { return a.v === m.audience; })[0].icon, 12) + ' For ' + AUD_NAME[m.audience].toLowerCase() + '</span>' +
        (m.rewrite ? '<span class="sep"></span><span>Rewritten</span>' : '') +
        (!streaming ? '<span class="sep"></span><span class="' + (m.live ? 'c-success' : '') + '">' + (m.live ? 'Live' : m.stopped ? 'Stopped' : 'Demo answer') + '</span>' : '') + '</div>' +
      (mate && !mate.manager && !mate.exec ? '<div class="msg-note">' + H.icon('lock', 12) + '<span>Answered only from what ' + esc(mate.name.split(' ')[0]) + '’s Halo has shared</span></div>' : '') +
      '<div class="msg-text' + (streaming ? ' typing-caret' : '') + '"' + (streaming ? ' id="msg-live" data-morph="skip"' : '') + '>' + (m.text ? fmtAnswer(m.text) : '<span class="msg-thinking"><i></i><i></i><i></i></span>') + '</div>' +
      (!streaming && m.text ? '<div class="msg-actions">' +
        ui.btn('Copy', { kind: 'ghost', size: 'xs', icon: 'copy', action: 'ask-copy', attrs: { 'data-i': i } }) +
        others.map(function (a) { return ui.btn('For ' + a.label.toLowerCase(), { kind: 'ghost', size: 'xs', icon: 'repeat', action: 'ask-rewrite', attrs: { 'data-i': i, 'data-v': a.v, 'data-tip': 'Ask again, written for ' + a.label.toLowerCase() } }); }).join('') +
        ui.btn('Share as update', { kind: 'ghost', size: 'xs', icon: 'broadcast', action: 'ask-share', attrs: { 'data-i': i } }) +
        '<span class="grow"></span>' + ui.iconBtn('thumbs-up', 'Helpful', 'ask-fb', { size: 'xs', iconSize: 14, attrs: { 'data-v': 'up' } }) + ui.iconBtn('thumbs-down', 'Not helpful', 'ask-fb', { size: 'xs', iconSize: 14, attrs: { 'data-v': 'down' } }) +
      '</div>' : '') + '</div></div>';
  }

  function composer() {
    var st = H.ai.status(), busy = !!view.streaming;
    return '<div class="ask-composer"><div class="ask-box">' +
      '<label for="ask-in" class="sr-only">Ask Halo</label><textarea id="ask-in" rows="1" placeholder="Ask about your work, a ticket, or a teammate" data-input="ask-draft" data-enter="ask-send">' + esc(view.draft) + '</textarea>' +
      '<div class="ask-box-ft">' + ui.seg('askAudience', AUD, audience(), { action: 'ask-aud', size: 'sm', label: 'Answer for' }) +
        '<button type="button" class="live-pill' + (st.live ? ' on' : '') + ' hide-phone" data-nav="#/settings/ai" data-tip="' + esc(st.detail) + '"><span class="dot"></span>' + esc(st.label) + '</button>' +
        '<span class="grow"></span>' +
        (busy ? ui.btn('Stop', { size: 'sm', icon: 'stop', action: 'ask-stop' }) : '<button type="button" class="ask-send" data-action="ask-send" aria-label="Send" data-tip="Send" data-kbd="↵"' + (view.draft.trim() ? '' : ' disabled') + '>' + H.icon('arrow-up', 18) + '</button>') +
      '</div></div><p class="ask-foot">Halo answers from your tickets, calendar and published updates. It never shares anything you haven’t approved.</p></div>';
  }

  function listPane(cur) {
    var ts = chat().threads.slice().sort(function (a, b) { return b.t - a.t; }).slice(0, 20);
    var today = ts.filter(function (t) { return U.sameDay(H.at(t.t), H.now()); }), earlier = ts.filter(function (t) { return today.indexOf(t) < 0; });
    var row = function (t) {
      return '<a class="th-row' + (cur && cur.id === t.id ? ' is-active' : '') + '" href="#/ask/' + t.id + '" data-nav="#/ask/' + t.id + '" data-key="th-' + t.id + '"><span class="th-title truncate">' + esc(t.title) + '</span><span class="th-meta">' + H.icon(AUD.filter(function (a) { return a.v === t.audience; })[0].icon, 12) + '<span>' + F.rel(H.at(t.t)) + '</span></span></a>';
    };
    return '<aside class="ask-list' + (view.listOpen ? ' is-open' : '') + '"><div class="ask-list-hd"><span class="t-strong">Conversations</span>' + ui.iconBtn('edit', 'New conversation', 'ask-new', { size: 'sm', iconSize: 16 }) + '</div>' +
      '<div class="ask-list-bd">' + (today.length ? '<div class="th-group">Today</div>' + today.map(row).join('') : '') + (earlier.length ? '<div class="th-group">Earlier</div>' + earlier.map(row).join('') : '') +
      (!ts.length ? '<p class="t-caption c-3" style="padding:12px">Your conversations appear here.</p>' : '') + '</div></aside>';
  }

  function hero() {
    return '<div class="ask-hero rise"><div class="ask-hero-mark">' + ui.mark(30) + '</div><h1>Ask anything about your work</h1>' +
      '<p>Halo answers from your tickets, calendar and the updates you’ve shared, in your voice, at the altitude you pick.</p>' +
      '<div class="ask-suggest">' + SUGGEST.map(function (s) { return '<button type="button" class="suggest" data-action="ask-suggest" data-q="' + esc(s[1]) + '">' + H.icon(s[0], 16) + '<span>' + esc(s[1]) + '</span></button>'; }).join('') + '</div></div>';
  }

  H.screens.ask = {
    title: 'Ask Halo', pageClass: 'full',
    crumbs: function (r) { var t = active(r); return t ? [{ label: 'Ask Halo', nav: '#/ask' }, { label: t.title }] : [{ label: 'Ask Halo' }]; },
    toolbar: function (r) { return active(r) ? ui.btn('New', { kind: 'ghost', size: 'sm', icon: 'edit', action: 'ask-new' }) : ''; },
    render: function (r) {
      seed();
      var th = active(r);
      if (r.parts[0] && !th) return '<div class="ask">' + listPane(null) + '<section class="ask-main"><div class="ask-scroll">' + ui.empty('ask', 'This conversation isn’t here anymore', 'Start a new one. Halo keeps your last 20 conversations.', ui.btn('New conversation', { kind: 'primary', action: 'ask-new' })) + '</div>' + composer() + '</section></div>';
      return '<div class="ask">' + listPane(th) + '<section class="ask-main">' +
        '<div class="ask-phone-bar show-phone">' + ui.btn('Conversations', { kind: 'ghost', size: 'sm', icon: 'history', action: 'ask-list' }) + '<span class="grow"></span>' + ui.btn('New', { kind: 'ghost', size: 'sm', icon: 'edit', action: 'ask-new' }) + '</div>' +
        '<div class="ask-scroll" id="ask-scroll"><div class="ask-thread">' + (th ? th.messages.map(function (m, i) { return message(m, i, th); }).join('') : hero()) + '</div></div>' +
        composer() + '</section>' + (view.listOpen ? '<div class="scrim show-phone" data-action="ask-list" style="z-index:30"></div>' : '') + '</div>';
    },
    after: function () {
      var ta = document.getElementById('ask-in');
      if (ta) { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 200) + 'px'; }
      if (view.pin) { var sc = document.getElementById('ask-scroll'); if (sc) sc.scrollTop = sc.scrollHeight; view.pin = false; }
    },
    leave: function () { if (view.ctl) view.ctl.abort(); },
    actions: {
      'ask-draft': function (el) { view.draft = el.value; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 200) + 'px'; var b = document.querySelector('.ask-send'); if (b) b.disabled = !view.draft.trim(); },
      'ask-send': function () { if (view.streaming) return; var t = view.draft.trim(); if (t) send(t); },
      'ask-suggest': function (el) { send(el.dataset.q, true); },
      'ask-aud': function (el) { H.act.setPref('askAudience', el.dataset.v); },
      'ask-new': function () { if (view.ctl) view.ctl.abort(); view.listOpen = false; view.draft = ''; H.go('#/ask'); setTimeout(function () { var i = document.getElementById('ask-in'); if (i) i.focus(); }, 60); },
      'ask-list': function () { view.listOpen = !view.listOpen; H.render(); },
      'ask-stop': function () { if (view.ctl) view.ctl.abort(); },
      'ask-copy': function (el) { var th = active(H.route), m = th && th.messages[+el.dataset.i]; if (m) U.copy(m.text).then(function (ok) { ui.toast(ok === false ? 'Couldn\u2019t copy here. Select the text instead.' : 'Copied', { icon: ok === false ? 'alert' : 'copy' }); }); },
      'ask-share': function (el) { var th = active(H.route), m = th && th.messages[+el.dataset.i]; if (m) ui.open('quickadd', { type: 'update', text: m.text }); },
      'ask-fb': function (el) { ui.toast(el.dataset.v === 'up' ? 'Thanks. Halo will keep answering like this.' : 'Thanks. Halo will adjust how it answers you.', { icon: el.dataset.v === 'up' ? 'thumbs-up' : 'thumbs-down' }); },
      'ask-rewrite': function (el) {
        var th = active(H.route); if (!th || view.streaming) return;
        var i = +el.dataset.i, qm = th.messages.slice(0, i).filter(function (x) { return x.role === 'user'; }).pop(); if (!qm) return;
        run(th, qm.text, el.dataset.v, true);
      }
    }
  };

  function send(text, fromSuggestion) {
    var r = H.route, th = r.name === 'ask' ? active(r) : null;
    if (!th) {
      th = { id: U.uid('th'), title: text.length > 60 ? text.slice(0, 57) + '…' : text, audience: audience(), t: 0, messages: [] };
      H.store.state.chat.threads.unshift(th);
      if (H.store.state.chat.threads.length > 20) H.store.state.chat.threads.length = 20;
    }
    th.messages.push({ role: 'user', text: text, t: 0 }); th.t = 0;
    view.draft = ''; H.store.save();
    if (H.route.path !== '#/ask/' + th.id) H.go('#/ask/' + th.id); else H.render();
    run(th, text, audience(), false);
  }
  function run(th, text, aud, rewrite) {
    var history = th.messages.filter(function (m) { return m.text; }).slice(-7, -1).map(function (m) { return { role: m.role === 'user' ? 'user' : 'assistant', content: m.text }; });
    var msg = { role: 'assistant', text: '', audience: aud, t: 0, rewrite: rewrite };
    th.messages.push(msg);
    view.streaming = { thread: th.id, index: th.messages.length - 1 }; view.ctl = new AbortController(); view.pin = true;
    H.render();
    var paint = function (t) {
      msg.text = t; var el = document.getElementById('msg-live');
      if (el) { el.innerHTML = fmtAnswer(t); var sc = document.getElementById('ask-scroll'); if (sc && sc.scrollHeight - sc.scrollTop - sc.clientHeight < 120) sc.scrollTop = sc.scrollHeight; }
    };
    H.ai.ask(text, aud, history, { onText: paint, signal: view.ctl.signal }).then(function (res) {
      msg.text = res.text; msg.live = res.live; done();
    }, function (e) {
      if (!msg.text) msg.text = e && e.code === 'cancelled' ? 'Stopped before Halo answered.' : 'Halo couldn’t answer that right now. Try again in a moment.';
      msg.stopped = true; done();
    });
    function done() { view.streaming = null; view.ctl = null; view.pin = true; H.store.save(); H.render(); }
  }
  H.askSend = function (text) {
    if (!text) return;
    if (H.route.name !== 'ask') { H.go('#/ask'); setTimeout(function () { send(text); }, 80); }
    else send(text);
  };
})(window.H = window.H || {});

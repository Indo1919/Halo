/* Sources — the only places Halo looks, and exactly what it reads in each one. */
(function (H) {
  'use strict';
  var esc = H.esc, ui = H.ui, q = H.q, F = H.fmt, U = H.util;
  var view = { syncing: null, connecting: null, disconnect: null };
  var ACCOUNT = 'maya.chen@brightwater.co';
  var CATS = ['Calendar & meetings', 'Messaging', 'Design', 'Engineering', 'Project tracking', 'Documents', 'AI assistants'];

  // What Halo can learn your writing voice from, per source. Missing: nothing to learn from (calendars).
  var LEARNS = {
    slack: 'Messages you send in public channels', jira: 'Comments on your tickets', gdocs: 'Docs you write and edit',
    github: 'Pull request descriptions and review comments', figma: 'Comments you leave on designs', ai: 'Prompts in chats you choose to share',
    zoom: 'What you say in meetings you join', loom: 'What you say in videos you record', notion: 'Pages you write',
    linear: 'Comments on your issues', gmail: 'Emails you send to your team', teams: 'Messages you send in team channels', asana: 'Comments on your tasks'
  };
  q.voiceSource = function (id) { return LEARNS[id] || null; };

  // The latest items Halo read from each source today (fictional). t = minutes before now.
  var READS = {
    gcal: [
      { t: -25, icon: 'video', title: 'Checkout v3: error states kickoff', meta: 'Meeting · you joined for 45 min with 4 others' },
      { t: -130, icon: 'focus', title: 'Focus · CHK-142', meta: 'Focus block · 1h 30m, kept free of meetings' },
      { t: -250, icon: 'calendar', title: 'Payments sync with Leo', meta: 'Meeting · 30 min' },
      { t: -295, icon: 'calendar-check', title: 'Checkout standup', meta: 'Meeting · 15 min · Halo posted your update' },
      { t: -395, icon: 'calendar-plus', title: 'Design critique at 3:00 PM', meta: 'Invitation from Rosa Delgado' }
    ],
    slack: [
      { t: -4, icon: 'hash', title: '#checkout-design', meta: 'You shared wallet button sizing options' },
      { t: -22, icon: 'at', title: '#checkout-eng', meta: 'A thread on 3DS error codes mentions you' },
      { t: -98, icon: 'hash', title: '#checkout-design', meta: 'You asked for feedback on the bank transfer row' },
      { t: -173, icon: 'hash', title: '#harbor-design-system', meta: 'You answered a question about Select density' },
      { t: -309, icon: 'hash', title: '#checkout-standup', meta: 'Your standup reply, posted by Halo' }
    ],
    figma: [
      { t: -6, icon: 'frame', title: 'Checkout v3 / Wallets', meta: 'You edited 14 frames' },
      { t: -45, icon: 'frame', title: 'Checkout v3 / Payment methods', meta: 'You edited 6 frames' },
      { t: -134, icon: 'message', title: 'Checkout v3 / Error states', meta: 'You left 3 comments' },
      { t: -200, icon: 'check-circle', title: 'Harbor / Select', meta: 'You resolved 2 comments' },
      { t: -232, icon: 'frame', title: 'Checkout v3 / Payment methods', meta: 'Edit session · 42 min' }
    ],
    github: [
      { t: -12, icon: 'git-pr', title: 'PR #482 · saved-cards', meta: 'You reviewed it and requested one change' },
      { t: -90, icon: 'message', title: 'PR #482 · saved-cards', meta: 'Your comment on focus order in the card list' },
      { t: -215, icon: 'git-pr', title: 'PR #484 · checkout-error-copy', meta: 'You were added as a reviewer' },
      { t: -282, icon: 'git-commit', title: 'Commit linked to CHK-138', meta: 'Pushed by Sam to a ticket you watch' },
      { t: -1210, icon: 'git-pr', title: 'PR #479 · invoice-pdf-header', meta: 'Merged after your approval' }
    ],
    jira: [
      { t: -52, icon: 'ticket', title: 'CHK-142 moved to In progress', meta: 'You changed the status' },
      { t: -79, icon: 'message', title: 'CHK-145', meta: 'Your comment: wallet sizing waits on Sam' },
      { t: -120, icon: 'timer', title: 'CHK-142 estimate updated', meta: 'Likely case changed from 14h to 16h' },
      { t: -208, icon: 'alert', title: 'CHK-150 marked Blocked', meta: 'Changed by Leo on a ticket you watch' },
      { t: -275, icon: 'subtasks', title: 'DS-212', meta: 'You added a subtask: Combobox async states' }
    ],
    gdocs: [
      { t: -35, icon: 'file-text', title: 'Kickoff notes: error states', meta: 'You edited 4 paragraphs' },
      { t: -158, icon: 'edit', title: 'Checkout accessibility checklist', meta: 'You suggested 6 changes' },
      { t: -265, icon: 'message', title: 'Reminder emails draft', meta: 'You commented on the 14-day email' }
    ],
    ai: [
      { t: -60, icon: 'sparkle', title: '“Wallet usage by device”', meta: 'A chat title you chose to share' },
      { t: -190, icon: 'check', title: 'Summary: error copy options', meta: 'A summary you approved' }
    ]
  };

  function name(id) { return (H.brands[id] || { name: id }).name; }
  function meta(id) { return H.SOURCES.filter(function (x) { return x.id === id; })[0]; }
  function lower(s) { return s.charAt(0).toLowerCase() + s.slice(1); }
  function relLower(min) { return lower(F.rel(H.at(min || 0))); }
  function isOn(s) { return s.status === 'connected' || s.status === 'error'; }
  function useDigest(s) { return s.useDigest !== false; }

  function state(s) {
    if (s.status === 'error') return { kind: 'error', icon: 'alert', label: 'Needs reconnecting', detail: s.sync != null ? 'last synced ' + relLower(s.sync) : '' };
    if (s.status !== 'connected') return { kind: 'off', label: 'Not connected' };
    if (s.paused) return { kind: 'paused', icon: 'pause-circle', label: 'Paused', detail: 'not reading' };
    if (H.store.state.privacy.paused) return { kind: 'paused', icon: 'pause-circle', label: 'Paused', detail: 'Halo is paused' };
    return { kind: 'ok', label: 'Connected', detail: 'synced ' + relLower(s.sync) };
  }
  function stateLine(st) {
    return '<span class="src-state is-' + st.kind + '">' + (st.icon ? H.icon(st.icon, 14) : '<span class="dot"></span>') +
      '<span class="truncate">' + esc(st.label) + (st.detail ? ' · ' + esc(st.detail) : '') + '</span></span>';
  }

  /* ---------- Actions on sources (shared with other screens) ---------- */
  H.act.connectSource = function (id, quiet) {
    H.act.setSource(id, { status: 'connected', sync: 0, today: 0, error: null, paused: false, useStatus: true, useDigest: true });
    if (!quiet) { H.chime('soft'); ui.toast(name(id) + ' connected', { icon: 'check-circle' }); }
  };
  H.act.disconnectSource = function (id) {
    var snap = H.store.snapshot();
    H.act.setSource(id, { status: 'available', sync: null, today: 0, error: null, paused: false });
    ui.toast(name(id) + ' disconnected. Halo stopped reading it.', { icon: 'sources', undo: function () { H.store.restore(snap); } });
  };

  /* ---------- List ---------- */
  function toggle(label, s, k, disabled, tip) {
    var on = k === 'useDigest' ? useDigest(s) : !!s[k];
    return '<div class="src-toggle' + (disabled ? ' is-disabled' : '') + '"' + (tip ? ' data-tip="' + esc(tip) + '"' : '') + '><span>' + esc(label) + '</span>' +
      ui.switch(on && !disabled, 'src-use', { 'data-id': s.id, 'data-k': k, 'aria-label': label + ': ' + name(s.id), disabled: !!disabled, class: 'switch switch-sm' }) + '</div>';
  }
  function card(s) {
    var st = state(s), nav = '#/sources/' + s.id, body;
    if (st.kind === 'error') {
      body = '<p class="src-err">' + esc(s.error) + '</p>' + ui.btn('Reconnect', { size: 'sm', icon: 'refresh', action: 'src-connect', attrs: { 'data-id': s.id } });
    } else {
      body = '<div class="src-count"><span class="src-count-num num">' + (s.today || 0) + '</span><span class="src-count-label">' + (s.today === 1 ? 'item' : 'items') + ' read today</span></div>';
    }
    if (st.kind === 'error') st.detail = '';          // the message below says when
    return '<article class="card interactive src-card is-' + st.kind + '" data-key="src-' + s.id + '" data-nav="' + nav + '">' +
      '<div class="src-card-hd">' + H.brandTile(s.id, 40, 'tinted') +
        '<a class="src-card-name truncate grow" href="' + nav + '" data-nav="' + nav + '">' + esc(name(s.id)) + '</a></div>' +
      stateLine(st) +
      '<div class="src-card-bd">' + body + '</div>' +
      '<div class="src-card-ft">' + toggle('Use for updates', s, 'useStatus') +
        toggle('Use for voice', s, 'useVoice', !LEARNS[s.id], LEARNS[s.id] ? null : 'Calendars don’t contain your writing, so there’s nothing to learn from') + '</div>' +
    '</article>';
  }
  function availCard(s) {
    var nav = '#/sources/' + s.id;
    return '<article class="card interactive src-card src-avail" data-key="av-' + s.id + '" data-nav="' + nav + '">' +
      '<div class="src-avail-hd">' + H.brandTile(s.id, 40, 'tinted') + ui.btn('Connect', { size: 'sm', action: 'src-connect', attrs: { 'data-id': s.id, 'aria-label': 'Connect ' + name(s.id) } }) + '</div>' +
      '<a class="src-card-name truncate" href="' + nav + '" data-nav="' + nav + '">' + esc(name(s.id)) + '</a>' + stateLine(state(s)) +
    '</article>';
  }
  function grouped(list, render, kind) {
    var groups = CATS.map(function (c) { return { cat: c, items: list.filter(function (s) { return s.cat === c; }) }; }).filter(function (g) { return g.items.length; });
    return '<div class="src-wrap"><div class="src-grid src-grid-' + kind + '">' + groups.map(function (g) {
      return '<div class="src-cat n' + Math.min(g.items.length, 4) + '" data-key="cat-' + kind + '-' + U.hash(g.cat) + '"><div class="src-cat-label">' + esc(g.cat) + '</div>' + g.items.map(render).join('') + '</div>';
    }).join('') + '</div></div>';
  }
  function summary(conn) {
    var s = H.store.state, paused = s.privacy.paused;
    var today = Object.keys(s.sources).reduce(function (a, k) { return a + (+s.sources[k].today || 0); }, 0);
    var syncs = conn.filter(function (x) { return x.status === 'connected' && x.sync != null; }).map(function (x) { return x.sync; });
    var last = syncs.length ? Math.max.apply(null, syncs) : null;
    return '<div class="card src-summary">' +
      '<div class="src-stat"><span class="stat-num">' + conn.length + '</span><span class="stat-label">Connected</span></div><span class="vdivider"></span>' +
      '<div class="src-stat"><span class="stat-num">' + today + '</span><span class="stat-label">Items read today</span></div><span class="vdivider"></span>' +
      '<div class="src-stat"><span class="stat-num">' + (last == null ? '—' : esc(F.rel(H.at(last)))) + '</span><span class="stat-label">Last sync</span></div>' +
      '<div class="src-summary-act">' + (paused
        ? '<span class="t-caption c-3 hide-phone">Nothing is being read</span>' + ui.btn('Resume', { kind: 'primary', size: 'sm', icon: 'play-circle', action: 'src-pause-all' })
        : ui.btn('Pause all', { size: 'sm', icon: 'pause-circle', action: 'src-pause-all', attrs: { 'data-tip': 'Stop reading every source until you resume' } })) + '</div>' +
    '</div>';
  }
  function list() {
    var all = H.SOURCES.map(function (m) { return q.source(m.id); });
    var conn = all.filter(isOn), avail = all.filter(function (s) { return !isOn(s); });
    return '<header class="page-hd"><div class="grow"><h1>Sources</h1><p class="lede">Halo only reads what you connect, and only what each source lists below.</p></div></header>' +
      summary(conn) +
      '<section class="section"><div class="section-hd"><h2>Connected</h2><span class="count-pill quiet">' + conn.length + '</span></div>' +
        (conn.length ? grouped(conn, card, 'on') : '<div class="card">' + ui.empty('sources', 'Nothing connected', 'Halo can’t see any of your work yet. Connect a source below to get started.') + '</div>') + '</section>' +
      '<section class="section"><div class="section-hd"><h2>Available</h2><span class="count-pill quiet">' + avail.length + '</span><span class="sub hide-phone">Nothing is read until you allow it</span></div>' +
        (avail.length ? grouped(avail, availCard, 'av') : '<div class="card">' + ui.empty('check-circle', 'Everything is connected', 'Every source Halo supports is connected. You can turn each one off from its page.') + '</div>') + '</section>' +
      '<p class="t-caption c-3 mt-8 src-foot">' + H.icon('lock', 12) + '<span>Raw content stays in your Halo. Only updates you share leave it.</span></p>';
  }

  /* ---------- Detail ---------- */
  function readsList(s, st) {
    var n = s.today || 0, items = (READS[s.id] || []).slice(0, Math.min(5, n));
    if (st.kind === 'error') return '<div class="card">' + ui.empty('cloud-off', 'Nothing read today', 'Access expired yesterday, so Halo can’t see new meetings. Reconnect to pick up where it left off.') + '</div>';
    if (!items.length) return '<div class="card">' + ui.empty('clock', 'Nothing read yet', 'Halo checks ' + name(s.id) + ' every few minutes. New items show up here as they arrive.') + '</div>';
    var days = H.store.state.privacy.retention, keep = days >= 365 ? 'a year' : days + ' days';
    return '<div class="card src-reads">' + items.map(function (it, i) {
      return '<div class="src-read" data-key="rd-' + i + '"><span class="src-read-ic">' + H.icon(it.icon, 16) + '</span>' +
        '<div class="grow"><div class="src-read-title truncate">' + esc(it.title) + '</div><div class="src-read-meta">' + esc(it.meta) + '</div></div>' +
        '<span class="src-read-time num">' + F.time(H.at(it.t)) + '</span></div>';
    }).join('') + '</div>' +
      '<p class="group-foot">' + (n > items.length ? 'Showing the latest ' + items.length + ' of ' + n + '. ' : '') + 'Raw items are deleted after ' + keep + '.</p>';
  }
  function useRow(s, k, icon, title, sub, disabled) {
    var on = k === 'useDigest' ? useDigest(s) : !!s[k];
    return '<div class="item has-lead' + (disabled ? ' is-disabled' : '') + '"><span class="lead-ic">' + H.icon(icon, 16) + '</span>' +
      '<div class="grow"><div class="item-title">' + esc(title) + '</div><div class="item-sub">' + esc(sub) + '</div></div>' +
      ui.switch(on && !disabled, 'src-use', { 'data-id': s.id, 'data-k': k, 'aria-label': title, disabled: !!disabled }) + '</div>';
  }
  function detail(id) {
    var m = meta(id);
    if (!m) return '<div class="src-missing">' + ui.empty('sources', 'We couldn’t find that source', 'It may have been renamed or removed. Everything you’ve connected is on the Sources page.', ui.btn('Back to Sources', { kind: 'primary', action: 'nav', attrs: { 'data-to': '#/sources' } })) + '</div>';
    var s = q.source(id), st = state(s), nm = name(id), on = isOn(s), learns = LEARNS[id];
    var acts = '';
    if (s.status === 'error') acts = ui.btn('Disconnect', { kind: 'danger', action: 'src-disconnect', attrs: { 'data-id': id } }) + ui.btn('Reconnect', { kind: 'primary', icon: 'refresh', action: 'src-connect', attrs: { 'data-id': id } });
    else if (on) acts = ui.btn('Sync now', { icon: 'refresh', action: 'src-sync', attrs: { 'data-id': id }, cls: view.syncing === id ? 'is-loading' : '', disabled: !!s.paused || H.store.state.privacy.paused }) +
      ui.btn(s.paused ? 'Resume' : 'Pause', { icon: s.paused ? 'play-circle' : 'pause-circle', action: 'src-pause-one', attrs: { 'data-id': id } }) +
      ui.btn('Disconnect', { kind: 'danger', action: 'src-disconnect', attrs: { 'data-id': id } });

    var html = '<header class="src-hero">' + H.brandTile(id, 64, 'tinted') +
      '<div class="grow src-hero-text"><div class="eyebrow">' + esc(m.cat) + '</div><h1>' + esc(nm) + '</h1>' +
        '<div class="src-hero-meta">' + stateLine(st) + (on ? '<span class="sep"></span><span class="truncate">' + ACCOUNT + '</span>' : '') + '</div>' +
        (acts ? '<div class="src-hero-actions">' + acts + '</div>' : '') + '</div></header>';

    if (s.status === 'error') html += '<div class="banner banner-warning mt-5">' + H.icon('alert', 16) + '<span><strong>' + esc(nm) + ' isn’t sending anything.</strong> ' + esc(s.error) + '</span></div>';
    else if (on && s.paused) html += '<div class="banner mt-5">' + H.icon('pause-circle', 16) + '<span><strong>Paused.</strong> Halo isn’t reading ' + esc(nm) + ' right now. Anything already shared stays as it is.</span></div>';
    else if (on && H.store.state.privacy.paused) html += '<div class="banner mt-5">' + H.icon('pause-circle', 16) + '<span class="grow"><strong>Halo is paused.</strong> Nothing is being read from any source.</span>' + ui.btn('Resume', { size: 'xs', action: 'src-pause-all' }) + '</div>';
    if (m.optIn && on) html += '<div class="banner mt-5">' + H.icon('info', 16) + '<span><strong>Opt-in only.</strong> Halo sees an AI chat only after you choose to share it.</span></div>';

    if (!on) {
      html += '<section class="card src-cta mt-6"><div class="grow"><h2>Connect ' + esc(nm) + '</h2><p>Halo reads nothing from ' + esc(nm) + ' until you allow it. Below is exactly what it will and won’t read. You can disconnect any time.</p></div>' +
        ui.btn('Connect ' + nm, { kind: 'primary', icon: 'plus', action: 'src-connect', attrs: { 'data-id': id } }) + '</section>';
    }
    html += '<div class="src-rules mt-6">' +
      '<section class="card src-rule"><h2>' + H.icon('check-circle', 16, 'c-success') + 'What Halo reads</h2><ul>' + (m.reads || []).map(function (r) { return '<li>' + H.icon('check', 14) + '<span>' + esc(r) + '</span></li>'; }).join('') + '</ul></section>' +
      '<section class="card src-rule is-never"><h2>' + H.icon('ban', 16) + 'What Halo never reads</h2><ul>' + (m.never || []).map(function (r) { return '<li>' + H.icon('ban', 14) + '<span>' + esc(r) + '</span></li>'; }).join('') + '</ul></section></div>';

    if (on) {
      html += '<section class="section"><div class="section-hd"><h2>Use this source for</h2></div><div class="group">' +
        useRow(s, 'useStatus', 'broadcast', 'Status updates', 'Halo can cite ' + nm + ' in updates it drafts for you.') +
        useRow(s, 'useVoice', 'fingerprint', 'Your voice', learns ? 'Learn how you write from ' + lower(learns) + '.' : 'Calendars don’t contain your writing, so there’s nothing to learn from.', !learns) +
        useRow(s, 'useDigest', 'digest', 'Daily digest', 'Items from ' + nm + ' can appear in your digest for review.') + '</div></section>';
      html += '<section class="section"><div class="section-hd"><h2>Read today</h2><span class="sub">' + U.plural(s.today || 0, 'item') + '</span></div>' + readsList(s, st) + '</section>';
    }
    html += '<div class="banner mt-8">' + H.icon('lock', 16) + '<span>Raw content is processed in your Halo and never shown to anyone. Only updates you share leave it.</span></div>';
    return html;
  }

  H.screens.sources = {
    title: 'Sources',
    crumbs: function (r) { return r.parts[0] ? [{ label: 'Sources', nav: '#/sources' }, { label: meta(r.parts[0]) ? name(r.parts[0]) : 'Not found' }] : [{ label: 'Sources' }]; },
    docTitle: function (r) { return (r.parts[0] && meta(r.parts[0]) ? name(r.parts[0]) + ' · ' : '') + 'Sources · Halo'; },
    pageClass: function (r) { return r.parts[0] ? 'narrow src-page' : 'src-page'; },
    render: function (r) { return r.parts[0] ? detail(r.parts[0]) : list(); },
    actions: {
      'src-connect': function (el) { ui.open('sources-connect', { id: el.dataset.id }); },
      'src-use': function (el) {
        var id = el.dataset.id, k = el.dataset.k, s = q.source(id), nm = name(id);
        var on = !(k === 'useDigest' ? useDigest(s) : !!s[k]), p = {}; p[k] = on;
        var msg = {
          useStatus: on ? nm + ' will inform your updates' : nm + ' won’t be used for updates',
          useVoice: on ? 'Halo will learn your voice from ' + nm : 'Halo won’t learn your voice from ' + nm,
          useDigest: on ? 'Items from ' + nm + ' can appear in your digest' : 'Items from ' + nm + ' won’t appear in your digest'
        }[k];
        H.act.setSource(id, p, msg);
      },
      'src-pause-all': function () { H.act.pause(!H.store.state.privacy.paused); },
      'src-pause-one': function (el) {
        var id = el.dataset.id, s = q.source(id), nm = name(id), paused = !s.paused, snap = H.store.snapshot();
        H.act.setSource(id, { paused: paused });
        ui.toast(paused ? 'Paused ' + nm + '. Halo won’t read it until you resume.' : 'Resumed ' + nm, { icon: paused ? 'pause-circle' : 'play-circle', undo: function () { H.store.restore(snap); } });
      },
      'src-sync': function (el) {
        var id = el.dataset.id; if (view.syncing) return;
        view.syncing = id; H.render();
        setTimeout(function () {
          view.syncing = null;
          H.act.setSource(id, { sync: 0 });
          ui.toast(name(id) + ' is up to date', { icon: 'refresh' });
        }, 1100);
      },
      'src-disconnect': function (el) {
        var id = el.dataset.id; view.disconnect = id;
        ui.open('confirm', { title: 'Disconnect ' + name(id) + '?', body: 'Halo stops reading it right away and deletes the raw items it read. Updates you already shared stay in History.', ok: 'Disconnect', danger: true, run: 'src-disconnect-go' });
      },
      'src-disconnect-go': function () {
        var id = view.disconnect; view.disconnect = null; ui.close(true);
        if (id) H.act.disconnectSource(id);
      }
    }
  };

  /* ---------- Connect: a simulated provider consent screen ---------- */
  H.overlays['sources-connect'] = {
    kind: 'modal', title: 'Connect a source',
    render: function (p) {
      var m = meta(p.id); if (!m) return '';
      var s = q.source(p.id), nm = name(p.id), busy = view.connecting === p.id, re = s.status === 'error', me = q.me();
      var what = p.id === 'ai' ? 'the AI chats you choose to share' : 'your ' + nm + ' account';
      return '<div class="src-consent">' +
        '<div class="src-consent-close">' + ui.iconBtn('x', 'Close', 'close', { size: 'sm' }) + '</div>' +
        '<div class="src-handshake' + (busy ? ' is-busy' : '') + '" aria-hidden="true">' + H.brandTile('halo', 56) +
          '<span class="src-dots"><i></i><i></i><i></i><i></i><i></i></span>' + H.brandTile(p.id, 56, 'tinted') + '</div>' +
        '<h2>' + (busy ? 'Connecting to ' + esc(nm) + '…' : 'Halo wants to access ' + esc(what)) + '</h2>' +
        '<p class="src-consent-sub">' + (re ? 'Reconnecting restores what Halo had before. It asks for the same access, nothing more.' : 'Review what Halo will read. You can change this or disconnect any time in Sources.') + '</p>' +
        '<div class="src-account">' + ui.avatar(me, 'md', { tip: false }) + '<div class="grow"><div class="t-medium truncate">' + esc(me.name) + '</div><div class="t-callout c-3 truncate">' + ACCOUNT + '</div></div>' + ui.badge('Work account', 'outline') + '</div>' +
        '<div class="src-perm"><div class="src-perm-hd">Halo will read</div><ul>' + (m.reads || []).map(function (r) { return '<li>' + H.icon('check', 14, 'c-success') + '<span>' + esc(r) + '</span></li>'; }).join('') + '</ul>' +
          '<div class="src-perm-hd">Halo will never read</div><ul class="is-never">' + (m.never || []).map(function (r) { return '<li>' + H.icon('ban', 14) + '<span>' + esc(r) + '</span></li>'; }).join('') + '</ul></div>' +
        '<p class="src-consent-note">' + H.icon('lock', 12) + '<span>Raw content stays in your Halo. Only updates you share leave it.</span></p>' +
      '</div>' +
      '<div class="modal-ft">' + ui.btn('Cancel', { action: 'close' }) + ui.btn(re ? 'Reconnect' : 'Allow', { kind: 'primary', action: 'src-allow', cls: busy ? 'is-loading' : '', attrs: { 'data-id': p.id } }) + '</div>';
    },
    actions: {
      'src-allow': function (el) {
        var id = el.dataset.id; if (view.connecting) return;
        view.connecting = id; H.render();
        setTimeout(function () {
          var o = H.view.overlay, still = o && o.name === 'sources-connect' && o.params.id === id;
          view.connecting = null;
          if (!still) return;                       // closed while connecting: nothing changes
          ui.close(true);
          H.act.connectSource(id);
        }, 900);
      }
    }
  };
})(window.H = window.H || {});

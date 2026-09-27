/* Settings — Apple-style grouped panes behind a quiet sub-navigation. */
(function (H) {
  'use strict';
  var esc = H.esc, ui = H.ui, q = H.q, F = H.fmt, U = H.util;
  var view = { key: '', keyError: '', testing: false, test: null };
  var VERSION = '1.4.0';
  var TABS = [
    { id: 'profile', label: 'Profile', icon: 'user', lede: 'How you show up on your updates, and when you work.' },
    { id: 'trust', label: 'Trust & digest', icon: 'dial', lede: 'How much Halo shares on its own, and when your digest closes.' },
    { id: 'notifications', label: 'Notifications', icon: 'bell', lede: 'What Halo tells you about, and where.' },
    { id: 'appearance', label: 'Appearance', icon: 'sun', lede: 'Theme, motion and sound.' },
    { id: 'ai', label: 'AI', icon: 'sparkle', lede: 'The model behind your drafts and answers, and what it sees.' },
    { id: 'workspace', label: 'Workspace', icon: 'building', lede: 'Brightwater’s Halo workspace and its members.' },
    { id: 'keyboard', label: 'Keyboard', icon: 'keyboard', lede: 'Halo works without a mouse. These work anywhere.' },
    { id: 'about', label: 'About', icon: 'info', lede: '' }
  ];
  var TZ = [['Pacific', 'Pacific Time · Los Angeles'], ['Mountain', 'Mountain Time · Denver'], ['Central', 'Central Time · Chicago'], ['Eastern', 'Eastern Time · New York'],
    ['London', 'United Kingdom · London'], ['Berlin', 'Central Europe · Berlin'], ['Singapore', 'Singapore'], ['Sydney', 'Australia · Sydney']];
  var DIGEST = [['12:00', '12:00 PM'], ['16:30', '4:30 PM'], ['17:30', '5:30 PM']];

  function tabOf(r) { var t = r.parts[0] || 'profile'; return TABS.filter(function (x) { return x.id === t; })[0] || TABS[0]; }
  function prefs() { return H.store.state.prefs; }
  function clock(hhmm) { var p = hhmm.split(':'), d = H.now(); d.setHours(+p[0], +p[1], 0, 0); return F.time(d).replace(/^(\d+) /, '$1:00 '); }
  function times(from, to, step) { var out = []; for (var m = from; m <= to; m += step) { var h = Math.floor(m / 60), mm = m % 60; out.push((h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm); } return out; }
  function select(id, opts, value, action, extra) {
    return '<select id="' + id + '" class="select input-sm stg-select" data-change="' + action + '"' + (extra || '') + '>' + opts.map(function (o) {
      var v = Array.isArray(o) ? o[0] : o, l = Array.isArray(o) ? o[1] : clock(o);
      return '<option value="' + esc(v) + '"' + (String(v) === String(value) ? ' selected' : '') + '>' + esc(l) + '</option>';
    }).join('') + '</select>';
  }
  function saved(msg, icon) { ui.toast(msg || 'Saved', { icon: icon || 'check-circle' }); }
  function row(title, sub, control, o) {
    o = o || {};
    return '<div class="item' + (o.lead ? ' has-lead' : '') + (o.stack ? ' stg-stack' : '') + (o.cls ? ' ' + o.cls : '') + '"' + (o.key ? ' data-key="' + o.key + '"' : '') + '>' + (o.lead ? '<span class="lead-ic">' + H.icon(o.lead, 16) + '</span>' : '') +
      '<div class="grow">' + (o.forId ? '<label class="item-title" for="' + o.forId + '">' + esc(title) + '</label>' : '<div class="item-title">' + esc(title) + '</div>') + (sub ? '<div class="item-sub">' + sub + '</div>' : '') + '</div>' +
      (control ? '<div class="stg-ctl">' + control + '</div>' : '') + '</div>';
  }
  function section(title, body, foot) {
    return '<section class="stg-sec">' + (title ? '<h2 class="stg-sec-title">' + esc(title) + '</h2>' : '') + body + (foot ? '<p class="group-foot">' + foot + '</p>' : '') + '</section>';
  }
  function group(rows) { return '<div class="group">' + rows.join('') + '</div>'; }

  /* ---------- Profile (kept in prefs, so a demo reset keeps it, like appearance) ---------- */
  var BASE = null;
  function profile() { return prefs().profile || {}; }
  function applyProfile() {
    var me = H.PEOPLE[H.store.state.me]; if (!me) return;
    if (!BASE) BASE = { name: me.name, role: me.role, team: me.team, tz: me.tz };
    var p = profile();
    ['name', 'role', 'team', 'tz'].forEach(function (k) { me[k] = p[k] || BASE[k]; });
    var el = document.getElementById('stg-me-photo');
    if (!p.photo) { if (el) el.remove(); return; }
    if (!el) { el = document.createElement('style'); el.id = 'stg-me-photo'; document.head.appendChild(el); }
    el.textContent = '.avatar[aria-label="' + me.name.replace(/["\\]/g, '\\$&') + '"]{background:var(--surface-3) center/cover no-repeat url("' + p.photo + '");color:transparent}';
  }
  document.addEventListener('DOMContentLoaded', function () { try { if (H.store && H.store.state) { applyProfile(); H.render(); } } catch (e) { /* profile stays default */ } });
  function setProfile(k, v) { H.store.commit(function (s) { s.prefs.profile = Object.assign({}, s.prefs.profile || {}); if (v == null || v === '') delete s.prefs.profile[k]; else s.prefs.profile[k] = v; }); applyProfile(); H.render(); }
  function readPhoto(file, cb) {
    var fr = new FileReader();
    fr.onload = function () {
      var img = new Image();
      img.onload = function () {
        try {
          var S = 160, c = document.createElement('canvas'), k = Math.min(img.width, img.height); c.width = c.height = S;
          c.getContext('2d').drawImage(img, (img.width - k) / 2, (img.height - k) / 2, k, k, 0, 0, S, S);
          cb(c.toDataURL('image/jpeg', 0.86));
        } catch (e) { cb(null); }
      };
      img.onerror = function () { cb(null); };
      img.src = fr.result;
    };
    fr.onerror = function () { cb(null); };
    fr.readAsDataURL(file);
  }

  function paneProfile() {
    var me = q.me(), p = profile(), rosa = q.person('rosa');
    var start = p.start || '09:00', end = p.end || '17:30';
    var input = function (k, v, label) { return '<input id="stg-' + k + '" class="input input-sm stg-input" type="text" maxlength="60" value="' + esc(v) + '" data-change="stg-profile" data-k="' + k + '" aria-label="' + label + '" autocomplete="off">'; };
    return '<div class="card stg-me">' + ui.avatar(me, 'xxl', { tip: false }) +
        '<div class="grow"><div class="stg-me-name">' + esc(me.name) + '</div><div class="t-callout c-3">' + esc(me.role) + ' · ' + esc(me.team) + '</div>' +
        '<div class="row gap-2 mt-3 wrap">' + ui.btn('Change photo', { size: 'sm', icon: 'image', action: 'stg-photo' }) + (p.photo ? ui.btn('Remove', { size: 'sm', kind: 'ghost', action: 'stg-photo-rm' }) : '') + '</div></div>' +
        '<input type="file" accept="image/*" id="stg-photo-in" hidden data-change="stg-photo-file" tabindex="-1" aria-label="Choose a photo"></div>' +
      section('About you', group([
        row('Name', '', input('name', me.name, 'Name'), { forId: 'stg-name' }),
        row('Role', '', input('role', me.role, 'Role'), { forId: 'stg-role' }),
        row('Team', '', input('team', me.team, 'Team'), { forId: 'stg-team' }),
        row('Email', '', '<span class="stg-ro" data-tip="Managed by Brightwater’s directory">' + H.icon('lock', 12) + '<span class="truncate">' + esc(me.email) + '</span></span>')
      ]), 'Your name, role and team appear on every update. Your email comes from Brightwater’s directory.') +
      section('Working time', group([
        row('Time zone', '', select('stg-tz', TZ, me.tz, 'stg-profile', ' data-k="tz"'), { forId: 'stg-tz' }),
        row('Working hours', '', '<span class="stg-range">' + select('stg-start', times(360, 660, 30), start, 'stg-profile', ' data-k="start" aria-label="Start of your working day"') + '<span class="c-3">to</span>' +
          select('stg-end', times(840, 1200, 30), end, 'stg-profile', ' data-k="end" aria-label="End of your working day"') + '</span>', { stack: true })
      ]), 'Halo only books focus time and posts for you inside your working hours.') +
      section('Reports to', group([
        '<div class="item has-lead stg-person">' + ui.avatar(rosa, 'md', { tip: false }) + '<div class="grow"><div class="item-title">' + esc(rosa.name) + '</div><div class="item-sub">' + esc(rosa.role) + '</div></div>' + ui.badge('Manager', 'outline') + '</div>'
      ]), 'Rosa sees your updates at the level you choose in <a class="link" href="#/privacy/boundaries" data-nav="#/privacy/boundaries">Voice & privacy</a>.');
  }

  /* ---------- Trust & digest ---------- */
  function paneTrust() {
    var p = prefs(), mode = p.mode, quiet = p.quiet || { on: false, from: '18:30', to: '08:30' }, hold = p.holdEstimates !== false;
    return '<div class="stg-modes" role="radiogroup" aria-label="Trust mode">' + H.shell.MODES.map(function (m, i) {
        return '<button type="button" role="radio" class="stg-mode" aria-checked="' + (m.v === mode) + '" data-action="stg-mode" data-v="' + m.v + '">' +
          '<span class="stg-mode-top">' + H.shell.dial(i, 48) + '<span class="radio"></span></span><span class="stg-mode-name">' + m.label + '</span><span class="stg-mode-note">' + esc(m.note) + '</span></button>';
      }).join('') + '</div>' +
      '<p class="group-foot">Private topics are never shared in any mode. Switch any time with ' + ui.kbd('[') + ' and ' + ui.kbd(']') + '.</p>' +
      section('Daily digest', group([
        row('Digest closes at', 'Updates that need you wait until then. Anything undecided rolls to tomorrow.', select('stg-digest', DIGEST, p.digestTime || '16:30', 'stg-digest'), { forId: 'stg-digest' }),
        row('Always hold estimate changes for review', 'Date and estimate changes wait for you, even in Ambient mode.', ui.switch(hold, 'stg-hold', { 'aria-label': 'Always hold estimate changes for review' }))
      ])) +
      section('Quiet hours', group([
        row('Quiet hours', 'Halo won’t notify you or post for you during these hours.', ui.switch(quiet.on, 'stg-quiet', { 'aria-label': 'Quiet hours' })),
        row('From', '', select('stg-qfrom', times(1020, 1320, 30), quiet.from, 'stg-quiet-time', ' data-k="from"' + (quiet.on ? '' : ' disabled')), { forId: 'stg-qfrom', cls: quiet.on ? '' : 'is-disabled' }),
        row('To', '', select('stg-qto', times(360, 600, 30), quiet.to, 'stg-quiet-time', ' data-k="to"' + (quiet.on ? '' : ' disabled')), { forId: 'stg-qto', cls: quiet.on ? '' : 'is-disabled' })
      ]), 'Source problems still reach you during quiet hours, so nothing breaks silently.');
  }

  /* ---------- Notifications ---------- */
  function paneNotifications() {
    var n = prefs().notify || {}, p = prefs(), closes = F.time(H.at(H.store.state.digest.closesAt));
    var items = [
      ['digest', 'Digest is ready', 'When updates need you. Today’s digest closes at ' + closes + '.', 'digest'],
      ['asks', 'Someone asks about you', 'Halo answers for you, then tells you who asked and what it said.', 'manager'],
      ['mentions', 'Mentions', 'When a thread Halo reads mentions you.', 'at'],
      ['weekly', 'Weekly summary', 'A Friday recap of what you shipped and shared.', 'history'],
      ['sources', 'Source problems', 'When a connection expires or stops syncing.', 'alert']
    ];
    var quiet = p.quiet && p.quiet.on ? 'Quiet hours are on from ' + clock(p.quiet.from) + ' to ' + clock(p.quiet.to) + '. ' : '';
    return section('Tell me when', group(items.map(function (it) {
        return row(it[1], esc(it[2]), ui.switch(n[it[0]] !== false, 'stg-notify', { 'data-k': it[0], 'aria-label': it[1] }), { lead: it[3], key: 'nt-' + it[0] });
      }))) +
      section('Where', group([
        row('In Halo', 'Always on, so nothing slips past you.', ui.switch(true, null, { disabled: true, 'aria-label': 'In Halo notifications, always on' }), { lead: 'bell' }),
        row('Push notifications', 'On this device, when Halo isn’t open.', ui.switch(!!n.push, 'stg-notify', { 'data-k': 'push', 'aria-label': 'Push notifications' }), { lead: 'monitor' }),
        row('Email', 'Sent to ' + esc(q.me().email) + '.', ui.switch(!!n.email, 'stg-notify', { 'data-k': 'email', 'aria-label': 'Email notifications' }), { lead: 'mail' })
      ]), quiet + '<a class="link" href="#/settings/trust" data-nav="#/settings/trust">Change quiet hours</a>');
  }

  /* ---------- Appearance ---------- */
  function win(kind) {
    return '<span class="stg-win win-' + kind + '" aria-hidden="true"><span class="win-side"><i class="win-mark"></i><i></i><i></i><i></i></span><span class="win-main"><i class="w-title"></i><i class="w-card"></i><i class="w-line"></i><i class="w-line short"></i></span></span>';
  }
  function paneAppearance() {
    var p = prefs(), th = p.theme || 'system';
    var cards = [['system', 'System', 'Matches your device'], ['light', 'Light', 'Always light'], ['dark', 'Dark', 'Always dark']];
    return section('Theme', '<div class="stg-themes" role="radiogroup" aria-label="Theme">' + cards.map(function (c) {
        var art = c[0] === 'system' ? '<span class="stg-win-split">' + win('light') + win('dark') + '</span>' : win(c[0]);
        return '<button type="button" role="radio" class="stg-theme" aria-checked="' + (th === c[0]) + '" data-action="stg-theme" data-v="' + c[0] + '"><span class="stg-theme-art">' + art + '</span>' +
          '<span class="stg-theme-label"><span class="radio"></span><span class="grow"><span class="item-title">' + c[1] + '</span><span class="item-sub">' + c[2] + '</span></span></span></button>';
      }).join('') + '</div>') +
      section('Motion and sound', group([
        row('Motion', 'Reduce turns off sliding panels and other movement.', ui.seg('motion', [{ v: 'system', label: 'System' }, { v: 'reduce', label: 'Reduce' }], p.motion || 'system', { action: 'stg-motion', size: 'sm', label: 'Motion' }), { lead: 'layers' }),
        row('Sounds', 'A soft chime when an update is shared.', ui.btn('Play', { size: 'sm', kind: 'ghost', icon: 'play', action: 'stg-chime', disabled: !p.sound }) + ui.switch(!!p.sound, 'stg-sound', { 'aria-label': 'Sounds' }), { lead: 'bell' })
      ]));
  }

  /* ---------- AI ---------- */
  function paneAI() {
    var st = H.ai.status(), key = H.ai.key(), model = H.ai.model(), models = H.ai.MODELS, cur = models.filter(function (m) { return m.id === model; })[0] || models[0], proxy = H.ai.proxy();
    var t = view.test;
    var status = '<div class="card stg-ai">' +
      '<span class="stg-ai-dot' + (st.live ? ' is-live' : '') + '" aria-hidden="true"></span>' +
      '<div class="grow"><div class="stg-ai-label">' + esc(st.label) + '</div><div class="t-callout c-3 mt-1">' + esc(st.provider === 'demo' ? 'Halo is answering from its built-in playbook. Add your own key below, or ask an admin to set up a proxy, for live answers.' : st.detail) + '</div>' +
        (t ? '<div class="stg-ai-test' + (t.live ? ' is-live' : '') + '">' + H.icon(t.live ? 'check-circle' : 'info', 14) + '<span><b>' + (t.live ? 'Live reply' : t.provider === 'demo' ? 'Demo reply' : 'Fallback reply') + ':</b> “' + esc(t.text) + '”' + (t.err ? '<span class="c-3"> · ' + esc(String(t.err).slice(0, 120)) + '</span>' : '') + '</span></div>' : '') +
      '</div>' + ui.btn('Test connection', { size: 'sm', icon: 'zap', action: 'stg-ai-test', cls: view.testing ? 'is-loading' : '' }) + '</div>';
    var keyRows = key
      ? [row('Your API key', 'Saved in this browser only. Ends in <span class="mono">' + esc(key.slice(-4)) + '</span>.', ui.btn('Remove', { size: 'sm', kind: 'danger', action: 'stg-key-rm' }), { lead: 'key' })]
      : ['<div class="item stg-key"><div class="grow"><label class="item-title" for="stg-key">Use your own Anthropic API key</label><div class="stg-key-row mt-2">' +
          '<input id="stg-key" class="input input-sm mono' + (view.keyError ? ' is-invalid' : '') + '" type="password" placeholder="sk-ant-…" autocomplete="off" spellcheck="false" value="' + esc(view.key) + '" data-input="stg-key" data-enter="stg-key-save">' +
          ui.btn('Save', { size: 'sm', kind: 'primary', action: 'stg-key-save', disabled: !view.key.trim() }) + '</div>' + (view.keyError ? '<div class="error-text mt-2">' + esc(view.keyError) + '</div>' : '') + '</div></div>'];
    var sends = [
      ['user', 'Your name, role and team, and who you report to'],
      ['ticket', 'Tickets you own: titles, status, estimates, progress and subtasks'],
      ['history', 'Updates you’ve already shared, newest first'],
      ['digest', 'Updates waiting for approval, only when you’re the one asking'],
      ['calendar', 'Today’s calendar titles and times. Private events are marked, never described'],
      ['team', 'Teammates’ published statuses'],
      ['fingerprint', 'Your tone settings and phrase lists'],
      ['lock', 'The names of your private topics, so Halo can avoid them']
    ];
    return status +
      section('Model', group([row('Model', esc(cur.note), select('stg-model', models.map(function (m) { return [m.id, m.label]; }), model, 'stg-model'), { forId: 'stg-model', lead: 'sparkle' })])) +
      section('API key', group(keyRows), 'Your key stays in this browser only. Requests go straight from here to Anthropic, never through Halo’s servers.' +
        (proxy ? ' Your workspace admin has set up a proxy, so live answers already work without a key.' : ' For everyone else, a workspace admin can run a small proxy that holds one key and set its address in <span class="mono">halo.config.js</span>, so nobody needs their own.')) +
      section('', '<details class="group stg-sends"><summary class="item clickable"><span class="lead-ic">' + H.icon('eye', 16) + '</span><span class="item-title grow">What Halo sends to the model</span>' + H.icon('chevron-down', 16, 'c-3') + '</summary>' +
        '<ul class="stg-sends-list">' + sends.map(function (x) { return '<li>' + H.icon(x[0], 14) + '<span>' + esc(x[1]) + '</span></li>'; }).join('') + '</ul>' +
        '<p class="stg-sends-never">' + H.icon('ban', 14) + '<span>Never sent: raw messages, files, recordings, direct messages, or anything a private topic matched.</span></p></details>');
  }

  /* ---------- Workspace ---------- */
  function paneWorkspace() {
    var ws = H.store.state.workspace, nora = q.person('nora'), meId = H.store.state.me;
    var people = Object.keys(H.PEOPLE).map(function (id) { return H.PEOPLE[id]; });
    return '<div class="card stg-ws"><span class="stg-ws-mark" style="--hue:' + ui.hue('brightwater') + '" aria-hidden="true">' + esc(ws.name.charAt(0)) + '</span>' +
        '<div class="grow"><div class="stg-me-name">' + esc(ws.name) + '</div><div class="t-callout c-3">' + esc(ws.domain) + ' · ' + esc(ws.plan) + ' plan · ' + ws.seats + ' members</div></div>' +
        ui.btn('Invite teammates', { kind: 'primary', size: 'sm', icon: 'user-plus', action: 'invite' }) + '</div>' +
      section('Details', group([
        row('Plan', '', '<span class="stg-val">' + esc(ws.plan) + '</span>'),
        row('Members', '', '<span class="stg-val num">' + ws.seats + '</span>'),
        row('Domain', 'Anyone with this email domain can join.', '<span class="stg-val mono">' + esc(ws.domain) + '</span>'),
        row('Admins', '', '<span class="stg-val row gap-2">' + ui.avatar(nora, 'xs', { tip: false }) + esc(nora.name) + '</span>'),
        row('Your role', '', '<span class="stg-val">Member</span>')
      ]), 'Admins manage billing and membership. They can’t see your drafts, your voice model or anything Halo held back.') +
      section('Members', group(people.map(function (p) {
        var badge = p.id === meId ? ui.badge('You', 'solid') : p.id === 'nora' ? ui.badge('Admin', 'outline') : p.manager ? ui.badge('Your manager', 'outline') : '';
        return '<div class="item has-lead stg-person" data-key="mb-' + p.id + '">' + ui.avatar(p, 'md', { tip: false }) + '<div class="grow"><div class="item-title">' + esc(p.name) + '</div><div class="item-sub truncate">' + esc(p.role) + ' · ' + esc(p.team) + '</div></div>' + badge + '</div>';
      })), 'Showing ' + people.length + ' of ' + ws.seats + ' members.');
  }

  /* ---------- Keyboard (same content as the shortcuts overlay) ---------- */
  function paneKeyboard() {
    var M = U.mod, groups = {
      general: ['General', [['Search and commands', M + ' K'], ['New ticket or update', 'N'], ['Keyboard shortcuts', '?'], ['Close panel or menu', 'esc']]],
      go: ['Go to', [['Home', 'G H'], ['Digest', 'G D'], ['Ask Halo', 'G A'], ['Tickets', 'G T'], ['Calendar', 'G C'], ['Team', 'G M'], ['History', 'G Y'], ['Sources', 'G S'], ['Voice & privacy', 'G P'], ['Settings', 'G ,']]],
      digest: ['Digest', [['Approve focused update', 'A'], ['Hold for tomorrow', 'H'], ['Edit', 'E'], ['Approve all routine', 'shift A']]],
      trust: ['Trust mode', [['More control', '['], ['More automation', ']']]]
    };
    var block = function (g) {
      return '<section class="stg-sec"><h2 class="stg-sec-title">' + g[0] + '</h2><div class="group">' + g[1].map(function (r) {
        return '<div class="item stg-kb-row"><span class="grow">' + esc(r[0]) + '</span><span class="row gap-1">' + ui.kbd(r[1]) + '</span></div>';
      }).join('') + '</div></section>';
    };
    return '<div class="stg-kb"><div>' + block(groups.general) + block(groups.digest) + block(groups.trust) + '</div><div>' + block(groups.go) + '</div></div>' +
      '<div class="row gap-3 mt-6 wrap">' + ui.btn('Open shortcut overlay', { icon: 'keyboard', action: 'open', attrs: { 'data-overlay': 'shortcuts' }, kbd: '?' }) + '<span class="t-callout c-3">Press ? anywhere in Halo to see these.</span></div>';
  }

  /* ---------- About ---------- */
  function paneAbout() {
    var built = H.now();
    return '<div class="card stg-about">' + '<span class="stg-about-mark">' + ui.mark(44, true) + '</span>' +
        '<div class="grow"><div class="stg-about-name">Halo</div><div class="t-callout c-2">Your work, represented.</div>' +
        '<div class="meta mt-2"><span class="mono">Version ' + VERSION + '</span><span class="sep"></span><span>Built ' + F.date(built) + ', ' + built.getFullYear() + '</span><span class="sep"></span><span>myhalo.co</span></div></div></div>' +
      section('', group([
        '<button type="button" class="item clickable" data-action="open" data-overlay="whatsnew"><span class="lead-ic">' + H.icon('gift', 16) + '</span><span class="item-title grow">What’s new</span>' + H.icon('chevron-right', 16, 'c-3') + '</button>',
        '<button type="button" class="item clickable" data-action="stg-legal" data-doc="terms"><span class="lead-ic">' + H.icon('file-text', 16) + '</span><span class="item-title grow">Terms of service</span>' + H.icon('chevron-right', 16, 'c-3') + '</button>',
        '<button type="button" class="item clickable" data-action="stg-legal" data-doc="privacy"><span class="lead-ic">' + H.icon('privacy', 16) + '</span><span class="item-title grow">Privacy policy</span>' + H.icon('chevron-right', 16, 'c-3') + '</button>',
        '<button type="button" class="item clickable" data-action="stg-legal" data-doc="security"><span class="lead-ic">' + H.icon('lock', 16) + '</span><span class="item-title grow">Security</span>' + H.icon('chevron-right', 16, 'c-3') + '</button>'
      ])) +
      section('Demo', group([row('Reset demo workspace', 'Restores Brightwater’s sample data. Your appearance and profile settings stay.', ui.btn('Reset', { size: 'sm', kind: 'danger', icon: 'refresh', action: 'reset-demo' }), { lead: 'refresh' })])) +
      '<p class="stg-credits">Typefaces: Geist and Geist Mono, SIL Open Font License 1.1.</p>';
  }

  var PANES = { profile: paneProfile, trust: paneTrust, notifications: paneNotifications, appearance: paneAppearance, ai: paneAI, workspace: paneWorkspace, keyboard: paneKeyboard, about: paneAbout };

  H.screens.settings = {
    title: 'Settings',
    crumbs: function (r) { return [{ label: 'Settings', nav: '#/settings' }, { label: tabOf(r).label }]; },
    docTitle: function (r) { return tabOf(r).label + ' · Settings · Halo'; },
    pageClass: 'stg-page',
    render: function (r) {
      var t = tabOf(r);
      return '<div class="stg">' +
        '<nav class="stg-nav" aria-label="Settings sections">' + TABS.map(function (x) {
          return '<a class="stg-nav-item" href="#/settings/' + x.id + '" data-nav="#/settings/' + x.id + '"' + (x.id === t.id ? ' aria-current="page"' : '') + ' data-key="sn-' + x.id + '">' + H.icon(x.icon, 16) + '<span>' + esc(x.label) + '</span></a>';
        }).join('') + '</nav>' +
        '<div class="stg-main"><header class="page-hd stg-hd"><div class="grow"><h1>' + esc(t.label) + '</h1>' + (t.lede ? '<p class="lede">' + esc(t.lede) + '</p>' : '') + '</div></header>' + PANES[t.id]() + '</div></div>';
    },
    after: function (root, r) {
      // On phones the sub-nav scrolls sideways: keep the current section in view when it changes.
      var t = tabOf(r).id; if (view.lastTab === t) return; view.lastTab = t;
      var nav = root.querySelector('.stg-nav'), cur = nav && nav.querySelector('[aria-current="page"]');
      if (nav && cur && nav.scrollWidth > nav.clientWidth) nav.scrollLeft = Math.max(0, cur.offsetLeft - (nav.clientWidth - cur.offsetWidth) / 2);
    },
    leave: function () { view.lastTab = null; },
    actions: {
      'stg-profile': function (el) {
        if (!BASE) applyProfile();
        var k = el.dataset.k, v = String(el.value || '').trim().replace(/\s+/g, ' ');
        if ((k === 'name' || k === 'role' || k === 'team') && !v) { el.value = q.me()[k]; ui.toast('This can’t be empty', { icon: 'alert' }); return; }
        if (k === 'name' || k === 'role' || k === 'team' || k === 'tz') { if (v === q.me()[k]) return; setProfile(k, v === BASE[k] ? '' : v); }
        else setProfile(k, v);
        saved();
      },
      'stg-photo': function () { var i = document.getElementById('stg-photo-in'); if (i) { i.value = ''; i.click(); } },
      'stg-photo-file': function (el) {
        var f = el.files && el.files[0]; if (!f) return;
        if (!/^image\//.test(f.type)) { ui.toast('Choose an image file, like a JPG or PNG', { icon: 'alert' }); return; }
        readPhoto(f, function (url) { if (!url) { ui.toast('That image couldn’t be read. Try another one.', { icon: 'alert' }); return; } setProfile('photo', url); saved('Photo updated'); });
      },
      'stg-photo-rm': function () { setProfile('photo', ''); saved('Photo removed'); },
      'stg-mode': function (el) { H.act.setMode(el.dataset.v); },
      'stg-digest': function (el) {
        var v = el.value; if (v === prefs().digestTime) return;
        H.store.commit(function (s) { s.prefs.digestTime = v; s.digest.closesAt = H.slot(0, v); });
        saved('Your digest now closes at ' + clock(v), 'clock');
      },
      'stg-hold': function () { var on = prefs().holdEstimates === false; H.act.setPref('holdEstimates', on); saved(on ? 'Estimate changes will always wait for you' : 'Estimate changes follow your trust mode', 'timer'); },
      'stg-quiet': function () {
        var qt = Object.assign({ on: false, from: '18:30', to: '08:30' }, prefs().quiet); qt.on = !qt.on;
        H.act.setPref('quiet', qt); saved(qt.on ? 'Quiet hours on, ' + clock(qt.from) + ' to ' + clock(qt.to) : 'Quiet hours off', qt.on ? 'bell-off' : 'bell');
      },
      'stg-quiet-time': function (el) { var qt = Object.assign({ on: true, from: '18:30', to: '08:30' }, prefs().quiet); qt[el.dataset.k] = el.value; H.act.setPref('quiet', qt); saved(); },
      'stg-notify': function (el) {
        var k = el.dataset.k, n = Object.assign({}, prefs().notify), on = k === 'push' || k === 'email' ? !n[k] : n[k] === false;
        n[k] = on; H.act.setPref('notify', n); saved();
      },
      'stg-theme': function (el) { var v = el.dataset.v; if (prefs().theme === v) return; H.act.setPref('theme', v); saved('Appearance: ' + { system: 'matches your device', light: 'light', dark: 'dark' }[v], v === 'dark' ? 'moon' : v === 'light' ? 'sun' : 'monitor'); },
      'stg-motion': function (el) { var v = el.dataset.v; if ((prefs().motion || 'system') === v) return; H.act.setPref('motion', v); saved(v === 'reduce' ? 'Motion reduced' : 'Motion follows your device', 'layers'); },
      'stg-sound': function () { var on = !prefs().sound; H.act.setPref('sound', on); if (on) H.chime(); saved(on ? 'Sounds on' : 'Sounds off', on ? 'bell' : 'bell-off'); },
      'stg-chime': function () { H.chime(); },
      'stg-model': function (el) {
        var v = el.value, m = H.ai.MODELS.filter(function (x) { return x.id === v; })[0]; if (!m || v === H.ai.model()) return;
        H.store.commit(function (s) { s.prefs.ai = Object.assign({}, s.prefs.ai, { model: v }); });
        view.test = null; saved('Halo now uses ' + m.label, 'sparkle');
      },
      'stg-key': function (el) { view.key = el.value; view.keyError = ''; H.render(); },
      'stg-key-save': function () {
        var k = (document.getElementById('stg-key') || {}).value || view.key; k = String(k).trim();
        if (!k) return;
        if (!/^sk-ant-[\w-]{8,}$/.test(k)) { view.keyError = 'That doesn’t look like an Anthropic key. Keys start with sk-ant-.'; H.render(); return; }
        view.key = ''; view.keyError = ''; view.test = null; H.ai.setKey(k);
        saved('Key saved in this browser', 'key');
      },
      'stg-key-rm': function () { H.ai.setKey(''); view.test = null; saved('Key removed from this browser', 'key'); },
      'stg-ai-test': function () {
        if (view.testing) return;
        var p = H.ai.provider(), label = H.ai.status().label;
        view.testing = true; view.test = null; H.ai.lastError = null; H.render();
        H.ai.rewrite('Test: finished the wallet placement review', 'team').then(function (text) {
          var err = H.ai.lastError || null, live = p !== 'demo' && !err;
          view.testing = false; view.test = { text: text, live: live, err: err, provider: p }; H.render();
          ui.toast(live ? 'Connected. ' + label.replace(/^Live · /, '') + ' answered live.' : p === 'demo' ? 'Halo answered with a demo reply. Add a key for live answers.' : 'Couldn’t reach the model, so Halo used a demo answer.', { icon: live ? 'check-circle' : 'alert' });
        }, function (e) {
          view.testing = false; view.test = { text: 'No reply', live: false, err: (e && (e.message || e.code)) || 'Unavailable', provider: p }; H.render();
          ui.toast('The test didn’t finish. Try again in a moment.', { icon: 'alert' });
        });
      },
      'stg-legal': function (el) { ui.open('settings-legal', { doc: el.dataset.doc }); }
    }
  };

  /* ---------- Terms, privacy, security ---------- */
  var LEGAL = {
    terms: ['Terms of service', 'The short version of how Halo works with you.', [
      'Brightwater provides Halo to its people under its agreement with us. These terms cover how you, as a member, use it.',
      'Your work stays yours. Halo drafts updates from the sources you connect, and you decide what gets shared. What you approve is yours to stand behind, like anything else you post at work.',
      'Use Halo for your own work. Don’t connect accounts that aren’t yours, and don’t use Halo to monitor other people. It’s built to represent you, not to watch anyone.',
      'If you leave Brightwater, an admin can close your Halo. You can export everything first from Voice & privacy.',
      'If these terms change in a way that affects you, Halo tells you here before the change takes effect.'
    ]],
    privacy: ['Privacy policy', 'What Halo reads, what it keeps, and who can see it.', [
      'Halo reads only the sources you connect, and only what each one lists on the Sources page. You can see and change this at any time.',
      'Raw content, like messages, edits and events, is processed inside your Halo. It’s never shown to your manager, your team or Brightwater’s admins. Only updates you share leave it.',
      'Raw items are deleted after your retention period, currently %RET%. Updates you shared stay in History until you delete them.',
      'Your voice model learns only from samples you approve. It never leaves your Halo and is never used to train anything for anyone else.',
      'You can export or delete all of your data from Voice & privacy. Deleting is permanent.'
    ]],
    security: ['Security', 'How Halo protects your connections and your data.', [
      'Every connection uses the provider’s own sign-in, and Halo asks only for the access listed in Sources. You can disconnect any source instantly.',
      'Data is encrypted in transit and at rest. Access tokens are stored apart from your content and are never shown in the app.',
      'When Halo uses an AI model, it sends only the context listed in Settings, under AI. A key you add stays in your browser and goes straight to Anthropic.',
      'Brightwater’s admins manage members and billing. They can’t read your drafts, your voice model or anything Halo held back.',
      'Found a security issue? Write to security@myhalo.co. A person reads every report.'
    ]]
  };
  H.overlays['settings-legal'] = {
    kind: 'modal', title: 'Legal',
    render: function (p) {
      var d = LEGAL[p.doc] || LEGAL.terms, days = H.store.state.privacy.retention, ret = days >= 365 ? 'one year' : days + ' days';
      return '<div class="modal-hd"><div class="grow"><h2>' + d[0] + '</h2><p>' + d[1] + '</p></div>' + ui.iconBtn('x', 'Close', 'close') + '</div>' +
        '<div class="modal-bd stg-legal">' + d[2].map(function (t) { return '<p>' + esc(t.replace('%RET%', ret)) + '</p>'; }).join('') +
        '<p class="t-caption c-3">Halo ' + VERSION + ' · Updated ' + F.date(H.now()) + ', ' + H.now().getFullYear() + '</p></div>' +
        '<div class="modal-ft">' + ui.btn('Done', { kind: 'primary', action: 'close' }) + '</div>';
    }
  };
})(window.H = window.H || {});

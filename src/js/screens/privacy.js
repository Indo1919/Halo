/* Voice & privacy — how Halo sounds as you, what it never shares, and what it keeps. */
(function (H) {
  'use strict';
  var esc = H.esc, ui = H.ui, q = H.q, F = H.fmt, U = H.util;
  var view = { aud: 'team', training: false, drafts: { phrases: '', avoid: '', topic: '' }, typed: '' };
  var TABS = [{ id: 'voice', label: 'Voice', icon: 'fingerprint' }, { id: 'boundaries', label: 'Boundaries', icon: 'lock' }, { id: 'data', label: 'Your data', icon: 'archive' }];
  var AUD = [{ v: 'team', label: 'Team', icon: 'teammate' }, { v: 'manager', label: 'Manager', icon: 'manager' }, { v: 'exec', label: 'Leadership', icon: 'exec' }];
  var AUD_NAME = { team: 'your team', manager: 'your manager', exec: 'leadership' };
  var TONE = [
    { k: 'length', lo: 'Concise', hi: 'Detailed', steps: ['Concise', 'Balanced length', 'Detailed'] },
    { k: 'formality', lo: 'Casual', hi: 'Formal', steps: ['Casual', 'Neutral', 'Formal'] },
    { k: 'technical', lo: 'Plain', hi: 'Technical', steps: ['Plain language', 'Some detail', 'Technical'] }
  ];
  var ROWS = [
    { k: 'progress', label: 'Ticket progress', sub: 'Status changes and how far along you are' },
    { k: 'time', label: 'Time spent', sub: 'Hours from focus blocks and edit sessions' },
    { k: 'meetings', label: 'Meeting notes', sub: 'Recaps and decisions from your meetings' },
    { k: 'blockers', label: 'Blockers', sub: 'What you’re waiting on, and from whom' },
    { k: 'activity', label: 'Raw activity', sub: 'Individual messages, edits and events', locked: true }
  ];
  var LEVELS = [{ v: 'full', label: 'Full' }, { v: 'summary', label: 'Summary' }, { v: 'hidden', label: 'Hidden' }];
  var NEVER = [
    { k: 'dms', icon: 'message', label: 'Direct messages', sub: 'Even when a DM is about work, it stays out of every update.' },
    { k: 'privateEvents', icon: 'lock', label: 'Events marked private', sub: 'Never mentioned, not even as a title or busy time.' },
    { k: 'leave', icon: 'coffee', label: 'Personal time and leave', sub: 'Time off, appointments and anything marked personal.' },
    { k: 'oneOnOnes', icon: 'user', label: 'Anything from 1:1s', sub: 'Notes, recaps and follow-ups from meetings with one other person.' }
  ];

  function tabOf(r) { var t = r.parts[0] || 'voice'; return TABS.some(function (x) { return x.id === t; }) ? t : 'voice'; }
  function bucket(v) { return v < 40 ? 0 : v > 65 ? 2 : 1; }
  function lower(s) { return s.charAt(0).toLowerCase() + s.slice(1); }
  function voice() { return H.store.state.voice; }
  function never() { return Object.assign({ dms: true, privateEvents: true, leave: true, oneOnOnes: true }, H.store.state.privacy.never || {}); }
  function level(row, col) { return row === 'activity' ? 'hidden' : ((H.store.state.privacy.matrix[row] || {})[col] || 'hidden'); }
  function learners() {
    var st = H.store.state, v = st.voice;
    return q.connected().filter(function (s) { return q.voiceSource && q.voiceSource(s.id); }).sort(function (a, b) {
      var A = st.sources[a.id].useVoice ? 1 : 0, B = st.sources[b.id].useVoice ? 1 : 0;
      return (B - A) || ((v.samples[b.id] || 0) - (v.samples[a.id] || 0));
    });
  }
  function samples() {
    var v = voice(), n = 0;
    learners().forEach(function (s) { if (H.store.state.sources[s.id].useVoice) n += v.samples[s.id] || 0; });
    return n;
  }

  /* ---------- Voice preview: the same CHK-142 update, three lengths × three audiences ----------
     {plain|some|technical} picks by the Technical slider, [casual|neutral|formal] by the Formal slider. */
  var TEXTS = {
    team: [
      '[Quick update: cards|Update: cards|Cards] and bank transfer are done on {the payment selector|the payment selector (CHK-142)|CHK-142}, and wallets are next. [Aiming for Thursday now.|New target is Thursday.|The revised target is Thursday.]',
      '[Quick update: the|Update: the|The] payment method selector {is in high fidelity|(CHK-142) is in hi-fi|(CHK-142) is in hi-fi, with %DONE% of %TOTAL% subtasks done}. Cards and bank transfer are finished, and wallets are next. Wallet states were bigger than scoped, so [I’m aiming for Thursday|the new target is Thursday|the revised target is Thursday].',
      '[Quick update: the|Update: the|The] payment method selector {is in high fidelity|(CHK-142) is in hi-fi|(CHK-142) is in hi-fi, with %DONE% of %TOTAL% subtasks done}. Cards and bank transfer are finished, and wallets are next. Wallet states were bigger than scoped, so [I’m aiming for Thursday|the new target is Thursday|the revised target is Thursday]. {Next I need Sam’s check on Google Pay button sizing, then I can lock the wallet row.|Next I need Sam’s check on Google Pay sizing (CHK-145), then I can lock the wallet row.|Next, Sam confirms Google Pay button sizing on CHK-145, then I lock the wallet row and start redlines.} [Ping me if anything looks off.|Let me know if anything looks off.|Please flag anything that looks off.]'
    ],
    manager: [
      '[Heads up: the|Heads up: the|The] payment method selector {|(CHK-142) |(CHK-142) }lands Thursday, a day later than planned{.|.|, because wallet states needed 14 new frames.}',
      '[Quick update: Checkout v3 design is moving.|Quick update: Checkout v3 design is moving.|Checkout v3 design is progressing.] The payment method selector {|(CHK-142) |(CHK-142) }lands Thursday, a day later than planned, because wallet states were bigger than scoped{.|.| (14 new frames).} [Nothing else is at risk.|Nothing else is at risk.|No other work is at risk.]',
      '[Quick update: Checkout v3 design is moving.|Quick update: Checkout v3 design is moving.|Checkout v3 design is progressing.] The payment method selector {|(CHK-142) |(CHK-142) }lands Thursday, a day later than planned, because wallet states were bigger than scoped{.|.| (14 new frames).} [Nothing else is at risk.|Nothing else is at risk.|No other work is at risk.] [Next up is error states from today’s kickoff, with flows by Thursday.|Next up: error states from today’s kickoff, with flows by Thursday.|Next, I will design the error states from today’s kickoff, with flows due Thursday.]{| Leo owns the error-code map.| Leo owns the 3DS error-code map, which I need by Wednesday.}'
    ],
    exec: [
      '[Quick update: Checkout v3|Checkout v3|Checkout v3] design is on track for [October|October|the October release].',
      '[Quick update: Checkout v3|Checkout v3|Checkout v3] design is on track for [October|October|the October release]. The payment method selector lands this week, a day later than planned, with no impact on the release.',
      '[Quick update: Checkout v3|Checkout v3|Checkout v3] design is on track for [October|October|the October release]. The payment method selector lands this week, a day later than planned, with no impact on the release. Work on failed-payment handling started today{.| and is scheduled this sprint.| (declined, expired and 3DS failures) and is scheduled this sprint.}'
    ]
  };
  var FORMAL = { 'I’m': 'I am', 'I’ll': 'I will', 'it’s': 'it is', 'It’s': 'It is', 'we’re': 'we are', 'that’s': 'that is', 'isn’t': 'is not', 'don’t': 'do not', 'won’t': 'will not' };
  function pick(parts, b) { var p = parts.split('|'); return p.length === 3 ? p[b] : p[b === 0 ? 0 : 1]; }
  H.q.voicePreview = function (aud, tone) {
    tone = tone || voice().tone;
    var bl = bucket(tone.length), bf = bucket(tone.formality), bt = bucket(tone.technical);
    var t = q.ticket('CHK-142'), subs = t ? t.subtasks : [], done = subs.filter(function (x) { return x.done; }).length;
    var s = TEXTS[aud] ? TEXTS[aud][bl] : TEXTS.team[bl];
    s = s.replace(/\{([^}]*)\}/g, function (m, p) { return pick(p, bt); }).replace(/\[([^\]]*)\]/g, function (m, p) { return pick(p, bf); });
    s = s.replace('%DONE%', done).replace('%TOTAL%', subs.length || 6);
    if (bf === 2) Object.keys(FORMAL).forEach(function (k) { s = s.split(k).join(FORMAL[k]); });
    // Phrases you avoid win over openers.
    voice().avoid.forEach(function (a) {
      var n = a.toLowerCase().replace(/[:\s]+$/, '');
      var m = /^(Quick update|Heads up|Update): (.)/.exec(s);
      if (m && m[1].toLowerCase() === n) s = m[2].toUpperCase() + s.slice(m[0].length);
    });
    return s.replace(/\s{2,}/g, ' ').trim();
  };

  /* ---------- Voice fingerprint: a flat, deterministic signature drawn from the model id ---------- */
  function rng(seed) {
    return function () { seed = (seed + 0x6D2B79F5) | 0; var t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function signature(id, px) {
    // Three seeded waves plus a little per-bar texture: organic lobes, unique to each id.
    var r = rng(U.hash(String(id))), N = 48, v = [], i, T = Math.PI * 2;
    var k1 = 2 + Math.floor(r() * 2), k2 = 4 + Math.floor(r() * 3), k3 = 7 + Math.floor(r() * 4), p1 = r() * T, p2 = r() * T, p3 = r() * T;
    for (i = 0; i < N; i++) { var t = (i / N) * T; v.push(0.5 * Math.sin(k1 * t + p1) + 0.3 * Math.sin(k2 * t + p2) + 0.18 * Math.sin(k3 * t + p3) + 0.22 * (r() - 0.5)); }
    var lo = Math.min.apply(null, v), hi = Math.max.apply(null, v);
    v = v.map(function (x) { return (x - lo) / ((hi - lo) || 1); });
    var c = 100, r0 = 55, d = '';
    for (i = 0; i < N; i++) {
      var a = (i / N) * T, len = 5 + v[i] * 30, sx = Math.sin(a), cy = Math.cos(a);
      d += 'M' + (c + r0 * sx).toFixed(2) + ' ' + (c - r0 * cy).toFixed(2) + 'L' + (c + (r0 + len) * sx).toFixed(2) + ' ' + (c - (r0 + len) * cy).toFixed(2);
    }
    // Ring with a Signal segment from 12 to 3 o'clock and parallel-sided gaps, like the mark.
    var R1 = 46, R0 = 37, g = 2.6, f = function (n) { return (+n.toFixed(2)); };
    var o1 = Math.sqrt(R1 * R1 - g * g), o0 = Math.sqrt(R0 * R0 - g * g);
    var ink = 'M' + f(c + o1) + ' ' + f(c + g) + 'A' + R1 + ' ' + R1 + ' 0 1 1 ' + f(c - g) + ' ' + f(c - o1) + 'L' + f(c - g) + ' ' + f(c - o0) + 'A' + R0 + ' ' + R0 + ' 0 1 0 ' + f(c + o0) + ' ' + f(c + g) + 'Z';
    var sig = 'M' + f(c + g) + ' ' + f(c - o1) + 'A' + R1 + ' ' + R1 + ' 0 0 1 ' + f(c + o1) + ' ' + f(c - g) + 'L' + f(c + o0) + ' ' + f(c - g) + 'A' + R0 + ' ' + R0 + ' 0 0 0 ' + f(c + g) + ' ' + f(c - o0) + 'Z';
    return '<svg class="prv-sig" width="' + px + '" height="' + px + '" viewBox="0 0 200 200" role="img" aria-label="Voice fingerprint ' + esc(id) + '">' +
      '<path class="prv-sig-bars" d="' + d + '" fill="none" stroke="var(--text)" stroke-width="2.6" stroke-linecap="round"/>' +
      '<path d="' + ink + '" fill="var(--text)"/><path class="prv-sig-seg" d="' + sig + '" fill="var(--accent)"/></svg>';
  }
  var ALPH = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  function nextId(seed) {
    var a = U.hash(seed), b = U.hash(seed + '·'), s = '';
    for (var i = 0; i < 8; i++) s += ALPH[((i < 4 ? a : b) >>> ((i % 4) * 7)) & 31];
    return 'VF-' + s.slice(0, 4) + '-' + s.slice(4);
  }

  function fingerprint() {
    var v = voice(), n = samples(), busy = view.training;
    var statement = '<div class="prv-fp-ft">' + H.icon('lock', 14) + '<span>Your voice model never leaves your Halo. Only you can train it, and you can delete it any time.</span></div>';
    if (!v.fingerprint) {
      return '<section class="card prv-fp is-empty">' +
        '<div class="prv-fp-art"><div class="prv-fp-ghost' + (busy ? ' is-busy' : '') + '">' + H.icon('fingerprint', 28) + '</div></div>' +
        '<div class="prv-fp-info"><div class="eyebrow">Voice fingerprint</div><h2 class="prv-fp-title">No voice model</h2>' +
          '<p class="t-callout c-3 mt-1">Halo writes in a neutral voice until you train it again. Training uses the ' + n + ' samples you approved and takes about a minute.</p>' +
          (busy ? progress(n) : '<div class="row gap-2 wrap mt-4">' + ui.btn('Train again', { kind: 'primary', icon: 'refresh', action: 'prv-train', disabled: !n }) + '</div>') + '</div>' + statement + '</section>';
    }
    return '<section class="card prv-fp">' +
      '<div class="prv-fp-art' + (busy ? ' is-busy' : '') + '">' + signature(v.fingerprint, 176) + '</div>' +
      '<div class="prv-fp-info"><div class="eyebrow">Voice fingerprint</div><div class="prv-fp-id">' + esc(v.fingerprint) + '</div>' +
        '<p class="t-callout c-3 mt-1">Trained on ' + U.plural(n, 'sample') + ' you approved · refreshed ' + (v.trained == null ? 'never' : lower(F.rel(H.at(v.trained)))) + '</p>' +
        (busy ? progress(n) : '<div class="row gap-2 wrap mt-4">' + ui.btn('Retrain', { icon: 'refresh', action: 'prv-train', disabled: !n }) + ui.btn('Export', { icon: 'download', action: 'open', attrs: { 'data-overlay': 'privacy-voice-export' } }) +
          ui.btn('Delete voice model', { kind: 'ghost', cls: 'btn-danger', icon: 'trash', action: 'prv-delete-voice' }) + '</div>') +
      '</div>' + statement + '</section>';
  }
  function progress(n) {
    return '<div class="prv-train mt-4" role="status"><div class="row gap-2"><span class="t-callout">Training on ' + U.plural(n, 'sample') + '…</span><span class="t-caption c-3 ml-auto">Stays in your Halo</span></div>' +
      '<div class="bar thin mt-2"><span class="prv-train-fill"></span></div></div>';
  }

  function sliderRow(t, tone) {
    var val = tone[t.k], b = bucket(val);
    return '<div class="prv-slider"><span class="prv-end' + (b === 0 ? ' on' : '') + '">' + t.lo + '</span>' +
      '<input type="range" class="prv-range" min="0" max="100" step="1" value="' + val + '" style="--val:' + val + '%" data-input="prv-tone" data-k="' + t.k + '" aria-label="' + t.lo + ' to ' + t.hi + '" aria-valuetext="' + t.steps[b] + '">' +
      '<span class="prv-end is-hi' + (b === 2 ? ' on' : '') + '">' + t.hi + '</span></div>';
  }
  function preview() {
    var v = voice(), text = q.voicePreview(view.aud, v.tone);
    return '<section class="card prv-preview">' +
      '<div class="card-hd"><h2>How Halo sounds as you</h2><div class="ml-auto">' + ui.seg('prv-aud', AUD, view.aud, { action: 'prv-aud', size: 'sm', label: 'Audience' }) + '</div></div>' +
      '<div class="card-bd">' +
        (v.fingerprint ? '' : '<div class="banner mb-3">' + H.icon('info', 16) + '<span>No voice model yet, so this is how a neutral Halo would write it.</span></div>') +
        '<blockquote class="prv-quote" aria-live="polite">' + esc(text) + '</blockquote>' +
        '<div class="meta mt-3">' + H.icon('ticket', 12) + '<span>A sample update about CHK-142, written for ' + AUD_NAME[view.aud] + '</span></div>' +
        '<div class="prv-sliders">' + TONE.map(function (t) { return sliderRow(t, v.tone); }).join('') + '</div>' +
      '</div></section>';
  }
  function chips(list) {
    var items = voice()[list];
    return '<div class="prv-chips">' + (items.length ? items.map(function (p) {
      return '<span class="prv-chip' + (list === 'avoid' ? ' is-avoid' : '') + '" data-key="ch-' + list + '-' + U.hash(p) + '">' + (list === 'avoid' ? H.icon('ban', 12) : '') + '<span>' + esc(p) + '</span>' +
        '<button type="button" class="prv-chip-x" data-action="prv-rm" data-list="' + list + '" data-v="' + esc(p) + '" aria-label="Remove ' + esc(p) + '" data-tip="Remove">' + H.icon('x', 12) + '</button></span>';
    }).join('') : '<span class="t-callout c-3">Nothing yet.</span>') + '</div>';
  }
  function addRow(list, placeholder, label) {
    var d = view.drafts[list] || '';
    return '<div class="prv-add"><input class="input input-sm" type="text" maxlength="48" autocomplete="off" placeholder="' + esc(placeholder) + '" aria-label="' + esc(label) + '" value="' + esc(d) + '" data-input="prv-draft" data-list="' + list + '" data-enter="prv-add" id="prv-add-' + list + '">' +
      ui.btn('Add', { size: 'sm', action: 'prv-add', attrs: { 'data-list': list }, disabled: !d.trim() }) + '</div>';
  }
  function phrases() {
    return '<div class="prv-two mt-4">' +
      '<section class="card prv-phr"><div class="card-hd"><h2>Phrases you use</h2></div><div class="card-bd"><p class="t-callout c-3">Halo reaches for these when they fit.</p>' + chips('phrases') + addRow('phrases', 'Add a phrase', 'Add a phrase you use') + '</div></section>' +
      '<section class="card prv-phr"><div class="card-hd"><h2>Phrases you avoid</h2></div><div class="card-bd"><p class="t-callout c-3">Halo never writes these for you.</p>' + chips('avoid') + addRow('avoid', 'Add a phrase to avoid', 'Add a phrase to avoid') + '</div></section></div>';
  }
  function learnsFrom() {
    var v = voice(), list = learners();
    return '<section class="section"><div class="section-hd"><h2>Learns from</h2></div><p class="prv-lede">Only what you send, never what others write.</p>' +
      (list.length ? '<div class="group">' + list.map(function (s) {
        var st = H.store.state.sources[s.id], on = !!st.useVoice, n = v.samples[s.id] || 0, nm = H.brands[s.id].name;
        return '<div class="item has-lead" data-key="lf-' + s.id + '">' + H.brandTile(s.id, 28, 'tinted') +
          '<div class="grow"><div class="item-title">' + esc(nm) + '</div><div class="item-sub">' + esc(q.voiceSource(s.id)) + (on && n ? '<span class="show-phone num"> · ' + U.plural(n, 'sample') + '</span>' : '') + '</div></div>' +
          '<span class="prv-count num">' + (on ? (n ? U.plural(n, 'sample') : 'Learns at next refresh') : 'Off') + '</span>' +
          ui.switch(on, 'prv-learn', { 'data-id': s.id, 'aria-label': 'Learn your voice from ' + nm }) + '</div>';
      }).join('') + '</div>' : '<div class="card">' + ui.empty('sources', 'No writing sources connected', 'Connect Slack, Jira or Docs so Halo can learn how you write.', ui.btn('Open Sources', { action: 'nav', attrs: { 'data-to': '#/sources' } })) + '</div>') +
      '<p class="group-foot">Samples are only messages you wrote and approved. Turning a source off removes its samples from your voice model.</p></section>';
  }
  function voiceTab() { return fingerprint() + '<div class="mt-4">' + preview() + '</div>' + phrases() + learnsFrom(); }

  /* ---------- Boundaries ---------- */
  function lvlGlyph(v) { return '<span class="lvl-glyph g-' + v + '" aria-hidden="true"></span>'; }
  function matrix() {
    var head = '<div class="prv-mx-row prv-mx-head" role="row"><span role="columnheader"><span class="sr-only">What</span></span>' + AUD.map(function (a) { return '<span role="columnheader">' + H.icon(a.icon, 14) + a.label + '</span>'; }).join('') + '</div>';
    return '<div class="card prv-matrix" role="table" aria-label="Who sees what">' + head + ROWS.map(function (row) {
      return '<div class="prv-mx-row' + (row.locked ? ' is-locked' : '') + '" role="row" data-key="mx-' + row.k + '"><div class="prv-mx-label" role="rowheader"><div class="item-title">' + esc(row.label) + '</div><div class="item-sub">' + esc(row.sub) + '</div></div>' +
        AUD.map(function (a) {
          var v = level(row.k, a.v), lab = { full: 'Full', summary: 'Summary', hidden: 'Hidden' }[v];
          var ctl = row.locked
            ? '<span class="prv-lvl is-locked" tabindex="0" data-tip="Halo never shows raw activity to anyone" aria-label="' + esc(row.label) + ' for ' + AUD_NAME[a.v] + ': always hidden. Halo never shows raw activity to anyone.">' + H.icon('lock', 12) + '<span>Hidden</span></span>'
            : '<button type="button" class="prv-lvl is-' + v + '" data-action="prv-lvl" data-row="' + row.k + '" data-col="' + a.v + '" aria-haspopup="menu" aria-label="' + esc(row.label) + ' for ' + AUD_NAME[a.v] + ': ' + lab + '">' + lvlGlyph(v) + '<span>' + lab + '</span>' + H.icon('chevron-down', 12) + '</button>';
          return '<div class="prv-mx-cell" role="cell"><span class="prv-mx-aud" aria-hidden="true">' + a.label + '</span>' + ctl + '</div>';
        }).join('') + '</div>';
    }).join('') + '</div>' +
      '<div class="prv-legend">' + LEVELS.map(function (l) { return '<span>' + lvlGlyph(l.v) + '<b>' + l.label + '</b>' + { full: 'Everything you’ve shared', summary: 'One line, no specifics', hidden: 'Not shown at all' }[l.v] + '</span>'; }).join('') + '</div>';
  }
  function boundariesTab() {
    var p = H.store.state.privacy, nv = never();
    var topics = '<section class="section prv-first"><div class="section-hd"><h2>Private topics</h2></div><p class="prv-lede">Anything that matches is dropped before it reaches a draft. You’ll see “Redacted” wherever Halo held something back.</p>' +
      '<div class="group">' + p.topics.map(function (t) {
        return '<div class="item" data-key="tp-' + esc(t.id) + '"><div class="grow"><div class="item-title">' + esc(t.label) + '</div><div class="item-sub">' + esc(t.hint) + (t.hits ? '<span class="show-phone num"> · held back ' + t.hits + '</span>' : '') + '</div></div>' +
          '<span class="prv-count num">' + (t.hits ? 'Held back ' + t.hits : 'Nothing held back') + '</span>' +
          (t.custom ? ui.iconBtn('trash', 'Remove topic', 'prv-topic-rm', { size: 'sm', attrs: { 'data-id': t.id } }) : '') +
          ui.switch(t.on, 'prv-topic', { 'data-id': t.id, 'aria-label': 'Keep ' + t.label + ' private' }) + '</div>';
      }).join('') +
      '<div class="item prv-add-item">' + addRow('topic', 'Add a topic, like “Side projects”', 'Add a private topic') + '</div></div></section>';
    var rules = '<section class="section"><div class="section-hd"><h2>Never share</h2></div><p class="prv-lede">These stay out of every update, in every trust mode.</p><div class="group">' + NEVER.map(function (n) {
      return '<div class="item has-lead" data-key="nv-' + n.k + '"><span class="lead-ic">' + H.icon(n.icon, 16) + '</span><div class="grow"><div class="item-title">' + esc(n.label) + '</div><div class="item-sub">' + esc(n.sub) + '</div></div>' +
        ui.switch(nv[n.k], 'prv-never', { 'data-k': n.k, 'aria-label': 'Never share: ' + n.label }) + '</div>';
    }).join('') + '</div></section>';
    var who = '<section class="section"><div class="section-hd"><h2>Who sees what</h2><div class="actions">' + ui.btn('Preview as Rosa', { size: 'sm', icon: 'eye', action: 'open', attrs: { 'data-overlay': 'privacy-preview' } }) + '</div></div>' +
      '<p class="prv-lede">Each audience sees your shared updates at the level of detail you pick here.</p>' + matrix() + '</section>';
    var pause = '<section class="section"><div class="group"><div class="item has-lead"><span class="lead-ic">' + H.icon(p.paused ? 'play-circle' : 'pause-circle', 16) + '</span><div class="grow"><div class="item-title">Pause Halo</div><div class="item-sub">' +
      (p.paused ? 'Paused. Nothing is being observed or shared until you resume.' : 'Stop observing and sharing until you resume. Nothing already shared changes.') + '</div></div>' +
      ui.switch(p.paused, 'prv-pause', { 'aria-label': 'Pause Halo' }) + '</div></div></section>';
    return topics + rules + who + pause;
  }

  /* ---------- Your data ---------- */
  var LOG = [
    { t: -360, title: '1:1 with Rosa · career conversation', topics: 'Compensation & career, 1:1 conversations', where: 'Kept out of today’s digest for your manager' },
    { dayOff: -2, hhmm: '16:05', title: 'Follow-up notes after a 1:1 with Sam', topics: '1:1 conversations', where: 'Left out of your standup' },
    { dayOff: -6, hhmm: '11:20', title: 'Feedback from a 1:1 with Rosa', topics: '1:1 conversations', where: 'Kept out of your weekly summary' }
  ];
  function dataTab() {
    var p = H.store.state.privacy;
    var ret = '<section class="section prv-first"><div class="section-hd"><h2>Retention</h2></div><div class="group"><div class="item"><div class="grow"><label class="item-title" for="prv-ret">Keep raw items for</label><div class="item-sub">What Halo reads from your sources. Deleted for good after this.</div></div>' +
      '<select id="prv-ret" class="select input-sm prv-select" data-change="prv-retention">' + [[30, '30 days'], [90, '90 days'], [365, '1 year']].map(function (o) { return '<option value="' + o[0] + '"' + (+p.retention === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div></div>' +
      '<p class="group-foot">Updates you shared stay in History until you delete them.</p></section>';
    var log = '<section class="section"><div class="section-hd"><h2>Redaction log</h2><span class="sub">What Halo held back, and when</span></div><div class="card prv-log">' + LOG.map(function (e, i) {
      var t = e.t != null ? e.t : H.bday(e.dayOff, e.hhmm), d = H.at(t);
      return '<div class="prv-log-row" data-key="lg-' + i + '"><span class="prv-log-ic">' + H.icon('redact', 16) + '</span><div class="grow"><div class="item-title">' + esc(e.title) + '</div>' +
        '<div class="item-sub">Matched ' + esc(e.topics) + '</div><div class="prv-log-where">' + H.icon('lock', 12) + esc(e.where) + '</div></div>' +
        '<span class="prv-log-time">' + esc(F.day(d)) + '<span class="num">' + F.time(d) + '</span></span></div>';
    }).join('') + '</div><p class="group-foot">Only you can see this log. Nothing in it was ever shared.</p></section>';
    var io = '<section class="section"><div class="section-hd"><h2>Export and delete</h2></div><div class="group">' +
      '<div class="item has-lead"><span class="lead-ic">' + H.icon('download', 16) + '</span><div class="grow"><div class="item-title">Export all data</div><div class="item-sub">A copy of everything Halo keeps about you.</div></div>' + ui.btn('Export', { size: 'sm', action: 'open', attrs: { 'data-overlay': 'privacy-export' } }) + '</div>' +
      '<div class="item has-lead"><span class="lead-ic prv-danger-ic">' + H.icon('trash', 16) + '</span><div class="grow"><div class="item-title">Delete all Halo data</div><div class="item-sub">Permanently removes your updates, voice model and connections.</div></div>' + ui.btn('Delete', { size: 'sm', kind: 'danger', action: 'prv-delete-all' }) + '</div>' +
      '</div></section>';
    return ret + log + io;
  }

  H.screens.privacy = {
    title: 'Voice & privacy',
    crumbs: function (r) { var t = tabOf(r); return [{ label: 'Voice & privacy', nav: '#/privacy' }, { label: TABS.filter(function (x) { return x.id === t; })[0].label }]; },
    pageClass: 'narrow prv-page',
    render: function (r) {
      var t = tabOf(r), body = t === 'voice' ? voiceTab() : t === 'boundaries' ? boundariesTab() : dataTab();
      return '<header class="page-hd"><div class="grow"><h1>Voice & privacy</h1><p class="lede">Decide how Halo sounds as you, what it never shares, and what happens to your data.</p></div></header>' +
        '<nav class="tabs prv-tabs" role="tablist" aria-label="Voice and privacy">' + TABS.map(function (x) {
          return '<a class="tab" role="tab" href="#/privacy/' + x.id + '" data-nav="#/privacy/' + x.id + '" aria-selected="' + (x.id === t) + '">' + H.icon(x.icon, 16) + x.label + '</a>';
        }).join('') + '</nav><div class="prv-body" role="tabpanel">' + body + '</div>';
    },
    actions: {
      'prv-aud': function (el) { view.aud = el.dataset.v; H.render(); },
      'prv-tone': function (el) { var k = el.dataset.k, v = U.clamp(+el.value || 0, 0, 100); H.store.commit(function (s) { s.voice.tone[k] = v; }); },
      'prv-draft': function (el) { view.drafts[el.dataset.list] = el.value; H.render(); },
      'prv-add': function (el) {
        var list = el.dataset.list, input = document.getElementById('prv-add-' + list), text = ((input && input.value) || view.drafts[list] || '').trim().replace(/\s+/g, ' ');
        if (!text) return;
        view.drafts[list] = ''; if (input) { input.value = ''; input.focus(); }
        if (list === 'topic') {
          if (H.store.state.privacy.topics.some(function (t) { return t.label.toLowerCase() === text.toLowerCase(); })) { ui.toast('“' + text + '” is already private', { icon: 'info' }); H.render(); return; }
          H.store.commit(function (s) { s.privacy.topics.push({ id: U.uid('tp'), label: text, hint: 'Added by you', on: true, hits: 0, custom: true }); });
          ui.toast('Halo will keep “' + text + '” private', { icon: 'lock' });
          return;
        }
        var other = list === 'phrases' ? 'avoid' : 'phrases', v = voice();
        if (v[list].some(function (p) { return p.toLowerCase() === text.toLowerCase(); })) { ui.toast('“' + text + '” is already on the list', { icon: 'info' }); H.render(); return; }
        H.store.commit(function (s) { s.voice[list].push(text); s.voice[other] = s.voice[other].filter(function (p) { return p.toLowerCase() !== text.toLowerCase(); }); });
        ui.toast(list === 'phrases' ? 'Halo will use “' + text + '” when it fits' : 'Halo won’t write “' + text + '”', { icon: 'fingerprint' });
      },
      'prv-rm': function (el) {
        var list = el.dataset.list, val = el.dataset.v, snap = H.store.snapshot();
        H.store.commit(function (s) { s.voice[list] = s.voice[list].filter(function (p) { return p !== val; }); });
        ui.toast('Removed “' + val + '”', { icon: 'x', undo: function () { H.store.restore(snap); } });
      },
      'prv-learn': function (el) {
        var id = el.dataset.id, on = !H.store.state.sources[id].useVoice, nm = H.brands[id].name;
        H.act.setSource(id, { useVoice: on }, on ? 'Halo will learn your voice from ' + nm : 'Halo won’t learn from ' + nm + ' anymore');
      },
      'prv-train': function () {
        if (view.training || !samples()) return;
        view.training = true; H.render();
        setTimeout(function () {
          view.training = false;
          var n = samples(), again = !voice().fingerprint;
          H.store.commit(function (s) { s.voice.fingerprint = nextId((s.voice.fingerprint || 'VF') + ':' + n + ':' + Date.now()); s.voice.trained = 0; });
          ui.toast((again ? 'Voice model trained on ' : 'Voice model retrained on ') + U.plural(n, 'sample'), { icon: 'fingerprint' });
        }, 1500);
      },
      'prv-delete-voice': function () {
        ui.open('confirm', { title: 'Delete your voice model?', body: 'Halo will write in a neutral voice until you train it again. Your tone settings, phrases and samples stay, so retraining takes about a minute.', ok: 'Delete voice model', danger: true, run: 'prv-delete-voice-go' });
      },
      'prv-delete-voice-go': function () {
        ui.close(true); var snap = H.store.snapshot();
        H.store.commit(function (s) { s.voice.fingerprint = null; s.voice.trained = null; });
        ui.toast('Voice model deleted', { icon: 'trash', undo: function () { H.store.restore(snap); } });
      },
      'prv-topic': function (el) {
        var id = el.dataset.id, t = H.store.state.privacy.topics.filter(function (x) { return x.id === id; })[0]; if (!t) return;
        var on = !t.on, snap = H.store.snapshot();
        H.store.commit(function (s) { s.privacy.topics.forEach(function (x) { if (x.id === id) x.on = on; }); });
        ui.toast(on ? 'Halo will keep “' + t.label + '” private' : '“' + t.label + '” is no longer private. Drafts that mention it still wait for you.', { icon: on ? 'lock' : 'unlock', undo: function () { H.store.restore(snap); } });
      },
      'prv-topic-rm': function (el) {
        var id = el.dataset.id, t = H.store.state.privacy.topics.filter(function (x) { return x.id === id; })[0]; if (!t) return;
        var snap = H.store.snapshot();
        H.store.commit(function (s) { s.privacy.topics = s.privacy.topics.filter(function (x) { return x.id !== id; }); });
        ui.toast('Removed “' + t.label + '”', { icon: 'trash', undo: function () { H.store.restore(snap); } });
      },
      'prv-never': function (el) {
        var k = el.dataset.k, on = !never()[k], rule = NEVER.filter(function (n) { return n.k === k; })[0], snap = H.store.snapshot();
        H.store.commit(function (s) { var n = never(); n[k] = on; s.privacy.never = n; });
        ui.toast(on ? 'Halo will never share ' + lower(rule.label) : rule.label + ' can appear in drafts again. You still decide what’s shared.', { icon: on ? 'lock' : 'unlock', undo: function () { H.store.restore(snap); } });
      },
      'prv-lvl': function (el) {
        var row = el.dataset.row, col = el.dataset.col, cur = level(row, col);
        ui.menu(el, [{ label: { team: 'Your team sees', manager: 'Your manager sees', exec: 'Leadership sees' }[col] }].concat(LEVELS.map(function (l) {
          return { lead: lvlGlyph(l.v), text: l.label, action: 'prv-lvl-set', attrs: { 'data-row': row, 'data-col': col, 'data-v': l.v }, checked: cur === l.v };
        })), { width: 200 });
      },
      'prv-lvl-set': function (el) {
        var row = el.dataset.row, col = el.dataset.col, v = el.dataset.v, r = ROWS.filter(function (x) { return x.k === row; })[0];
        if (!r || r.locked || level(row, col) === v) return;
        var snap = H.store.snapshot(), who = { team: 'Your team', manager: 'Your manager', exec: 'Leadership' }[col], what = lower(r.label);
        H.store.commit(function (s) { s.privacy.matrix[row] = Object.assign({}, s.privacy.matrix[row]); s.privacy.matrix[row][col] = v; });
        ui.toast(v === 'hidden' ? who + ' won’t see ' + what : v === 'summary' ? who + ' sees a summary of ' + what : who + ' sees full ' + what, { icon: 'eye', undo: function () { H.store.restore(snap); } });
      },
      'prv-pause': function () { H.act.pause(!H.store.state.privacy.paused); },
      'prv-retention': function (el) {
        var v = +el.value; if (v === +H.store.state.privacy.retention) return;
        H.store.commit(function (s) { s.privacy.retention = v; });
        ui.toast('Raw items are now kept for ' + (v >= 365 ? '1 year' : v + ' days'), { icon: 'clock' });
      },
      'prv-delete-all': function () { view.typed = ''; ui.open('privacy-delete'); }
    }
  };

  /* ---------- Overlays ---------- */
  function listBlock(items) { return '<ul class="prv-inc">' + items.map(function (x) { return '<li>' + H.icon(x[0], 16) + '<span>' + x[1] + '</span></li>'; }).join('') + '</ul>'; }
  H.overlays['privacy-voice-export'] = {
    kind: 'modal', title: 'Export your voice model',
    render: function () {
      var v = voice(), n = samples(), tone = v.tone;
      return '<div class="modal-hd"><div class="grow"><h2>Export your voice model</h2><p>A copy of what Halo learned about how you write. Exporting doesn’t change or share anything.</p></div>' + ui.iconBtn('x', 'Close', 'close') + '</div>' +
        '<div class="modal-bd">' + listBlock([
          ['fingerprint', 'Fingerprint <span class="mono">' + esc(v.fingerprint || 'none') + '</span> and when it was trained'],
          ['sliders', 'Tone settings: ' + esc([TONE[0].steps[bucket(tone.length)], TONE[1].steps[bucket(tone.formality)], TONE[2].steps[bucket(tone.technical)]].join(', ').toLowerCase())],
          ['quote', U.plural(v.phrases.length, 'phrase') + ' you use and ' + v.avoid.length + ' you avoid'],
          ['file-text', U.plural(n, 'approved sample') + ', grouped by source'],
          ['book', 'A plain-language summary of what Halo learned']
        ]) + '<div class="banner mt-4">' + H.icon('archive', 16) + '<span>You’ll get a .zip with JSON and plain-text files. Halo prepares it in the background and lets you know here when it’s ready.</span></div></div>' +
        '<div class="modal-ft">' + ui.btn('Cancel', { action: 'close' }) + ui.btn('Prepare export', { kind: 'primary', icon: 'download', action: 'prv-export-go' }) + '</div>';
    },
    actions: { 'prv-export-go': function () { ui.close(); ui.toast('Your export will be ready in a few minutes', { icon: 'download' }); } }
  };
  H.overlays['privacy-export'] = {
    kind: 'modal', title: 'Export all data',
    render: function () {
      var days = H.store.state.privacy.retention;
      return '<div class="modal-hd"><div class="grow"><h2>Export all your Halo data</h2><p>Everything Halo keeps about you, in files you can open anywhere.</p></div>' + ui.iconBtn('x', 'Close', 'close') + '</div>' +
        '<div class="modal-bd">' + listBlock([
          ['history', 'Updates you shared, with their sources and audiences'],
          ['digest', 'Digest decisions and the edits you made'],
          ['ticket', 'Tickets you own, with estimates and time logged'],
          ['fingerprint', 'Your voice model, tone settings, phrases and approved samples'],
          ['lock', 'Private topics, sharing rules and the redaction log'],
          ['sources', 'Source connections, and raw items from the last ' + (days >= 365 ? 'year' : days + ' days')]
        ]) + '<div class="banner mt-4">' + H.icon('archive', 16) + '<span>You’ll get a .zip with JSON and CSV files. The download link works for 7 days.</span></div></div>' +
        '<div class="modal-ft">' + ui.btn('Cancel', { action: 'close' }) + ui.btn('Prepare export', { kind: 'primary', icon: 'download', action: 'prv-export-all-go' }) + '</div>';
    },
    actions: { 'prv-export-all-go': function () { ui.close(); ui.toast('Your export will be ready in a few minutes', { icon: 'download' }); } }
  };
  H.overlays['privacy-delete'] = {
    kind: 'modal', size: 'narrow', title: 'Delete all Halo data',
    render: function () {
      var ok = view.typed.trim().toLowerCase() === 'delete';
      return '<div class="modal-hd"><div class="grow"><h2>Delete all Halo data?</h2><p>This permanently deletes everything Halo keeps about you: shared updates, drafts, decisions, your voice model and samples, private topics and source connections. It can’t be undone.</p></div></div>' +
        '<div class="modal-bd"><div class="field"><label for="prv-typed">Type <span class="mono prv-typed-word">delete</span> to confirm</label>' +
          '<input id="prv-typed" class="input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" autofocus value="' + esc(view.typed) + '" data-input="prv-typed" data-enter="prv-delete-go"></div></div>' +
        '<div class="modal-ft">' + ui.btn('Cancel', { action: 'close' }) + ui.btn('Delete everything', { kind: 'danger-solid', action: 'prv-delete-go', disabled: !ok }) + '</div>';
    },
    actions: {
      'prv-typed': function (el) { view.typed = el.value; H.render(); },
      'prv-delete-go': function () {
        if (view.typed.trim().toLowerCase() !== 'delete') return;
        view.typed = ''; ui.close(true);
        H.store.reset(true);
        ui.toast('All your Halo data was deleted. The demo workspace was restored.', { icon: 'trash' });
      }
    }
  };
  H.overlays['privacy-preview'] = {
    kind: 'modal', size: 'wide', title: 'Preview as Rosa',
    render: function () {
      var rosa = q.person('rosa'), me = q.me(), lv = function (k) { return level(k, 'manager'); }, blocks = [], hidden = [];
      var mine = q.myTickets(), weekAgo = H.slot(-7, '00:00');
      var active = mine.filter(function (t) { return t.status === 'progress' || t.status === 'review'; });
      var shipped = mine.filter(function (t) { return t.status === 'done' && t.done != null && t.done > weekAgo; });
      function block(k, title, body) { var l = lv(k); if (l === 'hidden') { hidden.push(title); return; } blocks.push('<div class="prv-rv-block"><div class="prv-rv-hd"><span class="eyebrow">' + title + '</span>' + lvlGlyph(l) + '<span class="t-caption c-3">' + (l === 'full' ? 'Full' : 'Summary') + '</span></div>' + body(l) + '</div>'); }
      block('progress', 'Ticket progress', function (l) {
        if (l === 'summary') return '<p class="prv-rv-text">' + active.length + ' tickets moving and ' + shipped.length + ' shipped this week, mostly Checkout v3.</p>';
        return '<div class="prv-rv-list">' + active.concat(shipped).map(function (t) {
          var p = q.progress(t);
          return '<div class="prv-rv-tk">' + ui.status(t.status, false) + '<span class="key">' + t.key + '</span><span class="truncate grow">' + esc(t.title) + '</span><span class="t-caption c-3 nowrap num">' + (t.status === 'progress' ? Math.round(p * 100) + '%' : ui.statusLabel(t.status)) + '</span></div>';
        }).join('') + '</div>';
      });
      block('time', 'Time spent', function (l) {
        var hrs = active.reduce(function (a, t) { return a + (t.logged || 0); }, 0);
        if (l === 'summary') return '<p class="prv-rv-text">About ' + F.hours(hrs) + ' logged on active work, mostly Checkout v3.</p>';
        return '<p class="prv-rv-text">' + active.slice().sort(function (a, b) { return (b.logged || 0) - (a.logged || 0); }).map(function (t) { return t.key + ' · ' + F.hours(t.logged || 0); }).join('<span class="c-3">,&nbsp; </span>') + '</p>';
      });
      block('meetings', 'Meeting notes', function (l) {
        if (l === 'summary') return '<p class="prv-rv-text">Two meeting recaps this week, including today’s error-states kickoff.</p>';
        return '<p class="prv-rv-text"><b>Error states kickoff:</b> declined, expired and 3DS failure states come first. Leo owns the error-code map.</p><p class="prv-rv-text mt-2"><b>Wallet placement review:</b> wallet buttons stay above the card form on mobile.</p>';
      });
      block('blockers', 'Blockers', function (l) {
        if (l === 'summary') return '<p class="prv-rv-text">One soft blocker, not urgent yet.</p>';
        return '<p class="prv-rv-text">Waiting on the 3DS error-code list from Leo to finish failure states. Not urgent until Wednesday.</p>';
      });
      hidden.push('Raw activity');
      return '<div class="modal-hd"><div class="grow"><h2>What Rosa sees this week</h2><p>Your manager’s view, built from the rules on this page. Change a rule and this preview changes with it.</p></div>' + ui.iconBtn('x', 'Close', 'close') + '</div>' +
        '<div class="modal-bd"><div class="prv-rv-viewer">' + ui.avatar(rosa, 'sm', { tip: false }) + '<span>Viewing as <b>' + esc(rosa.name) + '</b>, ' + esc(rosa.role) + '</span></div>' +
          '<div class="card prv-rv">' +
            '<div class="prv-rv-top">' + ui.avatar(me, 'lg', { tip: false }) + '<div class="grow"><div class="t-title-3">' + esc(me.name) + '</div><div class="t-callout c-3">' + esc(me.role) + ' · ' + esc(me.team) + '</div></div>' + ui.badge('This week', 'outline') + '</div>' +
            '<p class="prv-rv-status">' + esc(q.statusLine('manager')) + '</p>' +
            (blocks.length ? blocks.join('') : '<p class="prv-rv-text c-3">Rosa sees your status line only. Every detail is hidden.</p>') +
            '<div class="prv-rv-foot"><span class="redacted-chip"><span class="bars"><i></i><i></i></span>Redacted: 1 private topic</span>' +
              '<span class="t-caption c-3">Not shown to Rosa: ' + esc(hidden.join(', ')) + '</span></div>' +
          '</div></div>' +
        '<div class="modal-ft"><span class="hint grow">' + H.icon('lock', 12) + ' Private topics and anything from 1:1s never appear, whatever the rules.</span>' + ui.btn('Done', { kind: 'primary', action: 'close' }) + '</div>';
    }
  };
})(window.H = window.H || {});

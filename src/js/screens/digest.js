/* Digest — the once-a-day gate. Routine updates share themselves; sensitive ones wait here. */
(function (H) {
  'use strict';
  var esc = H.esc, ui = H.ui, q = H.q, F = H.fmt, U = H.util;
  var view = { editing: null, draft: '', busy: false, showAuto: false, showLog: false, focus: null };
  var KIND = { ticket: 'ticket', time: 'clock', standup: 'message', note: 'file-text', link: 'link', progress: 'trending', recap: 'wand', estimate: 'timer', blocker: 'alert', summary: 'manager', private: 'lock' };
  var AUD = { team: 'Team', manager: 'Manager', exec: 'Leadership' };
  var AUD_ICON = { team: 'teammate', manager: 'manager', exec: 'exec' };

  function textHtml(it) {
    var t = esc(it.text);
    if (it.weak && !it.edited) t = t.replace(esc(it.weak), '<span class="weak" data-tip="Halo is ' + Math.round(it.conf * 100) + '% sure about this part. Check it before sharing.">' + esc(it.weak) + '</span>');
    return t;
  }
  function conf(it) {
    var c = Math.round(it.conf * 100), lvl = c >= 90 ? 'high' : c >= 80 ? 'med' : 'low';
    return '<span class="conf conf-' + lvl + '" data-tip="How sure Halo is that this is accurate, based on ' + U.plural(it.sources.length, 'source') + '"><span class="conf-bars"><i></i><i></i><i></i></span>' + c + '%</span>';
  }
  function audMenuBtn(it) {
    return '<button type="button" class="aud-btn" data-action="dg-aud" data-id="' + it.id + '" aria-haspopup="menu">' + H.icon(AUD_ICON[it.audience], 14) + '<span>' + AUD[it.audience] + '</span>' + H.icon('chevron-down', 12) + '</button>';
  }

  function pendingCard(it, i) {
    var editing = view.editing === it.id, focused = (view.focus || (q.pending()[0] || {}).id) === it.id;
    var head = '<div class="dg-head"><span class="dg-kind' + (it.private ? ' private' : '') + '">' + H.icon(KIND[it.kind] || 'file-text', 16) + '</span>' +
      '<div class="grow" style="min-width:0"><div class="dg-title">' + esc(it.title) + '</div><div class="meta"><span>' + F.rel(H.at(it.t)) + '</span>' + (it.ticket ? '<span class="sep"></span><a class="key" href="#/tickets/' + it.ticket + '" data-nav="#/tickets/' + it.ticket + '">' + it.ticket + '</a>' : '') + (it.manual ? '<span class="sep"></span><span>Written by you</span>' : '') + '</div></div>' +
      '<div class="row gap-2 none">' + (it.private ? '' : conf(it)) + '<span class="c-3 t-caption hide-phone">To</span>' + audMenuBtn(it) + '</div></div>';
    var reason = it.reason ? '<div class="dg-reason' + (it.private ? ' private' : '') + '">' + H.icon(it.private ? 'lock' : 'info', 14) + '<span>' + esc(it.reason) + (it.private ? '. Halo recommends keeping this private.' : '') + '</span></div>' : '';
    var body = editing
      ? '<div class="dg-edit"><textarea class="textarea" id="dg-ta" rows="3" data-input="dg-draft" data-mod-enter="dg-save" aria-label="Edit update">' + esc(view.draft) + '</textarea>' +
        '<div class="row gap-2 mt-2">' + ui.btn('Polish in my voice', { kind: 'ghost', size: 'sm', icon: 'sparkle', action: 'dg-polish', cls: view.busy ? 'is-loading' : '' }) + '<span class="grow"></span>' + ui.btn('Cancel', { size: 'sm', action: 'dg-cancel' }) + ui.btn('Save', { kind: 'primary', size: 'sm', action: 'dg-save' }) + '</div></div>'
      : '<div class="text-block dg-text">' + textHtml(it) + '</div>';
    var srcs = '<div class="row gap-2 wrap">' + it.sources.map(function (s) { return ui.src(s[0], s[1]); }).join('') + (it.edited ? ui.badge('Edited', '', 'edit') : '') + '</div>';
    var actions = it.private
      ? '<div class="dg-actions">' + ui.btn('Keep private', { kind: 'primary', size: 'sm', icon: 'lock', action: 'dg-decide', attrs: { 'data-id': it.id, 'data-s': 'discarded' } }) + ui.btn('Share anyway', { kind: 'ghost', size: 'sm', action: 'dg-decide', attrs: { 'data-id': it.id, 'data-s': 'approved' } }) + '</div>'
      : '<div class="dg-actions">' + ui.btn('Approve', { kind: 'primary', size: 'sm', icon: 'check', action: 'dg-decide', attrs: { 'data-id': it.id, 'data-s': 'approved', 'data-kbd': focused ? 'A' : null, 'data-tip': focused ? 'Approve' : null } }) +
        ui.btn('Edit', { size: 'sm', icon: 'edit', action: 'dg-edit', attrs: { 'data-id': it.id } }) +
        ui.btn('Hold', { size: 'sm', icon: 'clock', action: 'dg-decide', attrs: { 'data-id': it.id, 'data-s': 'held', 'data-tip': 'Hold for tomorrow’s digest' } }) +
        '<span class="grow"></span>' + ui.btn('Don’t share', { kind: 'ghost', size: 'sm', action: 'dg-decide', attrs: { 'data-id': it.id, 'data-s': 'discarded' } }) + '</div>';
    return '<article class="card dg-card' + (focused ? ' is-focus' : '') + (it.private ? ' is-private' : '') + ' rise rise-' + Math.min(i + 1, 5) + '" data-key="dg-' + it.id + '" data-action="dg-focus" data-id="' + it.id + '">' + head + reason + body + '<div class="dg-foot">' + srcs + actions + '</div></article>';
  }

  function compactRow(it, kind) {
    var label = { auto: 'Shared automatically', approved: 'You approved', held: 'Held for tomorrow', discarded: 'Not shared', dropped: 'Dropped: private topic' }[it.status];
    var badgeKind = { auto: 'success', approved: 'success', held: 'warning', discarded: '', dropped: '' }[it.status];
    var undo = it.status === 'auto' ? ui.btn('Retract', { kind: 'ghost', size: 'xs', action: 'dg-retract', attrs: { 'data-id': it.id } })
      : ui.btn('Undo', { kind: 'ghost', size: 'xs', action: 'dg-undo', attrs: { 'data-id': it.id } });
    return '<div class="dg-row" data-key="row-' + it.id + '"><span class="dg-row-ic ' + it.status + '">' + H.icon(it.status === 'auto' || it.status === 'approved' ? 'check' : it.status === 'held' ? 'clock' : it.status === 'dropped' ? 'lock' : 'ban', 14) + '</span>' +
      '<div class="grow" style="min-width:0"><div class="dg-row-text' + (it.status === 'discarded' || it.status === 'dropped' ? ' muted' : '') + '">' + esc(it.status === 'dropped' ? 'Private: ' + it.title : it.text) + '</div>' +
      '<div class="meta"><span>' + ui.badge(label, badgeKind) + '</span><span class="sep"></span><span>' + H.icon(AUD_ICON[it.audience], 12) + ' ' + AUD[it.audience] + '</span><span class="sep"></span><span>' + F.rel(H.at(it.decidedAt != null ? it.decidedAt : it.t)) + '</span></div></div>' +
      '<div class="none">' + (it.status === 'dropped' ? '' : undo) + '</div></div>';
  }

  function activityLog(items) {
    var rows = [];
    items.forEach(function (it) {
      var t = it.decidedAt != null ? it.decidedAt : it.t;
      if (it.status === 'auto' || it.status === 'approved') rows.push({ t: t, icon: 'broadcast', text: 'Shared “' + it.title + '” with ' + AUD[it.audience].toLowerCase(), it: it, act: 'correct' });
      if (it.status === 'dropped') rows.push({ t: t, icon: 'lock', text: 'Dropped “' + it.title + '”. It matched a private topic, so it never left your Halo', it: it, cls: 'accent' });
      if (it.status === 'held') rows.push({ t: t, icon: 'clock', text: 'Held “' + it.title + '” for tomorrow', it: it });
      rows.push({ t: it.t - 1, icon: 'wand', text: 'Drafted “' + it.title + '” (' + Math.round(it.conf * 100) + '% confident)', it: it });
      rows.push({ t: it.t - 4, icon: 'eye', text: 'Noticed ' + it.sources.map(function (s) { return (H.brands[s[0]] || { name: s[0] }).name + ': ' + s[1]; }).join(', '), it: it, src: it.sources[0][0] });
    });
    rows.sort(function (a, b) { return b.t - a.t; });
    return '<div class="log">' + rows.slice(0, 24).map(function (r) {
      return '<div class="log-row' + (r.cls ? ' ' + r.cls : '') + '"><span class="log-time num">' + F.clock(H.at(r.t)) + '</span><span class="log-dot">' + (r.src ? H.brandMark(r.src, 14) : H.icon(r.icon, 13)) + '</span><span class="grow log-text">' + esc(r.text) + '</span>' +
        (r.act === 'correct' ? '<span class="log-act">' + ui.btn('Correct', { kind: 'ghost', size: 'xs', action: 'dg-correct', attrs: { 'data-id': r.it.id } }) + ui.btn('Retract', { kind: 'ghost', size: 'xs', action: 'dg-retract', attrs: { 'data-id': r.it.id } }) + '</span>' : '') + '</div>';
    }).join('') + '</div>';
  }

  H.screens.digest = {
    title: 'Digest', crumbs: function () { return [{ label: 'Digest' }]; }, pageClass: 'narrow digest-page',
    render: function () {
      var items = q.digest(), mode = q.mode(), paused = H.store.state.privacy.paused;
      var pend = items.filter(function (i) { return i.status === 'pending'; });
      var auto = items.filter(function (i) { return i.status === 'auto'; });
      var decided = items.filter(function (i) { return ['approved', 'held', 'discarded', 'dropped'].indexOf(i.status) >= 0; }).sort(function (a, b) { return (b.decidedAt || 0) - (a.decidedAt || 0); });
      var closes = H.at(H.store.state.digest.closesAt);
      var lede = paused ? 'Halo is paused, so nothing new is being drafted.' :
        mode === 'curated' ? 'Curated mode: every update waits for you. Nothing is shared until you approve it.' :
        mode === 'balanced' ? 'Routine updates were shared automatically. The ones below touch dates, people or low-confidence claims, so they wait for you.' :
        'Ambient mode: Halo shared as it went. Everything it did is in the activity log, and you can correct any of it.';
      var html = '<header class="page-hd"><div class="grow"><h1>Digest</h1><p class="lede">' + lede + '</p></div></header>' +
        '<div class="dg-summary card">' +
          '<div class="dg-stat"><span class="stat-num">' + pend.length + '</span><span class="stat-label">Need you</span></div><span class="vdivider"></span>' +
          '<div class="dg-stat"><span class="stat-num">' + auto.length + '</span><span class="stat-label">Shared automatically</span></div><span class="vdivider"></span>' +
          '<div class="dg-stat"><span class="stat-num">' + decided.length + '</span><span class="stat-label">Decided</span></div>' +
          '<div class="dg-mode">' + ui.seg('mode', H.shell.MODES.map(function (m) { return { v: m.v, label: m.label, tip: m.note }; }), mode, { action: 'set-mode', size: 'sm', label: 'Trust mode' }) +
          '<span class="t-caption c-3 row gap-1">' + H.icon('clock', 12) + 'Closes ' + F.time(closes) + '</span></div></div>';

      if (pend.length) {
        var routine = pend.filter(function (i) { return !i.private; }).length;
        html += '<section class="section"><div class="section-hd"><h2>Needs you</h2><span class="count-pill">' + pend.length + '</span><div class="actions">' +
          (routine > 1 ? ui.btn('Approve all ' + routine, { size: 'sm', icon: 'check', action: 'dg-all', attrs: { 'data-tip': 'Private items are never included', 'data-kbd': 'shift A' } }) : '') + '</div></div>' +
          '<div class="col gap-3">' + pend.map(pendingCard).join('') + '</div></section>';
      } else {
        html += '<section class="section"><div class="card dg-done">' + '<div class="dg-done-art">' + H.shell.dial(mode === 'curated' ? 0 : mode === 'balanced' ? 1 : 2, 64) + H.icon('check', 24) + '</div>' +
          '<h2 class="t-title-2 mt-4">You’re done for today</h2><p class="t-body c-3 mt-2">' + (auto.length ? U.plural(auto.length, 'update was', 'updates were') + ' shared automatically' : 'Nothing was shared automatically') + (decided.length ? ' and you decided ' + decided.length + '.' : '.') + ' Your next digest arrives tomorrow at ' + F.time(closes) + '.</p>' +
          '<div class="row gap-2 mt-5" style="justify-content:center">' + ui.btn('See what was shared', { action: 'nav', attrs: { 'data-to': '#/history' } }) + ui.btn('Back to Home', { kind: 'primary', action: 'nav', attrs: { 'data-to': '#/home' } }) + '</div></div></section>';
      }

      if (mode === 'ambient') {
        html += '<section class="section"><div class="section-hd"><h2>Activity log</h2><span class="sub">Everything Halo did today, newest first</span><div class="actions">' + ui.badge('Live', 'success', 'dot') + '</div></div><div class="card" style="padding:6px 8px">' + activityLog(items) + '</div></section>';
      } else if (auto.length) {
        var shown = view.showAuto ? auto : auto.slice(0, 3);
        html += '<section class="section"><div class="section-hd"><h2>Shared automatically</h2><span class="sub">' + auto.length + ' today</span><div class="actions">' + ui.btn(view.showLog ? 'Hide activity log' : 'Activity log', { kind: 'ghost', size: 'sm', icon: 'history', action: 'dg-log' }) + '</div></div>' +
          '<div class="card dg-list">' + shown.map(function (i) { return compactRow(i); }).join('') +
          (auto.length > 3 ? '<button type="button" class="dg-more" data-action="dg-more">' + (view.showAuto ? 'Show less' : 'Show all ' + auto.length) + H.icon(view.showAuto ? 'chevron-up' : 'chevron-down', 14) + '</button>' : '') + '</div>' +
          (view.showLog ? '<div class="card mt-3" style="padding:6px 8px">' + activityLog(items) + '</div>' : '') + '</section>';
      }
      if (decided.length) {
        html += '<section class="section"><div class="section-hd"><h2>Decided today</h2><span class="sub">' + decided.length + '</span></div><div class="card dg-list">' + decided.map(function (i) { return compactRow(i); }).join('') + '</div></section>';
      }
      html += '<p class="t-caption c-3 mt-8" style="text-align:center">' + H.icon('lock', 12) + ' Private topics never reach a draft. Every shared update lists its sources.</p>';
      return html;
    },
    after: function () {
      if (view.editing) { var ta = document.getElementById('dg-ta'); if (ta && document.activeElement !== ta && !ta.dataset.focused) { ta.dataset.focused = '1'; ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); } }
    },
    keys: {
      a: function () { var f = currentFocus(); if (f && !f.private) H.act.decide(f.id, 'approved'); },
      A: function () { H.act.approveAll(); },
      h: function () { var f = currentFocus(); if (f && !f.private) H.act.decide(f.id, 'held'); },
      e: function () { var f = currentFocus(); if (f) startEdit(f.id); },
      j: function () { moveFocus(1); }, k: function () { moveFocus(-1); }
    },
    actions: {
      'dg-decide': function (el) { view.editing = null; H.act.decide(el.dataset.id, el.dataset.s); },
      'dg-all': function () { H.act.approveAll(); },
      'dg-focus': function (el, e) { if (e && e.target.closest('button, a, textarea')) return; view.focus = el.dataset.id; H.render(); },
      'dg-edit': function (el) { startEdit(el.dataset.id); },
      'dg-draft': function (el) { view.draft = el.value; },
      'dg-cancel': function () { view.editing = null; H.render(); },
      'dg-save': function () { var id = view.editing; if (!id) return; H.act.editDigest(id, view.draft.trim()); view.editing = null; H.ui.toast('Draft updated', { icon: 'edit' }); },
      'dg-polish': function () {
        var it = q.digest().filter(function (x) { return x.id === view.editing; })[0]; if (!it) return;
        view.busy = true; H.render();
        H.ai.rewrite(view.draft, it.audience).then(function (t) { view.draft = t; view.busy = false; var ta = document.getElementById('dg-ta'); if (ta) ta.value = t; H.render(); }, function () { view.busy = false; H.render(); });
      },
      'dg-aud': function (el) {
        var id = el.dataset.id, it = q.digest().filter(function (x) { return x.id === id; })[0];
        H.ui.menu(el, [{ label: 'Who sees this' }].concat(['team', 'manager', 'exec'].map(function (a) {
          return { icon: AUD_ICON[a], text: { team: 'Your team', manager: 'Your manager', exec: 'Leadership' }[a], action: 'dg-aud-set', attrs: { 'data-id': id, 'data-v': a }, checked: it.audience === a };
        })), { align: 'end', width: 220 });
      },
      'dg-aud-set': function (el) { H.act.editDigest(el.dataset.id, null, el.dataset.v); H.ui.toast('Audience changed. Halo will rewrite it for them.', { icon: AUD_ICON[el.dataset.v] }); },
      'dg-undo': function (el) { var snap = H.store.snapshot(); H.store.commit(function (s) { delete s.digest.decisions[el.dataset.id]; }); H.ui.toast('Moved back', { icon: 'undo', undo: function () { H.store.restore(snap); } }); },
      'dg-retract': function (el) { H.act.retract(el.dataset.id); },
      'dg-correct': function (el) { var id = el.dataset.id; H.store.commit(function (s) { s.digest.decisions[id] = Object.assign({}, s.digest.decisions[id] || {}, { status: 'pending', t: 0 }); }); startEdit(id); },
      'dg-more': function () { view.showAuto = !view.showAuto; H.render(); },
      'dg-log': function () { view.showLog = !view.showLog; H.render(); }
    }
  };
  function currentFocus() { var p = q.pending(); return p.filter(function (x) { return x.id === view.focus; })[0] || p[0]; }
  function moveFocus(d) { var p = q.pending(), i = p.indexOf(currentFocus()); var n = p[Math.max(0, Math.min(p.length - 1, i + d))]; if (n) { view.focus = n.id; H.render(); var el = document.querySelector('[data-key="dg-' + n.id + '"]'); if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } }
  function startEdit(id) { var it = q.digest().filter(function (x) { return x.id === id; })[0]; if (!it) return; view.editing = id; view.focus = id; view.draft = it.text; H.render(); }
})(window.H = window.H || {});

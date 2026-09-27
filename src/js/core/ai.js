/* Live AI with a safe provider chain. No API key ever ships in this file.
   1. proxy  — window.HALO_CONFIG.proxyUrl (a server that holds the key, see /worker)
   2. key    — a key the visitor pastes in Settings; stays in this browser only
   3. claude — the Claude "sample" capability when Halo runs as a Claude artifact
   4. demo   — scripted answers built from the workspace, so every flow still works offline */
(function (H) {
  'use strict';
  var ai = H.ai = {}, U = H.util;
  var KEY_STORE = 'halo.ai.key';
  var MODELS = [
    { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5', note: 'Fastest. Great for updates and quick answers.' },
    { id: 'claude-sonnet-5', label: 'Claude Sonnet 5', note: 'Deeper reasoning for summaries and planning.' }
  ];
  ai.MODELS = MODELS;
  var sampleFn = null, sampleState = 'unknown';

  ai.init = function () {
    try {
      if (window.claude && typeof window.claude.use === 'function') {
        window.claude.use('sample').then(function (fn) { sampleFn = fn || null; sampleState = fn ? 'ready' : 'absent'; H.render(); }, function () { sampleState = 'absent'; });
      } else sampleState = 'absent';
    } catch (e) { sampleState = 'absent'; }
  };
  ai.key = function () { return H.storage.get(KEY_STORE, '') || ''; };
  ai.setKey = function (k) { if (k) H.storage.set(KEY_STORE, k.trim()); else H.storage.del(KEY_STORE); H.render(); };
  ai.proxy = function () { var c = window.HALO_CONFIG || {}; return c.proxyUrl || ''; };
  ai.provider = function () {
    if (ai.proxy()) return 'proxy';
    if (sampleFn) return 'claude';        // inside Claude, the viewer's own account comes first
    if (ai.key()) return 'key';
    return 'demo';
  };
  ai.model = function () { return (H.store && H.store.state.prefs.ai && H.store.state.prefs.ai.model) || MODELS[0].id; };
  ai.status = function () {
    var p = ai.provider(), m = MODELS.filter(function (x) { return x.id === ai.model(); })[0] || MODELS[0];
    return {
      provider: p, live: p !== 'demo',
      label: { proxy: 'Live · ' + m.label, key: 'Live · ' + m.label + ' (your key)', claude: 'Live · Claude', demo: 'Demo answers' }[p],
      detail: { proxy: 'Requests go through Halo’s server, which holds the key.', key: 'Requests go straight from this browser to Anthropic with the key you added.', claude: 'Running inside Claude, on your own Claude account.', demo: 'Halo is answering from its built-in playbook. Add a key in Settings for live answers.' }[p]
    };
  };

  /* ---------- Workspace context (what Halo knows) ---------- */
  ai.context = function (opts) {
    opts = opts || {};
    var s = H.store.state, q = H.q, me = q.me(), lines = [];
    lines.push('Person: ' + me.name + ', ' + me.role + ' on the ' + me.team + ' team at Brightwater (invoicing and payments software for small businesses). Manager: Rosa Delgado (Design Director). Exec: Ethan Brooks (VP Product).');
    lines.push('Today: ' + H.fmt.dateLong(H.now()) + ', ' + H.fmt.time(H.now()) + '. Trust mode: ' + s.prefs.mode + '.');
    lines.push('\nTickets owned:');
    q.myTickets().forEach(function (t) {
      var e = q.estimate(t);
      lines.push('- ' + t.key + ' "' + t.title + '" status=' + t.status + ' priority=' + t.prio + ' progress=' + Math.round(q.progress(t) * 100) + '% estimate=' + H.fmt.hours(e.mean) + ' logged=' + H.fmt.hours(t.logged || 0) + (t.due != null ? ' due=' + H.fmt.day(H.at(t.due)) : '') +
        (t.subtasks.length ? ' subtasks: ' + t.subtasks.map(function (x) { return (x.done ? '[x] ' : '[ ] ') + x.title; }).join('; ') : ''));
    });
    lines.push('\nPublished updates (newest first, these are safe to share):');
    q.published().slice(0, 12).forEach(function (h) { lines.push('- [' + h.audience + ', ' + H.fmt.rel(H.at(h.t)) + '] ' + h.text); });
    if (!opts.publishedOnly) {
      lines.push('\nWaiting for approval (NOT shared yet; only discuss with the owner, never with others):');
      q.pending().filter(function (i) { return !i.private; }).forEach(function (i) { lines.push('- ' + i.text); });
      lines.push('\nCalendar today:');
      q.eventsOn(H.now()).forEach(function (e) { lines.push('- ' + H.fmt.time(H.at(e.start)) + ' ' + e.title + (e.private ? ' (private)' : '')); });
    }
    lines.push('\nTeammates’ published statuses:');
    Object.keys(s.team).forEach(function (id) { lines.push('- ' + H.PEOPLE[id].name + ' (' + H.PEOPLE[id].role + '): ' + s.team[id].status); });
    lines.push('\nPrivate topics that must never be mentioned: ' + s.privacy.topics.filter(function (t) { return t.on; }).map(function (t) { return t.label; }).join(', ') + '.');
    return lines.join('\n');
  };
  ai.voice = function () {
    var v = H.store.state.voice;
    return 'Voice: ' + (v.tone.length < 40 ? 'concise' : v.tone.length > 65 ? 'detailed' : 'medium length') + ', ' + (v.tone.formality < 40 ? 'warm and casual-professional' : v.tone.formality > 65 ? 'formal' : 'neutral') + ', ' + (v.tone.technical > 60 ? 'comfortable with technical detail' : 'plain language') +
      '. Uses phrases like ' + v.phrases.map(function (p) { return '"' + p + '"'; }).join(', ') + '. Never uses ' + v.avoid.map(function (p) { return '"' + p + '"'; }).join(', ') + '. First person. No emojis.';
  };
  var AUD = {
    team: 'a teammate: specific and practical, ticket keys and next steps are welcome',
    manager: 'their manager: outcomes, dates and risks, no low-level detail',
    exec: 'an executive: one or two sentences, business outcome and whether it is on track'
  };
  ai.audienceNote = function (a) { return AUD[a] || AUD.team; };

  /* ---------- Transport ---------- */
  function sse(res, onText) {
    if (!res.ok) return res.text().then(function (t) { var msg = t; try { msg = JSON.parse(t).error.message; } catch (e) { /* raw */ } throw { code: 'http_' + res.status, message: msg || ('HTTP ' + res.status) }; });
    if (!res.body || !res.body.getReader) return res.json().then(function (j) { var t = (j.content || []).map(function (c) { return c.text || ''; }).join(''); onText && onText(t); return t; });
    var reader = res.body.getReader(), dec = new TextDecoder(), buf = '', text = '';
    function pump() {
      return reader.read().then(function (r) {
        if (r.done) return text;
        buf += dec.decode(r.value, { stream: true });
        var lines = buf.split('\n'); buf = lines.pop();
        lines.forEach(function (l) {
          if (l.indexOf('data:') !== 0) return;
          var d = l.slice(5).trim(); if (!d || d === '[DONE]') return;
          try {
            var ev = JSON.parse(d);
            if (ev.type === 'content_block_delta' && ev.delta && ev.delta.text) { text += ev.delta.text; onText && onText(text); }
            if (ev.type === 'error') throw { code: 'upstream', message: ev.error && ev.error.message };
          } catch (e) { if (e && e.code) throw e; }
        });
        return pump();
      });
    }
    return pump();
  }
  function callAnthropic(url, headers, body, onText, signal) {
    return fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(body), signal: signal }).then(function (res) { return sse(res, onText); });
  }
  // o: { system, messages:[{role,content}], maxTokens, onText, signal, tier }
  ai.stream = function (o) {
    var p = ai.provider(), body = { model: ai.model(), max_tokens: o.maxTokens || 600, system: o.system, messages: o.messages, stream: true };
    if (p === 'proxy') return callAnthropic(ai.proxy(), { 'content-type': 'application/json' }, body, o.onText, o.signal);
    if (p === 'key') return callAnthropic('https://api.anthropic.com/v1/messages', {
      'content-type': 'application/json', 'x-api-key': ai.key(), 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true'
    }, body, o.onText, o.signal);
    if (p === 'claude') {
      var turns = [{ role: 'user', content: (o.system ? o.system + '\n\n' : '') + o.messages[0].content }].concat(o.messages.slice(1));
      return sampleFn(turns, { onText: function (u) { o.onText && o.onText(u.text); }, signal: o.signal, modelTier: o.tier || 'quick' }).then(function (r) { return r.text; }, function (e) {
        if (e && /not_granted|sampling_disabled|not_declared|capability/.test(e.code || '')) { sampleFn = null; H.render(); }
        throw e;
      });
    }
    return Promise.reject({ code: 'demo' });
  };
  // Streams scripted text so demo answers feel the same as live ones.
  ai.fake = function (text, onText, signal) {
    return new Promise(function (resolve, reject) {
      var words = text.split(/(\s+)/), i = 0, out = '';
      (function step() {
        if (signal && signal.aborted) return reject({ code: 'cancelled', text: out });
        if (i >= words.length) return resolve(text);
        out += words.slice(i, i + 3).join(''); i += 3; onText && onText(out);
        setTimeout(step, 18 + Math.random() * 26);
      })();
    });
  };
  // Try live, fall back to scripted on any failure other than a cancel.
  ai.run = function (o, demoText) {
    if (ai.provider() === 'demo') return new Promise(function (r) { setTimeout(r, 380); }).then(function () { return ai.fake(demoText(), o.onText, o.signal); }).then(function (t) { return { text: t, live: false }; });
    return ai.stream(o).then(function (t) { return { text: t, live: true }; }, function (e) {
      if (e && (e.code === 'cancelled' || e.name === 'AbortError')) throw { code: 'cancelled' };
      console.warn('Live AI unavailable, using demo answer:', e && (e.message || e.code));
      ai.lastError = (e && (e.message || e.code)) || 'Unavailable';
      return ai.fake(demoText(), o.onText, o.signal).then(function (t) { return { text: t, live: false, fallback: true }; });
    });
  };

  /* ---------- Features ---------- */
  ai.ask = function (question, audience, history, o) {
    o = o || {};
    var system = 'You are Halo, an AI that represents one individual contributor at work. You speak on their behalf, in their voice, and you are their advocate, never a surveillance tool.\n' +
      'Rules:\n- Answer from the workspace context only. If something is not in it, say you do not know yet and suggest what would tell you.\n' +
      '- Write for ' + ai.audienceNote(audience) + '.\n- ' + ai.voice() + '\n- Keep it short: 2 to 5 sentences, or up to 4 short bullet lines when listing. No headings, no markdown bold.\n' +
      '- Mention ticket keys like CHK-142 when you rely on them.\n- Never mention private topics or anything marked private. Never share items that are waiting for approval with anyone other than the owner.\n' +
      '- You are talking with the owner (' + H.q.me().name + ') unless the question says otherwise.\n\nWorkspace context:\n' + ai.context();
    var msgs = (history || []).slice(-6).concat([{ role: 'user', content: question }]);
    if (msgs[0].role !== 'user') msgs.shift();
    return ai.run({ system: system, messages: msgs, maxTokens: 500, onText: o.onText, signal: o.signal }, function () { return ai.demoAnswer(question, audience); });
  };
  ai.rewrite = function (text, audience) {
    var system = 'Rewrite a short work update so it sounds like its author and suits ' + ai.audienceNote(audience) + '. ' + ai.voice() + ' Keep every fact, add none. Return only the rewritten update, at most 2 sentences.';
    return ai.run({ system: system, messages: [{ role: 'user', content: text }], maxTokens: 200 }, function () { return ai.demoRewrite(text, audience); }).then(function (r) { return r.text.trim().replace(/^"|"$/g, ''); });
  };
  ai.decompose = function (notes, o) {
    o = o || {};
    var system = 'You turn meeting notes into one parent ticket with 4 to 7 subtasks for a product team. Reply with JSON only, no prose: {"title": string, "summary": string, "subtasks": [{"title": string, "owner": "maya"|"sam"|"priya"|"leo"|"hana", "o": number, "m": number, "p": number}]} where o/m/p are best, likely and worst case hours.';
    return ai.run({ system: system, messages: [{ role: 'user', content: notes }], maxTokens: 900, onText: o.onText, tier: 'default' }, function () { return JSON.stringify(ai.demoDecompose()); }).then(function (r) {
      var m = /\{[\s\S]*\}/.exec(r.text); if (!m) throw { code: 'invalid_json' };
      var j = JSON.parse(m[0]); j.live = r.live; return j;
    });
  };

  /* ---------- Scripted answers (demo provider) ---------- */
  ai.demoDecompose = function () {
    return { title: 'Checkout error and recovery states', summary: 'Design what buyers see when a payment fails, and how they recover without leaving checkout.',
      subtasks: [
        { title: 'Audit current decline and error messages', owner: 'maya', o: 1.5, m: 2.5, p: 4 },
        { title: 'Map processor error codes to buyer-facing states', owner: 'leo', o: 2, m: 3, p: 6 },
        { title: 'Design declined and expired card recovery', owner: 'maya', o: 4, m: 6, p: 9 },
        { title: 'Design 3DS failure and timeout states', owner: 'maya', o: 3, m: 5, p: 8 },
        { title: 'Write error copy with Content', owner: 'priya', o: 1.5, m: 2.5, p: 4 },
        { title: 'Instrument error events in the funnel', owner: 'hana', o: 1, m: 2, p: 3 }
      ] };
  };
  ai.demoRewrite = function (text, audience) {
    var t = String(text).trim().replace(/\s+/g, ' ').replace(/\b(just|basically|really|kind of|sort of)\s+/gi, '').replace(/\bi\b/g, 'I');
    t = t.charAt(0).toUpperCase() + t.slice(1); if (!/[.!?]$/.test(t)) t += '.';
    t = t.replace(/!/g, '.');
    if (audience === 'exec') { var first = t.split(/(?<=\.)\s/)[0]; return first; }
    if (audience === 'manager' && !/^(Quick update|Heads up)/.test(t)) return 'Quick update: ' + t.charAt(0).toLowerCase() + t.slice(1);
    return t;
  };
  ai.demoAnswer = function (question, audience) {
    var qn = String(question).toLowerCase(), s = H.store.state, Q = H.q;
    var key = (/\b(chk|inv|ds)-\d+\b/i.exec(question) || [])[0];
    var t = key && Q.ticket(key.toUpperCase());
    var person = Object.keys(H.PEOPLE).filter(function (id) { return id !== s.me && qn.indexOf(H.PEOPLE[id].name.split(' ')[0].toLowerCase()) >= 0; })[0];
    if (/summar|weekly|week for|my week/.test(qn)) return audience === 'exec' || /exec|leadership|ethan/.test(qn) ? 'Checkout v3 design is on track for October. Invoice PDF improvements shipped this week, and error-state design started today.' : 'Quick update: Checkout v3 design is moving. Payment methods are in hi-fi, wallet placement is in review with Sam, and error states kicked off today. The invoice PDF header (INV-88) shipped. One risk: the payment method selector slips a day to Thursday.';
    if (person && s.team[person]) return H.PEOPLE[person].name.split(' ')[0] + '’s Halo last shared this ' + H.fmt.rel(H.at(s.team[person].t)) + ': ' + s.team[person].status + ' I only answer from what they’ve chosen to share.';
    if (person === 'rosa') return 'Rosa asked about Checkout v3 earlier today. I answered from your published status and held back the estimate change, since it’s still waiting in your digest.';
    if (t) {
      var e = Q.estimate(t), done = t.subtasks.filter(function (x) { return x.done; }).length;
      if (audience === 'exec') return t.title + ' is ' + (t.status === 'done' ? 'done.' : 'on track' + (t.due != null ? ' for ' + H.fmt.day(H.at(t.due)) : '') + '.');
      return t.key + ' (' + t.title + ') is ' + H.ui.statusLabel(t.status).toLowerCase() + '. ' + (t.subtasks.length ? done + ' of ' + t.subtasks.length + ' subtasks are done' : 'No subtasks yet') + ', with about ' + H.fmt.hours(Q.remaining(t) * Q.pace()) + ' left at your usual pace' + (t.due != null ? ' against a ' + H.fmt.day(H.at(t.due)) + ' due date.' : '.') + (t.blocker ? ' Blocked: ' + t.blocker + '.' : '');
    }
    if (/stand ?up/.test(qn)) return 'Yesterday: finished the invoice PDF header (INV-88) and handed it to Sam. Today: high fidelity on the payment method selector (CHK-142), then the error-states kickoff. Blockers: none, though I’m waiting on Leo’s 3DS error codes by Wednesday.';
    if (/ship|shipped|done|finish|accomplish|this week/.test(qn)) {
      if (audience === 'exec') return 'Shipped the new invoice PDF header this week, and Checkout v3 design is on track for October.';
      return 'This week you shipped INV-88 (invoice PDF header and totals), moved CHK-142 into high fidelity, got wallet placement (CHK-145) into review with Sam, and kicked off checkout error states today. DS-212 is about 60% specced.';
    }
    if (/block|stuck|waiting/.test(qn)) return 'One soft blocker: you need the 3DS error-code list from Leo to finish the failure states, and it isn’t urgent until Wednesday. On the team side, Leo is blocked on processor sandbox access for CHK-150.';
    if (/estimate|how long|when will|deadline|late|slip/.test(qn)) { var c = Q.capacity(); return 'Over the next five workdays you have about ' + H.fmt.hours(c.need) + ' of estimated work due and roughly ' + H.fmt.hours(c.free) + ' of realistic focus time. CHK-142 is the one at risk: it needs about a day more, which moves it to Thursday. That update is waiting in your digest.'; }
    if (/next|tomorrow|plan|focus|priorit/.test(qn)) { var ne = Q.nextEvent(); return 'Next up' + (ne ? ' is ' + ne.title + ' at ' + H.fmt.time(H.at(ne.start)) : '') + '. For focus time, finish the wallet states on CHK-142 first (it’s the date at risk), then the error-state flows from today’s kickoff. DS-212 can take the Tuesday block.'; }
    if (/manager|rosa|summar|weekly/.test(qn) || audience === 'manager' && /status|update|where/.test(qn)) return 'Quick update: Checkout v3 design is moving. Payment methods are in hi-fi, wallet placement is in review, and error states kicked off today. Invoice PDF header shipped. One risk: the payment method selector slips a day to Thursday.';
    if (/exec|leadership|ethan|on track|october/.test(qn) || audience === 'exec') return 'Checkout v3 design is on track for October. Invoice PDF improvements shipped this week.';
    if (/private|redact|share|see|privacy|who can/.test(qn)) return 'Only what you approve, or what your trust mode allows, gets shared. Right now you’re in ' + s.prefs.mode + ' mode. One item was held back today because it matched a private topic (Compensation & career), and nobody sees raw activity, only your published updates.';
    if (/where|status|progress|checkout|at\b/.test(qn)) {
      if (audience === 'exec') return 'Checkout v3 design is on track for October.';
      if (audience === 'manager') return 'Checkout v3 design is moving: payment methods in hi-fi, wallet placement in review, error states kicked off today. The selector may land a day late (Thursday).';
      return 'Payment method selector is in hi-fi: cards and bank transfer are done, wallets next (CHK-142). Wallet placement is in review with Sam (CHK-145), and error-state flows land Thursday.';
    }
    return 'Here’s what I can see: CHK-142 is your main focus (in hi-fi, about a day behind), CHK-145 is in review with Sam, and today’s kickoff added error states to your plate. Ask me about a ticket, your week, blockers, or how to phrase an update for Rosa.';
  };
})(window.H = window.H || {});

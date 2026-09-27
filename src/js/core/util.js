/* Utilities: escaping, time, formatting, estimates, storage, sound. */
(function (H) {
  'use strict';
  var U = H.util = {};

  U.esc = H.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  U.uid = function (p) { return (p || 'id') + '_' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3); };
  U.clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  U.debounce = function (fn, ms) { var t; return function () { var a = arguments, s = this; clearTimeout(t); t = setTimeout(function () { fn.apply(s, a); }, ms); }; };
  U.clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  U.cls = function () { return Array.prototype.filter.call(arguments, Boolean).join(' '); };
  U.plural = function (n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); };
  U.hash = function (s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

  /* ---- Demo clock ----
     Halo runs against a fixed time of day (2:40 PM) on today's date so every relative time in the
     seeded workspace reads coherently. Weekends resolve to the previous Friday. All stored times are
     minute offsets from this anchor, so the workspace stays coherent on any day it is opened. */
  var anchor = (function () {
    var d = new Date(); var q = /[?&]now=(\d{1,2}):(\d{2})/.exec(location.search || '');
    d.setHours(q ? +q[1] : 14, q ? +q[2] : 40, 0, 0);
    var wd = d.getDay(); if (wd === 6) d.setDate(d.getDate() - 1); if (wd === 0) d.setDate(d.getDate() - 2);
    return d;
  })();
  H.now = function () { return new Date(anchor.getTime()); };
  H.at = function (min) { return new Date(anchor.getTime() + (min || 0) * 60000); };
  H.minOf = function (date) { return Math.round((date.getTime() - anchor.getTime()) / 60000); };
  // minutes offset for a given day offset + clock time ("09:30")
  H.slot = function (dayOffset, hhmm) {
    var d = new Date(anchor.getTime()); d.setDate(d.getDate() + dayOffset);
    var p = hhmm.split(':'); d.setHours(+p[0], +p[1], 0, 0); return H.minOf(d);
  };
  // Minute offset n business days from today (negative = past), at clock time hhmm.
  H.bday = function (n, hhmm) {
    var d = new Date(anchor.getTime()), step = n < 0 ? -1 : 1, left = Math.abs(n);
    while (left > 0) { d.setDate(d.getDate() + step); if (d.getDay() !== 0 && d.getDay() !== 6) left--; }
    var p = (hhmm || '17:00').split(':'); d.setHours(+p[0], +p[1], 0, 0); return H.minOf(d);
  };
  U.startOfDay = function (d) { var x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  U.addDays = function (d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; };
  U.sameDay = function (a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); };
  U.weekStart = function (d) { var x = U.startOfDay(d); var wd = (x.getDay() + 6) % 7; x.setDate(x.getDate() - wd); return x; };
  U.dayDiff = function (a, b) { return Math.round((U.startOfDay(a) - U.startOfDay(b)) / 86400000); };

  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var F = H.fmt = {};
  F.time = function (d) {
    var h = d.getHours(), m = d.getMinutes(), ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
    return h + (m ? ':' + (m < 10 ? '0' : '') + m : '') + ' ' + ap;
  };
  F.timeShort = function (d) { var h = d.getHours(), m = d.getMinutes(); var s = (h % 12 || 12) + (m ? ':' + (m < 10 ? '0' : '') + m : ''); return s + (h >= 12 ? 'p' : 'a'); };
  F.clock = function (d) { var h = d.getHours(), m = d.getMinutes(); return (h % 12 || 12) + ':' + (m < 10 ? '0' : '') + m; };
  F.weekday = function (d) { return DAYS[d.getDay()]; };
  F.dow = function (d) { return DAYS[d.getDay()].slice(0, 3); };
  F.date = function (d) { return MON[d.getMonth()] + ' ' + d.getDate(); };
  F.dateLong = function (d) { return DAYS[d.getDay()] + ', ' + ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][d.getMonth()] + ' ' + d.getDate(); };
  F.day = function (d) {
    var n = U.dayDiff(d, H.now());
    if (n === 0) return 'Today'; if (n === -1) return 'Yesterday'; if (n === 1) return 'Tomorrow';
    if (n > 1 && n < 7) return DAYS[d.getDay()];
    return F.dow(d) + ', ' + F.date(d);
  };
  F.rel = function (d) {
    var diff = (d.getTime() - H.now().getTime()) / 60000, a = Math.abs(diff), past = diff <= 0;
    if (a < 1) return 'just now';
    if (a < 60) return past ? Math.round(a) + 'm ago' : 'in ' + Math.round(a) + 'm';
    if (a < 60 * 24 && U.sameDay(d, H.now())) return past ? Math.round(a / 60) + 'h ago' : 'in ' + Math.round(a / 60) + 'h';
    var n = U.dayDiff(d, H.now());
    if (n === -1) return 'Yesterday'; if (n === 1) return 'Tomorrow';
    if (n < 0 && n > -7) return Math.abs(n) + 'd ago'; if (n > 0 && n < 7) return 'in ' + n + 'd';
    return F.date(d);
  };
  F.relLong = function (d) { var n = U.dayDiff(d, H.now()); return (n === 0 ? 'Today' : n === -1 ? 'Yesterday' : F.day(d)) + ' at ' + F.time(d); };
  F.hours = function (h) {
    if (h == null || isNaN(h)) return '—';
    if (h < 1) return Math.round(h * 60) + 'm';
    var r = Math.round(h * 2) / 2; return (r % 1 ? r.toFixed(1) : r) + 'h';
  };
  F.hm = function (min) { var h = Math.floor(min / 60), m = Math.round(min % 60); return (h ? h + 'h' : '') + (m || !h ? (h ? ' ' : '') + m + 'm' : ''); };
  F.pct = function (v) { return Math.round(v * 100) + '%'; };
  F.greeting = function () { var h = H.now().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };
  F.range = function (a, b) { return F.time(a).replace(/ (AM|PM)$/, a.getHours() >= 12 === b.getHours() >= 12 ? '' : ' $1') + ' – ' + F.time(b); };

  /* ---- Estimates: three-point (PERT). Hours. ---- */
  U.pert = function (o, m, p) {
    o = +o || 0; m = +m || 0; p = +p || 0;
    var mean = (o + 4 * m + p) / 6, sd = (p - o) / 6;
    return { mean: mean, sd: sd, low: Math.max(0, mean - sd), high: mean + sd, p85: mean + sd * 1.04 };
  };
  U.rollup = function (tasks) {
    var mean = 0, v = 0;
    tasks.forEach(function (t) { var e = t.est ? U.pert(t.est.o, t.est.m, t.est.p) : { mean: 0, sd: 0 }; mean += e.mean; v += e.sd * e.sd; });
    var sd = Math.sqrt(v); return { mean: mean, sd: sd, low: Math.max(0, mean - sd), high: mean + sd, p85: mean + sd * 1.04 };
  };

  /* ---- People helpers ---- */
  U.initials = function (name) { var p = String(name || '?').trim().split(/\s+/); return (p[0][0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase(); };

  /* ---- Storage (never throws) ---- */
  H.storage = {
    get: function (k, fb) { try { var v = localStorage.getItem(k); return v == null ? fb : JSON.parse(v); } catch (e) { return fb; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
  };

  /* ---- Sound: two-tone confirmation chime (880 -> 1320 Hz) ---- */
  var ac = null;
  H.chime = function (kind) {
    try {
      if (!H.store || !H.store.state.prefs.sound) return;
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      var t = ac.currentTime, tones = kind === 'soft' ? [660] : [880, 1320];
      tones.forEach(function (f, i) {
        var o = ac.createOscillator(), g = ac.createGain();
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t + i * 0.085);
        g.gain.exponentialRampToValueAtTime(0.07, t + i * 0.085 + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.085 + 0.22);
        o.connect(g); g.connect(ac.destination); o.start(t + i * 0.085); o.stop(t + i * 0.085 + 0.24);
      });
    } catch (e) { /* audio unavailable */ }
  };

  U.copy = function (text) {
    try { if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return false; }); } catch (e) { /* fall through */ }
    try { var ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); var ok = document.execCommand('copy'); ta.remove(); return Promise.resolve(!!ok); } catch (e) { return Promise.resolve(false); }
  };
  U.isTyping = function (e) {
    var t = e.target; if (!t) return false;
    var tag = (t.tagName || '').toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || t.isContentEditable;
  };
  U.isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '');
  U.mod = U.isMac ? '⌘' : 'Ctrl';
})(window.H = window.H || {});

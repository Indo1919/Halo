/* Halo icon set — 24px grid, 1.5 stroke, round caps and joins. Drawn for this product.
   H.icon(name, size = 18, cls = '') -> inline SVG string. Unknown names render an empty box, never throw. */
(function (H) {
  'use strict';

  function gear() {
    // 8-tooth cog with softened shoulders, computed once.
    var cx = 12, cy = 12, ro = 8.6, ri = 6.7, n = 8, d = '';
    for (var i = 0; i < n; i++) {
      var a = (i / n) * Math.PI * 2, w = Math.PI / n;
      var pts = [[ri, a - w * 0.62], [ro, a - w * 0.34], [ro, a + w * 0.34], [ri, a + w * 0.62]];
      pts.forEach(function (p, k) {
        var x = cx + p[0] * Math.sin(p[1]), y = cy - p[0] * Math.cos(p[1]);
        d += (i === 0 && k === 0 ? 'M' : 'L') + x.toFixed(2) + ' ' + y.toFixed(2);
      });
      var a2 = a + w * 0.62, a3 = a + (2 * w) - w * 0.62;
      var x3 = cx + ri * Math.sin(a3), y3 = cy - ri * Math.cos(a3);
      d += 'A' + ri + ' ' + ri + ' 0 0 1 ' + x3.toFixed(2) + ' ' + y3.toFixed(2);
    }
    return '<path d="' + d + 'Z"/><circle cx="12" cy="12" r="2.9"/>';
  }
  function rays(r0, r1, n) {
    var d = '';
    for (var i = 0; i < n; i++) {
      var a = (i / n) * Math.PI * 2;
      d += 'M' + (12 + r0 * Math.sin(a)).toFixed(2) + ' ' + (12 - r0 * Math.cos(a)).toFixed(2) +
           'L' + (12 + r1 * Math.sin(a)).toFixed(2) + ' ' + (12 - r1 * Math.cos(a)).toFixed(2);
    }
    return d;
  }

  var P = {
    // navigation
    home: '<path d="M4 10.4 12 4l8 6.4V19a1 1 0 0 1-1 1h-4.25v-5.25h-5.5V20H5a1 1 0 0 1-1-1z"/>',
    digest: '<path d="M3.75 13.25 6.2 5.6a1.5 1.5 0 0 1 1.43-1.04h8.74a1.5 1.5 0 0 1 1.43 1.04l2.45 7.65V18a1.75 1.75 0 0 1-1.75 1.75H5.5A1.75 1.75 0 0 1 3.75 18z"/><path d="M3.75 13.25h4.5l1.25 2h5l1.25-2h4.5"/>',
    ask: '<path d="M20 11.4c0 4.15-3.58 7.5-8 7.5-1.13 0-2.2-.22-3.18-.62L4.5 19.5l1.2-3.55A7.1 7.1 0 0 1 4 11.4C4 7.26 7.58 3.9 12 3.9s8 3.36 8 7.5z"/><path d="M12 8.2c.22 1.72.96 2.46 2.7 2.7-1.74.24-2.48.98-2.7 2.7-.22-1.72-.96-2.46-2.7-2.7 1.74-.24 2.48-.98 2.7-2.7z"/>',
    ticket: '<path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5V10a2 2 0 0 0 0 4v2.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5V14a2 2 0 0 0 0-4z"/><path d="M14.5 6.75v1.5M14.5 11.25v1.5M14.5 15.75v1.5"/>',
    calendar: '<rect x="3.75" y="5" width="16.5" height="15" rx="2.5"/><path d="M3.75 9.75h16.5M8.25 3v4M15.75 3v4"/>',
    'calendar-plus': '<path d="M20.25 11.5V7.5A2.5 2.5 0 0 0 17.75 5H6.25a2.5 2.5 0 0 0-2.5 2.5v10A2.5 2.5 0 0 0 6.25 20h5.25"/><path d="M3.75 9.75h16.5M8.25 3v4M15.75 3v4M17.5 14.5v6M14.5 17.5h6"/>',
    'calendar-check': '<rect x="3.75" y="5" width="16.5" height="15" rx="2.5"/><path d="M3.75 9.75h16.5M8.25 3v4M15.75 3v4M9 14.6l2 2 4-4"/>',
    team: '<circle cx="9" cy="8.5" r="3.25"/><path d="M3.5 19.5c.6-3.05 2.75-5 5.5-5s4.9 1.95 5.5 5"/><path d="M15.4 5.45a3.25 3.25 0 0 1 0 6.1M17.25 14.9c1.65.72 2.8 2.35 3.25 4.6"/>',
    history: '<path d="M4.6 12.2A7.5 7.5 0 1 0 6.7 6.7L4.5 8.9"/><path d="M4.5 4.75V8.9h4.15"/><path d="M12 8.25v4l2.75 1.75"/>',
    sources: '<path d="M9 3.5V7M15 3.5V7"/><path d="M6.75 7h10.5v3.25a5.25 5.25 0 0 1-10.5 0z"/><path d="M12 15.5v5"/>',
    privacy: '<path d="M12 3.5 19 6v5.4c0 4.35-2.9 7.7-7 9.1-4.1-1.4-7-4.75-7-9.1V6z"/><path d="M9.25 12.1l1.9 1.9 3.6-3.8"/>',
    settings: gear(),
    // actions
    search: '<circle cx="10.75" cy="10.75" r="6.25"/><path d="m15.4 15.4 4.35 4.35"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    x: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
    'chevron-right': '<path d="m9.5 6 6 6-6 6"/>',
    'chevron-left': '<path d="m14.5 6-6 6 6 6"/>',
    'chevron-down': '<path d="m6 9.5 6 6 6-6"/>',
    'chevron-up': '<path d="m6 14.5 6-6 6 6"/>',
    'chevrons-up-down': '<path d="m8 9.5 4-4 4 4M8 14.5l4 4 4-4"/>',
    'arrow-right': '<path d="M5 12h14M13 6l6 6-6 6"/>',
    'arrow-left': '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    'arrow-up': '<path d="M12 19V5M6 11l6-6 6 6"/>',
    'arrow-down': '<path d="M12 5v14M6 13l6 6 6-6"/>',
    'arrow-up-right': '<path d="M7 17 17 7M8.5 7H17v8.5"/>',
    more: '<circle cx="5.5" cy="12" r="1.25" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.25" fill="currentColor" stroke="none"/><circle cx="18.5" cy="12" r="1.25" fill="currentColor" stroke="none"/>',
    'more-vertical': '<circle cx="12" cy="5.5" r="1.25" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.25" fill="currentColor" stroke="none"/><circle cx="12" cy="18.5" r="1.25" fill="currentColor" stroke="none"/>',
    filter: '<path d="M4 6.5h16M7 12h10M10 17.5h4"/>',
    sort: '<path d="M7 4.5v15M3.75 16.25 7 19.5l3.25-3.25M17 19.5v-15M13.75 7.75 17 4.5l3.25 3.25"/>',
    list: '<path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="4.75" cy="6.5" r=".9" fill="currentColor" stroke="none"/><circle cx="4.75" cy="12" r=".9" fill="currentColor" stroke="none"/><circle cx="4.75" cy="17.5" r=".9" fill="currentColor" stroke="none"/>',
    board: '<rect x="3.75" y="4.25" width="4.5" height="14.5" rx="1.25"/><rect x="9.75" y="4.25" width="4.5" height="9" rx="1.25"/><rect x="15.75" y="4.25" width="4.5" height="11.75" rx="1.25"/>',
    grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>',
    clock: '<circle cx="12" cy="12" r="8.25"/><path d="M12 7.5V12l3 2"/>',
    timer: '<circle cx="12" cy="13.25" r="7.25"/><path d="M12 13.25V9.5M9.5 2.75h5M18.6 6.4l1.4-1.4"/>',
    flag: '<path d="M5.5 20.5V4.25M5.5 4.75h11.25l-2 3.9 2 3.85H5.5"/>',
    link: '<path d="M10.2 13.8a3.6 3.6 0 0 0 5.1 0l3.1-3.1a3.6 3.6 0 0 0-5.1-5.1l-.95.95"/><path d="M13.8 10.2a3.6 3.6 0 0 0-5.1 0l-3.1 3.1a3.6 3.6 0 0 0 5.1 5.1l.95-.95"/>',
    external: '<path d="M14 4.5h5.5V10M19.5 4.5 11 13M18 14v4.5A1.5 1.5 0 0 1 16.5 20h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10"/>',
    copy: '<rect x="8.5" y="8.5" width="11.5" height="11.5" rx="2"/><path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5"/>',
    edit: '<path d="M15.6 5.4a2 2 0 0 1 2.9 2.9L8.6 18.2l-4 1.1 1.1-4z"/><path d="M13.9 7.1l3 3"/>',
    trash: '<path d="M4.5 7h15M9.5 7V5.25a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V7M6.5 7l.8 11.6A1.5 1.5 0 0 0 8.8 20h6.4a1.5 1.5 0 0 0 1.5-1.4L17.5 7M10 11v5M14 11v5"/>',
    archive: '<rect x="3.5" y="4.5" width="17" height="4" rx="1"/><path d="M5 8.5V18a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 18V8.5M10 12.5h4"/>',
    eye: '<path d="M2.75 12S6 5.75 12 5.75 21.25 12 21.25 12 18 18.25 12 18.25 2.75 12 2.75 12z"/><circle cx="12" cy="12" r="3"/>',
    'eye-off': '<path d="M9.9 6a9.5 9.5 0 0 1 2.1-.25C18 5.75 21.25 12 21.25 12a16 16 0 0 1-2.4 3.2M6.5 7.3C4.1 8.9 2.75 12 2.75 12S6 18.25 12 18.25c1.8 0 3.35-.55 4.65-1.35M9.9 9.9a3 3 0 0 0 4.2 4.2M4 4l16 16"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.25"/><path d="M8.5 10.5V7.75a3.5 3.5 0 0 1 7 0v2.75"/>',
    unlock: '<rect x="5" y="10.5" width="14" height="10" rx="2.25"/><path d="M8.5 10.5V7.75a3.5 3.5 0 0 1 6.8-1.2"/>',
    refresh: '<path d="M19.5 12a7.5 7.5 0 0 1-13.2 4.9M4.5 12a7.5 7.5 0 0 1 13.2-4.9"/><path d="M17.9 3.6v3.6h-3.6M6.1 20.4v-3.6h3.6"/>',
    undo: '<path d="M9 14.5 4.5 10 9 5.5"/><path d="M4.5 10h10a5 5 0 0 1 0 10H11"/>',
    play: '<path d="M8 5.6v12.8a.6.6 0 0 0 .9.5l10.2-6.4a.6.6 0 0 0 0-1L8.9 5.1a.6.6 0 0 0-.9.5z"/>',
    pause: '<path d="M9 5.5v13M15 5.5v13"/>',
    'pause-circle': '<circle cx="12" cy="12" r="8.5"/><path d="M10 9v6M14 9v6"/>',
    'play-circle': '<circle cx="12" cy="12" r="8.5"/><path d="M10.25 8.9v6.2L15 12z"/>',
    stop: '<rect x="6.5" y="6.5" width="11" height="11" rx="2"/>',
    send: '<path d="M20.5 3.5 10.1 13.9"/><path d="M20.5 3.5 14 20.5l-3.9-6.6L3.5 10z"/>',
    paperclip: '<path d="M19.8 11.6 12.4 19a4.9 4.9 0 0 1-6.9-6.9l7.6-7.6a3.25 3.25 0 0 1 4.6 4.6l-7.6 7.6a1.6 1.6 0 0 1-2.3-2.3l7-7"/>',
    at: '<circle cx="12" cy="12" r="3.6"/><path d="M15.6 8.4v4.4a2.3 2.3 0 0 0 4.6 0V12a8.2 8.2 0 1 0-3.2 6.5"/>',
    hash: '<path d="M9.75 4 8.25 20M15.75 4l-1.5 16M4.5 9h15.5M4 15h15.5"/>',
    download: '<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14"/>',
    upload: '<path d="M12 15.5v-11M7.5 9 12 4.5 16.5 9M5 19.5h14"/>',
    share: '<path d="M12 14.5V4M7.75 8.25 12 4l4.25 4.25M5.5 12.5V18a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5v-5.5"/>',
    sidebar: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M9.5 4.5v15"/>',
    maximize: '<path d="M14.5 4.5h5v5M9.5 19.5h-5v-5M19.5 4.5l-6 6M4.5 19.5l6-6"/>',
    minimize: '<path d="M4.5 14.5h5v5M19.5 9.5h-5v-5M9.5 14.5l-5.5 5.5M14.5 9.5 20 4"/>',
    grip: '<circle cx="9" cy="6.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="6.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="9" cy="17.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="17.5" r="1.1" fill="currentColor" stroke="none"/>',
    // status and feedback
    bell: '<path d="M6.5 16.5v-5.25a5.5 5.5 0 0 1 11 0v5.25l1.5 1.75H5z"/><path d="M10 20.5a2.25 2.25 0 0 0 4 0"/>',
    'bell-off': '<path d="M9 5.9a5.5 5.5 0 0 1 8.5 4.6v4.2M17 18.25H5l1.5-1.75v-5.25c0-.9.2-1.74.58-2.5M10 20.5a2.25 2.25 0 0 0 4 0M4 4l16 16"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.25M12 7.75h.01"/>',
    help: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.6a2.5 2.5 0 0 1 4.85.85c0 1.7-2.45 2.1-2.45 3.6M12 16.9h.01"/>',
    alert: '<path d="M10.3 4.6 3.2 17a2 2 0 0 0 1.7 3h14.2a2 2 0 0 0 1.7-3L13.7 4.6a2 2 0 0 0-3.4 0z"/><path d="M12 9.5v4M12 16.75h.01"/>',
    'check-circle': '<circle cx="12" cy="12" r="8.5"/><path d="m8.5 12.25 2.4 2.4 4.6-4.9"/>',
    'x-circle': '<circle cx="12" cy="12" r="8.5"/><path d="m9.25 9.25 5.5 5.5M14.75 9.25l-5.5 5.5"/>',
    ban: '<circle cx="12" cy="12" r="8.5"/><path d="m6 6 12 12"/>',
    circle: '<circle cx="12" cy="12" r="8"/>',
    dot: '<circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/>',
    sparkle: '<path d="M11 3.75c.45 4.1 2.15 5.8 6.25 6.25-4.1.45-5.8 2.15-6.25 6.25-.45-4.1-2.15-5.8-6.25-6.25 4.1-.45 5.8-2.15 6.25-6.25z"/><path d="M18 14.5c.2 1.7.9 2.4 2.5 2.6-1.6.2-2.3.9-2.5 2.6-.2-1.7-.9-2.4-2.5-2.6 1.6-.2 2.3-.9 2.5-2.6z"/>',
    wand: '<path d="M4.5 19.5 14 10"/><path d="m12.5 8.5 3 3"/><path d="M17 3.5v3M15.5 5h3M19.5 9.5v2M18.5 10.5h2M9 3.75v1.5M8.25 4.5h1.5"/>',
    zap: '<path d="M13 3 5.25 13.25h6.25L11 21l7.75-10.25H12.5z"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    dial: '<path d="M4.3 16.75a8.5 8.5 0 1 1 15.4 0"/><path d="m12 13.25 3.6-4.35"/><circle cx="12" cy="13.5" r="1.6"/>',
    subtasks: '<circle cx="6" cy="5.75" r="2"/><path d="M6 7.75v11M6 12.25h6.25M6 18.75h6.25"/><circle cx="14.5" cy="12.25" r="2"/><circle cx="14.5" cy="18.75" r="2"/>',
    split: '<path d="M4 12h5.5l4-6H20M13.5 18l-4-6M13.5 18H20M17 3l3 3-3 3M17 15l3 3-3 3"/>',
    layers: '<path d="M12 4.25 3.75 8.5 12 12.75l8.25-4.25z"/><path d="m3.75 12.25 8.25 4.25 8.25-4.25M3.75 16 12 20.25 20.25 16"/>',
    'file-text': '<path d="M14 3.5H7A1.5 1.5 0 0 0 5.5 5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8z"/><path d="M14 3.5V8h4.5M9 12.5h6M9 16h6"/>',
    'git-pr': '<circle cx="6.5" cy="6" r="2.25"/><circle cx="6.5" cy="18" r="2.25"/><circle cx="17.5" cy="18" r="2.25"/><path d="M6.5 8.25v7.5M17.5 15.75V9a2.5 2.5 0 0 0-2.5-2.5h-3.5M13.75 4.25 11.5 6.5l2.25 2.25"/>',
    'git-commit': '<circle cx="12" cy="12" r="3.25"/><path d="M3 12h5.75M15.25 12H21"/>',
    frame: '<path d="M8 3.5v17M16 3.5v17M3.5 8h17M3.5 16h17"/>',
    video: '<rect x="3" y="6.5" width="12.5" height="11" rx="2.25"/><path d="m15.5 10.5 5.5-3v9l-5.5-3"/>',
    mic: '<rect x="9" y="3.5" width="6" height="10.5" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5"/>',
    wave: '<path d="M4 10v4M8 7v10M12 4.5v15M16 8v8M20 10.5v3"/>',
    fingerprint: '<path d="M6.8 5.6A8.4 8.4 0 0 1 20.2 11"/><path d="M4.3 15.3A8.3 8.3 0 0 1 4.6 8.4"/><path d="M8 19.6a11 11 0 0 1-1.5-5.6 5.5 5.5 0 0 1 11 0v.4"/><path d="M12 14v.6a9 9 0 0 0 1.9 5.4"/><path d="M9.6 17.4a7.5 7.5 0 0 1-.1-3.4 2.5 2.5 0 0 1 5 0c0 2 .5 3.8 1.5 5.3"/><path d="M17.3 17.6c.1-.7.2-1.5.2-2.3"/>',
    sliders: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
    user: '<circle cx="12" cy="8.5" r="3.75"/><path d="M5 20c.8-3.5 3.6-5.75 7-5.75s6.2 2.25 7 5.75"/>',
    'user-plus': '<circle cx="10" cy="8.5" r="3.75"/><path d="M3.5 20c.75-3.5 3.35-5.75 6.5-5.75 1.5 0 2.85.5 3.95 1.4M18 13v6M15 16h6"/>',
    teammate: '<circle cx="9" cy="8.5" r="3.25"/><path d="M3.5 19.5c.6-3.05 2.75-5 5.5-5s4.9 1.95 5.5 5"/><path d="M15.4 5.45a3.25 3.25 0 0 1 0 6.1M17.25 14.9c1.65.72 2.8 2.35 3.25 4.6"/>',
    manager: '<rect x="3.5" y="7.5" width="17" height="12" rx="2.25"/><path d="M9 7.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v1.5M3.5 12.75h17"/>',
    exec: '<path d="M5 20.5V5a1.5 1.5 0 0 1 1.5-1.5h7A1.5 1.5 0 0 1 15 5v15.5M15 9.5h3.5A1.5 1.5 0 0 1 20 11v9.5M3.5 20.5h17M8.5 7.5h3M8.5 11h3M8.5 14.5h3"/>',
    broadcast: '<circle cx="12" cy="12" r="1.75"/><path d="M8.3 15.7a5.25 5.25 0 0 1 0-7.4M15.7 8.3a5.25 5.25 0 0 1 0 7.4M5.5 18.5a9.2 9.2 0 0 1 0-13M18.5 5.5a9.2 9.2 0 0 1 0 13"/>',
    globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.3 2.35 3.5 5.2 3.5 8.5s-1.2 6.15-3.5 8.5c-2.3-2.35-3.5-5.2-3.5-8.5S9.7 5.85 12 3.5z"/>',
    mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2.25"/><path d="m4.25 7.25 7.75 6 7.75-6"/>',
    message: '<path d="M4.5 6.25A1.75 1.75 0 0 1 6.25 4.5h11.5a1.75 1.75 0 0 1 1.75 1.75v8.5a1.75 1.75 0 0 1-1.75 1.75H9.5L5.5 19.5v-3H6.25"/>',
    quote: '<path d="M9.5 10.5H6.25V7.25H9.5zm0 0c0 3-1 5-3.5 6.25M17.75 10.5H14.5V7.25h3.25zm0 0c0 3-1 5-3.5 6.25"/>',
    'log-out': '<path d="M9.5 20H6a1.5 1.5 0 0 1-1.5-1.5v-13A1.5 1.5 0 0 1 6 4h3.5M15 16l4-4-4-4M19 12H9.5"/>',
    key: '<circle cx="8" cy="15.5" r="3.75"/><path d="M10.75 12.75 19.5 4M16 7.5l2.5 2.5M13.75 9.75l1.75 1.75"/>',
    cloud: '<path d="M7 18.5a4.5 4.5 0 0 1-.55-8.97 6 6 0 0 1 11.45-.53 4.75 4.75 0 0 1-.4 9.5z"/>',
    'cloud-off': '<path d="M7 18.5a4.5 4.5 0 0 1-.55-8.97c.15-.7.4-1.36.75-1.96M10.25 4.6A6 6 0 0 1 17.9 9a4.75 4.75 0 0 1 2.35 8.15M17.5 18.5H9M4 4l16 16"/>',
    sun: '<circle cx="12" cy="12" r="3.75"/><path d="' + rays(6.6, 8.9, 8) + '"/>',
    moon: '<path d="M19.75 14.6A7.9 7.9 0 1 1 9.4 4.25a6.4 6.4 0 0 0 10.35 10.35z"/>',
    monitor: '<rect x="3" y="4.5" width="18" height="12" rx="2"/><path d="M8.5 20h7M12 16.5V20"/>',
    keyboard: '<rect x="2.75" y="6" width="18.5" height="12" rx="2.25"/><path d="M6.5 10h.01M10 10h.01M14 10h.01M17.5 10h.01M8 14.25h8"/>',
    command: '<path d="M9 9V6.75A2.25 2.25 0 1 0 6.75 9H9zm0 0h6m-6 0v6m6-6V6.75A2.25 2.25 0 1 1 17.25 9H15zm0 0v6m0 0H9m6 0v2.25A2.25 2.25 0 1 0 17.25 15H15zm-6 0v2.25A2.25 2.25 0 1 1 6.75 15H9z"/>',
    trending: '<path d="M3.5 17 9.5 11l4 4 7-7.5"/><path d="M15 7.5h5.5V13"/>',
    chart: '<path d="M4.5 20h15M7 16.5v-4M11.5 16.5V7M16 16.5v-6.5"/>',
    pie: '<path d="M12 3.5v8.5h8.5A8.5 8.5 0 1 1 12 3.5z"/><path d="M15 3.8A8.5 8.5 0 0 1 20.2 9H15z"/>',
    briefcase: '<rect x="3.5" y="7.5" width="17" height="12" rx="2.25"/><path d="M9 7.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v1.5"/>',
    focus: '<path d="M4 8.5V6a2 2 0 0 1 2-2h2.5M15.5 4H18a2 2 0 0 1 2 2v2.5M20 15.5V18a2 2 0 0 1-2 2h-2.5M8.5 20H6a2 2 0 0 1-2-2v-2.5"/><circle cx="12" cy="12" r="2.75"/>',
    coffee: '<path d="M4.5 9.5h12v5a4.5 4.5 0 0 1-4.5 4.5H9a4.5 4.5 0 0 1-4.5-4.5z"/><path d="M16.5 10.5h1.25a2.25 2.25 0 0 1 0 4.5H16.5M8 3.5v2.5M11 3.5v2.5M14 3.5v2.5"/>',
    pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.25"/>',
    star: '<path d="m12 4 2.47 5 5.53.8-4 3.9.94 5.5L12 16.6l-4.94 2.6.94-5.5-4-3.9 5.53-.8z"/>',
    bookmark: '<path d="M6.5 4.75A1.25 1.25 0 0 1 7.75 3.5h8.5a1.25 1.25 0 0 1 1.25 1.25V20.5L12 16.75 6.5 20.5z"/>',
    inbox: '<path d="M3.75 13.25 6.2 5.6a1.5 1.5 0 0 1 1.43-1.04h8.74a1.5 1.5 0 0 1 1.43 1.04l2.45 7.65V18a1.75 1.75 0 0 1-1.75 1.75H5.5A1.75 1.75 0 0 1 3.75 18z"/><path d="M3.75 13.25h4.5l1.25 2h5l1.25-2h4.5"/>',
    redact: '<rect x="3.5" y="5" width="17" height="14" rx="2.25"/><path d="M7 10h10M7 14h5.5"/><path d="M14.5 14h2.5" stroke-width="3"/>',
    logo: '<path d="M18.5 12a6.5 6.5 0 1 1-6.5-6.5"/><path d="M13.6 5.7a6.5 6.5 0 0 1 4.7 4.7" stroke="var(--accent)"/>',
    'thumbs-up': '<path d="M7.5 10.5v9H5a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1zM7.5 10.5 11 3.75a2 2 0 0 1 2.4 2.3l-.8 3.45h5.1a2 2 0 0 1 1.95 2.45l-1.4 6.2a2 2 0 0 1-1.95 1.55H7.5"/>',
    'thumbs-down': '<path d="M7.5 13.5v-9H5a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1zM7.5 13.5 11 20.25a2 2 0 0 0 2.4-2.3l-.8-3.45h5.1a2 2 0 0 0 1.95-2.45l-1.4-6.2a2 2 0 0 0-1.95-1.55H7.5"/>',
    reply: '<path d="M9.5 15 4.5 10l5-5"/><path d="M4.5 10h9a6 6 0 0 1 6 6v3"/>',
    repeat: '<path d="M17 3.5 20 6.5l-3 3M20 6.5H8a4 4 0 0 0-4 4V11M7 20.5 4 17.5l3-3M4 17.5h12a4 4 0 0 0 4-4V13"/>',
    moveup: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    text: '<path d="M5 6.5V5h14v1.5M12 5v14M9.5 19h5"/>',
    image: '<rect x="3.75" y="4.5" width="16.5" height="15" rx="2.25"/><circle cx="9" cy="9.5" r="1.75"/><path d="m20.25 15.5-4.5-4.5L6.5 19.5"/>',
    building: '<path d="M5 20.5V5a1.5 1.5 0 0 1 1.5-1.5h7A1.5 1.5 0 0 1 15 5v15.5M15 9.5h3.5A1.5 1.5 0 0 1 20 11v9.5M3.5 20.5h17M8.5 7.5h3M8.5 11h3M8.5 14.5h3"/>',
    gift: '<rect x="3.75" y="8" width="16.5" height="4" rx="1"/><path d="M5.25 12v7a1.5 1.5 0 0 0 1.5 1.5h10.5a1.5 1.5 0 0 0 1.5-1.5v-7M12 8v12.5M12 8S10.9 3.5 8.25 3.5a2.25 2.25 0 0 0 0 4.5M12 8s1.1-4.5 3.75-4.5a2.25 2.25 0 0 1 0 4.5"/>',
    book: '<path d="M4.5 5.5A1.5 1.5 0 0 1 6 4h4.5A1.5 1.5 0 0 1 12 5.5v14a2 2 0 0 0-2-2H4.5zM19.5 5.5A1.5 1.5 0 0 0 18 4h-4.5A1.5 1.5 0 0 0 12 5.5v14a2 2 0 0 1 2-2h5.5z"/>',
    compass: '<circle cx="12" cy="12" r="8.5"/><path d="m15.3 8.7-1.9 4.7-4.7 1.9 1.9-4.7z"/>',
    rocket: '<path d="M14.5 4.5c2.5-1 4.5-1 5-.5s.5 2.5-.5 5c-1.4 3.4-4.5 6.2-7.5 7.8l-4.3-4.3C8.8 9.5 11.1 5.9 14.5 4.5z"/><path d="M7.5 12.3 4.5 12l2.2-2.8 3.3-.2M11.7 16.5l.3 3 2.8-2.2.2-3.3M5.8 18.2 4 20l.3-2.3M14.75 9.25h.01"/>',
    'arrow-turn': '<path d="M9 10 4.5 14.5 9 19"/><path d="M4.5 14.5H15a4.5 4.5 0 0 0 4.5-4.5V5"/>'
  };

  H.iconNames = Object.keys(P);
  // Screens may register extra glyphs drawn to the same grid: H.addIcons({ name: '<path d="…"/>' })
  H.addIcons = function (map) { Object.keys(map).forEach(function (k) { if (!P[k]) { P[k] = map[k]; H.iconNames.push(k); } }); };
  H.icon = function (name, size, cls) {
    size = size || 18;
    var body = P[name] || '<rect x="5" y="5" width="14" height="14" rx="3" stroke-dasharray="2 2"/>';
    return '<svg class="i' + (cls ? ' ' + cls : '') + '" width="' + size + '" height="' + size +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      body + '</svg>';
  };
})(window.H = window.H || {});

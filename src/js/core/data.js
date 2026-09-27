/* Seed workspace. Everything here is fictional: Brightwater is an invented company and every
   person, ticket and message is written for this demo. Times are minute offsets from H.now(). */
(function (H) {
  'use strict';

  H.PEOPLE = {
    maya:  { id: 'maya',  name: 'Maya Chen',       role: 'Senior Product Designer', team: 'Checkout', email: 'maya.chen@brightwater.co', hue: '#C2410C', tz: 'Pacific' },
    sam:   { id: 'sam',   name: 'Sam Okafor',      role: 'Staff Frontend Engineer', team: 'Checkout', email: 'sam.okafor@brightwater.co', hue: '#2F6FDB' },
    priya: { id: 'priya', name: 'Priya Nair',      role: 'Product Manager',         team: 'Checkout', email: 'priya.nair@brightwater.co', hue: '#7C3AED' },
    leo:   { id: 'leo',   name: 'Leo Martins',     role: 'Backend Engineer, Payments', team: 'Checkout', email: 'leo.martins@brightwater.co', hue: '#1F8A70' },
    hana:  { id: 'hana',  name: 'Hana Kim',        role: 'Product Analyst',         team: 'Checkout', email: 'hana.kim@brightwater.co', hue: '#BE185D' },
    nora:  { id: 'nora',  name: 'Nora Lindqvist',  role: 'Engineering Manager',     team: 'Checkout', email: 'nora.lindqvist@brightwater.co', hue: '#0E7490' },
    rosa:  { id: 'rosa',  name: 'Rosa Delgado',    role: 'Design Director',         team: 'Design',   email: 'rosa.delgado@brightwater.co', hue: '#B45309', manager: true },
    ethan: { id: 'ethan', name: 'Ethan Brooks',    role: 'VP of Product',           team: 'Leadership', email: 'ethan.brooks@brightwater.co', hue: '#4D7C0F', exec: true }
  };

  H.SOURCES = [
    { id: 'gcal',   cat: 'Calendar & meetings', status: 'connected', sync: -3,  today: 7,  reads: ['Event titles, times and attendees', 'Which meetings you joined and for how long'], never: ['Descriptions of events marked private', 'Other people’s calendars'], useStatus: true, useVoice: false },
    { id: 'zoom',   cat: 'Calendar & meetings', status: 'error',     sync: -1440, today: 0, error: 'Access expired yesterday. Reconnect to keep meeting recaps flowing.', reads: ['Transcripts of meetings you host or join', 'Meeting duration and attendees'], never: ['Recordings', 'Chat messages sent privately'], useStatus: true, useVoice: false },
    { id: 'slack',  cat: 'Messaging',           status: 'connected', sync: -1,  today: 23, reads: ['Messages you send in public channels', 'Threads you are mentioned in'], never: ['Direct messages', 'Private channels unless you add them'], useStatus: true, useVoice: true },
    { id: 'figma',  cat: 'Design',              status: 'connected', sync: -6,  today: 41, reads: ['Files and frames you edit', 'Comments you leave or resolve'], never: ['Files you only view', 'Drafts outside team projects'], useStatus: true, useVoice: false },
    { id: 'github', cat: 'Engineering',         status: 'connected', sync: -12, today: 4,  reads: ['Pull requests you open, review or are tagged on', 'Commits linked to tickets'], never: ['Code contents', 'Private repositories you exclude'], useStatus: true, useVoice: false },
    { id: 'jira',   cat: 'Project tracking',    status: 'connected', sync: -2,  today: 9,  reads: ['Tickets assigned to you and their status', 'Comments on those tickets'], never: ['Tickets in restricted projects'], useStatus: true, useVoice: true },
    { id: 'gdocs',  cat: 'Documents',           status: 'connected', sync: -28, today: 3,  reads: ['Docs you edit in shared drives', 'Suggestions and comments you make'], never: ['Docs in My Drive unless shared'], useStatus: true, useVoice: true },
    { id: 'ai',     cat: 'AI assistants',       status: 'connected', sync: -45, today: 2,  reads: ['Titles of AI chats you choose to share', 'Summaries you approve'], never: ['Full chat contents', 'Anything you did not explicitly share'], useStatus: true, useVoice: false, optIn: true },
    { id: 'loom',   cat: 'Calendar & meetings', status: 'available', reads: ['Loom videos you record and their titles'], never: ['Viewer analytics'] },
    { id: 'notion', cat: 'Documents',           status: 'available', reads: ['Pages you edit in shared workspaces'], never: ['Private pages'] },
    { id: 'linear', cat: 'Project tracking',    status: 'available', reads: ['Issues assigned to you and their status'], never: ['Private teams'] },
    { id: 'gmail',  cat: 'Messaging',           status: 'available', reads: ['Subjects of emails you send to your team'], never: ['Email bodies', 'Personal labels'] },
    { id: 'outlook',cat: 'Calendar & meetings', status: 'available', reads: ['Event titles, times and attendees'], never: ['Private events'] },
    { id: 'teams',  cat: 'Messaging',           status: 'available', reads: ['Messages you send in team channels'], never: ['Chats'] },
    { id: 'asana',  cat: 'Project tracking',    status: 'available', reads: ['Tasks assigned to you'], never: ['Private projects'] }
  ];

  H.PROJECTS = {
    CHK: { key: 'CHK', name: 'Checkout v3', color: '#FF4405' },
    INV: { key: 'INV', name: 'Invoices 2.0', color: '#2F6FDB' },
    DS:  { key: 'DS',  name: 'Harbor design system', color: '#1F8A70' }
  };

  function st(title, done, o, m, p) { return { id: H.util.uid('st'), title: title, done: !!done, est: { o: o, m: m, p: p } }; }

  H.seed = function () {
    var S = H.slot, B = H.bday, now = H.now(), wd = (now.getDay() + 6) % 7; // 0 = Monday
    var W = function (day, hhmm) { return S(day - wd, hhmm); };
    var prev = -1;

    var tickets = [
      { key: 'CHK-142', title: 'Redesign the payment method selector', project: 'CHK', status: 'progress', prio: 'high', owner: 'maya', created: B(-6, '11:40'), due: B(2, '17:00'),
        est: { o: 10, m: 16, p: 26 }, logged: 11.5, origin: { kind: 'meeting', label: 'Checkout v3 planning', t: B(-6, '11:00') },
        desc: 'Merchants lose payments when buyers cannot find their preferred method. Redesign the selector so cards, bank transfer and wallets are scannable on a 360px screen, with the merchant’s default pre-selected.',
        subtasks: [st('Audit selector usage in funnel analytics', 1, 1, 2, 3), st('Wireframe three layout options', 1, 2, 3, 5), st('Pick a direction with Priya and Sam', 1, 0.5, 1, 1.5),
          st('High fidelity: cards, bank transfer, wallets', 0, 4, 6, 10), st('Accessibility annotations', 0, 1, 2, 3), st('Handoff notes and redlines', 0, 1, 2, 3)],
        links: [{ src: 'figma', label: 'Checkout v3 · Payment methods' }, { src: 'jira', label: 'CHK-142' }], watchers: ['priya', 'sam'] },
      { key: 'CHK-145', title: 'Place Apple Pay and Google Pay buttons', project: 'CHK', status: 'review', prio: 'medium', owner: 'maya', created: B(-8, '10:05'), due: B(0, '18:00'),
        est: { o: 4, m: 6, p: 10 }, logged: 6.5, reviewer: 'sam',
        desc: 'Decide where express wallets sit relative to the card form on mobile and desktop. Follow each wallet’s button guidelines.',
        subtasks: [st('Collect wallet brand guidelines', 1, 0.5, 1, 1.5), st('Mobile and desktop placement options', 1, 2, 3, 5), st('Review with Sam', 1, 0.5, 1, 1)],
        links: [{ src: 'figma', label: 'Checkout v3 · Wallets' }, { src: 'zoom', label: 'Wallet placement review' }], watchers: ['sam'] },
      { key: 'CHK-139', title: 'Accessibility pass on checkout: keyboard and screen reader', project: 'CHK', status: 'todo', prio: 'high', owner: 'maya', created: B(-5, '15:20'), due: B(4, '17:00'),
        est: { o: 6, m: 10, p: 16 }, logged: 0,
        desc: 'Every checkout step should be reachable by keyboard, announce errors, and keep focus order predictable. Target WCAG 2.2 AA.',
        subtasks: [st('Keyboard walkthrough of all steps', 0, 1, 2, 3), st('Screen reader pass (VoiceOver, NVDA)', 0, 2, 3, 5), st('Error announcement patterns', 0, 1, 2, 4), st('Write fixes into tickets', 0, 1, 2, 3)],
        links: [{ src: 'gdocs', label: 'Checkout accessibility checklist' }], watchers: ['sam', 'priya'] },
      { key: 'DS-212', title: 'Add Select and Combobox to Harbor', project: 'DS', status: 'progress', prio: 'medium', owner: 'maya', created: B(-9, '09:40'), due: B(6, '17:00'),
        est: { o: 8, m: 12, p: 20 }, logged: 7,
        desc: 'Harbor has no single-select pattern, so teams ship five different dropdowns. Spec Select and Combobox with states, keyboard behavior and density.',
        subtasks: [st('Inventory existing dropdowns', 1, 1, 2, 3), st('Select: states and anatomy', 1, 2, 3, 5), st('Combobox: filtering and async states', 0, 2, 4, 7), st('Keyboard and screen reader behavior', 0, 1, 2, 3), st('Publish to the Harbor library', 0, 1, 1.5, 2)],
        links: [{ src: 'figma', label: 'Harbor · Select' }], watchers: ['sam'] },
      { key: 'INV-88', title: 'Invoice PDF: new header and totals layout', project: 'INV', status: 'done', prio: 'medium', owner: 'maya', created: B(-12, '14:00'), due: B(prev, '17:00'), done: B(prev, '16:10'),
        est: { o: 5, m: 8, p: 12 }, logged: 9,
        desc: 'Merchants asked for their logo, tax ID and payment terms to be visible at the top of every invoice PDF.',
        subtasks: [st('Header with logo, tax ID and terms', 1, 2, 3, 4), st('Totals block with tax lines', 1, 1, 2, 3), st('Handoff to Sam', 1, 1, 2, 3)],
        links: [{ src: 'github', label: 'PR #479 · invoice-pdf header' }, { src: 'figma', label: 'Invoices 2.0 · PDF' }], watchers: ['sam'] },
      { key: 'INV-91', title: 'Late-payment reminder email copy', project: 'INV', status: 'todo', prio: 'low', owner: 'maya', created: B(-3, '13:15'), due: B(8, '17:00'),
        est: { o: 1, m: 2, p: 4 }, logged: 0,
        desc: 'Three reminder emails (3, 7 and 14 days late) that stay polite and make paying one tap away.',
        subtasks: [st('Draft three reminder emails', 0, 0.5, 1, 2), st('Review tone with Content', 0, 0.5, 1, 2)], links: [{ src: 'gdocs', label: 'Reminder emails draft' }], watchers: ['priya'] },
      { key: 'CHK-138', title: 'Saved cards: remove and set default', project: 'CHK', status: 'progress', prio: 'high', owner: 'sam', created: B(-7, '10:00'), due: B(1, '17:00'), est: { o: 6, m: 9, p: 14 }, logged: 8,
        desc: 'Let buyers remove saved cards and choose a default without leaving checkout.', subtasks: [st('API wiring', 1, 2, 3, 4), st('UI states', 1, 2, 3, 5), st('Tests', 0, 1, 2, 3)], links: [{ src: 'github', label: 'PR #482 · saved-cards' }], watchers: ['maya'] },
      { key: 'CHK-149', title: 'Instrument checkout funnel events', project: 'CHK', status: 'progress', prio: 'medium', owner: 'hana', created: B(-4, '09:30'), due: B(3, '17:00'), est: { o: 4, m: 6, p: 9 }, logged: 3,
        desc: 'Track each step of checkout so we can see where buyers drop off.', subtasks: [st('Event schema', 1, 1, 2, 3), st('Dashboard', 0, 2, 3, 4)], links: [], watchers: ['priya'] },
      { key: 'CHK-150', title: 'Retry logic for 3DS timeouts', project: 'CHK', status: 'blocked', prio: 'urgent', owner: 'leo', created: B(-2, '11:00'), due: B(2, '17:00'), est: { o: 6, m: 10, p: 18 }, logged: 2,
        blocker: 'Waiting on sandbox access from the card processor', desc: 'Retry 3D Secure challenges that time out instead of failing the payment.', subtasks: [st('Sandbox access', 0, 1, 2, 8), st('Retry policy', 0, 2, 3, 5)], links: [], watchers: ['maya', 'nora'] },
      { key: 'CHK-153', title: 'Tax and tip line items on mobile', project: 'CHK', status: 'todo', prio: 'medium', owner: 'priya', created: B(-1, '10:20'), due: B(7, '17:00'), est: { o: 2, m: 4, p: 6 }, logged: 0,
        desc: 'Restaurants and salons need tips and tax shown clearly before the buyer pays.', subtasks: [], links: [], watchers: ['maya'] },
      { key: 'CHK-136', title: 'Checkout v3 success page', project: 'CHK', status: 'done', prio: 'medium', owner: 'sam', created: B(-14, '10:00'), due: B(-2, '17:00'), done: B(-2, '15:45'), est: { o: 3, m: 5, p: 8 }, logged: 5,
        desc: 'Confirmation page with receipt, next steps and a way back to the merchant.', subtasks: [], links: [{ src: 'github', label: 'PR #471 · success page' }], watchers: ['maya'] },
      { key: 'INV-95', title: 'Bulk-send invoices', project: 'INV', status: 'review', prio: 'medium', owner: 'leo', created: B(-10, '16:00'), due: B(1, '17:00'), est: { o: 5, m: 8, p: 12 }, logged: 8,
        desc: 'Send up to 200 invoices at once from a CSV.', subtasks: [], links: [{ src: 'github', label: 'PR #476 · bulk send' }], watchers: ['priya'] }
    ];

    var ev = function (id, title, day, start, end, o) {
      var abs = typeof start === 'number';
      return Object.assign({ id: id, title: title, start: abs ? start : S(day, start), end: abs ? end : S(day, end) }, o || {});
    };
    var events = [];
    for (var d = 0; d < 5; d++) {
      var off = d - wd;
      events.push(ev('standup-' + d, 'Checkout standup', off, '09:30', '09:45', { kind: 'meeting', recurring: true, people: ['maya', 'sam', 'priya', 'leo', 'hana', 'nora'], cover: true, covered: off <= 0 }));
    }
    var dayEvents = {
      0: [['plan', 'Sprint planning', '11:00', '12:00', { kind: 'meeting', people: ['maya', 'sam', 'priya', 'leo', 'hana', 'nora'] }], ['f-mon', 'Focus · CHK-142', '14:00', '16:00', { kind: 'focus', ticket: 'CHK-142', booked: true }]],
      1: [['inv-sync', 'Invoices sync', '13:00', '13:30', { kind: 'meeting', people: ['maya', 'leo', 'priya'] }], ['f-tue', 'Focus · DS-212', '15:00', '16:30', { kind: 'focus', ticket: 'DS-212', booked: true }]],
      2: [['interviews', 'Merchant interviews', '11:00', '12:00', { kind: 'meeting', people: ['maya', 'priya'] }], ['f-wed', 'Focus · CHK-139', '14:30', '16:30', { kind: 'focus', ticket: 'CHK-139', booked: true }]],
      3: [['ds-hours', 'Harbor office hours', '10:00', '11:00', { kind: 'meeting', people: ['maya', 'sam'] }], ['f-thu', 'Focus · CHK-142', '13:00', '15:00', { kind: 'focus', ticket: 'CHK-142', booked: true }]],
      4: [['demo', 'Demo day', '11:00', '12:00', { kind: 'meeting', people: ['maya', 'sam', 'priya', 'leo', 'hana', 'nora', 'rosa'] }], ['retro', 'Sprint retro', '15:00', '15:45', { kind: 'meeting', people: ['maya', 'sam', 'priya', 'leo', 'hana', 'nora'] }]]
    };
    Object.keys(dayEvents).forEach(function (k) {
      k = +k; if (k === wd) return;
      dayEvents[k].forEach(function (e) { events.push(ev(e[0], e[1], k - wd, e[2], e[3], e[4])); });
    });
    // Today
    events.push(ev('payments', 'Payments sync with Leo', 0, '10:00', '10:30', { kind: 'meeting', people: ['maya', 'leo'] }));
    events.push(ev('focus-today', 'Focus · CHK-142', 0, '11:00', '12:30', { kind: 'focus', ticket: 'CHK-142', booked: true }));
    events.push(ev('kickoff', 'Checkout v3: error states kickoff', 0, '13:30', '14:15', { kind: 'meeting', people: ['maya', 'priya', 'leo', 'sam', 'hana'], recap: 'kickoff', src: 'zoom' }));
    events.push(ev('critique', 'Design critique', 0, '15:00', '15:45', { kind: 'meeting', people: ['maya', 'rosa'], extra: 4 }));
    events.push(ev('focus-ds', 'Focus · DS-212', 0, '16:00', '17:00', { kind: 'focus', ticket: 'DS-212', booked: true }));
    // Private 1:1 (never shared), weekly status review Halo can cover
    events.push(ev('one-on-one', '1:1 Maya / Rosa', null, B(-1, '10:00'), B(-1, '10:30'), { kind: 'meeting', people: ['maya', 'rosa'], private: true }));
    events.push(ev('status-review', 'Weekly status review', null, B(1, '14:00'), B(1, '14:30'), { kind: 'meeting', people: ['maya', 'rosa', 'priya', 'nora', 'ethan'], cover: true, suggestSkip: true }));

    var digest = [
      { id: 'd1', kind: 'ticket', title: 'CHK-142 moved to In progress', audience: 'team', conf: 0.96, ticket: 'CHK-142', t: -52,
        text: 'Started high fidelity on the payment method selector (CHK-142). Cards and bank transfer are in Figma; wallets are next.', sources: [['figma', 'Checkout v3 · Payment methods'], ['jira', 'CHK-142']] },
      { id: 'd2', kind: 'time', title: 'Logged 1h 25m on CHK-142', audience: 'manager', conf: 0.92, ticket: 'CHK-142', t: -128,
        text: '1h 25m on CHK-142 this morning, measured from Figma edit sessions during the 11:00 focus block.', sources: [['figma', '3 edit sessions'], ['gcal', 'Focus · CHK-142']] },
      { id: 'd3', kind: 'standup', title: 'Standup for #checkout-standup', audience: 'team', conf: 0.94, t: -310,
        text: 'Yesterday: finished the invoice PDF header (INV-88). Today: payment method selector hi-fi, then the error-states kickoff. Blockers: none.', sources: [['jira', '2 tickets'], ['figma', 'Payment methods'], ['gcal', 'Today’s calendar']] },
      { id: 'd4', kind: 'ticket', title: 'INV-88 marked Done', audience: 'team', conf: 0.97, ticket: 'INV-88', t: -700,
        text: 'Invoice PDF header and totals layout is done. Sam approved the handoff and PR #479 is merged, so new invoices use the updated totals block.', sources: [['github', 'PR #479 merged'], ['figma', 'Handoff approved']] },
      { id: 'd5', kind: 'note', title: 'Review notes added to CHK-145', audience: 'team', conf: 0.88, ticket: 'CHK-145', t: -240,
        text: 'Wallet buttons stay above the card form on mobile. Sam is checking Google Pay sizing before we lock it.', sources: [['zoom', 'Wallet placement review'], ['jira', 'CHK-145']] },
      { id: 'd6', kind: 'link', title: 'PR #482 linked to CHK-138', audience: 'team', conf: 0.99, ticket: 'CHK-138', t: -190,
        text: 'Linked Sam’s PR #482 (saved cards) to CHK-138 so design review happens in one place.', sources: [['github', 'PR #482'], ['jira', 'CHK-138']] },
      { id: 'd7', kind: 'progress', title: 'DS-212 spec about 60% complete', audience: 'team', conf: 0.81, ticket: 'DS-212', t: -95,
        text: 'Select is fully specced: states, keyboard and density. Combobox is next, and I’m aiming to share the full spec Thursday.', sources: [['figma', 'Harbor · Select']] },
      { id: 'd8', kind: 'recap', title: 'Kickoff recap for attendees', audience: 'team', conf: 0.90, t: -22,
        text: 'Recap from the error-states kickoff: we’re designing declined, expired and 3DS failure states first. Leo owns the error-code map; I’ll have flows by Thursday.', sources: [['zoom', 'Error states kickoff'], ['gdocs', 'Kickoff notes']] },
      { id: 'd9', kind: 'estimate', title: 'CHK-142 target moves one day', audience: 'manager', conf: 0.86, ticket: 'CHK-142', t: -40, sensitive: true, reason: 'Changes a date your manager tracks',
        text: 'Heads up: the payment method selector needs about a day more than planned. Wallet states were bigger than scoped, so the new target is Thursday.', sources: [['jira', 'CHK-142 estimate'], ['figma', '14 new frames']] },
      { id: 'd10', kind: 'blocker', title: 'Blocker that names Leo', audience: 'team', conf: 0.78, ticket: 'CHK-150', t: -30, sensitive: true, reason: 'Mentions a teammate. Check the tone before it posts',
        text: 'Waiting on the 3DS error-code list from Leo before I can finish the failure states. Not urgent until Wednesday.', sources: [['slack', '#checkout-eng thread'], ['jira', 'CHK-150']] },
      { id: 'd11', kind: 'summary', title: 'Weekly summary for Rosa', audience: 'manager', conf: 0.73, t: -15, sensitive: true, reason: 'One claim is low confidence (73%)', weak: 'wallet states',
        text: 'This week I shipped the invoice PDF header, moved the payment method selector into hi-fi and kicked off checkout error states. Next up: wallet states and the Select spec. One risk: the selector slips a day.', sources: [['jira', '5 tickets'], ['figma', '3 files'], ['zoom', '2 meetings']] },
      { id: 'd12', kind: 'private', title: '1:1 with Rosa · career conversation', audience: 'manager', conf: 0.95, t: -1690, sensitive: true, private: true, reason: 'Matches a private topic: Compensation & career',
        text: 'Talked through promotion timing and scope for next half.', sources: [['gcal', '1:1 Maya / Rosa']] }
    ];

    var history = [
      { id: 'h1', t: B(prev, '17:05'), audience: 'team', via: 'auto', text: 'Handed off the invoice PDF header to Sam. Totals block and tax lines are ready for build.', sources: [['figma', 'Invoices 2.0 · PDF'], ['jira', 'INV-88']] },
      { id: 'h2', t: B(prev, '16:32'), audience: 'manager', via: 'approved', text: 'INV-88 is in handoff a day early. Next focus is the payment method selector for Checkout v3.', sources: [['jira', 'INV-88'], ['figma', 'Invoices 2.0 · PDF']] },
      { id: 'h3', t: B(prev, '12:10'), audience: 'team', via: 'auto', text: 'Posted three layout options for the payment method selector in #checkout-design. Leaning toward the segmented list.', sources: [['slack', '#checkout-design'], ['figma', 'Payment methods']] },
      { id: 'h4', t: B(prev, '09:31'), audience: 'team', via: 'auto', text: 'Standup: finishing INV-88 handoff today, then back on CHK-142. No blockers.', sources: [['jira', '2 tickets'], ['gcal', 'Calendar']] },
      { id: 'h5', t: B(prev - 1, '17:20'), audience: 'exec', via: 'approved', text: 'Checkout v3 design is on track for the October release. Payment methods and wallets are the remaining design work.', sources: [['jira', 'Checkout v3 epic']] },
      { id: 'h6', t: B(prev - 1, '15:02'), audience: 'team', via: 'auto', text: 'Selector audit is done: 71% of mobile buyers never open the “More payment methods” menu. Using that to justify the redesign.', sources: [['ai', 'Funnel analysis chat'], ['gdocs', 'Selector audit']] },
      { id: 'h7', t: B(prev - 1, '09:32'), audience: 'team', via: 'auto', text: 'Standup: selector audit today, wallet review with Sam at 2. No blockers.', sources: [['jira', 'CHK-142'], ['gcal', 'Calendar']] },
      { id: 'h8', t: B(prev - 2, '16:45'), audience: 'manager', via: 'approved', text: 'Took on DS-212 (Select and Combobox for Harbor). It unblocks three teams, and I’ll fit it around Checkout work.', sources: [['jira', 'DS-212']] },
      { id: 'h9', t: B(prev - 2, '11:15'), audience: 'team', via: 'auto', text: 'Shared wallet placement options in Figma for review. Two directions, both following the Apple Pay and Google Pay guidelines.', sources: [['figma', 'Checkout v3 · Wallets']] },
      { id: 'h10', t: B(prev - 3, '17:40'), audience: 'exec', via: 'approved', text: 'Invoices 2.0: new PDF layout is designed and in build. Merchants asked for this in 38 support tickets last quarter.', sources: [['jira', 'INV epic'], ['gdocs', 'Support themes Q3']] }
    ];

    var asks = [
      { id: 'a1', who: 'rosa', t: -200, audience: 'manager', q: 'Where is Checkout v3 design at?', a: 'Payment methods are in high fidelity and wallet placement is in review with Sam. Error states kicked off today. The selector may land a day late (Thursday). That update is waiting in Maya’s digest, so it hasn’t been shared yet.', used: ['Published status', 'CHK-142', 'CHK-145'], withheld: 1 },
      { id: 'a2', who: 'sam', t: -330, audience: 'team', q: 'Has Maya finalized the wallet button sizes?', a: 'Not yet. Placement is decided (above the card form on mobile), but sizing waits on your Google Pay check. It’s noted on CHK-145.', used: ['CHK-145', 'Wallet placement review'], withheld: 0 },
      { id: 'a3', who: 'ethan', t: B(prev, '18:05'), audience: 'exec', q: 'Is Checkout v3 on track for October?', a: 'Yes. Design is on track; payment methods and error states are the remaining pieces, both scheduled this sprint.', used: ['Published status', 'Checkout v3 epic'], withheld: 0 }
    ];

    var notifications = [
      { id: 'n1', t: -8,   icon: 'digest', title: '4 updates are waiting for you', body: 'Your digest closes at 4:30 PM. It takes about two minutes.', nav: '#/digest', unread: true },
      { id: 'n2', t: -200, icon: 'manager', title: 'Rosa asked Halo about Checkout v3', body: 'Halo answered from your published status and held back one unapproved update.', nav: '#/history/asks', unread: true },
      { id: 'n3', t: -22,  icon: 'wand', title: 'Kickoff recap is ready', body: 'Halo drafted 1 ticket and 6 subtasks from “Checkout v3: error states kickoff”.', nav: '#/recap/kickoff', unread: true },
      { id: 'n4', t: -1440,icon: 'alert', title: 'Zoom needs to be reconnected', body: 'Access expired, so new meeting recaps are paused.', nav: '#/sources/zoom', unread: false },
      { id: 'n5', t: -330, icon: 'teammate', title: 'Sam asked about wallet sizes', body: 'Answered from CHK-145.', nav: '#/history/asks', unread: false },
      { id: 'n6', t: B(prev, '18:20'), icon: 'fingerprint', title: 'Your voice model was refreshed', body: 'Trained on 42 new samples you approved. Nothing left your Halo.', nav: '#/privacy/voice', unread: false }
    ];

    var team = {
      sam:   { status: 'Wrapping up saved cards (CHK-138). PR #482 is in review and should merge Thursday.', t: -95, focus: 'CHK-138', mode: 'balanced', shipped: ['CHK-136 Success page'], blockers: [], load: 0.82 },
      priya: { status: 'Writing the Checkout v3 launch plan, and scoping tax and tip line items for mobile (CHK-153) with restaurant merchants.', t: -60, focus: 'CHK-153', mode: 'curated', shipped: [], blockers: [], load: 0.7 },
      leo:   { status: 'Blocked on processor sandbox access for 3DS retries (CHK-150). Bulk-send invoices is in review in the meantime.', t: -140, focus: 'CHK-150', mode: 'ambient', shipped: [], blockers: ['Waiting on sandbox access from the card processor'], load: 0.64 },
      hana:  { status: 'Funnel events are live for steps 1 to 3 of checkout. Dashboard draft shares tomorrow.', t: -35, focus: 'CHK-149', mode: 'balanced', shipped: ['Funnel event schema'], blockers: [], load: 0.75 },
      nora:  { status: 'Sprint is on track. Watching the 3DS sandbox dependency with the processor’s support team.', t: -300, focus: null, mode: 'curated', shipped: [], blockers: [], load: 0.6 }
    };

    return {
      v: 3,
      session: { onboarded: false, tourDone: false, welcomeSeen: false },
      me: 'maya',
      workspace: { name: 'Brightwater', domain: 'brightwater.co', plan: 'Business', seats: 48 },
      prefs: {
        theme: 'system', mode: 'balanced', digestTime: '16:30', quiet: { on: true, from: '18:30', to: '08:30' }, sound: true, motion: 'system',
        askAudience: 'manager', ticketsView: 'list', ticketsScope: 'mine', calView: 'week',
        notify: { digest: true, asks: true, mentions: true, weekly: true, sources: true, email: false, push: true },
        ai: { model: 'claude-haiku-4-5-20251001' }
      },
      sources: H.SOURCES.reduce(function (m, s) { m[s.id] = { status: s.status, sync: s.sync, today: s.today || 0, useStatus: s.useStatus !== false, useVoice: !!s.useVoice, error: s.error || null }; return m; }, {}),
      tickets: tickets,
      events: events,
      digest: { closesAt: S(0, '16:30'), items: digest, decisions: {} },
      history: history,
      asks: asks,
      notifications: notifications,
      team: team,
      chat: { threads: [], active: null },
      recaps: { kickoff: { created: null } },
      voice: {
        tone: { length: 32, formality: 38, technical: 55 },
        phrases: ['Heads up:', 'Quick update:', 'aiming for', 'one risk:'],
        avoid: ['circle back', 'synergy', 'just checking in', 'exclamation marks'],
        samples: { slack: 128, jira: 46, gdocs: 18 }, trained: B(prev, '18:20'), fingerprint: 'VF-7Q2K-M9C4', paused: false
      },
      privacy: {
        topics: [
          { id: 'career', label: 'Compensation & career', hint: 'Promotions, reviews, salary, offers', on: true, hits: 1 },
          { id: 'oneonone', label: '1:1 conversations', hint: 'Anything from meetings with only you and one other person', on: true, hits: 3 },
          { id: 'health', label: 'Health & personal time', hint: 'Appointments, leave, anything marked personal', on: true, hits: 0 },
          { id: 'recruiting', label: 'Recruiting & interviews', hint: 'Candidate names, feedback, hiring decisions', on: true, hits: 0 }
        ],
        matrix: {
          progress: { team: 'full', manager: 'full', exec: 'summary' },
          time:     { team: 'hidden', manager: 'summary', exec: 'hidden' },
          meetings: { team: 'summary', manager: 'summary', exec: 'hidden' },
          blockers: { team: 'full', manager: 'full', exec: 'summary' },
          activity: { team: 'summary', manager: 'hidden', exec: 'hidden' }
        },
        retention: 90, paused: false
      }
    };
  };
})(window.H = window.H || {});

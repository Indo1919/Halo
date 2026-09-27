/* Not found + small shared screens. */
(function (H) {
  'use strict';
  H.screens.notfound = {
    title: 'Not found',
    render: function (r) {
      return '<div class="empty" style="padding:96px 24px"><div class="empty-art">' + H.icon('compass', 28) + '</div><h3>This page doesn’t exist</h3>' +
        '<p>The link may be old, or the item was removed. Everything else in your Halo is where you left it.</p><div class="mt-4 row gap-2">' +
        H.ui.btn('Go back', { action: 'go-back' }) + H.ui.btn('Go to Home', { kind: 'primary', action: 'nav', attrs: { 'data-to': '#/home' } }) + '</div></div>';
    },
    actions: { 'go-back': function () { H.back('#/home'); } }
  };
})(window.H = window.H || {});

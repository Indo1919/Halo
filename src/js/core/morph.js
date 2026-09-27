/* Minimal DOM morphing: patches the live tree to match new markup so focus, scroll,
   running transitions and input state survive re-renders.
   - data-key="…" keys siblings for stable reordering.
   - data-morph="skip" keeps an element's children untouched (imperatively managed regions).
   - data-morph="replace" swaps the element wholesale (forces enter animations). */
(function (H) {
  'use strict';
  function key(n) { return n.nodeType === 1 ? n.getAttribute('data-key') : null; }
  function same(a, b) { return a.nodeType === b.nodeType && (a.nodeType !== 1 || (a.tagName === b.tagName && a.id === b.id)); }

  function syncAttrs(a, b) {
    var i, at, bs = b.attributes, as = a.attributes;
    for (i = as.length - 1; i >= 0; i--) { at = as[i]; if (!b.hasAttribute(at.name)) a.removeAttribute(at.name); }
    for (i = 0; i < bs.length; i++) { at = bs[i]; if (a.getAttribute(at.name) !== at.value) a.setAttribute(at.name, at.value); }
  }
  function syncForm(a, b) {
    var tag = a.tagName;
    if (tag === 'INPUT') {
      var type = (a.type || '').toLowerCase();
      if (type === 'checkbox' || type === 'radio') { a.checked = b.hasAttribute('checked'); return; }
      if (document.activeElement !== a || b.hasAttribute('data-force')) {
        var v = b.getAttribute('value') || ''; if (a.value !== v) a.value = v;
      }
    } else if (tag === 'TEXTAREA') {
      if (document.activeElement !== a || b.hasAttribute('data-force')) { var tv = b.value; if (a.value !== tv) a.value = tv; }
    } else if (tag === 'SELECT') {
      var sel = b.querySelector('option[selected]'); if (sel && a.value !== sel.value) a.value = sel.value;
    }
  }
  function morphNode(a, b) {
    if (a.nodeType === 3 || a.nodeType === 8) { if (a.nodeValue !== b.nodeValue) a.nodeValue = b.nodeValue; return; }
    if (b.getAttribute('data-morph') === 'replace' && a.outerHTML !== b.outerHTML) { a.parentNode.replaceChild(b, a); return; }
    syncAttrs(a, b);
    if (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT') { if (a.tagName !== 'SELECT') { syncForm(a, b); return; } }
    if (b.getAttribute('data-morph') === 'skip' && a.childNodes.length) return;
    morphChildren(a, b);
    if (a.tagName === 'SELECT') syncForm(a, b);
  }
  function morphChildren(from, to) {
    var toKids = Array.prototype.slice.call(to.childNodes), keyed = {}, i, n;
    for (i = 0; i < from.childNodes.length; i++) { n = from.childNodes[i]; var k = key(n); if (k) keyed[k] = n; }
    for (i = 0; i < toKids.length; i++) {
      var tn = toKids[i], cur = from.childNodes[i] || null, tk = key(tn), match = null;
      if (tk && keyed[tk] && same(keyed[tk], tn)) { match = keyed[tk]; delete keyed[tk]; }
      else if (cur && !key(cur) && !tk && same(cur, tn)) match = cur;
      if (match) {
        if (match !== cur) from.insertBefore(match, cur);
        morphNode(match, tn);
      } else {
        from.insertBefore(tn, cur);
      }
    }
    while (from.childNodes.length > toKids.length) from.removeChild(from.lastChild);
  }
  H.morph = function (el, html) {
    var t = document.createElement('template'); t.innerHTML = html;
    morphChildren(el, t.content);
  };
})(window.H = window.H || {});

/**
 * Favorites – Alpine store + toggleFavorite handler.
 *
 * Registers:
 *   - Alpine.store('favorites') – reactive list of favorited property SKUs
 *   - window.toggleFavorite(buttonEl) – click handler for favorite buttons
 *
 * Persistence: localStorage key 'favorites' (JSON array of SKU strings).
 * The server never reads this list directly — the /favoritos page fetches
 * a server-rendered fragment using these SKUs (see favorites-page.js).
 */
(function () {
  'use strict';

  var LS_KEY = 'favorites';
  var LEGACY_COOKIE = 'vp_favs';

  function sanitizeSku(s) {
    return String(s).trim().replace(/[^a-zA-Z0-9\-]/g, '').slice(0, 50);
  }

  function sanitizeList(list) {
    var seen = {};
    var out = [];
    for (var i = 0; i < list.length && out.length < 200; i++) {
      var sku = sanitizeSku(list[i]);
      if (sku && !seen[sku]) { seen[sku] = 1; out.push(sku); }
    }
    return out;
  }

  function loadFromStorage() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? sanitizeList(parsed) : null;
    } catch (e) { return null; }
  }

  function persist(list) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch (e) {}
  }

  // One-time reverse migration: prior versions wrote the favorites list to
  // the `vp_favs` cookie. If this user is coming from that version and has a
  // cookie but an empty localStorage, seed localStorage from the cookie.
  // Either way, clear the cookie so we stop sending it on every request.
  function migrateFromCookie() {
    try {
      var match = document.cookie
        .split(';')
        .map(function (s) { return s.trim(); })
        .find(function (s) { return s.indexOf(LEGACY_COOKIE + '=') === 0; });
      if (!match) return;

      var raw = decodeURIComponent(match.slice(LEGACY_COOKIE.length + 1));
      if (raw && loadFromStorage() === null) {
        persist(sanitizeList(raw.split(',')));
      }
      // Always expire the cookie
      document.cookie = LEGACY_COOKIE + '=; Path=/; Max-Age=0; SameSite=Lax';
    } catch (e) {}
  }

  window.toggleFavorite = function (buttonEl) {
    var sku = buttonEl.dataset.propertySku;
    if (!sku) return;
    if (typeof Alpine === 'undefined' || !Alpine.store('favorites')) return;
    Alpine.store('favorites').toggle(sku);
  };

  document.addEventListener('alpine:init', function () {
    migrateFromCookie();

    Alpine.store('favorites', {
      list: loadFromStorage() || [],
      get count() { return this.list.length; },
      toggle: function (sku) {
        sku = sanitizeSku(sku);
        if (!sku) return;
        var i = this.list.indexOf(sku);
        var added = false;
        if (i >= 0) this.list.splice(i, 1);
        else if (this.list.length < 200) { this.list.push(sku); added = true; }
        persist(this.list);
        // Avisa a página para mostrar o "Ver imóveis favoritos" por alguns segundos
        if (added) window.dispatchEvent(new CustomEvent('favorites-added', { detail: { sku: sku } }));
      },
      remove: function (sku) {
        sku = sanitizeSku(sku);
        var i = this.list.indexOf(sku);
        if (i >= 0) {
          this.list.splice(i, 1);
          persist(this.list);
        }
      },
      clear: function () {
        this.list = [];
        persist(this.list);
      },
      is: function (sku) {
        return this.list.includes(sanitizeSku(sku));
      }
    });

    // Cross-tab sync: keep the store in step with changes from other tabs.
    window.addEventListener('storage', function (e) {
      if (e.key !== LS_KEY) return;
      var fresh = loadFromStorage() || [];
      Alpine.store('favorites').list = fresh;
    });
  });
})();

/**
 * favoritesPage – Alpine component for /favoritos.
 *
 * The page ships a static shell (cacheable at the edge). On mount we:
 *   1) Read the favorite SKUs from the Alpine store (backed by localStorage).
 *   2) Fetch a server-rendered HTML fragment from /_fragments/favorites-cards
 *      which uses the same property-card partial as the listing page.
 *   3) Inject it into [data-favorites-mount] and re-init card Swipers.
 *
 * Pagination uses ?page=N in the URL; the links in the fragment are
 * intercepted so navigation stays on the same page without a full reload.
 *
 * Removing a favorite from a card: we observe the store and delete the
 * matching [data-favorite-item]. If the current page empties, we reload
 * the fragment (which may land on a previous page or the empty state).
 */
function favoritesPage() {
  return {
    loading: true,
    currentPage: 1,

    init() {
      var self = this;

      // Initial page from URL
      var params = new URLSearchParams(window.location.search);
      var p = parseInt(params.get('page') || '1', 10);
      this.currentPage = isNaN(p) || p < 1 ? 1 : p;

      // First load
      this.load();

      // Watch for unfavorites on this page: if a SKU is removed from the
      // store, drop its card from the DOM. If the grid empties, refetch.
      var previous = window.Alpine.store('favorites').list.slice();
      this.$watch('$store.favorites.list', function (current) {
        var removed = previous.filter(function (sku) {
          return current.indexOf(sku) === -1;
        });
        removed.forEach(function (sku) {
          var safe = String(sku).replace(/[^a-zA-Z0-9\-]/g, '');
          if (!safe) return;
          var el = document.querySelector('[data-favorite-item][data-property-sku="' + safe + '"]');
          if (el && el.parentNode) el.parentNode.removeChild(el);
        });
        previous = current.slice();

        var mount = document.querySelector('[data-favorites-mount]');
        if (mount && !mount.querySelector('[data-favorite-item]') && current.length > 0) {
          // Current page is now empty but favorites still exist elsewhere
          // (e.g. user removed all items on page 2 of 3). Reload the fragment.
          self.load();
        }
      });

      // Intercept pagination links inside the fragment
      document.addEventListener('click', function (e) {
        var link = e.target.closest('[data-favorites-page-link]');
        if (!link) return;
        e.preventDefault();
        var href = link.getAttribute('href') || '';
        var match = href.match(/page=(\d+)/);
        if (!match) return;
        var page = parseInt(match[1], 10);
        if (isNaN(page) || page < 1) return;
        self.currentPage = page;
        var url = new URL(window.location.href);
        url.searchParams.set('page', String(page));
        window.history.pushState({}, '', url.toString());
        self.load();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      // Handle browser back/forward
      window.addEventListener('popstate', function () {
        var params = new URLSearchParams(window.location.search);
        var p = parseInt(params.get('page') || '1', 10);
        self.currentPage = isNaN(p) || p < 1 ? 1 : p;
        self.load();
      });
    },

    load() {
      var self = this;
      var list = window.Alpine.store('favorites').list;
      var mount = document.querySelector('[data-favorites-mount]');
      if (!mount) return;

      if (list.length === 0) {
        mount.innerHTML = '';
        this.loading = false;
        return;
      }

      this.loading = true;
      var skus = list.join(',');
      var url = '/_fragments/favorites-cards?skus=' + encodeURIComponent(skus) + '&page=' + this.currentPage;

      fetch(url, { credentials: 'same-origin' })
        .then(function (res) {
          if (!res.ok) return { html: '', missing: [] };
          var missingHeader = res.headers.get('X-Missing-Skus') || '';
          var missing = missingHeader.split(',').filter(Boolean);
          return res.text().then(function (html) { return { html: html, missing: missing }; });
        })
        .then(function (result) {
          mount.innerHTML = result.html;
          // Drop SKUs the server couldn't resolve (deleted/archived imóveis)
          // so the count + heart icons stay in sync with reality.
          if (result.missing && result.missing.length > 0) {
            var store = window.Alpine && window.Alpine.store('favorites');
            if (store) result.missing.forEach(function (sku) { store.remove(sku); });
          }
        })
        .catch(function () {
          mount.innerHTML = '';
        })
        .finally(function () {
          // Flip loading off first so x-show reveals the mount, then init
          // Alpine + Swipers on the next frame. vpInitSwipers skips elements
          // whose offsetParent is still null (hidden), and Alpine needs
          // initTree to discover directives inside freshly injected HTML.
          self.loading = false;
          requestAnimationFrame(function () {
            if (window.Alpine && typeof window.Alpine.initTree === 'function') {
              window.Alpine.initTree(mount);
            }
            if (typeof window.vpInitSwipers === 'function') {
              window.vpInitSwipers(mount);
            }
          });
        });
    },

    clearAll() {
      if (!confirm('Tem certeza que deseja remover todos os favoritos?')) return;
      var store = window.Alpine && window.Alpine.store('favorites');
      if (store) store.clear();
      var mount = document.querySelector('[data-favorites-mount]');
      if (mount) mount.innerHTML = '';
      this.loading = false;
    }
  };
}

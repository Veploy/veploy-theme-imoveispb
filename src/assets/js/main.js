/**
 * Tema Base – JS orchestrator
 *
 * Responsibilities:
 *   - Expose shared config (CURRENCY_MASKS)
 *   - Init property card Swipers
 *   - Page transition loading bar
 *
 * Alpine components auto-register themselves via alpine:init
 * in their own files — no manual wiring needed here.
 *
 * Load order defined in config/scripts.json.
 */

window.CURRENCY_MASKS = {
  BRL: { radix: ',', mapToRadix: ['.'], thousandsSeparator: '.', symbol: 'R$ ', scale: 2 },
  USD: { radix: '.', mapToRadix: [','], thousandsSeparator: ',', symbol: '$', scale: 2 },
  EUR: { radix: ',', mapToRadix: ['.'], thousandsSeparator: '.', symbol: '€ ', scale: 2 },
};

(function () {
  'use strict';

  // ── Property Card Swipers ──────────────────────────────
  function initPropertyCardSwipers(root) {
    if (typeof Swiper === 'undefined') return;
    root.querySelectorAll('[data-swiper-id]').forEach(function (el) {
      if (!el.className || !el.className.includes('property-card-swiper')) return;
      if (el.offsetParent === null) return;
      var id = el.dataset.swiperId;
      if (!id) return;
      if (el.swiper) { el.swiper.update(); return; }
      var next = el.querySelector('.swiper-button-next-' + id);
      var prev = el.querySelector('.swiper-button-prev-' + id);
      var config = {
        loop: false,
        slidesPerView: 1,
        speed: 300,
        effect: 'fade',
        fadeEffect: { crossFade: true },
      };
      if (next && prev) {
        config.navigation = { nextEl: next, prevEl: prev, disabledClass: 'swiper-nav-disabled' };
      }
      new Swiper(el, config);
    });
  }

  // ── Page Transition Loading Bar ────────────────────────
  function initPageTransition() {
    var loadingBar = document.getElementById('pageLoadingBar');
    if (!loadingBar) return;
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a');
      if (!link) return;
      var href = link.getAttribute('href');
      if (!href) return;
      if (link.target === '_blank' ||
          link.hasAttribute('download') ||
          href.startsWith('#') ||
          href.startsWith('mailto:') ||
          href.startsWith('tel:') ||
          href.startsWith('javascript:') ||
          href.startsWith('http') && !href.startsWith(window.location.origin)) {
        return;
      }
      loadingBar.classList.add('active');
    });
    window.addEventListener('pageshow', function (e) {
      if (e.persisted) {
        loadingBar.classList.remove('active');
      }
    });
  }

  // ── Init ───────────────────────────────────────────────
  window.vpInitSwipers = initPropertyCardSwipers;

  var root = document.querySelector('main') || document;
  initPropertyCardSwipers(root);
  initPageTransition();

  // Re-run after Alpine initializes so x-show elements are visible
  document.addEventListener('alpine:initialized', function () {
    initPropertyCardSwipers(document);
  });
})();

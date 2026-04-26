/**
 * Hero Swiper — Alpine.data component for hero carousel initialization.
 * Auto-registers on alpine:init.
 *
 * Usage in .ploy: x-data="heroSwiper"
 * Requires: Swiper
 */
document.addEventListener('alpine:init', function () {
  Alpine.data('heroSwiper', function () {
    return {
      init: function () {
        var el = this.$el;
        var doInit = function () {
          if (typeof Swiper === 'undefined') return;
          new Swiper(el, {
            loop: true,
            speed: 80,
            autoplay: { delay: 5000, disableOnInteraction: false },
            effect: 'fade',
            fadeEffect: { crossFade: true },
            pagination: { el: el.querySelector('.swiper-pagination'), clickable: true },
            navigation: { nextEl: el.querySelector('.swiper-button-next'), prevEl: el.querySelector('.swiper-button-prev') }
          });
        };
        if ('requestIdleCallback' in window) {
          requestIdleCallback(doInit, { timeout: 500 });
        } else {
          setTimeout(doInit, 100);
        }
      }
    };
  });
});

/**
 * Gallery Modal — Swiper-based fullscreen image gallery.
 * Used on property detail page.
 *
 * Expects in the DOM:
 *   #galleryModal, #galleryCounter, .gallerySwiper, .galleryThumbs
 */
(function() {
  'use strict';

  var modal = document.getElementById('galleryModal');
  var counter = document.getElementById('galleryCounter');
  if (!modal) return;

  var mainSwiper = null;
  var thumbsSwiper = null;
  var initialized = false;

  function initSwipers() {
    if (initialized) return;
    initialized = true;

    thumbsSwiper = new Swiper('.galleryThumbs', {
      spaceBetween: 12,
      slidesPerView: 'auto',
      centeredSlides: true,
      slideToClickedSlide: true,
      watchSlidesProgress: true
    });

    mainSwiper = new Swiper('.gallerySwiper', {
      effect: 'fade',
      fadeEffect: { crossFade: true },
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev'
      },
      thumbs: { swiper: thumbsSwiper },
      keyboard: { enabled: true, onlyInViewport: false },
      on: {
        slideChange: function() {
          if (counter) counter.textContent = this.activeIndex + 1;
          if (thumbsSwiper) thumbsSwiper.slideTo(this.activeIndex);
        }
      }
    });
  }

  window.openGalleryModal = function(index) {
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    var idx = index || 0;
    if (!initialized) {
      requestAnimationFrame(function() {
        initSwipers();
        if (mainSwiper) mainSwiper.slideTo(idx, 0);
        if (thumbsSwiper) thumbsSwiper.slideTo(idx, 0);
        if (counter) counter.textContent = idx + 1;
      });
    } else {
      if (mainSwiper) mainSwiper.slideTo(idx, 0);
      if (thumbsSwiper) thumbsSwiper.slideTo(idx, 0);
      if (counter) counter.textContent = idx + 1;
    }
  };

  window.closeGalleryModal = function() {
    if (!modal) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      closeGalleryModal();
    }
  });
})();

/**
 * Mobile CTA Drawer — bottom sheet for WhatsApp / Visit actions on property page.
 *
 * Expects in the DOM:
 *   #mobileCTADrawer, #mobileCTABackdrop, #mobileCTASheet
 *   #mobileCTAWA, #mobileCTAVisit
 *   [data-mobile-cta="wa|visit"] buttons
 */
(function() {
  'use strict';

  var drawer   = document.getElementById('mobileCTADrawer');
  var backdrop = document.getElementById('mobileCTABackdrop');
  var sheet    = document.getElementById('mobileCTASheet');
  var waPanel  = document.getElementById('mobileCTAWA');
  var visitPanel = document.getElementById('mobileCTAVisit');
  if (!drawer) return;

  function openDrawer(action) {
    waPanel.classList.toggle('hidden', action !== 'wa');
    visitPanel.classList.toggle('hidden', action !== 'visit');
    drawer.classList.remove('hidden');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function() {
      backdrop.classList.remove('opacity-0');
      sheet.classList.remove('translate-y-full');
    });
  }

  window.closeMobileCTADrawer = function() {
    backdrop.classList.add('opacity-0');
    sheet.classList.add('translate-y-full');
    sheet.addEventListener('transitionend', function hide() {
      drawer.classList.add('hidden');
      drawer.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      sheet.removeEventListener('transitionend', hide);
    });
  };

  document.querySelectorAll('[data-mobile-cta]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      openDrawer(btn.getAttribute('data-mobile-cta'));
    });
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && !drawer.classList.contains('hidden')) {
      closeMobileCTADrawer();
    }
  });
})();

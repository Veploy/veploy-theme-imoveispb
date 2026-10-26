/**
 * Entrada das seções ao rolar.
 *
 * Porta os efeitos de entrada do Elementor usado em produção: o elemento entra
 * deslocado e transparente e assenta no lugar quando aparece na tela.
 *
 * No HTML:
 *   data-reveal="up|down|left|right|fade"  — de onde o elemento vem
 *                                            (fade: só opacidade, sem deslocar)
 *   data-reveal-delay="200"                — atraso em ms (opcional)
 *
 * O CSS mora aqui, e não no theme.css: o estado escondido só existe se este
 * arquivo rodar. Se ele não carregar, nada fica escondido — o conteúdo aparece
 * normalmente. Como os scripts do tema são `defer`, a preparação acontece logo
 * depois de o HTML ser lido e antes da primeira pintura útil, sem piscada.
 *
 * Duração de 2s: é a classe `animated-slow` do Elementor, usada em todos os
 * elementos animados do site original.
 */
(function () {
  var items = document.querySelectorAll('[data-reveal]');
  if (!items.length) return;

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Sem suporte ao observer, ou com "menos movimento" ligado no sistema:
     não prepara nada e deixa tudo visível como está. */
  if (reduced || !('IntersectionObserver' in window)) return;

  var css =
    '.pb-reveal{opacity:0;transition:opacity 2s ease,transform 2s ease}' +
    '.pb-reveal[data-reveal="down"]{transform:translate3d(0,-40px,0)}' +
    '.pb-reveal[data-reveal="up"]{transform:translate3d(0,40px,0)}' +
    '.pb-reveal[data-reveal="left"]{transform:translate3d(-40px,0,0)}' +
    '.pb-reveal[data-reveal="right"]{transform:translate3d(40px,0,0)}' +
    '.pb-reveal.is-visible{opacity:1;transform:none}';
  var style = document.createElement('style');
  style.setAttribute('data-pb-reveal', '');
  style.appendChild(document.createTextNode(css));
  document.head.appendChild(style);

  var i;
  for (i = 0; i < items.length; i++) {
    items[i].classList.add('pb-reveal');
    var delay = items[i].getAttribute('data-reveal-delay');
    if (delay) items[i].style.transitionDelay = delay + 'ms';
  }

  var observer = new IntersectionObserver(function (entries) {
    for (var j = 0; j < entries.length; j++) {
      if (!entries[j].isIntersecting) continue;
      entries[j].target.classList.add('is-visible');
      /* Roda uma vez só: no original o elemento não volta a sumir ao subir */
      observer.unobserve(entries[j].target);
    }
  }, {
    /* Dispara com o elemento já uns 10% dentro da tela, não na borda exata */
    rootMargin: '0px 0px -10% 0px',
    threshold: 0
  });

  for (i = 0; i < items.length; i++) observer.observe(items[i]);
})();

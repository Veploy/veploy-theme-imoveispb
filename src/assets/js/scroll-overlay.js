/**
 * Sobreposição de rolagem: a seção marcada com [data-scroll-pinned] fica
 * parada no pé da tela enquanto a seção seguinte sobe por cima dela.
 * Vale no desktop e no mobile.
 *
 * Como funciona
 * -------------
 * A seção nunca sai do fluxo. O que se move é um `translateY`, que não afeta
 * layout nenhum: o espaço dela continua reservado, a seção de baixo é
 * posicionada normalmente logo após esse espaço e, tendo z-index maior e fundo
 * opaco, passa por cima.
 *
 * O deslocamento é uma função contínua da rolagem:
 *
 *     shift = clamp(0, maxShift, rolagem + altura_da_tela - base_natural)
 *
 * Em `shift = 0` a seção está exatamente onde o fluxo a colocou, e é esse o
 * instante em que ela começa a ser segurada. Não existe descontinuidade: o
 * valor cresce a partir do zero, pixel a pixel.
 *
 * Sempre pelo PÉ, inclusive quando a seção é mais alta que a tela
 * ---------------------------------------------------------------
 * Chegou a existir aqui uma "âncora pelo topo" para esse caso, com medo de
 * cortar o título. Era desnecessária e pior: congelava a seção mostrando só o
 * começo dela, e no mobile os cards de baixo eram cobertos antes de alguém os
 * ver. Segurando pelo pé, o efeito só começa quando a base da seção alcança o
 * fim da tela — ou seja, depois que o visitante já rolou por todo o conteúdo.
 * O topo ter saído de cena a essa altura é rolagem normal, não perda.
 *
 * Por que não `position: fixed`
 * -----------------------------
 * Alternar para `fixed; bottom: 0` num gatilho faz a borda inferior pular de
 * onde estava para o pé da tela. Esse pulo vale o tamanho do passo da rolagem:
 * 1–2px no trackpad (invisível), 50–100px na roda do mouse (bem visível).
 *
 * Por que não `position: sticky`
 * ------------------------------
 * `sticky; bottom: 0` empurra o elemento para CIMA até a borda inferior da
 * tela — serve para "aparecer antes da hora", não para "ficar para trás". Ele
 * grudava sobre o banner desde o topo da página.
 */
(function () {
  'use strict';

  /* A conta usa a altura da tela, e no mobile ela muda sozinha quando a barra
     de endereço do navegador recolhe. Se a seção reagisse a isso, ela daria um
     pulo do tamanho da barra no meio da rolagem. Então a altura fica guardada
     e só é renovada numa mudança grande — girar o aparelho ou redimensionar a
     janela de verdade. */
  var VH_TOLERANCE = 140;

  var el = document.querySelector('[data-scroll-pinned]');
  if (!el) return;
  var stack = el.parentElement;
  if (!stack) return;

  var bottomDoc = 0;     // base da seção, em coordenadas do documento
  var maxShift = 0;      // até onde pode descer sem sair do wrapper
  var vh = 0;            // altura da tela considerada (ver VH_TOLERANCE)
  var vw = 0;            // largura da tela na última medição
  var lastShift = -1;

  /** Mede a geometria natural. Precisa do transform zerado para não medir a si mesma. */
  function measure() {
    el.style.transform = '';
    lastShift = -1;

    vh = window.innerHeight;
    vw = window.innerWidth;

    var r = el.getBoundingClientRect();
    bottomDoc = r.bottom + window.scrollY;

    var s = stack.getBoundingClientRect();
    maxShift = Math.max(0, (s.bottom + window.scrollY) - bottomDoc);

    /* Nada de teto menor que isso.
       Houve aqui uma tentativa de limitar a cobertura para ela parar antes dos
       cards. Era errado por dois motivos: ao bater no limite a seção soltava e
       voltava a rolar junto (ela tem que ficar PARADA durante todo o efeito),
       e a seção de baixo ficava encostada na borda do último card, sem respiro.
       O espaço antes de a cobertura tocar os cards se resolve no CSS — margem
       da seção e padding do container —, não cortando o movimento. */
  }

  /* Roda direto no evento de scroll, sem requestAnimationFrame.
     Havia aqui um guarda `ticking` que agendava o trabalho num quadro de
     animação. Se esse quadro não chegasse, o guarda ficava preso em `true` e
     o efeito morria para o resto da sessão — e é exatamente o que acontece no
     Safari do iOS, que adia o rAF durante a rolagem por inércia.
     Não há o que economizar aqui: a conta é uma subtração e um clamp sobre
     valores já em cache, e a única escrita é um transform. Nenhuma leitura de
     layout, então não força reflow. */
  function render() {
    var raw = window.scrollY + vh - bottomDoc;
    var shift = Math.max(0, Math.min(maxShift, raw));
    if (shift === lastShift) return;
    lastShift = shift;
    el.style.transform = shift ? 'translate3d(0,' + shift + 'px,0)' : '';
  }

  /** Remede só quando a mudança é real, não quando é a barra de endereço. */
  function onResize() {
    var dh = Math.abs(window.innerHeight - vh);
    if (window.innerWidth === vw && dh < VH_TOLERANCE) return;
    resync();
  }

  function resync() {
    measure();
    render();
  }

  window.addEventListener('scroll', render, { passive: true });
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', resync);
  window.addEventListener('load', resync);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(resync).catch(function () {});
  }

  resync();
})();

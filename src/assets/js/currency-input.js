/**
 * Currency Input — Alpine.data component for IMask currency masking.
 * Auto-registers on alpine:init.
 *
 * Usage in .ploy: x-data="currencyInput" data-currency="BRL" data-init="1234.56"
 * Requires: IMask, window.CURRENCY_MASKS (main.js)
 */
document.addEventListener('alpine:init', function () {
  Alpine.data('currencyInput', function () {
    return {
      init: function () {
        var el = this.$el;
        var curr = el.dataset.currency || 'BRL';
        var cfg = (window.CURRENCY_MASKS && window.CURRENCY_MASKS[curr]) || window.CURRENCY_MASKS.BRL;
        var input = el.querySelector('input[type="text"]');
        var hidden = el.querySelector('input[type="hidden"]');
        var symbolEl = el.querySelector('.currency-symbol');
        if (!input || !hidden || typeof IMask === 'undefined') return;

        if (symbolEl) symbolEl.textContent = cfg.symbol.trim();

        var mask = IMask(input, {
          mask: 'num',
          blocks: { num: { mask: Number, scale: cfg.scale, radix: cfg.radix, mapToRadix: cfg.mapToRadix, thousandsSeparator: cfg.thousandsSeparator, padFractionalZeros: false, normalizeZeros: false } },
          lazy: false
        });
        var lastUnmasked = '';

        function toRaw(v) {
          if (!v && v !== 0) return '';
          var r = String(v).replace(',', '.');
          if (r.indexOf('.') === -1) { r += '.00'; }
          else {
            var parts = r.split('.');
            parts[1] = parts[1].substring(0, 2).padEnd(2, '0');
            r = parts.join('.');
          }
          return r;
        }
        function updateHidden() {
          hidden.value = toRaw(mask.masked && mask.masked.unmaskedValue);
        }

        mask.on('accept', function () {
          lastUnmasked = (mask.masked && mask.masked.unmaskedValue) || '';
          updateHidden();
        });
        input.addEventListener('blur', function () {
          var now = mask.masked && mask.masked.unmaskedValue;
          if (!lastUnmasked || !now) return;
          var lastFrac = (lastUnmasked.split(cfg.radix)[1] || '');
          var nowFrac = (now.split(cfg.radix)[1] || '');
          if (lastFrac.length > nowFrac.length) {
            mask.unmaskedValue = lastUnmasked;
            updateHidden();
          }
        });

        var initVal = (el.dataset.init || '').trim();
        if (initVal) {
          var s = initVal.replace(',', '.');
          var display = s;
          if (s.indexOf('.') !== -1 && s.split('.')[1] === '00') display = s.split('.')[0];
          mask.unmaskedValue = (cfg.radix === ',') ? display.replace('.', ',') : display;
          lastUnmasked = (mask.masked && mask.masked.unmaskedValue) || '';
        }
        updateHidden();
      }
    };
  });
});

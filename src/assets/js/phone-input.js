/**
 * Phone Input — Alpine.data component for IMask BR phone masking + validation.
 * Auto-registers on alpine:init.
 *
 * Usage in .ploy: x-data="phoneInput" data-init="11912345678"
 * Requires: IMask
 *
 * Validation rules (BR):
 *   Mobile:   DDD(2) + 9 + 8 digits = 11 digits
 *   Landline: DDD(2) + [2-5] + 7 digits = 10 digits
 *   DDD must be a valid Brazilian area code.
 *
 * Adds/removes `data-invalid` on the wrapper and `aria-invalid` on the
 * visible input so themes can style with [data-invalid] selectors.
 */
(function () {
  var VALID_DDDS = [
    11,12,13,14,15,16,17,18,19,
    21,22,24,27,28,
    31,32,33,34,35,37,38,
    41,42,43,44,45,46,47,48,49,
    51,53,54,55,
    61,62,63,64,65,66,67,68,69,
    71,73,74,75,77,79,
    81,82,83,84,85,86,87,88,89,
    91,92,93,94,95,96,97,98,99
  ];

  // Build a lookup set once
  var dddSet = {};
  for (var i = 0; i < VALID_DDDS.length; i++) dddSet[VALID_DDDS[i]] = true;

  function isValidBRPhone(digits) {
    if (!digits || digits.length < 10 || digits.length > 11) return false;

    var ddd = parseInt(digits.slice(0, 2), 10);
    if (!dddSet[ddd]) return false;

    var subscriber = digits.slice(2);

    if (subscriber.length === 9) {
      // Mobile: must start with 9
      return subscriber[0] === '9';
    }

    // Landline (8 digits): first digit 2-5
    return /^[2-5]/.test(subscriber);
  }

  document.addEventListener('alpine:init', function () {
    Alpine.data('phoneInput', function () {
      return {
        init: function () {
          var el = this.$el;
          var input = el.querySelector('input[type="text"]');
          var hidden = el.querySelector('input[type="hidden"]');
          if (!input || !hidden || typeof IMask === 'undefined') return;

          var mask = IMask(input, {
            mask: [
              { mask: '(00) 00000-0000' },
              { mask: '(00) 0000-0000' }
            ],
            dispatch: function (appended, dynamicMasked) {
              var number = dynamicMasked.unmaskedValue + appended;
              return number.length > 10 || (number.length === 3 && number[2] === '9')
                ? dynamicMasked.compiledMasks[0]
                : dynamicMasked.compiledMasks[1];
            },
            lazy: true
          });

          var isRequired = input.hasAttribute('required') || hidden.hasAttribute('required') || el.hasAttribute('data-required');

          function updateHidden() {
            var v = mask.masked && mask.masked.unmaskedValue;
            var digits = (v || '').replace(/\D/g, '');
            hidden.value = digits;
            hidden.dispatchEvent(new Event('input', { bubbles: true }));
          }

          function setError(show) {
            if (show) {
              el.classList.add('input-error');
              input.setAttribute('aria-invalid', 'true');
            } else {
              el.classList.remove('input-error');
              input.removeAttribute('aria-invalid');
            }
          }

          mask.on('accept', function () {
            updateHidden();
            // Clear error while typing if the number becomes valid
            if (hidden.value && isValidBRPhone(hidden.value)) setError(false);
          });

          // Validate only on blur — avoids race condition with IMask lazy cleanup
          input.addEventListener('blur', function () {
            var digits = hidden.value;
            if (!digits) {
              setError(isRequired);
            } else {
              setError(!isValidBRPhone(digits));
            }
          });

          var initVal = (el.dataset.init || '').replace(/\D/g, '');
          if (initVal) mask.unmaskedValue = initVal;
          updateHidden();
        }
      };
    });
  });

  // Expose for external use (e.g. custom theme validators)
  window.VpPhoneValidate = isValidBRPhone;
})();

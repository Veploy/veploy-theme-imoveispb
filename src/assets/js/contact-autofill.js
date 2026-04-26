/**
 * contact-autofill.js
 * Persists contact data (name, email, phone) in localStorage and auto-fills
 * any form that contains inputs whose name ends with [name], [email] or [phone].
 */
(function() {
  var STORAGE_KEY = 'vp_contact';

  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch(e) { return {}; }
  }

  function save(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
    catch(e) {}
  }

  function getField(container, suffix) {
    return container.querySelector('[name$="[' + suffix + ']"]');
  }

  function fillForm(form) {
    var data = load();
    if (!data.name && !data.email && !data.phone) return;

    var nameEl  = getField(form, 'name');
    var emailEl = getField(form, 'email');
    var phoneEl = getField(form, 'phone');

    if (nameEl  && data.name  && !nameEl.value) {
      nameEl.value = data.name;
      nameEl.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (emailEl && data.email && !emailEl.value) {
      emailEl.value = data.email;
      emailEl.dispatchEvent(new Event('input', { bubbles: true }));
    }

    if (phoneEl && data.phone && !phoneEl.value) {
      // Hidden input (IMask) — set value and fire input so IMask-driven visible input syncs
      phoneEl.value = data.phone;
      phoneEl.dispatchEvent(new Event('input', { bubbles: true }));

      // Also attempt to set the visible masked input via unmaskedValue
      var phoneContainer = phoneEl.closest('.phone-input');
      if (phoneContainer) {
        var visibleInput = phoneContainer.querySelector('input[type=text]');
        if (visibleInput) {
          visibleInput.value = data.phone;
          visibleInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    }
  }

  function watchForm(form) {
    if (form._vpAutofillWatched) return;
    form._vpAutofillWatched = true;

    form.addEventListener('submit', function() {
      var nameEl  = getField(form, 'name');
      var emailEl = getField(form, 'email');
      var phoneEl = getField(form, 'phone');
      var current = load();
      if (nameEl  && nameEl.value)  current.name  = nameEl.value;
      if (emailEl && emailEl.value) current.email = emailEl.value;
      if (phoneEl && phoneEl.value) current.phone = phoneEl.value;
      save(current);
    });

    // Also save on blur of each field (without requiring submit)
    [getField(form, 'name'), getField(form, 'email')].forEach(function(el) {
      if (!el) return;
      el.addEventListener('blur', function() {
        var current = load();
        current[el.name.replace(/.*\[(\w+)\]$/, '$1')] = el.value;
        save(current);
      });
    });
  }

  function processAllForms() {
    document.querySelectorAll('form').forEach(function(form) {
      fillForm(form);
      watchForm(form);
    });
  }

  // Run after Alpine has initialized (so x-model defaults don't overwrite autofill)
  document.addEventListener('alpine:initialized', processAllForms);

  // Expose globally so drawers/modals can trigger a re-fill after opening
  window.VpContactAutofill = { fill: processAllForms, save: save, load: load };
})();

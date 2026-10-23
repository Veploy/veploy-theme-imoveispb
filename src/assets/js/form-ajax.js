/**
 * Form AJAX Module
 * Handles all form submissions via AJAX
 * Security is handled by the backend engine
 */

(function () {
  'use strict';

  /**
   * Show loading state on form
   */
  function setFormLoading(form, loading) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const inputs = form.querySelectorAll('input, textarea, select, button');
    
    if (loading) {
      form.classList.add('form-loading');
      if (submitBtn) {
        submitBtn.dataset.originalText = submitBtn.textContent;
        submitBtn.textContent = 'Aguarde...';
        submitBtn.disabled = true;
      }
      inputs.forEach(function (input) {
        input.disabled = true;
      });
    } else {
      form.classList.remove('form-loading');
      if (submitBtn && submitBtn.dataset.originalText) {
        submitBtn.textContent = submitBtn.dataset.originalText;
        submitBtn.disabled = false;
      }
      inputs.forEach(function (input) {
        input.disabled = false;
      });
    }
  }

  // A mensagem vem da resposta do servidor e pode repetir o que o visitante
  // digitou: entra como texto, nunca como HTML.
  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /**
   * Show success message
   */
  function showSuccess(form, message) {
    const existingAlert = form.querySelector('.form-alert');
    if (existingAlert) existingAlert.remove();

    const alert = document.createElement('div');
    alert.className = 'form-alert form-alert-success';
    alert.innerHTML = `
      <div class="flex items-start gap-3 p-4 mb-4 rounded-lg bg-green-50 border border-green-200">
        <svg class="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
        </svg>
        <div class="flex-1">
          <p class="text-sm font-medium text-green-800">${escapeHtml(message)}</p>
        </div>
        <button type="button" class="text-green-600 hover:text-green-800" onclick="this.parentElement.parentElement.remove()">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
          </svg>
        </button>
      </div>
    `;
    form.insertBefore(alert, form.firstChild);
    alert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /**
   * Show error message
   */
  function showError(form, message) {
    const existingAlert = form.querySelector('.form-alert');
    if (existingAlert) existingAlert.remove();

    const alert = document.createElement('div');
    alert.className = 'form-alert form-alert-error';
    alert.innerHTML = `
      <div class="flex items-start gap-3 p-4 mb-4 rounded-lg bg-red-50 border border-red-200">
        <svg class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
        </svg>
        <div class="flex-1">
          <p class="text-sm font-medium text-red-800">${escapeHtml(message)}</p>
        </div>
        <button type="button" class="text-red-600 hover:text-red-800" onclick="this.parentElement.parentElement.remove()">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
          </svg>
        </button>
      </div>
    `;
    form.insertBefore(alert, form.firstChild);
    alert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /**
   * Submit form via AJAX
   */
  function submitForm(form, event) {
    if (event) event.preventDefault();

    // Remove previous alerts
    const existingAlert = form.querySelector('.form-alert');
    if (existingAlert) existingAlert.remove();

    // Validate form
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const action = form.action;
    const method = (form.dataset.ajaxMethod || form.method || 'POST').toUpperCase();
    const formData = new FormData(form);

    setFormLoading(form, true);

    // GA4: form_submit (tentativa de envio)
    if (window.VpAnalytics) {
      var submitFormName = formData.get('form_name') || form.getAttribute('name') || 'Formulário';
      var submitFormType = formData.get('form_type') || 'contact';
      window.VpAnalytics.formSubmit(submitFormName, submitFormType);
    }

    // For GET requests, convert FormData to query string and redirect or update page
    if (method === 'GET') {
      const params = new URLSearchParams();
      
      // Get array field names from form data attribute (set by server based on locale)
      const arrayFieldsAttr = form.dataset.arrayFields;
      const arrayFields = arrayFieldsAttr ? arrayFieldsAttr.split(',').map(f => f.trim()) : [];
      
      // Collect all values for each key
      const fieldValues = {};
      for (const [key, value] of formData.entries()) {
        if (value) {
          if (!fieldValues[key]) {
            fieldValues[key] = [];
          }
          fieldValues[key].push(String(value));
        }
      }
      
      // Build query string - always send array fields as array
      for (const [key, values] of Object.entries(fieldValues)) {
        if (arrayFields.includes(key)) {
          // Always send as array (even if single value)
          for (const value of values) {
            params.append(key + '[]', value);
          }
        } else {
          // Single value fields - use first value only
          params.append(key, values[0]);
        }
      }
      const url = action + '?' + params.toString();
      
      // Redirect to the new URL (for search/filter forms)
      window.location.href = url;
      return;
    }

    // POST/PUT/DELETE requests via fetch
    fetch(action, {
      method: method,
      body: formData,
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
      },
      credentials: 'same-origin',
    })
      .then(function (response) {
        return response.json().then(function (data) {
          return {
            ok: response.ok,
            status: response.status,
            data: data,
          };
        });
      })
      .then(function (result) {
        setFormLoading(form, false);

        if (result.ok) {
          const message = result.data.message || 'Formulário enviado com sucesso!';
          showSuccess(form, message);

          // GA4: generate_lead — capturar ANTES do reset (reset limpa os hidden inputs)
          if (window.VpAnalytics) {
            const leadFormName = form.getAttribute('name') || form.querySelector('[name="form_name"]')?.value || 'Formulário';
            const leadFormType = form.querySelector('[name="form_type"]')?.value || 'contact';
            const propertySku  = form.querySelector('[name*="[property_sku]"], [name*="[sku]"]')?.value || undefined;
            const leadAmount   = result.data.amount || 0;
            window.VpAnalytics.generateLead(leadFormName, leadFormType, Object.assign(
              { value: leadAmount },
              propertySku ? { property_sku: propertySku } : {}
            ));
          }

          // Reset form after success
          form.reset();

          // Trigger custom event
          form.dispatchEvent(new CustomEvent('form:success', {
            detail: result.data,
            bubbles: true
          }));
        } else {
          const message = result.data.message || 'Erro ao enviar formulário. Tente novamente.';
          showError(form, message);

          // Trigger custom event
          form.dispatchEvent(new CustomEvent('form:error', {
            detail: result.data,
            bubbles: true
          }));
        }
      })
      .catch(function (error) {
        setFormLoading(form, false);
        showError(form, 'Erro de conexão. Verifique sua internet e tente novamente.');
        console.error('Form submission error:', error);

        // Trigger custom event
        form.dispatchEvent(new CustomEvent('form:error', { 
          detail: { error: error.message },
          bubbles: true 
        }));
      });
  }

  /**
   * Initialize AJAX form
   */
  function initAjaxForm(form) {
    if (!form || form.dataset.ajaxInit) return;
    form.dataset.ajaxInit = 'true';

    form.addEventListener('submit', function (event) {
      submitForm(form, event);
    });
  }

  /**
   * Initialize all AJAX forms
   */
  function initAllForms() {
    document.querySelectorAll('form[data-ajax]').forEach(initAjaxForm);
  }

  // Auto-initialize
  if (typeof Alpine !== 'undefined') {
    document.addEventListener('alpine:init', function () {
      setTimeout(initAllForms, 100);
    });
  } else {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initAllForms);
    } else {
      initAllForms();
    }
  }

  // Expose public API
  window.FormAjax = {
    init: initAjaxForm,
    submit: submitForm,
  };
})();

/**
 * Location Filter — minimal Alpine component for location search.
 * Auto-registers on alpine:init.
 *
 * Usage: x-data="locationFilter({ searchApi, placeholder, initSelected, initLabels })"
 */
document.addEventListener('alpine:init', function () {
  Alpine.data('locationFilter', function (config) {
    return {
      open: false,
      query: '',
      results: [],
      loading: false,
      searched: false,
      editing: false,
      selectedValues: [],
      selectedItems: [],
      error: '',
      _hasTyped: false,
      _hadResults: false,
      _lastQuery: '',
      _lastResults: [],
      placeholder: config.placeholder || 'Digite para buscar...',

      get selectedLabel() {
        if (this.selectedItems.length === 0) return '';
        return this.selectedItems[0].label;
      },

      get extraCount() {
        return Math.max(0, this.selectedItems.length - 1);
      },
      _recentSearches: [],

      get recentSearches() {
        var self = this;
        return this._recentSearches.filter(function (r) {
          return self.selectedValues.indexOf(r.value) === -1;
        });
      },
      searchApi: config.searchApi,
      _debounce: null,
      _storageKey: 'vp_recent_locations',
      _typeLabels: { city: 'Cidades', neighborhood: 'Bairros', condominium: 'Condomínios' },
      _typeOrder: ['city', 'neighborhood', 'condominium'],

      get groupedResults() {
        var groups = {};
        var self = this;
        var selectedSet = {};
        this.selectedValues.forEach(function (v) { selectedSet[v] = true; });

        this.results.forEach(function (item) {
          if (selectedSet[item.value]) return; // skip already selected
          var type = item.type || 'other';
          if (!groups[type]) {
            groups[type] = { label: self._typeLabels[type] || type, items: [] };
          }
          groups[type].items.push(item);
        });
        return self._typeOrder
          .filter(function (key) { return groups[key]; })
          .map(function (key) { return groups[key]; })
          .concat(groups['other'] ? [groups['other']] : []);
      },

      init: function () {
        // Restore initial selection
        var initVals = (config.initSelected || '').split(',').filter(Boolean);
        var initLabels = config.initLabels || [];
        if (initVals.length > 0) {
          this.selectedValues = initVals;
          if (initLabels.length > 0) {
            this.selectedItems = initLabels.map(function (l) { return { value: l.value, label: l.label || l.value }; });
          } else {
            this.selectedItems = initVals.map(function (v) { return { value: v, label: v }; });
          }
          this.syncToNative();
        }

        this.loadRecent();

        // Watch query for search
        var self = this;
        this.$watch('query', function (val) {
          if (val.length > 0) self._hasTyped = true;
          if (val.length >= 2) {
            if (!self.open) self.open = true;
            self.search(val);
          }
        });

        // Close on click outside handled via @click.outside in template

        // Expose validate method for parent forms
        this.$el._locationFilter = this;

        // Intercept form submit in capture phase (runs before Alpine @submit.prevent)
        var form = this.$el.closest('form');
        if (form) {
          form.addEventListener('submit', function (e) {
            if (self._hasTyped && self.selectedValues.length === 0 && self._hadResults) {
              e.preventDefault();
              e.stopImmediatePropagation();
              self.error = 'Selecione uma localidade da lista';
              // Restore query and results that close() saved
              self.query = self._lastQuery;
              self.results = self._lastResults;
              self.editing = true;
              self.open = true;
              self.$nextTick(function () {
                if (self.$refs.input) self.$refs.input.focus();
              });
            }
          }, true); // capture phase
        }
      },

      onFocus: function () {
        this.editing = true;
        // Only open popover if there's something to show
        var hasContent = this.selectedItems.length > 0 || this.recentSearches.length > 0 || this.results.length > 0 || this.query.length >= 2;
        if (hasContent && !this.open) this.open = true;
        var self = this;
        this.$nextTick(function () {
          if (self.$refs.input) self.$refs.input.focus();
        });
        if (this.query.length >= 2 && this.results.length === 0) {
          this.search(this.query);
        }
      },

      close: function () {
        if (this.query) this._lastQuery = this.query;
        if (this.results.length > 0) this._lastResults = this.results.slice();
        this.open = false;
        this.editing = false;
        this.query = '';
        this.results = [];
      },

      search: function (q) {
        var self = this;
        if (this._debounce) clearTimeout(this._debounce);
        this._debounce = setTimeout(function () {
          self.loading = true;
          self.searched = false;
          fetch(self.searchApi + '?q=' + encodeURIComponent(q))
            .then(function (r) { return r.json(); })
            .then(function (data) {
              self.results = data.results || [];
              self.searched = true;
              if (self.results.length > 0) self._hadResults = true;
            })
            .catch(function () {
              self.results = [];
              self.searched = true;
            })
            .finally(function () { self.loading = false; });
        }, 300);
      },

      selectOption: function (result) {
        var idx = this.selectedValues.indexOf(result.value);
        if (idx === -1) {
          this.selectedValues.push(result.value);
          this.selectedItems.push({ value: result.value, label: result.label });
          this.saveRecent(result);
        } else {
          this.selectedValues.splice(idx, 1);
          this.selectedItems = this.selectedItems.filter(function (i) { return i.value !== result.value; });
        }

        this.syncToNative();
        this.error = '';
        this._hasTyped = false;
        this._hadResults = false;

        // Close but keep results for when user reopens
        this.query = '';
        this.open = false;
        this.editing = false;
      },

      clearSelection: function () {
        this.selectedValues = [];
        this.selectedItems = [];
        this._hasTyped = false;
        this._hadResults = false;
        this.error = '';
        this.syncToNative();
      },

      validate: function () {
        // Only block if user typed, had results available, but didn't select
        if (this._hasTyped && this.selectedValues.length === 0 && this._hadResults) {
          this.error = 'Selecione uma localidade da lista';
          this.editing = true;
          this.open = true;
          var self = this;
          this.$nextTick(function () {
            if (self.$refs.input) self.$refs.input.focus();
          });
          return false;
        }
        // No results available — clear query and allow submit
        this.error = '';
        this.query = '';
        this._hasTyped = false;
        return true;
      },

      loadRecent: function () {
        try {
          this._recentSearches = JSON.parse(localStorage.getItem(this._storageKey) || '[]').slice(0, 10);
        } catch (e) {
          this._recentSearches = [];
        }
      },

      saveRecent: function (item) {
        try {
          this._recentSearches = this._recentSearches.filter(function (r) { return r.value !== item.value; });
          this._recentSearches.unshift({ value: item.value, label: item.label, type: item.type || 'other' });
          this._recentSearches = this._recentSearches.slice(0, 10);
          localStorage.setItem(this._storageKey, JSON.stringify(this._recentSearches));
        } catch (e) {}
      },

      isSelected: function (value) {
        return this.selectedValues.indexOf(value) !== -1;
      },

      syncToNative: function () {
        var select = this.$refs.nativeSelect;
        if (!select) return;

        // Clear existing options
        select.innerHTML = '';

        // Add selected values as options
        var self = this;
        this.selectedValues.forEach(function (val) {
          var opt = document.createElement('option');
          opt.value = val;
          opt.text = val;
          opt.selected = true;
          select.appendChild(opt);
        });

        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    };
  });
});

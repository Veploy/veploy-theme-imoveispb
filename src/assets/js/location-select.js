/**
 * locationSelect – Alpine data component for location search dropdown
 *
 * Auto-registers on alpine:init.
 *
 * Features:
 *   - Searchable dropdown with API-backed results
 *   - Recent searches persisted in localStorage ('recentLocationSearches')
 *   - Suggested locations shown when no recent searches exist
 *   - Grouped results by type (city, neighborhood, condominium)
 *   - Auto-positions panel above or below trigger based on viewport space
 */

(function () {
  'use strict';

  var TYPE_LABELS = {
    city: 'Cidades',
    neighborhood: 'Bairros',
    condominium: 'Condomínios'
  };

  var GROUP_ORDER = ['city', 'neighborhood', 'condominium', 'other'];

  function buildGroupedResults(selectedItems, searchResults) {
    var groups = {};
    var addedValues = {};

    function addToGroup(item) {
      if (addedValues[item.value]) return;
      addedValues[item.value] = true;

      var type = item.type || 'other';
      if (!groups[type]) {
        groups[type] = { label: TYPE_LABELS[type] || type, items: [] };
      }
      groups[type].items.push(item);
    }

    if (selectedItems && selectedItems.length > 0) {
      selectedItems.forEach(addToGroup);
    }
    if (searchResults && searchResults.length > 0) {
      searchResults.forEach(addToGroup);
    }

    return GROUP_ORDER
      .filter(function (key) { return groups[key]; })
      .map(function (key) { return groups[key]; });
  }

  document.addEventListener('alpine:init', function () {
    Alpine.data('locationSelect', function (config) {
      return {
        open: false,
        nativeSelect: null,
        selectedValues: [],
        selectedItems: [],
        openUpwards: false,
        placeholder: config.placeholder || 'Digite para buscar...',
        searchApi: config.searchApi,
        suggestedLocations: config.suggestedLocations || [],
        searchQuery: '',
        searchResults: [],
        recentSearches: [],
        loading: false,
        debounceTimer: null,
        isEditing: false,

        loadRecentSearches: function () {
          try {
            var stored = localStorage.getItem('recentLocationSearches');
            if (stored) {
              this.recentSearches = JSON.parse(stored).slice(0, 10);
            }
          } catch (e) {
            this.recentSearches = [];
          }
        },

        saveToRecentSearches: function (value, label, type) {
          try {
            var newItem = { value: value, label: label, type: type || 'other' };
            this.recentSearches = this.recentSearches.filter(function (item) {
              return item.value !== value;
            });
            this.recentSearches.unshift(newItem);
            this.recentSearches = this.recentSearches.slice(0, 10);
            localStorage.setItem('recentLocationSearches', JSON.stringify(this.recentSearches));
          } catch (e) {}
        },

        syncFromNative: function () {
          if (!this.nativeSelect) return;
          this.selectedValues = Array.from(this.nativeSelect.selectedOptions).map(function (opt) {
            return opt.value;
          });
        },

        get triggerText() {
          if (!this.selectedValues || this.selectedValues.length === 0) return this.placeholder;

          if (this.selectedItems.length > 0) {
            var firstLabel = this.selectedItems[0].label;
            return this.selectedItems.length === 1
              ? firstLabel
              : firstLabel + ' +' + (this.selectedItems.length - 1);
          }

          if (!this.nativeSelect) return this.placeholder;
          var self = this;
          var labels = this.selectedValues.map(function (v) {
            var opt = Array.from(self.nativeSelect.options).find(function (o) { return o.value === v; });
            return opt ? opt.text : v;
          });
          return labels.join(', ');
        },

        get groupedResults() {
          return buildGroupedResults(this.selectedItems, this.searchResults);
        },

        _closing: false,

        toggleOption: function (value, label, type) {
          if (!this.nativeSelect) return;

          var option = Array.from(this.nativeSelect.options).find(function (o) {
            return o.value === value;
          });

          if (!option) {
            option = document.createElement('option');
            option.value = value;
            option.text = label || value;
            this.nativeSelect.appendChild(option);
          }

          option.selected = !option.selected;
          this.nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
          this.syncFromNative();

          var itemIndex = this.selectedItems.findIndex(function (item) {
            return item.value === value;
          });

          if (option.selected && itemIndex === -1) {
            this.selectedItems.push({ value: value, label: label || value, type: type || 'other' });
            this.saveToRecentSearches(value, label || value, type);
          } else if (!option.selected && itemIndex !== -1) {
            this.selectedItems.splice(itemIndex, 1);
          }

          // Flag prevents @focus from reopening during close
          this._closing = true;
          this.searchQuery = '';
          this.searchResults = [];
          this.isEditing = false;
          this.open = false;
          var self = this;
          this.$nextTick(function () {
            self._closing = false;
          });
        },

        isSelected: function (value) {
          return this.selectedValues.includes(value);
        },

        startEditing: function () {
          this.isEditing = true;
          this.open = true;
          this.searchQuery = '';
          var self = this;
          this.$nextTick(function () {
            if (self.$refs.searchInput) self.$refs.searchInput.focus();
          });
        },

        performSearch: function () {
          var self = this;
          if (this.debounceTimer) clearTimeout(this.debounceTimer);
          if (!this.searchQuery || this.searchQuery.length < 2) return;

          this.debounceTimer = setTimeout(function () {
            self.loading = true;
            fetch(self.searchApi + '?q=' + encodeURIComponent(self.searchQuery))
              .then(function (response) { return response.json(); })
              .then(function (data) { self.searchResults = data.results || []; })
              .catch(function () { self.searchResults = []; })
              .finally(function () { self.loading = false; });
          }, 300);
        },

        checkPosition: function () {
          var self = this;
          this.$nextTick(function () {
            self.$nextTick(function () {
              var trigger = self.$el.querySelector('.dropdown-trigger');
              var panel = self.$el.querySelector('.dropdown-panel');
              if (!trigger || !panel) return;

              var triggerRect = trigger.getBoundingClientRect();
              var panelHeight = Math.min(panel.scrollHeight || 320, 320);
              var spaceBelow = window.innerHeight - triggerRect.bottom - 10;
              var spaceAbove = triggerRect.top - 10;
              self.openUpwards = spaceBelow < panelHeight && spaceAbove > spaceBelow;
            });
          });
        },

        init: function () {
          this.nativeSelect = this.$el.querySelector('select');
          this.syncFromNative();
          this.loadRecentSearches();

          if (this.selectedValues.length > 0) {
            var self = this;
            this.selectedItems = this.selectedValues.map(function (val) {
              var opt = Array.from(self.nativeSelect.options).find(function (o) { return o.value === val; });
              return opt ? { value: val, label: opt.text } : { value: val, label: val };
            });
          }

          var self = this;
          this.$watch('open', function (value) {
            if (value) {
              self.checkPosition();
              self.$nextTick(function () {
                if (self.$refs.searchInput) self.$refs.searchInput.focus();
              });
            } else if (self.selectedValues.length > 0) {
              self.isEditing = false;
              self.searchQuery = '';
            }
          });

          this.$watch('searchQuery', function () {
            self.performSearch();
          });
        }
      };
    });
  });
})();

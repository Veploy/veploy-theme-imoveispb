/**
 * customSelect – Alpine data component for generic select dropdowns
 *
 * Auto-registers on alpine:init.
 *
 * Features:
 *   - Single or multiple selection
 *   - Optional API-backed search with debounce
 *   - Grouped results by type (city, neighborhood, condominium)
 *   - Configurable close-on-select behaviour
 *   - Auto-positions panel above/below and left/right based on viewport
 */

(function () {
  'use strict';

  var TYPE_LABELS = {
    city: 'Cidades',
    neighborhood: 'Bairros',
    condominium: 'Condomínios'
  };

  var GROUP_ORDER = ['city', 'neighborhood', 'condominium', 'other'];
  var RECENT_SEARCHES_KEY = 'veploy_recent_location_searches';
  var MAX_RECENT_SEARCHES = 5;

  function getRecentSearches() {
    try {
      var stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  function saveRecentSearch(item) {
    try {
      var recent = getRecentSearches();
      recent = recent.filter(function (r) { return r.value !== item.value; });
      recent.unshift(item);
      recent = recent.slice(0, MAX_RECENT_SEARCHES);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent));
    } catch (e) {}
  }

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

    if (selectedItems && selectedItems.length > 0) selectedItems.forEach(addToGroup);
    if (searchResults && searchResults.length > 0) searchResults.forEach(addToGroup);

    {
    }

    return GROUP_ORDER.filter(function (key) { return groups[key]; }).map(function (key) { return groups[key]; });
  }

  document.addEventListener('alpine:init', function () {
    Alpine.data('customSelect', function (config) {
      return {
        _selectId: 'select_' + Math.random().toString(36).substr(2, 9),
        open: false,
        nativeSelect: null,
        selectedValues: [],
        selectedItems: [],
        closeOnSelect: config.closeOnSelect !== undefined ? config.closeOnSelect : true,
        isMultiple: config.isMultiple || false,
        openUpwards: false,
        openToLeft: false,
        placeholder: config.placeholder || 'Selecione...',
        searchApi: config.searchApi || null,
        searchable: config.searchable || false,
        searchMinChars: config.searchMinChars || 2,
        searchDebounce: config.searchDebounce || 300,
        searchQuery: '',
        searchResults: [],
        loading: false,
        resolvingLabels: false,
        debounceTimer: null,
        isEditing: false,
        recentSearches: [],
        hasSearched: false,

        syncFromNative: function () {
          if (!this.nativeSelect) return;
          if (this.isMultiple) {
            this.selectedValues = Array.from(this.nativeSelect.selectedOptions).map(function (opt) { return opt.value; });
          } else {
            this.selectedValues = this.nativeSelect.value ? [this.nativeSelect.value] : [];
          }
        },

        syncToNative: function () {
          if (!this.nativeSelect) return;
          var self = this;
          Array.from(this.nativeSelect.options).forEach(function (opt) {
            opt.selected = self.selectedValues.indexOf(opt.value) !== -1;
          });
          this.nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
        },

        get triggerText() {
          if (this.resolvingLabels) return '';
          if (!this.selectedValues || this.selectedValues.length === 0) return this.placeholder;
          if (this.searchApi && this.selectedItems.length > 0) return this.selectedItems[0].label;
          if (!this.nativeSelect) return this.placeholder;
          var opt = Array.from(this.nativeSelect.options).find(function (o) { return o.value === this.selectedValues[0]; }.bind(this));
          return opt ? opt.text : this.selectedValues[0];
        },

        get extraCount() {
          if (!this.isMultiple) return 0;
          if (this.searchApi && this.selectedItems.length > 1) return this.selectedItems.length - 1;
          if (this.selectedValues.length > 1) return this.selectedValues.length - 1;
          return 0;
        },

        get groupedResults() {
          return buildGroupedResults(this.selectedItems, this.searchResults);
        },

        get hasContentToShow() {
          if (this.searchApi) {
            return this.searchResults.length > 0 ||
                   this.selectedItems.length > 0 ||
                   (this.searchQuery && this.searchQuery.length >= this.searchMinChars);
          }
          return true;
        },

        toggleOption: function (value, label, type) {
          if (this.isMultiple) {
            if (value === '') {
              this.selectedValues = [];
              if (this.searchApi) this.selectedItems = [];
              this.syncToNative();
            } else {
              var idx = this.selectedValues.indexOf(value);
              if (idx === -1) {
                this.selectedValues.push(value);
                if (this.searchApi && this.nativeSelect) {
                  if (!Array.from(this.nativeSelect.options).some(function (o) { return o.value === value; })) {
                    var opt = document.createElement('option');
                    opt.value = value;
                    opt.text = label || value;
                    this.nativeSelect.appendChild(opt);
                  }
                  if (this.selectedItems.findIndex(function (item) { return item.value === value; }) === -1) {
                    this.selectedItems.push({ value: value, label: label || value, type: type || 'other' });
                  }
                  saveRecentSearch({ value: value, label: label || value, type: type || 'other' });
                }
              } else {
                this.selectedValues.splice(idx, 1);
                if (this.searchApi) {
                  var ri = this.selectedItems.findIndex(function (item) { return item.value === value; });
                  if (ri !== -1) this.selectedItems.splice(ri, 1);
                }
              }
              this.syncToNative();
            }
          } else {
            this.selectedValues = [value];
            if (this.searchApi && this.nativeSelect) {
              if (!Array.from(this.nativeSelect.options).some(function (o) { return o.value === value; })) {
                var sOpt = document.createElement('option');
                sOpt.value = value;
                sOpt.text = label || value;
                this.nativeSelect.appendChild(sOpt);
              }
              this.selectedItems = [{ value: value, label: label || value, type: type || 'other' }];
              saveRecentSearch({ value: value, label: label || value, type: type || 'other' });
            }
            this.syncToNative();
          }

          if (this.closeOnSelect) {
            this._closedAt = Date.now();
            this.open = false;
            this.isEditing = false;
          }
          this.searchQuery = '';
          this.searchResults = [];
        },

        isSelected: function (value) {
          if (value === '' && this.isMultiple) {
            return this.selectedValues.length === 0 || (this.selectedValues.length === 1 && this.selectedValues[0] === '');
          }
          return this.selectedValues.indexOf(value) !== -1;
        },

        closeOthers: function () {
          document.dispatchEvent(new CustomEvent('custom-select:open', {
            bubbles: true,
            detail: { sourceId: this._selectId }
          }));
        },

        _closedAt: 0,

        handleTriggerClick: function () {
          // Guard: ignore click if dropdown just closed (prevents phantom reopen)
          if (Date.now() - this._closedAt < 300) return;

          if (this.open) {
            this.open = false;
            return;
          }

          if (this.selectedValues.length > 0 && !this.isEditing) {
            // Has selection — enter edit mode
            this.isEditing = true;
            this.searchQuery = '';
          }

          this.closeOthers();
          this.open = true;

          var self = this;
          this.$nextTick(function () {
            if (self.$refs.searchInput) self.$refs.searchInput.focus();
          });
        },

        openDropdown: function () {
          if (this.open || Date.now() - this._closedAt < 300) return;
          this.closeOthers();
          this.open = true;
        },

        toggleDropdown: function () {
          if (this.open) {
            this.open = false;
          } else {
            this.openDropdown();
          }
        },

        startEditing: function () {
          if (Date.now() - this._closedAt < 300) return;
          this.isEditing = true;
          this.searchQuery = '';
          this.openDropdown();
        },

        clearAll: function () {
          this.searchQuery = '';
          this.searchResults = [];
          this.isEditing = false;
          if (this.searchApi) {
            Array.from(this.nativeSelect.options).forEach(function (opt) { opt.selected = false; });
            this.nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
            this.syncFromNative();
            this.selectedItems = [];
          }
        },

        performSearch: function () {
          var self = this;
          if (this.debounceTimer) clearTimeout(this.debounceTimer);

          if (!this.searchQuery || this.searchQuery.length === 0) {
            this.searchResults = [];
            this.hasSearched = false;
            return;
          }

          if (this.searchQuery.length < this.searchMinChars) {
            this.hasSearched = false;
            return;
          }

          this.debounceTimer = setTimeout(function () {
            self.loading = true;
            self.hasSearched = false;
            fetch(self.searchApi + '?q=' + encodeURIComponent(self.searchQuery))
              .then(function (response) { return response.json(); })
              .then(function (data) {
                self.searchResults = data.results || [];
                self.hasSearched = true;
              })
              .catch(function () {
                self.searchResults = [];
                self.hasSearched = true;
              })
              .finally(function () { self.loading = false; });
          }, this.searchDebounce);
        },

        _stripAccents: function (str) {
          return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        },

        filterLocalOptions: function () {
          var query = this._stripAccents((this.searchQuery || '').toLowerCase().trim());
          var panel = this.$el.querySelector('.dropdown-panel');
          if (!panel) return;

          var self = this;
          var options = panel.querySelectorAll('.select-option');
          options.forEach(function (opt) {
            var searchText = opt.dataset.searchText;
            if (!query || (searchText && self._stripAccents(searchText).includes(query))) {
              opt.style.display = '';
            } else {
              opt.style.display = 'none';
            }
          });

          // Hide group headers when all their options are hidden
          var headers = panel.querySelectorAll('.select-group-header');
          headers.forEach(function (header) {
            var next = header.nextElementSibling;
            var hasVisible = false;
            while (next && !next.classList.contains('select-group-header')) {
              if (next.classList.contains('select-option') && next.style.display !== 'none') {
                hasVisible = true;
                break;
              }
              next = next.nextElementSibling;
            }
            header.style.display = hasVisible ? '' : 'none';
          });
        },

        checkPosition: function () {
          var self = this;
          this.$nextTick(function () {
            self.$nextTick(function () {
              var trigger = self.$el.querySelector('.dropdown-trigger');
              var panel = self.$el.querySelector('.dropdown-panel');
              if (!trigger || !panel) return;

              var triggerRect = trigger.getBoundingClientRect();
              var panelHeight = Math.min(panel.scrollHeight || 256, 256);
              var spaceBelow = window.innerHeight - triggerRect.bottom - 10;
              var spaceAbove = triggerRect.top - 10;
              self.openUpwards = spaceBelow < panelHeight && spaceAbove > spaceBelow;

              var computedStyle = getComputedStyle(panel);
              var minWidthVar = computedStyle.getPropertyValue('--dropdown-min-w');
              var panelWidth = panel.scrollWidth || panel.offsetWidth || 0;
              if (minWidthVar) {
                var parsedWidth = parseInt(minWidthVar, 10);
                if (!isNaN(parsedWidth) && parsedWidth > panelWidth) panelWidth = parsedWidth;
              }

              var spaceRight = window.innerWidth - triggerRect.left - 10;
              var spaceLeft = triggerRect.right - 10;
              self.openToLeft = spaceRight < panelWidth && spaceLeft > spaceRight;
            });
          });
        },

        init: function () {
          var self = this;
          this.nativeSelect = this.$el.querySelector('select');
          this.syncFromNative();

          if (this.searchApi) {
            this.recentSearches = getRecentSearches();
          }

          if (this.searchApi && this.selectedValues.length > 0) {
            this.selectedItems = this.selectedValues.map(function (val) {
              var opt = Array.from(self.nativeSelect.options).find(function (o) { return o.value === val; });
              return { value: val, label: (opt && opt.text && opt.text !== val) ? opt.text : val };
            });

            this.resolvingLabels = true;
            fetch(self.searchApi + '?slugs=' + encodeURIComponent(this.selectedValues.join(',')))
              .then(function (r) { return r.json(); })
              .then(function (data) {
                var results = data.results || [];
                results.forEach(function (match) {
                  var idx = self.selectedItems.findIndex(function (item) { return item.value === match.value; });
                  if (idx !== -1) {
                    self.selectedItems[idx].label = match.label;
                    if (match.type) self.selectedItems[idx].type = match.type;
                  }
                  var opt = Array.from(self.nativeSelect.options).find(function (o) { return o.value === match.value; });
                  if (opt) opt.text = match.label;
                });
                self.selectedItems = self.selectedItems.slice();
              })
              .catch(function () {})
              .finally(function () { self.resolvingLabels = false; });
          }

          // Close when another select opens
          document.addEventListener('custom-select:open', function (e) {
            if (e.detail && e.detail.sourceId !== self._selectId && self.open) {
              self.open = false;
            }
          });

          this.$watch('open', function (value) {
            if (value) {
              self.checkPosition();
              // Focus search input if user is actively editing (API or local search)
              if ((self.searchApi || self.searchable) && self.isEditing && self.$refs.searchInput) {
                self.$nextTick(function () {
                  self.$refs.searchInput.focus();
                });
              }
              // Reset local filter when opening
              if (self.searchable && !self.searchApi) {
                self.$nextTick(function () {
                  self.filterLocalOptions();
                });
              }
            }
          });

          if (this.searchApi) {
            this.$watch('searchQuery', function () {
              self.performSearch();
            });
          } else if (this.searchable) {
            this.$watch('searchQuery', function () {
              self.filterLocalOptions();
            });
          }
        }
      };
    });
  });
})();

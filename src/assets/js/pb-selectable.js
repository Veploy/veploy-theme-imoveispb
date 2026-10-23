/**
 * pbSelectable — lista com checkboxes da busca do banner (Tipo do imóvel e
 * Localização), igual ao "pmob-selectable" do site original: o campo abre um
 * painel branco com as opções marcáveis; a localização mostra "Sugestões" ao
 * focar e busca na API a partir de 2 letras.
 *
 * Uso: x-data="pbSelectable({ name: 'type[]', options: [...], placeholder })"
 *      x-data="pbSelectable({ name: 'location[]', searchApi: '/api/locations/search', suggestions: [...] })"
 * Cada opção é { value, label }. Os valores marcados vão em inputs ocultos.
 */
document.addEventListener('alpine:init', function () {
  Alpine.data('pbSelectable', function (config) {
    return {
      open: false,
      query: '',
      results: [],
      loading: false,
      searched: false,
      selected: [],
      name: config.name,
      options: config.options || [],
      suggestions: config.suggestions || [],
      searchApi: config.searchApi || null,
      placeholder: config.placeholder || '',
      _debounce: null,

      get searchable() { return !!this.searchApi; },

      // Texto do campo fechado: os rótulos marcados, como no original
      get display() {
        return this.selected.map(function (s) { return s.label; }).join(', ');
      },

      // Opções listadas: busca (>= 2 letras), sugestões ou lista fixa
      get list() {
        if (!this.searchable) return this.options;
        if (this.query.trim().length >= 2) return this.results;
        return this.suggestions;
      },

      get showSuggestionsTitle() {
        return this.searchable && this.query.trim().length < 2 && this.suggestions.length > 0;
      },

      isSelected: function (value) {
        return this.selected.some(function (s) { return s.value === value; });
      },

      toggle: function (item) {
        if (this.isSelected(item.value)) {
          this.selected = this.selected.filter(function (s) { return s.value !== item.value; });
        } else {
          this.selected.push({ value: item.value, label: item.label });
        }
      },

      clear: function () { this.selected = []; },

      openPanel: function () {
        this.open = true;
        if (this.searchable) this.$nextTick(() => this.$refs.input && this.$refs.input.focus());
      },

      close: function () {
        this.open = false;
        this.query = '';
      },

      onInput: function () {
        var self = this;
        this.open = true;
        if (this._debounce) clearTimeout(this._debounce);
        if (this.query.trim().length < 2) { this.results = []; this.searched = false; return; }
        this._debounce = setTimeout(function () {
          self.loading = true;
          fetch(self.searchApi + '?q=' + encodeURIComponent(self.query.trim()))
            .then(function (r) { return r.json(); })
            .then(function (data) {
              self.results = (data.results || []).map(function (r) { return { value: r.value, label: r.label }; });
            })
            .catch(function () { self.results = []; })
            .finally(function () { self.loading = false; self.searched = true; });
        }, 300);
      }
    };
  });
});

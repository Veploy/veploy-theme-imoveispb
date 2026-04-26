/**
 * Property Filters with Alpine.js
 * 
 * Provides progressive enhancement for property filtering:
 * - Auto-update on filter change (optional)
 * - AJAX filtering without page reload
 * - URL state management (back button works)
 * - Loading states
 * 
 * Usage in Liquid template:
 * <div x-data="propertyFilters()">
 *   <form @submit.prevent="applyFilters" @change="handleChange">
 *     <!-- Your filter inputs -->
 *   </form>
 * </div>
 */

/**
 * Alpine.js component for property filters
 * @returns {Object} Alpine component
 */
function propertyFilters() {
  return {
    // State
    loading: false,
    autoUpdate: false,
    initialLoad: true,
    debounceTimer: null,

    /**
     * Initialize component
     */
    init() {
      // Listen to browser back/forward
      window.addEventListener('popstate', () => {
        window.location.reload();
      });

      // Mark as initialized
      this.$nextTick(() => {
        this.initialLoad = false;
      });

      console.log('[Filters] Initialized');
    },

    /**
     * Handle form change event
     * Debounces auto-update to avoid excessive requests
     */
    handleChange(event) {
      // Skip if auto-update is off
      if (!this.autoUpdate) return;

      // Skip on initial load
      if (this.initialLoad) return;

      // Clear existing timer
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }

      // Debounce for text inputs (wait 500ms after typing stops)
      const isTextInput = event.target.type === 'text' || event.target.type === 'number';
      const delay = isTextInput ? 500 : 0;

      this.debounceTimer = setTimeout(() => {
        this.applyFilters();
      }, delay);
    },

    /**
     * Apply filters and update results
     * Can be called manually or via auto-update
     */
    async applyFilters() {
      // Validate location filter before submitting
      var locationEl = this.$el.querySelector('.location-filter');
      if (locationEl && locationEl._locationFilter && !locationEl._locationFilter.validate()) {
        return;
      }

      // Prevent double submission
      if (this.loading) return;

      this.loading = true;

      const form = this.$el.querySelector('form');
      const formData = new FormData(form);
      const params = new URLSearchParams();

      // Build query string (handle arrays properly)
      for (const [key, value] of formData.entries()) {
        if (value) {
          params.append(key, value);
        }
      }

      const queryString = params.toString();
      const url = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;

      console.log('[Filters] Applying filters:', queryString);

      try {
        // Update URL without reload (makes back button work)
        history.pushState({ filters: queryString }, '', url);

        // Fetch filtered results
        const response = await fetch(url, {
          headers: {
            'Accept': 'text/html',
            'X-Requested-With': 'XMLHttpRequest'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const html = await response.text();

        // Parse response
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Update properties grid
        const newGrid = doc.querySelector('.properties-grid') || doc.querySelector('[data-properties-grid]');
        const currentGrid = document.querySelector('.properties-grid') || document.querySelector('[data-properties-grid]');

        if (newGrid && currentGrid) {
          currentGrid.innerHTML = newGrid.innerHTML;
        }

        // Update pagination
        const newPagination = doc.querySelector('.pagination') || doc.querySelector('[data-pagination]');
        const currentPagination = document.querySelector('.pagination') || document.querySelector('[data-pagination]');

        if (newPagination && currentPagination) {
          currentPagination.innerHTML = newPagination.innerHTML;
        }

        // Update results count (if exists)
        const newCount = doc.querySelector('[data-results-count]');
        const currentCount = document.querySelector('[data-results-count]');

        if (newCount && currentCount) {
          currentCount.textContent = newCount.textContent;
        }

        // Scroll to results (smooth)
        const resultsContainer = document.querySelector('[data-properties-grid]') || document.querySelector('.properties-grid');
        if (resultsContainer) {
          resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        console.log('[Filters] Results updated successfully');
      } catch (error) {
        console.error('[Filters] Error applying filters:', error);
        
        // Fallback: reload page
        window.location.href = url;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Clear all filters and reset form
     */
    clearFilters() {
      const form = this.$el.querySelector('form');
      
      if (form) {
        form.reset();
      }

      // Navigate to clean URL
      window.location.href = window.location.pathname;
    },

    /**
     * Get active filter count
     * Useful for showing "X filters active" badge
     */
    getActiveFilterCount() {
      const form = this.$el.querySelector('form');
      if (!form) return 0;

      const formData = new FormData(form);
      let count = 0;

      for (const [key, value] of formData.entries()) {
        // Skip pagination and sorting
        if (key === 'page' || key === 'limit') continue;
        
        if (value && value.trim() !== '') {
          count++;
        }
      }

      return count;
    },

    /**
     * Check if filters are active
     */
    hasActiveFilters() {
      return this.getActiveFilterCount() > 0;
    }
  };
}

/**
 * Export for use in modules (if needed)
 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { propertyFilters };
}

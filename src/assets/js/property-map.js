/**
 * Property Map — Lazy-loaded Leaflet map for property detail page.
 *
 * Expects in the DOM:
 *   #mapWrapper[data-lat][data-lng][data-display="exact|approx"]
 *   #mapPlaceholder (optional loading placeholder)
 *   #mapSection (scroll target)
 */
(function() {
  'use strict';

  var PropertyMap = {
    CSS_URL: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.min.css',
    JS_URL: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.min.js',
    TILE_URL: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    APPROX_RADIUS: 350,

    map: null,
    initialized: false,

    getPrimaryColor: function() {
      var css = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim();
      return css ? 'rgb(' + css + ')' : '#E31C5F';
    },

    loadAsset: function(type, url, callback) {
      var el = document.createElement(type === 'css' ? 'link' : 'script');
      if (type === 'css') {
        el.rel = 'stylesheet';
        el.href = url;
      } else {
        el.src = url;
        el.onload = callback;
        el.onerror = function() { console.error('[Map] Failed to load:', url); };
      }
      document.head.appendChild(el);
    },

    createPinMarker: function(lat, lng, color) {
      return L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'vp-map-pin',
          html: '<div style="width:32px;height:32px;background:' + color + ';border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 3px 8px rgba(0,0,0,0.3)"></div>',
          iconSize: [32, 32],
          iconAnchor: [16, 32]
        })
      });
    },

    createApproxCircle: function(lat, lng, color) {
      return L.circle([lat, lng], {
        radius: this.APPROX_RADIUS,
        color: color,
        weight: 2,
        opacity: 0.8,
        fillColor: color,
        fillOpacity: 0.15,
        interactive: false
      });
    },

    init: function() {
      var self = this;
      var wrapper = document.getElementById('mapWrapper');
      if (!wrapper || this.initialized) return;
      this.initialized = true;

      var lat = parseFloat(wrapper.dataset.lat);
      var lng = parseFloat(wrapper.dataset.lng);
      var mode = wrapper.dataset.display || 'exact';

      if (isNaN(lat) || isNaN(lng)) {
        console.warn('[Map] Invalid coordinates');
        return;
      }

      var placeholder = document.getElementById('mapPlaceholder');
      if (placeholder) {
        placeholder.innerHTML = '<div class="flex items-center gap-2 text-gray-400">' +
          '<svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">' +
          '<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>' +
          '<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>' +
          '</svg><span>Carregando mapa...</span></div>';
      }

      this.loadAsset('css', this.CSS_URL);
      this.loadAsset('js', this.JS_URL, function() {
        wrapper.innerHTML = '<div id="propertyMap" style="width:100%;height:100%"></div>';

        self.map = L.map('propertyMap', {
          center: [lat, lng],
          zoom: mode === 'approx' ? 15 : 17,
          scrollWheelZoom: false
        });

        L.tileLayer(self.TILE_URL, {
          maxZoom: 19,
          subdomains: 'abcd',
          attribution: '&copy; <a href="https://carto.com/" target="_blank">CARTO</a>'
        }).addTo(self.map);

        var color = self.getPrimaryColor();

        if (mode === 'approx') {
          self.createApproxCircle(lat, lng, color).addTo(self.map);
        } else {
          self.createPinMarker(lat, lng, color).addTo(self.map);
        }

        self.map.on('focus', function() { self.map.scrollWheelZoom.enable(); });
        self.map.on('blur', function() { self.map.scrollWheelZoom.disable(); });

        setTimeout(function() { self.map.invalidateSize(); }, 100);
        setTimeout(function() { self.map.invalidateSize(); }, 300);
      });
    }
  };

  window.initPropertyMap = function() { PropertyMap.init(); };

  window.scrollToMap = function() {
    var el = document.getElementById('mapSection');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };
})();

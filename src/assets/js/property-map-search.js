/**
 * Property Map Search — Leaflet map for property listing page.
 *
 * Initial load: reads property data from #vpMapProperties JSON block.
 * On pan/zoom: fetches new properties from /api/properties with bounds params.
 * Updates both map markers and the card list in the sidebar.
 */
(function () {
  'use strict';

  var CSS_URL = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.min.css';
  var JS_URL = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.min.js';
  var TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
  var CLUSTER_CSS = 'https://cdn.jsdelivr.net/npm/leaflet.markercluster@1.5.3/dist/MarkerCluster.css';
  var CLUSTER_DEFAULT_CSS = 'https://cdn.jsdelivr.net/npm/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css';
  var CLUSTER_JS = 'https://cdn.jsdelivr.net/npm/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js';

  var DEBOUNCE_MS = 400;
  var FETCH_LIMIT = 100;

  var map = null;
  var markers = {};      // sku -> marker
  var activeMarker = null;
  var clusterGroup = null;
  var initialized = false;
  var fetchTimer = null;
  var fetchController = null;
  var isFetching = false;
  var isFirstLoad = true;

  // ----------------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------------

  function getPrimaryColor() {
    var css = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim();
    return css ? 'rgb(' + css + ')' : '#E31C5F';
  }

  function loadAsset(type, url) {
    return new Promise(function (resolve, reject) {
      if (type === 'css') {
        if (document.querySelector('link[href="' + url + '"]')) return resolve();
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        link.onload = resolve;
        link.onerror = reject;
        document.head.appendChild(link);
      } else {
        if (document.querySelector('script[src="' + url + '"]')) return resolve();
        var script = document.createElement('script');
        script.src = url;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      }
    });
  }

  function getInitialProperties() {
    var el = document.getElementById('vpMapProperties');
    if (!el) return [];
    try {
      return JSON.parse(el.textContent) || [];
    } catch (e) {
      console.error('[MapSearch] Failed to parse property data', e);
      return [];
    }
  }

  /**
   * Get the current page filters from URL query string
   * (preserves operation, type, location, price, beds, etc.)
   */
  function getCurrentFilters() {
    var params = new URLSearchParams(window.location.search);
    var filters = {};
    params.forEach(function (value, key) {
      if (key !== 'page') filters[key] = value;
    });
    // Also extract operation from URL path (e.g., /imoveis/comprar → sale)
    var path = window.location.pathname;
    if (!filters.operation) {
      if (path.includes('/comprar') || path.includes('/sale')) filters.operation = 'sale';
      else if (path.includes('/alugar') || path.includes('/rent')) filters.operation = 'rent';
      else if (path.includes('/temporada') || path.includes('/short-term')) filters.operation = 'short_term';
    }
    return filters;
  }

  // ----------------------------------------------------------------
  // Price marker icon (pill-style)
  // ----------------------------------------------------------------

  function createPriceIcon(price, isActive) {
    var color = getPrimaryColor();
    var bg = isActive ? color : '#ffffff';
    var text = isActive ? '#ffffff' : '#1f2937';
    var border = isActive ? color : '#d1d5db';
    var shadow = isActive ? '0 2px 8px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.15)';

    return L.divIcon({
      className: 'vp-map-price-marker',
      html: '<div style="' +
        'background:' + bg + ';' +
        'color:' + text + ';' +
        'border:1.5px solid ' + border + ';' +
        'border-radius:20px;' +
        'padding:4px 10px;' +
        'font-size:12px;' +
        'font-weight:600;' +
        'font-family:Inter,system-ui,sans-serif;' +
        'white-space:nowrap;' +
        'box-shadow:' + shadow + ';' +
        'cursor:pointer;' +
        'transition:all 0.15s ease;' +
        'line-height:1.3;' +
        '">' + price + '</div>',
      iconSize: null,
      iconAnchor: [0, 0]
    });
  }

  // ----------------------------------------------------------------
  // Popup content
  // ----------------------------------------------------------------

  function createPopupContent(prop) {
    var img = prop.image
      ? '<img src="' + prop.image + '" alt="" style="width:100%;height:120px;object-fit:cover;border-radius:8px 8px 0 0;" loading="lazy">'
      : '<div style="width:100%;height:120px;background:#f3f4f6;border-radius:8px 8px 0 0;display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:24px;">&#x1f3e0;</div>';

    var location = prop.neighborhood || '';
    if (prop.city) location += (location ? ', ' : '') + prop.city;

    return '<a href="' + prop.url + '" style="text-decoration:none;color:inherit;display:block;width:220px;">' +
      img +
      '<div style="padding:10px 12px;">' +
        '<div style="font-size:11px;color:#6b7280;margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + location + '</div>' +
        '<div style="font-size:13px;font-weight:600;color:#1f2937;margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + (prop.title || '') + '</div>' +
        '<div style="font-size:14px;font-weight:700;color:' + getPrimaryColor() + ';">' + prop.price + '</div>' +
      '</div>' +
    '</a>';
  }

  // ----------------------------------------------------------------
  // Highlight / unhighlight
  // ----------------------------------------------------------------

  function highlightMarker(sku) {
    if (activeMarker === sku) return;
    unhighlightAll();
    activeMarker = sku;

    var m = markers[sku];
    if (!m) return;

    m.setIcon(createPriceIcon(m._vpPrice, true));
    m.setZIndexOffset(1000);

    var card = document.querySelector('[data-map-sku="' + sku + '"]');
    if (card) card.classList.add('vp-map-card-active');
  }

  function unhighlightAll() {
    if (!activeMarker) return;
    var m = markers[activeMarker];
    if (m) {
      m.setIcon(createPriceIcon(m._vpPrice, false));
      m.setZIndexOffset(0);
    }
    var card = document.querySelector('[data-map-sku="' + activeMarker + '"]');
    if (card) card.classList.remove('vp-map-card-active');
    activeMarker = null;
  }

  // ----------------------------------------------------------------
  // Card hover → highlight marker
  // ----------------------------------------------------------------

  function setupCardHoverEvents() {
    var cards = document.querySelectorAll('[data-map-sku]');
    cards.forEach(function (card) {
      var sku = card.getAttribute('data-map-sku');
      card.addEventListener('mouseenter', function () { highlightMarker(sku); });
      card.addEventListener('mouseleave', function () { unhighlightAll(); });
    });
  }

  function scrollToCard(sku) {
    var card = document.querySelector('[data-map-sku="' + sku + '"]');
    if (!card) return;
    var container = document.getElementById('vpMapListContainer');
    if (container) {
      var containerRect = container.getBoundingClientRect();
      var cardRect = card.getBoundingClientRect();
      var scrollOffset = cardRect.top - containerRect.top + container.scrollTop - 12;
      container.scrollTo({ top: scrollOffset, behavior: 'smooth' });
    }
  }

  // ----------------------------------------------------------------
  // Render markers from property data
  // ----------------------------------------------------------------

  function renderMarkers(properties) {
    if (!clusterGroup) return;

    // Clear existing
    clusterGroup.clearLayers();
    markers = {};
    activeMarker = null;

    var bounds = [];

    properties.forEach(function (prop) {
      if (!prop.lat || !prop.lng) return;

      var marker = L.marker([prop.lat, prop.lng], {
        icon: createPriceIcon(prop.price, false)
      });

      marker._vpSku = prop.sku;
      marker._vpPrice = prop.price;

      marker.bindPopup(createPopupContent(prop), {
        maxWidth: 220,
        minWidth: 220,
        className: 'vp-map-popup',
        closeButton: true,
        autoPan: true
      });

      marker.on('click', function () {
        highlightMarker(prop.sku);
        scrollToCard(prop.sku);
      });

      marker.on('mouseover', function () {
        highlightMarker(prop.sku);
      });

      markers[prop.sku] = marker;
      clusterGroup.addLayer(marker);
      bounds.push([prop.lat, prop.lng]);
    });

    return bounds;
  }

  // ----------------------------------------------------------------
  // Build card HTML for sidebar
  // ----------------------------------------------------------------

  function buildCardHtml(prop) {
    var location = prop.neighborhood || '';
    if (prop.city) location += (location ? ', ' : '') + prop.city;

    var imgHtml = prop.image
      ? '<a href="' + prop.url + '" class="vp-img-wrap block aspect-[16/9] overflow-hidden"><img src="' + prop.image + '" alt="' + (prop.title || '') + '" class="w-full h-full object-cover" loading="lazy" onload="this.closest(\'.vp-img-wrap\').classList.add(\'vp-loaded\')"></a>'
      : '<div class="aspect-[16/9] bg-gray-200 flex items-center justify-center"><i class="ph ph-buildings text-5xl text-gray-400"></i></div>';

    var features = '';
    if (prop.area || prop.beds || prop.parkings) {
      var featureItems = '';
      if (prop.area) featureItems += '<div class="flex items-center gap-1.5"><i class="ph ph-ruler text-primary"></i><span>' + prop.area + ' m<sup>2</sup></span></div>';
      if (prop.beds) featureItems += '<div class="flex items-center gap-1.5"><i class="ph ph-bed text-primary"></i><span>' + prop.beds + '</span></div>';
      if (prop.parkings) featureItems += '<div class="flex items-center gap-1.5"><i class="ph ph-car text-primary"></i><span>' + prop.parkings + '</span></div>';
      features = '<div class="flex items-center gap-4 pt-3 border-t border-gray-100 text-sm text-gray-600">' + featureItems + '</div>';
    }

    return '<div data-map-sku="' + prop.sku + '">' +
      '<article class="vp-property-card bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow group">' +
        '<div class="vp-property-card__gallery relative">' + imgHtml + '</div>' +
        '<div class="p-4">' +
          '<div class="flex items-center gap-1.5 text-sm text-gray-500 mb-1">' +
            '<i class="ph ph-map-pin text-primary flex-shrink-0"></i>' +
            '<span class="truncate">' + location + '</span>' +
          '</div>' +
          '<h3 class="text-gray-800 text-sm leading-relaxed mb-2 line-clamp-2">' +
            '<a href="' + prop.url + '" class="hover:text-primary transition-colors">' + (prop.title || '') + '</a>' +
          '</h3>' +
          '<p class="text-md font-bold text-primary mb-2">' + (prop.price || '') + '</p>' +
          features +
        '</div>' +
      '</article>' +
    '</div>';
  }

  // ----------------------------------------------------------------
  // Update card list sidebar
  // ----------------------------------------------------------------

  function updateCardList(properties, total) {
    var container = document.getElementById('vpMapListContainer');
    if (!container) return;

    var grid = container.querySelector('.grid');
    if (!grid) return;

    // Update count badge
    var countEl = document.querySelector('.vp-map-count');
    if (countEl) {
      countEl.textContent = total + ' imóveis nesta área';
    }

    // Replace card content
    grid.innerHTML = properties.map(buildCardHtml).join('');

    // Re-bind hover events
    setupCardHoverEvents();
  }

  // ----------------------------------------------------------------
  // Fetch properties by bounds from API
  // ----------------------------------------------------------------

  function fetchByBounds() {
    if (!map || isFirstLoad) return;

    if (fetchTimer) clearTimeout(fetchTimer);

    fetchTimer = setTimeout(function () {
      if (fetchController) fetchController.abort();
      fetchController = new AbortController();

      var bounds = map.getBounds();
      var filters = getCurrentFilters();

      var params = new URLSearchParams(filters);
      params.set('bounds_north', bounds.getNorth().toFixed(6));
      params.set('bounds_south', bounds.getSouth().toFixed(6));
      params.set('bounds_east', bounds.getEast().toFixed(6));
      params.set('bounds_west', bounds.getWest().toFixed(6));
      params.set('limit', String(FETCH_LIMIT));
      params.delete('page');

      isFetching = true;
      showLoadingIndicator(true);

      fetch('/api/properties?' + params.toString(), {
        signal: fetchController.signal
      })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        isFetching = false;
        showLoadingIndicator(false);

        if (!data.properties) return;

        // Update markers (without changing the map view)
        renderMarkers(data.properties);

        // Update sidebar card list
        updateCardList(data.properties, data.total || data.properties.length);
      })
      .catch(function (err) {
        isFetching = false;
        showLoadingIndicator(false);
        if (err.name !== 'AbortError') {
          console.error('[MapSearch] Fetch error:', err);
        }
      });
    }, DEBOUNCE_MS);
  }

  // ----------------------------------------------------------------
  // Loading indicator
  // ----------------------------------------------------------------

  function showLoadingIndicator(show) {
    var indicator = document.getElementById('vpMapLoading');
    if (!indicator) {
      if (!show) return;
      indicator = document.createElement('div');
      indicator.id = 'vpMapLoading';
      indicator.className = 'absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg text-sm text-gray-600 flex items-center gap-2 transition-opacity';
      indicator.innerHTML = '<svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>Buscando imóveis...';

      var mapContainer = document.querySelector('.vp-map-view__map');
      if (mapContainer) {
        mapContainer.style.position = 'relative';
        mapContainer.appendChild(indicator);
      }
    }

    indicator.style.opacity = show ? '1' : '0';
    indicator.style.pointerEvents = show ? 'auto' : 'none';
  }

  // ----------------------------------------------------------------
  // Init map
  // ----------------------------------------------------------------

  function initMap() {
    if (initialized) {
      if (map) {
        setTimeout(function () { map.invalidateSize(); }, 100);
        setTimeout(function () { map.invalidateSize(); }, 300);
      }
      return;
    }

    var container = document.getElementById('vpMapContainer');
    if (!container) return;

    var properties = getInitialProperties();
    if (properties.length === 0) {
      container.innerHTML = '<div class="flex items-center justify-center h-full text-gray-400 text-sm">Nenhum imóvel com localização disponível</div>';
      initialized = true;
      return;
    }

    container.innerHTML = '<div class="flex items-center justify-center h-full text-gray-400"><svg class="animate-spin h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>Carregando mapa...</div>';

    // Load Leaflet + MarkerCluster
    Promise.all([
      loadAsset('css', CSS_URL),
      loadAsset('css', CLUSTER_CSS),
      loadAsset('css', CLUSTER_DEFAULT_CSS),
      loadAsset('js', JS_URL)
    ]).then(function () {
      return loadAsset('js', CLUSTER_JS);
    }).then(function () {
      container.innerHTML = '<div id="vpMapLeaflet" style="width:100%;height:100%;"></div>';

      map = L.map('vpMapLeaflet', {
        scrollWheelZoom: true,
        zoomControl: true
      });

      L.tileLayer(TILE_URL, {
        maxZoom: 19,
        subdomains: 'abcd',
        attribution: '&copy; <a href="https://carto.com/" target="_blank">CARTO</a>'
      }).addTo(map);

      clusterGroup = L.markerClusterGroup({
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        iconCreateFunction: function (cluster) {
          var count = cluster.getChildCount();
          var color = getPrimaryColor();
          return L.divIcon({
            html: '<div style="' +
              'background:' + color + ';' +
              'color:#fff;' +
              'border-radius:50%;' +
              'width:36px;height:36px;' +
              'display:flex;align-items:center;justify-content:center;' +
              'font-size:13px;font-weight:700;' +
              'font-family:Inter,system-ui,sans-serif;' +
              'box-shadow:0 2px 8px rgba(0,0,0,0.3);' +
              'border:2px solid #fff;' +
              '">' + count + '</div>',
            className: 'vp-map-cluster',
            iconSize: [36, 36]
          });
        }
      });

      map.addLayer(clusterGroup);

      // Render initial markers
      var bounds = renderMarkers(properties);

      if (bounds && bounds.length > 0) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      }

      // After initial fitBounds completes, enable live fetch on move
      map.once('moveend', function () {
        isFirstLoad = false;

        // Now listen for subsequent moves/zooms
        map.on('moveend', fetchByBounds);
      });

      map.on('click', function (e) {
        if (!e.originalEvent || !e.originalEvent.target.closest('.leaflet-marker-icon')) {
          unhighlightAll();
        }
      });

      setupCardHoverEvents();
      initialized = true;

      setTimeout(function () { map.invalidateSize(); }, 100);
      setTimeout(function () { map.invalidateSize(); }, 300);
    }).catch(function (err) {
      console.error('[MapSearch] Failed to load map assets', err);
      container.innerHTML = '<div class="flex items-center justify-center h-full text-gray-400 text-sm">Erro ao carregar o mapa</div>';
    });
  }

  // ----------------------------------------------------------------
  // Public API
  // ----------------------------------------------------------------

  window.VpMapSearch = {
    init: initMap,
    highlight: highlightMarker,
    unhighlight: unhighlightAll,
    invalidate: function () {
      if (map) {
        setTimeout(function () { map.invalidateSize(); }, 50);
        setTimeout(function () { map.invalidateSize(); }, 200);
      }
    }
  };

  // Auto-init: if the map container is already visible (initial view = map)
  document.addEventListener('DOMContentLoaded', function () {
    var container = document.getElementById('vpMapContainer');
    if (container && container.offsetParent !== null) {
      initMap();
    }
  });
})();

/**
 * URBANDROPS — Commerce & Order Tracking Vanilla JS
 * Handles:
 *  - Women's Catalog (pages/womens-catalog.html): JS data array, category filter, search filter, price sort, Add to Cart
 *  - Cart & Checkout (pages/cart-checkout.html): localStorage cart sync, qty +/-, remove, promo 'URBAN10', summary, shipping form, PLACE ORDER
 *  - Order Tracking (pages/order-tracking.html): Order ID lookup (#UD-1042 + localStorage placed orders), 4-step progress bar & status timestamp cards
 */

(function () {
  'use strict';

  const CART_STORAGE_KEY = 'urbandropsCart';
  const CART_COUNT_KEY = 'cartCount';
  const ORDERS_STORAGE_KEY = 'urbandropsOrders';

  /* ========================================================================
     SHARED CART & CURRENCY UTILITIES
     ======================================================================== */
  function formatPKR(amount) {
    const safe = Math.max(0, Math.round(Number(amount) || 0));
    return 'PKR ' + safe.toLocaleString('en-US');
  }

  function readCart() {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }

  function writeCart(items) {
    const clean = Array.isArray(items) ? items : [];
    const totalCount = clean.reduce(function (sum, item) {
      return sum + (parseInt(item.qty, 10) || 0);
    }, 0);

    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(clean));
      localStorage.setItem(CART_COUNT_KEY, String(totalCount));
    } catch (err) {
      // Ignore storage quota errors cleanly
    }

    // Sync navbar cart badge immediately across the current tab
    document.querySelectorAll('[data-cart-badge]').forEach(function (badge) {
      badge.textContent = String(totalCount);
      badge.setAttribute('aria-label', 'Cart items: ' + totalCount);
    });
  }

  function showCommerceToast(message) {
    const existing = document.getElementById('udCommerceToast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'udCommerceToast';
    toast.className = 'ud-toast';
    toast.setAttribute('role', 'status');
    toast.textContent = message;
    document.body.appendChild(toast);

    window.setTimeout(function () {
      if (toast.parentNode) toast.remove();
    }, 3400);
  }

  /* ========================================================================
     1. WOMEN'S CATALOG DATA & LOGIC (pages/womens-catalog.html)
     ======================================================================== */
  const WOMENS_CATALOG = [
    {
      id: 'w-hoodie-01',
      name: 'APEX CROPPED HEAVY HOODIE',
      category: 'Hoodies & Sweats',
      price: 7400,
      colorway: 'Obsidian Black / Acid',
      tag: '480 GSM FLEECE',
      badge: 'DROP 04',
      sizes: ['XS', 'S', 'M', 'L'],
      icon: 'hoodie',
      description: 'Boxy cropped cut with double-lined hood and high-density puff back print.'
    },
    {
      id: 'w-jacket-01',
      name: 'KINETIC NYLON BOMBER SHELL',
      category: 'Outerwear',
      price: 12900,
      colorway: 'Matte Onyx / Signal Orange',
      tag: 'WATER REPELLENT',
      badge: 'LIMITED',
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      icon: 'jacket',
      description: 'Ripstop windproof shell with articulated sleeves and two-way hardware.'
    },
    {
      id: 'w-cargo-01',
      name: 'SECTOR-07 PARACHUTE CARGOS',
      category: 'Cargos & Bottoms',
      price: 8200,
      colorway: 'Graphite Charcoal',
      tag: 'RELAXED WIDE LEG',
      badge: 'BESTSELLER',
      sizes: ['XS', 'S', 'M', 'L'],
      icon: 'pants',
      description: 'Lightweight technical twill with bungee ankle toggles and gusset pockets.'
    },
    {
      id: 'w-tee-01',
      name: 'RAW SEAM BABY TEE',
      category: 'Tees & Tops',
      price: 3600,
      colorway: 'Washed Charcoal',
      tag: '260 GSM RIB',
      badge: 'CORE',
      sizes: ['XS', 'S', 'M', 'L'],
      icon: 'tee',
      description: 'Contoured stretch-cotton jersey with exposed contrast overlock stitching.'
    },
    {
      id: 'w-hoodie-02',
      name: 'ACID WASH OVERSIZED ZIP-UP',
      category: 'Hoodies & Sweats',
      price: 8600,
      colorway: 'Smoke Slate',
      tag: 'ENZYME WASHED',
      badge: 'NEW',
      sizes: ['S', 'M', 'L', 'XL'],
      icon: 'hoodie',
      description: 'Dropped-shoulder full-zip hoodie with antique silver YKK metal zipper.'
    },
    {
      id: 'w-jacket-02',
      name: 'UTILITY PUFFER VEST',
      category: 'Outerwear',
      price: 9800,
      colorway: 'Carbon Black',
      tag: 'THERMAL FILL',
      badge: 'DROP 04',
      sizes: ['XS', 'S', 'M', 'L'],
      icon: 'jacket',
      description: 'Cropped tactical puffer vest with concealed chest stash pocket.'
    },
    {
      id: 'w-cargo-02',
      name: 'CONCRETE WIDE SWEATPANTS',
      category: 'Cargos & Bottoms',
      price: 6200,
      colorway: 'Asphalt Grey',
      tag: '420 GSM TERRY',
      badge: 'CORE',
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      icon: 'pants',
      description: 'Open-hem wide-leg lounge fleece with raw edge waistband drawcords.'
    },
    {
      id: 'w-tee-02',
      name: 'CYBER GRAPHIC BOXY TEE',
      category: 'Tees & Tops',
      price: 4200,
      colorway: 'Jet Black / Lime',
      tag: '280 GSM JERSEY',
      badge: 'NEW',
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      icon: 'tee',
      description: 'Oversized unisex-block women’s cut featuring reflective back typography.'
    },
    {
      id: 'w-acc-01',
      name: 'TACTICAL CROSSBODY SLING',
      category: 'Accessories',
      price: 4500,
      colorway: 'Stealth Black',
      tag: 'CORDURA NYLON',
      badge: 'GEAR',
      sizes: ['ONE SIZE'],
      icon: 'bag',
      description: 'Compact weatherproof crossbody bag with quick-release fidlock buckle.'
    }
  ];

  function getSilhouetteSvg(type) {
    if (type === 'hoodie') {
      return '<svg class="ud-product-silhouette" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M22 14c0-5 4-8 10-8s10 3 10 8l10 6 4 20-8 3-3-13v24H19V30l-3 13-8-3 4-20 10-6z"/>' +
        '<path d="M24 14c2 4 14 4 16 0"/>' +
        '<rect x="24" y="38" width="16" height="10" rx="2"/>' +
      '</svg>';
    }
    if (type === 'jacket') {
      return '<svg class="ud-product-silhouette" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M20 12l12 4 12-4 10 8 4 22-9 2-3-14v24H18V30l-3 14-9-2 4-22 10-8z"/>' +
        '<line x1="32" y1="16" x2="32" y2="54"/>' +
      '</svg>';
    }
    if (type === 'pants') {
      return '<svg class="ud-product-silhouette" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M18 10h28l4 44-12 2-6-26-6 26-12-2 4-44z"/>' +
        '<line x1="18" y1="18" x2="46" y2="18"/>' +
        '<rect x="14" y="28" width="7" height="10" rx="1"/>' +
        '<rect x="43" y="28" width="7" height="10" rx="1"/>' +
      '</svg>';
    }
    if (type === 'bag') {
      return '<svg class="ud-product-silhouette" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<rect x="14" y="22" width="36" height="28" rx="4"/>' +
        '<path d="M22 22c0-7 4-12 10-12s10 5 10 12"/>' +
        '<line x1="14" y1="34" x2="50" y2="34"/>' +
        '<rect x="28" y="31" width="8" height="6" rx="1"/>' +
      '</svg>';
    }
    return '<svg class="ud-product-silhouette" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M20 12c3 4 21 4 24 0l12 8-5 11-7-3v24H20V28l-7 3-5-11 12-8z"/>' +
    '</svg>';
  }

  function initWomensCatalog() {
    const grid = document.getElementById('womensCatalogGrid');
    if (!grid) return;

    const searchInput = document.getElementById('catalogSearchInput');
    const navSearchInput = document.getElementById('udNavSearchInput');
    const navSearchForm = document.getElementById('udNavSearchForm');
    const sortSelect = document.getElementById('catalogPriceSort');
    const categoryButtons = document.querySelectorAll('[data-catalog-category]');
    const countLabel = document.getElementById('catalogCountLabel');
    const emptyState = document.getElementById('catalogEmptyState');
    const resetBtn = document.getElementById('resetCatalogFilters');

    let activeCategory = 'All';
    let searchQuery = '';
    let sortMode = 'featured';
    const selectedSizes = {};

    WOMENS_CATALOG.forEach(function (item) {
      selectedSizes[item.id] = item.sizes.includes('M') ? 'M' : item.sizes[0];
    });

    function addToCart(productId) {
      const product = WOMENS_CATALOG.find(function (p) { return p.id === productId; });
      if (!product) return;

      const chosenSize = selectedSizes[productId] || product.sizes[0];
      const cart = readCart();
      const existing = cart.find(function (entry) {
        return entry.id === product.id && entry.size === chosenSize;
      });

      if (existing) {
        existing.qty += 1;
      } else {
        cart.push({
          id: product.id,
          name: product.name,
          category: product.category,
          colorway: product.colorway,
          size: chosenSize,
          price: product.price,
          qty: 1,
          icon: product.icon
        });
      }

      writeCart(cart);
      showCommerceToast('Added "' + product.name + '" (' + chosenSize + ') to cart.');
    }

    function renderCatalog() {
      const lowerQuery = searchQuery.trim().toLowerCase();

      let filtered = WOMENS_CATALOG.filter(function (item) {
        const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
        const matchesSearch = !lowerQuery ||
          item.name.toLowerCase().includes(lowerQuery) ||
          item.category.toLowerCase().includes(lowerQuery) ||
          item.colorway.toLowerCase().includes(lowerQuery) ||
          item.tag.toLowerCase().includes(lowerQuery) ||
          item.description.toLowerCase().includes(lowerQuery);
        return matchesCategory && matchesSearch;
      });

      if (sortMode === 'price-asc') {
        filtered = filtered.slice().sort(function (a, b) { return a.price - b.price; });
      } else if (sortMode === 'price-desc') {
        filtered = filtered.slice().sort(function (a, b) { return b.price - a.price; });
      }

      if (countLabel) {
        countLabel.textContent = 'Showing ' + filtered.length + ' of ' + WOMENS_CATALOG.length + ' Pieces';
      }

      if (emptyState) {
        emptyState.classList.toggle('d-none', filtered.length > 0);
      }

      grid.innerHTML = '';

      filtered.forEach(function (item) {
        const col = document.createElement('div');
        col.className = 'col-12 col-sm-6 col-lg-4';

        const sizeChipsHtml = item.sizes.map(function (sz) {
          const isActive = selectedSizes[item.id] === sz;
          return '<button type="button" class="ud-size-chip ' + (isActive ? 'is-active' : '') + '" data-product-id="' + item.id + '" data-size-val="' + sz + '">' + sz + '</button>';
        }).join('');

        col.innerHTML =
          '<article class="ud-product-card">' +
            '<div class="ud-product-visual">' +
              '<span class="ud-product-tag">' + item.tag + '</span>' +
              '<span class="ud-product-badge-drop">' + item.badge + '</span>' +
              getSilhouetteSvg(item.icon) +
            '</div>' +
            '<div class="p-3 p-md-4 d-flex flex-column flex-grow-1">' +
              '<div class="d-flex justify-content-between align-items-center mb-1">' +
                '<span class="ud-mono small text-uppercase" style="color: var(--ud-accent);">' + item.category + '</span>' +
                '<span class="ud-mono small text-secondary">' + item.colorway + '</span>' +
              '</div>' +
              '<h2 class="h5 fw-bold mb-2">' + item.name + '</h2>' +
              '<p class="text-secondary small mb-3 flex-grow-1">' + item.description + '</p>' +
              '<div class="mb-3">' +
                '<div class="ud-mono small text-secondary mb-1">SIZE:</div>' +
                '<div class="d-flex flex-wrap gap-1">' + sizeChipsHtml + '</div>' +
              '</div>' +
              '<div class="d-flex align-items-center justify-content-between gap-2 pt-2 border-top border-secondary border-opacity-25">' +
                '<span class="ud-price-tag">' + formatPKR(item.price) + '</span>' +
                '<button type="button" class="btn ud-btn-cta btn-sm" data-add-to-cart="' + item.id + '">Add to Cart</button>' +
              '</div>' +
            '</div>' +
          '</article>';

        grid.appendChild(col);
      });

      grid.querySelectorAll('[data-size-val]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          const pid = btn.getAttribute('data-product-id');
          const sz = btn.getAttribute('data-size-val');
          selectedSizes[pid] = sz;
          grid.querySelectorAll('[data-product-id="' + pid + '"]').forEach(function (sib) {
            sib.classList.toggle('is-active', sib.getAttribute('data-size-val') === sz);
          });
        });
      });

      grid.querySelectorAll('[data-add-to-cart]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          addToCart(btn.getAttribute('data-add-to-cart'));
        });
      });
    }

    categoryButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        activeCategory = btn.getAttribute('data-catalog-category');
        categoryButtons.forEach(function (b) {
          b.classList.toggle('active', b === btn);
        });
        renderCatalog();
      });
    });

    if (searchInput) {
      searchInput.addEventListener('input', function () {
        searchQuery = searchInput.value;
        if (navSearchInput) navSearchInput.value = searchQuery;
        renderCatalog();
      });
    }

    if (navSearchInput && navSearchForm) {
      navSearchInput.addEventListener('input', function () {
        searchQuery = navSearchInput.value;
        if (searchInput) searchInput.value = searchQuery;
        renderCatalog();
      });
      navSearchForm.addEventListener('submit', function (event) {
        event.preventDefault();
        searchQuery = navSearchInput.value;
        if (searchInput) searchInput.value = searchQuery;
        renderCatalog();
      }, true);
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', function () {
        sortMode = sortSelect.value;
        renderCatalog();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        activeCategory = 'All';
        searchQuery = '';
        sortMode = 'featured';
        if (searchInput) searchInput.value = '';
        if (navSearchInput) navSearchInput.value = '';
        if (sortSelect) sortSelect.value = 'featured';
        categoryButtons.forEach(function (b) {
          b.classList.toggle('active', b.getAttribute('data-catalog-category') === 'All');
        });
        renderCatalog();
      });
    }

    renderCatalog();
  }

  /* ========================================================================
     2. CART & CHECKOUT PAGE (pages/cart-checkout.html)
     ======================================================================== */
  const SAMPLE_SEED_CART = [
    {
      id: 'w-hoodie-01',
      name: 'APEX CROPPED HEAVY HOODIE',
      category: 'Hoodies & Sweats',
      colorway: 'Obsidian Black / Acid',
      size: 'M',
      price: 7400,
      qty: 1,
      icon: 'hoodie'
    },
    {
      id: 'w-cargo-01',
      name: 'SECTOR-07 PARACHUTE CARGOS',
      category: 'Cargos & Bottoms',
      colorway: 'Graphite Charcoal',
      size: 'S',
      price: 8200,
      qty: 1,
      icon: 'pants'
    }
  ];

  function initCartCheckout() {
    const cartItemsContainer = document.getElementById('cartItemsContainer');
    if (!cartItemsContainer) return;

    const cartEmptyState = document.getElementById('cartEmptyState');
    const loadSampleCartBtn = document.getElementById('loadSampleCartBtn');
    const cartItemCountLabel = document.getElementById('cartItemCountLabel');

    const promoInput = document.getElementById('promoCodeInput');
    const applyPromoBtn = document.getElementById('applyPromoBtn');
    const promoFeedback = document.getElementById('promoFeedback');

    const summarySubtotalEl = document.getElementById('summarySubtotal');
    const summaryShippingEl = document.getElementById('summaryShipping');
    const summaryDiscountEl = document.getElementById('summaryDiscount');
    const summaryDiscountRow = document.getElementById('summaryDiscountRow');
    const summaryTotalEl = document.getElementById('summaryTotal');

    const checkoutForm = document.getElementById('checkoutShippingForm');
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    const orderAlert = document.getElementById('orderConfirmationAlert');
    const placedOrderIdEl = document.getElementById('placedOrderId');
    const placedOrderSummaryEl = document.getElementById('placedOrderSummary');
    const trackPlacedOrderLink = document.getElementById('trackPlacedOrderLink');

    let appliedPromo = '';

    function computeTotals(cart) {
      const subtotal = cart.reduce(function (sum, item) {
        return sum + (Number(item.price) * (parseInt(item.qty, 10) || 0));
      }, 0);
      const shipping = subtotal === 0 ? 0 : (subtotal >= 10000 ? 0 : 250);
      const discount = appliedPromo === 'URBAN10' ? Math.round(subtotal * 0.10) : 0;
      const total = Math.max(0, subtotal - discount + shipping);
      return { subtotal: subtotal, shipping: shipping, discount: discount, total: total };
    }

    function renderSummary(cart) {
      const totals = computeTotals(cart);

      if (summarySubtotalEl) summarySubtotalEl.textContent = formatPKR(totals.subtotal);
      if (summaryShippingEl) {
        summaryShippingEl.textContent = totals.subtotal === 0
          ? formatPKR(0)
          : (totals.shipping === 0 ? 'FREE' : formatPKR(totals.shipping));
      }
      if (summaryDiscountRow) {
        summaryDiscountRow.classList.toggle('d-none', totals.discount === 0);
      }
      if (summaryDiscountEl) {
        summaryDiscountEl.textContent = '- ' + formatPKR(totals.discount);
      }
      if (summaryTotalEl) summaryTotalEl.textContent = formatPKR(totals.total);

      if (placeOrderBtn) {
        placeOrderBtn.disabled = cart.length === 0;
      }
    }

    function renderCart() {
      const cart = readCart();
      const totalQty = cart.reduce(function (sum, item) { return sum + (parseInt(item.qty, 10) || 0); }, 0);

      if (cartItemCountLabel) {
        cartItemCountLabel.textContent = totalQty + ' ' + (totalQty === 1 ? 'Item' : 'Items');
      }

      if (cartEmptyState) {
        cartEmptyState.classList.toggle('d-none', cart.length > 0);
      }

      cartItemsContainer.innerHTML = '';

      cart.forEach(function (item, index) {
        const lineTotal = Number(item.price) * (parseInt(item.qty, 10) || 1);
        const card = document.createElement('article');
        card.className = 'ud-cart-item';

        card.innerHTML =
          '<div class="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">' +
            '<div class="d-flex align-items-center gap-3">' +
              '<div class="ud-cart-thumb">' +
                getSilhouetteSvg(item.icon || 'tee').replace('class="ud-product-silhouette"', 'width="44" height="44"') +
              '</div>' +
              '<div>' +
                '<span class="ud-mono small text-uppercase" style="color: var(--ud-accent);">' + (item.category || 'URBANDROPS') + '</span>' +
                '<h2 class="h6 fw-bold mb-1">' + item.name + '</h2>' +
                '<div class="ud-mono small text-secondary">' +
                  'SIZE: <span class="text-white">' + item.size + '</span> &bull; ' + (item.colorway || 'Standard') +
                '</div>' +
                '<div class="ud-mono small text-secondary mt-1">' + formatPKR(item.price) + ' each</div>' +
              '</div>' +
            '</div>' +
            '<div class="d-flex align-items-center justify-content-between justify-content-sm-end gap-3">' +
              '<div class="ud-qty-group" aria-label="Quantity controls for ' + item.name + '">' +
                '<button type="button" class="ud-qty-btn" data-qty-dec="' + index + '" aria-label="Decrease quantity">-</button>' +
                '<span class="ud-qty-value">' + item.qty + '</span>' +
                '<button type="button" class="ud-qty-btn" data-qty-inc="' + index + '" aria-label="Increase quantity">+</button>' +
              '</div>' +
              '<div class="text-end" style="min-width: 92px;">' +
                '<div class="ud-mono fw-bold text-white">' + formatPKR(lineTotal) + '</div>' +
                '<button type="button" class="ud-remove-btn mt-1" data-remove-idx="' + index + '">Remove</button>' +
              '</div>' +
            '</div>' +
          '</div>';

        cartItemsContainer.appendChild(card);
      });

      cartItemsContainer.querySelectorAll('[data-qty-dec]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          const idx = parseInt(btn.getAttribute('data-qty-dec'), 10);
          const updated = readCart();
          if (!updated[idx]) return;
          if (updated[idx].qty > 1) {
            updated[idx].qty -= 1;
          } else {
            updated.splice(idx, 1);
          }
          writeCart(updated);
          renderCart();
        });
      });

      cartItemsContainer.querySelectorAll('[data-qty-inc]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          const idx = parseInt(btn.getAttribute('data-qty-inc'), 10);
          const updated = readCart();
          if (!updated[idx]) return;
          updated[idx].qty += 1;
          writeCart(updated);
          renderCart();
        });
      });

      cartItemsContainer.querySelectorAll('[data-remove-idx]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          const idx = parseInt(btn.getAttribute('data-remove-idx'), 10);
          const updated = readCart();
          const removed = updated.splice(idx, 1);
          writeCart(updated);
          renderCart();
          if (removed[0]) {
            showCommerceToast('Removed "' + removed[0].name + '" from cart.');
          }
        });
      });

      renderSummary(cart);
    }

    if (loadSampleCartBtn) {
      loadSampleCartBtn.addEventListener('click', function () {
        writeCart(SAMPLE_SEED_CART.map(function (item) { return Object.assign({}, item); }));
        renderCart();
        showCommerceToast('Loaded 2 sample URBANDROPS items into your cart.');
      });
    }

    if (applyPromoBtn && promoInput) {
      applyPromoBtn.addEventListener('click', function () {
        const code = promoInput.value.trim().toUpperCase();
        if (promoFeedback) {
          promoFeedback.classList.remove('is-valid', 'is-invalid');
        }

        if (code === 'URBAN10') {
          appliedPromo = 'URBAN10';
          if (promoFeedback) {
            promoFeedback.classList.add('is-valid');
            promoFeedback.textContent = 'Promo URBAN10 applied: 10% off subtotal.';
          }
        } else if (code === '') {
          appliedPromo = '';
          if (promoFeedback) {
            promoFeedback.classList.add('is-invalid');
            promoFeedback.textContent = 'Enter a promo code (try URBAN10).';
          }
        } else {
          appliedPromo = '';
          if (promoFeedback) {
            promoFeedback.classList.add('is-invalid');
            promoFeedback.textContent = 'Invalid promo code. Use URBAN10 for 10% off.';
          }
        }
        renderSummary(readCart());
      });
    }

    if (checkoutForm) {
      checkoutForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const cart = readCart();
        if (cart.length === 0) {
          showCommerceToast('Your cart is empty. Add items before placing an order.');
          return;
        }

        const fullName = document.getElementById('shipName');
        const email = document.getElementById('shipEmail');
        const phone = document.getElementById('shipPhone');
        const address = document.getElementById('shipAddress');
        const city = document.getElementById('shipCity');
        const postal = document.getElementById('shipPostal');

        const requiredFields = [fullName, email, phone, address, city, postal];
        let valid = true;

        requiredFields.forEach(function (field) {
          if (!field) return;
          const ok = field.value.trim().length > 0 && (field.id !== 'shipEmail' || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(field.value.trim()));
          field.classList.toggle('is-invalid-ud', !ok);
          field.classList.toggle('is-valid-ud', ok);
          if (!ok) valid = false;
        });

        if (!valid) {
          showCommerceToast('Please complete all shipping address fields.');
          return;
        }

        const totals = computeTotals(cart);
        const orderCode = '#UD-' + Math.floor(2000 + Math.random() * 7999);
        const nowStr = new Date().toLocaleString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        // Save placed order so user can immediately track it on order-tracking.html
        try {
          const existingOrders = JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || '{}');
          existingOrders[orderCode.replace('#', '').toUpperCase()] = {
            orderId: orderCode,
            customer: fullName.value.trim(),
            city: city.value,
            total: formatPKR(totals.total),
            carrier: 'URBANDROPS Express Dispatch',
            eta: 'Est. Delivery: 2–3 Business Days',
            currentStep: 1,
            steps: [
              { title: 'Order Placed', status: 'completed', time: nowStr, location: 'Online Checkout', note: 'Order confirmed & payment verified.' },
              { title: 'Processing', status: 'pending', time: 'Pending', location: 'Lahore Fulfillment Hub', note: 'Queued for garment QC & serial tagging.' },
              { title: 'Shipped', status: 'pending', time: 'Pending', location: 'In Transit', note: 'Awaiting courier handoff.' },
              { title: 'Delivered', status: 'pending', time: 'Pending', location: city.value, note: 'Awaiting final doorstep delivery.' }
            ]
          };
          localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(existingOrders));
        } catch (err) {
          // Ignore storage issues
        }

        if (placedOrderIdEl) placedOrderIdEl.textContent = orderCode;
        if (placedOrderSummaryEl) {
          placedOrderSummaryEl.textContent =
            'Total charged: ' + formatPKR(totals.total) + ' • Shipping to ' + address.value.trim() + ', ' + city.value + '.';
        }
        if (trackPlacedOrderLink) {
          trackPlacedOrderLink.href = 'order-tracking.html?order=' + encodeURIComponent(orderCode.replace('#', ''));
        }
        if (orderAlert) {
          orderAlert.classList.remove('d-none');
          orderAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        appliedPromo = '';
        if (promoInput) promoInput.value = '';
        if (promoFeedback) promoFeedback.textContent = '';
        checkoutForm.reset();
        requiredFields.forEach(function (f) {
          if (f) f.classList.remove('is-valid-ud', 'is-invalid-ud');
        });
        writeCart([]);
        renderCart();
      });
    }

    // Sync if localStorage changes in another tab
    window.addEventListener('storage', function (event) {
      if (event.key === CART_STORAGE_KEY || event.key === CART_COUNT_KEY) {
        renderCart();
      }
    });

    renderCart();
  }

  /* ========================================================================
     3. ORDER TRACKING PAGE (pages/order-tracking.html)
     ======================================================================== */
  const DEMO_ORDERS = {
    'UD-1042': {
      orderId: '#UD-1042',
      customer: 'Amina Farooq',
      city: 'Islamabad (F-7 Sector)',
      total: 'PKR 15,600',
      carrier: 'TCS Overland Express // AWB-992410',
      eta: 'Arriving Today by 6:00 PM PKT',
      currentStep: 3,
      steps: [
        {
          title: 'Order Placed',
          status: 'completed',
          time: 'Nov 24, 2026 • 02:14 PM',
          location: 'URBANDROPS Online Store',
          note: 'Order verified and drop inventory reserved.'
        },
        {
          title: 'Processing',
          status: 'completed',
          time: 'Nov 24, 2026 • 05:40 PM',
          location: 'Lahore Fulfillment Hub',
          note: 'Garment QC passed, sealed in weatherproof drop bag.'
        },
        {
          title: 'Shipped',
          status: 'current',
          time: 'Nov 26, 2026 • 09:05 AM',
          location: 'Islamabad Regional Hub',
          note: 'Out for delivery with courier rider #412.'
        },
        {
          title: 'Delivered',
          status: 'pending',
          time: 'Est. Nov 27, 2026',
          location: 'F-7 Markaz, Islamabad',
          note: 'Signature required at doorstep.'
        }
      ]
    },
    'UD-1088': {
      orderId: '#UD-1088',
      customer: 'Sara Malik',
      city: 'Karachi (Clifton Block 4)',
      total: 'PKR 12,900',
      carrier: 'Leopards Express // LHR-KHI-771',
      eta: 'Delivered',
      currentStep: 4,
      steps: [
        {
          title: 'Order Placed',
          status: 'completed',
          time: 'Nov 20, 2026 • 11:30 AM',
          location: 'URBANDROPS Online Store',
          note: 'Prepaid card order confirmed.'
        },
        {
          title: 'Processing',
          status: 'completed',
          time: 'Nov 20, 2026 • 04:15 PM',
          location: 'Lahore Fulfillment Hub',
          note: 'Packed and handed to air-freight linehaul.'
        },
        {
          title: 'Shipped',
          status: 'completed',
          time: 'Nov 21, 2026 • 08:20 AM',
          location: 'Karachi Sorting Facility',
          note: 'Dispatched to Clifton local route.'
        },
        {
          title: 'Delivered',
          status: 'completed',
          time: 'Nov 22, 2026 • 01:47 PM',
          location: 'Clifton Block 4, Karachi',
          note: 'Signed for by recipient at front gate.'
        }
      ]
    },
    'UD-1019': {
      orderId: '#UD-1019',
      customer: 'Hira Naveed',
      city: 'Lahore (DHA Phase 5)',
      total: 'PKR 7,650',
      carrier: 'URBANDROPS Same-Day Rider',
      eta: 'Preparing Dispatch',
      currentStep: 2,
      steps: [
        {
          title: 'Order Placed',
          status: 'completed',
          time: 'Nov 27, 2026 • 08:45 AM',
          location: 'URBANDROPS Online Store',
          note: 'Cash on Delivery order confirmed.'
        },
        {
          title: 'Processing',
          status: 'current',
          time: 'Nov 27, 2026 • 10:10 AM',
          location: 'Gulberg III Packing Studio',
          note: 'Steam-pressing and quality tagging in progress.'
        },
        {
          title: 'Shipped',
          status: 'pending',
          time: 'Scheduled Today',
          location: 'Lahore Metro Dispatch',
          note: 'Courier pickup scheduled for 2:00 PM.'
        },
        {
          title: 'Delivered',
          status: 'pending',
          time: 'Est. Nov 27, 2026 Evening',
          location: 'DHA Phase 5, Lahore',
          note: 'Rider will call 15 mins prior to arrival.'
        }
      ]
    }
  };

  function getOrderByCode(rawCode) {
    const normalized = rawCode.trim().replace(/^#/, '').toUpperCase();
    if (!normalized) return null;

    if (DEMO_ORDERS[normalized]) {
      return DEMO_ORDERS[normalized];
    }

    try {
      const saved = JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || '{}');
      if (saved[normalized]) return saved[normalized];
    } catch (err) {
      // Ignore parse errors
    }

    return null;
  }

  function initOrderTracking() {
    const lookupForm = document.getElementById('orderTrackingForm');
    const orderInput = document.getElementById('orderIdInput');
    const trackingResultCard = document.getElementById('trackingResultCard');
    const trackingNotFound = document.getElementById('trackingNotFound');
    const progressFill = document.getElementById('trackingProgressFill');
    const stepsContainer = document.getElementById('trackingStepsContainer');
    const timestampsContainer = document.getElementById('trackingTimestampsContainer');

    if (!lookupForm || !orderInput || !stepsContainer || !timestampsContainer) return;

    function renderOrder(order) {
      if (!order) {
        if (trackingResultCard) trackingResultCard.classList.add('d-none');
        if (trackingNotFound) trackingNotFound.classList.remove('d-none');
        return;
      }

      if (trackingNotFound) trackingNotFound.classList.add('d-none');
      if (trackingResultCard) trackingResultCard.classList.remove('d-none');

      const idEl = document.getElementById('trackMetaOrderId');
      const customerEl = document.getElementById('trackMetaCustomer');
      const cityEl = document.getElementById('trackMetaCity');
      const carrierEl = document.getElementById('trackMetaCarrier');
      const etaEl = document.getElementById('trackMetaEta');
      const totalEl = document.getElementById('trackMetaTotal');

      if (idEl) idEl.textContent = order.orderId;
      if (customerEl) customerEl.textContent = order.customer;
      if (cityEl) cityEl.textContent = order.city;
      if (carrierEl) carrierEl.textContent = order.carrier;
      if (etaEl) etaEl.textContent = order.eta;
      if (totalEl) totalEl.textContent = order.total;

      const percentMap = { 1: '25%', 2: '50%', 3: '75%', 4: '100%' };
      if (progressFill) {
        progressFill.style.width = percentMap[order.currentStep] || '25%';
        progressFill.setAttribute('aria-valuenow', String((order.currentStep || 1) * 25));
      }

      stepsContainer.innerHTML = '';
      timestampsContainer.innerHTML = '';

      order.steps.forEach(function (step, idx) {
        const stateClass = step.status === 'completed'
          ? 'is-completed'
          : (step.status === 'current' ? 'is-current' : '');

        const statusBadgeText = step.status === 'completed'
          ? 'DONE'
          : (step.status === 'current' ? 'IN PROGRESS' : 'PENDING');

        const stepNode = document.createElement('div');
        stepNode.className = 'ud-track-step-node ' + stateClass;
        stepNode.innerHTML =
          '<div class="d-flex justify-content-between align-items-center mb-1">' +
            '<span class="ud-track-step-index">0' + (idx + 1) + '</span>' +
            '<span class="ud-mono small" style="color:' + (step.status === 'completed' ? 'var(--ud-accent)' : (step.status === 'current' ? 'var(--ud-cta)' : 'var(--ud-text-muted)')) + ';">' + statusBadgeText + '</span>' +
          '</div>' +
          '<h3 class="h6 fw-bold mb-1">' + step.title + '</h3>' +
          '<div class="ud-mono small text-secondary">' + step.time + '</div>';

        stepsContainer.appendChild(stepNode);

        const tsCol = document.createElement('div');
        tsCol.className = 'col-12 col-md-6';
        tsCol.innerHTML =
          '<article class="ud-timestamp-card ' + stateClass + '">' +
            '<div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">' +
              '<span class="ud-mono small fw-bold text-uppercase" style="color:' + (step.status === 'completed' ? 'var(--ud-accent)' : (step.status === 'current' ? 'var(--ud-cta)' : 'var(--ud-text-muted)')) + ';">' +
                'STEP 0' + (idx + 1) + ' // ' + step.title +
              '</span>' +
              '<span class="ud-city-badge">' + step.time + '</span>' +
            '</div>' +
            '<div class="small fw-semibold text-white mb-1">' + step.location + '</div>' +
            '<p class="small text-secondary mb-0">' + step.note + '</p>' +
          '</article>';

        timestampsContainer.appendChild(tsCol);
      });
    }

    lookupForm.addEventListener('submit', function (event) {
      event.preventDefault();
      const order = getOrderByCode(orderInput.value);
      renderOrder(order);
    });

    document.querySelectorAll('[data-sample-order]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const sample = btn.getAttribute('data-sample-order');
        orderInput.value = sample;
        renderOrder(getOrderByCode(sample));
      });
    });

    // Check URL ?order= parameter or load #UD-1042 by default
    const params = new URLSearchParams(window.location.search);
    const urlOrder = params.get('order');
    const initialCode = urlOrder ? ('#' + urlOrder.replace(/^#/, '').toUpperCase()) : '#UD-1042';
    orderInput.value = initialCode;
    renderOrder(getOrderByCode(initialCode));
  }

  /* ========================================================================
     INIT ON DOM READY
     ======================================================================== */
  document.addEventListener('DOMContentLoaded', function () {
    initWomensCatalog();
    initCartCheckout();
    initOrderTracking();
  });
})();

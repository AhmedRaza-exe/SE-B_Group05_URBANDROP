/* ==========================================================================
   URBANDROPS — Core Storefront Script (Vanilla JS + Bootstrap 5)
   ========================================================================== */

(function () {
  'use strict';

  const isPagesDir = window.location.pathname.replace(/\\/g, '/').includes('/pages/');
  const assetBase = isPagesDir ? '../images/' : 'images/';
  const rootBase = isPagesDir ? '../' : '';

  // ------------------------------------------------------------------------
  // Data: Trending Products (Rendered dynamically on index.html)
  // ------------------------------------------------------------------------
  const trendingProducts = [
    {
      id: 'ud-hoodie-01',
      name: 'VOID 480 BOX HOODIE',
      category: '480 GSM FRENCH TERRY',
      badge: 'DROP 04',
      stock: '18 / 100 LEFT',
      price: 165,
      image: assetBase + 'prod-hoodie.jpg',
      sizes: ['S', 'M', 'L', 'XL'],
      url: rootBase + 'index.html#trending-section'
    },
    {
      id: 'ud-cargo-02',
      name: 'VECTOR RIPSTOP CARGO',
      category: 'NYLON TECH WEAVE',
      badge: 'LIMITED',
      stock: '12 / 100 LEFT',
      price: 195,
      image: assetBase + 'prod-cargo.svg',
      sizes: ['S', 'M', 'L', 'XL'],
      url: rootBase + 'index.html#trending-section'
    },
    {
      id: 'ud-tee-03',
      name: 'STATIC ACID-WASH TEE',
      category: '310 GSM COMBED COTTON',
      badge: 'TRENDING',
      stock: '27 / 100 LEFT',
      price: 78,
      image: assetBase + 'prod-tee.svg',
      sizes: ['S', 'M', 'L', 'XL'],
      url: rootBase + 'index.html#trending-section'
    },
    {
      id: 'ud-jacket-04',
      name: 'PROTOCOL 3L SHELL JACKET',
      category: 'WEATHERPROOF MEMBRANE',
      badge: 'NEW DROP',
      stock: '09 / 100 LEFT',
      price: 280,
      image: assetBase + 'prod-jacket.jpg',
      sizes: ['S', 'M', 'L', 'XL'],
      url: rootBase + 'index.html#trending-section'
    }
  ];

  // ------------------------------------------------------------------------
  // Data: Lookbook Outfits (Used on pages/lookbook.html & global search)
  // ------------------------------------------------------------------------
  const lookbookOutfits = [
    {
      id: 'look-01',
      lookNumber: 'LOOK #01',
      title: 'Tokyo Night',
      location: 'SHIBUYA SECTOR // 02:14 AM',
      description:
        'Layered nocturnal armor engineered for wet asphalt and neon glare. Combines our 3L storm bomber with articulated ripstop cargo.',
      image: assetBase + 'look-01-tokyo-night.jpg',
      url: rootBase + 'pages/lookbook.html#look-01',
      items: [
        { name: 'Protocol 3L Shell Bomber', spec: 'Waterproof Taped Seams', price: 280 },
        { name: 'Vector Ripstop Cargo', spec: 'Articulated Knee Pleats', price: 195 }
      ]
    },
    {
      id: 'look-02',
      lookNumber: 'LOOK #02',
      title: 'Cyber Utility',
      location: 'ROOFTOP GRID // DUSK',
      description:
        'Modular urban carry meets washed heavyweight jersey. Built with quick-release hardware and high-visibility Volt Lime cord.',
      image: assetBase + 'look-02-cyber-utility.svg',
      url: rootBase + 'pages/lookbook.html#look-02',
      items: [
        { name: 'Tactical Grid Utility Vest', spec: 'Cordura Ballistic Nylon', price: 210 },
        { name: 'Static Acid-Wash Tee', spec: '310 GSM Enzyme Wash', price: 78 },
        { name: 'Strap Cargo Trousers', spec: 'DWR Ripstop + Lime Cord', price: 195 }
      ]
    }
  ];

  // ------------------------------------------------------------------------
  // Cart State (localStorage 'cartCount' & 'cartItems')
  // ------------------------------------------------------------------------
  function getCartCount() {
    const raw = localStorage.getItem('cartCount');
    const parsed = parseInt(raw, 10);
    return Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;
  }

  function getCartItems() {
    try {
      const raw = localStorage.getItem('cartItems');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function setCartState(count, items) {
    const safeCount = Math.max(0, Number(count) || 0);
    localStorage.setItem('cartCount', String(safeCount));
    if (items !== undefined) {
      localStorage.setItem('cartItems', JSON.stringify(items));
    }
    updateCartBadge(true);
    renderCartDrawer();
  }

  function updateCartBadge(animate) {
    const count = getCartCount();
    const badges = document.querySelectorAll('[data-cart-badge]');
    badges.forEach((badge) => {
      badge.textContent = String(count);
      if (animate) {
        badge.classList.remove('bump');
        void badge.offsetWidth;
        badge.classList.add('bump');
        setTimeout(() => badge.classList.remove('bump'), 280);
      }
    });
  }

  function addEntryToCart(entry, incrementBy) {
    const currentCount = getCartCount();
    const items = getCartItems();
    const qtyToAdd = incrementBy || 1;

    const existing = items.find(
      (it) => it.id === entry.id && it.size === entry.size
    );
    if (existing) {
      existing.qty += qtyToAdd;
    } else {
      items.push({
        id: entry.id,
        name: entry.name,
        size: entry.size,
        price: entry.price,
        image: entry.image,
        qty: qtyToAdd,
        unitCount: entry.unitCount || 1
      });
    }

    setCartState(currentCount + qtyToAdd, items);
  }

  // ------------------------------------------------------------------------
  // Floating Volt Lime (#CCFF00) Notification Toast
  // ------------------------------------------------------------------------
  function showToast(message) {
    let container = document.getElementById('ud-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'ud-toast-container';
      container.className = 'ud-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'ud-toast mb-2';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.innerHTML = `<div class="d-flex align-items-center justify-content-between gap-3">
      <span>${escapeHtml(message)}</span>
      <button type="button" class="ud-toast-close" aria-label="Close">×</button>
    </div>`;

    container.appendChild(toast);
    const closeBtn = toast.querySelector('.ud-toast-close');
    closeBtn.addEventListener('click', () => toast.remove());

    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 3800);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ------------------------------------------------------------------------
  // Cart Offcanvas Drawer (Injected once per page for instant cart inspection)
  // ------------------------------------------------------------------------
  function ensureCartDrawer() {
    if (document.getElementById('udCartOffcanvas')) return;

    const drawerHtml = `
      <div class="offcanvas offcanvas-end bg-charcoal text-white border-start border-secondary" tabindex="-1" id="udCartOffcanvas" aria-labelledby="udCartOffcanvasLabel">
        <div class="offcanvas-header border-bottom border-secondary border-opacity-25">
          <div>
            <span class="font-mono-tech text-lime small d-block">URBANDROPS // BAG</span>
            <h5 class="offcanvas-title font-display fw-bold text-uppercase mb-0" id="udCartOffcanvasLabel">Your Drop Bag</h5>
          </div>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>
        <div class="offcanvas-body d-flex flex-column">
          <div id="udCartDrawerItems" class="flex-grow-1"></div>
          <div class="border-top border-secondary border-opacity-25 pt-3 mt-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="font-mono-tech small text-ud-muted">TOTAL ITEMS</span>
              <span class="font-mono-tech fw-bold text-lime" id="udCartDrawerCount">0</span>
            </div>
            <div class="d-flex justify-content-between align-items-center mb-3">
              <span class="font-mono-tech small text-ud-muted">ESTIMATED SUBTOTAL</span>
              <span class="font-display fs-5 fw-bold" id="udCartDrawerSubtotal">$0</span>
            </div>
            <div class="d-grid gap-2">
              <button type="button" class="btn btn-ud-orange" id="udCheckoutBtn">PROCEED TO DROP CHECKOUT</button>
              <button type="button" class="btn btn-outline-secondary btn-sm font-mono-tech text-uppercase" id="udClearCartBtn">Clear Bag</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', drawerHtml);

    document.getElementById('udClearCartBtn').addEventListener('click', () => {
      setCartState(0, []);
      showToast('Bag cleared.');
    });

    document.getElementById('udCheckoutBtn').addEventListener('click', () => {
      const count = getCartCount();
      if (count === 0) {
        showToast('Your drop bag is currently empty.');
        return;
      }
      showToast(`Reserved ${count} limited-drop item(s) for 10:00 mins.`);
    });
  }

  function renderCartDrawer() {
    const container = document.getElementById('udCartDrawerItems');
    const countEl = document.getElementById('udCartDrawerCount');
    const subtotalEl = document.getElementById('udCartDrawerSubtotal');
    if (!container) return;

    const count = getCartCount();
    const items = getCartItems();

    if (countEl) countEl.textContent = String(count);

    if (items.length === 0) {
      if (subtotalEl) subtotalEl.textContent = '$0';
      container.innerHTML = `
        <div class="text-center py-5">
          <p class="font-mono-tech text-ud-muted small mb-3">
            ${count > 0 ? `${count} item(s) stored in cart counter.` : 'NO PIECES SECURED YET.'}
          </p>
          <a href="${rootBase}pages/lookbook.html" class="btn btn-ud-outline-lime btn-sm">EXPLORE LOOKBOOK</a>
        </div>
      `;
      return;
    }

    let subtotal = 0;
    container.innerHTML = items
      .map((item, idx) => {
        const lineTotal = (item.price || 0) * (item.unitCount ? item.qty / item.unitCount : item.qty);
        subtotal += lineTotal;
        return `
          <div class="d-flex gap-3 align-items-center py-3 border-bottom border-secondary border-opacity-25">
            <img src="${escapeHtml(item.image || assetBase + 'Logo.png')}" alt="${escapeHtml(item.name)}" width="58" height="58" class="rounded object-fit-cover border border-secondary border-opacity-25">
            <div class="flex-grow-1 min-w-0">
              <div class="fw-bold small text-truncate">${escapeHtml(item.name)}</div>
              <div class="font-mono-tech text-ud-muted" style="font-size:0.7rem;">SIZE: ${escapeHtml(item.size)} // QTY: ${item.qty}</div>
              <div class="font-mono-tech text-lime small mt-1">$${Math.round(lineTotal)}</div>
            </div>
            <button type="button" class="btn btn-sm btn-outline-secondary font-mono-tech px-2 py-1 ud-remove-item" data-idx="${idx}" aria-label="Remove item">×</button>
          </div>
        `;
      })
      .join('');

    if (subtotalEl) subtotalEl.textContent = `$${Math.round(subtotal)}`;

    container.querySelectorAll('.ud-remove-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        const currentItems = getCartItems();
        const removed = currentItems.splice(idx, 1)[0];
        const nextCount = Math.max(0, getCartCount() - (removed ? removed.qty : 0));
        setCartState(nextCount, currentItems);
      });
    });
  }

  // ------------------------------------------------------------------------
  // Home Page: Render 4-Item Trending Products Grid from JS Array
  // ------------------------------------------------------------------------
  function renderTrendingProducts(filterQuery) {
    const grid = document.getElementById('trending-products-grid');
    if (!grid) return;

    const query = (filterQuery || '').trim().toLowerCase();
    const filtered = query
      ? trendingProducts.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            p.category.toLowerCase().includes(query) ||
            p.badge.toLowerCase().includes(query)
        )
      : trendingProducts;

    const statusEl = document.getElementById('trending-search-status');
    if (statusEl) {
      if (query) {
        statusEl.textContent = `Showing ${filtered.length} of ${trendingProducts.length} pieces for "${filterQuery.trim()}"`;
        statusEl.classList.remove('d-none');
      } else {
        statusEl.classList.add('d-none');
      }
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="col-12">
          <div class="bg-charcoal border border-secondary border-opacity-25 rounded p-5 text-center">
            <p class="font-mono-tech text-lime mb-2">ZERO MATCHES FOUND</p>
            <p class="text-ud-muted mb-3">No pieces in Drop 04 matched "${escapeHtml(filterQuery)}".</p>
            <button type="button" class="btn btn-ud-outline-lime btn-sm" id="reset-product-search">RESET FILTER</button>
          </div>
        </div>
      `;
      const resetBtn = document.getElementById('reset-product-search');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          const navSearch = document.getElementById('navbarSearchInput');
          if (navSearch) navSearch.value = '';
          renderTrendingProducts('');
        });
      }
      return;
    }

    grid.innerHTML = filtered
      .map((product) => {
        const sizeButtons = product.sizes
          .map(
            (size, idx) => `
              <button type="button"
                class="ud-size-mini ${idx === 1 ? 'active' : ''}"
                data-product-id="${product.id}"
                data-size="${size}">${size}</button>
            `
          )
          .join('');

        return `
          <div class="col">
            <article class="ud-card">
              <div class="ud-card-img-wrap">
                <span class="ud-tag-orange ud-card-badge-corner">${escapeHtml(product.badge)}</span>
                <span class="ud-card-stock-corner">${escapeHtml(product.stock)}</span>
                <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy">
              </div>
              <div class="p-3 d-flex flex-column flex-grow-1">
                <span class="font-mono-tech text-lime" style="font-size:0.68rem;">${escapeHtml(product.category)}</span>
                <h3 class="font-display fs-6 fw-bold text-uppercase mt-1 mb-2">${escapeHtml(product.name)}</h3>
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <span class="font-mono-tech fw-bold fs-5 text-white">$${product.price}</span>
                  <div class="d-flex gap-1" role="group" aria-label="Select size for ${escapeHtml(product.name)}">
                    ${sizeButtons}
                  </div>
                </div>
                <button type="button"
                  class="btn btn-ud-orange w-100 mt-auto py-2 ud-add-product-btn"
                  data-product-id="${product.id}">
                  ADD TO CART
                </button>
              </div>
            </article>
          </div>
        `;
      })
      .join('');

    // Wire size toggles
    grid.querySelectorAll('.ud-size-mini').forEach((btn) => {
      btn.addEventListener('click', () => {
        const pid = btn.getAttribute('data-product-id');
        grid
          .querySelectorAll(`.ud-size-mini[data-product-id="${pid}"]`)
          .forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Wire Add to Cart buttons
    grid.querySelectorAll('.ud-add-product-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const pid = btn.getAttribute('data-product-id');
        const product = trendingProducts.find((p) => p.id === pid);
        if (!product) return;
        const activeSizeBtn = grid.querySelector(`.ud-size-mini.active[data-product-id="${pid}"]`);
        const selectedSize = activeSizeBtn ? activeSizeBtn.getAttribute('data-size') : 'M';

        addEntryToCart(
          {
            id: product.id,
            name: product.name,
            size: selectedSize,
            price: product.price,
            image: product.image,
            unitCount: 1
          },
          1
        );

        showToast(`${product.name} (${selectedSize}) added.`);
      });
    });
  }

  // ------------------------------------------------------------------------
  // Home Page: Live Email Newsletter Validation
  // ------------------------------------------------------------------------
  function initNewsletterForm() {
    const form = document.getElementById('newsletter-form');
    const emailInput = document.getElementById('newsletter-email');
    const feedback = document.getElementById('newsletter-feedback');
    if (!form || !emailInput || !feedback) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function validateEmailLive() {
      const value = emailInput.value.trim();

      if (value === '') {
        emailInput.classList.remove('is-valid-ud', 'is-invalid-ud');
        feedback.textContent = 'Enter your email for early Drop 05 passcodes.';
        feedback.className = 'font-mono-tech small mt-2 text-ud-muted';
        return false;
      }

      if (!emailRegex.test(value)) {
        emailInput.classList.remove('is-valid-ud');
        emailInput.classList.add('is-invalid-ud');
        feedback.textContent = 'INVALID FORMAT // Provide a valid address (e.g. name@domain.com).';
        feedback.className = 'font-mono-tech small mt-2 text-orange';
        return false;
      }

      emailInput.classList.remove('is-invalid-ud');
      emailInput.classList.add('is-valid-ud');
      feedback.textContent = 'EMAIL VERIFIED // Ready for Drop Access.';
      feedback.className = 'font-mono-tech small mt-2 text-lime';
      return true;
    }

    emailInput.addEventListener('input', validateEmailLive);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validateEmailLive()) {
        emailInput.focus();
        return;
      }

      const submittedEmail = emailInput.value.trim();
      feedback.textContent = `ACCESS GRANTED // ${submittedEmail} added to Drop 05 VIP list.`;
      feedback.className = 'font-mono-tech small mt-2 text-lime fw-bold';
      showToast('Newsletter access confirmed.');
      form.reset();
      emailInput.classList.remove('is-valid-ud', 'is-invalid-ud');
    });
  }

  // ------------------------------------------------------------------------
  // Lookbook Page: Outfit Gallery & Pop-up Modal
  // ------------------------------------------------------------------------
  function initLookbookPage() {
    const gallery = document.getElementById('lookbook-gallery');
    const modalEl = document.getElementById('outfitModal');
    if (!gallery || !modalEl) return;

    // Render lookbook cards from JS array
    gallery.innerHTML = lookbookOutfits
      .map(
        (look) => `
          <div class="col-12 col-md-6 d-flex" id="${look.id}">
            <article class="ud-look-card">
              <div class="ud-look-media">
                <img src="${escapeHtml(look.image)}" alt="${escapeHtml(look.lookNumber)} - ${escapeHtml(look.title)}" loading="lazy">
                <div class="ud-look-overlay">
                  <div class="d-flex justify-content-between align-items-center mb-2 gap-2">
                    <span class="ud-tag-lime">${escapeHtml(look.lookNumber)}</span>
                    <span class="font-mono-tech small text-white-50">${look.items.length} ITEMS</span>
                  </div>
                  <h2 class="font-display fs-2 fw-bold text-uppercase text-white mb-1">${escapeHtml(look.title)}</h2>
                  <p class="font-mono-tech small text-ud-muted mb-0">${escapeHtml(look.location)}</p>
                </div>
              </div>
              <div class="ud-look-body d-flex flex-column flex-grow-1 justify-content-between">
                <p class="text-ud-muted mb-3">${escapeHtml(look.description)}</p>
                <div class="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center justify-content-between gap-3 pt-3 border-top border-secondary border-opacity-25">
                  <div>
                    <span class="font-mono-tech text-ud-muted d-block" style="font-size:0.68rem;">FULL OUTFIT (${look.items.length} ITEMS)</span>
                    <span class="font-mono-tech fw-bold fs-5 text-white">$${look.items.reduce((sum, i) => sum + i.price, 0)}</span>
                  </div>
                  <button type="button"
                    class="btn btn-ud-orange ud-btn-mobile-full ud-view-outfit-btn"
                    data-look-id="${look.id}">
                    View Outfit Items
                  </button>
                </div>
              </div>
            </article>
          </div>
        `
      )
      .join('');

    const outfitModal = new bootstrap.Modal(modalEl);
    let activeLook = null;
    let selectedSize = 'M';

    const modalTitle = document.getElementById('outfitModalTitle');
    const modalLocation = document.getElementById('outfitModalLocation');
    const modalImg = document.getElementById('outfitModalImage');
    const modalDesc = document.getElementById('outfitModalDesc');
    const modalItemsList = document.getElementById('outfitModalItems');
    const modalTotalPrice = document.getElementById('outfitModalTotal');
    const modalSelectedSizeLabel = document.getElementById('outfitSelectedSizeLabel');
    const addOutfitBtn = document.getElementById('addOutfitToCartBtn');
    const sizeButtons = modalEl.querySelectorAll('.ud-size-btn');

    function setActiveSize(size) {
      selectedSize = size;
      sizeButtons.forEach((btn) => {
        btn.classList.toggle('active', btn.getAttribute('data-size') === size);
      });
      if (modalSelectedSizeLabel) {
        modalSelectedSizeLabel.textContent = size;
      }
    }

    sizeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        setActiveSize(btn.getAttribute('data-size'));
      });
    });

    function openLookModal(lookId) {
      const look = lookbookOutfits.find((l) => l.id === lookId);
      if (!look) return;
      activeLook = look;
      setActiveSize('M');

      if (modalTitle) modalTitle.textContent = `${look.lookNumber} — ${look.title}`;
      if (modalLocation) modalLocation.textContent = look.location;
      if (modalImg) {
        modalImg.src = look.image;
        modalImg.alt = `${look.lookNumber} ${look.title}`;
      }
      if (modalDesc) modalDesc.textContent = look.description;

      const total = look.items.reduce((sum, item) => sum + item.price, 0);
      if (modalTotalPrice) modalTotalPrice.textContent = `$${total}`;

      if (modalItemsList) {
        modalItemsList.innerHTML = look.items
          .map(
            (item, i) => `
              <div class="ud-outfit-item-row">
                <div>
                  <div class="fw-semibold text-white">0${i + 1}. ${escapeHtml(item.name)}</div>
                  <div class="font-mono-tech text-ud-muted" style="font-size:0.72rem;">${escapeHtml(item.spec)}</div>
                </div>
                <span class="font-mono-tech fw-bold text-lime">$${item.price}</span>
              </div>
            `
          )
          .join('');
      }

      outfitModal.show();
    }

    gallery.querySelectorAll('.ud-view-outfit-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        openLookModal(btn.getAttribute('data-look-id'));
      });
    });

    if (addOutfitBtn) {
      addOutfitBtn.addEventListener('click', () => {
        if (!activeLook) return;
        const pieceCount = activeLook.items.length;
        const total = activeLook.items.reduce((sum, item) => sum + item.price, 0);

        addEntryToCart(
          {
            id: activeLook.id,
            name: `${activeLook.lookNumber} '${activeLook.title}' (${pieceCount} pcs)`,
            size: selectedSize,
            price: total,
            image: activeLook.image,
            unitCount: pieceCount
          },
          pieceCount
        );

        showToast(
          `${activeLook.title} Outfit (${pieceCount} Items) Added to Cart!`
        );
        outfitModal.hide();
      });
    }
  }

  // ------------------------------------------------------------------------
  // Global Navbar Search (Live grid filter on index + instant dropdown everywhere)
  // ------------------------------------------------------------------------
  function initNavbarSearch() {
    const input = document.getElementById('navbarSearchInput');
    const resultsBox = document.getElementById('navbarSearchResults');
    const searchForm = document.getElementById('navbarSearchForm');
    if (!input) return;

    const allSearchable = [
      ...trendingProducts.map((p) => ({
        title: p.name,
        subtitle: `${p.category} • $${p.price}`,
        image: p.image,
        url: p.url
      })),
      ...lookbookOutfits.map((l) => ({
        title: `${l.lookNumber}: ${l.title}`,
        subtitle: `Lookbook • ${l.items.length} pieces`,
        image: l.image,
        url: l.url
      }))
    ];

    function updateDropdown(query) {
      if (!resultsBox) return;
      const q = query.trim().toLowerCase();
      if (!q) {
        resultsBox.classList.remove('show');
        resultsBox.innerHTML = '';
        return;
      }

      const matches = allSearchable.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q)
      );

      if (matches.length === 0) {
        resultsBox.innerHTML = `<div class="p-3 font-mono-tech small text-ud-muted">No drops found for "${escapeHtml(query)}"</div>`;
      } else {
        resultsBox.innerHTML = matches
          .slice(0, 5)
          .map(
            (m) => `
              <a href="${escapeHtml(m.url)}" class="ud-search-result-item">
                <img src="${escapeHtml(m.image)}" alt="${escapeHtml(m.title)}">
                <div class="min-w-0">
                  <div class="small fw-bold text-truncate">${escapeHtml(m.title)}</div>
                  <div class="font-mono-tech text-ud-muted text-truncate" style="font-size:0.68rem;">${escapeHtml(m.subtitle)}</div>
                </div>
              </a>
            `
          )
          .join('');
      }
      resultsBox.classList.add('show');
    }

    input.addEventListener('input', () => {
      const val = input.value;
      updateDropdown(val);
      // If on index.html, filter trending products live
      if (document.getElementById('trending-products-grid')) {
        renderTrendingProducts(val);
      }
    });

    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const val = input.value.trim();
        if (document.getElementById('trending-products-grid')) {
          renderTrendingProducts(val);
          const section = document.getElementById('trending-section');
          if (section) section.scrollIntoView({ behavior: 'smooth' });
        } else {
          updateDropdown(val);
        }
      });
    }

    document.addEventListener('click', (e) => {
      if (resultsBox && !resultsBox.contains(e.target) && e.target !== input) {
        resultsBox.classList.remove('show');
      }
    });
  }

  // ------------------------------------------------------------------------
  // Active Header Link Highlighting (HOME, LOOKBOOK, ABOUT)
  // ------------------------------------------------------------------------
  function syncActiveNavLink() {
    const path = window.location.pathname.replace(/\\/g, '/').toLowerCase();
    let targetKey = 'HOME';
    if (path.endsWith('/lookbook.html') || path.endsWith('lookbook.html')) {
      targetKey = 'LOOKBOOK';
    } else if (path.endsWith('/about.html') || path.endsWith('about.html')) {
      targetKey = 'ABOUT';
    }

    document.querySelectorAll('.ud-nav-link').forEach((link) => {
      const label = (link.textContent || '').trim().toUpperCase();
      const isMatch = label === targetKey;
      link.classList.toggle('active', isMatch);
      if (isMatch) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  // ------------------------------------------------------------------------
  // Initialize Everything on DOMContentLoaded
  // ------------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    // Ensure 'cartCount' exists in localStorage
    if (localStorage.getItem('cartCount') === null) {
      localStorage.setItem('cartCount', '0');
    }

    syncActiveNavLink();
    ensureCartDrawer();
    updateCartBadge(false);
    renderCartDrawer();
    initNavbarSearch();

    // Wire cart icon button to open drawer
    document.querySelectorAll('[data-open-cart]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const drawerEl = document.getElementById('udCartOffcanvas');
        if (drawerEl && window.bootstrap) {
          renderCartDrawer();
          bootstrap.Offcanvas.getOrCreateInstance(drawerEl).show();
        }
      });
    });

    // Sync across browser tabs
    window.addEventListener('storage', (e) => {
      if (e.key === 'cartCount' || e.key === 'cartItems') {
        updateCartBadge(false);
        renderCartDrawer();
      }
    });

    // Page-specific initializers
    renderTrendingProducts('');
    initNewsletterForm();
    initLookbookPage();
  });
})();

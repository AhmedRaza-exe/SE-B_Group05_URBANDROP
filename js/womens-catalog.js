/* ==========================================================================
   URBANDROPS — Women's Catalog Script (Vanilla JS)
   ========================================================================== */

(function () {
  "use strict";

  const STORAGE_KEYS = {
    CART: "cart",
    CART_COUNT: "cartCount",
    ACTIVE_TAB: "womensCatalogActiveTab",
    SORT_ORDER: "womensCatalogSort"
  };

  const MAX_ITEM_QTY = 10;
  const VALID_CATEGORIES = ["TOPS", "BOTTOMS", "OUTERWEAR", "ACCESSORIES"];
  const VALID_SORTS = ["default", "price-asc", "price-desc"];

  const WOMENS_PRODUCTS = [
    {
      id: "wd-01",
      name: "Women's Streetwear Jacket",
      price: 30,
      category: "OUTERWEAR",
      image: "../images/womens-streetwear-jacket.jpg"
    },
    {
      id: "wd-02",
      name: "Oversized Hoodie",
      price: 20,
      category: "TOPS",
      image: "../images/oversized-hoodie.jpg"
    },
    {
      id: "wd-03",
      name: "Cargo Pants",
      price: 25,
      category: "BOTTOMS",
      image: "../images/cargo-pants.jpg"
    },
    {
      id: "wd-04",
      name: "Cropped Utility Bomber",
      price: 38,
      category: "OUTERWEAR",
      image: "../images/cropped-utility-bomber.jpg"
    },
    {
      id: "wd-05",
      name: "Boxy Graphic Baby Tee",
      price: 16,
      category: "TOPS",
      image: "../images/boxy-graphic-baby-tee.jpg"
    },
    {
      id: "wd-06",
      name: "Wide-Leg Parachute Pants",
      price: 28,
      category: "BOTTOMS",
      image: "../images/wide-leg-parachute-pants.jpg"
    },
    {
      id: "wd-07",
      name: "Nylon Crossbody Sling Bag",
      price: 18,
      category: "ACCESSORIES",
      image: "../images/nylon-crossbody-sling-bag.jpg"
    },
    {
      id: "wd-08",
      name: "Distressed Denim Trench",
      price: 45,
      category: "OUTERWEAR",
      image: "../images/distressed-denim-trench.jpg"
    },
    {
      id: "wd-09",
      name: "Ribbed Moto Zip Top",
      price: 24,
      category: "TOPS",
      image: "../images/ribbed-moto-zip-top.jpg"
    },
    {
      id: "wd-10",
      name: "Low-Rise Carpenter Jeans",
      price: 34,
      category: "BOTTOMS",
      image: "../images/low-rise-carpenter-jeans.jpg"
    },
    {
      id: "wd-11",
      name: "Distressed Washed Bucket Hat",
      price: 14,
      category: "ACCESSORIES",
      image: "../images/distressed-washed-bucket-hat.jpg"
    },
    {
      id: "wd-12",
      name: "Heavyweight Ribbed Beanie",
      price: 12,
      category: "ACCESSORIES",
      image: "../images/heavyweight-ribbed-beanie.jpg"
    }
  ];

  const state = {
    activeCategory: null,
    sortOrder: "default",
    searchQuery: "",
    activeModalProductId: null
  };

  const elements = {
    cartBadge: document.getElementById("cart-badge"),
    brandLogo: document.querySelector(".brand-logo"),
    categoryTabsGroup: document.getElementById("category-tabs-group"),
    categoryTabs: Array.from(document.querySelectorAll(".category-tab")),
    sortSelect: document.getElementById("sort-select"),
    productGrid: document.getElementById("product-grid"),
    productCount: document.getElementById("product-count"),
    resetFiltersBtn: document.getElementById("reset-filters-btn"),
    emptyState: document.getElementById("empty-state"),
    emptyResetBtn: document.getElementById("empty-reset-btn"),
    searchForm: document.getElementById("catalog-search-form"),
    searchInput: document.getElementById("catalog-search-input"),
    quickViewModalEl: document.getElementById("quickViewModal"),
    modalImgWrapper: document.getElementById("modal-img-wrapper"),
    modalProductImg: document.getElementById("modal-product-img"),
    modalFallbackCategory: document.getElementById("modal-fallback-category"),
    modalFallbackTitle: document.getElementById("modal-fallback-title"),
    modalCategoryTag: document.getElementById("modal-category-tag"),
    modalProductCategory: document.getElementById("modal-product-category"),
    modalProductTitle: document.getElementById("quickViewModalLabel"),
    modalProductPrice: document.getElementById("modal-product-price"),
    modalSizeSelect: document.getElementById("modal-size-select"),
    modalAddCartBtn: document.getElementById("modal-add-cart-btn"),
    cartToastEl: document.getElementById("cart-toast"),
    cartToastBody: document.getElementById("cart-toast-body")
  };

  let quickViewModalInstance = null;
  let cartToastInstance = null;

  function readStorage(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      // Ignore storage quota / privacy-mode errors gracefully
    }
  }

  function getStoredCart() {
    try {
      const raw = readStorage(STORAGE_KEYS.CART);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function computeCartCount(cart) {
    return cart.reduce(function (total, item) {
      const qty = Number.parseInt(item && item.qty, 10);
      return total + (Number.isNaN(qty) || qty < 0 ? 0 : qty);
    }, 0);
  }

  function syncCartBadge() {
    if (!elements.cartBadge) return;
    const rawCart = readStorage(STORAGE_KEYS.CART);
    let count = 0;

    if (rawCart !== null) {
      const cart = getStoredCart();
      count = computeCartCount(cart);
      writeStorage(STORAGE_KEYS.CART_COUNT, String(count));
    } else {
      const storedCount = Number.parseInt(readStorage(STORAGE_KEYS.CART_COUNT), 10);
      count = !Number.isNaN(storedCount) && storedCount >= 0 ? storedCount : 0;
    }

    elements.cartBadge.textContent = String(count);
  }

  function showAddedToast(message) {
    if (!elements.cartToastEl || typeof bootstrap === "undefined") return;
    if (elements.cartToastBody) {
      elements.cartToastBody.textContent = message;
    }
    if (!cartToastInstance) {
      cartToastInstance = bootstrap.Toast.getOrCreateInstance(elements.cartToastEl, {
        delay: 2200
      });
    }
    cartToastInstance.show();
  }

  function addToCart(productId) {
    const product = WOMENS_PRODUCTS.find(function (item) {
      return item.id === productId;
    });
    if (!product) return;

    const cart = getStoredCart();
    const existingItem = cart.find(function (item) {
      return item.id === product.id;
    });

    if (existingItem) {
      const currentQty = Number.parseInt(existingItem.qty, 10) || 0;
      existingItem.qty = Math.min(MAX_ITEM_QTY, currentQty + 1);
      existingItem.name = product.name;
      existingItem.price = product.price;
      existingItem.image = product.image;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        qty: 1,
        image: product.image
      });
    }

    const totalCount = computeCartCount(cart);
    writeStorage(STORAGE_KEYS.CART, JSON.stringify(cart));
    writeStorage(STORAGE_KEYS.CART_COUNT, String(totalCount));

    if (elements.cartBadge) {
      elements.cartBadge.textContent = String(totalCount);
    }

    showAddedToast("Added to cart");
  }

  function saveFilterPreferences() {
    writeStorage(STORAGE_KEYS.ACTIVE_TAB, state.activeCategory || "");
    writeStorage(STORAGE_KEYS.SORT_ORDER, state.sortOrder);
  }

  function restoreFilterPreferences() {
    const savedCategory = readStorage(STORAGE_KEYS.ACTIVE_TAB);
    state.activeCategory =
      savedCategory && VALID_CATEGORIES.includes(savedCategory)
        ? savedCategory
        : null;

    const savedSort = readStorage(STORAGE_KEYS.SORT_ORDER);
    state.sortOrder =
      savedSort && VALID_SORTS.includes(savedSort) ? savedSort : "default";

    if (elements.sortSelect) {
      elements.sortSelect.value = state.sortOrder;
    }
    updateCategoryButtons();
  }

  function setupLogoFallback() {
    if (!elements.brandLogo) return;
    elements.brandLogo.addEventListener("error", function () {
      elements.brandLogo.classList.add("is-hidden");
    });
  }

  function setupModalImageFallback() {
    if (!elements.modalProductImg || !elements.modalImgWrapper) return;
    elements.modalProductImg.addEventListener("error", function () {
      elements.modalImgWrapper.classList.add("is-fallback");
    });
  }

  function populateSizeOptions(category) {
    if (!elements.modalSizeSelect) return;
    elements.modalSizeSelect.innerHTML = "";

    const sizes =
      category === "ACCESSORIES" ? ["One Size"] : ["XS", "S", "M", "L", "XL"];

    sizes.forEach(function (size) {
      const option = document.createElement("option");
      option.value = size;
      option.textContent = size;
      if (size === "M" || sizes.length === 1) {
        option.selected = true;
      }
      elements.modalSizeSelect.appendChild(option);
    });
  }

  function openQuickView(productId, triggerEl) {
    const product = WOMENS_PRODUCTS.find(function (item) {
      return item.id === productId;
    });
    if (!product || !elements.quickViewModalEl || typeof bootstrap === "undefined") {
      return;
    }

    state.activeModalProductId = product.id;

    if (elements.modalImgWrapper) {
      elements.modalImgWrapper.classList.remove("is-fallback");
    }
    if (elements.modalProductImg) {
      elements.modalProductImg.src = product.image;
      elements.modalProductImg.alt = product.name;
    }
    if (elements.modalFallbackCategory) {
      elements.modalFallbackCategory.textContent = product.category;
    }
    if (elements.modalFallbackTitle) {
      elements.modalFallbackTitle.textContent = product.name;
    }
    if (elements.modalCategoryTag) {
      elements.modalCategoryTag.textContent = product.category;
    }
    if (elements.modalProductCategory) {
      elements.modalProductCategory.textContent = product.category;
    }
    if (elements.modalProductTitle) {
      elements.modalProductTitle.textContent = product.name;
    }
    if (elements.modalProductPrice) {
      elements.modalProductPrice.textContent = `$${product.price}`;
    }

    populateSizeOptions(product.category);

    if (!quickViewModalInstance) {
      quickViewModalInstance = bootstrap.Modal.getOrCreateInstance(
        elements.quickViewModalEl
      );
    }
    quickViewModalInstance.show(triggerEl);
  }

  function createQuickViewButton(product) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "quick-view-btn";
    btn.setAttribute("data-product-id", product.id);
    btn.setAttribute("aria-label", `Quick view ${product.name}`);
    btn.title = "Quick view";
    btn.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>' +
      '<circle cx="12" cy="12" r="3"></circle>' +
      "</svg>";

    btn.addEventListener("click", function () {
      openQuickView(product.id, btn);
    });

    return btn;
  }

  function createProductCard(product) {
    const col = document.createElement("div");
    col.className = "col";

    const card = document.createElement("article");
    card.className = "product-card";
    card.setAttribute("data-product-id", product.id);

    const imgWrapper = document.createElement("div");
    imgWrapper.className = "product-img-wrapper";

    const img = document.createElement("img");
    img.src = product.image;
    img.alt = product.name;
    img.className = "product-img";
    img.loading = "lazy";
    img.addEventListener("error", function () {
      imgWrapper.classList.add("is-fallback");
    });

    const fallback = document.createElement("div");
    fallback.className = "img-fallback";
    fallback.setAttribute("aria-hidden", "true");

    const fallbackBrand = document.createElement("span");
    fallbackBrand.className = "fallback-brand";
    fallbackBrand.textContent = "URBANDROPS";

    const fallbackCategory = document.createElement("span");
    fallbackCategory.className = "fallback-category";
    fallbackCategory.textContent = product.category;

    const fallbackTitle = document.createElement("span");
    fallbackTitle.className = "fallback-title";
    fallbackTitle.textContent = product.name;

    fallback.append(fallbackBrand, fallbackCategory, fallbackTitle);

    const categoryTag = document.createElement("span");
    categoryTag.className = "product-category-tag";
    categoryTag.textContent = product.category;

    const quickViewBtn = createQuickViewButton(product);

    imgWrapper.append(img, fallback, categoryTag, quickViewBtn);

    const body = document.createElement("div");
    body.className = "product-body";

    const title = document.createElement("h2");
    title.className = "product-name";
    title.textContent = product.name;

    const price = document.createElement("p");
    price.className = "product-price";
    price.textContent = `$${product.price}`;

    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "btn btn-cta btn-add-cart";
    addBtn.textContent = "ADD TO CART";
    addBtn.setAttribute("data-product-id", product.id);
    addBtn.setAttribute("aria-label", `Add ${product.name} to cart`);
    addBtn.addEventListener("click", function () {
      addToCart(product.id);
    });

    body.append(title, price, addBtn);
    card.append(imgWrapper, body);
    col.appendChild(card);

    return col;
  }

  function getFilteredAndSortedProducts() {
    const query = state.searchQuery.trim().toLowerCase();
    const filtered = WOMENS_PRODUCTS.filter(function (product) {
      const matchesCategory =
        !state.activeCategory || product.category === state.activeCategory;
      const matchesName = !query || product.name.toLowerCase().includes(query);
      return matchesCategory && matchesName;
    });

    if (state.sortOrder === "price-asc") {
      filtered.sort(function (a, b) {
        return a.price - b.price;
      });
    } else if (state.sortOrder === "price-desc") {
      filtered.sort(function (a, b) {
        return b.price - a.price;
      });
    }

    return filtered;
  }

  function updateCategoryButtons() {
    elements.categoryTabs.forEach(function (tab) {
      const isActive = tab.dataset.category === state.activeCategory;
      tab.setAttribute("aria-pressed", String(isActive));
    });
  }

  function renderProducts() {
    if (!elements.productGrid) return;

    const visibleProducts = getFilteredAndSortedProducts();
    elements.productGrid.innerHTML = "";

    const fragment = document.createDocumentFragment();
    visibleProducts.forEach(function (product) {
      fragment.appendChild(createProductCard(product));
    });
    elements.productGrid.appendChild(fragment);

    if (elements.productCount) {
      const label = visibleProducts.length === 1 ? "ITEM" : "ITEMS";
      elements.productCount.textContent = `${visibleProducts.length} ${label}`;
    }

    const hasActiveFilter = Boolean(
      state.activeCategory ||
        state.searchQuery.trim() ||
        state.sortOrder !== "default"
    );

    if (elements.resetFiltersBtn) {
      elements.resetFiltersBtn.classList.toggle("d-none", !hasActiveFilter);
    }

    if (elements.emptyState) {
      elements.emptyState.classList.toggle("d-none", visibleProducts.length > 0);
    }
  }

  function resetFilters() {
    state.activeCategory = null;
    state.sortOrder = "default";
    state.searchQuery = "";

    if (elements.searchInput) {
      elements.searchInput.value = "";
    }
    if (elements.sortSelect) {
      elements.sortSelect.value = "default";
    }

    saveFilterPreferences();
    updateCategoryButtons();
    renderProducts();
  }

  function bindTabKeyboardNavigation() {
    if (!elements.categoryTabsGroup || elements.categoryTabs.length === 0) return;

    elements.categoryTabsGroup.addEventListener("keydown", function (event) {
      const currentIndex = elements.categoryTabs.indexOf(document.activeElement);
      if (currentIndex === -1) return;

      let nextIndex = null;
      if (event.key === "ArrowRight") {
        nextIndex = (currentIndex + 1) % elements.categoryTabs.length;
      } else if (event.key === "ArrowLeft") {
        nextIndex =
          (currentIndex - 1 + elements.categoryTabs.length) %
          elements.categoryTabs.length;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = elements.categoryTabs.length - 1;
      }

      if (nextIndex !== null) {
        event.preventDefault();
        elements.categoryTabs[nextIndex].focus();
      }
    });
  }

  function bindEvents() {
    elements.categoryTabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        const clickedCategory = tab.dataset.category;
        state.activeCategory =
          state.activeCategory === clickedCategory ? null : clickedCategory;
        saveFilterPreferences();
        updateCategoryButtons();
        renderProducts();
      });
    });

    bindTabKeyboardNavigation();

    if (elements.sortSelect) {
      elements.sortSelect.addEventListener("change", function (event) {
        const selected = event.target.value;
        state.sortOrder = VALID_SORTS.includes(selected) ? selected : "default";
        saveFilterPreferences();
        renderProducts();
      });
    }

    if (elements.searchInput) {
      elements.searchInput.addEventListener("input", function (event) {
        state.searchQuery = event.target.value;
        renderProducts();
      });
    }

    if (elements.searchForm) {
      elements.searchForm.addEventListener("submit", function (event) {
        event.preventDefault();
        if (elements.searchInput) {
          state.searchQuery = elements.searchInput.value;
          renderProducts();
        }
      });
    }

    if (elements.resetFiltersBtn) {
      elements.resetFiltersBtn.addEventListener("click", resetFilters);
    }

    if (elements.emptyResetBtn) {
      elements.emptyResetBtn.addEventListener("click", resetFilters);
    }

    if (elements.modalAddCartBtn) {
      elements.modalAddCartBtn.addEventListener("click", function () {
        if (!state.activeModalProductId) return;
        addToCart(state.activeModalProductId);
        if (quickViewModalInstance) {
          quickViewModalInstance.hide();
        }
      });
    }

    window.addEventListener("storage", function (event) {
      if (event.key === STORAGE_KEYS.CART || event.key === STORAGE_KEYS.CART_COUNT) {
        syncCartBadge();
      }
      if (
        event.key === STORAGE_KEYS.ACTIVE_TAB ||
        event.key === STORAGE_KEYS.SORT_ORDER
      ) {
        restoreFilterPreferences();
        renderProducts();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    syncCartBadge();
    setupLogoFallback();
    setupModalImageFallback();
    restoreFilterPreferences();
    bindEvents();
    renderProducts();
  });
})();

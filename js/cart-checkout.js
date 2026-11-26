/* ==========================================================================
   URBANDROPS — Cart & Checkout Script (Vanilla JS)
   ========================================================================== */

(function () {
  "use strict";

  const STORAGE_KEYS = {
    CART: "cart",
    CART_COUNT: "cartCount",
    APPLIED_PROMO: "appliedPromo",
    ORDERS: "orders"
  };

  const VALID_PROMO_CODE = "URBAN10";
  const PROMO_DISCOUNT_AMOUNT = 10;
  const MIN_ITEM_QTY = 1;
  const MAX_ITEM_QTY = 10;

  const DEFAULT_SEED_CART = [
    {
      id: "wd-01",
      name: "Women's Streetwear Jacket",
      price: 30,
      qty: 1,
      image: "../images/womens-streetwear-jacket.jpg"
    },
    {
      id: "wd-02",
      name: "Oversized Hoodie",
      price: 20,
      qty: 1,
      image: "../images/oversized-hoodie.jpg"
    },
    {
      id: "wd-03",
      name: "Cargo Pants",
      price: 25,
      qty: 1,
      image: "../images/cargo-pants.jpg"
    }
  ];

  const state = {
    cart: [],
    appliedPromo: null,
    pendingRemoveId: null
  };

  const elements = {
    brandLogo: document.querySelector(".brand-logo"),
    cartBadge: document.getElementById("cart-badge"),
    checkoutView: document.getElementById("checkout-view"),
    cartItemCountLabel: document.getElementById("cart-item-count-label"),
    cartItemsList: document.getElementById("cart-items-list"),
    emptyCartState: document.getElementById("empty-cart-state"),
    promoForm: document.getElementById("promo-form"),
    promoInput: document.getElementById("promo-code-input"),
    promoFeedback: document.getElementById("promo-feedback"),
    summarySubtotal: document.getElementById("summary-subtotal"),
    summaryShipping: document.getElementById("summary-shipping"),
    summaryDiscount: document.getElementById("summary-discount"),
    summaryTotal: document.getElementById("summary-total"),
    checkoutForm: document.getElementById("checkout-form"),
    fullNameInput: document.getElementById("full-name"),
    addressInput: document.getElementById("street-address"),
    cityInput: document.getElementById("city"),
    postalCodeInput: document.getElementById("postal-code"),
    countrySelect: document.getElementById("country"),
    checkoutFormError: document.getElementById("checkout-form-error"),
    removeConfirmModalEl: document.getElementById("removeConfirmModal"),
    removeModalItemName: document.getElementById("remove-modal-item-name"),
    confirmRemoveBtn: document.getElementById("confirm-remove-btn"),
    orderConfirmedSection: document.getElementById("order-confirmed-section"),
    orderConfirmedHeading: document.getElementById("order-confirmed-heading"),
    confirmedOrderId: document.getElementById("confirmed-order-id"),
    trackOrderLink: document.getElementById("track-order-link")
  };

  let removeModalInstance = null;

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
      // Ignore storage errors gracefully
    }
  }

  function removeStorage(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      // Ignore storage errors gracefully
    }
  }

  function formatCurrency(amount) {
    const safeAmount = Number.isFinite(amount) ? amount : 0;
    return Number.isInteger(safeAmount)
      ? `$${safeAmount}`
      : `$${safeAmount.toFixed(2)}`;
  }

  function computeCartCount(cart) {
    return cart.reduce(function (total, item) {
      const qty = Number.parseInt(item && item.qty, 10);
      return total + (Number.isNaN(qty) || qty < 0 ? 0 : qty);
    }, 0);
  }

  function computeTotals() {
    const subtotal = state.cart.reduce(function (sum, item) {
      const price = Number(item && item.price) || 0;
      const qty = Number.parseInt(item && item.qty, 10) || 0;
      return sum + price * Math.max(0, qty);
    }, 0);

    const discount =
      state.appliedPromo === VALID_PROMO_CODE ? PROMO_DISCOUNT_AMOUNT : 0;
    const total = Math.max(0, subtotal - discount);

    return { subtotal, discount, total };
  }

  function persistCart() {
    const count = computeCartCount(state.cart);
    writeStorage(STORAGE_KEYS.CART, JSON.stringify(state.cart));
    writeStorage(STORAGE_KEYS.CART_COUNT, String(count));
    updateHeaderAndCounts(count);
  }

  function updateHeaderAndCounts(count) {
    if (elements.cartBadge) {
      elements.cartBadge.textContent = String(count);
    }
    if (elements.cartItemCountLabel) {
      elements.cartItemCountLabel.textContent = `${count} ${
        count === 1 ? "ITEM" : "ITEMS"
      }`;
    }
  }

  function loadOrSeedCart() {
    const rawCart = readStorage(STORAGE_KEYS.CART);

    if (rawCart === null) {
      const seeded = DEFAULT_SEED_CART.map(function (item) {
        return Object.assign({}, item);
      });
      writeStorage(STORAGE_KEYS.CART, JSON.stringify(seeded));
      writeStorage(STORAGE_KEYS.CART_COUNT, String(computeCartCount(seeded)));
      return seeded;
    }

    try {
      const parsed = JSON.parse(rawCart);
      if (Array.isArray(parsed)) {
        return parsed.map(function (item) {
          const parsedQty = Number.parseInt(item && item.qty, 10);
          const safeQty =
            !Number.isNaN(parsedQty) &&
            parsedQty >= MIN_ITEM_QTY &&
            parsedQty <= MAX_ITEM_QTY
              ? parsedQty
              : MIN_ITEM_QTY;
          return {
            id: item.id,
            name: item.name,
            price: Number(item.price) || 0,
            qty: safeQty,
            image: item.image || ""
          };
        });
      }
    } catch (error) {
      // Fall through to empty array if stored JSON is malformed
    }
    return [];
  }

  function restorePromo() {
    const savedPromo = readStorage(STORAGE_KEYS.APPLIED_PROMO);
    if (savedPromo === VALID_PROMO_CODE) {
      state.appliedPromo = VALID_PROMO_CODE;
      if (elements.promoInput) {
        elements.promoInput.value = VALID_PROMO_CODE;
      }
      setPromoFeedback("Promo Code: URBAN10 (Applied)", true);
    } else {
      state.appliedPromo = null;
      clearPromoFeedback();
    }
  }

  function setPromoFeedback(message, isSuccess) {
    if (!elements.promoFeedback) return;
    elements.promoFeedback.textContent = message;
    elements.promoFeedback.classList.remove("d-none", "is-success", "is-error");
    elements.promoFeedback.classList.add(isSuccess ? "is-success" : "is-error");
  }

  function clearPromoFeedback() {
    if (!elements.promoFeedback) return;
    elements.promoFeedback.textContent = "";
    elements.promoFeedback.classList.add("d-none");
    elements.promoFeedback.classList.remove("is-success", "is-error");
  }

  function setupLogoFallback() {
    if (!elements.brandLogo) return;
    elements.brandLogo.addEventListener("error", function () {
      elements.brandLogo.classList.add("is-hidden");
    });
  }

  function updateSummary() {
    const { subtotal, discount, total } = computeTotals();

    if (elements.summarySubtotal) {
      elements.summarySubtotal.textContent = formatCurrency(subtotal);
    }
    if (elements.summaryShipping) {
      elements.summaryShipping.textContent = "Free";
    }
    if (elements.summaryDiscount) {
      if (discount > 0) {
        elements.summaryDiscount.textContent = `-${formatCurrency(discount)}`;
        elements.summaryDiscount.classList.add("summary-discount-applied");
      } else {
        elements.summaryDiscount.textContent = "$0";
        elements.summaryDiscount.classList.remove("summary-discount-applied");
      }
    }
    if (elements.summaryTotal) {
      elements.summaryTotal.textContent = formatCurrency(total);
    }
  }

  function openRemoveModal(item, triggerEl) {
    if (!elements.removeConfirmModalEl || typeof bootstrap === "undefined") {
      return;
    }
    state.pendingRemoveId = item.id;
    if (elements.removeModalItemName) {
      elements.removeModalItemName.textContent = item.name || "this item";
    }
    if (!removeModalInstance) {
      removeModalInstance = bootstrap.Modal.getOrCreateInstance(
        elements.removeConfirmModalEl
      );
    }
    removeModalInstance.show(triggerEl);
  }

  function removeItemById(productId) {
    state.cart = state.cart.filter(function (item) {
      return item.id !== productId;
    });
    persistCart();
    renderCart();
  }

  function createCartRow(item) {
    const qty = item.qty;
    const price = item.price;
    const lineTotal = price * qty;

    const row = document.createElement("article");
    row.className = "cart-item-card";
    row.setAttribute("data-product-id", item.id || "");

    const imgWrapper = document.createElement("div");
    imgWrapper.className = "cart-img-wrapper";

    const img = document.createElement("img");
    img.src = item.image || "";
    img.alt = item.name || "URBANDROPS product";
    img.className = "cart-item-img";
    img.addEventListener("error", function () {
      imgWrapper.classList.add("is-fallback");
    });

    const fallback = document.createElement("div");
    fallback.className = "img-fallback";
    fallback.setAttribute("aria-hidden", "true");

    const fallbackBrand = document.createElement("span");
    fallbackBrand.className = "fallback-brand";
    fallbackBrand.textContent = "URBANDROPS";

    const fallbackTitle = document.createElement("span");
    fallbackTitle.className = "fallback-title";
    fallbackTitle.textContent = item.name || "Item";

    fallback.append(fallbackBrand, fallbackTitle);
    imgWrapper.append(img, fallback);

    const details = document.createElement("div");
    details.className = "cart-item-details";

    const top = document.createElement("div");
    top.className = "cart-item-top";

    const titleWrap = document.createElement("div");
    const title = document.createElement("h2");
    title.className = "cart-item-name";
    title.textContent = item.name || "Streetwear Piece";

    const unitPrice = document.createElement("p");
    unitPrice.className = "cart-item-unit-price";
    unitPrice.textContent = `${formatCurrency(price)} each`;

    titleWrap.append(title, unitPrice);

    const priceEl = document.createElement("p");
    priceEl.className = "cart-item-price";
    priceEl.textContent = formatCurrency(lineTotal);

    top.append(titleWrap, priceEl);

    const meta = document.createElement("div");
    meta.className = "cart-item-meta";

    const stepper = document.createElement("div");
    stepper.className = "qty-stepper";
    stepper.setAttribute("role", "group");
    stepper.setAttribute("aria-label", `Quantity for ${item.name || "item"}`);

    const decBtn = document.createElement("button");
    decBtn.type = "button";
    decBtn.className = "qty-btn";
    decBtn.textContent = "-";
    decBtn.setAttribute(
      "aria-label",
      `Decrease quantity of ${item.name || "item"}`
    );

    const qtyInput = document.createElement("input");
    qtyInput.type = "text";
    qtyInput.inputMode = "numeric";
    qtyInput.className = "qty-input";
    qtyInput.value = String(qty);
    qtyInput.setAttribute(
      "aria-label",
      `Quantity of ${item.name || "item"}`
    );

    const incBtn = document.createElement("button");
    incBtn.type = "button";
    incBtn.className = "qty-btn";
    incBtn.textContent = "+";
    incBtn.setAttribute(
      "aria-label",
      `Increase quantity of ${item.name || "item"}`
    );

    stepper.append(decBtn, qtyInput, incBtn);

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "btn-remove";
    removeBtn.textContent = "Remove";
    removeBtn.setAttribute("data-product-id", item.id || "");
    removeBtn.setAttribute(
      "aria-label",
      `Remove ${item.name || "item"} from cart`
    );

    const qtyError = document.createElement("p");
    qtyError.className = "qty-error d-none";
    qtyError.setAttribute("role", "alert");

    function showQtyError(msg) {
      qtyError.textContent = msg;
      qtyError.classList.remove("d-none");
    }

    function clearQtyError() {
      qtyError.textContent = "";
      qtyError.classList.add("d-none");
    }

    function applyQuantityValue(rawValue) {
      const trimmed = String(rawValue).trim();
      if (!/^-?\d+$/.test(trimmed)) {
        showQtyError("Enter a whole number between 1 and 10.");
        qtyInput.value = String(item.qty);
        return;
      }

      const parsed = Number.parseInt(trimmed, 10);
      if (parsed < MIN_ITEM_QTY || parsed > MAX_ITEM_QTY) {
        showQtyError("Quantity must be between 1 and 10.");
        qtyInput.value = String(item.qty);
        return;
      }

      clearQtyError();
      item.qty = parsed;
      qtyInput.value = String(parsed);
      priceEl.textContent = formatCurrency(item.price * parsed);
      persistCart();
      updateSummary();
      clearCheckoutBannerError();
    }

    decBtn.addEventListener("click", function () {
      applyQuantityValue(item.qty - 1);
    });

    incBtn.addEventListener("click", function () {
      applyQuantityValue(item.qty + 1);
    });

    qtyInput.addEventListener("change", function () {
      applyQuantityValue(qtyInput.value);
    });

    qtyInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        applyQuantityValue(qtyInput.value);
      }
    });

    removeBtn.addEventListener("click", function () {
      openRemoveModal(item, removeBtn);
    });

    meta.append(stepper, removeBtn);
    details.append(top, meta, qtyError);
    row.append(imgWrapper, details);

    return row;
  }

  function renderCart() {
    const totalItems = computeCartCount(state.cart);
    writeStorage(STORAGE_KEYS.CART_COUNT, String(totalItems));
    updateHeaderAndCounts(totalItems);

    if (elements.cartItemsList) {
      elements.cartItemsList.innerHTML = "";
      if (state.cart.length > 0) {
        const fragment = document.createDocumentFragment();
        state.cart.forEach(function (item) {
          fragment.appendChild(createCartRow(item));
        });
        elements.cartItemsList.appendChild(fragment);
      }
    }

    if (elements.emptyCartState) {
      elements.emptyCartState.classList.toggle("d-none", state.cart.length > 0);
    }

    updateSummary();
  }

  function handlePromoSubmit(event) {
    event.preventDefault();
    if (!elements.promoInput) return;

    const code = elements.promoInput.value.trim().toUpperCase();

    if (code === VALID_PROMO_CODE) {
      if (state.appliedPromo === VALID_PROMO_CODE) {
        setPromoFeedback("Promo Code: URBAN10 (Applied)", true);
        updateSummary();
        return;
      }

      state.appliedPromo = VALID_PROMO_CODE;
      elements.promoInput.value = VALID_PROMO_CODE;
      writeStorage(STORAGE_KEYS.APPLIED_PROMO, VALID_PROMO_CODE);
      setPromoFeedback("Promo Code: URBAN10 (Applied)", true);
      updateSummary();
      return;
    }

    setPromoFeedback("Error: Invalid Promo Code. Please try again.", false);
    updateSummary();
  }

  /* ---------- Shipping Form Live Validation ---------- */
  const fieldValidators = {
    "full-name": {
      input: elements.fullNameInput,
      errorEl: document.getElementById("full-name-error"),
      validate: function (value) {
        const trimmed = value.trim();
        if (!trimmed) return "Full Name is required.";
        if (!/^[A-Za-z\s]+$/.test(trimmed)) {
          return "Full Name must contain letters only.";
        }
        return "";
      }
    },
    "street-address": {
      input: elements.addressInput,
      errorEl: document.getElementById("street-address-error"),
      validate: function (value) {
        if (!value.trim()) return "Address is required.";
        return "";
      }
    },
    city: {
      input: elements.cityInput,
      errorEl: document.getElementById("city-error"),
      validate: function (value) {
        if (!value.trim()) return "City is required.";
        return "";
      }
    },
    "postal-code": {
      input: elements.postalCodeInput,
      errorEl: document.getElementById("postal-code-error"),
      validate: function (value) {
        const trimmed = value.trim();
        if (!trimmed) return "Postal Code is required.";
        if (!/^\d+$/.test(trimmed)) {
          return "Postal Code must contain numbers only.";
        }
        return "";
      }
    },
    country: {
      input: elements.countrySelect,
      errorEl: document.getElementById("country-error"),
      validate: function (value) {
        if (!value.trim()) return "Please select a country.";
        return "";
      }
    }
  };

  function validateField(key) {
    const config = fieldValidators[key];
    if (!config || !config.input) return true;

    const errorMessage = config.validate(config.input.value);
    const isValid = errorMessage === "";

    config.input.classList.toggle("is-field-invalid", !isValid);
    config.input.classList.toggle("is-field-valid", isValid);
    config.input.setAttribute("aria-invalid", String(!isValid));

    if (config.errorEl) {
      config.errorEl.textContent = errorMessage;
      config.errorEl.classList.toggle("d-none", isValid);
    }

    return isValid;
  }

  function clearCheckoutBannerError() {
    if (!elements.checkoutFormError) return;
    elements.checkoutFormError.textContent = "";
    elements.checkoutFormError.classList.add("d-none");
  }

  function showCheckoutBannerError(msg) {
    if (!elements.checkoutFormError) return;
    elements.checkoutFormError.textContent = msg;
    elements.checkoutFormError.classList.remove("d-none");
  }

  function getStoredOrders() {
    try {
      const raw = readStorage(STORAGE_KEYS.ORDERS);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function generateOrderCode(existingOrders) {
    const existingIds = new Set(
      existingOrders.map(function (order) {
        return order && order.id;
      })
    );

    let code = "";
    do {
      const num = Math.floor(1000 + Math.random() * 9000);
      code = `UD-${num}`;
    } while (existingIds.has(`#${code}`));

    return code;
  }

  function handleCheckoutSubmit(event) {
    event.preventDefault();
    clearCheckoutBannerError();

    const fieldKeys = Object.keys(fieldValidators);
    let firstInvalidInput = null;
    let allValid = true;

    fieldKeys.forEach(function (key) {
      const ok = validateField(key);
      if (!ok) {
        allValid = false;
        if (!firstInvalidInput && fieldValidators[key].input) {
          firstInvalidInput = fieldValidators[key].input;
        }
      }
    });

    if (state.cart.length === 0) {
      showCheckoutBannerError(
        "Your cart is empty. Add at least one item before placing an order."
      );
      return;
    }

    if (!allValid) {
      showCheckoutBannerError(
        "Please fix the highlighted shipping fields before continuing."
      );
      if (firstInvalidInput) {
        firstInvalidInput.focus();
      }
      return;
    }

    const orders = getStoredOrders();
    const orderCode = generateOrderCode(orders);
    const displayOrderId = `#${orderCode}`;
    const { total } = computeTotals();

    const newOrder = {
      id: displayOrderId,
      items: state.cart.map(function (item) {
        return {
          id: item.id,
          name: item.name,
          price: item.price,
          qty: item.qty,
          image: item.image
        };
      }),
      total: total,
      date: new Date().toISOString(),
      step: 1
    };

    orders.push(newOrder);
    writeStorage(STORAGE_KEYS.ORDERS, JSON.stringify(orders));

    state.cart = [];
    state.appliedPromo = null;
    writeStorage(STORAGE_KEYS.CART, JSON.stringify([]));
    writeStorage(STORAGE_KEYS.CART_COUNT, "0");
    removeStorage(STORAGE_KEYS.APPLIED_PROMO);

    updateHeaderAndCounts(0);

    if (elements.confirmedOrderId) {
      elements.confirmedOrderId.textContent = displayOrderId;
    }
    if (elements.trackOrderLink) {
      elements.trackOrderLink.href = `order-tracking.html?id=${encodeURIComponent(
        orderCode
      )}`;
    }
    if (elements.checkoutView) {
      elements.checkoutView.classList.add("d-none");
    }
    if (elements.orderConfirmedSection) {
      elements.orderConfirmedSection.classList.remove("d-none");
    }
    if (elements.orderConfirmedHeading) {
      elements.orderConfirmedHeading.focus();
    }
  }

  function bindEvents() {
    if (elements.confirmRemoveBtn) {
      elements.confirmRemoveBtn.addEventListener("click", function () {
        if (state.pendingRemoveId) {
          removeItemById(state.pendingRemoveId);
          state.pendingRemoveId = null;
        }
        if (removeModalInstance) {
          removeModalInstance.hide();
        }
      });
    }

    if (elements.removeConfirmModalEl) {
      elements.removeConfirmModalEl.addEventListener("hidden.bs.modal", function () {
        state.pendingRemoveId = null;
      });
    }

    if (elements.promoForm) {
      elements.promoForm.addEventListener("submit", handlePromoSubmit);
    }

    Object.keys(fieldValidators).forEach(function (key) {
      const input = fieldValidators[key].input;
      if (!input) return;

      const eventName = input.tagName === "SELECT" ? "change" : "input";
      input.addEventListener(eventName, function () {
        validateField(key);
        clearCheckoutBannerError();
      });
      input.addEventListener("blur", function () {
        validateField(key);
      });
    });

    if (elements.checkoutForm) {
      elements.checkoutForm.addEventListener("submit", handleCheckoutSubmit);
    }

    window.addEventListener("storage", function (event) {
      if (
        event.key === STORAGE_KEYS.CART ||
        event.key === STORAGE_KEYS.CART_COUNT
      ) {
        state.cart = loadOrSeedCart();
        renderCart();
      }
      if (event.key === STORAGE_KEYS.APPLIED_PROMO) {
        restorePromo();
        updateSummary();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    setupLogoFallback();
    state.cart = loadOrSeedCart();
    restorePromo();
    bindEvents();
    renderCart();
  });
})();

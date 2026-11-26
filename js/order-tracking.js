/* ==========================================================================
   URBANDROPS — Order Tracking Script (Vanilla JS)
   ========================================================================== */

(function () {
  "use strict";

  const STORAGE_KEYS = {
    CART: "cart",
    CART_COUNT: "cartCount",
    ORDERS: "orders",
    LAST_SEARCHED_ID: "lastSearchedOrderId"
  };

  const ORDER_ID_PATTERN = /^#?UD-\d{4,}$/i;

  const STEP_LABELS = [
    "Order Placed",
    "Processing",
    "Shipped",
    "Delivered"
  ];

  const SAMPLE_ORDERS = {
    "UD-1042": {
      id: "#UD-1042",
      currentStep: 3,
      statusSummary: "Shipped — In Transit",
      eta: "EST. DELIVERY: NOV 28, 2026",
      carrierNote: "Carrier: URBANDROPS Express Logistics",
      lastLocationCity: "Chicago, IL",
      lastLocationFacility: "Midwest Streetwear Sort Facility • Departed hub",
      coords: "41.8781° N, 87.6298° W",
      steps: [
        {
          label: "Order Placed",
          date: "Nov 24, 2026",
          city: "Los Angeles, CA",
          statusMessage:
            "Order confirmed and payment verified by URBANDROPS studio.",
          timestamp: "Nov 24, 2026 • 10:15 AM PST"
        },
        {
          label: "Processing",
          date: "Nov 25, 2026",
          city: "Los Angeles, CA",
          statusMessage:
            "Items picked, quality-checked, and sealed in custom drop packaging.",
          timestamp: "Nov 25, 2026 • 02:40 PM PST"
        },
        {
          label: "Shipped",
          date: "Nov 26, 2026",
          city: "Chicago, IL",
          statusMessage:
            "Parcel departed Chicago regional sort hub en route to destination.",
          timestamp: "Nov 26, 2026 • 08:22 AM CST"
        },
        {
          label: "Delivered",
          date: "Est. Nov 28, 2026",
          city: "New York, NY",
          statusMessage:
            "Scheduled for local courier handoff once arrival scan completes.",
          timestamp: "Pending final delivery scan"
        }
      ]
    }
  };

  const elements = {
    brandLogo: document.querySelector(".brand-logo"),
    cartBadge: document.getElementById("cart-badge"),
    searchForm: document.getElementById("tracking-search-form"),
    orderIdInput: document.getElementById("order-id-input"),
    searchError: document.getElementById("tracking-search-error"),
    trackingContent: document.getElementById("tracking-content"),
    resultOrderId: document.getElementById("result-order-id"),
    resultStatusSummary: document.getElementById("result-status-summary"),
    resultEtaBadge: document.getElementById("result-eta-badge"),
    progressBar: document.getElementById("tracking-progressbar"),
    progressFill: document.getElementById("tracking-progress-fill"),
    trackingStepsList: document.getElementById("tracking-steps-list"),
    resultCarrierNote: document.getElementById("result-carrier-note"),
    mapCoordsTag: document.getElementById("map-coords-tag"),
    mapLocationCity: document.getElementById("map-location-city"),
    mapLocationFacility: document.getElementById("map-location-facility")
  };

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

  function syncCartBadge() {
    if (!elements.cartBadge) return;
    let count = 0;

    try {
      const rawCart = readStorage(STORAGE_KEYS.CART);
      if (rawCart !== null) {
        const parsed = JSON.parse(rawCart);
        if (Array.isArray(parsed)) {
          count = parsed.reduce(function (sum, item) {
            const qty = Number.parseInt(item && item.qty, 10);
            return sum + (Number.isNaN(qty) || qty < 0 ? 0 : qty);
          }, 0);
        }
      } else {
        const storedCount = Number.parseInt(
          readStorage(STORAGE_KEYS.CART_COUNT),
          10
        );
        count = !Number.isNaN(storedCount) && storedCount >= 0 ? storedCount : 0;
      }
    } catch (error) {
      count = 0;
    }

    elements.cartBadge.textContent = String(count);
  }

  function setupLogoFallback() {
    if (!elements.brandLogo) return;
    elements.brandLogo.addEventListener("error", function () {
      elements.brandLogo.classList.add("is-hidden");
    });
  }

  function normalizeOrderKey(rawId) {
    return String(rawId || "")
      .trim()
      .replace(/^#/, "")
      .toUpperCase();
  }

  function formatOrderDate(isoOrDate) {
    const dateObj = new Date(isoOrDate);
    if (Number.isNaN(dateObj.getTime())) {
      return "Nov 26, 2026";
    }
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }

  function formatOrderTimestamp(isoOrDate) {
    const dateObj = new Date(isoOrDate);
    if (Number.isNaN(dateObj.getTime())) {
      return "Nov 26, 2026 • Confirmed";
    }
    const dateStr = formatOrderDate(dateObj);
    const timeStr = dateObj.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    });
    return `${dateStr} • ${timeStr}`;
  }

  function buildOrderFromStored(storedOrder) {
    const stepNum = Math.min(
      4,
      Math.max(1, Number.parseInt(storedOrder.step, 10) || 1)
    );
    const placedDate = formatOrderDate(storedOrder.date);
    const placedTimestamp = formatOrderTimestamp(storedOrder.date);
    const displayId = `#${normalizeOrderKey(storedOrder.id)}`;
    const itemCount = Array.isArray(storedOrder.items)
      ? storedOrder.items.reduce(function (sum, item) {
          return sum + (Number.parseInt(item && item.qty, 10) || 0);
        }, 0)
      : 0;

    return {
      id: displayId,
      currentStep: stepNum,
      statusSummary: `${STEP_LABELS[stepNum - 1]} — Active`,
      eta: "EST. DELIVERY: 3-5 BUSINESS DAYS",
      carrierNote: `Carrier: URBANDROPS Express Logistics${
        itemCount > 0 ? ` • ${itemCount} item${itemCount === 1 ? "" : "s"}` : ""
      }`,
      lastLocationCity: "New York Fulfillment Center, NY",
      lastLocationFacility: `Order ${displayId} confirmed • Preparing dispatch`,
      coords: "40.7128° N, 74.0060° W",
      steps: [
        {
          label: "Order Placed",
          date: placedDate,
          city: "New York, NY",
          statusMessage:
            "Your checkout order has been received and queued for fulfillment.",
          timestamp: placedTimestamp
        },
        {
          label: "Processing",
          date: stepNum >= 2 ? placedDate : "Pending",
          city: stepNum >= 2 ? "New York, NY" : "Awaiting Dispatch",
          statusMessage:
            stepNum >= 2
              ? "Order is being picked and packed at the fulfillment studio."
              : "Fulfillment team will pick and pack your pieces shortly.",
          timestamp: stepNum >= 2 ? placedTimestamp : "Awaiting warehouse scan"
        },
        {
          label: "Shipped",
          date: stepNum >= 3 ? placedDate : "Pending",
          city: stepNum >= 3 ? "Transit Hub" : "In Queue",
          statusMessage:
            stepNum >= 3
              ? "Package has left the fulfillment hub with courier tracking."
              : "Shipping label will activate once warehouse packing completes.",
          timestamp: stepNum >= 3 ? placedTimestamp : "Pending carrier pickup"
        },
        {
          label: "Delivered",
          date: stepNum >= 4 ? placedDate : "Pending",
          city: "Destination Address",
          statusMessage:
            stepNum >= 4
              ? "Package delivered to the shipping destination."
              : "Final courier delivery pending transit arrival.",
          timestamp: stepNum >= 4 ? placedTimestamp : "Pending delivery scan"
        }
      ]
    };
  }

  function findOrderById(rawInput) {
    const key = normalizeOrderKey(rawInput);
    if (!key) return null;

    try {
      const rawOrders = readStorage(STORAGE_KEYS.ORDERS);
      if (rawOrders) {
        const parsed = JSON.parse(rawOrders);
        if (Array.isArray(parsed)) {
          const match = parsed.find(function (order) {
            return normalizeOrderKey(order && order.id) === key;
          });
          if (match) {
            return buildOrderFromStored(match);
          }
        }
      }
    } catch (error) {
      // Fall back to seeded sample orders if stored orders JSON is malformed
    }

    return SAMPLE_ORDERS[key] || null;
  }

  function showSearchError(message) {
    if (elements.orderIdInput) {
      elements.orderIdInput.classList.add("is-field-invalid");
      elements.orderIdInput.setAttribute("aria-invalid", "true");
    }
    if (elements.searchError) {
      elements.searchError.textContent = message;
      elements.searchError.classList.remove("d-none");
    }
    if (elements.trackingContent) {
      elements.trackingContent.classList.add("d-none");
    }
  }

  function clearSearchError() {
    if (elements.orderIdInput) {
      elements.orderIdInput.classList.remove("is-field-invalid");
      elements.orderIdInput.removeAttribute("aria-invalid");
    }
    if (elements.searchError) {
      elements.searchError.textContent = "";
      elements.searchError.classList.add("d-none");
    }
  }

  function animateProgressFill(currentStep) {
    if (!elements.progressFill || !elements.progressBar) return;

    const percentMap = { 1: 25, 2: 50, 3: 75, 4: 100 };
    const targetPercent = percentMap[currentStep] || 25;

    elements.progressBar.setAttribute("aria-valuenow", String(targetPercent));
    elements.progressFill.style.width = "0%";

    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        elements.progressFill.style.width = `${targetPercent}%`;
      });
    });
  }

  function createStepElement(step, index, currentStep) {
    const stepNumber = index + 1;
    const isCompleted = stepNumber < currentStep;
    const isCurrent = stepNumber === currentStep;
    const collapseId = `step-collapse-${stepNumber}`;

    const li = document.createElement("li");
    li.className = "tracking-step";
    if (isCompleted) {
      li.classList.add("is-completed");
    } else if (isCurrent) {
      li.classList.add("is-current");
    } else {
      li.classList.add("is-pending");
    }

    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = "step-toggle-btn";
    toggleBtn.setAttribute("data-bs-toggle", "collapse");
    toggleBtn.setAttribute("data-bs-target", `#${collapseId}`);
    toggleBtn.setAttribute("aria-expanded", isCurrent ? "true" : "false");
    toggleBtn.setAttribute("aria-controls", collapseId);
    if (isCurrent) {
      toggleBtn.setAttribute("aria-current", "step");
    }

    const node = document.createElement("div");
    node.className = "step-node";
    node.setAttribute("aria-hidden", "true");
    node.textContent = isCompleted ? "✓" : String(stepNumber);

    const textWrap = document.createElement("div");
    textWrap.className = "step-text-wrap";

    const titleRow = document.createElement("div");
    titleRow.className = "step-title-row";

    const title = document.createElement("span");
    title.className = "step-title";
    title.textContent = step.label;

    const chevron = document.createElement("span");
    chevron.className = "step-chevron";
    chevron.setAttribute("aria-hidden", "true");
    chevron.textContent = "▾";

    titleRow.append(title, chevron);

    const date = document.createElement("p");
    date.className = "step-date";
    date.textContent = step.date;

    const city = document.createElement("p");
    city.className = "step-city";
    city.textContent = step.city;

    textWrap.append(titleRow, date, city);
    toggleBtn.append(node, textWrap);

    const collapseDiv = document.createElement("div");
    collapseDiv.id = collapseId;
    collapseDiv.className = `collapse step-collapse${isCurrent ? " show" : ""}`;

    const detailCard = document.createElement("div");
    detailCard.className = "step-detail-card";

    const detailMsg = document.createElement("p");
    detailMsg.className = "step-detail-msg";
    detailMsg.textContent = step.statusMessage;

    const detailTime = document.createElement("p");
    detailTime.className = "step-detail-time";
    detailTime.textContent = step.timestamp;

    detailCard.append(detailMsg, detailTime);
    collapseDiv.appendChild(detailCard);

    li.append(toggleBtn, collapseDiv);
    return li;
  }

  function renderOrder(order) {
    if (!order) return;

    if (elements.trackingContent) {
      elements.trackingContent.classList.remove("d-none");
    }
    if (elements.resultOrderId) {
      elements.resultOrderId.textContent = order.id;
    }
    if (elements.resultStatusSummary) {
      elements.resultStatusSummary.textContent = order.statusSummary;
    }
    if (elements.resultEtaBadge) {
      elements.resultEtaBadge.textContent = order.eta;
    }
    if (elements.resultCarrierNote) {
      elements.resultCarrierNote.textContent = order.carrierNote;
    }
    if (elements.mapCoordsTag) {
      elements.mapCoordsTag.textContent = order.coords;
    }
    if (elements.mapLocationCity) {
      elements.mapLocationCity.textContent = order.lastLocationCity;
    }
    if (elements.mapLocationFacility) {
      elements.mapLocationFacility.textContent = order.lastLocationFacility;
    }

    if (elements.trackingStepsList) {
      elements.trackingStepsList.innerHTML = "";
      const fragment = document.createDocumentFragment();
      order.steps.forEach(function (step, index) {
        fragment.appendChild(createStepElement(step, index, order.currentStep));
      });
      elements.trackingStepsList.appendChild(fragment);
    }

    animateProgressFill(order.currentStep);
  }

  function runOrderLookup(rawQuery, persistSearch) {
    const trimmed = String(rawQuery || "").trim();

    if (!trimmed) {
      showSearchError("Please enter an Order ID.");
      return false;
    }

    if (!ORDER_ID_PATTERN.test(trimmed)) {
      showSearchError("Order IDs look like #UD-1042.");
      return false;
    }

    const matchedOrder = findOrderById(trimmed);
    if (!matchedOrder) {
      showSearchError(
        "No order found with that ID. Check the ID and try again."
      );
      return false;
    }

    clearSearchError();
    if (persistSearch) {
      writeStorage(STORAGE_KEYS.LAST_SEARCHED_ID, matchedOrder.id);
    }
    renderOrder(matchedOrder);
    return true;
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    if (!elements.orderIdInput) return;
    runOrderLookup(elements.orderIdInput.value, true);
  }

  function bindStepKeyboardNavigation() {
    if (!elements.trackingStepsList) return;

    elements.trackingStepsList.addEventListener("keydown", function (event) {
      const stepButtons = Array.from(
        elements.trackingStepsList.querySelectorAll(".step-toggle-btn")
      );
      const currentIndex = stepButtons.indexOf(document.activeElement);
      if (currentIndex === -1) return;

      let nextIndex = null;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        nextIndex = (currentIndex + 1) % stepButtons.length;
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        nextIndex =
          (currentIndex - 1 + stepButtons.length) % stepButtons.length;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = stepButtons.length - 1;
      }

      if (nextIndex !== null) {
        event.preventDefault();
        stepButtons[nextIndex].focus();
      }
    });
  }

  function loadInitialOrder() {
    const params = new URLSearchParams(window.location.search);
    const urlId = params.get("id");

    if (urlId !== null && urlId.trim() !== "") {
      const cleanUrlId = urlId.trim();
      if (elements.orderIdInput) {
        elements.orderIdInput.value = cleanUrlId.startsWith("#")
          ? cleanUrlId.toUpperCase()
          : `#${cleanUrlId.toUpperCase()}`;
      }
      runOrderLookup(cleanUrlId, true);
      return;
    }

    const savedSearchId = readStorage(STORAGE_KEYS.LAST_SEARCHED_ID);
    if (savedSearchId) {
      if (elements.orderIdInput) {
        elements.orderIdInput.value = savedSearchId;
      }
      if (runOrderLookup(savedSearchId, false)) {
        return;
      }
    }

    clearSearchError();
    renderOrder(SAMPLE_ORDERS["UD-1042"]);
  }

  function bindEvents() {
    if (elements.searchForm) {
      elements.searchForm.addEventListener("submit", handleSearchSubmit);
    }

    if (elements.orderIdInput) {
      elements.orderIdInput.addEventListener("input", function () {
        if (elements.searchError && !elements.searchError.classList.contains("d-none")) {
          clearSearchError();
        }
      });
    }

    bindStepKeyboardNavigation();

    window.addEventListener("storage", function (event) {
      if (
        event.key === STORAGE_KEYS.CART ||
        event.key === STORAGE_KEYS.CART_COUNT
      ) {
        syncCartBadge();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    syncCartBadge();
    setupLogoFallback();
    bindEvents();
    loadInitialOrder();
  });
})();

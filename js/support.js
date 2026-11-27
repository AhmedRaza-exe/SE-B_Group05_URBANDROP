/**
 * URBANDROPS — Shared Support Pages Vanilla JS
 * Handles:
 *  - Dynamic Cart Badge synced with localStorage ('cartCount')
 *  - Shared Navbar Search bar behavior
 *  - Store Locator filtering & dark map pin selection (pages/store-locator.html)
 *  - FAQ Accordion [+] / [-] toggles & category filtering (pages/faq.html)
 *  - Contact Support real-time email validation & ticket confirmation (pages/contact-support.html)
 */

(function () {
  'use strict';

  /* ========================================================================
     1. SHARED CART BADGE (localStorage 'cartCount')
     ======================================================================== */
  function getCartCount() {
    try {
      const raw = localStorage.getItem('cartCount');
      const parsed = parseInt(raw, 10);
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    } catch (err) {
      return 0;
    }
  }

  function renderCartBadge() {
    const badges = document.querySelectorAll('[data-cart-badge]');
    const count = getCartCount();
    badges.forEach(function (badge) {
      badge.textContent = String(count);
      badge.setAttribute('aria-label', 'Cart items: ' + count);
    });
  }

  function initCartBadge() {
    renderCartBadge();
    window.addEventListener('storage', function (event) {
      if (event.key === 'cartCount') {
        renderCartBadge();
      }
    });
  }

  /* ========================================================================
     2. SHARED NAVBAR SEARCH BAR
     ======================================================================== */
  function showToast(message) {
    const existing = document.getElementById('udSharedToast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'udSharedToast';
    toast.className = 'ud-toast';
    toast.setAttribute('role', 'status');
    toast.textContent = message;
    document.body.appendChild(toast);

    window.setTimeout(function () {
      if (toast.parentNode) toast.remove();
    }, 3500);
  }

  function initNavbarSearch() {
    const searchForm = document.getElementById('udNavSearchForm');
    const searchInput = document.getElementById('udNavSearchInput');
    if (!searchForm || !searchInput) return;

    searchForm.addEventListener('submit', function (event) {
      event.preventDefault();
      const query = searchInput.value.trim();
      if (!query) {
        searchInput.focus();
        showToast('Enter a keyword to search URBANDROPS.');
        return;
      }

      // If on FAQ page, sync with live FAQ search input
      const faqSearchInput = document.getElementById('faqSearchInput');
      if (faqSearchInput) {
        faqSearchInput.value = query;
        faqSearchInput.dispatchEvent(new Event('input', { bubbles: true }));
        faqSearchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const visibleCount = Array.from(document.querySelectorAll('.ud-faq-item')).filter(function (el) {
          return el.style.display !== 'none';
        }).length;
        showToast(visibleCount + ' FAQ result(s) for "' + query + '".');
        return;
      }

      // If on Store Locator page, match city or store name
      const cityFilter = document.getElementById('cityFilter');
      if (cityFilter) {
        const lower = query.toLowerCase();
        const cities = ['islamabad', 'lahore', 'karachi'];
        const matchedCity = cities.find(function (c) {
          return c.includes(lower) || lower.includes(c);
        });
        if (matchedCity) {
          const properCity = matchedCity.charAt(0).toUpperCase() + matchedCity.slice(1);
          cityFilter.value = properCity;
          cityFilter.dispatchEvent(new Event('change'));
          showToast('Filtered stores for ' + properCity + '.');
          return;
        }
      }

      showToast('Searching catalog for "' + query + '"...');
    });
  }

  /* ========================================================================
     3. STORE LOCATOR PAGE (pages/store-locator.html)
     ======================================================================== */
  const STORES = [
    {
      id: 'isb-f7',
      city: 'Islamabad',
      name: 'URBANDROPS // F-7 JINNAH SUPER',
      badge: 'Flagship Store',
      address: 'Shop 14, Block 13-L, Jinnah Super Market, F-7 Markaz, Islamabad',
      hours: 'Mon – Sun: 11:00 AM – 10:30 PM',
      phone: '+92 51 2654109',
      status: 'OPEN NOW',
      coords: '33.7215° N, 73.0561° E',
      pinX: 58,
      pinY: 22
    },
    {
      id: 'isb-centaurus',
      city: 'Islamabad',
      name: 'URBANDROPS // CENTAURUS DROP LAB',
      badge: 'Concept Studio',
      address: 'Level 2, Unit 208, The Centaurus Mall, Jinnah Ave, F-8/4, Islamabad',
      hours: 'Mon – Sun: 11:00 AM – 11:00 PM',
      phone: '+92 51 2701822',
      status: 'OPEN NOW',
      coords: '33.7077° N, 73.0501° E',
      pinX: 66,
      pinY: 30
    },
    {
      id: 'lhr-gulberg',
      city: 'Lahore',
      name: 'URBANDROPS // MM ALAM GULBERG',
      badge: 'Flagship Store',
      address: '42-B, MM Alam Road, Block C-2, Gulberg III, Lahore',
      hours: 'Mon – Sun: 12:00 PM – 11:00 PM',
      phone: '+92 42 35784910',
      status: 'OPEN NOW',
      coords: '31.5122° N, 74.3514° E',
      pinX: 72,
      pinY: 48
    },
    {
      id: 'lhr-dha',
      city: 'Lahore',
      name: 'URBANDROPS // DHA PHASE 5',
      badge: 'Archive & Drops',
      address: 'Plaza 18, Sector CCA, DHA Phase 5, Lahore',
      hours: 'Mon – Sun: 12:00 PM – 10:30 PM',
      phone: '+92 42 37182204',
      status: 'OPEN NOW',
      coords: '31.4628° N, 74.4076° E',
      pinX: 80,
      pinY: 56
    },
    {
      id: 'khi-clifton',
      city: 'Karachi',
      name: 'URBANDROPS // CLIFTON BLOCK 4',
      badge: 'Flagship Store',
      address: 'Plot BC-9, Marine Promenade, Block 4 Clifton, Karachi',
      hours: 'Mon – Sun: 12:00 PM – 11:30 PM',
      phone: '+92 21 35871140',
      status: 'OPEN NOW',
      coords: '24.8138° N, 67.0299° E',
      pinX: 25,
      pinY: 78
    },
    {
      id: 'khi-dha',
      city: 'Karachi',
      name: 'URBANDROPS // DHA BUKHARI COMMERCIAL',
      badge: 'Streetwear Vault',
      address: '17-C, Lane 5, Bukhari Commercial, DHA Phase 6, Karachi',
      hours: 'Tue – Sun: 1:00 PM – 11:00 PM',
      phone: '+92 21 35249081',
      status: 'OPEN NOW',
      coords: '24.7937° N, 67.0645° E',
      pinX: 34,
      pinY: 84
    }
  ];

  function initStoreLocator() {
    const cityFilter = document.getElementById('cityFilter');
    const storeCardsContainer = document.getElementById('storeCardsContainer');
    const mapPinsContainer = document.getElementById('mapPinsContainer');
    const storeCountLabel = document.getElementById('storeCountLabel');
    const resetCityBtn = document.getElementById('resetCityFilter');

    if (!cityFilter || !storeCardsContainer || !mapPinsContainer) return;

    let selectedStoreId = STORES[0].id;

    function updateMapOverlay(store) {
      const titleEl = document.getElementById('mapActiveName');
      const cityEl = document.getElementById('mapActiveCity');
      const addressEl = document.getElementById('mapActiveAddress');
      const hoursEl = document.getElementById('mapActiveHours');
      const coordsEl = document.getElementById('mapActiveCoords');
      const directionsEl = document.getElementById('mapDirectionsBtn');

      if (!store) return;
      if (titleEl) titleEl.textContent = store.name;
      if (cityEl) cityEl.textContent = store.city + ' • ' + store.badge;
      if (addressEl) addressEl.textContent = store.address;
      if (hoursEl) hoursEl.textContent = store.hours;
      if (coordsEl) coordsEl.textContent = store.coords;
      if (directionsEl) {
        const query = encodeURIComponent(store.address);
        directionsEl.href = 'https://www.google.com/maps/search/?api=1&query=' + query;
      }
    }

    function selectStore(storeId) {
      selectedStoreId = storeId;
      const store = STORES.find(function (s) {
        return s.id === storeId;
      });
      updateMapOverlay(store);

      storeCardsContainer.querySelectorAll('[data-store-id]').forEach(function (card) {
        card.classList.toggle('is-selected', card.getAttribute('data-store-id') === storeId);
      });

      mapPinsContainer.querySelectorAll('[data-pin-id]').forEach(function (pin) {
        pin.classList.toggle('is-active', pin.getAttribute('data-pin-id') === storeId);
      });
    }

    function openDirectionsModal(storeId) {
      const store = STORES.find(function (s) {
        return s.id === storeId;
      });
      if (!store) return;

      selectStore(storeId);

      const badgeEl = document.getElementById('modalStoreBadge');
      const nameEl = document.getElementById('modalStoreName');
      const statusEl = document.getElementById('modalStoreStatus');
      const coordsEl = document.getElementById('modalStoreCoords');
      const addressEl = document.getElementById('modalStoreAddress');
      const hoursEl = document.getElementById('modalStoreHours');
      const phoneEl = document.getElementById('modalStorePhone');
      const directionsLink = document.getElementById('modalDirectionsLink');
      const pinLink = document.getElementById('modalMapsPinLink');
      const modalEl = document.getElementById('storeDirectionsModal');

      if (badgeEl) badgeEl.textContent = store.city + ' • ' + store.badge;
      if (nameEl) nameEl.textContent = store.name;
      if (statusEl) {
        statusEl.innerHTML = '<span class="ud-status-dot" aria-hidden="true"></span>' + store.status;
      }
      if (coordsEl) coordsEl.textContent = store.coords;
      if (addressEl) addressEl.textContent = store.address;
      if (hoursEl) hoursEl.textContent = store.hours;
      if (phoneEl) phoneEl.textContent = store.phone;

      const encodedAddress = encodeURIComponent(store.address);
      if (directionsLink) {
        directionsLink.href = 'https://www.google.com/maps/dir/?api=1&destination=' + encodedAddress;
      }
      if (pinLink) {
        pinLink.href = 'https://www.google.com/maps/search/?api=1&query=' + encodedAddress;
      }

      if (modalEl && window.bootstrap && window.bootstrap.Modal) {
        window.bootstrap.Modal.getOrCreateInstance(modalEl).show();
      }
    }

    function renderStores() {
      const selectedCity = cityFilter.value;
      const filtered = selectedCity === 'all'
        ? STORES
        : STORES.filter(function (s) {
            return s.city === selectedCity;
          });

      if (storeCountLabel) {
        storeCountLabel.textContent = 'Showing ' + filtered.length + ' ' + (filtered.length === 1 ? 'Location' : 'Locations');
      }

      if (resetCityBtn) {
        resetCityBtn.classList.toggle('d-none', selectedCity === 'all');
      }

      if (!filtered.some(function (s) { return s.id === selectedStoreId; })) {
        selectedStoreId = filtered.length > 0 ? filtered[0].id : null;
      }

      // Render Store Cards
      storeCardsContainer.innerHTML = '';
      filtered.forEach(function (store) {
        const col = document.createElement('div');
        col.className = 'col-12 col-md-6 col-lg-12';

        const isSelected = store.id === selectedStoreId;
        col.innerHTML =
          '<article class="ud-card ud-card-interactive p-4 h-100 ' + (isSelected ? 'is-selected' : '') + '" data-store-id="' + store.id + '">' +
            '<div class="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">' +
              '<div>' +
                '<span class="ud-city-badge me-2">' + store.city + '</span>' +
                '<span class="ud-mono small text-secondary">' + store.badge + '</span>' +
              '</div>' +
              '<span class="ud-status-pill">' +
                '<span class="ud-status-dot" aria-hidden="true"></span>' +
                store.status +
              '</span>' +
            '</div>' +
            '<h2 class="h5 fw-bold mb-2">' + store.name + '</h2>' +
            '<p class="text-secondary small mb-3">' + store.address + '</p>' +
            '<div class="d-flex flex-column gap-1 mb-3 small">' +
              '<div><span class="ud-mono text-secondary">HOURS:</span> <span class="text-white">' + store.hours + '</span></div>' +
              '<div><span class="ud-mono text-secondary">PHONE:</span> <span class="text-white">' + store.phone + '</span></div>' +
            '</div>' +
            '<div class="d-flex flex-wrap gap-2">' +
              '<button type="button" class="btn ud-btn-cta btn-sm" data-directions-store="' + store.id + '">Get Directions</button>' +
              '<button type="button" class="btn ud-btn-outline btn-sm" data-focus-store="' + store.id + '">Focus on Map</button>' +
              '<a href="contact-support.html" class="btn ud-btn-outline btn-sm">Store Inquiry</a>' +
            '</div>' +
          '</article>';

        storeCardsContainer.appendChild(col);
      });

      // Render Map Pins
      mapPinsContainer.innerHTML = '';
      filtered.forEach(function (store) {
        const pin = document.createElement('button');
        pin.type = 'button';
        pin.className = 'ud-map-pin' + (store.id === selectedStoreId ? ' is-active' : '');
        pin.style.left = store.pinX + '%';
        pin.style.top = store.pinY + '%';
        pin.setAttribute('data-pin-id', store.id);
        pin.setAttribute('aria-label', 'Select ' + store.name + ' in ' + store.city);
        pin.innerHTML = '<span class="ud-map-pin-dot" aria-hidden="true"></span><span>' + store.city.slice(0, 3).toUpperCase() + '</span>';

        pin.addEventListener('click', function () {
          selectStore(store.id);
        });
        mapPinsContainer.appendChild(pin);
      });

      // Bind Get Directions modal triggers and map focus buttons on cards
      storeCardsContainer.querySelectorAll('[data-directions-store]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          openDirectionsModal(btn.getAttribute('data-directions-store'));
        });
      });

      storeCardsContainer.querySelectorAll('[data-focus-store]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          selectStore(btn.getAttribute('data-focus-store'));
        });
      });

      const activeStore = filtered.find(function (s) { return s.id === selectedStoreId; });
      updateMapOverlay(activeStore);
    }

    cityFilter.addEventListener('change', renderStores);

    if (resetCityBtn) {
      resetCityBtn.addEventListener('click', function () {
        cityFilter.value = 'all';
        renderStores();
      });
    }

    renderStores();
  }

  /* ========================================================================
     4. FAQ ACCORDION PAGE (pages/faq.html)
     ======================================================================== */
  function initFaqAccordion() {
    const triggers = document.querySelectorAll('.ud-faq-trigger');
    if (triggers.length === 0) return;

    function setFaqState(item, open) {
      const trigger = item.querySelector('.ud-faq-trigger');
      const icon = item.querySelector('.ud-faq-toggle-icon');
      item.classList.toggle('is-open', open);
      if (trigger) {
        trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
      }
      if (icon) {
        icon.textContent = open ? '[-]' : '[+]';
      }
    }

    triggers.forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        const item = trigger.closest('.ud-faq-item');
        if (!item) return;
        const currentlyOpen = item.classList.contains('is-open');
        setFaqState(item, !currentlyOpen);
      });
    });

    // Live Keyword Search + Category filter buttons (All / Shipping / Returns / Sizing)
    const categoryButtons = document.querySelectorAll('[data-faq-filter]');
    const sections = document.querySelectorAll('[data-faq-section]');
    const allFaqItems = Array.from(document.querySelectorAll('.ud-faq-item'));
    const faqSearchInput = document.getElementById('faqSearchInput');
    const faqSearchClear = document.getElementById('faqSearchClear');
    const faqSearchCount = document.getElementById('faqSearchCount');
    const resetFaqSearchBtn = document.getElementById('resetFaqSearchBtn');
    const faqEmpty = document.getElementById('faqEmptyState');

    let activeCategory = 'all';

    function applyFaqFilters() {
      const query = faqSearchInput ? faqSearchInput.value.trim().toLowerCase() : '';
      let visibleCount = 0;

      sections.forEach(function (section) {
        const sectionKey = section.getAttribute('data-faq-section');
        const categoryMatch = activeCategory === 'all' || activeCategory === sectionKey;
        const sectionItems = Array.from(section.querySelectorAll('.ud-faq-item'));
        let sectionVisibleCount = 0;

        sectionItems.forEach(function (item) {
          const keywordMatch = query === '' || item.textContent.toLowerCase().includes(query);
          const shouldShow = categoryMatch && keywordMatch;
          item.style.display = shouldShow ? '' : 'none';
          if (shouldShow) {
            sectionVisibleCount += 1;
            visibleCount += 1;
          }
        });

        section.style.display = sectionVisibleCount > 0 ? '' : 'none';
      });

      if (faqEmpty) {
        faqEmpty.classList.toggle('d-none', visibleCount > 0);
      }

      if (faqSearchClear) {
        faqSearchClear.classList.toggle('d-none', query.length === 0);
      }

      if (faqSearchCount) {
        faqSearchCount.textContent =
          'Showing ' + visibleCount + ' of ' + allFaqItems.length + ' ' + (allFaqItems.length === 1 ? 'Question' : 'Questions');
      }
    }

    if (faqSearchInput) {
      faqSearchInput.addEventListener('input', applyFaqFilters);
    }

    if (faqSearchClear) {
      faqSearchClear.addEventListener('click', function () {
        if (faqSearchInput) {
          faqSearchInput.value = '';
          faqSearchInput.focus();
        }
        const navSearchInput = document.getElementById('udNavSearchInput');
        if (navSearchInput) navSearchInput.value = '';
        applyFaqFilters();
      });
    }

    categoryButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        activeCategory = btn.getAttribute('data-faq-filter') || 'all';

        categoryButtons.forEach(function (b) {
          b.classList.toggle('active', b === btn);
        });

        applyFaqFilters();
      });
    });

    if (resetFaqSearchBtn) {
      resetFaqSearchBtn.addEventListener('click', function () {
        activeCategory = 'all';
        categoryButtons.forEach(function (b) {
          b.classList.toggle('active', b.getAttribute('data-faq-filter') === 'all');
        });
        if (faqSearchInput) {
          faqSearchInput.value = '';
          faqSearchInput.focus();
        }
        const navSearchInput = document.getElementById('udNavSearchInput');
        if (navSearchInput) navSearchInput.value = '';
        applyFaqFilters();
      });
    }

    applyFaqFilters();
  }

  /* ========================================================================
     5. CONTACT SUPPORT PAGE (pages/contact-support.html)
     ======================================================================== */
  function initContactSupport() {
    const form = document.getElementById('supportTicketForm');
    if (!form) return;

    const nameInput = document.getElementById('supportName');
    const emailInput = document.getElementById('supportEmail');
    const subjectSelect = document.getElementById('supportSubject');
    const messageInput = document.getElementById('supportMessage');

    const nameFeedback = document.getElementById('nameFeedback');
    const emailFeedback = document.getElementById('emailFeedback');
    const subjectFeedback = document.getElementById('subjectFeedback');
    const messageFeedback = document.getElementById('messageFeedback');

    const confirmationContainer = document.getElementById('ticketConfirmationContainer');
    const charCounter = document.getElementById('messageCharCount');

    const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    function setFieldFeedback(input, feedbackEl, isValid, message) {
      input.classList.remove('is-valid-ud', 'is-invalid-ud');
      feedbackEl.classList.remove('is-valid', 'is-invalid');
      input.setAttribute('aria-invalid', isValid ? 'false' : 'true');

      if (isValid) {
        input.classList.add('is-valid-ud');
        if (message) feedbackEl.classList.add('is-valid');
      } else {
        input.classList.add('is-invalid-ud');
        if (message) feedbackEl.classList.add('is-invalid');
      }
      feedbackEl.textContent = message;
    }

    function validateEmailRealtime() {
      const val = emailInput.value.trim();
      if (val.length === 0) {
        setFieldFeedback(emailInput, emailFeedback, false, 'Email address is required (e.g., user@domain.com).');
        return false;
      }
      if (!EMAIL_REGEX.test(val)) {
        setFieldFeedback(emailInput, emailFeedback, false, 'Invalid email format. Use user@domain.com.');
        return false;
      }
      setFieldFeedback(emailInput, emailFeedback, true, 'Valid email format.');
      return true;
    }

    function validateName() {
      const val = nameInput.value.trim();
      if (val.length < 2) {
        setFieldFeedback(nameInput, nameFeedback, false, 'Full name is required (at least 2 characters).');
        return false;
      }
      setFieldFeedback(nameInput, nameFeedback, true, 'Looks good.');
      return true;
    }

    function validateSubject() {
      if (!subjectSelect.value) {
        setFieldFeedback(subjectSelect, subjectFeedback, false, 'Please select a support category.');
        return false;
      }
      setFieldFeedback(subjectSelect, subjectFeedback, true, 'Category selected.');
      return true;
    }

    function validateMessage() {
      const val = messageInput.value.trim();
      if (val.length < 15) {
        setFieldFeedback(messageInput, messageFeedback, false, 'Message must be at least 15 characters (' + val.length + '/15).');
        return false;
      }
      setFieldFeedback(messageInput, messageFeedback, true, 'Message ready.');
      return true;
    }

    function renderTicketConfirmationCard(ticketCode, customerName, customerEmail, subjectText) {
      if (!confirmationContainer) return;

      confirmationContainer.innerHTML = '';

      const card = document.createElement('div');
      card.className = 'ud-ticket-confirmation-card';
      card.setAttribute('role', 'alert');

      const topRow = document.createElement('div');
      topRow.className = 'd-flex justify-content-between align-items-start gap-3';

      const headerContent = document.createElement('div');

      const badge = document.createElement('span');
      badge.className = 'ud-ticket-badge mb-2';
      badge.textContent = 'CONFIRMED // SUPPORT LOGGED';

      const heading = document.createElement('h2');
      heading.className = 'h5 ud-ticket-title mb-1';
      heading.textContent = 'Ticket #' + ticketCode + ' Created Successfully';

      const lead = document.createElement('p');
      lead.className = 'mb-0 small fw-medium';
      lead.textContent = 'Confirmation routed to ' + customerEmail + '. Average concierge response is under 12 hours.';

      headerContent.appendChild(badge);
      headerContent.appendChild(heading);
      headerContent.appendChild(lead);

      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'btn-close';
      closeBtn.setAttribute('aria-label', 'Dismiss ticket confirmation');
      closeBtn.addEventListener('click', function () {
        confirmationContainer.classList.add('d-none');
        confirmationContainer.innerHTML = '';
      });

      topRow.appendChild(headerContent);
      topRow.appendChild(closeBtn);

      const meta = document.createElement('div');
      meta.className = 'ud-ticket-meta ud-mono d-flex flex-wrap gap-3';

      const nameMeta = document.createElement('span');
      nameMeta.textContent = 'REQUESTER: ' + customerName;

      const subjectMeta = document.createElement('span');
      subjectMeta.textContent = 'CATEGORY: ' + subjectText;

      meta.appendChild(nameMeta);
      meta.appendChild(subjectMeta);

      card.appendChild(topRow);
      card.appendChild(meta);

      confirmationContainer.appendChild(card);
      confirmationContainer.classList.remove('d-none');
      confirmationContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Live validation across all form fields as user types/selects
    emailInput.addEventListener('input', validateEmailRealtime);
    emailInput.addEventListener('blur', validateEmailRealtime);

    nameInput.addEventListener('input', validateName);
    nameInput.addEventListener('blur', validateName);

    subjectSelect.addEventListener('change', validateSubject);
    subjectSelect.addEventListener('blur', validateSubject);

    messageInput.addEventListener('input', function () {
      if (charCounter) {
        charCounter.textContent = messageInput.value.length + ' / 1000';
      }
      validateMessage();
    });
    messageInput.addEventListener('blur', validateMessage);

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      const isNameOk = validateName();
      const isEmailOk = validateEmailRealtime();
      const isSubjectOk = validateSubject();
      const isMessageOk = validateMessage();

      if (!isNameOk || !isEmailOk || !isSubjectOk || !isMessageOk) {
        if (confirmationContainer) {
          confirmationContainer.classList.add('d-none');
        }
        const firstInvalid = form.querySelector('.is-invalid-ud');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      const ticketCode = 'SUP-' + Math.floor(100 + Math.random() * 900);
      renderTicketConfirmationCard(
        ticketCode,
        nameInput.value.trim(),
        emailInput.value.trim(),
        subjectSelect.value
      );

      form.reset();
      if (charCounter) charCounter.textContent = '0 / 1000';

      [nameInput, emailInput, subjectSelect, messageInput].forEach(function (el) {
        el.classList.remove('is-valid-ud', 'is-invalid-ud');
        el.removeAttribute('aria-invalid');
      });
      [nameFeedback, emailFeedback, subjectFeedback, messageFeedback].forEach(function (el) {
        el.textContent = '';
        el.classList.remove('is-valid', 'is-invalid');
      });
    });
  }

  /* ========================================================================
     BOOTSTRAP INIT
     ======================================================================== */
  document.addEventListener('DOMContentLoaded', function () {
    initCartBadge();
    initNavbarSearch();
    initStoreLocator();
    initFaqAccordion();
    initContactSupport();
  });
})();

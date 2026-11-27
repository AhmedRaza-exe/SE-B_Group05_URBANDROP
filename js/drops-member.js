/**
 * URBANDROPS — Limited Drops, User Profile & Wishlist Vanilla JS
 * Handles:
 *  - Dynamic Cart Badge synced with localStorage ('cartCount' & 'cart')
 *  - Shared Navbar Search bar filtering / feedback
 *  - Limited Drops live Volt Lime countdown timer (04:12:59), teaser alerts, & NOTIFY ME form
 *  - User Profile VIP Platinum dashboard, interactive loyalty progress bar (1,250 / 2,000 pts), & vouchers
 *  - Wishlist saved items loaded from JS array / localStorage & MOVE TO CART transfer
 */

(function () {
  'use strict';

  const STORAGE_KEYS = {
    CART: 'cart',
    CART_COUNT: 'cartCount',
    WISHLIST: 'wishlist',
    DROP_NOTIFICATIONS: 'udDropNotifications',
    LOYALTY_POINTS: 'udLoyaltyPoints',
    REDEEMED_VOUCHERS: 'udRedeemedVouchers'
  };

  /* ========================================================================
     1. SVG PRODUCT ARTWORK GENERATOR (Crisp Data URIs — Zero Broken Images)
     ======================================================================== */
  function createStreetwearArtUri(titleTag, accentHex, silhouetteType) {
    let shapeSvg = '';
    if (silhouetteType === 'jacket') {
      shapeSvg =
        '<path d="M90 50 L130 38 L160 54 L190 38 L230 50 L254 118 L224 130 L212 88 L212 204 L108 204 L108 88 L96 130 L66 118 Z" fill="#1E1E1E" stroke="' + accentHex + '" stroke-width="3"/>' +
        '<line x1="160" y1="54" x2="160" y2="204" stroke="' + accentHex + '" stroke-width="2.5" stroke-dasharray="6 4"/>' +
        '<rect x="120" y="138" width="26" height="32" rx="3" fill="#121212" stroke="#444" stroke-width="2"/>' +
        '<rect x="174" y="138" width="26" height="32" rx="3" fill="#121212" stroke="#444" stroke-width="2"/>';
    } else if (silhouetteType === 'cargo') {
      shapeSvg =
        '<path d="M112 42 L208 42 L224 204 L178 204 L160 112 L142 204 L96 204 Z" fill="#1E1E1E" stroke="' + accentHex + '" stroke-width="3"/>' +
        '<rect x="94" y="102" width="28" height="36" rx="3" fill="#121212" stroke="' + accentHex + '" stroke-width="2"/>' +
        '<rect x="198" y="102" width="28" height="36" rx="3" fill="#121212" stroke="' + accentHex + '" stroke-width="2"/>' +
        '<line x1="112" y1="56" x2="208" y2="56" stroke="#444" stroke-width="2"/>';
    } else if (silhouetteType === 'hoodie') {
      shapeSvg =
        '<path d="M130 42 Q160 22 190 42 L236 62 L252 130 L220 140 L206 94 L206 202 L114 202 L114 94 L100 140 L68 130 L84 62 Z" fill="#1E1E1E" stroke="' + accentHex + '" stroke-width="3"/>' +
        '<path d="M132 46 Q160 76 188 46" fill="none" stroke="' + accentHex + '" stroke-width="2.5"/>' +
        '<path d="M126 144 L194 144 L202 184 L118 184 Z" fill="#121212" stroke="#444" stroke-width="2"/>';
    } else {
      shapeSvg =
        '<rect x="96" y="54" width="128" height="136" rx="12" fill="#1E1E1E" stroke="' + accentHex + '" stroke-width="3"/>' +
        '<path d="M122 54 L122 36 L198 36 L198 54" fill="none" stroke="' + accentHex + '" stroke-width="3"/>' +
        '<rect x="114" y="84" width="92" height="44" rx="4" fill="#121212" stroke="#444" stroke-width="2"/>' +
        '<line x1="114" y1="152" x2="206" y2="152" stroke="' + accentHex + '" stroke-width="2.5"/>';
    }

    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240">' +
      '<rect width="320" height="240" fill="#111111"/>' +
      '<circle cx="160" cy="120" r="88" fill="' + accentHex + '" fill-opacity="0.07"/>' +
      shapeSvg +
      '<text x="160" y="226" text-anchor="middle" fill="#888888" font-family="monospace" font-size="11" font-weight="700" letter-spacing="2">' +
      titleTag +
      '</text>' +
      '</svg>';

    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  }

  /* ========================================================================
     2. STORAGE HELPERS & SHARED CART BADGE (localStorage 'cartCount' & 'cart')
     ======================================================================== */
  function readStorage(key) {
    try {
      return localStorage.getItem(key);
    } catch (err) {
      return null;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (err) {
      // Ignore storage quota / privacy-mode errors gracefully
    }
  }

  function getStoredCart() {
    try {
      const raw = readStorage(STORAGE_KEYS.CART);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }

  function computeCartCount(cart) {
    return cart.reduce(function (total, item) {
      const qty = parseInt(item && item.qty, 10);
      return total + (Number.isFinite(qty) && qty > 0 ? qty : 0);
    }, 0);
  }

  function getCartCount() {
    const rawCount = readStorage(STORAGE_KEYS.CART_COUNT);
    if (rawCount !== null) {
      const parsed = parseInt(rawCount, 10);
      if (Number.isFinite(parsed) && parsed >= 0) {
        return parsed;
      }
    }
    return computeCartCount(getStoredCart());
  }

  function renderCartBadge(animate) {
    const badges = document.querySelectorAll('[data-cart-badge], #cart-badge');
    const count = getCartCount();
    badges.forEach(function (badge) {
      badge.textContent = String(count);
      badge.setAttribute('aria-label', 'Cart items: ' + count);
      if (animate) {
        badge.classList.remove('is-bumped');
        void badge.offsetWidth;
        badge.classList.add('is-bumped');
        window.setTimeout(function () {
          badge.classList.remove('is-bumped');
        }, 240);
      }
    });
  }

  function addItemToCartStorage(item) {
    const prevCount = getCartCount();
    const cart = getStoredCart();
    const prevCartQty = computeCartCount(cart);
    const matchKey = item.id + '::' + (item.size || 'M');

    const existing = cart.find(function (entry) {
      const entryKey = entry.id + '::' + (entry.size || 'M');
      return entryKey === matchKey;
    });

    if (existing) {
      existing.qty = (parseInt(existing.qty, 10) || 0) + 1;
      existing.name = item.name;
      existing.price = item.price;
      existing.image = item.image;
      existing.size = item.size || existing.size || 'M';
    } else {
      cart.push({
        id: item.id,
        name: item.name,
        price: item.price,
        qty: 1,
        size: item.size || 'M',
        category: item.category || 'STREETWEAR',
        image: item.image
      });
    }

    const updatedCartQty = computeCartCount(cart);
    const nextCount = prevCount > prevCartQty ? prevCount + 1 : updatedCartQty;

    writeStorage(STORAGE_KEYS.CART, JSON.stringify(cart));
    writeStorage(STORAGE_KEYS.CART_COUNT, String(nextCount));
    renderCartBadge(true);
    return nextCount;
  }

  function initCartBadge() {
    renderCartBadge(false);
    window.addEventListener('storage', function (event) {
      if (event.key === STORAGE_KEYS.CART_COUNT || event.key === STORAGE_KEYS.CART) {
        renderCartBadge(false);
      }
    });
  }

  /* ========================================================================
     3. SHARED TOAST & NAVBAR SEARCH BAR
     ======================================================================== */
  let toastTimeoutId = null;

  function showToast(message, variant) {
    const existing = document.getElementById('udSharedToast');
    if (existing) existing.remove();
    if (toastTimeoutId) {
      window.clearTimeout(toastTimeoutId);
      toastTimeoutId = null;
    }

    const toast = document.createElement('div');
    toast.id = 'udSharedToast';
    toast.className = 'ud-toast' + (variant === 'volt' ? ' ud-toast-volt' : '');
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.textContent = message;
    document.body.appendChild(toast);

    toastTimeoutId = window.setTimeout(function () {
      if (toast.parentNode) toast.remove();
      toastTimeoutId = null;
    }, 3200);
  }

  function initNavbarSearch() {
    const searchForm = document.getElementById('udNavSearchForm');
    const searchInput = document.getElementById('udNavSearchInput');
    if (!searchForm || !searchInput) return;

    function filterCardsByQuery(query) {
      const cards = document.querySelectorAll('[data-searchable-card]');
      if (!cards.length) return -1;

      const normalized = query.trim().toLowerCase();
      let visibleCount = 0;

      cards.forEach(function (card) {
        const text = (card.textContent || '').toLowerCase();
        const isMatch = !normalized || text.indexOf(normalized) !== -1;
        card.classList.toggle('d-none', !isMatch);
        if (isMatch) visibleCount += 1;
      });

      return visibleCount;
    }

    searchInput.addEventListener('input', function () {
      if (!searchInput.value.trim()) {
        filterCardsByQuery('');
      }
    });

    searchForm.addEventListener('submit', function (event) {
      event.preventDefault();
      const query = searchInput.value.trim();
      if (!query) {
        filterCardsByQuery('');
        searchInput.focus();
        showToast('Enter a keyword to search URBANDROPS.');
        return;
      }

      const matched = filterCardsByQuery(query);
      if (matched >= 0) {
        if (matched === 0) {
          showToast('No items matched "' + query + '". Clear search to view all.');
        } else {
          showToast('Showing ' + matched + ' result(s) for "' + query + '".');
        }
        return;
      }

      showToast('Search queued for "' + query + '".');
    });
  }

  /* ========================================================================
     4. LIMITED DROPS PAGE (pages/limited-drops.html)
     ======================================================================== */
  const UPCOMING_DROPS = [
    {
      id: 'ld-01',
      batch: 'DROP 01 // BATCH #047',
      name: 'Stealth Shell Tech Parka',
      category: 'OUTERWEAR',
      price: 185,
      edition: '150 PCS ONLY',
      release: 'TONIGHT // 04H',
      description: '3-layer waterproof ripstop shell with articulated elbows and hidden Volt Lime storm-hood trim.',
      image: createStreetwearArtUri('BATCH #047 // TECH PARKA', '#CCFF00', 'jacket')
    },
    {
      id: 'ld-02',
      batch: 'DROP 02 // BATCH #048',
      name: 'Volt Reflective Cargo Pant',
      category: 'BOTTOMS',
      price: 120,
      edition: '200 PCS ONLY',
      release: 'DEC 01 // 20:00 PKT',
      description: 'Heavy nylon twill relaxed cargos featuring 3M reflective piping and gusseted utility bellows.',
      image: createStreetwearArtUri('BATCH #048 // CARGO PANT', '#FF4D00', 'cargo')
    },
    {
      id: 'ld-03',
      batch: 'DROP 03 // BATCH #049',
      name: 'Acid Wash Heavyweight Hoodie',
      category: 'TOPS',
      price: 95,
      edition: '250 PCS ONLY',
      release: 'DEC 05 // 20:00 PKT',
      description: '520 GSM brushed French terry drop-shoulder silhouette with enzyme-washed charcoal finish.',
      image: createStreetwearArtUri('BATCH #049 // HEAVY HOODIE', '#CCFF00', 'hoodie')
    },
    {
      id: 'ld-04',
      batch: 'DROP 04 // BATCH #050',
      name: 'Tactical Cordura Chest Rig',
      category: 'ACCESSORIES',
      price: 75,
      edition: '100 PCS ONLY',
      release: 'DEC 10 // 20:00 PKT',
      description: '1000D ballistic Cordura modular rig with Fidlock magnetic buckles and laser-cut MOLLE panel.',
      image: createStreetwearArtUri('BATCH #050 // CHEST RIG', '#FF4D00', 'bag')
    }
  ];

  function padZero(num) {
    return num < 10 ? '0' + num : String(num);
  }

  function initLimitedDropsPage() {
    const countdownEl = document.getElementById('dropCountdownClock');
    const teaserGrid = document.getElementById('dropTeaserGrid');
    const notifyForm = document.getElementById('notifyMeForm');

    if (!countdownEl && !teaserGrid && !notifyForm) return;

    // 1. Live Volt Lime Digital Countdown Timer starting at 04:12:59
    if (countdownEl) {
      let remainingSeconds = (4 * 3600) + (12 * 60) + 59; // 04:12:59
      const statusEl = document.getElementById('dropTimerStatus');

      function renderCountdown() {
        const hrs = Math.floor(remainingSeconds / 3600);
        const mins = Math.floor((remainingSeconds % 3600) / 60);
        const secs = remainingSeconds % 60;
        countdownEl.textContent = padZero(hrs) + ':' + padZero(mins) + ':' + padZero(secs);
      }

      renderCountdown();

      const timerId = window.setInterval(function () {
        if (remainingSeconds > 0) {
          remainingSeconds -= 1;
          renderCountdown();
          if (remainingSeconds === 0 && statusEl) {
            statusEl.textContent = 'DROP LIVE NOW';
            window.clearInterval(timerId);
          }
        } else {
          if (statusEl) statusEl.textContent = 'DROP LIVE NOW';
          window.clearInterval(timerId);
        }
      }, 1000);
    }

    // 2. Render Next Drop Teaser Cards
    if (teaserGrid) {
      teaserGrid.innerHTML = UPCOMING_DROPS.map(function (drop) {
        return (
          '<div class="col-12 col-md-6 col-xl-3" data-searchable-card>' +
          '  <article class="ud-card ud-card-interactive h-100 d-flex flex-column">' +
          '    <div class="ud-product-visual">' +
          '      <span class="ud-badge-pill ud-badge-volt ud-visual-tag-tl">' + drop.edition + '</span>' +
          '      <span class="ud-badge-pill ud-badge-muted ud-visual-tag-tr">' + drop.category + '</span>' +
          '      <img src="' + drop.image + '" alt="' + drop.name + '">' +
          '    </div>' +
          '    <div class="p-3 p-lg-4 d-flex flex-column flex-grow-1">' +
          '      <div class="ud-mono small text-secondary mb-1">' + drop.batch + '</div>' +
          '      <h3 class="h5 fw-bold text-white mb-2">' + drop.name + '</h3>' +
          '      <p class="small text-secondary mb-3 flex-grow-1">' + drop.description + '</p>' +
          '      <div class="d-flex justify-content-between align-items-center border-top border-secondary border-opacity-25 pt-3 mb-3">' +
          '        <span class="ud-mono small text-secondary">' + drop.release + '</span>' +
          '        <span class="ud-mono fw-bold fs-5 text-white">$' + drop.price + '</span>' +
          '      </div>' +
          '      <div class="d-grid gap-2">' +
          '        <button type="button" class="btn ud-btn-cta btn-sm" data-notify-drop="' + drop.name + '">NOTIFY FOR THIS DROP</button>' +
          '        <button type="button" class="btn ud-btn-outline btn-sm" data-save-wishlist="' + drop.id + '">SAVE TO WISHLIST</button>' +
          '      </div>' +
          '    </div>' +
          '  </article>' +
          '</div>'
        );
      }).join('');

      teaserGrid.addEventListener('click', function (event) {
        const notifyBtn = event.target.closest('[data-notify-drop]');
        if (notifyBtn) {
          const dropName = notifyBtn.getAttribute('data-notify-drop');
          const selectEl = document.getElementById('notifyDropSelect');
          const emailEl = document.getElementById('notifyEmailInput');
          if (selectEl) {
            selectEl.value = dropName;
          }
          if (emailEl) {
            emailEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            window.setTimeout(function () {
              emailEl.focus();
            }, 300);
          }
          showToast('Selected "' + dropName + '" for drop alerts.');
          return;
        }

        const wishBtn = event.target.closest('[data-save-wishlist]');
        if (wishBtn) {
          const dropId = wishBtn.getAttribute('data-save-wishlist');
          const drop = UPCOMING_DROPS.find(function (d) { return d.id === dropId; });
          if (!drop) return;

          const currentWishlist = getWishlistItems();
          const alreadySaved = currentWishlist.some(function (w) { return w.id === drop.id; });
          if (alreadySaved) {
            showToast(drop.name + ' is already in your Wishlist.');
          } else {
            currentWishlist.push({
              id: drop.id,
              name: drop.name,
              category: drop.category,
              price: drop.price,
              size: 'L',
              stockStatus: 'UPCOMING DROP',
              image: drop.image
            });
            saveWishlistItems(currentWishlist);
            wishBtn.textContent = 'SAVED IN WISHLIST';
            wishBtn.classList.add('active');
            showToast('Saved "' + drop.name + '" to Wishlist.');
          }
        }
      });
    }

    // 3. 'NOTIFY ME' Email Signup Form with Live Email Validation & Success Banner
    if (notifyForm) {
      const emailInput = document.getElementById('notifyEmailInput');
      const dropSelect = document.getElementById('notifyDropSelect');
      const feedbackEl = document.getElementById('notifyEmailFeedback');
      const confirmBanner = document.getElementById('notifyConfirmationBanner');
      const confirmSummary = document.getElementById('notifyConfirmedSummary');
      const subscriberCountEl = document.getElementById('notifySubscriberCount');
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      let hasInteracted = false;

      function updateSubscriberCounter() {
        if (!subscriberCountEl) return;
        try {
          const saved = JSON.parse(readStorage(STORAGE_KEYS.DROP_NOTIFICATIONS) || '[]');
          const base = 1842;
          subscriberCountEl.textContent = (base + (Array.isArray(saved) ? saved.length : 0)).toLocaleString();
        } catch (err) {
          subscriberCountEl.textContent = '1,842';
        }
      }

      function clearEmailValidationState() {
        if (emailInput) {
          emailInput.classList.remove('is-invalid-ud', 'is-valid-ud', 'border-danger');
          emailInput.removeAttribute('aria-invalid');
        }
        if (feedbackEl) {
          feedbackEl.textContent = '';
          feedbackEl.classList.add('d-none');
        }
      }

      function validateNotifyEmail(forceShowEmptyError) {
        const email = emailInput ? emailInput.value.trim() : '';

        if (!email) {
          if (!forceShowEmptyError && !hasInteracted) {
            clearEmailValidationState();
            return false;
          }
          if (emailInput) {
            emailInput.classList.remove('is-valid-ud');
            emailInput.classList.add('is-invalid-ud');
            emailInput.setAttribute('aria-invalid', 'true');
          }
          if (feedbackEl) {
            feedbackEl.style.color = '#FF4D00';
            feedbackEl.textContent = 'Email address is required to join the drop queue.';
            feedbackEl.classList.remove('d-none');
          }
          return false;
        }

        if (!emailRegex.test(email)) {
          if (emailInput) {
            emailInput.classList.remove('is-valid-ud');
            emailInput.classList.add('is-invalid-ud');
            emailInput.setAttribute('aria-invalid', 'true');
          }
          if (feedbackEl) {
            feedbackEl.style.color = '#FF4D00';
            feedbackEl.textContent = 'Enter a valid email format (e.g. name@domain.com).';
            feedbackEl.classList.remove('d-none');
          }
          return false;
        }

        if (emailInput) {
          emailInput.classList.remove('is-invalid-ud', 'border-danger');
          emailInput.classList.add('is-valid-ud');
          emailInput.setAttribute('aria-invalid', 'false');
        }
        if (feedbackEl) {
          feedbackEl.style.color = '#CCFF00';
          feedbackEl.textContent = 'Valid email — ready for priority drop dispatch.';
          feedbackEl.classList.remove('d-none');
        }
        return true;
      }

      updateSubscriberCounter();

      if (emailInput) {
        emailInput.addEventListener('input', function () {
          if (emailInput.value.trim().length > 0) {
            hasInteracted = true;
          }
          if (confirmBanner && !confirmBanner.classList.contains('d-none')) {
            confirmBanner.classList.add('d-none');
          }
          validateNotifyEmail(false);
        });

        emailInput.addEventListener('blur', function () {
          if (emailInput.value.trim().length > 0 || hasInteracted) {
            hasInteracted = true;
            validateNotifyEmail(true);
          }
        });
      }

      notifyForm.addEventListener('submit', function (event) {
        event.preventDefault();
        hasInteracted = true;

        if (!validateNotifyEmail(true)) {
          if (emailInput) emailInput.focus();
          return;
        }

        const email = emailInput ? emailInput.value.trim() : '';
        const selectedDrop = dropSelect ? dropSelect.value : 'All Upcoming Drops';

        try {
          const existing = JSON.parse(readStorage(STORAGE_KEYS.DROP_NOTIFICATIONS) || '[]');
          const list = Array.isArray(existing) ? existing : [];
          list.push({
            email: email,
            drop: selectedDrop,
            subscribedAt: new Date().toISOString()
          });
          writeStorage(STORAGE_KEYS.DROP_NOTIFICATIONS, JSON.stringify(list));
        } catch (err) {
          // Continue cleanly
        }

        updateSubscriberCounter();

        if (confirmSummary) {
          confirmSummary.textContent =
            'Alert confirmed for ' + email + ' on "' + selectedDrop + '". We will ping you 15 minutes before launch.';
        }
        if (confirmBanner) {
          confirmBanner.classList.remove('d-none');
        }

        notifyForm.reset();
        hasInteracted = false;
        clearEmailValidationState();
        showToast('Drop alert activated for ' + email, 'volt');
      });
    }
  }

  /* ========================================================================
     5. USER PROFILE PAGE (pages/user-profile.html)
     ======================================================================== */
  const VOUCHERS = [
    {
      id: 'v-15off',
      title: '15% OFF NEXT DROP',
      subtitle: 'Valid on any capsule outerwear or tops order',
      cost: 500,
      code: 'UD-PLAT15',
      expiry: 'EXPIRES 30 DAYS AFTER REDEEM'
    },
    {
      id: 'v-ship',
      title: 'FREE EXPRESS SHIPPING',
      subtitle: 'Zero shipping fees on overnight urban courier',
      cost: 300,
      code: 'UD-SHIPFREE',
      expiry: 'VALID ON ALL ORDERS'
    },
    {
      id: 'v-vault25',
      title: '$25 VAULT CREDIT',
      subtitle: 'Instant $25 deduction at checkout ($100 min)',
      cost: 800,
      code: 'UD-VAULT25',
      expiry: 'SINGLE USE // VIP EXCLUSIVE'
    },
    {
      id: 'v-early24',
      title: '24H EARLY ACCESS PASS',
      subtitle: 'Unlock private checkout 24 hours before public drop',
      cost: 1500,
      code: 'UD-EARLY24',
      expiry: 'NEXT BATCH #047–#050'
    }
  ];

  const DEFAULT_LOYALTY_POINTS = 1250;
  const LOYALTY_GOAL = 2000;

  function initUserProfilePage() {
    const progressBar = document.getElementById('loyaltyProgressBar');
    const pointsTextEl = document.getElementById('loyaltyPointsText');
    const voucherGrid = document.getElementById('voucherCardsGrid');
    if (!progressBar && !pointsTextEl && !voucherGrid) return;

    const remainingTextEl = document.getElementById('loyaltyRemainingText');
    const percentBadgeEl = document.getElementById('loyaltyPercentBadge');
    const redeemedStatEl = document.getElementById('profileRedeemedCount');
    const wishlistStatEl = document.getElementById('profileWishlistCount');
    const bonusBtn = document.getElementById('claimBonusPointsBtn');
    const resetBtn = document.getElementById('resetLoyaltyBtn');
    const voucherRedeemBanner = document.getElementById('voucherRedeemBanner');
    const voucherRedeemSummary = document.getElementById('voucherRedeemSummary');

    function getPoints() {
      const raw = readStorage(STORAGE_KEYS.LOYALTY_POINTS);
      if (raw !== null) {
        const parsed = parseInt(raw, 10);
        if (Number.isFinite(parsed) && parsed >= 0) return parsed;
      }
      return DEFAULT_LOYALTY_POINTS;
    }

    function setPoints(pts) {
      const clamped = Math.max(0, pts);
      writeStorage(STORAGE_KEYS.LOYALTY_POINTS, String(clamped));
      return clamped;
    }

    function getRedeemedIds() {
      try {
        const raw = readStorage(STORAGE_KEYS.REDEEMED_VOUCHERS);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
      } catch (err) {
        return [];
      }
    }

    function saveRedeemedIds(ids) {
      writeStorage(STORAGE_KEYS.REDEEMED_VOUCHERS, JSON.stringify(ids));
    }

    function renderLoyaltySection() {
      const points = getPoints();
      const pct = Math.min(100, Math.round((points / LOYALTY_GOAL) * 1000) / 10);
      const remaining = Math.max(0, LOYALTY_GOAL - points);

      if (pointsTextEl) {
        pointsTextEl.textContent = points.toLocaleString() + ' / ' + LOYALTY_GOAL.toLocaleString() + ' pts';
      }
      if (progressBar) {
        progressBar.style.width = pct + '%';
        progressBar.setAttribute('aria-valuenow', String(points));
      }
      if (percentBadgeEl) {
        percentBadgeEl.textContent = pct + '% TO DIAMOND';
      }
      if (remainingTextEl) {
        remainingTextEl.textContent =
          remaining > 0
            ? remaining.toLocaleString() + ' pts away from Diamond Black Tier'
            : 'Diamond Black Tier Threshold Reached!';
      }

      const redeemedIds = getRedeemedIds();
      if (redeemedStatEl) {
        redeemedStatEl.textContent = String(redeemedIds.length);
      }
      if (wishlistStatEl) {
        wishlistStatEl.textContent = String(getWishlistItems().length);
      }
    }

    function renderVouchers() {
      if (!voucherGrid) return;
      const points = getPoints();
      const redeemedIds = getRedeemedIds();

      voucherGrid.innerHTML = VOUCHERS.map(function (voucher) {
        const isRedeemed = redeemedIds.indexOf(voucher.id) !== -1;
        const canAfford = points >= voucher.cost;

        let actionHtml = '';
        if (isRedeemed) {
          actionHtml =
            '<div class="ud-voucher-code-box d-flex align-items-center justify-content-between gap-2">' +
            '  <span>' + voucher.code + '</span>' +
            '  <button type="button" class="btn ud-btn-outline btn-sm py-1 px-2" data-copy-code="' + voucher.code + '">COPY</button>' +
            '</div>';
        } else if (canAfford) {
          actionHtml =
            '<button type="button" class="btn ud-btn-cta w-100" data-redeem-voucher="' + voucher.id + '">' +
            '  REDEEM (' + voucher.cost.toLocaleString() + ' PTS)' +
            '</button>';
        } else {
          const shortfall = voucher.cost - points;
          actionHtml =
            '<button type="button" class="btn ud-btn-cta w-100" disabled>' +
            '  NEED ' + shortfall.toLocaleString() + ' MORE PTS' +
            '</button>';
        }

        return (
          '<div class="col-12 col-md-6" data-searchable-card>' +
          '  <article class="ud-card ud-voucher-card p-4 h-100 d-flex flex-column ' + (isRedeemed ? 'is-redeemed' : '') + '">' +
          '    <div class="d-flex justify-content-between align-items-start gap-2 mb-3">' +
          '      <span class="ud-badge-pill ' + (isRedeemed ? 'ud-badge-volt' : 'ud-badge-cta') + '">' +
          (isRedeemed ? 'UNLOCKED' : voucher.cost.toLocaleString() + ' PTS') +
          '      </span>' +
          '      <span class="ud-mono small text-secondary">' + voucher.expiry + '</span>' +
          '    </div>' +
          '    <h3 class="h5 fw-bold text-white mb-2">' + voucher.title + '</h3>' +
          '    <p class="small text-secondary mb-4 flex-grow-1">' + voucher.subtitle + '</p>' +
          actionHtml +
          '  </article>' +
          '</div>'
        );
      }).join('');
    }

    if (voucherGrid) {
      voucherGrid.addEventListener('click', function (event) {
        const redeemBtn = event.target.closest('[data-redeem-voucher]');
        if (redeemBtn) {
          const voucherId = redeemBtn.getAttribute('data-redeem-voucher');
          const voucher = VOUCHERS.find(function (v) { return v.id === voucherId; });
          if (!voucher) return;

          const currentPoints = getPoints();
          if (currentPoints < voucher.cost) {
            showToast('Not enough points to redeem ' + voucher.title);
            return;
          }

          const redeemedIds = getRedeemedIds();
          if (redeemedIds.indexOf(voucher.id) === -1) {
            redeemedIds.push(voucher.id);
            saveRedeemedIds(redeemedIds);
            const updatedPoints = setPoints(currentPoints - voucher.cost);
            renderLoyaltySection();
            renderVouchers();
            if (voucherRedeemSummary) {
              voucherRedeemSummary.textContent =
                'Redeemed "' + voucher.title + '" (-' + voucher.cost.toLocaleString() + ' pts). Promo code ' +
                voucher.code + ' unlocked! Remaining balance: ' + updatedPoints.toLocaleString() + ' pts.';
            }
            if (voucherRedeemBanner) {
              voucherRedeemBanner.classList.remove('d-none');
            }
            showToast('Redeemed "' + voucher.title + '"! Code: ' + voucher.code, 'volt');
          }
          return;
        }

        const copyBtn = event.target.closest('[data-copy-code]');
        if (copyBtn) {
          const code = copyBtn.getAttribute('data-copy-code');
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(code).catch(function () {});
          }
          copyBtn.textContent = 'COPIED';
          window.setTimeout(function () {
            copyBtn.textContent = 'COPY';
          }, 1800);
          showToast('Promo code ' + code + ' copied to clipboard.');
        }
      });
    }

    if (bonusBtn) {
      bonusBtn.addEventListener('click', function () {
        const next = setPoints(getPoints() + 100);
        renderLoyaltySection();
        renderVouchers();
        showToast('+100 Loyalty Points added! Balance: ' + next.toLocaleString() + ' pts.', 'volt');
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        writeStorage(STORAGE_KEYS.LOYALTY_POINTS, String(DEFAULT_LOYALTY_POINTS));
        saveRedeemedIds([]);
        if (voucherRedeemBanner) {
          voucherRedeemBanner.classList.add('d-none');
        }
        renderLoyaltySection();
        renderVouchers();
        showToast('Loyalty progress reset to 1,250 / 2,000 pts.');
      });
    }

    renderLoyaltySection();
    renderVouchers();
  }

  /* ========================================================================
     6. WISHLIST PAGE (pages/wishlist.html)
     ======================================================================== */
  const DEFAULT_WISHLIST_ITEMS = [
    {
      id: 'wl-01',
      name: 'Cyber-Gorp Technical Anorak',
      category: 'OUTERWEAR',
      price: 145,
      size: 'L',
      stockStatus: 'IN STOCK',
      image: createStreetwearArtUri('ANORAK // WATERPROOF', '#CCFF00', 'jacket')
    },
    {
      id: 'wl-02',
      name: 'Heavyweight Boxy Drop Hoodie',
      category: 'TOPS',
      price: 88,
      size: 'M',
      stockStatus: 'LOW STOCK // 3 LEFT',
      image: createStreetwearArtUri('520 GSM // BOXY HOODIE', '#FF4D00', 'hoodie')
    },
    {
      id: 'wl-03',
      name: 'Parachute Utility Cargo Pant',
      category: 'BOTTOMS',
      price: 112,
      size: 'L',
      stockStatus: 'IN STOCK',
      image: createStreetwearArtUri('UTILITY // CARGO PANT', '#CCFF00', 'cargo')
    },
    {
      id: 'wl-04',
      name: 'Ballistic Nylon Crossbody Rig',
      category: 'ACCESSORIES',
      price: 64,
      size: 'ONE SIZE',
      stockStatus: 'IN STOCK',
      image: createStreetwearArtUri('1000D // CROSSBODY', '#FF4D00', 'bag')
    }
  ];

  function getWishlistItems() {
    try {
      const raw = readStorage(STORAGE_KEYS.WISHLIST);
      if (raw === null) {
        const seed = DEFAULT_WISHLIST_ITEMS.map(function (item) {
          return Object.assign({}, item);
        });
        writeStorage(STORAGE_KEYS.WISHLIST, JSON.stringify(seed));
        return seed;
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return DEFAULT_WISHLIST_ITEMS.map(function (item) {
        return Object.assign({}, item);
      });
    }
  }

  function saveWishlistItems(items) {
    writeStorage(STORAGE_KEYS.WISHLIST, JSON.stringify(items));
  }

  function initWishlistPage() {
    const wishlistGrid = document.getElementById('wishlistGrid');
    const emptyState = document.getElementById('wishlistEmptyState');
    const countEl = document.getElementById('wishlistTotalCount');
    const valueEl = document.getElementById('wishlistTotalValue');
    const moveAllBtn = document.getElementById('moveAllToCartBtn');
    const restoreBtn = document.getElementById('restoreWishlistBtn');

    if (!wishlistGrid) return;

    let wishlistItems = getWishlistItems();

    function renderWishlist() {
      const items = wishlistItems;
      const totalValue = items.reduce(function (sum, item) {
        return sum + (Number(item.price) || 0);
      }, 0);

      if (countEl) {
        countEl.textContent = items.length + (items.length === 1 ? ' SAVED ITEM' : ' SAVED ITEMS');
      }
      if (valueEl) {
        valueEl.textContent = '$' + totalValue.toLocaleString();
      }
      if (moveAllBtn) {
        moveAllBtn.disabled = items.length === 0;
      }

      if (items.length === 0) {
        wishlistGrid.innerHTML = '';
        if (emptyState) emptyState.classList.remove('d-none');
        return;
      }

      if (emptyState) emptyState.classList.add('d-none');

      wishlistGrid.innerHTML = items.map(function (item) {
        const isLow = (item.stockStatus || '').indexOf('LOW') !== -1;
        const sizeOptions = item.size === 'ONE SIZE'
          ? '<option value="ONE SIZE" selected>ONE SIZE</option>'
          : ['S', 'M', 'L', 'XL'].map(function (sz) {
              return '<option value="' + sz + '"' + (item.size === sz ? ' selected' : '') + '>' + sz + '</option>';
            }).join('');

        return (
          '<div class="col-12 col-md-6 col-xl-3" data-searchable-card>' +
          '  <article class="ud-card ud-card-interactive h-100 d-flex flex-column">' +
          '    <div class="ud-product-visual">' +
          '      <span class="ud-badge-pill ' + (isLow ? 'ud-badge-cta' : 'ud-badge-volt') + ' ud-visual-tag-tl">' +
          (item.stockStatus || 'IN STOCK') +
          '      </span>' +
          '      <button type="button" class="ud-remove-icon-btn ud-visual-tag-tr" data-remove-wish="' + item.id + '" aria-label="Remove ' + item.name + ' from wishlist">' +
          '        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">' +
          '          <line x1="18" y1="6" x2="6" y2="18"></line>' +
          '          <line x1="6" y1="6" x2="18" y2="18"></line>' +
          '        </svg>' +
          '      </button>' +
          '      <img src="' + item.image + '" alt="' + item.name + '">' +
          '    </div>' +
          '    <div class="p-3 p-lg-4 d-flex flex-column flex-grow-1">' +
          '      <div class="ud-mono small text-secondary mb-1">' + (item.category || 'STREETWEAR') + '</div>' +
          '      <h3 class="h5 fw-bold text-white mb-2">' + item.name + '</h3>' +
          '      <div class="d-flex align-items-center justify-content-between gap-2 mt-auto pt-2 mb-3">' +
          '        <span class="ud-mono fw-bold fs-4 text-white">$' + item.price + '</span>' +
          '        <div class="d-flex align-items-center gap-2">' +
          '          <label for="size-' + item.id + '" class="ud-mono small text-secondary mb-0">SIZE</label>' +
          '          <select id="size-' + item.id + '" class="form-select form-select-sm ud-form-select py-1 px-2" data-wish-size="' + item.id + '">' +
          sizeOptions +
          '          </select>' +
          '        </div>' +
          '      </div>' +
          '      <button type="button" class="btn ud-btn-cta w-100" data-move-to-cart="' + item.id + '">' +
          '        MOVE TO CART' +
          '      </button>' +
          '    </div>' +
          '  </article>' +
          '</div>'
        );
      }).join('');
    }

    wishlistGrid.addEventListener('change', function (event) {
      const sizeSelect = event.target.closest('[data-wish-size]');
      if (!sizeSelect) return;
      const itemId = sizeSelect.getAttribute('data-wish-size');
      const target = wishlistItems.find(function (i) { return i.id === itemId; });
      if (target) {
        target.size = sizeSelect.value;
        saveWishlistItems(wishlistItems);
      }
    });

    wishlistGrid.addEventListener('click', function (event) {
      const moveBtn = event.target.closest('[data-move-to-cart]');
      if (moveBtn) {
        const itemId = moveBtn.getAttribute('data-move-to-cart');
        const index = wishlistItems.findIndex(function (i) { return i.id === itemId; });
        if (index === -1) return;

        const item = Object.assign({}, wishlistItems[index]);
        const sizeSelect = wishlistGrid.querySelector('[data-wish-size="' + itemId + '"]');
        if (sizeSelect) {
          item.size = sizeSelect.value;
        }

        // Remove from wishlist array & sync localStorage
        wishlistItems.splice(index, 1);
        saveWishlistItems(wishlistItems);

        // Push into localStorage cart array & update header navbar cart badge in real-time
        addItemToCartStorage(item);

        renderWishlist();
        showToast('Item Moved to Cart!', 'volt');
        return;
      }

      const removeBtn = event.target.closest('[data-remove-wish]');
      if (removeBtn) {
        const itemId = removeBtn.getAttribute('data-remove-wish');
        const target = wishlistItems.find(function (i) { return i.id === itemId; });
        wishlistItems = wishlistItems.filter(function (i) { return i.id !== itemId; });
        saveWishlistItems(wishlistItems);
        renderWishlist();
        if (target) {
          showToast('Removed "' + target.name + '" from Wishlist.');
        }
      }
    });

    if (moveAllBtn) {
      moveAllBtn.addEventListener('click', function () {
        if (!wishlistItems.length) return;
        const movedCount = wishlistItems.length;

        wishlistItems.forEach(function (item) {
          addItemToCartStorage(Object.assign({}, item));
        });
        wishlistItems = [];
        saveWishlistItems(wishlistItems);
        renderWishlist();
        showToast(movedCount === 1 ? 'Item Moved to Cart!' : 'All ' + movedCount + ' Items Moved to Cart!', 'volt');
      });
    }

    if (restoreBtn) {
      restoreBtn.addEventListener('click', function () {
        wishlistItems = DEFAULT_WISHLIST_ITEMS.map(function (item) {
          return Object.assign({}, item);
        });
        saveWishlistItems(wishlistItems);
        renderWishlist();
        showToast('Sample wishlist items restored.');
      });
    }

    window.addEventListener('storage', function (event) {
      if (event.key === STORAGE_KEYS.WISHLIST) {
        wishlistItems = getWishlistItems();
        renderWishlist();
      }
    });

    renderWishlist();
  }

  /* ========================================================================
     7. BOOTSTRAP INITIALIZATION
     ======================================================================== */
  document.addEventListener('DOMContentLoaded', function () {
    initCartBadge();
    initNavbarSearch();
    initLimitedDropsPage();
    initUserProfilePage();
    initWishlistPage();
  });
})();

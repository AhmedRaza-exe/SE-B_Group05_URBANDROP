/* ==========================================================================
   URBANDROPS — Shared Header/Footer Utilities (Theme Toggle, Active Nav, Fallback Search/Cart)
   ========================================================================== */
(function () {
  'use strict';

  const THEME_KEY = 'udTheme';

  function applyTheme(theme) {
    const isLight = theme === 'light';
    document.documentElement.setAttribute('data-theme', isLight ? 'light' : 'dark');
    document.documentElement.setAttribute('data-bs-theme', isLight ? 'light' : 'dark');
    const btn = document.getElementById('udThemeToggle');
    if (btn) {
      const icon = btn.querySelector('.ud-theme-icon');
      if (icon) icon.textContent = isLight ? '🌙' : '☀️';
      btn.setAttribute('aria-label', isLight ? 'Switch to dark mode' : 'Switch to light mode');
      btn.setAttribute('title', isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode');
    }
  }

  // Apply saved theme immediately
  const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
  applyTheme(savedTheme);

  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(localStorage.getItem(THEME_KEY) || 'dark');

    // Theme toggle click
    const themeBtn = document.getElementById('udThemeToggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
        const next = current === 'light' ? 'dark' : 'light';
        localStorage.setItem(THEME_KEY, next);
        applyTheme(next);
      });
    }

    // Highlight active nav link / dropdown item based on current page
    const path = window.location.pathname.replace(/\\/g, '/').toLowerCase();
    const fileName = path.split('/').pop() || 'index.html';

    document.querySelectorAll('.ud-navbar .dropdown-item').forEach((item) => {
      const href = (item.getAttribute('href') || '').toLowerCase();
      const targetFile = href.split('/').pop();
      if (targetFile && targetFile === fileName) {
        item.classList.add('active');
        item.setAttribute('aria-current', 'page');
        const parentDropdown = item.closest('.nav-item.dropdown');
        const toggle = parentDropdown ? parentDropdown.querySelector('.ud-nav-link') : null;
        if (toggle) toggle.classList.add('active');
      }
    });

    // Fallback cart button behavior on pages without main.js's offcanvas drawer
    document.querySelectorAll('[data-open-cart]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!document.getElementById('udCartOffcanvas')) {
          const isPagesDir = path.includes('/pages/');
          window.location.href = isPagesDir ? 'cart-checkout.html' : 'pages/cart-checkout.html';
        }
      });
    });

    // Fallback navbar search on pages that don't load main.js / support.js / drops-member.js
    const searchInput = document.getElementById('navbarSearchInput');
    const resultsBox = document.getElementById('navbarSearchResults');
    const searchForm = document.getElementById('navbarSearchForm');
    if (searchInput && resultsBox && !searchInput.dataset.udSearchBound) {
      const isPagesDir = path.includes('/pages/');
      const prefix = isPagesDir ? '' : 'pages/';
      const quickItems = [
        { title: "Men's Catalog", subtitle: 'Shop • Drop 04 Outerwear & Fleece', url: prefix + 'mens-catalog.html' },
        { title: "Women's Catalog", subtitle: 'Shop • Technical & Cropped Fits', url: prefix + 'womens-catalog.html' },
        { title: 'Limited Drops', subtitle: 'Drops • Numbered 001–100 Releases', url: prefix + 'limited-drops.html' },
        { title: 'Drop 04 Lookbook', subtitle: 'Editorial • Full Styled Outfits', url: prefix + 'lookbook.html' },
        { title: 'Store Locator', subtitle: 'Stores • Tokyo, London, Berlin, PK', url: prefix + 'store-locator.html' },
        { title: 'FAQ & Policies', subtitle: 'Support • Shipping & Returns', url: prefix + 'faq.html' }
      ];

      const renderFallback = (q) => {
        const term = q.trim().toLowerCase();
        if (!term) {
          resultsBox.classList.remove('show');
          resultsBox.innerHTML = '';
          return;
        }
        const matches = quickItems.filter(
          (i) => i.title.toLowerCase().includes(term) || i.subtitle.toLowerCase().includes(term)
        );
        if (matches.length === 0) {
          resultsBox.innerHTML = '<div class="p-3 font-mono-tech small text-ud-muted">No matching drops or pages.</div>';
        } else {
          resultsBox.innerHTML = matches
            .map(
              (m) => `
              <a href="${m.url}" class="ud-search-result-item">
                <div class="min-w-0">
                  <div class="small fw-bold text-truncate">${m.title}</div>
                  <div class="font-mono-tech text-ud-muted text-truncate" style="font-size:0.68rem;">${m.subtitle}</div>
                </div>
              </a>`
            )
            .join('');
        }
        resultsBox.classList.add('show');
      };

      // Only bind if no other script populated results on input
      searchInput.addEventListener('input', () => {
        setTimeout(() => {
          if (!resultsBox.innerHTML && searchInput.value.trim()) {
            renderFallback(searchInput.value);
          } else if (!searchInput.value.trim()) {
            resultsBox.classList.remove('show');
          }
        }, 0);
      });

      if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
          e.preventDefault();
          if (!resultsBox.innerHTML && searchInput.value.trim()) {
            renderFallback(searchInput.value);
          }
        });
      }

      document.addEventListener('click', (e) => {
        if (!resultsBox.contains(e.target) && e.target !== searchInput) {
          resultsBox.classList.remove('show');
        }
      });
    }
  });
})();

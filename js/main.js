/**
 * URBANDROPS Shared Cart & UI Utilities
 */
const URBANDROPS = (() => {
  const CART_KEY = 'cartCount';

  function getCartCount() {
    const raw = localStorage.getItem(CART_KEY);
    const parsed = parseInt(raw, 10);
    return Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;
  }

  function setCartCount(count) {
    const safeCount = Math.max(0, parseInt(count, 10) || 0);
    localStorage.setItem(CART_KEY, String(safeCount));
    renderCartBadge();
    return safeCount;
  }

  function addToCart(quantity = 1) {
    const current = getCartCount();
    const added = Math.max(1, parseInt(quantity, 10) || 1);
    return setCartCount(current + added);
  }

  function renderCartBadge() {
    const badge = document.getElementById('cartBadge');
    if (badge) {
      badge.textContent = String(getCartCount());
    }
  }

  /**
   * Generates a crisp streetwear SVG placeholder data URI so catalog cards
   * and product views render cleanly offline without external image dependencies.
   */
  function createApparelSvg(label, tag, accentHex = '#CCFF00', variant = 'hoodie') {
    const iconPaths = {
      hoodie:
        '<path d="M95 70 L125 48 L175 48 L205 70 L235 125 L205 140 L195 110 L195 225 L105 225 L105 110 L95 140 L65 125 Z" fill="#1F1F1F" stroke="' +
        accentHex +
        '" stroke-width="3"/><path d="M132 48 Q150 75 168 48" fill="none" stroke="' +
        accentHex +
        '" stroke-width="3"/><rect x="122" y="150" width="56" height="36" rx="6" fill="#141414" stroke="#3A3A3A" stroke-width="2"/>',
      tee:
        '<path d="M90 72 L125 52 L175 52 L210 72 L240 112 L212 132 L195 110 L195 225 L105 225 L105 110 L88 132 L60 112 Z" fill="#1F1F1F" stroke="' +
        accentHex +
        '" stroke-width="3"/><rect x="120" y="102" width="60" height="58" rx="4" fill="#141414" stroke="' +
        accentHex +
        '" stroke-width="2"/>',
      cargo:
        '<path d="M105 55 L195 55 L205 225 L165 225 L150 130 L135 225 L95 225 Z" fill="#1F1F1F" stroke="' +
        accentHex +
        '" stroke-width="3"/><rect x="92" y="128" width="24" height="38" rx="3" fill="#141414" stroke="' +
        accentHex +
        '" stroke-width="2"/><rect x="184" y="128" width="24" height="38" rx="3" fill="#141414" stroke="' +
        accentHex +
        '" stroke-width="2"/>'
    };

    const graphic = iconPaths[variant] || iconPaths.hoodie;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 280" width="300" height="280">
      <rect width="300" height="280" fill="#121212"/>
      <circle cx="150" cy="140" r="95" fill="none" stroke="#242424" stroke-dasharray="6 6" stroke-width="1.5"/>
      ${graphic}
      <text x="16" y="28" fill="${accentHex}" font-family="Arial, sans-serif" font-size="11" font-weight="700" letter-spacing="2">${tag}</text>
      <text x="150" y="258" text-anchor="middle" fill="#A3A3A3" font-family="Arial, sans-serif" font-size="12" font-weight="700" letter-spacing="1.5">${label}</text>
    </svg>`;

    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  }

  document.addEventListener('DOMContentLoaded', renderCartBadge);
  window.addEventListener('storage', (event) => {
    if (event.key === CART_KEY) {
      renderCartBadge();
    }
  });

  return {
    getCartCount,
    setCartCount,
    addToCart,
    renderCartBadge,
    createApparelSvg
  };
})();

import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProductSection from './productSection.jsx';
import { BrowserRouter } from 'react-router-dom';
import { CartProvider } from './cartContext.jsx';
import { CurrencyProvider } from './currencyContext.jsx';

// mock useProducts hook
const mockUseProducts = vi.fn();
vi.mock('./useProducts.jsx', () => ({
  default: () => mockUseProducts(),
}));

// simple helper to set viewport width
function setViewport(width) {
  // eslint-disable-next-line no-undef
  global.innerWidth = width;
  window.dispatchEvent(new Event('resize'));
}

describe('ProductSection mobile layout', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('applies centering padding on mobile when multiple cards exist', () => {
    setViewport(375);
    // return three products in the same category
    mockUseProducts.mockReturnValue({
      products: [
        { _id: 'a', category: 'T-Shirts', name: 'A', slug: 'a' },
        { _id: 'b', category: 'T-Shirts', name: 'B', slug: 'b' },
        { _id: 'c', category: 'T-Shirts', name: 'C', slug: 'c' },
      ],
      loading: false,
      error: null
    });

    const { container } = render(
      <CurrencyProvider>
        <CartProvider>
          <BrowserRouter>
            <ProductSection title="T-Shirts" />
          </BrowserRouter>
        </CartProvider>
      </CurrencyProvider>
    );
    const scrollDiv = container.querySelector('div.flex.overflow-x-auto');
    expect(scrollDiv).toBeTruthy();
    expect(scrollDiv.className).toContain('snap-x');
    expect(scrollDiv.className).toContain('px-[10vw]');

    // ensure each card includes mx-auto so left/right margins are equal
    const cards = container.querySelectorAll('.carousel-item');
    expect(cards.length).toBe(3);
    cards.forEach(card => {
      expect(card.className).toMatch(/mx-auto/);
    });
  });

  it('hides feather overlays on mobile', () => {
    setViewport(375);
    mockUseProducts.mockReturnValue({
      products: [{ _id: 'only', category: 'T-Shirts', name: 'Only', slug: 'only' }],
      loading: false,
      error: null
    });
    const { container } = render(
      <CurrencyProvider>
        <CartProvider>
          <BrowserRouter>
            <ProductSection title="T-Shirts" />
          </BrowserRouter>
        </CartProvider>
      </CurrencyProvider>
    );
    // overlays have gradient classes
    const overlays = container.querySelectorAll('div.bg-gradient-to-r, div.bg-gradient-to-l');
    overlays.forEach(el => {
      expect(el.className).toMatch(/hidden/);
    });
  });
});

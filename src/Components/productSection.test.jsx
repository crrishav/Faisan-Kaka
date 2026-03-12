import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProductSection from './productSection.jsx';

// mock useProducts hook
const mockUseProducts = vi.fn();
vi.mock('./useProducts.jsx', () => ({
  default: () => mockUseProducts(),
}));

// simple helper to set viewport width
function setViewport(width) {
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
    mockUseProducts.mockReturnValue([
      { category: 'T-Shirts', name: 'A', slug: 'a' },
      { category: 'T-Shirts', name: 'B', slug: 'b' },
      { category: 'T-Shirts', name: 'C', slug: 'c' },
    ]);

    const { container } = render(<ProductSection title="T-Shirts" />);
    const scrollDiv = container.querySelector('div.flex.overflow-x-auto');
    expect(scrollDiv).toBeTruthy();
    // simulate measurable width so the centering effect runs
    Object.defineProperty(scrollDiv, 'scrollWidth', { value: 1000, configurable: true });
    window.dispatchEvent(new Event('resize'));
    expect(scrollDiv.style.transform).toMatch(/translateX\(/);

    // ensure each card includes mx-auto so left/right margins are equal
    const cards = container.querySelectorAll('div.w-64');
    expect(cards.length).toBe(3);
    cards.forEach(card => {
      expect(card.className).toMatch(/mx-auto/);
    });
  });

  it('hides feather overlays on mobile', () => {
    setViewport(375);
    mockUseProducts.mockReturnValue([{ category: 'T-Shirts', name: 'Only', slug: 'only' }]);
    const { container } = render(<ProductSection title="T-Shirts" />);
    // overlays have gradient classes
    const overlays = container.querySelectorAll('div.bg-gradient-to-r, div.bg-gradient-to-l');
    overlays.forEach(el => {
      expect(el.className).toMatch(/hidden/);
    });
  });
});

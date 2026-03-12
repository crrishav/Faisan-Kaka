import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NavBar from './navBar';
import { BrowserRouter } from 'react-router-dom';

// Mock useCart hook
const mockUseCart = vi.fn();
vi.mock('./useCart.jsx', () => ({
  default: () => mockUseCart(),
}));

// Mock logo image
vi.mock('../assets/logo.png', () => ({ default: 'logo.png' }));

// Mock import.meta.glob
vi.mock('import.meta.glob', () => ({
  default: () => ({}),
}));

describe('NavBar Cart Dropdown Height', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Mock offsetHeight on HTMLElement prototype with a getter/setter
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      get() {
        return this._offsetHeight || 100; // Default 100
      },
      set(v) {
        this._offsetHeight = v;
      }
    });
  });

  it('updates container height when items are removed', async () => {
    // Setup initial state with 2 items
    mockUseCart.mockReturnValue({
      items: [
        { id: '1', title: 'Item 1', priceINR: 100, quantity: 1 },
        { id: '2', title: 'Item 2', priceINR: 200, quantity: 1 },
      ],
      currency: 'INR',
      total: 300,
      updateQuantity: vi.fn(),
      removeItem: vi.fn(),
    });

    const { rerender, container } = render(
      <BrowserRouter>
        <NavBar />
      </BrowserRouter>
    );

    // Find the cart trigger area
    const cartText = screen.getByText('Cart');
    const cartMenuTrigger = cartText.closest('div'); 
    
    // Find container and children to set heights
    const navContainer = container.querySelector('div[style*="height"]');
    const header = navContainer.firstChild;
    const content = navContainer.lastChild;
    
    // Set heights using our custom setter
    header._offsetHeight = 80;
    content._offsetHeight = 200;

    // Simulate opening cart menu
    fireEvent.mouseEnter(cartMenuTrigger);
    
    // Check height. Base 80 + Target 200 = 280.
    await waitFor(() => {
        expect(navContainer.style.height).toBe('280px');
    });
    
    // Now simulate removing an item
    mockUseCart.mockReturnValue({
      items: [
        { id: '1', title: 'Item 1', priceINR: 100, quantity: 1 },
      ],
      currency: 'INR',
      total: 100,
      updateQuantity: vi.fn(),
      removeItem: vi.fn(),
    });

    // Mock content height changing to 150
    content._offsetHeight = 150;

    // Trigger re-render with new cart items
    rerender(
      <BrowserRouter>
        <NavBar />
      </BrowserRouter>
    );

    // Height should update to 80 + 150 = 230.
    await waitFor(() => {
        expect(navContainer.style.height).toBe('230px');
    });
  });

  it('remains fixed at top on mobile even after scrolling', () => {
    // simulate mobile viewport
    global.innerWidth = 375;
    window.dispatchEvent(new Event('resize'));

    mockUseCart.mockReturnValue({ items: [], currency: 'INR', total: 0, updateQuantity: vi.fn(), removeItem: vi.fn() });
    const { container } = render(
      <BrowserRouter>
        <NavBar />
      </BrowserRouter>
    );
    const nav = container.querySelector('nav');
    expect(nav).toBeTruthy();
    // initial top should be 0 (tailwind top-0)
    expect(nav.style.top || getComputedStyle(nav).top).toBe('0px');

    // simulate scroll event
    window.scrollY = 100;
    fireEvent.scroll(window);
    expect(nav.style.top || getComputedStyle(nav).top).toBe('0px');
  });
});

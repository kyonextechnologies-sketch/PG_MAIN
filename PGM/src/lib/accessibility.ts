/**
 * Accessibility utilities for better a11y support
 */

/**
 * Generate unique ID for form elements
 */
export function useId(prefix = 'id'): string {
  if (typeof window !== 'undefined') {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }
  return prefix;
}

/**
 * ARIA live region for announcements
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  if (typeof window === 'undefined') return;

  const liveRegion = document.getElementById('a11y-live-region') || createLiveRegion();
  liveRegion.setAttribute('aria-live', priority);
  liveRegion.textContent = message;

  // Clear after announcement
  setTimeout(() => {
    liveRegion.textContent = '';
  }, 1000);
}

function createLiveRegion(): HTMLElement {
  const region = document.createElement('div');
  region.id = 'a11y-live-region';
  region.setAttribute('aria-live', 'polite');
  region.setAttribute('aria-atomic', 'true');
  region.className = 'sr-only';
  document.body.appendChild(region);
  return region;
}

/**
 * Keyboard navigation helpers
 */
export function handleKeyboardNavigation(
  event: React.KeyboardEvent,
  handlers: {
    onEnter?: () => void;
    onEscape?: () => void;
    onArrowUp?: () => void;
    onArrowDown?: () => void;
    onArrowLeft?: () => void;
    onArrowRight?: () => void;
  }
) {
  switch (event.key) {
    case 'Enter':
    case ' ':
      handlers.onEnter?.();
      break;
    case 'Escape':
      handlers.onEscape?.();
      break;
    case 'ArrowUp':
      handlers.onArrowUp?.();
      break;
    case 'ArrowDown':
      handlers.onArrowDown?.();
      break;
    case 'ArrowLeft':
      handlers.onArrowLeft?.();
      break;
    case 'ArrowRight':
      handlers.onArrowRight?.();
      break;
  }
}

/**
 * Focus trap for modals
 */
export function trapFocus(element: HTMLElement) {
  const focusableElements = element.querySelectorAll(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  const handleTab = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  };

  element.addEventListener('keydown', handleTab);
  firstElement?.focus();

  return () => {
    element.removeEventListener('keydown', handleTab);
  };
}


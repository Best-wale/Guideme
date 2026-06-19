export interface HighlightOptions {
  duration?: number;
  color?: 'yellow' | 'blue' | 'green';
  scrollIntoView?: boolean;
}

const DEFAULT_HIGHLIGHT_DURATION = 3000;
const HIGHLIGHT_COLORS = {
  yellow: '#fbbf24',
  blue: '#60a5fa',
  green: '#34d399',
};

export function highlightElement(element: HTMLElement, options: HighlightOptions = {}): Promise<void> {
  const {
    duration = DEFAULT_HIGHLIGHT_DURATION,
    color = 'yellow',
    scrollIntoView = true,
  } = options;

  return new Promise((resolve) => {
    // Scroll into view if requested
    if (scrollIntoView) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Create overlay highlight
    const highlightOverlay = document.createElement('div');
    highlightOverlay.style.cssText = `
      position: fixed;
      pointer-events: none;
      border: 3px solid ${HIGHLIGHT_COLORS[color]};
      border-radius: 8px;
      box-shadow: 0 0 20px ${HIGHLIGHT_COLORS[color]}, inset 0 0 20px ${HIGHLIGHT_COLORS[color]}22;
      z-index: 2147483647;
      animation: pulse-highlight 1.5s ease-in-out infinite;
    `;

    // Add animation keyframes
    if (!document.getElementById('highlight-animation-style')) {
      const style = document.createElement('style');
      style.id = 'highlight-animation-style';
      style.textContent = `
        @keyframes pulse-highlight {
          0%, 100% {
            box-shadow: 0 0 20px ${HIGHLIGHT_COLORS[color]}, inset 0 0 20px ${HIGHLIGHT_COLORS[color]}22;
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 30px ${HIGHLIGHT_COLORS[color]}, inset 0 0 30px ${HIGHLIGHT_COLORS[color]}33;
            transform: scale(1.05);
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Position overlay
    const rect = element.getBoundingClientRect();
    highlightOverlay.style.top = `${window.scrollY + rect.top}px`;
    highlightOverlay.style.left = `${window.scrollX + rect.left}px`;
    highlightOverlay.style.width = `${rect.width}px`;
    highlightOverlay.style.height = `${rect.height}px`;

    document.body.appendChild(highlightOverlay);

    // Remove after duration
    setTimeout(() => {
      highlightOverlay.remove();
      resolve();
    }, duration);
  });
}

export function findElementByText(text: string): HTMLElement | null {
  const allElements = document.querySelectorAll('*');
  for (const el of allElements) {
    if (el.textContent?.includes(text)) {
      return el as HTMLElement;
    }
  }
  return null;
}

export function findElementBySelector(selector: string): HTMLElement | null {
  try {
    return document.querySelector(selector) as HTMLElement | null;
  } catch {
    return null;
  }
}

export async function smoothScrollToElement(element: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(resolve, 1000); // Wait for scroll animation
  });
}

export function createStepOverlay(stepNumber: number, instruction: string): HTMLElement {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 24px;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    z-index: 2147483646;
    max-width: 400px;
    text-align: center;
  `;

  overlay.innerHTML = `
    <div style="font-size: 24px; font-weight: bold; color: #60a5fa; margin-bottom: 12px;">
      Step ${stepNumber}
    </div>
    <div style="font-size: 16px; color: #333; line-height: 1.5;">
      ${instruction}
    </div>
  `;

  return overlay;
}

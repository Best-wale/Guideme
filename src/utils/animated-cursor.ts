export interface CursorAnimationOptions {
  duration?: number;
  element?: HTMLElement;
  color?: string;
}

const DEFAULT_CURSOR_DURATION = 2000;

export function animateCursorToElement(
  targetElement: HTMLElement,
  options: CursorAnimationOptions = {}
): Promise<void> {
  const {
    duration = DEFAULT_CURSOR_DURATION,
    color = '#60a5fa',
  } = options;

  return new Promise((resolve) => {
    // Create cursor SVG
    const cursorSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    cursorSvg.setAttribute('viewBox', '0 0 24 24');
    cursorSvg.setAttribute('width', '32');
    cursorSvg.setAttribute('height', '32');
    cursorSvg.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 2147483648;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
    `;

    // Create cursor path
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M3 3l7.07 18.41a.5.5 0 0 0 .95-.01L21 3H3z');
    path.setAttribute('fill', color);
    cursorSvg.appendChild(path);

    document.body.appendChild(cursorSvg);

    // Get positions
    const startX = window.innerWidth / 2;
    const startY = window.innerHeight / 2;

    const targetRect = targetElement.getBoundingClientRect();
    const endX = targetRect.left + targetRect.width / 2;
    const endY = targetRect.top + targetRect.height / 2;

    // Animate
    const startTime = Date.now();
    let animationId: number;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-in-out)
      const easeProgress = progress < 0.5
        ? 2 * progress * progress
        : -1 + (4 - 2 * progress) * progress;

      const currentX = startX + (endX - startX) * easeProgress;
      const currentY = startY + (endY - startY) * easeProgress;

      cursorSvg.style.left = `${currentX}px`;
      cursorSvg.style.top = `${currentY}px`;

      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      } else {
        cursorSvg.remove();
        resolve();
      }
    };

    animate();
  });
}

export function createPulseAnimation(element: HTMLElement, color: string = '#60a5fa'): () => void {
  const originalBoxShadow = element.style.boxShadow;
  const originalTransform = element.style.transform;

  const animate = () => {
    element.style.boxShadow = `0 0 20px ${color}`;
    element.style.transform = 'scale(1.05)';

    setTimeout(() => {
      element.style.boxShadow = originalBoxShadow;
      element.style.transform = originalTransform;
    }, 300);
  };

  animate();

  // Return function to cancel animation if needed
  return () => {
    element.style.boxShadow = originalBoxShadow;
    element.style.transform = originalTransform;
  };
}

export async function animateClick(element: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    element.click();
    element.style.opacity = '0.7';

    setTimeout(() => {
      element.style.opacity = '1';
      resolve();
    }, 200);
  });
}

export async function animateInput(element: HTMLInputElement, text: string): Promise<void> {
  return new Promise((resolve) => {
    element.focus();
    
    // Simulate typing animation
    let index = 0;
    const typeInterval = setInterval(() => {
      if (index < text.length) {
        element.value += text[index];
        index++;
      } else {
        clearInterval(typeInterval);
        resolve();
      }
    }, 50);
  });
}

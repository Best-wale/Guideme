import type { PageContext } from '../types';

export function extractPageContext(): PageContext {
  const headings: string[] = [];
  const buttons: Array<{ text: string; selector?: string }> = [];
  const formInputs: Array<{ label: string; type: string; name?: string }> = [];

  // Extract headings
  document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((el) => {
    const text = el.textContent?.trim();
    if (text && text.length > 0 && text.length < 200) {
      headings.push(text);
    }
  });

  // Extract buttons
  document.querySelectorAll('button, a[role="button"], input[type="button"], input[type="submit"]').forEach((el) => {
    const text = (el.textContent || el.getAttribute('aria-label') || '')?.trim();
    if (text && text.length > 0 && text.length < 100) {
      buttons.push({
        text,
        selector: el.id || el.className || undefined,
      });
    }
  });

  // Extract form inputs
  document.querySelectorAll('input, textarea, select').forEach((el) => {
    const label = (el.getAttribute('aria-label') || el.getAttribute('placeholder') || '')?.trim();
    const type = el.getAttribute('type') || el.tagName.toLowerCase();
    if (label && label.length > 0) {
      formInputs.push({
        label,
        type,
        name: el.getAttribute('name') || undefined,
      });
    }
  });

  // Extract visible text (limit to ~1000 chars)
  const visibleText = document.body.innerText.substring(0, 1000);

  return {
    title: document.title,
    url: window.location.href,
    headings: headings.slice(0, 20), // Limit to 20 headings
    buttons: buttons.slice(0, 15), // Limit to 15 buttons
    formInputs: formInputs.slice(0, 10), // Limit to 10 form inputs
    visibleText,
    timestamp: Date.now(),
  };
}

export function sanitizePageContext(context: PageContext): PageContext {
  return {
    ...context,
    visibleText: context.visibleText.substring(0, 1000),
    headings: context.headings.slice(0, 20),
    buttons: context.buttons.slice(0, 15),
    formInputs: context.formInputs.slice(0, 10),
  };
}

export function getElementBySelectorHint(hint: string): HTMLElement | null {
  try {
    // Try to find by exact text content first
    const allElements = document.querySelectorAll('*');
    for (const el of allElements) {
      if (el.textContent?.includes(hint)) {
        return el as HTMLElement;
      }
    }

    // Try as CSS selector
    return document.querySelector(hint) as HTMLElement | null;
  } catch {
    return null;
  }
}

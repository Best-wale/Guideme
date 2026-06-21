import { defineBackground } from 'wxt/utils/define-background';

const API_URL = 'http://localhost:3000/api';

interface ChatRequest {
  message: string;
  pageContext: {
    title: string;
    url: string;
    headings: string[];
    buttons: Array<{ text: string }>;
    formInputs: Array<{ label: string; type: string }>;
    visibleText: string;
  };
}

interface ChatResponse {
  response: string;
  steps: Array<{
    instruction: string;
    targetText: string;
    action: string;
    selectorHint: string;
  }>;
}

export default defineBackground(() => {
  // Listen for messages from content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'CHAT_REQUEST') {
      handleChatRequest(message.payload, sendResponse);
      return true; // Indicate we'll respond asynchronously
    }
  });

  console.log('[AI Site Guide] Background service worker initialized');
});

async function handleChatRequest(payload: ChatRequest, sendResponse: (response: any) => void) {
  try {
    const response = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: payload.message,
        pageUrl: payload.pageContext.url,
        pageContext: {
          title: payload.pageContext.title,
          headings: payload.pageContext.headings,
          buttons: payload.pageContext.buttons.map(b => b.text),
          formInputs: payload.pageContext.formInputs,
          visibleText: payload.pageContext.visibleText.substring(0, 500),
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data: ChatResponse = await response.json();
    sendResponse(data);
  } catch (error) {
    console.error('[AI Site Guide] Chat request error:', error);
    sendResponse({
      response: 'I apologize, but I encountered an error processing your request. Please ensure the backend API is running.',
      steps: [],
    });
  }
}

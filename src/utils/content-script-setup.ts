import type { ContentScriptContext } from 'wxt/client';
import { extractPageContext } from '../utils/page-context';
import { sendMessageToBackground, listenToMessages, getChromeStorageData, setChromeStorageData, generateSessionId, MESSAGE_TYPES } from '../utils/messaging';

let chatBubbleContainer: HTMLElement | null = null;
let shadowRoot: ShadowRoot | null = null;

export async function setupContentScript(ctx: ContentScriptContext) {
  // Initialize session if not exists
  const storage = await getChromeStorageData(['sessionId']);
  if (!storage.sessionId) {
    await setChromeStorageData({ sessionId: generateSessionId() });
  }

  // Listen for messages from background
  listenToMessages((message, sender, sendResponse) => {
    handleContentMessage(message, sendResponse);
  });

  // Create chat bubble container with Shadow DOM
  createChatBubbleContainer();

  // Keyboard shortcut listener
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'G') {
      e.preventDefault();
      toggleChatBubble();
    }
  });
}

function createChatBubbleContainer() {
  if (chatBubbleContainer) return;

  // Create container
  chatBubbleContainer = document.createElement('div');
  chatBubbleContainer.id = 'ai-site-guide-container';
  document.documentElement.appendChild(chatBubbleContainer);

  // Create Shadow DOM
  shadowRoot = chatBubbleContainer.attachShadow({ mode: 'open' });

  // Add styles
  const style = document.createElement('style');
  style.textContent = getExtensionStyles();
  shadowRoot.appendChild(style);

  // Create main container div
  const mainDiv = document.createElement('div');
  mainDiv.id = 'ai-chat-bubble-main';
  mainDiv.innerHTML = `
    <div class="ai-chat-bubble-container">
      <button class="ai-chat-bubble" id="chat-bubble-toggle" title="AI Site Guide (Ctrl+Shift+G)">
        💬
      </button>
      <div class="ai-chat-window" id="chat-window" style="display: none;">
        <div class="ai-chat-header">
          <span class="ai-chat-title">AI Site Guide</span>
          <button class="ai-chat-close" id="chat-close">✕</button>
        </div>
        <div class="ai-messages-container" id="messages-container"></div>
        <div class="ai-input-container">
          <button class="ai-voice-btn" id="voice-input-btn" title="Voice input (Ctrl+Shift+V)">🎤</button>
          <textarea class="ai-input" id="chat-input" placeholder="Ask me for help..." rows="1"></textarea>
          <button class="ai-send-btn" id="send-btn">Send</button>
        </div>
      </div>
    </div>
  `;
  shadowRoot.appendChild(mainDiv);

  // Add event listeners
  const toggleBtn = shadowRoot.getElementById('chat-bubble-toggle');
  const closeBtn = shadowRoot.getElementById('chat-close');
  const sendBtn = shadowRoot.getElementById('send-btn');
  const voiceBtn = shadowRoot.getElementById('voice-input-btn');
  const chatInput = shadowRoot.getElementById('chat-input') as HTMLTextAreaElement;

  if (toggleBtn) toggleBtn.addEventListener('click', toggleChatBubble);
  if (closeBtn) closeBtn.addEventListener('click', () => toggleChatBubble(false));
  if (sendBtn) sendBtn.addEventListener('click', () => handleSendMessage(chatInput));
  if (voiceBtn) voiceBtn.addEventListener('click', () => handleVoiceInput(voiceBtn));
  if (chatInput) {
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage(chatInput);
      }
    });
  }
}

function toggleChatBubble(show?: boolean) {
  if (!shadowRoot) return;

  const chatWindow = shadowRoot.getElementById('chat-window') as HTMLDivElement;
  if (!chatWindow) return;

  const isVisible = chatWindow.style.display !== 'none';
  const shouldShow = show !== undefined ? show : !isVisible;

  chatWindow.style.display = shouldShow ? 'block' : 'none';

  if (shouldShow) {
    const chatInput = shadowRoot.getElementById('chat-input') as HTMLTextAreaElement;
    if (chatInput) chatInput.focus();
  }
}

async function handleSendMessage(input: HTMLTextAreaElement) {
  const message = input.value.trim();
  if (!message) return;

  const messagesContainer = shadowRoot?.getElementById('messages-container');
  if (!messagesContainer) return;

  // Add user message
  const userMessageDiv = document.createElement('div');
  userMessageDiv.className = 'ai-message user';
  userMessageDiv.innerHTML = `<div class="ai-message-content">${message}</div>`;
  messagesContainer.appendChild(userMessageDiv);

  // Clear input
  input.value = '';
  input.style.height = 'auto';

  // Show loading
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'ai-message assistant';
  loadingDiv.innerHTML = '<div class="ai-loading"><span></span><span></span><span></span></div>';
  messagesContainer.appendChild(loadingDiv);

  // Scroll to bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  try {
    // Get page context
    const pageContext = extractPageContext();

    // Send to background
    const response = await sendMessageToBackground({
      type: MESSAGE_TYPES.CHAT_REQUEST,
      payload: {
        message,
        pageContext,
      },
    });

    // Remove loading
    loadingDiv.remove();

    // Add assistant message
    if (response && response.response) {
      const assistantMessageDiv = document.createElement('div');
      assistantMessageDiv.className = 'ai-message assistant';
      assistantMessageDiv.innerHTML = `<div class="ai-message-content">${response.response}</div>`;
      messagesContainer.appendChild(assistantMessageDiv);

      // If there are steps, show visual guide
      if (response.steps && response.steps.length > 0) {
        showVisualGuide(response.steps);
      }
    }

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  } catch (error) {
    console.error('[AI Site Guide] Error:', error);
    loadingDiv.remove();

    const errorDiv = document.createElement('div');
    errorDiv.className = 'ai-message assistant';
    errorDiv.innerHTML = '<div class="ai-message-content">Sorry, I encountered an error. Please try again.</div>';
    messagesContainer.appendChild(errorDiv);
  }
}

async function handleVoiceInput(btn: Element) {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert('Voice input is not supported in your browser');
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';

  (btn as HTMLElement).classList.add('listening');

  recognition.onstart = () => {
    (btn as HTMLElement).classList.add('listening');
  };

  recognition.onend = () => {
    (btn as HTMLElement).classList.remove('listening');
  };

  recognition.onresult = (event: any) => {
    const transcript = Array.from(event.results)
      .map((result: any) => result[0].transcript)
      .join('');

    const chatInput = shadowRoot?.getElementById('chat-input') as HTMLTextAreaElement;
    if (chatInput) {
      chatInput.value = transcript;
      chatInput.focus();
    }
  };

  recognition.onerror = (event: any) => {
    console.error('[AI Site Guide] Voice input error:', event.error);
    (btn as HTMLElement).classList.remove('listening');
  };

  recognition.start();
}

async function showVisualGuide(steps: any[]) {
  const overlayDiv = document.createElement('div');
  overlayDiv.className = 'ai-visual-guide-overlay';
  overlayDiv.innerHTML = `
    <div class="ai-guide-step">
      <div class="ai-guide-step-number">1</div>
      <div class="ai-guide-step-instruction">${steps[0]?.instruction || ''}</div>
      <div class="ai-guide-button-group">
        <button class="ai-guide-next-btn">Next</button>
        <button class="ai-guide-skip-btn">Skip</button>
      </div>
    </div>
  `;

  shadowRoot?.appendChild(overlayDiv);

  let currentStep = 0;
  const nextBtn = overlayDiv.querySelector('.ai-guide-next-btn');
  const skipBtn = overlayDiv.querySelector('.ai-guide-skip-btn');

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      currentStep++;
      if (currentStep < steps.length) {
        const stepDiv = overlayDiv.querySelector('.ai-guide-step') as HTMLElement;
        if (stepDiv) {
          const numberDiv = stepDiv.querySelector('.ai-guide-step-number') as HTMLElement;
          const instructionDiv = stepDiv.querySelector('.ai-guide-step-instruction') as HTMLElement;
          numberDiv.textContent = String(currentStep + 1);
          instructionDiv.textContent = steps[currentStep].instruction;
        }
      } else {
        overlayDiv.remove();
      }
    });
  }

  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      overlayDiv.remove();
    });
  }
}

function handleContentMessage(message: any, sendResponse: (response?: any) => void) {
  if (message.type === MESSAGE_TYPES.GUIDANCE_STEP) {
    showVisualGuide([message.payload]);
    sendResponse({ success: true });
  }
}

function getExtensionStyles(): string {
  return `
    :host {
      --primary: #60a5fa;
      --primary-dark: #3b82f6;
      --secondary: #f0f9ff;
      --text: #1f2937;
      --text-light: #6b7280;
      --border: #e5e7eb;
      --success: #10b981;
      --warning: #fbbf24;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    .ai-chat-bubble-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 2147483640;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    }

    .ai-chat-bubble {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: all 0.3s ease;
      color: white;
      font-size: 24px;
    }

    .ai-chat-bubble:hover {
      transform: scale(1.1);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
    }

    .ai-chat-window {
      position: absolute;
      bottom: 80px;
      right: 0;
      width: 380px;
      max-height: 600px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
      display: flex;
      flex-direction: column;
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .ai-chat-header {
      padding: 16px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-radius: 16px 16px 0 0;
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
      color: white;
    }

    .ai-chat-title {
      font-weight: 600;
      font-size: 16px;
    }

    .ai-chat-close {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 20px;
      padding: 0;
    }

    .ai-messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .ai-message {
      display: flex;
      gap: 8px;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(5px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .ai-message.user {
      justify-content: flex-end;
    }

    .ai-message-content {
      max-width: 85%;
      padding: 12px 16px;
      border-radius: 12px;
      word-wrap: break-word;
      line-height: 1.5;
    }

    .ai-message.assistant .ai-message-content {
      background: var(--secondary);
      color: var(--text);
    }

    .ai-message.user .ai-message-content {
      background: var(--primary);
      color: white;
    }

    .ai-input-container {
      padding: 16px;
      border-top: 1px solid var(--border);
      display: flex;
      gap: 8px;
      align-items: flex-end;
    }

    .ai-input {
      flex: 1;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 14px;
      font-family: inherit;
      resize: none;
      max-height: 100px;
    }

    .ai-input:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
    }

    .ai-send-btn {
      background: var(--primary);
      color: white;
      border: none;
      border-radius: 8px;
      padding: 10px 16px;
      cursor: pointer;
      font-weight: 500;
    }

    .ai-send-btn:hover {
      background: var(--primary-dark);
    }

    .ai-voice-btn {
      background: none;
      border: 1px solid var(--primary);
      color: var(--primary);
      border-radius: 8px;
      padding: 10px 12px;
      cursor: pointer;
      font-size: 16px;
    }

    .ai-voice-btn.listening {
      background: var(--warning);
      color: white;
      border-color: var(--warning);
    }

    .ai-loading {
      display: flex;
      gap: 4px;
      align-items: flex-end;
    }

    .ai-loading span {
      width: 8px;
      height: 8px;
      background: var(--primary);
      border-radius: 50%;
      animation: bounce 1.4s infinite;
    }

    .ai-loading span:nth-child(2) {
      animation-delay: 0.2s;
    }

    .ai-loading span:nth-child(3) {
      animation-delay: 0.4s;
    }

    @keyframes bounce {
      0%, 80%, 100% {
        transform: translateY(0);
      }
      40% {
        transform: translateY(-10px);
      }
    }

    .ai-visual-guide-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.3);
      z-index: 2147483646;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .ai-guide-step {
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 400px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      text-align: center;
    }

    .ai-guide-step-number {
      font-size: 32px;
      font-weight: bold;
      color: var(--primary);
      margin-bottom: 12px;
    }

    .ai-guide-step-instruction {
      font-size: 16px;
      line-height: 1.6;
      color: var(--text);
      margin-bottom: 20px;
    }

    .ai-guide-button-group {
      display: flex;
      gap: 12px;
      justify-content: center;
    }

    .ai-guide-next-btn,
    .ai-guide-skip-btn {
      padding: 10px 20px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      font-weight: 500;
    }

    .ai-guide-next-btn {
      background: var(--primary);
      color: white;
    }

    .ai-guide-next-btn:hover {
      background: var(--primary-dark);
    }

    .ai-guide-skip-btn {
      background: var(--border);
      color: var(--text);
    }
  `;
}

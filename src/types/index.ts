export interface Step {
  instruction: string;
  targetText: string;
  action: 'highlight' | 'move-cursor' | 'input' | 'click';
  selectorHint: string;
}

export interface ChatResponse {
  response: string;
  steps: Step[];
}

export interface PageContext {
  title: string;
  url: string;
  headings: string[];
  buttons: Array<{ text: string; selector?: string }>;
  formInputs: Array<{ label: string; type: string; name?: string }>;
  visibleText: string;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  steps?: Step[];
  timestamp: number;
  voiceInput?: boolean;
}

export interface Session {
  sessionId: string;
  userId?: string;
  startedAt: number;
  messages: ChatMessage[];
  pageUrl: string;
}

export interface ExtensionMessage {
  type: 'CHAT_REQUEST' | 'PAGE_CONTEXT' | 'GUIDANCE_STEP' | 'SESSION_UPDATE';
  payload?: Record<string, any>;
}

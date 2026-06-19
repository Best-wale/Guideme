import { ChatMessage, GuidanceStep } from '../types';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export class ExtensionAPIClient {
  private sessionId: string;

  constructor(sessionId?: string) {
    this.sessionId = sessionId || this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async sendMessage(
    userMessage: string,
    pageContext: any
  ): Promise<{ response: ChatMessage; guidance?: GuidanceStep[] }> {
    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          message: userMessage,
          pageContext,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[ExtensionAPIClient] Error sending message:', error);
      throw error;
    }
  }

  async getSessions(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE}/api/sessions`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[ExtensionAPIClient] Error fetching sessions:', error);
      throw error;
    }
  }

  async submitFeedback(
    messageId: string,
    feedback: 'helpful' | 'not_helpful'
  ): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          messageId,
          feedback,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
    } catch (error) {
      console.error('[ExtensionAPIClient] Error submitting feedback:', error);
      throw error;
    }
  }

  getSessionId(): string {
    return this.sessionId;
  }

  setSessionId(id: string): void {
    this.sessionId = id;
  }
}

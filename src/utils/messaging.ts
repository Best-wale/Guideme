import type { ExtensionMessage } from '../types';

export const MESSAGE_TYPES = {
  CHAT_REQUEST: 'CHAT_REQUEST',
  PAGE_CONTEXT: 'PAGE_CONTEXT',
  GUIDANCE_STEP: 'GUIDANCE_STEP',
  SESSION_UPDATE: 'SESSION_UPDATE',
  VOICE_INPUT: 'VOICE_INPUT',
};

export function sendMessageToBackground(message: ExtensionMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

export function listenToMessages(
  callback: (message: ExtensionMessage, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => void
) {
  chrome.runtime.onMessage.addListener(callback);
  
  return () => {
    chrome.runtime.onMessage.removeListener(callback);
  };
}

export async function getChromeStorageData(keys: string[]): Promise<Record<string, any>> {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get(keys, (items) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(items);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

export async function setChromeStorageData(data: Record<string, any>): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.set(data, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

var content=(function(){function e(e){return e}function t(){let e=[],t=[],n=[];document.querySelectorAll(`h1, h2, h3, h4, h5, h6`).forEach(t=>{let n=t.textContent?.trim();n&&n.length>0&&n.length<200&&e.push(n)}),document.querySelectorAll(`button, a[role="button"], input[type="button"], input[type="submit"]`).forEach(e=>{let n=(e.textContent||e.getAttribute(`aria-label`)||``)?.trim();n&&n.length>0&&n.length<100&&t.push({text:n,selector:e.id||e.className||void 0})}),document.querySelectorAll(`input, textarea, select`).forEach(e=>{let t=(e.getAttribute(`aria-label`)||e.getAttribute(`placeholder`)||``)?.trim(),r=e.getAttribute(`type`)||e.tagName.toLowerCase();t&&t.length>0&&n.push({label:t,type:r,name:e.getAttribute(`name`)||void 0})});let r=document.body.innerText.substring(0,1e3);return{title:document.title,url:window.location.href,headings:e.slice(0,20),buttons:t.slice(0,15),formInputs:n.slice(0,10),visibleText:r,timestamp:Date.now()}}var n={CHAT_REQUEST:`CHAT_REQUEST`,PAGE_CONTEXT:`PAGE_CONTEXT`,GUIDANCE_STEP:`GUIDANCE_STEP`,SESSION_UPDATE:`SESSION_UPDATE`,VOICE_INPUT:`VOICE_INPUT`};function r(e){return new Promise((t,n)=>{try{chrome.runtime.sendMessage(e,e=>{chrome.runtime.lastError?n(chrome.runtime.lastError):t(e)})}catch(e){n(e)}})}function i(e){return chrome.runtime.onMessage.addListener(e),()=>{chrome.runtime.onMessage.removeListener(e)}}async function a(e){return new Promise((t,n)=>{try{chrome.storage.local.get(e,e=>{chrome.runtime.lastError?n(chrome.runtime.lastError):t(e)})}catch(e){n(e)}})}async function o(e){return new Promise((t,n)=>{try{chrome.storage.local.set(e,()=>{chrome.runtime.lastError?n(chrome.runtime.lastError):t()})}catch(e){n(e)}})}function s(){return`session_${Date.now()}_${Math.random().toString(36).substr(2,9)}`}var c=null,l=null;async function u(e){(await a([`sessionId`])).sessionId||await o({sessionId:s()}),i((e,t,n)=>{g(e,n)}),d(),document.addEventListener(`keydown`,e=>{(e.ctrlKey||e.metaKey)&&e.shiftKey&&e.key===`G`&&(e.preventDefault(),f())})}function d(){if(c)return;c=document.createElement(`div`),c.id=`ai-site-guide-container`,document.documentElement.appendChild(c),l=c.attachShadow({mode:`open`});let e=document.createElement(`style`);e.textContent=_(),l.appendChild(e);let t=document.createElement(`div`);t.id=`ai-chat-bubble-main`,t.innerHTML=`
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
  `,l.appendChild(t);let n=l.getElementById(`chat-bubble-toggle`),r=l.getElementById(`chat-close`),i=l.getElementById(`send-btn`),a=l.getElementById(`voice-input-btn`),o=l.getElementById(`chat-input`);n&&n.addEventListener(`click`,f),r&&r.addEventListener(`click`,()=>f(!1)),i&&i.addEventListener(`click`,()=>p(o)),a&&a.addEventListener(`click`,()=>m(a)),o&&o.addEventListener(`keydown`,e=>{e.key===`Enter`&&!e.shiftKey&&(e.preventDefault(),p(o))})}function f(e){if(!l)return;let t=l.getElementById(`chat-window`);if(!t)return;let n=t.style.display!==`none`,r=e===void 0?!n:e;if(t.style.display=r?`block`:`none`,r){let e=l.getElementById(`chat-input`);e&&e.focus()}}async function p(e){let i=e.value.trim();if(!i)return;let a=l?.getElementById(`messages-container`);if(!a)return;let o=document.createElement(`div`);o.className=`ai-message user`,o.innerHTML=`<div class="ai-message-content">${i}</div>`,a.appendChild(o),e.value=``,e.style.height=`auto`;let s=document.createElement(`div`);s.className=`ai-message assistant`,s.innerHTML=`<div class="ai-loading"><span></span><span></span><span></span></div>`,a.appendChild(s),a.scrollTop=a.scrollHeight;try{let e=t(),o=await r({type:n.CHAT_REQUEST,payload:{message:i,pageContext:e}});if(s.remove(),o&&o.response){let e=document.createElement(`div`);e.className=`ai-message assistant`,e.innerHTML=`<div class="ai-message-content">${o.response}</div>`,a.appendChild(e),o.steps&&o.steps.length>0&&h(o.steps)}a.scrollTop=a.scrollHeight}catch(e){console.error(`[AI Site Guide] Error:`,e),s.remove();let t=document.createElement(`div`);t.className=`ai-message assistant`,t.innerHTML=`<div class="ai-message-content">Sorry, I encountered an error. Please try again.</div>`,a.appendChild(t)}}async function m(e){let t=window.SpeechRecognition||window.webkitSpeechRecognition;if(!t){alert(`Voice input is not supported in your browser`);return}let n=new t;n.lang=`en-US`,e.classList.add(`listening`),n.onstart=()=>{e.classList.add(`listening`)},n.onend=()=>{e.classList.remove(`listening`)},n.onresult=e=>{let t=Array.from(e.results).map(e=>e[0].transcript).join(``),n=l?.getElementById(`chat-input`);n&&(n.value=t,n.focus())},n.onerror=t=>{console.error(`[AI Site Guide] Voice input error:`,t.error),e.classList.remove(`listening`)},n.start()}async function h(e){let t=document.createElement(`div`);t.className=`ai-visual-guide-overlay`,t.innerHTML=`
    <div class="ai-guide-step">
      <div class="ai-guide-step-number">1</div>
      <div class="ai-guide-step-instruction">${e[0]?.instruction||``}</div>
      <div class="ai-guide-button-group">
        <button class="ai-guide-next-btn">Next</button>
        <button class="ai-guide-skip-btn">Skip</button>
      </div>
    </div>
  `,l?.appendChild(t);let n=0,r=t.querySelector(`.ai-guide-next-btn`),i=t.querySelector(`.ai-guide-skip-btn`);r&&r.addEventListener(`click`,()=>{if(n++,n<e.length){let r=t.querySelector(`.ai-guide-step`);if(r){let t=r.querySelector(`.ai-guide-step-number`),i=r.querySelector(`.ai-guide-step-instruction`);t.textContent=String(n+1),i.textContent=e[n].instruction}}else t.remove()}),i&&i.addEventListener(`click`,()=>{t.remove()})}function g(e,t){e.type===n.GUIDANCE_STEP&&(h([e.payload]),t({success:!0}))}function _(){return`
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
  `}var v=e({matches:[`<all_urls>`],world:`MAIN`,async main(e){await u(e)}}),y={debug:(...e)=>([...e],void 0),log:(...e)=>([...e],void 0),warn:(...e)=>([...e],void 0),error:(...e)=>([...e],void 0)};return(async()=>{try{return await v.main()}catch(e){throw y.error(`The content script "content" crashed on startup!`,e),e}})()})();
content;
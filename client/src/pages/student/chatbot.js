import { renderLayout } from '../../components/layout.js';
import { chatbot, request } from '../../utils/api.js';

let chatHistory = [];

export function renderChatbot() {
  const content = `
    <div class="page-header">
      <div>
        <h1 class="page-title">🤖 Doubt Chatbot (Gemini)</h1>
        <p class="page-subtitle">Ask your DBMS questions here and get instant answers from our AI assistant!</p>
      </div>
      <div class="page-header-actions">
        <button id="test-connection-btn" class="btn btn-secondary btn-sm">⚡ Test Connection</button>
      </div>
    </div>

    <div id="status-message" style="margin-bottom: 1rem; display: none;"></div>

    <div class="card-flat" style="height: calc(100vh - 280px); display: flex; flex-direction: column;">
      <div id="chat-messages" style="flex: 1; overflow-y: auto; padding: 1rem; border-bottom: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 1rem;">
        <div class="chat-message bot" style="align-self: flex-start; background: var(--bg-secondary); padding: 1rem; border-radius: 8px; max-width: 80%;">
          <strong>Assistant:</strong> Hello! I'm your DBMS doubt-clearing assistant. How can I help you today?
        </div>
      </div>
      
      <div style="padding: 1rem; display: flex; gap: 0.5rem; background: var(--bg-card); border-bottom-left-radius: 12px; border-bottom-right-radius: 12px;">
        <input type="text" id="chat-input" class="form-control" placeholder="Ask a question about database systems..." style="flex: 1;" autocomplete="off">
        <button id="send-btn" class="btn btn-primary">Send</button>
      </div>
    </div>
  `;

  renderLayout(content, 'doubt-chatbot');

  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');
  const chatMessages = document.getElementById('chat-messages');
  const testBtn = document.getElementById('test-connection-btn');
  const statusEl = document.getElementById('status-message');

  function showStatus(text, type = 'info') {
    statusEl.style.display = 'block';
    statusEl.className = `badge badge-${type === 'error' ? 'rose' : type === 'success' ? 'emerald' : 'blue'}`;
    statusEl.style.padding = '0.5rem 1rem';
    statusEl.style.width = '100%';
    statusEl.style.textAlign = 'center';
    statusEl.textContent = text;
  }

  testBtn.addEventListener('click', async () => {
    testBtn.disabled = true;
    testBtn.textContent = '⌛ Testing...';
    try {
      const res = await request('/chatbot/status');
      showStatus(`✅ Connected to Backend. Mode: ${res.mode}. Engine: ${res.engine}.`, 'success');
    } catch (err) {
      showStatus(`❌ Connection Failed: ${err.message}`, 'error');
    } finally {
      testBtn.disabled = false;
      testBtn.textContent = '⚡ Test Connection';
    }
  });

  function appendMessage(role, text) {
    const msgDiv = document.createElement('div');
    msgDiv.style.alignSelf = role === 'user' ? 'flex-end' : 'flex-start';
    msgDiv.style.background = role === 'user' ? 'var(--primary-color)' : 'var(--bg-secondary)';
    msgDiv.style.color = role === 'user' ? '#fff' : 'inherit';
    msgDiv.style.padding = '1rem';
    msgDiv.style.borderRadius = '8px';
    msgDiv.style.maxWidth = '80%';
    msgDiv.innerHTML = `<strong>${role === 'user' ? 'You' : 'Assistant'}:</strong> ${text}`;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    appendMessage('user', text);
    chatInput.value = '';
    chatInput.disabled = true;
    sendBtn.disabled = true;

    const loadingId = 'loading-' + Date.now();
    try {
      const loadingDiv = document.createElement('div');
      loadingDiv.id = loadingId;
      loadingDiv.style.alignSelf = 'flex-start';
      loadingDiv.style.background = 'var(--bg-secondary)';
      loadingDiv.style.padding = '1rem';
      loadingDiv.style.borderRadius = '8px';
      loadingDiv.innerHTML = `<em>Thinking...</em>`;
      chatMessages.appendChild(loadingDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;

      const res = await chatbot.ask(text, chatHistory);
      document.getElementById(loadingId)?.remove();

      appendMessage('model', res.reply);
      chatHistory.push({ role: 'user', text });
      chatHistory.push({ role: 'model', text: res.reply });
      if (chatHistory.length > 10) chatHistory = chatHistory.slice(-10);
      
    } catch (err) {
      document.getElementById(loadingId)?.remove();
      appendMessage('model', `<span style="color: var(--error-color)"><strong>Request Failed:</strong> ${err.message}</span>`);
      console.error('Chat Error:', err);
    } finally {
      chatInput.disabled = false;
      sendBtn.disabled = false;
      chatInput.focus();
    }
  }

  sendBtn.addEventListener('click', sendMessage);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
}

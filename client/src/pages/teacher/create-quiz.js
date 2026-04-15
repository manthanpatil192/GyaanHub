import { renderLayout } from '../../components/layout.js';
import { quizzes as quizzesApi, modules as modulesApi } from '../../utils/api.js';
import { navigate } from '../../utils/router.js';
import { showToast } from '../../components/shared.js';

export async function renderCreateQuiz() {
  renderLayout(`<div class="loading-spinner"><div class="spinner"></div></div>`, 'create-quiz');

  try {
    const modulesList = await modulesApi.list();
    let parsedPreview = null;

    function render() {
      const content = `
        <div class="page-header">
          <div>
            <h1 class="page-title">Generate New Quiz 🚀</h1>
            <p class="page-subtitle">Simply paste your questions below and we'll build the quiz for you.</p>
          </div>
          <button class="btn btn-secondary" onclick="location.hash='/teacher/quizzes'">Back to Quizzes</button>
        </div>

        <div class="grid-2-1" style="gap:var(--space-xl); align-items: start;">
          <!-- Left Column: Inputs & Editor -->
          <div>
            <!-- Quiz Basics -->
            <div class="card-flat" style="margin-bottom:var(--space-xl);">
              <h3 style="margin-bottom:var(--space-lg); display:flex; align-items:center; gap:8px;">
                ⚙️ Quiz Configuration
              </h3>
              <div class="form-group">
                <label class="form-label">Quiz Title *</label>
                <input type="text" class="form-input" id="quiz-title" placeholder="e.g., Introduction to Normalization" required />
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Linked Module</label>
                  <select class="form-select" id="quiz-module">
                    <option value="">— No module —</option>
                    ${modulesList.map(m => `<option value="${m.id}">${m.title}</option>`).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Time Limit (mins)</label>
                  <input type="number" class="form-input" id="quiz-time" min="1" max="180" value="15" />
                </div>
              </div>
            </div>

            <!-- Paste Area -->
            <div class="card-flat" style="padding:var(--space-xl);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-md);">
                <h3 style="display:flex; align-items:center; gap:8px;">📋 Paste Questions</h3>
                <div style="display:flex; gap:var(--space-sm);">
                  <button type="button" class="btn btn-ghost btn-sm" id="ai-template-btn">🤖 AI Template</button>
                  <button type="button" class="btn btn-ghost btn-sm" id="clear-btn">Clear</button>
                </div>
              </div>
              
              <div class="form-group">
                <textarea class="form-textarea" id="paste-content" 
                  placeholder="Q1. What is DBMS?\nA) Database...\nB) Data...\nAnswer: A" 
                  style="min-height:400px; font-family:var(--font-mono); font-size:0.85rem; line-height:1.6;"></textarea>
              </div>

              <div style="display:flex; justify-content:space-between; align-items:center; margin-top:var(--space-lg);">
                <div style="color:var(--text-muted); font-size:0.85rem;">
                  Paste structured text or MCQ content here.
                </div>
                <button type="button" class="btn btn-success btn-lg" id="generate-btn" style="min-width:200px;">
                  🚀 Generate & Publish
                </button>
              </div>
            </div>
            
            ${parsedPreview ? renderPreviewSection() : ''}
          </div>

          <!-- Right Column: Instructions -->
          <div class="sticky-top" style="top:calc(var(--nav-height) + var(--space-xl));">
            <div class="card-flat" style="background:var(--bg-primary); border-color:var(--accent-blue);">
              <h4 style="margin-bottom:var(--space-md); color:var(--accent-blue);">📖 How to format</h4>
              <div style="font-size:0.82rem; line-height:1.6; color:var(--text-secondary);">
                <p>Use this simple structure for best results:</p>
                <pre style="background:var(--bg-secondary); padding:10px; border-radius:4px; margin:8px 0; color:var(--accent-emerald);">Q1. Your question here?
A) Option A
B) Option B
C) Option C
D) Option D
Answer: A
Explanation: Because...</pre>
                <ul style="padding-left:16px; margin-top:12px;">
                  <li>Separate questions with a <strong>blank line</strong>.</li>
                  <li>Mark correct answers with <strong>Answer: A</strong> or a <strong>*</strong> (e.g., *Option A).</li>
                  <li>You can include <strong>Explanation:</strong> for students.</li>
                </ul>
              </div>
            </div>

            <div class="card-flat" style="margin-top:var(--space-lg); background:linear-gradient(135deg, rgba(124,77,255,0.05), rgba(59,130,246,0.05));">
              <p style="font-size:0.82rem; margin:0;">
                💡 <strong>Pro Tip:</strong> You can copy-paste directly from PDFs, Word docs, or ChatGPT!
              </p>
            </div>
          </div>
        </div>
      `;

      const main = document.querySelector('.layout-content');
      if (main) main.innerHTML = content;
      else renderLayout(content, 'create-quiz');

      bindEvents();
    }

    function renderPreviewSection() {
      if (!parsedPreview || parsedPreview.length === 0) return '';
      return `
        <div class="card-flat" style="margin-top:var(--space-lg); border-color:var(--accent-emerald); border-width:2px;">
          <h3 style="margin-bottom:var(--space-md); color:var(--accent-emerald);">✨ Detection Preview (${parsedPreview.length} Questions)</h3>
          <div style="max-height:300px; overflow-y:auto; padding-right:10px;">
            ${parsedPreview.map((q, i) => `
              <div style="padding:10px; border-bottom:1px solid var(--border-primary); font-size:0.85rem;">
                <strong>${i + 1}. ${escHtml(q.question_text)}</strong>
                <div style="color:var(--text-muted); margin-left:15px; display:grid; grid-template-columns:1fr 1fr;">
                  <span style="${q.correct_option === 'A' ? 'color:var(--accent-emerald); font-weight:700;' : ''}">A) ${escHtml(q.option_a)}</span>
                  <span style="${q.correct_option === 'B' ? 'color:var(--accent-emerald); font-weight:700;' : ''}">B) ${escHtml(q.option_b)}</span>
                  <span style="${q.correct_option === 'C' ? 'color:var(--accent-emerald); font-weight:700;' : ''}">C) ${escHtml(q.option_c)}</span>
                  <span style="${q.correct_option === 'D' ? 'color:var(--accent-emerald); font-weight:700;' : ''}">D) ${escHtml(q.option_d)}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    function bindEvents() {
      const textarea = document.getElementById('paste-content');
      
      // Auto-preview logic
      textarea?.addEventListener('input', () => {
        const text = textarea.value;
        if (text.length > 20) {
          parsedPreview = parseTextClient(text);
          // Update preview without full re-render for performance
          const previewContainer = document.querySelector('.preview-results'); // We'll add this class
          // Actually, let's keep it simple for now and just re-render small parts or wait for focus out
        }
      });

      document.getElementById('ai-template-btn')?.addEventListener('click', () => {
        const title = document.getElementById('quiz-title')?.value || 'DBMS';
        textarea.value = `Q1. Which of the following is a key feature of ${title}?\nA) Data duplication\nB) *Data independence\nC) Manual indexing\nD) File-based storage\n\nQ2. What is the primary key used for?\nA) *Uniquely identifying records\nB) Creating backups\nC) Sorting results only\nD) Linking all tables at once`;
        parsedPreview = parseTextClient(textarea.value);
        render();
      });

      document.getElementById('clear-btn')?.addEventListener('click', () => {
        textarea.value = '';
        parsedPreview = null;
        render();
      });

      document.getElementById('generate-btn')?.addEventListener('click', async () => {
        const content = textarea.value;
        const title = document.getElementById('quiz-title').value;
        const moduleId = document.getElementById('quiz-module').value;
        const timeLimit = document.getElementById('quiz-time').value;

        if (!title || !content.trim()) {
          showToast('Title and Question content are required', 'warning');
          return;
        }

        try {
          showToast('✨ Generating Quiz...', 'info');
          const result = await quizzesApi.bulkImport({
            title,
            description: `Imported quiz for ${title}`,
            module_id: moduleId || null,
            time_limit_minutes: parseInt(timeLimit) || 15,
            format: 'text',
            content: content
          });
          showToast(`Done! ${result.message}`, 'success');
          navigate('/teacher/quizzes');
        } catch (err) {
          showToast('Generation failed: ' + err.message, 'error');
        }
      });
    }

    // Client-side text parser
    function parseTextClient(text) {
      const questions = [];
      const blocks = text.split(/(?=(?:^|\n)\s*(?:Q\d*[.\-):]\s|Question\s*\d*))/i)
        .filter(b => b.trim().length > 0);

      for (const block of blocks) {
        const lines = block.trim().split('\n').map(l => l.trim()).filter(l => l);
        if (lines.length < 3) continue;

        const q = { points: 1, option_c: '', option_d: '', explanation: '' };
        q.question_text = lines[0].replace(/^Q\d*[.\-):]\s*/i, '').replace(/^Question\s*\d*[.\-):]*\s*/i, '').trim();

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          const optMatch = line.match(/^[(\s]*([A-Da-d])[).\s\-:]+\s*(.*)/);
          if (optMatch) {
            const letter = optMatch[1].toUpperCase();
            const txt = optMatch[2].trim();
            const isCorrect = txt.startsWith('*') || txt.endsWith('*');
            const clean = txt.replace(/^\*\s*|\s*\*$/g, '').trim();
            if (letter === 'A') q.option_a = clean;
            else if (letter === 'B') q.option_b = clean;
            else if (letter === 'C') q.option_c = clean;
            else if (letter === 'D') q.option_d = clean;
            if (isCorrect) q.correct_option = letter;
            continue;
          }
          const ansMatch = line.match(/^(?:answer|correct|ans|key)[\s:\-]+([A-Da-d])/i);
          if (ansMatch) { q.correct_option = ansMatch[1].toUpperCase(); continue; }
        }

        if (q.question_text && q.option_a && q.option_b) {
          q.correct_option = q.correct_option || 'A';
          questions.push(q);
        }
      }
      return questions;
    }

    render();

  } catch (err) {
    renderLayout(`<div class="empty-state"><p class="empty-state-title">Error loading</p><p class="text-muted">${err.message}</p></div>`, 'create-quiz');
  }
}

function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

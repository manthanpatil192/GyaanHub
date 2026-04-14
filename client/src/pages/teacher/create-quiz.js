import { renderLayout } from '../../components/layout.js';
import { quizzes as quizzesApi, modules as modulesApi } from '../../utils/api.js';
import { navigate } from '../../utils/router.js';
import { showToast } from '../../components/shared.js';

export async function renderCreateQuiz() {
  renderLayout(`<div class="loading-spinner"><div class="spinner"></div></div>`, 'create-quiz');

  try {
    const modulesList = await modulesApi.list();

    let questions = [createEmptyQuestion()];
    let mode = 'manual'; // 'manual' | 'paste' | 'json'
    let parsedPreview = null;

    function createEmptyQuestion() {
      return { question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A', explanation: '', points: 1 };
    }

    function render() {
      const content = `
        <div class="page-header">
          <div>
            <h1 class="page-title">Create Quiz ✏️</h1>
            <p class="page-subtitle">Build quizzes manually or import them in seconds</p>
          </div>
        </div>

        <!-- Mode selector -->
        <div class="tab-bar" style="margin-bottom:var(--space-xl);">
          <button class="tab-btn ${mode === 'manual' ? 'tab-active' : ''}" data-mode="manual">✏️ Manual Entry</button>
          <button class="tab-btn ${mode === 'paste' ? 'tab-active' : ''}" data-mode="paste">📋 Paste & Auto-Parse</button>
          <button class="tab-btn ${mode === 'json' ? 'tab-active' : ''}" data-mode="json">📦 JSON Import</button>
        </div>

        <!-- Quiz Details (shared across modes) -->
        <div class="card-flat" style="margin-bottom:var(--space-xl);">
          <h3 style="margin-bottom:var(--space-lg);">📋 Quiz Details</h3>
          <div class="form-group">
            <label class="form-label">Quiz Title *</label>
            <input type="text" class="form-input" id="quiz-title" placeholder="e.g., SQL Joins & Subqueries Quiz" required />
          </div>
          <div class="form-group">
            <label class="form-label">Description *</label>
            <textarea class="form-textarea" id="quiz-desc" placeholder="Brief description of what this quiz covers..." required style="min-height:80px;"></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Linked Module (Optional)</label>
              <select class="form-select" id="quiz-module">
                <option value="">— No module —</option>
                ${modulesList.map(m => `<option value="${m.id}">${m.title}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Time Limit (minutes) *</label>
              <input type="number" class="form-input" id="quiz-time" min="1" max="120" value="10" required />
            </div>
          </div>
        </div>

        <!-- Mode specific content -->
        ${mode === 'manual' ? renderManualMode() : ''}
        ${mode === 'paste' ? renderPasteMode() : ''}
        ${mode === 'json' ? renderJSONMode() : ''}
      `;

      const main = document.querySelector('.layout-content');
      if (main) {
        main.innerHTML = content;
      } else {
        renderLayout(content, 'create-quiz');
      }

      bindEvents();
    }

    // ============ MANUAL MODE ============
    function renderManualMode() {
      return `
        <div id="questions-container">
          ${questions.map((q, i) => renderQuestionForm(q, i)).join('')}
        </div>

        <div style="text-align:center;margin:var(--space-lg) 0;">
          <button type="button" class="btn btn-secondary" id="add-question-btn">
            ➕ Add Question
          </button>
        </div>

        <div style="display:flex;justify-content:flex-end;gap:var(--space-md);margin-top:var(--space-xl);">
          <button type="button" class="btn btn-secondary" onclick="location.hash='/teacher/dashboard'">Cancel</button>
          <button type="button" class="btn btn-success btn-lg" id="publish-manual-btn">
            🚀 Publish Quiz (${questions.length} Q)
          </button>
        </div>
      `;
    }

    function renderQuestionForm(q, index) {
      return `
        <div class="card-flat" style="margin-bottom:var(--space-lg);" data-question-index="${index}">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg);">
            <h4>❓ Question ${index + 1}</h4>
            ${index > 0 ? `<button type="button" class="btn btn-ghost btn-sm remove-question" data-index="${index}">🗑️ Remove</button>` : ''}
          </div>

          <div class="form-group">
            <label class="form-label">Question Text *</label>
            <textarea class="form-textarea q-text" data-index="${index}" placeholder="Enter your question..." required style="min-height:60px;">${q.question_text}</textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Option A *</label>
              <input type="text" class="form-input q-opt-a" data-index="${index}" placeholder="Option A" value="${escHtml(q.option_a)}" required />
            </div>
            <div class="form-group">
              <label class="form-label">Option B *</label>
              <input type="text" class="form-input q-opt-b" data-index="${index}" placeholder="Option B" value="${escHtml(q.option_b)}" required />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Option C *</label>
              <input type="text" class="form-input q-opt-c" data-index="${index}" placeholder="Option C" value="${escHtml(q.option_c)}" required />
            </div>
            <div class="form-group">
              <label class="form-label">Option D *</label>
              <input type="text" class="form-input q-opt-d" data-index="${index}" placeholder="Option D" value="${escHtml(q.option_d)}" required />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Correct Answer *</label>
              <select class="form-select q-correct" data-index="${index}">
                <option value="A" ${q.correct_option === 'A' ? 'selected' : ''}>A</option>
                <option value="B" ${q.correct_option === 'B' ? 'selected' : ''}>B</option>
                <option value="C" ${q.correct_option === 'C' ? 'selected' : ''}>C</option>
                <option value="D" ${q.correct_option === 'D' ? 'selected' : ''}>D</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Points</label>
              <input type="number" class="form-input q-points" data-index="${index}" min="1" max="10" value="${q.points}" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Explanation (shown after quiz)</label>
            <textarea class="form-textarea q-explanation" data-index="${index}" placeholder="Explain why this answer is correct..." style="min-height:60px;">${q.explanation}</textarea>
          </div>
        </div>
      `;
    }

    // ============ PASTE & PARSE MODE ============
    function renderPasteMode() {
      const sampleText = `Q1. What does DBMS stand for?
A) Database Management System
B) Data Basic Management Service
C) Digital Base Manager System
D) Data Backup Maintenance Software
Answer: A
Explanation: DBMS stands for Database Management System.

Q2. Which of the following is NOT a type of key in DBMS?
A) Primary key
B) *Foreign key
C) Loop key
D) Candidate key
Answer: C
Explanation: Loop key is not a valid key type.`;

      return `
        <div class="grid-2" style="gap:var(--space-xl);">
          <div>
            <div class="card-flat" style="padding:var(--space-xl);">
              <h3 style="margin-bottom:var(--space-md);display:flex;align-items:center;gap:8px;">
                📋 Paste Your Questions
                <span class="badge badge-emerald">⚡ Fast</span>
              </h3>
              <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:var(--space-md);">
                Paste questions in a simple text format. The system will auto-detect and parse them.
              </p>
              
              <div style="display:flex;gap:var(--space-md);margin-bottom:var(--space-lg);padding:var(--space-md);background:var(--bg-primary);border-radius:var(--radius-md);border:1px dashed var(--border-primary);">
                <div style="flex:1;">
                  <div style="font-size:0.8rem;font-weight:700;margin-bottom:4px;">✨ Unique Alternatives</div>
                  <div style="display:flex;gap:var(--space-sm);">
                    <button type="button" class="btn btn-ghost btn-sm" id="ai-generate-btn" style="border:1px solid var(--accent-purple);color:var(--accent-purple);">🤖 AI Template</button>
                    <button type="button" class="btn btn-ghost btn-sm" id="pdf-to-text-btn" style="border:1px solid var(--accent-blue);color:var(--accent-blue);">📂 PDF to Quiz</button>
                    <input type="file" id="quiz-pdf-file" accept=".pdf,.txt" style="display:none;" />
                  </div>
                </div>
                <div style="width:1px;background:var(--border-primary);"></div>
                <div style="flex:1;font-size:0.75rem;color:var(--text-muted);display:flex;align-items:center;">
                  Use AI to generate a template or extract text from a PDF file to save time!
                </div>
              </div>

              <div class="form-group">
                <textarea class="form-textarea" id="paste-content" placeholder="Paste your questions here..." style="min-height:300px;font-family:var(--font-mono);font-size:0.82rem;line-height:1.6;">${sampleText}</textarea>
              </div>
              <div style="display:flex;gap:var(--space-sm);">
                <button type="button" class="btn btn-secondary" id="parse-btn">🔍 Parse & Preview</button>
                <button type="button" class="btn btn-ghost btn-sm" id="clear-paste-btn">Clear</button>
              </div>
            </div>

            ${parsedPreview ? renderPreviewSection() : ''}
          </div>

          <!-- Format guide -->
          <div>
            <div class="card-flat" style="padding:var(--space-xl);">
              <h3 style="margin-bottom:var(--space-md);">📖 Supported Formats</h3>
              <div style="font-size:0.82rem;color:var(--text-secondary);line-height:1.8;">
                <p><strong style="color:var(--accent-blue);">Standard Format:</strong></p>
                <pre style="background:var(--bg-primary);padding:12px;border-radius:var(--radius-sm);margin:8px 0 16px;font-size:0.78rem;color:var(--accent-emerald);overflow-x:auto;">Q1. Question text here?
A) Option A
B) Option B
C) Option C
D) Option D
Answer: B
Explanation: Why B is correct...</pre>

                <p><strong style="color:var(--accent-blue);">Star (*) for correct answer:</strong></p>
                <pre style="background:var(--bg-primary);padding:12px;border-radius:var(--radius-sm);margin:8px 0 16px;font-size:0.78rem;color:var(--accent-emerald);overflow-x:auto;">Q: What is SQL?
A) *Structured Query Language
B) Simple Query Language
C) System Query Language
D) None</pre>
                <p style="font-size:0.78rem;color:var(--text-muted);">Mark the correct option with a * at the start.</p>

                <p style="margin-top:var(--space-md);"><strong style="color:var(--accent-blue);">Tips:</strong></p>
                <ul style="padding-left:18px;">
                  <li>Separate questions with blank lines</li>
                  <li>Q1. / Q: / Question 1: all work</li>
                  <li>A) / A. / a) all accepted</li>
                  <li>Answer / Correct / Ans / Key all work</li>
                  <li>Add <code>Points: 2</code> for custom scoring</li>
                </ul>
              </div>
            </div>

            <div class="card-flat" style="padding:var(--space-lg);margin-top:var(--space-lg);background:linear-gradient(135deg,rgba(245,158,11,0.05),rgba(239,68,68,0.05));border-color:rgba(245,158,11,0.2);">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                <span style="font-size:1.3rem;">💡</span>
                <strong style="color:var(--accent-amber);">Pro Tip</strong>
              </div>
              <p style="font-size:0.82rem;color:var(--text-secondary);line-height:1.5;">
                Copy questions from PDFs, Word docs, or AI chatbots — paste directly here and the parser handles the rest. No formatting needed!
              </p>
            </div>
          </div>
        </div>
      `;
    }

    function renderPreviewSection() {
      if (!parsedPreview || parsedPreview.length === 0) {
        return `
          <div class="card-flat" style="margin-top:var(--space-lg);padding:var(--space-xl);text-align:center;border-color:var(--accent-red);">
            <div style="font-size:2rem;margin-bottom:8px;">⚠️</div>
            <p style="color:var(--accent-red);font-weight:600;">No questions detected</p>
            <p style="font-size:0.82rem;color:var(--text-muted);">Check the format guide on the right and try again.</p>
          </div>
        `;
      }

      return `
        <div class="card-flat" style="margin-top:var(--space-lg);padding:var(--space-xl);border-color:rgba(16,185,129,0.3);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-lg);">
            <h3 style="color:var(--accent-emerald);">✅ ${parsedPreview.length} Questions Detected</h3>
            <button type="button" class="btn btn-success" id="import-parsed-btn">
              🚀 Import & Publish
            </button>
          </div>

          <div style="max-height:400px;overflow-y:auto;">
            ${parsedPreview.map((q, i) => `
              <div style="padding:12px;border-radius:var(--radius-sm);background:var(--bg-primary);margin-bottom:8px;">
                <div style="display:flex;gap:8px;margin-bottom:6px;">
                  <span class="badge badge-blue">${i + 1}</span>
                  <span style="font-weight:600;font-size:0.9rem;">${escHtml(q.question_text)}</span>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:0.82rem;color:var(--text-secondary);">
                  <span style="${q.correct_option === 'A' ? 'color:var(--accent-emerald);font-weight:600;' : ''}">A) ${escHtml(q.option_a)}</span>
                  <span style="${q.correct_option === 'B' ? 'color:var(--accent-emerald);font-weight:600;' : ''}">B) ${escHtml(q.option_b)}</span>
                  <span style="${q.correct_option === 'C' ? 'color:var(--accent-emerald);font-weight:600;' : ''}">C) ${escHtml(q.option_c || '—')}</span>
                  <span style="${q.correct_option === 'D' ? 'color:var(--accent-emerald);font-weight:600;' : ''}">D) ${escHtml(q.option_d || '—')}</span>
                </div>
                ${q.explanation ? `<div style="font-size:0.78rem;color:var(--text-muted);margin-top:4px;">💬 ${escHtml(q.explanation)}</div>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // ============ JSON MODE ============
    function renderJSONMode() {
      const sampleJSON = `[
  {
    "question_text": "What is the primary key?",
    "option_a": "Uniquely identifies each record",
    "option_b": "Allows duplicate values",
    "option_c": "Can be NULL",
    "option_d": "Is always auto-increment",
    "correct_option": "A",
    "explanation": "Primary key uniquely identifies each record and cannot be NULL.",
    "points": 1
  },
  {
    "question_text": "Which JOIN returns all rows from both tables?",
    "option_a": "INNER JOIN",
    "option_b": "LEFT JOIN",
    "option_c": "RIGHT JOIN",
    "option_d": "FULL OUTER JOIN",
    "correct_option": "D",
    "points": 2
  }
]`;

      return `
        <div class="grid-2" style="gap:var(--space-xl);">
          <div class="card-flat" style="padding:var(--space-xl);">
            <h3 style="margin-bottom:var(--space-md);display:flex;align-items:center;gap:8px;">
              📦 JSON Import
              <span class="badge badge-purple">Developer</span>
            </h3>
            <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:var(--space-md);">
              Paste a JSON array of question objects. Perfect for programmatic quiz generation.
            </p>

            <div class="form-group">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <label class="form-label" style="margin:0;">JSON Content *</label>
                <button type="button" class="btn btn-ghost btn-sm" id="load-sample-json">Load Sample</button>
              </div>
              <textarea class="form-textarea" id="json-content" placeholder='[{"question_text": "...", "option_a": "...", ...}]' style="min-height:350px;font-family:var(--font-mono);font-size:0.78rem;line-height:1.5;"></textarea>
            </div>

            <div style="display:flex;gap:var(--space-sm);align-items:center;">
              <button type="button" class="btn btn-primary" id="import-json-btn">📦 Validate & Import</button>
              <span id="json-status" style="font-size:0.82rem;"></span>
            </div>
          </div>

          <div>
            <div class="card-flat" style="padding:var(--space-xl);">
              <h3 style="margin-bottom:var(--space-md);">📐 JSON Schema</h3>
              <pre style="background:var(--bg-primary);padding:16px;border-radius:var(--radius-sm);font-size:0.75rem;color:var(--accent-emerald);overflow-x:auto;line-height:1.6;">${escHtml(sampleJSON)}</pre>
              <div style="font-size:0.8rem;color:var(--text-muted);margin-top:var(--space-md);line-height:1.7;">
                <strong>Required fields:</strong>
                <ul style="padding-left:16px;margin:4px 0;">
                  <li><code>question_text</code> — The question</li>
                  <li><code>option_a</code>, <code>option_b</code> — Min 2 options</li>
                  <li><code>correct_option</code> — A, B, C, or D</li>
                </ul>
                <strong>Optional:</strong>
                <ul style="padding-left:16px;margin:4px 0;">
                  <li><code>option_c</code>, <code>option_d</code></li>
                  <li><code>explanation</code> — Shown after quiz</li>
                  <li><code>points</code> — Default: 1</li>
                </ul>
              </div>
            </div>

            <div class="card-flat" style="padding:var(--space-lg);margin-top:var(--space-lg);background:linear-gradient(135deg,rgba(124,77,255,0.05),rgba(59,130,246,0.05));border-color:rgba(124,77,255,0.2);">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                <span style="font-size:1.3rem;">🤖</span>
                <strong style="color:var(--accent-purple);">AI Tip</strong>
              </div>
              <p style="font-size:0.82rem;color:var(--text-secondary);line-height:1.5;">
                Ask ChatGPT or any AI: <em>"Generate 10 MCQ questions about SQL JOINs in JSON format with fields: question_text, option_a, option_b, option_c, option_d, correct_option, explanation"</em> — then paste the output here!
              </p>
            </div>
          </div>
        </div>
      `;
    }

    // ============ EVENT BINDING ============
    function bindEvents() {
      // Mode tabs
      document.querySelectorAll('.tab-btn[data-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
          if (mode === 'manual') collectQuestionData();
          mode = btn.dataset.mode;
          parsedPreview = null;
          render();
        });
      });

      // --- Manual mode ---
      document.getElementById('add-question-btn')?.addEventListener('click', () => {
        collectQuestionData();
        questions.push(createEmptyQuestion());
        render();
        setTimeout(() => {
          const container = document.getElementById('questions-container');
          container?.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      });

      document.querySelectorAll('.remove-question').forEach(btn => {
        btn.addEventListener('click', () => {
          collectQuestionData();
          questions.splice(parseInt(btn.dataset.index), 1);
          render();
        });
      });

      document.getElementById('publish-manual-btn')?.addEventListener('click', async () => {
        collectQuestionData();
        await publishQuiz(questions);
      });

      // --- Paste mode ---
      document.getElementById('parse-btn')?.addEventListener('click', () => {
        const content = document.getElementById('paste-content')?.value;
        if (!content?.trim()) { showToast('Please paste some question content', 'warning'); return; }

        // Client-side parsing preview
        parsedPreview = parseTextClient(content);
        render();

        if (parsedPreview.length > 0) {
          showToast(`✅ Found ${parsedPreview.length} questions — review below`, 'success');
        } else {
          showToast('⚠️ No questions detected. Check the format.', 'warning');
        }
      });

      document.getElementById('clear-paste-btn')?.addEventListener('click', () => {
        parsedPreview = null;
        render();
        setTimeout(() => { document.getElementById('paste-content').value = ''; }, 50);
      });

      document.getElementById('import-parsed-btn')?.addEventListener('click', async () => {
        if (!parsedPreview?.length) return;
        await bulkImport('text', document.getElementById('paste-content')?.value || '');
      });

      // --- AI & PDF Magic ---
      document.getElementById('ai-generate-btn')?.addEventListener('click', () => {
        const title = document.getElementById('quiz-title')?.value || 'DBMS';
        showToast('✨ Generating AI Template...', 'info');
        
        const template = `Q1. Which of the following is a characteristic of ${title}?
A) High data redundancy
B) *Data independence
C) Insecure access
D) Centralized control only

Q2. What is the primary objective of ${title} in a modern database?
A) Increasing storage cost
B) Decreasing data availability
C) *Improving data integrity and consistency
D) Making data access harder

Q3. In the context of ${title}, what does ACID stand for?
A) *Atomicity, Consistency, Isolation, Durability
B) Access, Control, Input, Data
C) Array, Code, Interface, Database
D) None of the above`;

        const ta = document.getElementById('paste-content');
        if (ta) {
          ta.value = template;
          parsedPreview = parseTextClient(template);
          render();
        }
      });

      document.getElementById('pdf-to-text-btn')?.addEventListener('click', () => {
        document.getElementById('quiz-pdf-file')?.click();
      });

      document.getElementById('quiz-pdf-file')?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        showToast('🔍 Analyzing file...', 'info');
        const reader = new FileReader();
        reader.onload = (re) => {
          const content = re.target.result;
          const ta = document.getElementById('paste-content');
          if (ta) {
            ta.value = content;
            parsedPreview = parseTextClient(content);
            render();
            showToast('📄 Content loaded! Review and click Parse.', 'success');
          }
        };
        reader.readAsText(file); // Reading as text for simplicity in this demo
      });

      // --- JSON mode ---
      document.getElementById('load-sample-json')?.addEventListener('click', () => {
        const ta = document.getElementById('json-content');
        if (ta) ta.value = `[\n  {\n    "question_text": "What is the primary key?",\n    "option_a": "Uniquely identifies each record",\n    "option_b": "Allows duplicate values",\n    "option_c": "Can be NULL",\n    "option_d": "Is always auto-increment",\n    "correct_option": "A",\n    "explanation": "Primary key uniquely identifies each record.",\n    "points": 1\n  }\n]`;
      });

      document.getElementById('import-json-btn')?.addEventListener('click', async () => {
        const content = document.getElementById('json-content')?.value;
        if (!content?.trim()) { showToast('Paste JSON content first', 'warning'); return; }

        try {
          const arr = JSON.parse(content);
          if (!Array.isArray(arr) || arr.length === 0) { showToast('JSON must be a non-empty array', 'error'); return; }
          const statusEl = document.getElementById('json-status');
          if (statusEl) statusEl.innerHTML = `<span style="color:var(--accent-emerald);">✅ Valid JSON — ${arr.length} questions</span>`;
          await bulkImport('json', content);
        } catch {
          const statusEl = document.getElementById('json-status');
          if (statusEl) statusEl.innerHTML = '<span style="color:var(--accent-red);">❌ Invalid JSON syntax</span>';
          showToast('Invalid JSON — check syntax', 'error');
        }
      });
    }

    // ============ HELPERS ============
    function collectQuestionData() {
      document.querySelectorAll('[data-question-index]').forEach((el, i) => {
        questions[i] = {
          question_text: el.querySelector('.q-text')?.value || '',
          option_a: el.querySelector('.q-opt-a')?.value || '',
          option_b: el.querySelector('.q-opt-b')?.value || '',
          option_c: el.querySelector('.q-opt-c')?.value || '',
          option_d: el.querySelector('.q-opt-d')?.value || '',
          correct_option: el.querySelector('.q-correct')?.value || 'A',
          explanation: el.querySelector('.q-explanation')?.value || '',
          points: parseInt(el.querySelector('.q-points')?.value) || 1
        };
      });
    }

    async function publishQuiz(qs) {
      const title = document.getElementById('quiz-title')?.value;
      const description = document.getElementById('quiz-desc')?.value;
      if (!title || !description) { showToast('Fill in quiz title and description', 'warning'); return; }

      for (let i = 0; i < qs.length; i++) {
        const q = qs[i];
        if (!q.question_text || !q.option_a || !q.option_b) {
          showToast(`Question ${i + 1}: At least question text and 2 options required`, 'error');
          return;
        }
      }

      try {
        showToast('Publishing quiz...', 'info');
        await quizzesApi.create({
          title, description,
          module_id: document.getElementById('quiz-module')?.value || null,
          time_limit_minutes: parseInt(document.getElementById('quiz-time')?.value) || 10,
          questions: qs
        });
        showToast('Quiz published successfully! 🎉', 'success');
        navigate('/teacher/quizzes');
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      }
    }

    async function bulkImport(format, content) {
      const title = document.getElementById('quiz-title')?.value;
      const description = document.getElementById('quiz-desc')?.value;
      if (!title) { showToast('Enter a quiz title first', 'warning'); return; }

      try {
        showToast('Importing quiz...', 'info');
        const result = await quizzesApi.bulkImport({
          title, description: description || `Imported quiz`,
          module_id: document.getElementById('quiz-module')?.value || null,
          time_limit_minutes: parseInt(document.getElementById('quiz-time')?.value) || 15,
          format, content
        });
        showToast(`🎉 ${result.message}`, 'success');
        navigate('/teacher/quizzes');
      } catch (err) {
        showToast('Import failed: ' + err.message, 'error');
      }
    }

    // Client-side text parser (mirrors server logic for preview)
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
          const expMatch = line.match(/^(?:explanation|explain|note|reason)[\s:\-]+(.*)/i);
          if (expMatch) { q.explanation = expMatch[1].trim(); continue; }
          const ptsMatch = line.match(/^(?:points|marks|score)[\s:\-]+(\d+)/i);
          if (ptsMatch) { q.points = parseInt(ptsMatch[1]) || 1; continue; }
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

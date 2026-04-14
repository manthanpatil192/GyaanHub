import { renderLayout } from '../../components/layout.js';
import { quizzes as quizzesApi } from '../../utils/api.js';
import { navigate } from '../../utils/router.js';
import { showToast, formatTime } from '../../components/shared.js';

let timerInterval = null;

export async function renderQuizList() {
  renderLayout(`<div class="loading-spinner"><div class="spinner"></div></div>`, 'quizzes');

  try {
    const quizzesList = await quizzesApi.list();

    const content = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Quizzes 📝</h1>
          <p class="page-subtitle">Test your DBMS knowledge with timed quizzes</p>
        </div>
      </div>

      <div class="grid-auto">
        ${quizzesList.map(q => {
          const isCompleted = !!q.completed_attempt_id;
          return `
            <div class="quiz-card">
              <div class="quiz-card-header">
                <div>
                  <div class="quiz-card-title">${q.title}</div>
                  <p class="text-muted" style="font-size:0.85rem;margin-top:4px;">${q.description}</p>
                </div>
                ${isCompleted ? '<span class="badge badge-emerald">✓ Completed</span>' : ''}
              </div>
              <div class="quiz-card-meta" style="margin-top:var(--space-md);">
                <span>⏱️ ${q.time_limit_minutes} min</span>
                <span>❓ ${q.question_count} questions</span>
                <span>📚 ${q.module_title || 'General'}</span>
              </div>
              <div style="margin-top:var(--space-lg);">
                ${isCompleted
                  ? `<button class="btn btn-secondary btn-sm" style="width:100%;" data-view-result="${q.completed_attempt_id}">View Result</button>`
                  : `<button class="btn btn-primary btn-sm" style="width:100%;" data-start-quiz="${q.id}">Start Quiz →</button>`
                }
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    renderLayout(content, 'quizzes');

    document.querySelectorAll('[data-start-quiz]').forEach(btn => {
      btn.addEventListener('click', () => navigate(`/student/quiz/${btn.dataset.startQuiz}`));
    });

    document.querySelectorAll('[data-view-result]').forEach(btn => {
      btn.addEventListener('click', () => navigate(`/student/result/${btn.dataset.viewResult}`));
    });

  } catch (err) {
    renderLayout(`<div class="empty-state"><p class="empty-state-title">Error loading quizzes</p><p class="text-muted">${err.message}</p></div>`, 'quizzes');
  }
}

export async function renderQuiz(quizId) {
  // Clear any existing timer
  if (timerInterval) clearInterval(timerInterval);

  renderLayout(`<div class="loading-spinner"><div class="spinner"></div></div>`, 'quiz');

  try {
    // Start the quiz attempt
    const data = await quizzesApi.start(quizId);
    const { attempt, quiz, questions, savedAnswers } = data;

    if (!questions || questions.length === 0) {
      renderLayout(`<div class="empty-state"><p class="empty-state-title">No questions in this quiz</p></div>`, 'quiz');
      return;
    }

    let currentQuestion = 0;
    const answers = {};

    // Restore saved answers
    savedAnswers.forEach(a => {
      answers[a.question_id] = a.selected_option;
    });

    // Calculate remaining time
    const startTime = new Date(attempt.started_at).getTime();
    const timeLimitMs = quiz.time_limit_minutes * 60 * 1000;
    const endTime = startTime + timeLimitMs;
    let remainingSeconds = Math.max(0, Math.floor((endTime - Date.now()) / 1000));

    function renderQuestion() {
      const q = questions[currentQuestion];
      const selectedOption = answers[q.id] || null;

      const content = `
        <div class="quiz-container">
          <div class="quiz-header">
            <div>
              <h2 style="font-size:1.2rem;font-weight:700;">${quiz.title}</h2>
              <p class="text-muted" style="font-size:0.85rem;">Question ${currentQuestion + 1} of ${questions.length}</p>
            </div>
            <div class="timer" id="quiz-timer">
              <span class="timer-icon">⏱️</span>
              <span id="timer-display">${formatTime(remainingSeconds)}</span>
            </div>
          </div>

          <!-- Progress -->
          <div class="quiz-progress">
            ${questions.map((_, i) => {
              let dotClass = 'quiz-progress-dot';
              if (i === currentQuestion) dotClass += ' current';
              else if (answers[questions[i].id]) dotClass += ' answered';
              return `<div class="${dotClass}" data-q-index="${i}"></div>`;
            }).join('')}
          </div>

          <!-- Question -->
          <div class="question-card">
            <div class="question-number">Question ${currentQuestion + 1} • ${q.points} point${q.points > 1 ? 's' : ''}</div>
            <div class="question-text">${q.question_text}</div>
            <div class="options-list">
              ${['A', 'B', 'C', 'D'].map(letter => {
                const optionKey = `option_${letter.toLowerCase()}`;
                const isSelected = selectedOption === letter;
                return `
                  <div class="option-item ${isSelected ? 'selected' : ''}" data-option="${letter}">
                    <div class="option-letter">${letter}</div>
                    <div class="option-text">${q[optionKey]}</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Navigation -->
          <div class="quiz-navigation">
            <button class="btn btn-secondary" id="prev-btn" ${currentQuestion === 0 ? 'disabled style="opacity:0.5;"' : ''}>
              ← Previous
            </button>
            <div style="display:flex;gap:var(--space-sm);">
              ${currentQuestion === questions.length - 1
                ? `<button class="btn btn-success" id="submit-btn">Submit Quiz ✓</button>`
                : `<button class="btn btn-primary" id="next-btn">Next →</button>`
              }
            </div>
          </div>

          <!-- Answered count -->
          <div style="text-align:center;margin-top:var(--space-lg);font-size:0.85rem;color:var(--text-muted);">
            ${Object.keys(answers).length} of ${questions.length} answered
          </div>
        </div>
      `;

      const main = document.querySelector('.layout-content');
      if (main) {
        main.innerHTML = content;
        bindEvents();
      }
    }

    function bindEvents() {
      // Option selection
      document.querySelectorAll('.option-item').forEach(item => {
        item.addEventListener('click', () => {
          const q = questions[currentQuestion];
          answers[q.id] = item.dataset.option;
          document.querySelectorAll('.option-item').forEach(o => o.classList.remove('selected'));
          item.classList.add('selected');
          item.querySelector('.option-letter').style.transition = 'all 0.2s ease';
        });
      });

      // Progress dot navigation
      document.querySelectorAll('.quiz-progress-dot').forEach(dot => {
        dot.addEventListener('click', () => {
          currentQuestion = parseInt(dot.dataset.qIndex);
          renderQuestion();
        });
      });

      // Previous
      const prevBtn = document.getElementById('prev-btn');
      if (prevBtn && currentQuestion > 0) {
        prevBtn.addEventListener('click', () => {
          currentQuestion--;
          renderQuestion();
        });
      }

      // Next
      const nextBtn = document.getElementById('next-btn');
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          currentQuestion++;
          renderQuestion();
        });
      }

      // Submit
      const submitBtn = document.getElementById('submit-btn');
      if (submitBtn) {
        submitBtn.addEventListener('click', () => {
          const unanswered = questions.length - Object.keys(answers).length;
          if (unanswered > 0) {
            showConfirmModal(unanswered);
          } else {
            submitQuiz();
          }
        });
      }
    }

    function showConfirmModal(unanswered) {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal">
          <h3>⚠️ Submit Quiz?</h3>
          <p>You have <strong>${unanswered} unanswered question${unanswered > 1 ? 's' : ''}</strong>. Are you sure you want to submit?</p>
          <div class="modal-actions">
            <button class="btn btn-secondary" id="modal-cancel">Go Back</button>
            <button class="btn btn-primary" id="modal-confirm">Submit Anyway</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      document.getElementById('modal-cancel').addEventListener('click', () => overlay.remove());
      document.getElementById('modal-confirm').addEventListener('click', () => {
        overlay.remove();
        submitQuiz();
      });
    }

    async function submitQuiz() {
      if (timerInterval) clearInterval(timerInterval);

      const submitAnswers = questions.map(q => ({
        question_id: q.id,
        selected_option: answers[q.id] || null
      }));

      try {
        const main = document.querySelector('.layout-content');
        if (main) main.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;

        const result = await quizzesApi.submit(quizId, attempt.id, submitAnswers);
        navigate(`/student/result/${attempt.id}`);
      } catch (err) {
        showToast('Error submitting quiz: ' + err.message, 'error');
        renderQuestion();
      }
    }

    // Render first question
    renderQuestion();

    // Start timer
    timerInterval = setInterval(() => {
      remainingSeconds--;

      const timerDisplay = document.getElementById('timer-display');
      const timerEl = document.getElementById('quiz-timer');

      if (timerDisplay) {
        timerDisplay.textContent = formatTime(remainingSeconds);
      }

      if (timerEl) {
        if (remainingSeconds <= 60) {
          timerEl.className = 'timer danger';
        } else if (remainingSeconds <= 120) {
          timerEl.className = 'timer warning';
        }
      }

      if (remainingSeconds <= 0) {
        clearInterval(timerInterval);
        showToast('⏰ Time is up! Auto-submitting quiz...', 'error');
        submitQuiz();
      }
    }, 1000);

  } catch (err) {
    renderLayout(`<div class="empty-state"><p class="empty-state-title">Error starting quiz</p><p class="text-muted">${err.message}</p></div>`, 'quiz');
  }
}

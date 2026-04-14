import { renderLayout } from '../../components/layout.js';
import { results as resultsApi } from '../../utils/api.js';
import { navigate } from '../../utils/router.js';
import { formatDate, formatTime, renderCircularProgress } from '../../components/shared.js';

export async function renderStudentResults() {
  renderLayout(`<div class="loading-spinner"><div class="spinner"></div></div>`, 'results');

  try {
    const { results, stats } = await resultsApi.my();

    const content = `
      <div class="page-header">
        <div>
          <h1 class="page-title">My Results 📈</h1>
          <p class="page-subtitle">Track your quiz performance over time</p>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-grid" style="margin-bottom:var(--space-2xl);">
        <div class="stat-card blue">
          <div class="stat-card-header">
            <span class="stat-card-label">Total Quizzes</span>
            <div class="stat-card-icon">📝</div>
          </div>
          <div class="stat-card-value">${stats.totalAttempts}</div>
        </div>
        <div class="stat-card emerald">
          <div class="stat-card-header">
            <span class="stat-card-label">Average</span>
            <div class="stat-card-icon">📊</div>
          </div>
          <div class="stat-card-value">${stats.avgScore}%</div>
        </div>
        <div class="stat-card purple">
          <div class="stat-card-header">
            <span class="stat-card-label">Best Score</span>
            <div class="stat-card-icon">🏆</div>
          </div>
          <div class="stat-card-value">${stats.bestScore}%</div>
        </div>
      </div>

      ${results.length === 0
        ? '<div class="card-flat"><div class="empty-state"><div class="empty-state-icon">📝</div><p class="empty-state-title">No results yet</p><p class="text-muted">Take a quiz to see your results here!</p><button class="btn btn-primary" style="margin-top:var(--space-md);" onclick="location.hash=\'/student/quizzes\'">Browse Quizzes</button></div></div>'
        : `
          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>Quiz</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Time Taken</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${results.map(r => {
                  const pct = Math.round((r.score / r.total_points) * 100);
                  const color = pct >= 80 ? 'emerald' : pct >= 50 ? 'amber' : 'rose';
                  return `
                    <tr>
                      <td style="font-weight:600;">${r.quiz_title}</td>
                      <td>${r.score}/${r.total_points}</td>
                      <td><span class="badge badge-${color}">${pct}%</span></td>
                      <td>${formatTime(r.time_taken_seconds)}</td>
                      <td style="font-size:0.8rem;color:var(--text-muted);">${formatDate(r.completed_at)}</td>
                      <td>
                        <button class="btn btn-secondary btn-sm" data-attempt="${r.id}">Review</button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `
      }
    `;

    renderLayout(content, 'results');

    document.querySelectorAll('[data-attempt]').forEach(btn => {
      btn.addEventListener('click', () => navigate(`/student/result/${btn.dataset.attempt}`));
    });

  } catch (err) {
    renderLayout(`<div class="empty-state"><p class="empty-state-title">Error loading results</p><p class="text-muted">${err.message}</p></div>`, 'results');
  }
}

export async function renderAttemptReview(attemptId) {
  renderLayout(`<div class="loading-spinner"><div class="spinner"></div></div>`, 'quiz-result');

  try {
    const { attempt, answers, percentage } = await resultsApi.attempt(attemptId);

    const color = percentage >= 80 ? 'var(--accent-emerald)' : percentage >= 50 ? 'var(--accent-amber)' : 'var(--accent-rose)';
    const grade = percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B' : percentage >= 60 ? 'C' : percentage >= 50 ? 'D' : 'F';

    const content = `
      <div style="margin-bottom:var(--space-xl);">
        <button class="btn btn-ghost btn-sm" id="back-btn">← Back to Results</button>
      </div>

      <!-- Score Summary -->
      <div class="card-flat" style="text-align:center;padding:var(--space-2xl);margin-bottom:var(--space-2xl);">
        <h2 style="margin-bottom:var(--space-xs);">${attempt.quiz_title}</h2>
        <p class="text-muted" style="margin-bottom:var(--space-xl);">Quiz completed on ${formatDate(attempt.completed_at)}</p>

        <div style="display:flex;justify-content:center;margin-bottom:var(--space-xl);" id="score-circle"></div>

        <div style="display:flex;justify-content:center;gap:var(--space-2xl);flex-wrap:wrap;">
          <div>
            <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:2px;">Score</div>
            <div style="font-size:1.3rem;font-weight:700;">${attempt.score}/${attempt.total_points}</div>
          </div>
          <div>
            <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:2px;">Grade</div>
            <div style="font-size:1.3rem;font-weight:700;color:${color};">${grade}</div>
          </div>
          <div>
            <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:2px;">Time Taken</div>
            <div style="font-size:1.3rem;font-weight:700;">${formatTime(attempt.time_taken_seconds)}</div>
          </div>
          <div>
            <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:2px;">Time Limit</div>
            <div style="font-size:1.3rem;font-weight:700;">${attempt.time_limit_minutes}:00</div>
          </div>
        </div>
      </div>

      <!-- Progress bar -->
      <div class="card-flat" style="margin-bottom:var(--space-2xl);">
        <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-sm);">
          <span style="font-size:0.85rem;color:var(--text-muted);">Correct: ${answers.filter(a => a.is_correct).length}</span>
          <span style="font-size:0.85rem;color:var(--text-muted);">Incorrect: ${answers.filter(a => !a.is_correct).length}</span>
        </div>
        <div class="progress-bar" style="height:12px;">
          <div class="progress-bar-fill ${percentage >= 70 ? 'success' : percentage >= 50 ? 'warning' : 'danger'}" style="width:${percentage}%;"></div>
        </div>
      </div>

      <!-- Question Review -->
      <div class="section-header">
        <h3 class="section-title">📋 Question Review</h3>
      </div>

      <div style="display:flex;flex-direction:column;gap:var(--space-lg);">
        ${answers.map((a, i) => `
          <div class="card-flat" style="border-left:3px solid ${a.is_correct ? 'var(--accent-emerald)' : 'var(--accent-rose)'};">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:var(--space-md);">
              <div class="question-number" style="margin-bottom:0;">Question ${i + 1}</div>
              <span class="badge ${a.is_correct ? 'badge-emerald' : 'badge-rose'}">
                ${a.is_correct ? '✓ Correct' : '✗ Incorrect'}
              </span>
            </div>
            <div class="question-text" style="font-size:1rem;margin-bottom:var(--space-md);">${a.question_text}</div>
            <div class="options-list" style="gap:var(--space-sm);">
              ${['A', 'B', 'C', 'D'].map(letter => {
                const optionKey = `option_${letter.toLowerCase()}`;
                let cls = 'option-item';
                if (letter === a.correct_option) cls += ' correct';
                else if (letter === a.selected_option && !a.is_correct) cls += ' incorrect';
                return `
                  <div class="${cls}" style="cursor:default;">
                    <div class="option-letter">${letter}</div>
                    <div class="option-text">${a[optionKey]}</div>
                    ${letter === a.correct_option ? '<span style="margin-left:auto;font-size:0.8rem;color:var(--accent-emerald);">✓ Correct</span>' : ''}
                    ${letter === a.selected_option && letter !== a.correct_option ? '<span style="margin-left:auto;font-size:0.8rem;color:var(--accent-rose);">Your answer</span>' : ''}
                  </div>
                `;
              }).join('')}
            </div>
            ${a.explanation ? `
              <div class="explanation-box" style="margin-top:var(--space-md);">
                <strong>💡 Explanation:</strong> ${a.explanation}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;

    renderLayout(content, 'quiz-result');

    // Render score circle
    const scoreCircle = document.getElementById('score-circle');
    if (scoreCircle) renderCircularProgress(scoreCircle, percentage);

    document.getElementById('back-btn').addEventListener('click', () => navigate('/student/results'));

  } catch (err) {
    renderLayout(`<div class="empty-state"><p class="empty-state-title">Error loading result</p><p class="text-muted">${err.message}</p></div>`, 'quiz-result');
  }
}

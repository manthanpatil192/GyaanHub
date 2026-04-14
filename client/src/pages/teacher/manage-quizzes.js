import { renderLayout } from '../../components/layout.js';
import { quizzes as quizzesApi, results as resultsApi } from '../../utils/api.js';
import { navigate } from '../../utils/router.js';
import { showToast, formatDate } from '../../components/shared.js';

export async function renderManageQuizzes() {
  renderLayout(`<div class="loading-spinner"><div class="spinner"></div></div>`, 'quizzes');

  try {
    const quizzesList = await quizzesApi.list();

    const content = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Manage Quizzes 📝</h1>
          <p class="page-subtitle">View, edit, and manage your quizzes</p>
        </div>
        <button class="btn btn-primary" onclick="location.hash='/teacher/create-quiz'">✏️ Create New Quiz</button>
      </div>

      ${quizzesList.length === 0
        ? `<div class="card-flat"><div class="empty-state">
            <div class="empty-state-icon">📝</div>
            <p class="empty-state-title">No quizzes yet</p>
            <p class="text-muted">Create your first quiz to get started!</p>
            <button class="btn btn-primary" style="margin-top:var(--space-md);" onclick="location.hash='/teacher/create-quiz'">Create Quiz</button>
          </div></div>`
        : `
          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>Quiz</th>
                  <th>Module</th>
                  <th>Questions</th>
                  <th>Time</th>
                  <th>Attempts</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${quizzesList.map(q => `
                  <tr>
                    <td>
                      <div style="font-weight:600;">${q.title}</div>
                      <div style="font-size:0.75rem;color:var(--text-muted);">${formatDate(q.created_at)}</div>
                    </td>
                    <td>${q.module_title || '—'}</td>
                    <td>${q.question_count}</td>
                    <td>${q.time_limit_minutes} min</td>
                    <td>${q.attempt_count || 0}</td>
                    <td>
                      <span class="badge ${q.is_active ? 'badge-emerald' : 'badge-rose'}">
                        ${q.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style="display:flex;gap:var(--space-xs);">
                        <button class="btn btn-secondary btn-sm view-results" data-quiz-id="${q.id}" title="View Results">📊</button>
                        <button class="btn btn-secondary btn-sm toggle-status" data-quiz-id="${q.id}" data-active="${q.is_active}" title="${q.is_active ? 'Deactivate' : 'Activate'}">
                          ${q.is_active ? '⏸️' : '▶️'}
                        </button>
                        <button class="btn btn-danger btn-sm delete-quiz" data-quiz-id="${q.id}" data-title="${q.title}" title="Delete">🗑️</button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `
      }
    `;

    renderLayout(content, 'quizzes');

    // View results
    document.querySelectorAll('.view-results').forEach(btn => {
      btn.addEventListener('click', () => navigate(`/teacher/quiz-results/${btn.dataset.quizId}`));
    });

    // Toggle status
    document.querySelectorAll('.toggle-status').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          const newStatus = btn.dataset.active === '1' ? 0 : 1;
          await quizzesApi.update(btn.dataset.quizId, { is_active: newStatus });
          showToast(newStatus ? 'Quiz activated' : 'Quiz deactivated', 'success');
          renderManageQuizzes(); // Refresh
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });

    // Delete
    document.querySelectorAll('.delete-quiz').forEach(btn => {
      btn.addEventListener('click', () => {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
          <div class="modal">
            <h3>🗑️ Delete Quiz?</h3>
            <p>Are you sure you want to delete "<strong>${btn.dataset.title}</strong>"? This will also delete all student attempts.</p>
            <div class="modal-actions">
              <button class="btn btn-secondary" id="modal-cancel">Cancel</button>
              <button class="btn btn-danger" id="modal-confirm">Delete</button>
            </div>
          </div>
        `;
        document.body.appendChild(overlay);

        document.getElementById('modal-cancel').addEventListener('click', () => overlay.remove());
        document.getElementById('modal-confirm').addEventListener('click', async () => {
          overlay.remove();
          try {
            await quizzesApi.delete(btn.dataset.quizId);
            showToast('Quiz deleted', 'success');
            renderManageQuizzes();
          } catch (err) {
            showToast(err.message, 'error');
          }
        });
      });
    });

  } catch (err) {
    renderLayout(`<div class="empty-state"><p class="empty-state-title">Error loading quizzes</p><p class="text-muted">${err.message}</p></div>`, 'quizzes');
  }
}

export async function renderQuizResults(quizId) {
  renderLayout(`<div class="loading-spinner"><div class="spinner"></div></div>`, 'quizzes');

  try {
    const { quiz, results, stats } = await resultsApi.quiz(quizId);

    const content = `
      <div style="margin-bottom:var(--space-xl);">
        <button class="btn btn-ghost btn-sm" id="back-btn">← Back to Quizzes</button>
      </div>

      <div class="page-header">
        <div>
          <h1 class="page-title">${quiz.title} — Results</h1>
          <p class="page-subtitle">Student performance overview for this quiz</p>
        </div>
      </div>

      <div class="stats-grid" style="margin-bottom:var(--space-2xl);">
        <div class="stat-card blue">
          <div class="stat-card-header">
            <span class="stat-card-label">Total Attempts</span>
            <div class="stat-card-icon">📝</div>
          </div>
          <div class="stat-card-value">${stats.totalAttempts}</div>
        </div>
        <div class="stat-card emerald">
          <div class="stat-card-header">
            <span class="stat-card-label">Avg Score</span>
            <div class="stat-card-icon">📊</div>
          </div>
          <div class="stat-card-value">${stats.avgScore}/${quiz.total_points}</div>
        </div>
        <div class="stat-card purple">
          <div class="stat-card-header">
            <span class="stat-card-label">Highest</span>
            <div class="stat-card-icon">🏆</div>
          </div>
          <div class="stat-card-value">${stats.highestScore}/${quiz.total_points}</div>
        </div>
        <div class="stat-card amber">
          <div class="stat-card-header">
            <span class="stat-card-label">Lowest</span>
            <div class="stat-card-icon">📉</div>
          </div>
          <div class="stat-card-value">${stats.lowestScore}/${quiz.total_points}</div>
        </div>
      </div>

      ${results.length === 0
        ? '<div class="card-flat"><div class="empty-state"><p class="text-muted">No attempts yet</p></div></div>'
        : `
          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Student</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Time Taken</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                ${results.map((r, i) => {
                  const pct = Math.round((r.score / r.total_points) * 100);
                  const color = pct >= 80 ? 'emerald' : pct >= 50 ? 'amber' : 'rose';
                  const mins = Math.floor(r.time_taken_seconds / 60);
                  const secs = r.time_taken_seconds % 60;
                  return `
                    <tr>
                      <td>${i + 1}</td>
                      <td>
                        <div style="font-weight:600;">${r.student_name}</div>
                        <div style="font-size:0.75rem;color:var(--text-muted);">@${r.student_username}</div>
                      </td>
                      <td>${r.score}/${r.total_points}</td>
                      <td><span class="badge badge-${color}">${pct}%</span></td>
                      <td>${mins}:${secs.toString().padStart(2, '0')}</td>
                      <td style="font-size:0.8rem;color:var(--text-muted);">${formatDate(r.completed_at)}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `
      }
    `;

    renderLayout(content, 'quizzes');

    document.getElementById('back-btn').addEventListener('click', () => navigate('/teacher/quizzes'));

  } catch (err) {
    renderLayout(`<div class="empty-state"><p class="empty-state-title">Error loading results</p><p class="text-muted">${err.message}</p></div>`, 'quizzes');
  }
}

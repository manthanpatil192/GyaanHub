import { renderLayout } from '../../components/layout.js';
import { results as resultsApi, quizzes as quizzesApi } from '../../utils/api.js';
import { getUser } from '../../utils/auth.js';
import { navigate } from '../../utils/router.js';
import { formatDate, renderBarChart, renderCircularProgress } from '../../components/shared.js';

export async function renderStudentDashboard() {
  const user = getUser();

  renderLayout(`<div class="loading-spinner"><div class="spinner"></div></div>`, 'dashboard');

  try {
    const [resultsData, quizzesList] = await Promise.all([
      resultsApi.my(),
      quizzesApi.list()
    ]);

    const { results: myResults, stats } = resultsData;
    const availableQuizzes = quizzesList.filter(q => !q.completed_attempt_id);

    const content = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Welcome back, ${user.full_name.split(' ')[0]}! 👋</h1>
          <p class="page-subtitle">Track your DBMS learning progress and take quizzes</p>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-grid" style="margin-bottom:var(--space-2xl);">
        <div class="stat-card blue">
          <div class="stat-card-header">
            <span class="stat-card-label">Quizzes Taken</span>
            <div class="stat-card-icon">📝</div>
          </div>
          <div class="stat-card-value">${stats.totalAttempts}</div>
        </div>
        <div class="stat-card emerald">
          <div class="stat-card-header">
            <span class="stat-card-label">Average Score</span>
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
        <div class="stat-card amber">
          <div class="stat-card-header">
            <span class="stat-card-label">Available Quizzes</span>
            <div class="stat-card-icon">🎯</div>
          </div>
          <div class="stat-card-value">${availableQuizzes.length}</div>
        </div>
      </div>

      <div class="grid-2">
        <!-- Available Quizzes -->
        <div>
          <div class="section-header">
            <h3 class="section-title">📝 Available Quizzes</h3>
            <button class="btn btn-secondary btn-sm" onclick="location.hash='/student/quizzes'">View All</button>
          </div>
          ${availableQuizzes.length === 0
            ? '<div class="card-flat"><div class="empty-state"><p class="empty-state-title">All quizzes completed! 🎉</p><p class="text-muted">Check back later for new quizzes.</p></div></div>'
            : availableQuizzes.slice(0, 3).map(q => `
              <div class="quiz-card" style="margin-bottom:var(--space-md);cursor:pointer;" data-quiz-id="${q.id}">
                <div class="quiz-card-header">
                  <div>
                    <div class="quiz-card-title">${q.title}</div>
                    <p class="text-muted" style="font-size:0.85rem;margin-top:4px;">${q.description}</p>
                  </div>
                </div>
                <div class="quiz-card-meta">
                  <span>⏱️ ${q.time_limit_minutes} min</span>
                  <span>❓ ${q.question_count} questions</span>
                  <span>📚 ${q.module_title || 'General'}</span>
                </div>
              </div>
            `).join('')
          }
        </div>

        <!-- Recent Results -->
        <div>
          <div class="section-header">
            <h3 class="section-title">📈 Recent Results</h3>
            <button class="btn btn-secondary btn-sm" onclick="location.hash='/student/results'">View All</button>
          </div>
          ${myResults.length === 0
            ? '<div class="card-flat"><div class="empty-state"><p class="empty-state-title">No results yet</p><p class="text-muted">Take a quiz to see your performance!</p></div></div>'
            : `<div class="table-container">
              <table class="table">
                <thead>
                  <tr>
                    <th>Quiz</th>
                    <th>Score</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  ${myResults.slice(0, 5).map(r => {
                    const pct = Math.round((r.score / r.total_points) * 100);
                    const color = pct >= 80 ? 'emerald' : pct >= 50 ? 'amber' : 'rose';
                    return `
                      <tr style="cursor:pointer;" data-attempt="${r.id}">
                        <td>${r.quiz_title}</td>
                        <td><span class="badge badge-${color}">${r.score}/${r.total_points} (${pct}%)</span></td>
                        <td style="font-size:0.8rem;color:var(--text-muted);">${formatDate(r.completed_at)}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>`
          }
        </div>
      </div>

      ${myResults.length > 0 ? `
        <div style="margin-top:var(--space-2xl);">
          <div class="section-header">
            <h3 class="section-title">📊 Performance Trend</h3>
          </div>
          <div class="card-flat">
            <div id="performance-chart"></div>
          </div>
        </div>
      ` : ''}
    `;

    renderLayout(content, 'dashboard');

    // Render chart
    if (myResults.length > 0) {
      const chartContainer = document.getElementById('performance-chart');
      if (chartContainer) {
        const chartData = myResults.slice(0, 8).reverse().map(r => ({
          label: r.quiz_title.length > 10 ? r.quiz_title.slice(0, 10) + '…' : r.quiz_title,
          value: Math.round((r.score / r.total_points) * 100)
        }));
        renderBarChart(chartContainer, chartData, { maxValue: 100, height: 180 });
      }
    }

    // Click handlers for quizzes
    document.querySelectorAll('[data-quiz-id]').forEach(card => {
      card.addEventListener('click', () => {
        navigate(`/student/quiz/${card.dataset.quizId}`);
      });
    });

    // Click handlers for results
    document.querySelectorAll('[data-attempt]').forEach(row => {
      row.addEventListener('click', () => {
        navigate(`/student/result/${row.dataset.attempt}`);
      });
    });

  } catch (err) {
    renderLayout(`<div class="empty-state"><p class="empty-state-title">Error loading dashboard</p><p class="text-muted">${err.message}</p></div>`, 'dashboard');
  }
}

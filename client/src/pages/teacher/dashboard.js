import { renderLayout } from '../../components/layout.js';
import { quizzes as quizzesApi, results as resultsApi } from '../../utils/api.js';
import { getUser } from '../../utils/auth.js';
import { navigate } from '../../utils/router.js';
import { renderBarChart } from '../../components/shared.js';

export async function renderTeacherDashboard() {
  const user = getUser();

  renderLayout(`<div class="loading-spinner"><div class="spinner"></div></div>`, 'dashboard');

  try {
    const [quizzesList, students] = await Promise.all([
      quizzesApi.list(),
      resultsApi.students()
    ]);

    const activeQuizzes = quizzesList.filter(q => q.is_active);
    const totalStudents = students.length;
    const totalAttempts = students.reduce((sum, s) => sum + s.quizzes_taken, 0);
    const avgScore = students.length > 0
      ? Math.round(students.reduce((sum, s) => sum + (s.avg_percentage || 0), 0) / students.length)
      : 0;

    const content = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Welcome, ${user.full_name.split(' ')[0]}! 👨‍🏫</h1>
          <p class="page-subtitle">Manage your DBMS course — quizzes, modules, and student performance</p>
        </div>
        <div style="display:flex;gap:var(--space-sm);">
          <button class="btn btn-primary" id="create-quiz-btn">✏️ Create Quiz</button>
          <button class="btn btn-secondary" id="manage-materials-btn">📂 Manage Materials</button>
          <button class="btn btn-secondary" id="create-module-btn">📚 Add Module</button>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-grid" style="margin-bottom:var(--space-2xl);">
        <div class="stat-card blue">
          <div class="stat-card-header">
            <span class="stat-card-label">Total Students</span>
            <div class="stat-card-icon">👥</div>
          </div>
          <div class="stat-card-value">${totalStudents}</div>
        </div>
        <div class="stat-card emerald">
          <div class="stat-card-header">
            <span class="stat-card-label">Active Quizzes</span>
            <div class="stat-card-icon">📝</div>
          </div>
          <div class="stat-card-value">${activeQuizzes.length}</div>
        </div>
        <div class="stat-card purple">
          <div class="stat-card-header">
            <span class="stat-card-label">Total Attempts</span>
            <div class="stat-card-icon">📊</div>
          </div>
          <div class="stat-card-value">${totalAttempts}</div>
        </div>
        <div class="stat-card amber">
          <div class="stat-card-header">
            <span class="stat-card-label">Avg Class Score</span>
            <div class="stat-card-icon">🎯</div>
          </div>
          <div class="stat-card-value">${avgScore}%</div>
        </div>
      </div>

      <div class="grid-2">
        <!-- Quiz Performance -->
        <div>
          <div class="section-header">
            <h3 class="section-title">📊 Quiz Performance</h3>
          </div>
          <div class="card-flat">
            ${quizzesList.length > 0
              ? '<div id="quiz-chart"></div>'
              : '<div class="empty-state"><p class="text-muted">No quizzes yet</p></div>'
            }
          </div>
        </div>

        <!-- Top Students -->
        <div>
          <div class="section-header">
            <h3 class="section-title">🏆 Top Students</h3>
            <button class="btn btn-secondary btn-sm" onclick="location.hash='/teacher/students'">View All</button>
          </div>
          ${students.length === 0
            ? '<div class="card-flat"><div class="empty-state"><p class="text-muted">No student data yet</p></div></div>'
            : `
              <div class="table-container">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Quizzes</th>
                      <th>Avg Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${students.slice(0, 5).map((s, i) => {
                      const pct = Math.round(s.avg_percentage || 0);
                      const badge = pct >= 80 ? 'badge-emerald' : pct >= 50 ? 'badge-amber' : 'badge-rose';
                      return `
                        <tr>
                          <td>
                            <div style="display:flex;align-items:center;gap:8px;">
                              <span style="font-size:1.1rem;">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  '}</span>
                              <div>
                                <div style="font-weight:600;">${s.full_name}</div>
                                <div style="font-size:0.75rem;color:var(--text-muted);">@${s.username}</div>
                              </div>
                            </div>
                          </td>
                          <td>${s.quizzes_taken}</td>
                          <td><span class="badge ${badge}">${pct}%</span></td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            `
          }
        </div>
      </div>

      <!-- Recent Quizzes -->
      <div style="margin-top:var(--space-2xl);">
        <div class="section-header">
          <h3 class="section-title">📝 Recent Quizzes</h3>
          <button class="btn btn-secondary btn-sm" onclick="location.hash='/teacher/quizzes'">Manage All</button>
        </div>
        <div class="grid-auto">
          ${quizzesList.slice(0, 3).map(q => `
            <div class="quiz-card">
              <div class="quiz-card-header">
                <div class="quiz-card-title">${q.title}</div>
                <span class="badge ${q.is_active ? 'badge-emerald' : 'badge-rose'}">${q.is_active ? 'Active' : 'Inactive'}</span>
              </div>
              <div class="quiz-card-meta" style="margin-top:var(--space-sm);">
                <span>⏱️ ${q.time_limit_minutes} min</span>
                <span>❓ ${q.question_count} Q</span>
                <span>👥 ${q.attempt_count || 0} attempts</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    renderLayout(content, 'dashboard');

    // Render chart
    if (quizzesList.length > 0) {
      const chartContainer = document.getElementById('quiz-chart');
      if (chartContainer) {
        const chartData = quizzesList.slice(0, 6).map(q => ({
          label: q.title.length > 12 ? q.title.slice(0, 12) + '…' : q.title,
          value: q.attempt_count || 0
        }));
        renderBarChart(chartContainer, chartData, { height: 200 });
      }
    }

    document.getElementById('create-quiz-btn').addEventListener('click', () => navigate('/teacher/create-quiz'));
    document.getElementById('manage-materials-btn').addEventListener('click', () => navigate('/teacher/materials'));
    document.getElementById('create-module-btn').addEventListener('click', () => navigate('/teacher/modules'));

  } catch (err) {
    renderLayout(`<div class="empty-state"><p class="empty-state-title">Error loading dashboard</p><p class="text-muted">${err.message}</p></div>`, 'dashboard');
  }
}

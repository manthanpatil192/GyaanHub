import { renderLayout } from '../../components/layout.js';
import { results as resultsApi } from '../../utils/api.js';
import { navigate } from '../../utils/router.js';
import { formatDate } from '../../components/shared.js';

export async function renderStudentMarks() {
  renderLayout(`<div class="loading-spinner"><div class="spinner"></div></div>`, 'students');

  try {
    const students = await resultsApi.students();

    const content = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Student Marks 👥</h1>
          <p class="page-subtitle">Overview of all student performance across quizzes</p>
        </div>
      </div>

      <!-- Summary Stats -->
      <div class="stats-grid" style="margin-bottom:var(--space-2xl);">
        <div class="stat-card blue">
          <div class="stat-card-header">
            <span class="stat-card-label">Total Students</span>
            <div class="stat-card-icon">👥</div>
          </div>
          <div class="stat-card-value">${students.length}</div>
        </div>
        <div class="stat-card emerald">
          <div class="stat-card-header">
            <span class="stat-card-label">Active Students</span>
            <div class="stat-card-icon">✅</div>
          </div>
          <div class="stat-card-value">${students.filter(s => s.quizzes_taken > 0).length}</div>
        </div>
        <div class="stat-card purple">
          <div class="stat-card-header">
            <span class="stat-card-label">Class Average</span>
            <div class="stat-card-icon">📊</div>
          </div>
          <div class="stat-card-value">${students.length > 0 ? Math.round(students.reduce((s, st) => s + (st.avg_percentage || 0), 0) / students.length) : 0}%</div>
        </div>
      </div>

      ${students.length === 0
        ? '<div class="card-flat"><div class="empty-state"><div class="empty-state-icon">👥</div><p class="empty-state-title">No students registered yet</p><p class="text-muted">Students will appear here once they create accounts.</p></div></div>'
        : `
          <!-- Search -->
          <div style="margin-bottom:var(--space-lg);">
            <input type="text" class="form-input" id="search-students" placeholder="🔍  Search students by name or username..." style="max-width:400px;" />
          </div>

          <div class="table-container">
            <table class="table" id="students-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Student</th>
                  <th>Email</th>
                  <th>Quizzes Taken</th>
                  <th>Avg Score</th>
                  <th>Best Score</th>
                  <th>Last Activity</th>
                </tr>
              </thead>
              <tbody id="students-tbody">
                ${students.map((s, i) => {
                  const avg = Math.round(s.avg_percentage || 0);
                  const best = Math.round(s.best_percentage || 0);
                  const avgBadge = avg >= 80 ? 'badge-emerald' : avg >= 50 ? 'badge-amber' : avg > 0 ? 'badge-rose' : 'badge-blue';
                  const rankEmoji = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;
                  return `
                    <tr data-name="${s.full_name.toLowerCase()}" data-username="${s.username.toLowerCase()}">
                      <td style="font-size:1.1rem;text-align:center;">${rankEmoji}</td>
                      <td>
                        <div style="display:flex;align-items:center;gap:8px;">
                          <div style="width:36px;height:36px;border-radius:50%;background:var(--gradient-blue);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.8rem;flex-shrink:0;">
                            ${s.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style="font-weight:600;">${s.full_name}</div>
                            <div style="font-size:0.75rem;color:var(--text-muted);">@${s.username}</div>
                          </div>
                        </div>
                      </td>
                      <td style="font-size:0.85rem;color:var(--text-muted);">${s.email}</td>
                      <td style="text-align:center;">${s.quizzes_taken}</td>
                      <td><span class="badge ${avgBadge}">${avg}%</span></td>
                      <td><span class="badge badge-purple">${best}%</span></td>
                      <td style="font-size:0.8rem;color:var(--text-muted);">
                        ${s.last_activity ? formatDate(s.last_activity) : 'Never'}
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

    renderLayout(content, 'students');

    // Search
    const searchInput = document.getElementById('search-students');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        document.querySelectorAll('#students-tbody tr').forEach(row => {
          const name = row.dataset.name;
          const username = row.dataset.username;
          row.style.display = (name.includes(query) || username.includes(query)) ? '' : 'none';
        });
      });
    }

  } catch (err) {
    renderLayout(`<div class="empty-state"><p class="empty-state-title">Error loading student data</p><p class="text-muted">${err.message}</p></div>`, 'students');
  }
}

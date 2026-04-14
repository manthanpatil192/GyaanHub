import { renderLayout } from '../../components/layout.js';
import { modules as modulesApi } from '../../utils/api.js';
import { navigate } from '../../utils/router.js';
import { markdownToHtml, showToast } from '../../components/shared.js';

export async function renderStudentModules() {
  renderLayout(`<div class="loading-spinner"><div class="spinner"></div></div>`, 'modules');

  try {
    const modulesList = await modulesApi.list();

    const categories = [...new Set(modulesList.map(m => m.category))];

    const content = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Learning Modules 📚</h1>
          <p class="page-subtitle">Explore DBMS concepts through structured learning modules</p>
        </div>
      </div>

      <!-- Category Filter -->
      <div style="display:flex;gap:var(--space-sm);margin-bottom:var(--space-xl);flex-wrap:wrap;">
        <button class="btn btn-secondary btn-sm category-filter active" data-category="all">All</button>
        ${categories.map(c => `
          <button class="btn btn-secondary btn-sm category-filter" data-category="${c}">${c}</button>
        `).join('')}
      </div>

      <!-- Modules Grid -->
      <div class="grid-auto" id="modules-grid">
        ${modulesList.map(m => {
          const diffBadge = m.difficulty === 'beginner' ? 'badge-emerald' :
                           m.difficulty === 'intermediate' ? 'badge-amber' : 'badge-rose';
          return `
            <div class="module-card" data-module-id="${m.id}" data-category="${m.category}">
              <div class="module-card-icon">${m.icon}</div>
              <div class="module-card-title">${m.title}</div>
              <div class="module-card-desc">${m.description}</div>
              <div class="module-card-footer">
                <span class="badge ${diffBadge}">${m.difficulty}</span>
                <span style="font-size:0.8rem;color:var(--text-muted);">${m.quiz_count} quiz${m.quiz_count !== 1 ? 'zes' : ''}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    renderLayout(content, 'modules');

    // Category filter
    document.querySelectorAll('.category-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.category-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const category = btn.dataset.category;

        document.querySelectorAll('.module-card').forEach(card => {
          if (category === 'all' || card.dataset.category === category) {
            card.style.display = '';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });

    // Click to view module
    document.querySelectorAll('.module-card').forEach(card => {
      card.addEventListener('click', () => {
        navigate(`/student/module/${card.dataset.moduleId}`);
      });
    });

  } catch (err) {
    renderLayout(`<div class="empty-state"><p class="empty-state-title">Error loading modules</p><p class="text-muted">${err.message}</p></div>`, 'modules');
  }
}

export async function renderModuleDetail(moduleId) {
  renderLayout(`<div class="loading-spinner"><div class="spinner"></div></div>`, 'module-detail');

  try {
    const mod = await modulesApi.get(moduleId);
    const diffBadge = mod.difficulty === 'beginner' ? 'badge-emerald' :
                     mod.difficulty === 'intermediate' ? 'badge-amber' : 'badge-rose';

    const content = `
      <div style="margin-bottom:var(--space-xl);">
        <button class="btn btn-ghost btn-sm" id="back-btn">← Back to Modules</button>
      </div>

      <div class="card-flat" style="margin-bottom:var(--space-xl);">
        <div style="display:flex;align-items:center;gap:var(--space-md);margin-bottom:var(--space-lg);">
          <span style="font-size:2.5rem;">${mod.icon}</span>
          <div>
            <h1 class="page-title">${mod.title}</h1>
            <p class="page-subtitle">${mod.description}</p>
            <div style="display:flex;gap:var(--space-sm);margin-top:var(--space-sm);">
              <span class="badge ${diffBadge}">${mod.difficulty}</span>
              <span class="badge badge-blue">${mod.category}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="card-flat">
        <div class="module-content">
          ${markdownToHtml(mod.content)}
        </div>
      </div>

      ${mod.quizzes && mod.quizzes.length > 0 ? `
        <div style="margin-top:var(--space-2xl);">
          <div class="section-header">
            <h3 class="section-title">📝 Related Quizzes</h3>
          </div>
          <div class="grid-auto">
            ${mod.quizzes.map(q => `
              <div class="quiz-card" style="cursor:pointer;" data-quiz-id="${q.id}">
                <div class="quiz-card-title">${q.title}</div>
                <p class="text-muted" style="font-size:0.85rem;margin-top:4px;">${q.description}</p>
                <div class="quiz-card-meta" style="margin-top:var(--space-md);">
                  <span>⏱️ ${q.time_limit_minutes} min</span>
                  <span>🏆 ${q.total_points} points</span>
                </div>
                <button class="btn btn-primary btn-sm" style="margin-top:var(--space-md);width:100%;">Take Quiz →</button>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;

    renderLayout(content, 'module-detail');

    document.getElementById('back-btn').addEventListener('click', () => navigate('/student/modules'));

    document.querySelectorAll('[data-quiz-id]').forEach(card => {
      card.addEventListener('click', () => navigate(`/student/quiz/${card.dataset.quizId}`));
    });

  } catch (err) {
    renderLayout(`<div class="empty-state"><p class="empty-state-title">Error loading module</p><p class="text-muted">${err.message}</p></div>`, 'module-detail');
  }
}

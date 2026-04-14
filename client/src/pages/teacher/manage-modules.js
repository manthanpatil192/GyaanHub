import { renderLayout } from '../../components/layout.js';
import { modules as modulesApi } from '../../utils/api.js';
import { navigate } from '../../utils/router.js';
import { showToast, formatDate } from '../../components/shared.js';

export async function renderManageModules() {
  renderLayout(`<div class="loading-spinner"><div class="spinner"></div></div>`, 'modules');

  try {
    const modulesList = await modulesApi.list();

    let showForm = false;
    let editingModule = null;

    function render() {
      const content = `
        <div class="page-header">
          <div>
            <h1 class="page-title">Learning Modules 📚</h1>
            <p class="page-subtitle">Create and manage DBMS learning content</p>
          </div>
          <button class="btn btn-primary" id="add-module-btn">
            ${showForm ? '✕ Close' : '➕ Add Module'}
          </button>
        </div>

        ${showForm ? renderModuleForm(editingModule) : ''}

        <div class="grid-auto" id="modules-grid">
          ${modulesList.map(m => {
            const diffBadge = m.difficulty === 'beginner' ? 'badge-emerald' :
                             m.difficulty === 'intermediate' ? 'badge-amber' : 'badge-rose';
            return `
              <div class="module-card" style="cursor:default;">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                  <div class="module-card-icon">${m.icon}</div>
                  <div style="display:flex;gap:4px;">
                    <button class="btn btn-ghost btn-sm edit-module" data-id="${m.id}" title="Edit">✏️</button>
                    <button class="btn btn-ghost btn-sm delete-module" data-id="${m.id}" data-title="${m.title}" title="Delete">🗑️</button>
                  </div>
                </div>
                <div class="module-card-title">${m.title}</div>
                <div class="module-card-desc">${m.description}</div>
                <div class="module-card-footer">
                  <span class="badge ${diffBadge}">${m.difficulty}</span>
                  <span class="badge badge-blue">${m.category}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;

      const main = document.querySelector('.layout-content');
      if (main) {
        main.innerHTML = content;
      } else {
        renderLayout(content, 'modules');
      }

      bindEvents();
    }

    function renderModuleForm(module) {
      return `
        <div class="card-flat" style="margin-bottom:var(--space-xl);">
          <h3 style="margin-bottom:var(--space-lg);">${module ? '✏️ Edit Module' : '➕ New Module'}</h3>
          <form id="module-form">
            <div class="form-group">
              <label class="form-label">Title *</label>
              <input type="text" class="form-input" id="mod-title" value="${module?.title || ''}" placeholder="e.g., Advanced SQL Joins" required />
            </div>
            <div class="form-group">
              <label class="form-label">Description *</label>
              <textarea class="form-textarea" id="mod-desc" placeholder="Brief description..." required style="min-height:60px;">${module?.description || ''}</textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Category *</label>
                <input type="text" class="form-input" id="mod-category" value="${module?.category || ''}" placeholder="e.g., SQL, Normalization" required />
              </div>
              <div class="form-group">
                <label class="form-label">Difficulty *</label>
                <select class="form-select" id="mod-difficulty" required>
                  <option value="beginner" ${module?.difficulty === 'beginner' ? 'selected' : ''}>Beginner</option>
                  <option value="intermediate" ${module?.difficulty === 'intermediate' ? 'selected' : ''}>Intermediate</option>
                  <option value="advanced" ${module?.difficulty === 'advanced' ? 'selected' : ''}>Advanced</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Icon (emoji)</label>
              <input type="text" class="form-input" id="mod-icon" value="${module?.icon || '📚'}" placeholder="📚" style="width:80px;" />
            </div>
            <div class="form-group">
              <label class="form-label">Content (Markdown) *</label>
              <textarea class="form-textarea" id="mod-content" placeholder="Write module content using Markdown..." required style="min-height:300px;font-family:var(--font-mono);font-size:0.85rem;">${module?.content || ''}</textarea>
            </div>
            <div style="display:flex;gap:var(--space-md);justify-content:flex-end;">
              <button type="button" class="btn btn-secondary" id="cancel-form">Cancel</button>
              <button type="submit" class="btn btn-success" id="save-module-btn">
                ${module ? 'Update Module' : 'Create Module'}
              </button>
            </div>
          </form>
        </div>
      `;
    }

    function bindEvents() {
      // Toggle form
      document.getElementById('add-module-btn')?.addEventListener('click', () => {
        showForm = !showForm;
        editingModule = null;
        render();
      });

      // Cancel form
      document.getElementById('cancel-form')?.addEventListener('click', () => {
        showForm = false;
        editingModule = null;
        render();
      });

      // Edit module
      document.querySelectorAll('.edit-module').forEach(btn => {
        btn.addEventListener('click', async () => {
          try {
            editingModule = await modulesApi.get(btn.dataset.id);
            showForm = true;
            render();
          } catch (err) {
            showToast(err.message, 'error');
          }
        });
      });

      // Delete module
      document.querySelectorAll('.delete-module').forEach(btn => {
        btn.addEventListener('click', () => {
          const overlay = document.createElement('div');
          overlay.className = 'modal-overlay';
          overlay.innerHTML = `
            <div class="modal">
              <h3>🗑️ Delete Module?</h3>
              <p>Are you sure you want to delete "<strong>${btn.dataset.title}</strong>"?</p>
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
              await modulesApi.delete(btn.dataset.id);
              showToast('Module deleted', 'success');
              modulesList.splice(modulesList.findIndex(m => m.id === btn.dataset.id), 1);
              render();
            } catch (err) {
              showToast(err.message, 'error');
            }
          });
        });
      });

      // Submit form
      document.getElementById('module-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = {
          title: document.getElementById('mod-title').value,
          description: document.getElementById('mod-desc').value,
          content: document.getElementById('mod-content').value,
          category: document.getElementById('mod-category').value,
          difficulty: document.getElementById('mod-difficulty').value,
          icon: document.getElementById('mod-icon').value || '📚'
        };

        const btn = document.getElementById('save-module-btn');
        btn.disabled = true;
        btn.textContent = 'Saving...';

        try {
          if (editingModule) {
            await modulesApi.update(editingModule.id, data);
            showToast('Module updated! ✅', 'success');
          } else {
            await modulesApi.create(data);
            showToast('Module created! 🎉', 'success');
          }
          // Refresh
          const updated = await modulesApi.list();
          modulesList.length = 0;
          modulesList.push(...updated);
          showForm = false;
          editingModule = null;
          render();
        } catch (err) {
          showToast(err.message, 'error');
          btn.disabled = false;
          btn.textContent = editingModule ? 'Update Module' : 'Create Module';
        }
      });
    }

    render();

  } catch (err) {
    renderLayout(`<div class="empty-state"><p class="empty-state-title">Error loading modules</p><p class="text-muted">${err.message}</p></div>`, 'modules');
  }
}

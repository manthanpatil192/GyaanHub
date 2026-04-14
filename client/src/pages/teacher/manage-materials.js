import { renderLayout } from '../../components/layout.js';
import { materials as materialsApi, modules as modulesApi } from '../../utils/api.js';
import { showToast } from '../../components/shared.js';

export async function renderTeacherMaterials(initialTab = 'overview') {
  renderLayout(`<div class="loading-spinner"><div class="spinner"></div></div>`, 'materials');

  try {
    const [allMaterials, allModules] = await Promise.all([
      materialsApi.list(),
      modulesApi.list()
    ]).catch(err => {
      console.error('Data fetching error:', err);
      throw new Error('Could not fetch materials or modules. Technical details: ' + err.message);
    });

    let activeTab = initialTab;

    function render() {
      const videos = allMaterials.filter(m => m.type === 'video');
      const ppts = allMaterials.filter(m => m.type === 'ppt');
      const pdfs = allMaterials.filter(m => m.type === 'pdf');
      const pqqs = allMaterials.filter(m => m.type === 'pqqs');

      const content = `
        <div class="page-header">
          <div>
            <h1 class="page-title">Manage Materials 📂</h1>
            <p class="page-subtitle">Upload PDFs, PQQ papers, videos, and manage study resources</p>
          </div>
        </div>

        <!-- Stats -->
        <div class="stats-grid" style="margin-bottom:var(--space-xl);grid-template-columns:repeat(5,1fr);">
          <div class="stat-card blue">
            <div class="stat-card-header">
              <span class="stat-card-label">Videos</span>
              <div class="stat-card-icon">🎥</div>
            </div>
            <div class="stat-card-value">${videos.length}</div>
          </div>
          <div class="stat-card purple">
            <div class="stat-card-header">
              <span class="stat-card-label">Presentations</span>
              <div class="stat-card-icon">📑</div>
            </div>
            <div class="stat-card-value">${ppts.length}</div>
          </div>
          <div class="stat-card emerald">
            <div class="stat-card-header">
              <span class="stat-card-label">PDFs / Notes</span>
              <div class="stat-card-icon">📕</div>
            </div>
            <div class="stat-card-value">${pdfs.length}</div>
          </div>
          <div class="stat-card amber">
            <div class="stat-card-header">
              <span class="stat-card-label">PQQ Papers</span>
              <div class="stat-card-icon">💰</div>
            </div>
            <div class="stat-card-value">${pqqs.length}</div>
          </div>
          <div class="stat-card indigo">
            <div class="stat-card-header">
              <span class="stat-card-label">Total</span>
              <div class="stat-card-icon">📚</div>
            </div>
            <div class="stat-card-value">${allMaterials.length}</div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tab-bar" style="margin-bottom:var(--space-xl);">
          <button class="tab-btn ${activeTab === 'overview' ? 'tab-active' : ''}" data-tab="overview">📋 All Materials</button>
          <button class="tab-btn ${activeTab === 'upload-pdf' ? 'tab-active' : ''}" data-tab="upload-pdf">📕 Upload PDF</button>
          <button class="tab-btn ${activeTab === 'upload-pqq' ? 'tab-active' : ''}" data-tab="upload-pqq">💰 PQQ Papers</button>
          <button class="tab-btn ${activeTab === 'add-video' ? 'tab-active' : ''}" data-tab="add-video">🎥 Add Video</button>
        </div>

        <div id="tab-content">
          ${activeTab === 'overview' ? renderOverview(allMaterials) : ''}
          ${activeTab === 'upload-pdf' ? renderPDFUpload() : ''}
          ${activeTab === 'upload-pqq' ? renderPQQUpload() : ''}
          ${activeTab === 'add-video' ? renderVideoForm() : ''}
        </div>
      `;

      const main = document.querySelector('.layout-content');
      if (main) {
        main.innerHTML = content;
      } else {
        renderLayout(content, 'materials');
      }
      bindEvents();
    }

    function renderOverview(mats) {
      if (mats.length === 0) {
        return `
          <div class="card-flat" style="text-align:center;padding:var(--space-3xl);">
            <div style="font-size:3rem;margin-bottom:var(--space-md);">📂</div>
            <h3>No materials yet</h3>
            <p style="color:var(--text-muted);">Upload PDFs or add video lectures to get started</p>
          </div>
        `;
      }

      return `
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Title</th>
                <th>Module</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${mats.map(m => `
                <tr>
                  <td>
                    <span style="font-size:1.3rem;">${m.type === 'video' ? '🎥' : m.type === 'ppt' ? '📑' : m.type === 'pqqs' ? '💰' : '📕'}</span>
                    <span class="badge badge-${m.type === 'video' ? 'blue' : m.type === 'ppt' ? 'purple' : m.type === 'pqqs' ? 'amber' : 'emerald'}" style="margin-left:6px;">${m.type.toUpperCase()}</span>
                    ${m.price > 0 ? `<div style="font-size:0.75rem;color:var(--accent-amber);font-weight:700;margin-top:2px;">₹${m.price}</div>` : ''}
                  </td>
                  <td>
                    <div style="font-weight:600;">${m.title}</div>
                    <div style="font-size:0.75rem;color:var(--text-muted);max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${m.description}</div>
                    ${m.original_filename ? `<div style="font-size:0.7rem;color:var(--text-muted);margin-top:2px;">📎 ${m.original_filename} (${formatSize(m.file_size)})</div>` : ''}
                  </td>
                  <td>${m.module_title ? `<span class="badge badge-blue">${m.module_title}</span>` : '<span style="color:var(--text-muted);">—</span>'}</td>
                  <td style="font-size:0.8rem;color:var(--text-muted);">${new Date(m.created_at).toLocaleDateString()}</td>
                  <td>
                    <button class="btn btn-ghost btn-sm delete-material" data-id="${m.id}" data-title="${m.title}" style="color:var(--accent-red);">🗑️</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    function renderPQQUpload() {
      return `
        <div class="grid-2" style="gap:var(--space-xl);">
          <!-- Upload Form -->
          <div class="card-flat" style="padding:var(--space-xl);">
            <h3 style="margin-bottom:var(--space-lg);display:flex;align-items:center;gap:8px;">💰 Upload PQQ Paper (Paid)</h3>

            <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:var(--space-lg);">
              These papers will be available to students for a fixed price of <strong>₹2</strong>.
            </p>

            <form id="pqq-upload-form" enctype="multipart/form-data">
              <div class="form-group">
                <label class="form-label">Paper Title *</label>
                <input type="text" class="form-input" id="pqq-title" placeholder="e.g., DBMS Spring 2023 EndSem Paper" required />
              </div>

              <div class="form-group">
                <label class="form-label">Description</label>
                <textarea class="form-textarea" id="pqq-desc" rows="2" placeholder="Tell students what this paper covers..."></textarea>
              </div>

              <div class="form-group">
                <label class="form-label">Module (optional)</label>
                <select class="form-input" id="pqq-module">
                  <option value="">— General —</option>
                  ${allModules.map(m => `<option value="${m.id}">${m.title}</option>`).join('')}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Price (Fixed)</label>
                <input type="text" class="form-input" value="₹ 2.00" disabled style="background:var(--bg-secondary);cursor:not-allowed;" />
              </div>

              <div class="form-group">
                <label class="form-label">Question Paper (PDF) *</label>
                <div id="pqq-drop-zone" style="border:2px dashed var(--accent-amber);border-radius:var(--radius-lg);padding:var(--space-2xl);text-align:center;cursor:pointer;transition:all 0.3s;background:var(--bg-glass);">
                  <div style="font-size:2.5rem;margin-bottom:var(--space-sm);" id="pqq-drop-icon">📄</div>
                  <div style="font-weight:600;margin-bottom:4px;" id="pqq-drop-text">Drop PQQ PDF here or browse</div>
                  <input type="file" id="pqq-file" accept=".pdf" style="display:none;" />
                </div>
              </div>

              <button type="submit" class="btn btn-primary" id="pqq-upload-btn" disabled style="background:var(--accent-amber);border-color:var(--accent-amber);">
                📤 Upload PQQ Paper
              </button>
            </form>
          </div>

          <!-- PQQ Info -->
          <div>
            <div class="card-flat" style="padding:var(--space-xl);margin-bottom:var(--space-lg);border-left:4px solid var(--accent-amber);">
              <h3 style="margin-bottom:var(--space-md);">💡 About PQQ Section</h3>
              <div style="font-size:0.85rem;color:var(--text-secondary);line-height:1.8;">
                <p><strong>What is PQQ?</strong></p>
                <p>Previous Question Papers (PQQ) are high-value resources. Students pay a nominal fee (₹2) to unlock access to these papers.</p>
                <p style="margin-top:var(--space-md);"><strong>Rules:</strong></p>
                <ul style="padding-left:18px;margin:var(--space-sm) 0;">
                  <li>Only PDF files are accepted</li>
                  <li>Price is currently fixed at ₹2</li>
                  <li>Once uploaded, students can see the title but not the content until payment</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    function renderPDFUpload() {
      // Existing code... (identical to current)
      return `
        <div class="grid-2" style="gap:var(--space-xl);">
          <!-- Upload Form -->
          <div class="card-flat" style="padding:var(--space-xl);">
            <h3 style="margin-bottom:var(--space-lg);display:flex;align-items:center;gap:8px;">📕 Upload PDF / Notes</h3>

            <form id="pdf-upload-form" enctype="multipart/form-data">
              <div class="form-group">
                <label class="form-label">Title *</label>
                <input type="text" class="form-input" id="pdf-title" placeholder="e.g., Unit 3 — Normalization Notes" required />
              </div>

              <div class="form-group">
                <label class="form-label">Description</label>
                <textarea class="form-textarea" id="pdf-desc" rows="2" placeholder="Brief description of the document..."></textarea>
              </div>

              <div class="form-group">
                <label class="form-label">Module (optional)</label>
                <select class="form-input" id="pdf-module">
                  <option value="">— General (no module) —</option>
                  ${allModules.map(m => `<option value="${m.id}">${m.title}</option>`).join('')}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">PDF File *</label>
                <div id="drop-zone" style="border:2px dashed var(--border-primary);border-radius:var(--radius-lg);padding:var(--space-2xl);text-align:center;cursor:pointer;transition:all 0.3s;background:var(--bg-glass);">
                  <div style="font-size:2.5rem;margin-bottom:var(--space-sm);" id="drop-icon">📄</div>
                  <div style="font-weight:600;margin-bottom:4px;" id="drop-text">Drop a PDF here or click to browse</div>
                  <div style="font-size:0.8rem;color:var(--text-muted);" id="drop-hint">Supports: PDF, PPT, PPTX, DOC, DOCX (max 20MB)</div>
                  <input type="file" id="pdf-file" accept=".pdf,.ppt,.pptx,.doc,.docx" style="display:none;" />
                </div>
              </div>

              <button type="submit" class="btn btn-primary" id="upload-btn" disabled>
                📤 Upload File
              </button>
            </form>
          </div>

          <!-- Upload Guide -->
          <div>
            <div class="card-flat" style="padding:var(--space-xl);margin-bottom:var(--space-lg);">
              <h3 style="margin-bottom:var(--space-md);">📖 Upload Guide</h3>
              <div style="font-size:0.85rem;color:var(--text-secondary);line-height:1.8;">
                <p><strong>Supported Formats:</strong></p>
                <ul style="padding-left:18px;margin:var(--space-sm) 0;">
                  <li>📕 PDF — Lecture notes, handouts, question papers</li>
                  <li>📊 PPT / PPTX — Presentation files</li>
                  <li>📝 DOC / DOCX — Word documents</li>
                </ul>
                <p style="margin-top:var(--space-md);"><strong>Tips:</strong></p>
                <ul style="padding-left:18px;margin:var(--space-sm) 0;">
                  <li>Give clear, descriptive titles for easy searching</li>
                  <li>Assign a module so students find it under the right topic</li>
                  <li>Maximum file size is 20 MB</li>
                </ul>
              </div>
            </div>

            <div class="card-flat" style="padding:var(--space-lg);background:linear-gradient(135deg,rgba(16,185,129,0.05),rgba(59,130,246,0.05));border-color:rgba(16,185,129,0.2);">
              <div style="display:flex;align-items:center;gap:var(--space-md);margin-bottom:var(--space-sm);">
                <span style="font-size:1.5rem;">💡</span>
                <strong style="color:var(--accent-emerald);">Pro Tip</strong>
              </div>
              <p style="font-size:0.85rem;color:var(--text-secondary);line-height:1.6;">
                Students can view uploaded PDFs directly in the browser. Organize your materials by module for the best student experience.
              </p>
            </div>
          </div>
        </div>
      `;
    }

    function renderVideoForm() {
      return `
        <div class="grid-2" style="gap:var(--space-xl);">
          <!-- Video Form -->
          <div class="card-flat" style="padding:var(--space-xl);">
            <h3 style="margin-bottom:var(--space-lg);display:flex;align-items:center;gap:8px;">🎥 Add Video Lecture</h3>

            <form id="video-form">
              <div class="form-group">
                <label class="form-label">Title *</label>
                <input type="text" class="form-input" id="video-title" placeholder="e.g., Normalization — 1NF to BCNF Explained" required />
              </div>

              <div class="form-group">
                <label class="form-label">YouTube URL *</label>
                <input type="url" class="form-input" id="video-url" placeholder="https://www.youtube.com/embed/..." required />
                <div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px;">
                  Use embed URL format: https://www.youtube.com/embed/VIDEO_ID
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Description</label>
                <textarea class="form-textarea" id="video-desc" rows="2" placeholder="What does this video cover?"></textarea>
              </div>

              <div class="form-group">
                <label class="form-label">Module (optional)</label>
                <select class="form-input" id="video-module">
                  <option value="">— General (no module) —</option>
                  ${allModules.map(m => `<option value="${m.id}">${m.title}</option>`).join('')}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Thumbnail URL (optional)</label>
                <input type="url" class="form-input" id="video-thumb" placeholder="https://img.youtube.com/vi/VIDEO_ID/hqdefault.jpg" />
              </div>

              <button type="submit" class="btn btn-primary" id="add-video-btn">
                ➕ Add Video
              </button>
            </form>
          </div>

          <!-- URL helper -->
          <div>
            <div class="card-flat" style="padding:var(--space-xl);margin-bottom:var(--space-lg);">
              <h3 style="margin-bottom:var(--space-md);">🔗 How to get Embed URL</h3>
              <div style="font-size:0.85rem;color:var(--text-secondary);line-height:1.8;">
                <ol style="padding-left:18px;">
                  <li>Open the YouTube video</li>
                  <li>Click <strong>Share</strong> → <strong>Embed</strong></li>
                  <li>Copy the <code>src="..."</code> URL from the embed code</li>
                  <li>Or simply replace <code>watch?v=</code> with <code>embed/</code></li>
                </ol>
                <div style="margin-top:var(--space-md);padding:10px;background:var(--bg-primary);border-radius:var(--radius-sm);font-family:var(--font-mono);font-size:0.78rem;color:var(--accent-emerald);">
                  youtube.com/watch?v=<strong>dQw4w9WgXcQ</strong><br/>
                  → youtube.com/embed/<strong>dQw4w9WgXcQ</strong>
                </div>
              </div>
            </div>

            <div class="card-flat" style="padding:var(--space-lg);background:linear-gradient(135deg,rgba(59,130,246,0.05),rgba(124,77,255,0.05));border-color:rgba(59,130,246,0.2);">
              <div style="display:flex;align-items:center;gap:var(--space-md);margin-bottom:var(--space-sm);">
                <span style="font-size:1.5rem;">🎬</span>
                <strong style="color:var(--accent-blue);">Supported Sources</strong>
              </div>
              <p style="font-size:0.85rem;color:var(--text-secondary);line-height:1.6;">
                YouTube (recommended), Vimeo, Google Drive shared videos, or any embeddable video URL.
              </p>
            </div>
          </div>
        </div>
      `;
    }

    // ============ EVENTS ============
    function bindEvents() {
      // Tab switching
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          activeTab = btn.dataset.tab;
          render();
        });
      });

      // Drop zone
      const dropZone = document.getElementById('drop-zone');
      const fileInput = document.getElementById('pdf-file');
      const uploadBtn = document.getElementById('upload-btn');

      if (dropZone && fileInput) {
        dropZone.addEventListener('click', () => fileInput.click());

        dropZone.addEventListener('dragover', (e) => {
          e.preventDefault();
          dropZone.style.borderColor = 'var(--accent-blue)';
          dropZone.style.background = 'rgba(59,130,246,0.05)';
        });

        dropZone.addEventListener('dragleave', () => {
          dropZone.style.borderColor = 'var(--border-primary)';
          dropZone.style.background = 'var(--bg-glass)';
        });

        dropZone.addEventListener('drop', (e) => {
          e.preventDefault();
          dropZone.style.borderColor = 'var(--border-primary)';
          dropZone.style.background = 'var(--bg-glass)';
          if (e.dataTransfer.files.length > 0) {
            fileInput.files = e.dataTransfer.files;
            handleFileSelect(e.dataTransfer.files[0]);
          }
        });

        fileInput.addEventListener('change', () => {
          if (fileInput.files.length > 0) {
            handleFileSelect(fileInput.files[0]);
          }
        });
      }

      function handleFileSelect(file, type = 'pdf') {
        const iconId = type === 'pqq' ? 'pqq-drop-icon' : 'drop-icon';
        const textId = type === 'pqq' ? 'pqq-drop-text' : 'drop-text';
        const btnId = type === 'pqq' ? 'pqq-upload-btn' : 'upload-btn';

        document.getElementById(iconId).textContent = '✅';
        document.getElementById(textId).textContent = file.name;
        if (type === 'pdf') document.getElementById('drop-hint').textContent = `${formatSize(file.size)} — Click to change`;
        
        const btn = document.getElementById(btnId);
        if (btn) btn.disabled = false;
      }

      // PQQ Drop zone
      const pqqDropZone = document.getElementById('pqq-drop-zone');
      const pqqFileInput = document.getElementById('pqq-file');
      if (pqqDropZone && pqqFileInput) {
        pqqDropZone.addEventListener('click', () => pqqFileInput.click());
        pqqDropZone.addEventListener('dragover', (e) => { e.preventDefault(); pqqDropZone.style.borderColor = 'var(--accent-amber)'; });
        pqqDropZone.addEventListener('drop', (e) => {
          e.preventDefault();
          if (e.dataTransfer.files.length > 0) {
            pqqFileInput.files = e.dataTransfer.files;
            handleFileSelect(e.dataTransfer.files[0], 'pqq');
          }
        });
        pqqFileInput.addEventListener('change', () => {
          if (pqqFileInput.files.length > 0) handleFileSelect(pqqFileInput.files[0], 'pqq');
        });
      }

      // PQQ Upload form
      document.getElementById('pqq-upload-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('pqq-upload-btn');
        const file = document.getElementById('pqq-file').files[0];
        if (!file) { showToast('Please select a file', 'warning'); return; }

        btn.disabled = true;
        btn.innerHTML = '<div class="spinner" style="width:16px;height:16px;"></div> Uploading...';

        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('title', document.getElementById('pqq-title').value);
          formData.append('description', document.getElementById('pqq-desc').value);
          formData.append('module_id', document.getElementById('pqq-module').value);
          formData.append('type', 'pqqs');
          formData.append('price', '2');

          const result = await materialsApi.uploadFile(formData);
          allMaterials.unshift(result);
          showToast(`PQQ Paper "${result.title}" uploaded! 💰`, 'success');
          activeTab = 'overview';
          render();
        } catch (err) {
          showToast(`Upload failed: ${err.message}`, 'error');
          btn.disabled = false;
          btn.innerHTML = '📤 Upload PQQ Paper';
        }
      });

      // PDF Upload form
      document.getElementById('pdf-upload-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('upload-btn');
        const file = document.getElementById('pdf-file').files[0];
        if (!file) { showToast('Please select a file', 'warning'); return; }

        btn.disabled = true;
        btn.innerHTML = '<div class="spinner" style="width:16px;height:16px;"></div> Uploading...';

        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('title', document.getElementById('pdf-title').value);
          formData.append('description', document.getElementById('pdf-desc').value);
          formData.append('module_id', document.getElementById('pdf-module').value);

          const result = await materialsApi.uploadFile(formData);
          allMaterials.unshift(result);
          showToast(`"${result.title}" uploaded successfully! 📕`, 'success');
          activeTab = 'overview';
          render();
        } catch (err) {
          showToast(`Upload failed: ${err.message}`, 'error');
          btn.disabled = false;
          btn.innerHTML = '📤 Upload File';
        }
      });

      // Video form
      document.getElementById('video-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('add-video-btn');
        btn.disabled = true;
        btn.innerHTML = '<div class="spinner" style="width:16px;height:16px;"></div> Adding...';

        try {
          const data = {
            title: document.getElementById('video-title').value,
            description: document.getElementById('video-desc').value,
            url: document.getElementById('video-url').value,
            type: 'video',
            module_id: document.getElementById('video-module').value || null,
            thumbnail: document.getElementById('video-thumb').value || null
          };

          const result = await materialsApi.create(data);
          allMaterials.unshift(result);
          showToast(`Video "${result.title}" added! 🎥`, 'success');
          activeTab = 'overview';
          render();
        } catch (err) {
          showToast(`Failed: ${err.message}`, 'error');
          btn.disabled = false;
          btn.innerHTML = '➕ Add Video';
        }
      });

      // Delete material
      document.querySelectorAll('.delete-material').forEach(btn => {
        btn.addEventListener('click', async () => {
          const title = btn.dataset.title;
          if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;

          try {
            await materialsApi.delete(btn.dataset.id);
            const idx = allMaterials.findIndex(m => m.id === btn.dataset.id);
            if (idx !== -1) allMaterials.splice(idx, 1);
            showToast(`"${title}" deleted`, 'info');
            render();
          } catch (err) {
            showToast(`Delete failed: ${err.message}`, 'error');
          }
        });
      });
    }

    render();
  } catch (err) {
    renderLayout(`<div class="empty-state"><p class="empty-state-title">Error loading materials</p><p style="color:var(--text-muted);">${err.message}</p></div>`, 'materials');
  }
}

function formatSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
}

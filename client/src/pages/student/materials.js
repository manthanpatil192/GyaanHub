import { renderLayout } from '../../components/layout.js';
import { materials as materialsApi } from '../../utils/api.js';

export async function renderStudyMaterials() {
  renderLayout(`<div class="loading-spinner"><div class="spinner"></div></div>`, 'materials');

  try {
    const allMaterials = await materialsApi.list();

    const videos = allMaterials.filter(m => m.type === 'video');
    const ppts = allMaterials.filter(m => m.type === 'ppt');
    const pdfs = allMaterials.filter(m => m.type === 'pdf');

    let activeTab = 'videos';
    let expandedVideo = null;
    let activePPT = null;
    let activeSlideIndex = 0;

    function render() {
      const content = `
        <div class="page-header">
          <div>
            <h1 class="page-title">Study Materials 📖</h1>
            <p class="page-subtitle">Video lectures, presentations, and reference notes</p>
          </div>
        </div>

        <!-- Stats bar -->
        <div class="stats-grid" style="margin-bottom:var(--space-xl);grid-template-columns:repeat(4,1fr);">
          <div class="stat-card blue">
            <div class="stat-card-header">
              <span class="stat-card-label">Video Lectures</span>
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
              <span class="stat-card-label">PDF Notes</span>
              <div class="stat-card-icon">📕</div>
            </div>
            <div class="stat-card-value">${pdfs.length}</div>
          </div>
          <div class="stat-card amber">
            <div class="stat-card-header">
              <span class="stat-card-label">Overall</span>
              <div class="stat-card-icon">📚</div>
            </div>
            <div class="stat-card-value">${allMaterials.length}</div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tab-bar" style="margin-bottom:var(--space-xl);">
          <button class="tab-btn ${activeTab === 'videos' ? 'tab-active' : ''}" data-tab="videos">🎥 Videos</button>
          <button class="tab-btn ${activeTab === 'ppts' ? 'tab-active' : ''}" data-tab="ppts">📑 Presentations</button>
          <button class="tab-btn ${activeTab === 'pdfs' ? 'tab-active' : ''}" data-tab="pdfs">📕 PDF Notes</button>
          <button class="tab-btn ${activeTab === 'all' ? 'tab-active' : ''}" data-tab="all">📋 All</button>
        </div>

        <!-- Content -->
        <div id="materials-content">
          ${activeTab === 'videos' ? renderVideoSection(videos) : ''}
          ${activeTab === 'ppts' ? renderPPTSection(ppts) : ''}
          ${activeTab === 'pdfs' ? renderPDFSection(pdfs) : ''}
          ${activeTab === 'all' ? renderAllSection(allMaterials) : ''}
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

    // ============ PDF SECTION ============
    function renderPDFSection(pdfList) {
      if (pdfList.length === 0) {
        return '<div class="card-flat"><div class="empty-state"><div class="empty-state-icon">📕</div><p class="empty-state-title">No PDF notes yet</p></div></div>';
      }

      return `
        <div class="grid-auto" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr));">
          ${pdfList.map(p => `
            <div class="card-flat" style="display:flex;flex-direction:column;justify-content:space-between;padding:var(--space-lg);border-left:4px solid var(--accent-emerald);">
              <div>
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:var(--space-md);">
                  <div style="width:48px;height:48px;border-radius:12px;background:rgba(16,185,129,0.1);display:flex;align-items:center;justify-content:center;font-size:1.5rem;">📕</div>
                  <span class="badge badge-emerald">PDF</span>
                </div>
                <h3 style="font-size:1rem;margin-bottom:4px;font-weight:700;">${p.title}</h3>
                <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:var(--space-md);line-height:1.5;">${p.description}</p>
                ${p.module_title ? `<span class="badge badge-blue">${p.module_title}</span>` : ''}
              </div>
              <div style="margin-top:var(--space-lg);display:flex;gap:var(--space-sm);">
                <a href="${p.url}" target="_blank" class="btn btn-primary btn-sm" style="flex:1;">View PDF ↗</a>
                <a href="${p.url}" download class="btn btn-secondary btn-sm">💾</a>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    // [Rest of renderVideoSection, renderPPTSection, etc. from original file...]
    // ============ VIDEO SECTION ============
    function renderVideoSection(vids) {
      if (vids.length === 0) {
        return '<div class="card-flat"><div class="empty-state"><div class="empty-state-icon">🎥</div><p class="empty-state-title">No video lectures yet</p></div></div>';
      }

      return `
        ${expandedVideo ? renderVideoPlayer(expandedVideo) : ''}

        <div class="grid-auto" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr));">
          ${vids.map(v => `
            <div class="card-flat video-card" style="cursor:pointer;overflow:hidden;padding:0;transition:all 0.3s ease;" data-video-id="${v.id}">
              <div style="position:relative;width:100%;padding-bottom:56.25%;background:linear-gradient(135deg,var(--bg-primary),var(--bg-secondary));overflow:hidden;">
                ${v.thumbnail
                  ? `<img src="${v.thumbnail}" alt="${v.title}" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;opacity:0.85;transition:opacity 0.3s;" onerror="this.style.display='none'" />`
                  : ''
                }
                <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.3);">
                  <div style="width:56px;height:56px;border-radius:50%;background:rgba(124,77,255,0.9);display:flex;align-items:center;justify-content:center;font-size:1.5rem;box-shadow:0 4px 20px rgba(124,77,255,0.4);transition:transform 0.3s;">▶</div>
                </div>
              </div>
              <div style="padding:var(--space-md);">
                <div style="font-weight:700;font-size:0.95rem;margin-bottom:4px;line-height:1.4;">${v.title}</div>
                <div style="font-size:0.8rem;color:var(--text-muted);line-height:1.5;margin-bottom:8px;">${v.description.slice(0, 100)}${v.description.length > 100 ? '...' : ''}</div>
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  ${v.module_title ? `<span class="badge badge-blue">${v.module_title}</span>` : '<span class="badge badge-purple">General</span>'}
                  <span style="font-size:0.7rem;color:var(--text-muted);">by ${v.creator_name}</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    function renderVideoPlayer(video) {
      return `
        <div class="card-flat" style="margin-bottom:var(--space-xl);overflow:hidden;padding:0;">
          <div style="display:flex;justify-content:space-between;align-items:center;padding:var(--space-md) var(--space-lg);">
            <div>
              <h3 style="margin:0;">${video.title}</h3>
              <p style="color:var(--text-muted);font-size:0.85rem;margin:4px 0 0 0;">${video.description}</p>
            </div>
            <button class="btn btn-ghost btn-sm" id="close-player">✕ Close</button>
          </div>
          <div style="position:relative;width:100%;padding-bottom:56.25%;background:#000;">
            <iframe
              src="${video.url}?autoplay=1&rel=0"
              style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            ></iframe>
          </div>
        </div>
      `;
    }

    function renderPPTSection(presentations) {
      if (presentations.length === 0) {
        return '<div class="card-flat"><div class="empty-state"><div class="empty-state-icon">📑</div><p class="empty-state-title">No presentations yet</p></div></div>';
      }

      return `
        ${activePPT ? renderSlideViewer(activePPT) : ''}

        <div style="display:flex;flex-direction:column;gap:var(--space-md);">
          ${presentations.map(p => `
            <div class="card-flat ppt-card" style="display:flex;gap:var(--space-lg);align-items:center;text-decoration:none;color:inherit;transition:all 0.3s ease;cursor:pointer;" data-ppt-id="${p.id}">
              <div style="width:72px;height:72px;border-radius:var(--radius-lg);background:linear-gradient(135deg,${p.slides?.[0]?.color || '#E65100'},${adjustColor(p.slides?.[0]?.color || '#FF6D00')});display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 16px ${(p.slides?.[0]?.color || '#E65100')}40;">
                <span style="font-size:1.6rem;filter:brightness(2);">📊</span>
              </div>
              <div style="flex:1;min-width:0;">
                <div style="font-weight:700;font-size:1rem;margin-bottom:4px;">${p.title}</div>
                <div style="font-size:0.85rem;color:var(--text-muted);line-height:1.5;">${p.description}</div>
                <div style="display:flex;gap:var(--space-sm);margin-top:8px;align-items:center;">
                  ${p.module_title ? `<span class="badge badge-blue">${p.module_title}</span>` : '<span class="badge badge-purple">General</span>'}
                  <span class="badge badge-emerald">${p.slides ? p.slides.length + ' slides' : ''}</span>
                  <span style="font-size:0.7rem;color:var(--text-muted);">by ${p.creator_name}</span>
                </div>
              </div>
              <div style="flex-shrink:0;display:flex;align-items:center;gap:4px;color:var(--accent-blue);font-weight:600;font-size:0.85rem;">
                View Slides <span style="font-size:1.1rem;">→</span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    function renderSlideViewer(ppt) {
      if (!ppt.slides || ppt.slides.length === 0) return '';
      const slide = ppt.slides[activeSlideIndex];
      const total = ppt.slides.length;
      const progress = ((activeSlideIndex + 1) / total) * 100;

      return `
        <div class="card-flat" style="margin-bottom:var(--space-xl);padding:0;overflow:hidden;border:1px solid ${slide.color || 'var(--border-primary)'}30;">
          <div style="display:flex;justify-content:space-between;align-items:center;padding:12px var(--space-lg);background:rgba(0,0,0,0.2);border-bottom:1px solid var(--border-primary);">
            <div style="display:flex;align-items:center;gap:var(--space-md);">
              <span style="font-size:1.2rem;">📊</span>
              <div>
                <div style="font-weight:700;font-size:0.9rem;">${ppt.title}</div>
                <div style="font-size:0.75rem;color:var(--text-muted);">Slide ${activeSlideIndex + 1} of ${total}</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:var(--space-sm);">
              <button class="btn btn-ghost btn-sm" id="close-slides">✕ Close</button>
            </div>
          </div>
          <div style="height:3px;background:rgba(255,255,255,0.05);">
            <div style="height:100%;width:${progress}%;background:${slide.color || 'var(--accent-blue)'};transition:width 0.3s ease;"></div>
          </div>
          <div id="slide-viewport" style="min-height:380px;padding:var(--space-2xl) var(--space-3xl);display:flex;flex-direction:column;justify-content:center;position:relative;">
            ${renderSlideContent(slide)}
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:12px var(--space-lg);background:rgba(0,0,0,0.2);border-top:1px solid var(--border-primary);">
            <button class="btn btn-secondary btn-sm" id="slide-prev" ${activeSlideIndex === 0 ? 'disabled' : ''}>← Previous</button>
            <div style="display:flex;gap:6px;">
              ${ppt.slides.map((_, i) => `<button class="slide-dot" data-index="${i}" style="width:8px;height:8px;border-radius:50%;border:none;background:${i === activeSlideIndex ? (slide.color || 'var(--accent-blue)') : 'rgba(255,255,255,0.2)'};"></button>`).join('')}
            </div>
            <button class="btn btn-primary btn-sm" id="slide-next" ${activeSlideIndex >= total - 1 ? 'disabled' : ''}>Next →</button>
          </div>
        </div>
      `;
    }

    function renderSlideContent(slide) {
      if (!slide) return '';
      if (slide.layout === 'cover') {
        return `<div style="text-align:center;"><h1 style="font-size:2rem;color:${slide.color || 'var(--accent-blue)'};">${slide.title}</h1><p>${slide.subtitle || ''}</p></div>`;
      }
      return `<div><h2 style="margin-bottom:1rem;">${slide.icon || ''} ${slide.title}</h2><ul style="list-style:disc;padding-left:1.5rem;">${(slide.bullets || []).map(b => `<li style="margin-bottom:0.5rem;">${b}</li>`).join('')}</ul></div>`;
    }

    function renderAllSection(mats) {
      return `
        <div class="table-container">
          <table class="table">
            <thead>
              <tr><th>Type</th><th>Title</th><th>Module</th><th>Action</th></tr>
            </thead>
            <tbody>
              ${mats.map(m => `
                <tr>
                  <td><span style="font-size:1.4rem;">${m.type === 'video' ? '🎥' : m.type === 'ppt' ? '📑' : m.type === 'pdf' ? '📕' : '🔗'}</span></td>
                  <td><div style="font-weight:600;">${m.title}</div></td>
                  <td>${m.module_title || 'General'}</td>
                  <td>
                    ${m.type === 'video' ? `<button class="btn btn-primary btn-sm play-video" data-id="${m.id}">▶ Watch</button>` : 
                      m.type === 'ppt' ? `<button class="btn btn-secondary btn-sm open-ppt" data-id="${m.id}">📊 View</button>` :
                      `<a href="${m.url}" target="_blank" class="btn btn-secondary btn-sm">Open ↗</a>`}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    function bindEvents() {
      // Tab switching
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          activeTab = btn.dataset.tab;
          expandedVideo = null; activePPT = null; activeSlideIndex = 0;
          render();
        });
      });

      // Video toggles
      document.querySelectorAll('.video-card').forEach(card => card.addEventListener('click', () => {
        expandedVideo = videos.find(v => v.id === card.dataset.videoId);
        render();
        document.querySelector('.layout-content')?.scrollTo(0, 0);
      }));

      // PPT toggles
      document.querySelectorAll('.ppt-card').forEach(card => card.addEventListener('click', () => {
        activePPT = ppts.find(p => p.id === card.dataset.pptId);
        activeSlideIndex = 0;
        render();
        document.querySelector('.layout-content')?.scrollTo(0, 0);
      }));

      // Actions in table
      document.querySelectorAll('.play-video').forEach(btn => btn.addEventListener('click', () => {
        activeTab = 'videos'; expandedVideo = videos.find(v => v.id === btn.dataset.id); render();
      }));
      document.querySelectorAll('.open-ppt').forEach(btn => btn.addEventListener('click', () => {
        activeTab = 'ppts'; activePPT = ppts.find(p => p.id === btn.dataset.id); activeSlideIndex = 0; render();
      }));

      document.getElementById('close-player')?.addEventListener('click', () => { expandedVideo = null; render(); });
      document.getElementById('close-slides')?.addEventListener('click', () => { activePPT = null; render(); });

      document.getElementById('slide-prev')?.addEventListener('click', () => { if (activeSlideIndex > 0) { activeSlideIndex--; render(); } });
      document.getElementById('slide-next')?.addEventListener('click', () => { if (activeSlideIndex < activePPT.slides.length - 1) { activeSlideIndex++; render(); } });
      document.querySelectorAll('.slide-dot').forEach(dot => dot.addEventListener('click', () => { activeSlideIndex = parseInt(dot.dataset.index); render(); }));
    }

    render();
  } catch (err) {
    renderLayout(`<div class="empty-state"><p>${err.message}</p></div>`, 'materials');
  }
}

function adjustColor(hex) {
  if (!hex || hex.length < 7) return '#ffffff';
  return hex; // Simplified for now
}

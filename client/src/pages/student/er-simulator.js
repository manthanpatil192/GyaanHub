import { renderLayout } from '../../components/layout.js';
import { showToast } from '../../components/shared.js';
import { request } from '../../utils/api.js';

export function renderERSimulator() {
  const content = `
    <div class="page-header" style="margin-bottom:var(--space-md);">
      <div>
        <h1 class="page-title">ER Diagram Simulator 📐</h1>
        <p class="page-subtitle">Design Entity-Relationship diagrams interactively</p>
      </div>
      <div style="display:flex;gap:var(--space-sm);flex-wrap:wrap;">
        <button class="btn btn-secondary btn-sm" id="er-clear">🗑️ Clear All</button>
        <button class="btn btn-secondary btn-sm" id="er-export">📋 Export JSON</button>
        <button class="btn btn-primary btn-sm" id="er-save">💾 Save Diagram</button>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="card-flat" style="padding:var(--space-sm) var(--space-md);margin-bottom:var(--space-md);display:flex;gap:var(--space-sm);align-items:center;flex-wrap:wrap;">
      <span style="font-size:0.8rem;color:var(--text-muted);font-weight:600;">ADD:</span>
      <button class="btn btn-sm er-tool active" data-tool="entity">⬜ Entity</button>
      <button class="btn btn-sm er-tool" data-tool="weak-entity">⬜⬜ Weak Entity</button>
      <button class="btn btn-sm er-tool" data-tool="attribute">⬭ Attribute</button>
      <button class="btn btn-sm er-tool" data-tool="key-attribute">⬭̲ Key Attr</button>
      <button class="btn btn-sm er-tool" data-tool="multivalued">◎ Multi-valued</button>
      <button class="btn btn-sm er-tool" data-tool="derived">◌ Derived</button>
      <button class="btn btn-sm er-tool" data-tool="relationship">◇ Relationship</button>
      <div style="border-left:1px solid var(--border-primary);height:24px;margin:0 4px;"></div>
      <button class="btn btn-sm er-tool" data-tool="connect">🔗 Connect</button>
      <button class="btn btn-sm er-tool" data-tool="select">⮞ Select</button>
      <button class="btn btn-sm er-tool" data-tool="delete">✕ Delete</button>
    </div>

    <!-- Cardinality bar for connect mode -->
    <div id="cardinality-bar" class="card-flat" style="padding:var(--space-xs) var(--space-md);margin-bottom:var(--space-md);display:none;align-items:center;gap:var(--space-md);">
      <span style="font-size:0.8rem;color:var(--text-muted);font-weight:600;">CARDINALITY:</span>
      <label style="display:flex;align-items:center;gap:4px;cursor:pointer;font-size:0.85rem;"><input type="radio" name="cardinality" value="" checked /> None</label>
      <label style="display:flex;align-items:center;gap:4px;cursor:pointer;font-size:0.85rem;"><input type="radio" name="cardinality" value="1" /> 1</label>
      <label style="display:flex;align-items:center;gap:4px;cursor:pointer;font-size:0.85rem;"><input type="radio" name="cardinality" value="N" /> N</label>
      <label style="display:flex;align-items:center;gap:4px;cursor:pointer;font-size:0.85rem;"><input type="radio" name="cardinality" value="M" /> M</label>
      <div style="border-left:1px solid var(--border-primary);height:20px;margin:0 4px;"></div>
      <label style="display:flex;align-items:center;gap:4px;cursor:pointer;font-size:0.85rem;"><input type="checkbox" id="total-participation" /> Total Part.</label>
    </div>

    <!-- Canvas -->
    <div style="position:relative;border-radius:var(--radius-lg);overflow:hidden;border:1px solid var(--border-primary);">
      <canvas id="er-canvas" style="width:100%;display:block;background:var(--bg-primary);cursor:crosshair;"></canvas>
      <!-- Inline name input (appears on canvas click) -->
      <div id="er-name-input-wrapper" style="display:none;position:absolute;z-index:10;">
        <div style="background:var(--bg-secondary);border:2px solid var(--accent-blue);border-radius:var(--radius-sm);padding:8px;box-shadow:0 8px 32px rgba(0,0,0,0.5);min-width:200px;">
          <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px;font-weight:600;" id="er-input-label">Entity Name</div>
          <input type="text" id="er-name-input" class="form-input" placeholder="Enter name..." style="font-size:0.9rem;padding:6px 10px;margin-bottom:6px;" autocomplete="off" />
          <div style="display:flex;gap:4px;justify-content:flex-end;">
            <button class="btn btn-ghost btn-sm" id="er-input-cancel">Cancel</button>
            <button class="btn btn-primary btn-sm" id="er-input-ok">Add ✓</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Instructions -->
    <div class="card-flat" style="margin-top:var(--space-md);padding:var(--space-md);">
      <details>
        <summary style="cursor:pointer;font-weight:600;font-size:0.9rem;color:var(--accent-blue);">📖 How to Use the ER Simulator</summary>
        <div style="margin-top:var(--space-md);font-size:0.85rem;color:var(--text-muted);line-height:1.8;">
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:var(--space-lg);">
            <div>
              <strong style="color:var(--text-primary);">Adding Elements:</strong>
              <ol style="padding-left:18px;margin:4px 0;">
                <li>Select a tool from the toolbar</li>
                <li>Click anywhere on the canvas</li>
                <li>Type a name and press Enter or click Add</li>
              </ol>
            </div>
            <div>
              <strong style="color:var(--text-primary);">Connecting Elements:</strong>
              <ol style="padding-left:18px;margin:4px 0;">
                <li>Select the "🔗 Connect" tool</li>
                <li>Click the first element</li>
                <li>Click the second element</li>
              </ol>
            </div>
            <div>
              <strong style="color:var(--text-primary);">Moving & Editing:</strong>
              <ol style="padding-left:18px;margin:4px 0;">
                <li>Select "⮞ Select" to drag elements</li>
                <li>Double-click to rename any element</li>
                <li>Use "✕ Delete" to remove elements</li>
              </ol>
            </div>
            <div>
              <strong style="color:var(--text-primary);">Shapes Legend:</strong>
              <ul style="padding-left:18px;margin:4px 0;">
                <li><span style="color:var(--accent-purple);">■ Rectangle</span> = Entity</li>
                <li><span style="color:var(--accent-purple);">■■ Double Rect</span> = Weak Entity</li>
                <li><span style="color:var(--accent-emerald);">⬭ Ellipse</span> = Attribute</li>
                <li><span style="color:var(--accent-cyan);">◇ Diamond</span> = Relationship</li>
              </ul>
            </div>
          </div>
        </div>
      </details>
    </div>
  `;

  renderLayout(content, 'er-simulator');

  // Initialize canvas after DOM renders
  setTimeout(() => initCanvas(), 100);
}

function initCanvas() {
  const canvas = document.getElementById('er-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const canvasContainer = canvas.parentElement;

  // High DPI support
  const dpr = window.devicePixelRatio || 1;

  function resize() {
    const w = canvasContainer.clientWidth;
    const h = Math.max(520, window.innerHeight - 380);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  // State
  let nodes = [];
  let connections = [];
  let currentTool = 'entity';
  let selectedNode = null;
  let draggingNode = null;
  let dragOffset = { x: 0, y: 0 };
  let connectSource = null;
  let nodeIdCounter = 1;

  // Pending placement (when user clicks canvas, we show the inline input)
  let pendingClick = null;

  // Load user info for ID
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user.id || 'anonymous';

  // Load existing diagrams dropdown logic
  async function loadExistingDiagrams() {
    try {
      const diagrams = await request('/er-diagrams', {
        headers: { 'x-user-id': userId }
      });
      // Future: add dropdown to UI to switch between diagrams
      if (diagrams.length > 0 && nodes.length === 0) {
        const latest = diagrams[0];
        nodes = latest.nodes || [];
        connections = latest.connections || [];
        nodeIdCounter = Math.max(...nodes.map(n => parseInt(n.id.replace('n','')) || 0), 0) + 1;
        draw();
      }
    } catch (err) {
      console.error('Failed to load diagrams:', err);
    }
  }

  loadExistingDiagrams();

  const COLORS = {
    entity:         { fill: '#7C4DFF', stroke: '#B388FF', text: '#fff' },
    'weak-entity':  { fill: '#4338ca', stroke: '#818cf8', text: '#fff' },
    attribute:      { fill: '#059669', stroke: '#34d399', text: '#fff' },
    'key-attribute':{ fill: '#d97706', stroke: '#fbbf24', text: '#fff' },
    multivalued:    { fill: '#e11d48', stroke: '#fb7185', text: '#fff' },
    derived:        { fill: '#7c3aed', stroke: '#c4b5fd', text: '#fff' },
    relationship:   { fill: '#0891b2', stroke: '#22d3ee', text: '#fff' }
  };

  const SIZES = {
    entity:         { w: 130, h: 52 },
    'weak-entity':  { w: 140, h: 56 },
    attribute:      { rx: 65, ry: 30 },
    'key-attribute':{ rx: 65, ry: 30 },
    multivalued:    { rx: 60, ry: 28 },
    derived:        { rx: 60, ry: 28 },
    relationship:   { s: 52 }
  };

  const TOOL_LABELS = {
    entity: 'Entity', 'weak-entity': 'Weak Entity', attribute: 'Attribute',
    'key-attribute': 'Key Attribute', multivalued: 'Multi-valued Attr',
    derived: 'Derived Attr', relationship: 'Relationship'
  };

  // --- Name Input Helpers ---
  const nameWrapper = document.getElementById('er-name-input-wrapper');
  const nameInput = document.getElementById('er-name-input');
  const inputLabel = document.getElementById('er-input-label');

  function showNameInput(x, y, tool, callback) {
    const canvasRect = canvas.getBoundingClientRect();
    const containerRect = canvasContainer.getBoundingClientRect();

    // Position the input near the click, clamped within canvas
    let left = x ;
    let top = y ;

    // Clamp so it doesn't go off-screen
    left = Math.min(left, canvasContainer.clientWidth - 220);
    left = Math.max(left, 10);
    top = Math.min(top, canvasContainer.clientHeight - 100);
    top = Math.max(top, 10);

    nameWrapper.style.left = left + 'px';
    nameWrapper.style.top = top + 'px';
    nameWrapper.style.display = 'block';

    inputLabel.textContent = TOOL_LABELS[tool] || 'Element Name';
    nameInput.value = '';
    nameInput.placeholder = `e.g., ${tool === 'entity' ? 'Student' : tool === 'attribute' ? 'Name' : tool === 'relationship' ? 'enrolls_in' : 'my_element'}`;
    nameInput.focus();

    // Clean up old handlers
    const okBtn = document.getElementById('er-input-ok');
    const cancelBtn = document.getElementById('er-input-cancel');

    const cleanup = () => {
      nameWrapper.style.display = 'none';
      nameInput.removeEventListener('keydown', onKey);
      okBtn.replaceWith(okBtn.cloneNode(true));
      cancelBtn.replaceWith(cancelBtn.cloneNode(true));
    };

    const submit = () => {
      const val = nameInput.value.trim();
      cleanup();
      if (val) callback(val);
    };

    const cancel = () => {
      cleanup();
    };

    const onKey = (e) => {
      if (e.key === 'Enter') { e.preventDefault(); submit(); }
      if (e.key === 'Escape') { e.preventDefault(); cancel(); }
    };

    nameInput.addEventListener('keydown', onKey);
    document.getElementById('er-input-ok').addEventListener('click', submit);
    document.getElementById('er-input-cancel').addEventListener('click', cancel);
  }

  function hideNameInput() {
    nameWrapper.style.display = 'none';
  }

  // --- Tool Selection ---
  document.querySelectorAll('.er-tool').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.er-tool').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTool = btn.dataset.tool;
      connectSource = null;
      selectedNode = null;
      hideNameInput();

      const bar = document.getElementById('cardinality-bar');
      if (bar) bar.style.display = currentTool === 'connect' ? 'flex' : 'none';

      canvas.style.cursor = currentTool === 'select' ? 'grab' :
                             currentTool === 'delete' ? 'crosshair' :
                             currentTool === 'connect' ? 'pointer' : 'crosshair';
      draw();
    });
  });

  // --- Hit Testing ---
  function isEntityType(type) { return type === 'entity' || type === 'weak-entity'; }

  function findNodeAt(x, y) {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      if (isEntityType(n.type)) {
        const sz = SIZES[n.type];
        if (x >= n.x - sz.w/2 && x <= n.x + sz.w/2 && y >= n.y - sz.h/2 && y <= n.y + sz.h/2) return n;
      } else if (n.type === 'relationship') {
        const s = SIZES.relationship.s;
        const dx = Math.abs(x - n.x), dy = Math.abs(y - n.y);
        if (dx / s + dy / s <= 1) return n;
      } else {
        const sz = SIZES[n.type] || SIZES.attribute;
        const dx2 = (x - n.x) / sz.rx, dy2 = (y - n.y) / sz.ry;
        if (dx2 * dx2 + dy2 * dy2 <= 1) return n;
      }
    }
    return null;
  }

  // --- Mouse Position ---
  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  // --- Canvas Events ---
  canvas.addEventListener('mousedown', (e) => {
    const pos = getPos(e);
    const node = findNodeAt(pos.x, pos.y);

    // SELECT tool: drag
    if (currentTool === 'select') {
      if (node) {
        draggingNode = node;
        dragOffset = { x: pos.x - node.x, y: pos.y - node.y };
        selectedNode = node;
        canvas.style.cursor = 'grabbing';
      } else {
        selectedNode = null;
      }
      draw();
      return;
    }

    // DELETE tool
    if (currentTool === 'delete') {
      if (node) {
        nodes = nodes.filter(n => n.id !== node.id);
        connections = connections.filter(c => c.from !== node.id && c.to !== node.id);
        draw();
        showToast(`Deleted "${node.label}"`, 'info');
      }
      return;
    }

    // CONNECT tool
    if (currentTool === 'connect') {
      if (node) {
        if (!connectSource) {
          connectSource = node;
          selectedNode = node;
          showToast(`Selected "${node.label}" — now click the target element`, 'info');
          draw();
        } else if (connectSource.id !== node.id) {
          const exists = connections.find(c =>
            (c.from === connectSource.id && c.to === node.id) ||
            (c.from === node.id && c.to === connectSource.id)
          );
          if (!exists) {
            const cardInput = document.querySelector('input[name="cardinality"]:checked');
            const totalPart = document.getElementById('total-participation')?.checked;
            connections.push({
              from: connectSource.id,
              to: node.id,
              cardinality: cardInput?.value || '',
              totalParticipation: !!totalPart
            });
            showToast(`Connected "${connectSource.label}" ↔ "${node.label}"`, 'success');
          } else {
            showToast('Already connected!', 'warning');
          }
          connectSource = null;
          selectedNode = null;
          draw();
        }
      } else {
        connectSource = null;
        selectedNode = null;
        draw();
      }
      return;
    }

    // PLACEMENT tools — show inline input
    hideNameInput();
    showNameInput(pos.x + 20, pos.y - 10, currentTool, (name) => {
      nodes.push({
        id: `n${nodeIdCounter++}`,
        type: currentTool,
        label: name,
        x: pos.x,
        y: pos.y
      });
      draw();
      showToast(`Added ${TOOL_LABELS[currentTool]}: "${name}"`, 'success');
    });
  });

  canvas.addEventListener('mousemove', (e) => {
    if (draggingNode) {
      const pos = getPos(e);
      draggingNode.x = pos.x - dragOffset.x;
      draggingNode.y = pos.y - dragOffset.y;
      draw();
    }
  });

  canvas.addEventListener('mouseup', () => {
    if (draggingNode) {
      canvas.style.cursor = 'grab';
    }
    draggingNode = null;
  });

  canvas.addEventListener('dblclick', (e) => {
    const pos = getPos(e);
    const node = findNodeAt(pos.x, pos.y);
    if (node) {
      hideNameInput();
      showNameInput(pos.x + 20, pos.y - 10, node.type, (newName) => {
        node.label = newName;
        draw();
        showToast(`Renamed to "${newName}"`, 'success');
      });
      // Pre-fill current name
      setTimeout(() => { nameInput.value = node.label; nameInput.select(); }, 50);
    }
  });

  // --- Drawing ---
  function draw() {
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    ctx.clearRect(0, 0, w, h);

    // Grid dots
    ctx.fillStyle = 'rgba(255,255,255,0.025)';
    for (let gx = 20; gx < w; gx += 40) {
      for (let gy = 20; gy < h; gy += 40) {
        ctx.beginPath();
        ctx.arc(gx, gy, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Watermark hint when empty
    if (nodes.length === 0) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '15px Inter, system-ui';
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillText('Click anywhere on the canvas to add elements', w / 2, h / 2 - 10);
      ctx.font = '13px Inter, system-ui';
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillText('Select a tool from the toolbar above, then click here', w / 2, h / 2 + 20);
      ctx.restore();
    }

    // Draw connections
    connections.forEach(conn => {
      const fromNode = nodes.find(n => n.id === conn.from);
      const toNode = nodes.find(n => n.id === conn.to);
      if (!fromNode || !toNode) return;

      ctx.beginPath();
      ctx.moveTo(fromNode.x, fromNode.y);
      ctx.lineTo(toNode.x, toNode.y);

      if (conn.totalParticipation) {
        // Double line for total participation
        ctx.lineWidth = 5;
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(10,14,26,0.8)';
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.stroke();
      } else {
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.stroke();
      }

      // Cardinality label
      if (conn.cardinality) {
        const mx = (fromNode.x + toNode.x) / 2;
        const my = (fromNode.y + toNode.y) / 2;
        // Background
        ctx.fillStyle = 'rgba(10,14,26,0.85)';
        ctx.fillRect(mx - 12, my - 20, 24, 20);
        // Text
        ctx.font = 'bold 14px Inter, system-ui';
        ctx.fillStyle = '#fbbf24';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(conn.cardinality, mx, my - 4);
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      const c = COLORS[node.type] || COLORS.entity;
      const isSelected = selectedNode?.id === node.id;

      ctx.save();

      if (isSelected) {
        ctx.shadowColor = c.stroke;
        ctx.shadowBlur = 24;
      }

      if (isEntityType(node.type)) {
        const sz = SIZES[node.type];

        if (node.type === 'weak-entity') {
          ctx.strokeStyle = c.stroke;
          ctx.lineWidth = 2;
          roundRect(ctx, node.x - sz.w/2 - 5, node.y - sz.h/2 - 5, sz.w + 10, sz.h + 10, 8);
          ctx.stroke();
        }

        ctx.fillStyle = c.fill;
        ctx.strokeStyle = c.stroke;
        ctx.lineWidth = 2;
        roundRect(ctx, node.x - sz.w/2, node.y - sz.h/2, sz.w, sz.h, 6);
        ctx.fill();
        ctx.stroke();

      } else if (node.type === 'relationship') {
        const s = SIZES.relationship.s;
        ctx.fillStyle = c.fill;
        ctx.strokeStyle = c.stroke;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(node.x, node.y - s);
        ctx.lineTo(node.x + s * 1.3, node.y);
        ctx.lineTo(node.x, node.y + s);
        ctx.lineTo(node.x - s * 1.3, node.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

      } else {
        const sz = SIZES[node.type] || SIZES.attribute;

        if (node.type === 'multivalued') {
          ctx.beginPath();
          ctx.ellipse(node.x, node.y, sz.rx + 7, sz.ry + 6, 0, 0, Math.PI * 2);
          ctx.strokeStyle = c.stroke;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        if (node.type === 'derived') {
          ctx.setLineDash([6, 4]);
        }

        ctx.fillStyle = c.fill;
        ctx.strokeStyle = c.stroke;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(node.x, node.y, sz.rx, sz.ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Label
      ctx.font = `${isEntityType(node.type) ? 'bold ' : ''}13px Inter, system-ui`;
      ctx.fillStyle = c.text;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = node.label.length > 15 ? node.label.slice(0, 15) + '…' : node.label;
      ctx.fillText(label, node.x, node.y);

      // Underline for key attribute
      if (node.type === 'key-attribute') {
        const tw = ctx.measureText(label).width;
        ctx.beginPath();
        ctx.moveTo(node.x - tw/2, node.y + 9);
        ctx.lineTo(node.x + tw/2, node.y + 9);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ctx.restore();
    });

    // Connect source glow indicator
    if (connectSource) {
      ctx.save();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(connectSource.x, connectSource.y, 35, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  // --- Toolbar buttons ---
  document.getElementById('er-clear')?.addEventListener('click', () => {
    if (nodes.length === 0) { showToast('Canvas is already empty', 'info'); return; }
    nodes = [];
    connections = [];
    nodeIdCounter = 1;
    selectedNode = null;
    connectSource = null;
    hideNameInput();
    draw();
    showToast('Canvas cleared', 'info');
  });

  document.getElementById('er-export')?.addEventListener('click', () => {
    if (nodes.length === 0) { showToast('Nothing to export — add some elements first', 'warning'); return; }
    const data = JSON.stringify({ nodes, connections }, null, 2);
    navigator.clipboard.writeText(data).then(() => {
      showToast('ER diagram JSON copied to clipboard! 📋', 'success');
    }).catch(() => {
      showToast('Copied! (check console)', 'info');
      console.log(data);
    });
  });

  document.getElementById('er-save')?.addEventListener('click', () => {
    if (nodes.length === 0) { showToast('Add some elements before saving', 'warning'); return; }
    hideNameInput();
    // Reuse the inline input for save name
    const wrapper = nameWrapper;
    inputLabel.textContent = 'Save Diagram As';
    nameInput.value = 'My ER Diagram';
    nameInput.placeholder = 'Diagram name...';
    wrapper.style.left = '50%';
    wrapper.style.top = '50%';
    wrapper.style.transform = 'translate(-50%, -50%)';
    wrapper.style.display = 'block';
    nameInput.focus();
    nameInput.select();

    const cleanup = () => {
      wrapper.style.display = 'none';
      wrapper.style.transform = '';
    };

    const save = async () => {
      const name = nameInput.value.trim() || 'Untitled';
      cleanup();
      
      try {
        showToast('Saving to cloud...', 'info');
        await request('/er-diagrams', {
          method: 'POST',
          headers: { 'x-user-id': userId },
          body: JSON.stringify({
            name,
            nodes: nodes,
            connections: connections
          })
        });
        showToast(`Diagram "${name}" saved! 💾`, 'success');
      } catch (err) {
        showToast('Failed to save to cloud', 'error');
        // Fallback to localStorage just in case
        const saved = JSON.parse(localStorage.getItem('er_diagrams') || '[]');
        saved.push({ name, nodes: JSON.parse(JSON.stringify(nodes)), connections: JSON.parse(JSON.stringify(connections)), date: new Date().toISOString() });
        localStorage.setItem('er_diagrams', JSON.stringify(saved));
      }
    };

    const onKey = (e) => {
      if (e.key === 'Enter') { e.preventDefault(); nameInput.removeEventListener('keydown', onKey); save(); }
      if (e.key === 'Escape') { e.preventDefault(); nameInput.removeEventListener('keydown', onKey); cleanup(); }
    };
    nameInput.addEventListener('keydown', onKey);

    document.getElementById('er-input-ok').onclick = () => { nameInput.removeEventListener('keydown', onKey); save(); };
    document.getElementById('er-input-cancel').onclick = () => { nameInput.removeEventListener('keydown', onKey); cleanup(); };
  });

  // --- Resize ---
  window.addEventListener('resize', resize);
  resize();
}

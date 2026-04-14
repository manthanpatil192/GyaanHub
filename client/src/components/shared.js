// Toast notifications
export function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(40px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Simple markdown-to-HTML converter
export function markdownToHtml(md) {
  if (!md) return '';

  let html = md
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
      return `<pre><code class="language-${lang}">${escapeHtml(code.trim())}</code></pre>`;
    })
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold and italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Tables
    .replace(/^\|(.+)\|$/gm, (match) => {
      return match;
    })
    // Horizontal rules
    .replace(/^---$/gm, '<hr>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');

  // Handle tables
  const tableRegex = /(\|.+\|[\s\S]*?\|.+\|)/g;
  html = html.replace(tableRegex, (tableStr) => {
    const rows = tableStr.trim().split('<br>').filter(r => r.trim());
    if (rows.length < 2) return tableStr;

    let table = '<table>';
    rows.forEach((row, i) => {
      if (row.includes('---')) return; // Skip separator row
      const cells = row.split('|').filter(c => c.trim() !== '');
      const tag = i === 0 ? 'th' : 'td';
      const rowTag = i === 0 ? 'thead' : (i === 1 ? 'tbody' : '');
      if (i === 0) table += '<thead>';
      if (i === 1) table += '</thead><tbody>';
      table += '<tr>';
      cells.forEach(cell => {
        table += `<${tag}>${cell.trim()}</${tag}>`;
      });
      table += '</tr>';
    });
    table += '</tbody></table>';
    return table;
  });

  // Handle unordered lists
  html = html.replace(/((?:^|\<br\>)- .+(?:\<br\>- .+)*)/g, (match) => {
    const items = match.split('<br>').filter(l => l.trim().startsWith('- '));
    return '<ul>' + items.map(item => `<li>${item.replace(/^- /, '')}</li>`).join('') + '</ul>';
  });

  // Handle ordered lists
  html = html.replace(/((?:^|\<br\>)\d+\. .+(?:\<br\>\d+\. .+)*)/g, (match) => {
    const items = match.split('<br>').filter(l => /^\d+\. /.test(l.trim()));
    return '<ol>' + items.map(item => `<li>${item.replace(/^\d+\. /, '')}</li>`).join('') + '</ol>';
  });

  return `<p>${html}</p>`;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Format time
export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Format date
export function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Simple bar chart renderer
export function renderBarChart(container, data, options = {}) {
  const { label = '', maxValue = null, height = 200 } = options;
  const max = maxValue || Math.max(...data.map(d => d.value), 1);

  let html = `<div style="display:flex;align-items:flex-end;gap:8px;height:${height}px;padding:0 4px;">`;
  data.forEach(d => {
    const barHeight = (d.value / max) * 100;
    html += `
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%;justify-content:flex-end;">
        <span style="font-size:0.75rem;color:var(--text-muted)">${d.value}</span>
        <div style="width:100%;max-width:48px;height:${barHeight}%;background:var(--gradient-blue);border-radius:6px 6px 0 0;min-height:4px;transition:height 0.5s ease;"></div>
        <span style="font-size:0.7rem;color:var(--text-muted);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:60px;" title="${d.label}">${d.label}</span>
      </div>
    `;
  });
  html += '</div>';

  container.innerHTML = html;
}

// Circular progress renderer
export function renderCircularProgress(container, percentage, size = 140) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  let color = 'var(--accent-blue)';
  if (percentage >= 80) color = 'var(--accent-emerald)';
  else if (percentage >= 50) color = 'var(--accent-amber)';
  else if (percentage < 50) color = 'var(--accent-rose)';

  container.innerHTML = `
    <div class="circular-progress" style="width:${size}px;height:${size}px;">
      <svg width="${size}" height="${size}">
        <circle class="circular-progress-bg" cx="${size/2}" cy="${size/2}" r="${radius}"></circle>
        <circle class="circular-progress-fill" cx="${size/2}" cy="${size/2}" r="${radius}"
          stroke="${color}"
          stroke-dasharray="${circumference}"
          stroke-dashoffset="${offset}">
        </circle>
      </svg>
      <div class="circular-progress-text" style="color:${color}">${percentage}%</div>
    </div>
  `;
}

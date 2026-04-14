import { getUser, clearAuth, isTeacher, isStudent } from '../utils/auth.js';
import { navigate } from '../utils/router.js';

export function renderLayout(contentHtml, activePage = '') {
  const user = getUser();
  if (!user) {
    navigate('/login');
    return;
  }

  const app = document.getElementById('app');

  const sidebarLinks = isTeacher() ? `
    <div class="sidebar-section-title">Main</div>
    <div class="sidebar-link ${activePage === 'dashboard' ? 'active' : ''}" data-page="/teacher/dashboard">
      <span class="icon">📊</span> Dashboard
    </div>
    <div class="sidebar-section-title">Content</div>
    <div class="sidebar-link ${activePage === 'modules' ? 'active' : ''}" data-page="/teacher/modules">
      <span class="icon">📚</span> Learning Modules
    </div>
    <div class="sidebar-link ${activePage === 'create-quiz' ? 'active' : ''}" data-page="/teacher/create-quiz">
      <span class="icon">✏️</span> Create Quiz
    </div>
    <div class="sidebar-link ${activePage === 'materials' ? 'active' : ''}" data-page="/teacher/materials">
      <span class="icon">📂</span> Study Materials
    </div>
    <div class="sidebar-section-title">Analytics</div>
    <div class="sidebar-link ${activePage === 'quizzes' ? 'active' : ''}" data-page="/teacher/quizzes">
      <span class="icon">📝</span> Manage Quizzes
    </div>
    <div class="sidebar-link ${activePage === 'students' ? 'active' : ''}" data-page="/teacher/students">
      <span class="icon">👥</span> Student Marks
    </div>
  ` : `
    <div class="sidebar-section-title">Main</div>
    <div class="sidebar-link ${activePage === 'dashboard' ? 'active' : ''}" data-page="/student/dashboard">
      <span class="icon">🏠</span> Dashboard
    </div>
    <div class="sidebar-section-title">Learning</div>
    <div class="sidebar-link ${activePage === 'modules' ? 'active' : ''}" data-page="/student/modules">
      <span class="icon">📚</span> Modules
    </div>
    <div class="sidebar-link ${activePage === 'materials' ? 'active' : ''}" data-page="/student/materials">
      <span class="icon">📖</span> Study Materials
    </div>
    <div class="sidebar-link ${activePage === 'quizzes' ? 'active' : ''}" data-page="/student/quizzes">
      <span class="icon">📝</span> Quizzes
    </div>
    <div class="sidebar-section-title">Tools</div>
    <div class="sidebar-link ${activePage === 'er-simulator' ? 'active' : ''}" data-page="/student/er-simulator">
      <span class="icon">📐</span> ER Simulator
    </div>
    <div class="sidebar-link ${activePage === 'doubt-chatbot' ? 'active' : ''}" data-page="/student/chatbot">
      <span class="icon">🤖</span> Doubt Chatbot
    </div>
    <div class="sidebar-section-title">Performance</div>
    <div class="sidebar-link ${activePage === 'results' ? 'active' : ''}" data-page="/student/results">
      <span class="icon">📈</span> My Results
    </div>
  `;

  const initials = user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const roleLabel = user.role === 'teacher' ? '👨‍🏫 Teacher' : '🎓 Student';

  app.innerHTML = `
    <div class="layout">
      <aside class="layout-sidebar" id="sidebar">
        <div class="sidebar-logo">
          <div class="sidebar-logo-icon">🗄️</div>
          <h2>DBMS Platform</h2>
        </div>
        <nav class="sidebar-nav">
          ${sidebarLinks}
        </nav>
        <div class="sidebar-footer">
          <div class="sidebar-link" id="logout-btn">
            <span class="icon">🚪</span> Logout
          </div>
        </div>
      </aside>

      <div class="layout-main">
        <header class="layout-navbar">
          <div class="navbar-left">
            <button class="btn btn-icon btn-ghost" id="menu-toggle" style="display:none;">☰</button>
            <span class="navbar-title">${getPageTitle(activePage)}</span>
          </div>
          <div class="navbar-right">
            <span class="badge ${user.role === 'teacher' ? 'badge-purple' : 'badge-blue'}">${roleLabel}</span>
            <div class="navbar-user">
              <div class="navbar-avatar">${initials}</div>
              <span>${user.full_name}</span>
            </div>
          </div>
        </header>

        <main class="layout-content slide-up">
          ${contentHtml}
        </main>
      </div>
    </div>
  `;

  // Navigate on sidebar link click
  app.querySelectorAll('.sidebar-link[data-page]').forEach(link => {
    link.addEventListener('click', () => {
      navigate(link.dataset.page);
    });
  });

  // Logout
  document.getElementById('logout-btn').addEventListener('click', () => {
    clearAuth();
    navigate('/login');
  });

  // Mobile menu toggle
  const menuToggle = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');
  if (window.innerWidth <= 768) {
    menuToggle.style.display = 'flex';
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }
}

function getPageTitle(page) {
  const titles = {
    dashboard: 'Dashboard',
    modules: 'Learning Modules',
    materials: 'Study Materials',
    quizzes: 'Quizzes',
    'create-quiz': 'Create Quiz',
    results: 'My Results',
    students: 'Student Marks',
    'module-detail': 'Module Details',
    quiz: 'Quiz',
    'quiz-result': 'Quiz Result',
    'er-simulator': 'ER Diagram Simulator',
    'manage-materials': 'Manage Materials',
  };
  return titles[page] || 'DBMS Platform';
}

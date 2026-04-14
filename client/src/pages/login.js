import { auth } from '../utils/api.js';
import { setAuth } from '../utils/auth.js';
import { navigate } from '../utils/router.js';
import { showToast } from '../components/shared.js';

export function renderLogin() {
  const app = document.getElementById('app');
  let isRegister = false;
  let selectedRole = 'student';

  function render() {
    const floatingIcons = ['🗄️', '📊', '💻', '🔒', '📚', '⚡', '🔧', '📝', '🗂️', '🔑'].map((icon, i) => {
      const top = Math.random() * 90;
      const left = Math.random() * 90;
      const delay = Math.random() * 10;
      const size = 1.5 + Math.random() * 1.5;
      return `<span class="floating-icon" style="top:${top}%;left:${left}%;animation-delay:${delay}s;font-size:${size}rem;">${icon}</span>`;
    }).join('');

    app.innerHTML = `
      <div class="login-page">
        <div class="login-bg">${floatingIcons}</div>
        <div class="login-card">
          <div class="login-header">
            <div class="login-logo">🗄️</div>
            <h1 class="text-gradient">${isRegister ? 'Create Account' : 'Welcome Back'}</h1>
            <p>${isRegister ? 'Join the DBMS Learning Platform' : 'Sign in to DBMS Learning Platform'}</p>
          </div>
          
          <form id="auth-form">
            ${isRegister ? `
              <div class="form-group">
                <label class="form-label">Full Name</label>
                <input type="text" class="form-input" id="full_name" placeholder="Enter your full name" required />
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" class="form-input" id="email" placeholder="Enter your email" required />
              </div>
            ` : ''}
            
            <div class="form-group">
              <label class="form-label">Username</label>
              <input type="text" class="form-input" id="username" placeholder="Enter your username" required />
            </div>
            
            <div class="form-group">
              <label class="form-label">Password</label>
              <input type="password" class="form-input" id="password" placeholder="Enter your password" required />
            </div>
            
            ${isRegister ? `
              <div class="form-group">
                <label class="form-label">I am a</label>
                <div class="role-selector">
                  <button type="button" class="role-btn ${selectedRole === 'student' ? 'active' : ''}" data-role="student">
                    🎓 Student
                  </button>
                  <button type="button" class="role-btn ${selectedRole === 'teacher' ? 'active' : ''}" data-role="teacher">
                    👨‍🏫 Teacher
                  </button>
                </div>
              </div>
            ` : ''}
            
            <button type="submit" class="btn btn-primary btn-lg" style="width:100%" id="submit-btn">
              ${isRegister ? 'Create Account' : 'Sign In'} →
            </button>
          </form>
          
          <div class="login-toggle">
            ${isRegister
              ? 'Already have an account? <a id="toggle-auth">Sign In</a>'
              : "Don't have an account? <a id=\"toggle-auth\">Register</a>"
            }
          </div>

          ${!isRegister ? `
            <div style="margin-top:var(--space-lg);padding-top:var(--space-lg);border-top:1px solid var(--border-primary);">
              <p style="font-size:0.8rem;color:var(--text-muted);text-align:center;margin-bottom:var(--space-sm);">Demo Credentials</p>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-sm);">
                <button type="button" class="btn btn-secondary btn-sm demo-login" data-user="prof_sharma" style="font-size:0.75rem;">
                  👨‍🏫 Teacher Demo
                </button>
                <button type="button" class="btn btn-secondary btn-sm demo-login" data-user="rahul_student" style="font-size:0.75rem;">
                  🎓 Student Demo
                </button>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    // Event handlers
    document.getElementById('toggle-auth').addEventListener('click', () => {
      isRegister = !isRegister;
      render();
    });

    // Role selector
    document.querySelectorAll('.role-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedRole = btn.dataset.role;
        document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Demo login buttons
    document.querySelectorAll('.demo-login').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          const data = await auth.login(btn.dataset.user, 'password123');
          setAuth(data, data.token);
          showToast(`Welcome, ${data.full_name}!`, 'success');
          navigate(data.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard');
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });

    // Form submit
    document.getElementById('auth-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('submit-btn');
      btn.disabled = true;
      btn.textContent = 'Please wait...';

      try {
        let data;
        if (isRegister) {
          data = await auth.register({
            username: document.getElementById('username').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            full_name: document.getElementById('full_name').value,
            role: selectedRole
          });
        } else {
          data = await auth.login(
            document.getElementById('username').value,
            document.getElementById('password').value
          );
        }

        setAuth(data, data.token);
        showToast(`Welcome, ${data.full_name}!`, 'success');
        navigate(data.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard');
      } catch (err) {
        showToast(err.message, 'error');
        btn.disabled = false;
        btn.textContent = isRegister ? 'Create Account →' : 'Sign In →';
      }
    });
  }

  render();
}

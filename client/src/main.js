import { registerRoute, startRouter, navigate } from './utils/router.js';
import { isLoggedIn, isTeacher, isStudent, getUser } from './utils/auth.js';
import { renderLogin } from './pages/login.js';
import { renderStudentDashboard } from './pages/student/dashboard.js';
import { renderStudentModules, renderModuleDetail } from './pages/student/modules.js';
import { renderQuizList, renderQuiz } from './pages/student/quiz.js';
import { renderStudentResults, renderAttemptReview } from './pages/student/results.js';
import { renderStudyMaterials } from './pages/student/materials.js';
import { renderERSimulator } from './pages/student/er-simulator.js';
import { renderTeacherDashboard } from './pages/teacher/dashboard.js';
import { renderCreateQuiz } from './pages/teacher/create-quiz.js';
import { renderManageQuizzes, renderQuizResults } from './pages/teacher/manage-quizzes.js';
import { renderManageModules } from './pages/teacher/manage-modules.js';
import { renderStudentMarks } from './pages/teacher/student-marks.js';
import { renderTeacherMaterials } from './pages/teacher/manage-materials.js';

// Guard middleware
function requireAuth(handler) {
  return (params) => {
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }
    handler(params);
  };
}

function requireStudent(handler) {
  return (params) => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    if (!isStudent()) { navigate('/teacher/dashboard'); return; }
    handler(params);
  };
}

function requireTeacher(handler) {
  return (params) => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    if (!isTeacher()) { navigate('/student/dashboard'); return; }
    handler(params);
  };
}

// Register routes
registerRoute('/login', () => {
  if (isLoggedIn()) {
    navigate(isTeacher() ? '/teacher/dashboard' : '/student/dashboard');
    return;
  }
  renderLogin();
});

// Student routes
registerRoute('/student/dashboard', requireStudent(() => renderStudentDashboard()));
registerRoute('/student/modules', requireStudent(() => renderStudentModules()));
registerRoute('/student/module/:id', requireStudent((params) => renderModuleDetail(params.id)));
registerRoute('/student/quizzes', requireStudent(() => renderQuizList()));
registerRoute('/student/quiz/:id', requireStudent((params) => renderQuiz(params.id)));
registerRoute('/student/results', requireStudent(() => renderStudentResults()));
registerRoute('/student/result/:id', requireStudent((params) => renderAttemptReview(params.id)));
registerRoute('/student/materials', requireStudent(() => renderStudyMaterials()));
registerRoute('/student/er-simulator', requireStudent(() => renderERSimulator()));

// Teacher routes
registerRoute('/teacher/dashboard', requireTeacher(() => renderTeacherDashboard()));
registerRoute('/teacher/create-quiz', requireTeacher(() => renderCreateQuiz()));
registerRoute('/teacher/quizzes', requireTeacher(() => renderManageQuizzes()));
registerRoute('/teacher/quiz-results/:id', requireTeacher((params) => renderQuizResults(params.id)));
registerRoute('/teacher/modules', requireTeacher(() => renderManageModules()));
registerRoute('/teacher/students', requireTeacher(() => renderStudentMarks()));
registerRoute('/teacher/materials', requireTeacher(() => renderTeacherMaterials()));

// Start router
startRouter((path) => {
  // Default route handling
  if (path === '/' || !path) {
    if (isLoggedIn()) {
      navigate(isTeacher() ? '/teacher/dashboard' : '/student/dashboard');
    } else {
      navigate('/login');
    }
  } else {
    // Unknown route — redirect
    navigate('/login');
  }
});

console.log('🗄️ DBMS Learning Platform initialized');

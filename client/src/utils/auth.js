export function getUser() {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function getToken() {
  return localStorage.getItem('token');
}

export function setAuth(user, token) {
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('token', token);
}

export function clearAuth() {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
}

export function isLoggedIn() {
  return !!getToken() && !!getUser();
}

export function isTeacher() {
  const user = getUser();
  return user?.role === 'teacher';
}

export function isStudent() {
  const user = getUser();
  return user?.role === 'student';
}

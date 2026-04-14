const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getHeaders() {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export async function request(path, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: getHeaders(),
      signal: controller.signal,
      ...options
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { error: text || `Server returned ${response.status} ${response.statusText}` };
    }

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Something went wrong');
    }

    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. The server might be waking up (Render free tier). Please try again in 30 seconds.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Auth
export const auth = {
  login: (username, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  }),
  register: (data) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  me: () => request('/auth/me')
};

// Modules
export const modules = {
  list: () => request('/modules'),
  get: (id) => request(`/modules/${id}`),
  create: (data) => request('/modules', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id, data) => request(`/modules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id) => request(`/modules/${id}`, { method: 'DELETE' })
};

// Quizzes
export const quizzes = {
  list: () => request('/quizzes'),
  get: (id) => request(`/quizzes/${id}`),
  create: (data) => request('/quizzes', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id, data) => request(`/quizzes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id) => request(`/quizzes/${id}`, { method: 'DELETE' }),
  start: (id) => request(`/quizzes/${id}/start`, { method: 'POST' }),
  submit: (id, attemptId, answers) => request(`/quizzes/${id}/submit`, {
    method: 'POST',
    body: JSON.stringify({ attempt_id: attemptId, answers })
  }),
  bulkImport: (data) => request('/quizzes/bulk-import', {
    method: 'POST',
    body: JSON.stringify(data)
  })
};

// Results
export const results = {
  my: () => request('/results/my'),
  quiz: (quizId) => request(`/results/quiz/${quizId}`),
  students: () => request('/results/students'),
  attempt: (attemptId) => request(`/results/attempt/${attemptId}`)
};

// Materials
export const materials = {
  list: () => request('/materials'),
  byType: (type) => request(`/materials/type/${type}`),
  create: (data) => request('/materials', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  delete: (id) => request(`/materials/${id}`, { method: 'DELETE' }),
  uploadFile: async (formData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/materials/upload`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Upload failed');
    return data;
  },
  purchase: (materialId, amount = 2) => request('/materials/purchase', {
    method: 'POST',
    body: JSON.stringify({ material_id: materialId, amount })
  })
};

// Chatbot
export const chatbot = {
  ask: (message, history) => request('/chatbot/ask', {
    method: 'POST',
    body: JSON.stringify({ message, history })
  })
};

// Simple SPA Router

const routes = {};
let currentRoute = null;

export function registerRoute(path, handler) {
  routes[path] = handler;
}

export function navigate(path) {
  window.location.hash = path;
}

export function getCurrentRoute() {
  return window.location.hash.slice(1) || '/login';
}

export function getRouteParams() {
  const hash = window.location.hash.slice(1);
  const parts = hash.split('/');
  return parts;
}

export function startRouter(onRouteChange) {
  function handleRoute() {
    const path = getCurrentRoute();
    
    // Find matching route
    let handler = null;
    let params = {};

    for (const [pattern, h] of Object.entries(routes)) {
      const match = matchRoute(pattern, path);
      if (match) {
        handler = h;
        params = match;
        break;
      }
    }

    if (handler) {
      currentRoute = path;
      handler(params);
    } else if (onRouteChange) {
      onRouteChange(path);
    }
  }

  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

function matchRoute(pattern, path) {
  const patternParts = pattern.split('/');
  const pathParts = path.split('/');

  if (patternParts.length !== pathParts.length) return null;

  const params = {};

  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = pathParts[i];
    } else if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }

  return params;
}

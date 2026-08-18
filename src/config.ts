/// <reference types="vite/client" />

/**
 * Paper Market Pro - Configuration & Service Environment Resolvers
 */

export const getBackendBaseUrl = (): string => {
  const metaEnv = (import.meta as any).env;
  if (metaEnv?.VITE_BACKEND_URL) {
    return metaEnv.VITE_BACKEND_URL.replace(/\/$/, '');
  }
  return '';
};

export const getApiUrl = (endpoint: string): string => {
  const base = getBackendBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return base ? `${base}${cleanEndpoint}` : cleanEndpoint;
};

export const getWsUrl = (): string => {
  const metaEnv = (import.meta as any).env;
  if (metaEnv?.VITE_WS_URL) {
    return metaEnv.VITE_WS_URL;
  }
  const base = getBackendBaseUrl();
  if (base) {
    const wsProto = base.startsWith('https') ? 'wss:' : 'ws:';
    const host = base.replace(/^https?:\/\//, '').replace(/\/$/, '');
    return `${wsProto}//${host}/api/ws`;
  }
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/api/ws`;
  }
  return 'ws://localhost:3000/api/ws';
};

// Shared API utility helpers for CSRF, headers, and error handling

export const API_BASE = import.meta.env.VITE_API_BASE_URL;

export const getCsrfToken = () =>
  document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

export const buildHeaders = (extra = {}) => {
  const token = getCsrfToken();
  return {
    'Accept': 'application/json',
    ...(token ? { 'X-CSRF-Token': token } : {}),
    ...extra,
  };
};

export const handleResponse = async (res, errorMsg) => {
  if (!res.ok) throw new Error(errorMsg);
  return res.json();
};

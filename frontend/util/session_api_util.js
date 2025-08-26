const API_BASE = import.meta.env.VITE_API_BASE_URL;

export const signup = async (user) => {
  const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  const res = await fetch(`${API_BASE}/api/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { 'X-CSRF-Token': token } : {})
    },
    body: JSON.stringify({ user })
  });
  if (!res.ok) throw new Error('Failed to sign up');
  return res.json();
};

export const createDemoUser = async () => {
  const demoUser = {
    email: `demo-user-${Math.floor(Math.random() * 1000000)}-${Math.floor(Math.random() * 1000000)}@demo.com`,
    first_name: "Demo",
    last_name: "User",
    password: `password`
  };
  const res = await fetch(`${API_BASE}/api/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ user: demoUser })
  });
  if (!res.ok) throw new Error('Failed to create demo user');
  return res.json();
};

export const login = async (user) => {
  const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  const res = await fetch(`${API_BASE}/api/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { 'X-CSRF-Token': token } : {})
    },
    body: JSON.stringify({ user })
  });
  if (!res.ok) throw new Error('Failed to login');
  return res.json();
};

export const logout = async () => {
  const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  const res = await fetch(`${API_BASE}/api/session`, {
    method: 'DELETE',
    headers: {
      'Accept': 'application/json',
      ...(token ? { 'X-CSRF-Token': token } : {})
    }
  });
  if (!res.ok) throw new Error('Failed to logout');
  return res.json();
};

/* ============================================
   INFINITE SERVICES – Auth Manager
   Role-based authentication using localStorage
   ============================================ */

const AuthManager = (() => {
  'use strict';

  const USERS_KEY   = 'inf_users';
  const SESSION_KEY = 'inf_session';

  /* ------ Storage helpers ------ */
  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
    catch { return null; }
  }
  function saveSession(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }
  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  // API configuration - Change this to your deployed backend URL in production
  // (e.g., 'https://infinity-backend.onrender.com') when deploying the frontend and backend separately.
  const API_BASE = 'http://localhost:8080';

  /* ------ Sign Up (Async) ------ */
  async function signUp({ name, email, password, role }) {
    try {
      const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.error(err);
      return { ok: false, error: 'Network error connecting to server.' };
    }
  }

  /* ------ Sign In (Async) ------ */
  async function signIn({ email, password }) {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.ok && data.user) {
        saveSession(data.user);
      }
      return data;
    } catch (err) {
      console.error(err);
      return { ok: false, error: 'Network error connecting to server.' };
    }
  }

  /* ------ Sign Out ------ */
  function signOut() {
    clearSession();
    window.location.href = 'index.html';
  }

  /* ------ Get current user ------ */
  function currentUser() {
    return getSession();
  }

  /* ------ Check if logged in ------ */
  function isLoggedIn() {
    return !!getSession();
  }

  /* ------ Redirect based on role ------ */
  function redirectToDashboard(user) {
    if (user.role === 'owner') {
      window.location.href = 'owner.html';
    } else {
      window.location.href = 'dashboard.html';
    }
  }

  /* ------ Guard: require login (call on protected pages) ------ */
  function requireAuth(expectedRole) {
    const user = getSession();
    if (!user) {
      window.location.href = 'index.html';
      return null;
    }
    if (expectedRole && user.role !== expectedRole) {
      // Wrong role — send to the right dashboard
      redirectToDashboard(user);
      return null;
    }
    return user;
  }


  return { signUp, signIn, signOut, currentUser, isLoggedIn, redirectToDashboard, requireAuth };
})();

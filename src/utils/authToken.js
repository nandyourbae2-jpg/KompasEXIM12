// src/utils/authToken.js

const SESSION_KEY = 'kompas_exim_session';

export const getToken = () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed?.token || null;
    }
  } catch (error) {
    console.error('Error reading token from localStorage', error);
  }
  return null;
};

export const setToken = (userSessionData) => {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(userSessionData));
  } catch (error) {
    console.error('Error setting token to localStorage', error);
  }
};

export const clearToken = () => {
  localStorage.removeItem(SESSION_KEY);
};

export const getSessionData = () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch (error) {
    console.error('Error reading session data from localStorage', error);
  }
  return null;
};

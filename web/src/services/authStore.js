let authToken = null;
const STORAGE_KEY = "ik_auth_token";

const storageAvailable = () => {
  try {
    return typeof localStorage !== "undefined";
  } catch (e) {
    return false;
  }
};

export function getAuthToken() {
  if (!authToken && storageAvailable()) {
    authToken = localStorage.getItem(STORAGE_KEY);
  }
  return authToken;
}

export function setAuthToken(token) {
  authToken = token;
  if (storageAvailable() && token) {
    localStorage.setItem(STORAGE_KEY, token);
  }
}

export function clearAuthToken() {
  authToken = null;
  if (storageAvailable()) {
    localStorage.removeItem(STORAGE_KEY);
  }
}

const CREDENTIALS_KEY = "ik_saved_credentials";

export function getSavedCredentials() {
  if (storageAvailable()) {
    const data = localStorage.getItem(CREDENTIALS_KEY);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        return null;
      }
    }
  }
  return null;
}

export function setSavedCredentials(credentials) {
  if (storageAvailable() && credentials) {
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
  }
}

export function clearSavedCredentials() {
  if (storageAvailable()) {
    localStorage.removeItem(CREDENTIALS_KEY);
  }
}

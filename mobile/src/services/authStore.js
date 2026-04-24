import * as SecureStore from "expo-secure-store";

let authToken = null;
let authProfile = null;
const TOKEN_KEY = "ik_auth_token";
const PROFILE_KEY = "ik_auth_profile";
const CREDENTIALS_KEY = "ik_saved_credentials";

const storageAvailable = () => {
  try {
    return typeof localStorage !== "undefined";
  } catch (e) {
    return false;
  }
};

async function getItem(key) {
  try {
    const value = await SecureStore.getItemAsync(key);
    if (value !== null && value !== undefined) return value;
  } catch (e) {
    // ignore and fallback
  }
  if (storageAvailable()) {
    return localStorage.getItem(key);
  }
  return null;
}

async function setItem(key, value) {
  try {
    if (value) {
      await SecureStore.setItemAsync(key, value);
      return;
    }
  } catch (e) {
    // ignore and fallback
  }
  if (storageAvailable() && value) {
    localStorage.setItem(key, value);
  }
}

async function deleteItem(key) {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (e) {
    // ignore and fallback
  }
  if (storageAvailable()) {
    localStorage.removeItem(key);
  }
}

export async function getAuthToken() {
  if (!authToken) {
    authToken = await getItem(TOKEN_KEY);
  }
  return authToken;
}

export async function setAuthToken(token) {
  authToken = token || null;
  if (token) {
    await setItem(TOKEN_KEY, token);
  }
}

export async function clearAuthToken() {
  authToken = null;
  await deleteItem(TOKEN_KEY);
}

export async function getAuthProfile() {
  if (!authProfile) {
    const raw = await getItem(PROFILE_KEY);
    if (raw) {
      try {
        authProfile = JSON.parse(raw);
      } catch (e) {
        authProfile = null;
      }
    }
  }
  return authProfile;
}

export async function setAuthProfile(profile) {
  authProfile = profile || null;
  if (profile) {
    await setItem(PROFILE_KEY, JSON.stringify(profile));
  }
}

export async function clearAuthProfile() {
  authProfile = null;
  await deleteItem(PROFILE_KEY);
}

export async function getSavedCredentials() {
  const data = await getItem(CREDENTIALS_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      return null;
    }
  }
  return null;
}

export async function setSavedCredentials(credentials) {
  if (credentials) {
    await setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
  }
}

export async function clearSavedCredentials() {
  await deleteItem(CREDENTIALS_KEY);
}

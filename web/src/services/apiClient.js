import { getAuthToken } from "./authStore";

const API_BASE_URL = String(process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:8000").replace(/\/+$/, "");

function buildHeaders(options = {}) {
  const headers = {
    ...(options.headers || {}),
  };
  if (options.contentType !== null) {
    headers["Content-Type"] = options.contentType || "application/json";
  }
  if (options.auth !== false) {
    const token = getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }
  return headers;
}

async function handleResponse(res) {
  if (!res.ok) {
    let message = "Network error";
    try {
      const data = await res.json();
      message = data.detail || data.message || message;
    } catch (e) {
      // ignore json parse errors
    }
    throw new Error(message);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function safeFetch(path, options, maxRetries = 4) {
  const url = `${API_BASE_URL}${path}`;
  let attempt = 0;
  
  while (attempt <= maxRetries) {
    try {
      const res = await fetch(url, options);
      return await handleResponse(res);
    } catch (err) {
      const isNetworkError = err.message.includes("Failed to fetch") || err.message.includes("NetworkError");
      
      if (isNetworkError && attempt < maxRetries) {
        attempt++;
        const waitTime = attempt * 2000; // Exponential backoff: 2s, 4s, 6s...
        console.warn(`[API Client] Connectivity issue on ${url}. Server may be waking up. Retrying attempt ${attempt} in ${waitTime}ms...`);
        await delay(waitTime);
        continue;
      }
      
      if (isNetworkError) {
        throw new Error(`Unable to connect to the server at ${url}. The server is taking too long to respond (likely a cold start). Please try one more time in a few seconds.`);
      }
      throw err;
    }
  }
}

export async function apiGet(path, options = {}) {
  return safeFetch(path, {
    method: "GET",
    headers: buildHeaders(options),
  });
}

export async function apiPost(path, body, options = {}) {
  return safeFetch(path, {
    method: "POST",
    headers: buildHeaders(options),
    body: JSON.stringify(body),
  });
}

export async function apiPut(path, body, options = {}) {
  return safeFetch(path, {
    method: "PUT",
    headers: buildHeaders(options),
    body: JSON.stringify(body),
  });
}

export async function apiDelete(path, options = {}) {
  return safeFetch(path, {
    method: "DELETE",
    headers: buildHeaders(options),
  });
}

export async function apiUpload(path, formData, options = {}) {
  return safeFetch(path, {
    method: "POST",
    headers: buildHeaders({ ...options, contentType: null }),
    body: formData,
  });
}

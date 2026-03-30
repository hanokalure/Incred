import { getAuthToken } from "./authStore";
import { getApiBaseUrl, getApiBaseUrls } from "./runtimeConfig";

let API_BASE_URL = getApiBaseUrl();

async function buildHeaders(options = {}) {
  const headers = {
    ...(options.headers || {}),
  };
  if (options.contentType !== null) {
    headers["Content-Type"] = options.contentType || "application/json";
  }
  if (options.auth !== false) {
    const token = await getAuthToken();
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

function isNetworkFailure(error) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("network request failed") || message.includes("failed to fetch");
}

async function fetchWithBaseFallback(path, options) {
  const candidateBases = [API_BASE_URL, ...getApiBaseUrls().filter((url) => url !== API_BASE_URL)];
  let lastError = null;

  for (const base of candidateBases) {
    try {
      const res = await fetch(`${base}${path}`, options);
      API_BASE_URL = base;
      return res;
    } catch (error) {
      lastError = error;
      if (!isNetworkFailure(error)) break;
    }
  }

  throw lastError || new Error("Network request failed");
}

export async function apiGet(path, options = {}) {
  const res = await fetchWithBaseFallback(path, {
    method: "GET",
    headers: await buildHeaders(options),
  });
  return handleResponse(res);
}

export async function apiPost(path, body, options = {}) {
  const res = await fetchWithBaseFallback(path, {
    method: "POST",
    headers: await buildHeaders(options),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function apiPut(path, body, options = {}) {
  const res = await fetchWithBaseFallback(path, {
    method: "PUT",
    headers: await buildHeaders(options),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function apiDelete(path, options = {}) {
  const res = await fetchWithBaseFallback(path, {
    method: "DELETE",
    headers: await buildHeaders(options),
  });
  return handleResponse(res);
}

export async function apiUpload(path, formData, options = {}) {
  const res = await fetchWithBaseFallback(path, {
    method: "POST",
    headers: await buildHeaders({ ...options, contentType: null }),
    body: formData,
  });
  return handleResponse(res);
}

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

export async function apiGet(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers: buildHeaders(options),
  });
  return handleResponse(res);
}

export async function apiPost(path, body, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: buildHeaders(options),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function apiPut(path, body, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "PUT",
    headers: buildHeaders(options),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function apiDelete(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "DELETE",
    headers: buildHeaders(options),
  });
  return handleResponse(res);
}

export async function apiUpload(path, formData, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: buildHeaders({ ...options, contentType: null }),
    body: formData,
  });
  return handleResponse(res);
}

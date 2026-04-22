import { getAuthToken } from "./authStore";
import { getApiBaseUrl, getApiBaseUrls, setApiBaseUrl } from "./runtimeConfig";
const REQUEST_TIMEOUT_MS = 8000;

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
  return (
    message.includes("network request failed") ||
    message.includes("failed to fetch") ||
    message.includes("request timed out") ||
    error?.name === "AbortError"
  );
}

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs || REQUEST_TIMEOUT_MS);

  try {
    const { timeoutMs, ...fetchOptions } = options;
    return await fetch(url, { ...fetchOptions, signal: controller.signal });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Request timed out");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchWithBaseFallback(path, options) {
  const activeBase = getApiBaseUrl();
  const candidateBases = [activeBase, ...getApiBaseUrls().filter((url) => url !== activeBase)];
  let lastError = null;

  for (const base of candidateBases) {
    try {
      const res = await fetchWithTimeout(`${base}${path}`, options);
      setApiBaseUrl(base);
      return res;
    } catch (error) {
      lastError = error;
      if (!isNetworkFailure(error)) break;
    }
  }

  if (lastError && isNetworkFailure(lastError)) {
    throw new Error(`Network request failed. Tried: ${candidateBases.join(", ")}`);
  }

  throw lastError || new Error("Network request failed");
}

export async function apiGet(path, options = {}) {
  const res = await fetchWithBaseFallback(path, {
    method: "GET",
    headers: await buildHeaders(options),
    timeoutMs: options.timeoutMs,
  });
  return handleResponse(res);
}

export async function apiPost(path, body, options = {}) {
  const res = await fetchWithBaseFallback(path, {
    method: "POST",
    headers: await buildHeaders(options),
    body: JSON.stringify(body),
    timeoutMs: options.timeoutMs,
  });
  return handleResponse(res);
}

export async function apiPut(path, body, options = {}) {
  const res = await fetchWithBaseFallback(path, {
    method: "PUT",
    headers: await buildHeaders(options),
    body: JSON.stringify(body),
    timeoutMs: options.timeoutMs,
  });
  return handleResponse(res);
}

export async function apiDelete(path, options = {}) {
  const res = await fetchWithBaseFallback(path, {
    method: "DELETE",
    headers: await buildHeaders(options),
    timeoutMs: options.timeoutMs,
  });
  return handleResponse(res);
}

export async function apiUpload(path, formData, options = {}) {
  const res = await fetchWithBaseFallback(path, {
    method: "POST",
    headers: await buildHeaders({ ...options, contentType: null }),
    body: formData,
    timeoutMs: options.timeoutMs || 120000, // 120 seconds for uploads
  });
  return handleResponse(res);
}

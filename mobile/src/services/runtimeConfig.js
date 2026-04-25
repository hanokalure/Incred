import { NativeModules, Platform } from "react-native";
import Constants from "expo-constants";

let resolvedApiBaseUrl = "";

function normalizeBaseUrl(value) {
  // Always strip trailing slashes to prevent double-slash 308 redirect bugs on Vercel
  return String(value || "").trim().replace(/\/+$/, "");
}

function hostFromExpoRuntime() {
  const hostUri =
    Constants?.expoConfig?.hostUri ||
    Constants?.expoGoConfig?.debuggerHost ||
    Constants?.manifest?.debuggerHost ||
    Constants?.manifest2?.extra?.expoGo?.debuggerHost ||
    "";
  if (!hostUri) return "";
  return hostUri.split(":")[0];
}

function hostFromBundleUrl() {
  const scriptUrl = NativeModules?.SourceCode?.scriptURL || "";
  if (!scriptUrl) return "";

  try {
    const parsed = new URL(scriptUrl);
    return parsed.hostname || "";
  } catch (e) {
    return "";
  }
}

export function getApiBaseUrls() {
  const explicit = normalizeBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL);
  const urls = [];
  const push = (url) => {
    const normalized = normalizeBaseUrl(url);
    if (!normalized) return;
    if (!urls.includes(normalized)) urls.push(normalized);
  };

  // Prefer the last known working URL over the static .env URL.
  // This helps when laptop IP changes and fallback discovers a new reachable host.
  if (resolvedApiBaseUrl) push(resolvedApiBaseUrl);
  if (explicit) push(explicit);

  const host = hostFromExpoRuntime();
  // Keep local fallbacks even when .env has an explicit URL.
  // This avoids total signup/login failure if laptop IP changes on Wi-Fi.
  if (host) push(`http://${host}:8000`);
  const bundleHost = hostFromBundleUrl();
  if (bundleHost) push(`http://${bundleHost}:8000`);
  if (Platform.OS === "android") push("http://10.0.2.2:8000");
  push("http://127.0.0.1:8000");
  push("http://localhost:8000");

  return urls;
}

export function getApiBaseUrl() {
  const urls = getApiBaseUrls();
  const next = urls[0] || "http://localhost:8000";
  resolvedApiBaseUrl = normalizeBaseUrl(next);
  console.log("[RuntimeConfig] Active API Base URL:", resolvedApiBaseUrl);
  return resolvedApiBaseUrl;
}

export function setApiBaseUrl(url) {
  const normalized = normalizeBaseUrl(url);
  if (!normalized) return;
  resolvedApiBaseUrl = normalized;
}

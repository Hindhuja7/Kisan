const DEFAULT_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
const API_PORT = process.env.NEXT_PUBLIC_API_PORT || "8001";

function isLanHost(host: string): boolean {
  return (
    host.startsWith("192.168.") ||
    host.startsWith("10.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  );
}

function isLocalDev(host: string): boolean {
  return host === "localhost" || host === "127.0.0.1";
}

/** Production uses NEXT_PUBLIC_API_URL; LAN dev uses laptop IP:8001. */
export function getApiBase(): string {
  if (typeof window === "undefined") {
    return DEFAULT_API;
  }

  const host = window.location.hostname;
  const protocol = window.location.protocol;

  if (isLocalDev(host)) {
    return DEFAULT_API;
  }

  if (isLanHost(host)) {
    return `http://${host}:${API_PORT}`;
  }

  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  }

  if (protocol === "https:") {
    return `https://kisanmitra-api.onrender.com`;
  }

  return DEFAULT_API;
}

function buildHeaders(options?: RequestInit): HeadersInit {
  const method = (options?.method || "GET").toUpperCase();
  const hasBody = options?.body != null;
  const headers: Record<string, string> = { ...(options?.headers as Record<string, string>) };
  if (hasBody && method !== "GET" && method !== "HEAD") {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }
  return headers;
}

export async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const base = getApiBase();
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      ...options,
      headers: buildHeaders(options),
    });
  } catch {
    throw new Error(`Cannot reach backend at ${base}. Check NEXT_PUBLIC_API_URL.`);
  }
  if (!res.ok) throw new Error(`API error ${res.status} at ${base}${path}`);
  return res.json();
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBase()}/api/health`, { cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

export interface NetworkInfo {
  lan_ip: string;
  frontend_port: number;
  api_port: number;
  phone_login_url: string;
  phone_dashboard_url: string;
  api_url: string;
}

export async function fetchNetworkInfo(): Promise<NetworkInfo | null> {
  if (typeof window !== "undefined" && !isLocalDev(window.location.hostname) && !isLanHost(window.location.hostname)) {
    return null;
  }
  try {
    const res = await fetch(`${getApiBase()}/api/network/info`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export function getApiBasePublic() {
  return getApiBase();
}

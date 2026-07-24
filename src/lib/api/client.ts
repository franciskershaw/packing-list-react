import { getAccessToken, setAccessToken } from "./tokenStore";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

let refreshPromise: Promise<string> | null = null;

async function performRefresh(): Promise<string> {
  const res = await fetch("/api/auth/refresh", { method: "POST" });
  if (!res.ok) {
    setAccessToken(null);
    throw new ApiError(res.status, "failed to refresh session");
  }
  const data = (await res.json()) as { accessToken: string };
  setAccessToken(data.accessToken);
  return data.accessToken;
}

export function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  hasRetried = false,
): Promise<T> {
  const token = getAccessToken();
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (res.status === 401 && !hasRetried) {
    await refreshAccessToken();
    return apiFetch<T>(path, options, true);
  }

  if (!res.ok) {
    let message = "request failed";
    try {
      const body = await res.json();
      if (typeof body?.error === "string") {
        message = body.error;
      }
    } catch {
      // non-JSON body — keep the generic fallback
    }
    throw new ApiError(res.status, message);
  }

  return res.json() as Promise<T>;
}

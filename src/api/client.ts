import { getAccessToken, setAccessToken } from "./authToken";

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(`API error ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

// Real fetch throws on .json() against an empty body (e.g. a 204, or an
// error response with no body) — this is normal, not just for the tests.
async function safeParseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers = new Headers({ "Content-Type": "application/json" });
  const token = getAccessToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401) {
    setAccessToken(null);
  }

  if (!response.ok) {
    throw new ApiError(response.status, await safeParseJson(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await safeParseJson(response)) as T;
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>("GET", path);
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>("POST", path, body);
}

export function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>("PATCH", path, body);
}

export function apiDelete<T>(path: string): Promise<T> {
  return request<T>("DELETE", path);
}

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

export async function apiGet<T>(_path: string): Promise<T> {
  throw new Error("not implemented");
}

export async function apiPost<T>(_path: string, _body?: unknown): Promise<T> {
  throw new Error("not implemented");
}

export async function apiPatch<T>(_path: string, _body?: unknown): Promise<T> {
  throw new Error("not implemented");
}

export async function apiDelete<T>(_path: string): Promise<T> {
  throw new Error("not implemented");
}

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000";

const CLIENT_LOG =
  process.env.NEXT_PUBLIC_API_DEBUG === "1" ||
  process.env.NODE_ENV !== "production";

/**
 * Preferred client log shape:
 *   clientLog("functionName", "whatever message we want to pass", extra?)
 * Prints: (functionName) message
 */
function clientLog(
  functionName: string,
  message: string,
  extra?: unknown
) {
  if (!CLIENT_LOG) return;
  const line = `(${functionName}) ${message}`;
  if (extra !== undefined) {
    console.info(line, extra);
    return;
  }
  console.info(line);
}

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export async function apiGet<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  return apiJson<T>("GET", path, init);
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
  init?: RequestInit
): Promise<T> {
  return apiJson<T>("POST", path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function apiJson<T>(
  method: string,
  path: string,
  init?: RequestInit
): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const started =
    typeof performance !== "undefined" ? performance.now() : Date.now();
  const fn = method === "GET" ? "apiGet" : "apiPost";
  clientLog(fn, `→ ${method} ${url}`);
  const res = await fetch(url, {
    ...init,
    method,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const ms = Math.round(
    (typeof performance !== "undefined" ? performance.now() : Date.now()) -
      started
  );
  const requestId = res.headers.get("x-request-id");

  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = await res.text().catch(() => null);
    }
    const message =
      typeof body === "object" &&
      body &&
      "message" in body &&
      typeof (body as { message: unknown }).message === "string"
        ? (body as { message: string }).message
        : `Request failed (${res.status})`;
    clientLog(fn, `← ${method} ${url} ${res.status} ${ms}ms`, {
      requestId,
      message,
      body,
    });
    throw new ApiError(message, res.status, body);
  }

  clientLog(fn, `← ${method} ${url} ${res.status} ${ms}ms`, { requestId });
  return res.json() as Promise<T>;
}

export function sseUrl(path: string): string {
  return path.startsWith("http") ? path : `${API_BASE}${path}`;
}

export { clientLog };

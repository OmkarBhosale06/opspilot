export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000";

const CLIENT_LOG =
  process.env.NEXT_PUBLIC_API_DEBUG === "1" ||
  process.env.NODE_ENV !== "production";

function clientLog(scope: "api" | "sse", message: string, extra?: unknown) {
  if (!CLIENT_LOG) return;
  if (extra !== undefined) {
    console.info(`[opspilot:${scope}] ${message}`, extra);
    return;
  }
  console.info(`[opspilot:${scope}] ${message}`);
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
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const started =
    typeof performance !== "undefined" ? performance.now() : Date.now();
  clientLog("api", `→ GET ${url}`);
  const res = await fetch(url, {
    ...init,
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
    clientLog("api", `← GET ${url} ${res.status} ${ms}ms`, {
      requestId,
      message,
      body,
    });
    throw new ApiError(message, res.status, body);
  }

  clientLog("api", `← GET ${url} ${res.status} ${ms}ms`, { requestId });
  return res.json() as Promise<T>;
}

export function sseUrl(path: string): string {
  return path.startsWith("http") ? path : `${API_BASE}${path}`;
}

export { clientLog };

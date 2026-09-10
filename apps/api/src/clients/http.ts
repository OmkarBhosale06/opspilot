import type { AppLogger } from "../logging.js";
import { createFnLog, summarizeUrl } from "../logging.js";

export async function loggedFetch(
  log: AppLogger | undefined,
  url: string,
  init?: RequestInit,
  client = "http"
): Promise<Response> {
  const flog = createFnLog(log);
  const method = (init?.method ?? "GET").toUpperCase();
  const started = Date.now();
  const target = summarizeUrl(url);
  flog.debug("loggedFetch", "outbound request", { client, method, url: target });
  try {
    const res = await fetch(url, init);
    const ms = Date.now() - started;
    const fields = { client, method, url: target, status: res.status, ms };
    if (res.ok) {
      flog.debug("loggedFetch", "outbound response", fields);
    } else {
      flog.warn("loggedFetch", "outbound response", fields);
    }
    return res;
  } catch (err) {
    flog.warn("loggedFetch", "outbound failed", {
      client,
      method,
      url: target,
      err,
      ms: Date.now() - started,
    });
    throw err;
  }
}

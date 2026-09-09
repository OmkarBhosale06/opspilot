import type { AppLogger } from "../logging.js";
import { summarizeUrl } from "../logging.js";

export async function loggedFetch(
  log: AppLogger | undefined,
  url: string,
  init?: RequestInit,
  client = "http"
): Promise<Response> {
  const method = (init?.method ?? "GET").toUpperCase();
  const started = Date.now();
  const target = summarizeUrl(url);
  log?.debug({ client, method, url: target }, "outbound request");
  try {
    const res = await fetch(url, init);
    const ms = Date.now() - started;
    const payload = { client, method, url: target, status: res.status, ms };
    if (res.ok) {
      log?.debug(payload, "outbound response");
    } else {
      log?.warn(payload, "outbound response");
    }
    return res;
  } catch (err) {
    log?.warn(
      { client, method, url: target, err, ms: Date.now() - started },
      "outbound failed"
    );
    throw err;
  }
}

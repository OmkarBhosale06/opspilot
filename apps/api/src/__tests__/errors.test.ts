import { describe, expect, it } from "vitest";
import {
  isUnavailable,
  KubernetesUnavailableError,
} from "../types/errors.js";

describe("isUnavailable", () => {
  it("matches connection-level failures", () => {
    expect(isUnavailable(new KubernetesUnavailableError("kind down"))).toBe(true);
    expect(isUnavailable(new Error("fetch failed: ECONNREFUSED"))).toBe(true);
    expect(isUnavailable(new Error("connect ETIMEDOUT"))).toBe(true);
  });

  it("does not treat apiserver 500 keepalive as a permanent outage", () => {
    const err = new Error(
      'HTTP-Code: 500\nMessage: Unknown API Status Code!\nBody: "rpc error: code = Unavailable desc = keepalive ping failed to receive ACK within timeout"'
    );
    expect(isUnavailable(err)).toBe(false);
  });
});

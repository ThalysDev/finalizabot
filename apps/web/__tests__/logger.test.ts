import { afterEach, describe, expect, it, vi } from "vitest";
import { logger } from "../src/lib/logger";

describe("logger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    process.env.NODE_ENV = "test";
  });

  it("redacts stack and cause in production error logs", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    process.env.NODE_ENV = "production";

    const err = new Error("boom");
    err.cause = { detail: "internal" };

    logger.error("failure", err);

    expect(spy).toHaveBeenCalledTimes(1);
    const message = String(spy.mock.calls[0][0]);
    expect(message).toContain("failure");
    expect(message).toContain("\"message\":\"boom\"");
    expect(message).not.toContain("\"stack\"");
    expect(message).not.toContain("\"cause\"");
  });

  it("does not throw on circular payloads", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    const circular: Record<string, unknown> = {};
    circular.self = circular;

    expect(() => logger.info("circular", circular)).not.toThrow();

    expect(spy).toHaveBeenCalledTimes(1);
    const message = String(spy.mock.calls[0][0]);
    expect(message).toContain("Unserializable log payload");
  });
});

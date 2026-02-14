/**
 * Structured logger for Next.js web app.
 * Same pattern as apps/etl — zero dependencies, JSON-serialised extras.
 */

type Level = "debug" | "info" | "warn" | "error";

function safeStringify(data: unknown): string {
  try {
    return JSON.stringify(data);
  } catch {
    return JSON.stringify({ message: "Unserializable log payload" });
  }
}

function serialize(data: unknown): string {
  if (data instanceof Error) {
    const obj: Record<string, unknown> = {
      message: data.message,
      name: data.name,
    };
    const includeDetails = process.env.NODE_ENV !== "production";
    if (includeDetails && data.stack) obj.stack = data.stack;
    if (includeDetails && data.cause !== undefined) obj.cause = data.cause;
    return safeStringify(obj);
  }
  return safeStringify(data);
}

function format(level: Level, msg: string, data?: unknown): string {
  const ts = new Date().toISOString();
  const extra = data !== undefined ? ` ${serialize(data)}` : "";
  return `${ts} [${level.toUpperCase()}] ${msg}${extra}`;
}

export const logger = {
  debug(msg: string, data?: unknown): void {
    if (process.env.NODE_ENV !== "production") {
      console.debug(format("debug", msg, data));
    }
  },
  info(msg: string, data?: unknown): void {
    console.info(format("info", msg, data));
  },
  warn(msg: string, data?: unknown): void {
    console.warn(format("warn", msg, data));
  },
  error(msg: string, data?: unknown): void {
    console.error(format("error", msg, data));
  },
};

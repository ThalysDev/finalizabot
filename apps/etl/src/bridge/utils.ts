export function isNumericId(value: string): boolean {
  return /^\d+$/.test(value);
}

export function mapStatus(
  statusType: string | null,
  statusCode: number | null,
  startTime: Date,
): string {
  const type = statusType?.toLowerCase();
  if (type === "finished") return "finished";
  if (type === "inprogress" || type === "live") return "live";
  if (type === "notstarted") return "scheduled";
  if (statusCode === 100) return "finished";
  if (statusCode === 0 || statusCode === 1) return "scheduled";
  if (statusCode === 2 || statusCode === 3) return "live";
  return startTime < new Date() ? "finished" : "scheduled";
}
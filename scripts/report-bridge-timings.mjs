import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const inputPath = process.argv[2]?.trim() || process.env.BRIDGE_TIMINGS_FILE || "logs/bridge-timings.jsonl";
const historyLimit = Math.max(20, parseInt(process.env.BRIDGE_TIMINGS_HISTORY ?? "200", 10) || 200);
const filePath = resolve(process.cwd(), inputPath);

function percentile(values, p) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return sorted[index] ?? null;
}

function formatMs(value) {
  if (value == null || !Number.isFinite(value)) return "n/a";
  return `${Math.round(value)}ms`;
}

function parseHistory(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(-historyLimit)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .filter((entry) => typeof entry.totalMs === "number" && entry.stages && typeof entry.stages === "object");
}

async function main() {
  let content;
  try {
    content = await readFile(filePath, "utf8");
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === "ENOENT") {
      console.log(`[Bridge Timings] Arquivo não encontrado: ${filePath}`);
      console.log("[Bridge Timings] Execute o bridge ao menos uma vez para gerar baseline.");
      process.exit(0);
    }
    throw err;
  }

  const runs = parseHistory(content);
  if (runs.length === 0) {
    console.log(`[Bridge Timings] Sem dados válidos no histórico (${filePath}).`);
    process.exit(0);
  }

  const successfulRuns = runs.filter((run) => run.status !== "failed");
  const sample = successfulRuns.length > 0 ? successfulRuns : runs;

  const totalValues = sample.map((run) => run.totalMs).filter(Number.isFinite);
  const stageValues = new Map();

  for (const run of sample) {
    for (const [stage, elapsedMs] of Object.entries(run.stages)) {
      if (!Number.isFinite(elapsedMs)) continue;
      const values = stageValues.get(stage) ?? [];
      values.push(elapsedMs);
      stageValues.set(stage, values);
    }
  }

  const stageSummary = [...stageValues.entries()].map(([stage, values]) => ({
    stage,
    samples: values.length,
    p50: percentile(values, 0.5),
    p95: percentile(values, 0.95),
    mean: values.reduce((acc, item) => acc + item, 0) / values.length,
  }));

  stageSummary.sort((a, b) => (b.p95 ?? -1) - (a.p95 ?? -1));
  const topStage = stageSummary[0] ?? null;

  console.log("===============================================================");
  console.log(" Bridge Timings Baseline Report");
  console.log("===============================================================");
  console.log(`File:   ${filePath}`);
  console.log(`Runs:   ${runs.length} (sample usadas: ${sample.length})`);
  console.log(`Total:  p50=${formatMs(percentile(totalValues, 0.5))} | p95=${formatMs(percentile(totalValues, 0.95))}`);

  if (topStage) {
    console.log(`Hotspot p95: ${topStage.stage} (${formatMs(topStage.p95)})`);
  } else {
    console.log("Hotspot p95: n/a");
  }

  console.log("\nStages (sorted by p95):");
  for (const stage of stageSummary) {
    console.log(
      ` - ${stage.stage}: p50=${formatMs(stage.p50)} | p95=${formatMs(stage.p95)} | mean=${formatMs(stage.mean)} | n=${stage.samples}`,
    );
  }
}

main().catch((err) => {
  console.error("[Bridge Timings] Failed to generate report", err);
  process.exit(1);
});

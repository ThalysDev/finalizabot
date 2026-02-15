import { spawn } from "node:child_process";

const MAX_ATTEMPTS = Math.max(
  1,
  parseInt(process.env.BRIDGE_MEASURE_MAX_ATTEMPTS ?? "8", 10) || 8,
);
const INITIAL_DELAY_MS = Math.max(
  1000,
  parseInt(process.env.BRIDGE_MEASURE_DELAY_MS ?? "5000", 10) || 5000,
);
const BACKOFF_MULTIPLIER = Math.max(
  1,
  parseFloat(process.env.BRIDGE_MEASURE_BACKOFF ?? "1.5") || 1.5,
);
const MAX_DELAY_MS = Math.max(
  INITIAL_DELAY_MS,
  parseInt(process.env.BRIDGE_MEASURE_MAX_DELAY_MS ?? "30000", 10) || 30000,
);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runCommand(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      shell: process.platform === "win32",
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let output = "";

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      output += text;
      process.stdout.write(text);
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      output += text;
      process.stderr.write(text);
    });

    child.on("close", (code) => {
      resolve({ code: code ?? 1, output });
    });
  });
}

function hasAdvisoryLockContention(output) {
  return (
    output.includes("Outra instância já está rodando") ||
    output.toLowerCase().includes("already running")
  );
}

function hasBridgeCompleted(output) {
  return output.includes("[Bridge] Sincronização concluída!");
}

async function runBridgeWithRetries() {
  let delayMs = INITIAL_DELAY_MS;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    console.log(
      `\n[BridgeMeasure] Tentativa ${attempt}/${MAX_ATTEMPTS}: executando sync:bridge...`,
    );

    const result = await runCommand("npm", ["run", "sync:bridge"]);

    if (result.code !== 0) {
      throw new Error(
        `[BridgeMeasure] sync:bridge falhou com exit code ${result.code}.`,
      );
    }

    if (hasBridgeCompleted(result.output)) {
      console.log("[BridgeMeasure] Bridge executado com sucesso.");
      return;
    }

    if (!hasAdvisoryLockContention(result.output)) {
      throw new Error(
        "[BridgeMeasure] sync:bridge finalizou sem lock contention, mas sem confirmação de conclusão do bridge.",
      );
    }

    if (attempt < MAX_ATTEMPTS) {
      console.log(
        `[BridgeMeasure] Advisory lock ocupado. Aguardando ${delayMs}ms para retry...`,
      );
      await sleep(delayMs);
      delayMs = Math.min(
        MAX_DELAY_MS,
        Math.round(delayMs * BACKOFF_MULTIPLIER),
      );
      continue;
    }

    throw new Error(
      `[BridgeMeasure] Advisory lock permaneceu ocupado após ${MAX_ATTEMPTS} tentativas.`,
    );
  }
}

async function main() {
  console.log(
    "[BridgeMeasure] Iniciando fluxo sync:bridge + report:bridge-timings",
  );
  console.log(
    `[BridgeMeasure] Config: attempts=${MAX_ATTEMPTS}, delay=${INITIAL_DELAY_MS}ms, backoff=${BACKOFF_MULTIPLIER}, maxDelay=${MAX_DELAY_MS}ms`,
  );

  await runBridgeWithRetries();

  console.log("\n[BridgeMeasure] Gerando relatório de timings...");
  const report = await runCommand("npm", ["run", "report:bridge-timings"]);

  if (report.code !== 0) {
    throw new Error(
      `[BridgeMeasure] report:bridge-timings falhou com exit code ${report.code}.`,
    );
  }

  console.log("\n[BridgeMeasure] Fluxo concluído com sucesso.");
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(message);
  process.exit(1);
});

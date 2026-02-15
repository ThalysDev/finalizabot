import { readdir, readFile } from "node:fs/promises";
import { resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const scriptFile = fileURLToPath(import.meta.url);
const workspaceRoot = resolve(scriptFile, "..", "..");
const webSrcRoot = resolve(workspaceRoot, "apps/web/src");
const allowedDirectFile = resolve(webSrcRoot, "lib/copy/index.ts");

const codeExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

const directSubmodulePattern =
  /(?:from\s+["']|import\s*\(\s*["'])@\/lib\/copy\/([^"']+)["']/g;
const indexPathPattern =
  /(?:from\s+["']|import\s*\(\s*["'])@\/lib\/copy\/index["']/g;

async function collectFiles(dirPath, out = []) {
  const entries = await readdir(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = resolve(dirPath, entry.name);
    if (entry.isDirectory()) {
      await collectFiles(fullPath, out);
      continue;
    }

    const extension = entry.name.slice(entry.name.lastIndexOf("."));
    if (codeExtensions.has(extension)) {
      out.push(fullPath);
    }
  }
  return out;
}

async function main() {
  const files = await collectFiles(webSrcRoot);
  const violations = [];

  for (const filePath of files) {
    const source = await readFile(filePath, "utf8");
    const isAllowedFile = filePath === allowedDirectFile;

    if (!isAllowedFile) {
      for (const match of source.matchAll(directSubmodulePattern)) {
        const submodule = match[1] ?? "(unknown)";
        violations.push(
          `${relative(workspaceRoot, filePath)} -> @/lib/copy/${submodule}`,
        );
      }
    }

    for (const _match of source.matchAll(indexPathPattern)) {
      violations.push(
        `${relative(workspaceRoot, filePath)} -> @/lib/copy/index`,
      );
    }
  }

  if (violations.length > 0) {
    console.error(
      "[copy-imports] Violations found. Use '@/lib/copy' entrypoint only:",
    );
    for (const violation of violations) {
      console.error(` - ${violation}`);
    }
    process.exit(1);
  }

  console.log("[copy-imports] OK: all imports use '@/lib/copy' entrypoint.");
}

main().catch((error) => {
  console.error("[copy-imports] Failed to validate imports", error);
  process.exit(1);
});

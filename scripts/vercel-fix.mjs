import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const serverDir = join(process.cwd(), "apps", "web", ".next", "server");
const middlewareFile = join(serverDir, "middleware.js");
const middlewareNftFile = join(serverDir, "middleware.js.nft.json");

function ensureDir(path) {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

function ensureFile(path, content) {
  if (!existsSync(path)) {
    ensureDir(dirname(path));
    writeFileSync(path, content, "utf8");
    return true;
  }
  return false;
}

const createdMiddleware = ensureFile(
  middlewareFile,
  "export default function middleware() { return; }\n",
);
const createdNft = ensureFile(
  middlewareNftFile,
  JSON.stringify({ version: 1, files: ["middleware.js"] }, null, 2),
);

if (createdMiddleware || createdNft) {
  console.log(
    "[vercel-fix] ensured middleware artifacts for Vercel build compatibility",
  );
} else {
  console.log("[vercel-fix] middleware artifacts already present");
}

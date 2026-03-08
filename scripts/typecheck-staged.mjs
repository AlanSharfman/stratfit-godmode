import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();

const staged = spawnSync(
  "git",
  ["diff", "--cached", "--name-only", "--diff-filter=ACMR"],
  { cwd: repoRoot, encoding: "utf8" },
);

if (staged.status !== 0) {
  process.stderr.write(staged.stderr || "Failed to read staged files.\n");
  process.exit(staged.status ?? 1);
}

const files = staged.stdout
  .split(/\r?\n/)
  .map((f) => f.trim())
  .filter(Boolean)
  .filter((f) => /\.(ts|tsx)$/.test(f))
  .filter((f) => fs.existsSync(path.join(repoRoot, f)));

if (files.length === 0) {
  process.stdout.write("No staged TypeScript files to typecheck.\n");
  process.exit(0);
}

const tempConfigPath = path.join(repoRoot, ".tsconfig.staged.json");
const tempConfig = {
  extends: "./tsconfig.json",
  files,
};

fs.writeFileSync(tempConfigPath, `${JSON.stringify(tempConfig, null, 2)}\n`, "utf8");

try {
  const result = spawnSync(
    "npx",
    ["tsc", "-p", tempConfigPath, "--noEmit", "--pretty", "false"],
    { cwd: repoRoot, stdio: "inherit", shell: process.platform === "win32" },
  );
  process.exit(result.status ?? 1);
} finally {
  try {
    fs.unlinkSync(tempConfigPath);
  } catch {
    // ignore cleanup failures
  }
}

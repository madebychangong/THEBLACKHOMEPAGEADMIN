import { spawn } from "node:child_process";
import { resolve } from "node:path";

const mode = process.argv[2] === "admin" ? "admin" : "public";
process.env.VITE_APP_MODE = mode;

await import("./encode-prices.mjs");

const viteBin = resolve("node_modules", "vite", "bin", "vite.js");
const child = spawn(process.execPath, [viteBin, "build"], {
  stdio: "inherit",
  shell: false,
  env: process.env
});

const code = await new Promise((resolveCode) => {
  child.on("exit", resolveCode);
});

process.exit(code ?? 1);

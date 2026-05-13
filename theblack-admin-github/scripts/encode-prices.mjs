import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = resolve(root, "src", "prices-data.json");
const outputPath = resolve(root, "src", "encoded-prices.js");

const source = await readFile(sourcePath, "utf8");
JSON.parse(source);

const encoded = Buffer.from(source, "utf8").toString("base64");
const chunks = encoded.match(/.{1,88}/g) || [];

await writeFile(
  outputPath,
  `const chunks = ${JSON.stringify(chunks, null, 2)};\n\n` +
    `export function readPriceData() {\n` +
    `  const binary = atob(chunks.join(""));\n` +
    `  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));\n` +
    `  return JSON.parse(new TextDecoder().decode(bytes));\n` +
    `}\n`,
  "utf8"
);

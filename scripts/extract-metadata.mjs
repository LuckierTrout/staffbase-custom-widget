import process from "node:process";
import { readFileSync } from "node:fs";
import { extractContentDetails } from "./content-details.mjs";

try {
  const args = process.argv.slice(2);
  if (args.length > 1) throw new Error("Usage: node scripts/extract-metadata.mjs [response.json|-]");
  const file = args[0];
  const input = readFileSync(!file || file === "-" ? 0 : file, "utf8");
  process.stdout.write(`${JSON.stringify(extractContentDetails(JSON.parse(input)), null, 2)}\n`);
} catch (error) {
  process.stderr.write(`Extraction failed: ${error.message}\n`);
  process.exitCode = 1;
}

import process from "node:process";
import assert from "node:assert/strict";
import { test } from "node:test";
import { execFileSync, spawnSync } from "node:child_process";
import { extractTaxonomyId, extractContentDetails } from "./content-details.mjs";

const html = (value) => `<staffbase-custom-widget taxonomy-id="${value}"></staffbase-custom-widget>`;

test("extracts exact string values, HTML entities, and Unicode without executing content", () => {
  assert.equal(extractTaxonomyId(html("000123")), "000123");
  assert.equal(extractTaxonomyId(html("false")), "false");
  assert.equal(extractTaxonomyId(html("R&amp;D &quot;東京&quot;")), 'R&D "東京"');
  assert.equal(extractTaxonomyId(`<script>throw new Error('must not execute')</script>${html("ID-1")}`), "ID-1");
});

test("ignores comments, escaped examples and inert templates", () => {
  assert.equal(extractTaxonomyId(`<!-- ${html("comment")} --><template>${html("template")}</template>&lt;staffbase-custom-widget taxonomy-id='text'&gt;`), null);
});

test("rejects duplicate, empty, missing and oversized values", () => {
  assert.throws(() => extractTaxonomyId(html("A") + html("B")), /Multiple/);
  assert.throws(() => extractTaxonomyId(html("   ")), /invalid/);
  assert.throws(() => extractTaxonomyId("<staffbase-custom-widget></staffbase-custom-widget>"), /invalid/);
  assert.throws(() => extractTaxonomyId(html("a".repeat(257))), /invalid/);
});

test("keeps translations separate and explicitly reports missing widgets", () => {
  assert.deepEqual(extractContentDetails({ contents: {
    en_US: { content: html("ID-1") }, de_DE: { content: "<p>No metadata</p>" },
  } }), [{ language: "en_US", taxonomyId: "ID-1" }, { language: "de_DE", taxonomyId: null }]);
  assert.throws(() => extractContentDetails({ data: [] }), /contents object/);
  assert.throws(() => extractContentDetails({ contents: { en_US: { title: "Only a summary" } } }), /full content/);
});

test("CLI handles files, stdin and invalid input", () => {
  const fileResult = JSON.parse(execFileSync(process.execPath, ["scripts/extract-metadata.mjs", "examples/content-response.json"], { encoding: "utf8" }));
  assert.equal(fileResult[0].taxonomyId, "CVX-2026-001");
  const stdinResult = JSON.parse(execFileSync(process.execPath, ["scripts/extract-metadata.mjs"], {
    input: JSON.stringify({ contents: { en_US: { content: html("000123") } } }), encoding: "utf8",
  }));
  assert.equal(stdinResult[0].taxonomyId, "000123");
  const bad = spawnSync(process.execPath, ["scripts/extract-metadata.mjs"], { input: "{", encoding: "utf8" });
  assert.equal(bad.status, 1);
  assert.equal(bad.stdout, "");
  assert.match(bad.stderr, /Extraction failed/);
});

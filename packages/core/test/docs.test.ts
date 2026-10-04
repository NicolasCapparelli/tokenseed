import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, it } from "vitest";
import { catalogMarkdown } from "../src";

const file = resolve(__dirname, "../../../docs/knobs.md");

it("docs/knobs.md matches the catalog", () => {
  const md = catalogMarkdown();
  if (process.env.UPDATE_DOCS || !existsSync(file)) writeFileSync(file, md);
  expect(readFileSync(file, "utf8").replace(/\r\n/g, "\n"), "Run UPDATE_DOCS=1 pnpm -r test to regenerate docs/knobs.md").toBe(md);
});

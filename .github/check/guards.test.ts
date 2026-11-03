// Text guards: each one fails when a claim that a release corrected comes back into the skill. The id names the
// release that made the correction. The check runs on SKILL.md, AGENTS.md, README.md, rules/ and references/,
// not on CHANGELOG.md, which quotes the old claims on purpose.
//
// Usage: bun test guards.test.ts
//        SKILL_ROOT=<path to another checkout> bun test guards.test.ts
import { expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(process.env.SKILL_ROOT ?? join(import.meta.dir, "../.."));

type Doc = { file: string; lines: { n: number; text: string; code: boolean }[] };
const docs: Doc[] = (() => {
  const files = ["SKILL.md", "AGENTS.md", "README.md"].filter((f) => existsSync(join(ROOT, f)));
  for (const dir of ["rules", "references"]) {
    if (!existsSync(join(ROOT, dir))) continue;
    for (const f of readdirSync(join(ROOT, dir)).sort()) if (f.endsWith(".md")) files.push(`${dir}/${f}`);
  }
  return files.map((file) => {
    let fence = false;
    const lines = readFileSync(join(ROOT, file), "utf8").split("\n").map((text, i) => {
      if (/^\s*```/.test(text)) {
        fence = !fence;
        return { n: i + 1, text, code: true };
      }
      return { n: i + 1, text, code: fence };
    });
    return { file, lines };
  });
})();

// Every line that matches, as "file:line: text". `where` limits the scan to code lines or to prose lines.
function hits(pattern: RegExp, where: "all" | "code" | "prose"): string[] {
  const found: string[] = [];
  for (const d of docs)
    for (const l of d.lines) {
      if (where === "code" && !l.code) continue;
      if (where === "prose" && l.code) continue;
      if (pattern.test(l.text)) found.push(`${d.file}:${l.n}: ${l.text.trim().slice(0, 120)}`);
    }
  return found;
}

const guard = (id: string, what: string, pattern: RegExp, where: "all" | "code" | "prose" = "all") =>
  test(`${id}: ${what}`, () => expect(hits(pattern, where)).toEqual([]));

test("the guards scan the skill", () => {
  expect(docs.length).toBeGreaterThan(20);
});

// 1.2.1. API corrections (removed namespace calls, wrong entrypoints, missing narrowing) are type errors, so
// blocks.ts catches them; these guards cover the prose claims.
guard("1.2.1", "reading the body in request:start without clone() does not give the handler an empty body", /handler gets (an )?empty body/i);
guard("1.2.1", "the network-error message depends on the runtime; assert on the TypeError", /TypeError: Failed to fetch/);
guard("1.2.1", "a native Response.error() also gives a network error", /\| Network error \| Not possible \|/);
guard("1.2.1", "the v2 requirements are Node.js 18 and TypeScript 4.7, not 14 and 4.4", /\| (Node\.js \| v14|TypeScript \| v4\.4)\+ \|/);
guard("1.2.1", "a native Response drops Set-Cookie only in the browser", /(?<!browsers?, )native Response (silently )?drops Set-Cookie/i);
guard("1.2.1", "the import map gives the v3 subpaths, not the root module", /\| `http`, `graphql`[^|]*\| `'msw'` \|/);
guard("1.2.1", "the delay('real') note states msw 3 behaviour, not msw 2.15.0 internals", /in msw 2\.15\.0 both routes/);
guard("1.2.1", "onUnhandledFrame: 'error' does not throw into the test", /fails the test immediately/i);

// Dates say when something was checked; the skill names the library version instead. Dates in code are data.
guard(
  "DATE",
  "no check dates or calendar dates in the skill prose",
  /\b20\d\d-\d\d-\d\d\b|\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.? (\d{1,2}(st|nd|rd|th)?\b|20\d\d\b)|\b\d{1,2}(st|nd|rd|th)? (January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/,
  "prose",
);

// Checks that the skill's index files agree with each other and with the pinned msw.
//
// Usage: bun index.ts
//
// - Every rules/*.md file is listed once in the SKILL.md "All N Rules" tables, and every listed file exists.
// - N is the number of rule files, and every rule file starts with the prefix of the category it is listed under.
// - The SKILL.md category table, the AGENTS.md "### Rule:" headings per section and the README.md category table
//   give the same count per category as the rule tables.
// - README.md states the rule count and the category count.
// - Every references/*.md file is listed in the SKILL.md References table.
// - The number of mistakes that SKILL.md gives for references/anti-patterns.md is its number of numbered sections.
// - The SKILL.md version is the newest CHANGELOG.md release.
// - The version that SKILL.md says it was audited against is the msw version that package.json pins.
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const CHECK = import.meta.dir;
const ROOT = resolve(CHECK, "../..");
const read = (f: string) => readFileSync(join(ROOT, f), "utf8");
const problems: string[] = [];
const expectEqual = (what: string, actual: unknown, expected: unknown) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    problems.push(`${what}: found ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
};

const skill = read("SKILL.md");
const agents = read("AGENTS.md");
const readme = read("README.md");
const ruleFiles = readdirSync(join(ROOT, "rules")).filter((f) => f.endsWith(".md")).sort();

// SKILL.md category table: "| 1 | Handler Design | CRITICAL | `handler-` | 4 |".
const categories = [...skill.matchAll(/^\| (\d+) \| (.+?) \| ([A-Z]+) \| `([a-z]+-)` \| (\d+) \|$/gm)].map((m) => ({
  title: m[2],
  impact: m[3],
  prefix: m[4],
  count: Number(m[5]),
}));

// "## All 20 Rules", then "### Handler Design (CRITICAL)" sections with "| ... | `file.md` | ... |" rows.
const allHead = /^## All (\d+) Rules$/m.exec(skill);
const all = allHead ? skill.slice(allHead.index, skill.indexOf("\n## ", allHead.index + 1)) : "";
const sections: { title: string; files: string[] }[] = [];
for (const line of all.split("\n")) {
  const head = /^### (.+?) \(([A-Z]+)\)$/.exec(line);
  if (head) sections.push({ title: head[1], files: [] });
  const row = /^\| [^|]+ \| `([a-z0-9-]+\.md)` \|/.exec(line);
  if (row) sections.at(-1)?.files.push(row[1]);
}
const listed = sections.flatMap((s) => s.files);
expectEqual("'All N Rules' heading against the rule files", Number(allHead?.[1]), ruleFiles.length);
expectEqual("listed rule files that do not exist", listed.filter((f) => !ruleFiles.includes(f)), []);
expectEqual("rule files missing from the rule tables", ruleFiles.filter((f) => !listed.includes(f)), []);
expectEqual("rule files listed more than once", listed.filter((f, i) => listed.indexOf(f) !== i), []);
const perSection = sections.map((s) => `${s.title}: ${s.files.length}`);
expectEqual("SKILL.md category table against the rule tables", categories.map((c) => `${c.title}: ${c.count}`), perSection);
for (const s of sections) {
  const prefix = categories.find((c) => c.title === s.title)?.prefix;
  const wrong = s.files.filter((f) => !prefix || !f.startsWith(prefix));
  if (wrong.length) problems.push(`${s.title}: files without the prefix ${prefix}: ${wrong.join(", ")}`);
}

// AGENTS.md: "## 1. Handler Design" sections with "### Rule:" headings.
const agentSections: { title: string; rules: number }[] = [];
for (const line of agents.split("\n")) {
  const head = /^## \d+\. (.+)$/.exec(line);
  if (head) agentSections.push({ title: head[1].trim(), rules: 0 });
  if (/^### Rule: /.test(line) && agentSections.length) agentSections.at(-1)!.rules++;
}
expectEqual("AGENTS.md rules per section", agentSections.map((s) => `${s.title}: ${s.rules}`), perSection);

// README.md.
const total = ruleFiles.length;
if (!readme.includes(`${total} rules with incorrect/correct`)) problems.push(`README.md does not say "${total} rules with incorrect/correct"`);
if (!readme.includes(`### ${total} Rules Across ${sections.length} Categories`))
  problems.push(`README.md does not say "### ${total} Rules Across ${sections.length} Categories"`);
const readmeCounts = [...readme.matchAll(/^\| \d+ \| (.+?) \| (\d+) \| [A-Z]+ \|$/gm)].map((m) => `${m[1]}: ${m[2]}`);
expectEqual("README.md category table", readmeCounts, perSection);

// References.
const refFiles = readdirSync(join(ROOT, "references")).filter((f) => f.endsWith(".md")).sort();
const refTable = skill.slice(skill.indexOf("## References"));
expectEqual("references/*.md files missing from the SKILL.md References table", refFiles.filter((f) => !refTable.includes(`\`${f}\``)), []);
const mistakes = Number(/(\d+) common mistakes/.exec(skill)?.[1]);
const numbered = (read("references/anti-patterns.md").match(/^## \d+\. /gm) ?? []).length;
expectEqual("SKILL.md anti-pattern count against the numbered sections of references/anti-patterns.md", mistakes, numbered);

// Version and baseline.
const version = /^\s+version:\s*(\S+)$/m.exec(skill)?.[1];
const released = /^## (\d+\.\d+\.\d+)$/m.exec(read("CHANGELOG.md"))?.[1];
expectEqual("SKILL.md version against the newest CHANGELOG.md release", version, released);
const audited = /audited against msw (\d+\.\d+\.\d+)/.exec(skill)?.[1];
const pinned = JSON.parse(readFileSync(join(CHECK, "package.json"), "utf8")).devDependencies.msw;
expectEqual("SKILL.md 'audited against' version against the pinned msw", audited, pinned);

for (const p of problems) console.log(p);
console.log(`${ruleFiles.length} rules, ${refFiles.length} references, ${problems.length} problems`);
process.exit(problems.length ? 1 : 0);

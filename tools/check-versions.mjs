// Fails when a page names an older version than the one that is current.
// Run from the repo root: node tools/check-versions.mjs [--root <dir>]
//
// "Current" is read, never typed in here:
//   - the standards (Agent Messaging, Common Agent, Agent SoW, Agent RFP, Agent
//     Mandate, Agent NDA, Agent Reputations) from standards.json at the head of
//     main in CommonAgent/common-agent-standards (public);
//   - the reference adapter, the TypeScript SDK and the Rust SDK from main of
//     jeffrschneider/AgentMesh (private): mesh-adapter/package.json, SDK_VERSION
//     in app/src/views/agents-add.ts, sdk-rust/Cargo.toml. They are read with the
//     GitHub CLI (gh auth login) or with GH_TOKEN / GITHUB_TOKEN.
// If a source cannot be read the check fails: a version check that quietly
// skips is worse than none. deploy.sh runs this before the contrast gate.
//
//   --root <dir>        the pages to check (default: this repository's root)
//   --main <dir>        read the AgentMesh files from a checkout or extract of main
//   --standards <dir>   read standards.json from a clone of the standards repository
//
// What is checked, per page (text outside <pre>/<code> blocks counts as well as
// inside them, since a pinned install line is the likeliest stale thing):
//   "<Standard name> 0.N[.M]"       not older than that standard's version
//   mesh-adapter-X.Y.Z.tgz, "adapter X.Y.Z"   not older than the adapter on main
//   agent-messaging-X.Y.Z.tgz       not older than SDK_VERSION on main
//   the implementation table on implementation-status.html (TypeScript SDK,
//   Rust SDK, Reference adapter)    equal to main's
// Pages the platform-services generator writes carry example values (a host
// string such as "mesh-adapter 0.94.0"); those are reported as warnings, since
// the fix is in the generator's examples, not in the page.
import { readFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(n); return i < 0 ? undefined : args[i + 1]; };
const ROOT = resolve(opt("--root") ?? resolve(dirname(fileURLToPath(import.meta.url)), ".."));
const MAIN_DIR = opt("--main");
const STD_DIR = opt("--standards");
const STANDARDS_REPO = "CommonAgent/common-agent-standards";
const MAIN_REPO = "jeffrschneider/AgentMesh";

// ── reading the sources ────────────────────────────────────────────────
async function standardsJson() {
  if (STD_DIR) return JSON.parse(readFileSync(join(resolve(STD_DIR), "standards.json"), "utf8"));
  const res = await fetch(`https://raw.githubusercontent.com/${STANDARDS_REPO}/main/standards.json`, { headers: { "User-Agent": "dev.agentmesh.ai check-versions" } });
  if (!res.ok) throw new Error(`standards.json: HTTP ${res.status}`);
  return JSON.parse(await res.text());
}

async function mainFile(path) {
  if (MAIN_DIR) return readFileSync(join(resolve(MAIN_DIR), path), "utf8");
  const url = `https://api.github.com/repos/${MAIN_REPO}/contents/${path}?ref=main`;
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  if (token) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.raw", "User-Agent": "dev.agentmesh.ai check-versions" } });
    if (!res.ok) throw new Error(`${MAIN_REPO}:${path}: HTTP ${res.status}`);
    return res.text();
  }
  try {
    return execFileSync("gh", ["api", `repos/${MAIN_REPO}/contents/${path}?ref=main`, "-H", "Accept: application/vnd.github.raw"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 16 * 1024 * 1024 });
  } catch (e) {
    throw new Error(`${MAIN_REPO}:${path} could not be read (set GH_TOKEN, or run gh auth login): ${String(e.stderr || e.message).trim().split("\n")[0]}`);
  }
}

const first = (text, re, what) => {
  const m = text.match(re);
  if (!m) throw new Error(`could not find ${what}`);
  return m[1];
};

// ── versions ───────────────────────────────────────────────────────────
/** "0.9.7-draft" -> [0, 9, 7]; "0.10" -> [0, 10]; "v1" -> [1]. */
const parts = (v) => String(v).replace(/^v/i, "").replace(/-.*$/, "").split(".").map((n) => parseInt(n, 10));
/** Whether `named` is older than `current`, comparing as many parts as `named` states. */
function olderThan(named, current) {
  const a = parts(named), b = parts(current);
  for (let i = 0; i < a.length; i++) {
    const x = a[i], y = b[i] ?? 0;
    if (x !== y) return x < y;
  }
  return false;
}

// The pages' own words for a standard, and its id in standards.json.
const NAMES = [
  ["Agent Messaging", "messaging"],
  ["Common Agent Specification", "common-agent"],
  ["Common Agent", "common-agent"],
  ["Agent SoW", "sow"],
  ["Agent RFP", "rfp"],
  ["Agent Mandate", "mandate"],
  ["Agent NDA", "nda"],
  ["Agent Reputations", "reputations"],
];

const standards = await standardsJson();
const byId = Object.fromEntries(standards.standards.map((s) => [s.id, s.version]));
const adapter = first(await mainFile("mesh-adapter/package.json"), /"version":\s*"(\d+\.\d+\.\d+)"/, "the adapter version in mesh-adapter/package.json");
const sdk = first(await mainFile("app/src/views/agents-add.ts"), /SDK_VERSION\s*=\s*"(\d+\.\d+\.\d+)"/, "SDK_VERSION in app/src/views/agents-add.ts");
const rust = first(await mainFile("sdk-rust/Cargo.toml"), /^version\s*=\s*"(\d+\.\d+\.\d+)"/m, "the version in sdk-rust/Cargo.toml");

// ── the pages ──────────────────────────────────────────────────────────
const failures = [];
const warnings = [];
const pages = readdirSync(ROOT).filter((f) => f.endsWith(".html")).sort();
for (const file of pages) {
  const html = readFileSync(join(ROOT, file), "utf8").replace(/\r\n/g, "\n");
  const generated = html.includes("GENERATED by node platform-services/gen.mjs");
  // Text with its tags removed keeps line numbers (tags are replaced, newlines are not).
  const text = html.replace(/<[^>]*>/g, (t) => t.replace(/[^\n]/g, " "));
  const report = (index, found, current, what) => {
    const line = html.slice(0, index).split("\n").length;
    (generated ? warnings : failures).push(`${file}:${line}: names ${what} ${found}, current is ${current}`);
  };
  const scan = (re, fn) => { for (const m of text.matchAll(re)) fn(m); };

  for (const [name, id] of NAMES) {
    if (!byId[id]) continue;
    const re = new RegExp(`\\b${name.replace(/ /g, "\\s+")}\\s+(?:version\\s+|v)?(\\d+\\.\\d+(?:\\.\\d+)?)(?:-draft)?\\b`, "g");
    scan(re, (m) => {
      // "Agent Messaging 0.8" inside a longer name, such as "Common Agent Specification 0.29", is matched by the longer name.
      if (name === "Common Agent" && /^\s+Specification/.test(text.slice(m.index + name.length, m.index + name.length + 20))) return;
      if (olderThan(m[1], byId[id])) report(m.index, m[1], byId[id], name);
    });
  }
  scan(/mesh-adapter-(\d+\.\d+\.\d+)\.tgz/g, (m) => { if (olderThan(m[1], adapter)) report(m.index, m[1], adapter, "mesh-adapter"); });
  scan(/\b(?:mesh-adapter|adapter)\s+(\d+\.\d+\.\d+)\b/g, (m) => { if (olderThan(m[1], adapter)) report(m.index, m[1], adapter, "the adapter"); });
  scan(/agent-messaging-(\d+\.\d+\.\d+)\.tgz/g, (m) => { if (olderThan(m[1], sdk)) report(m.index, m[1], sdk, "the TypeScript SDK"); });
  if (file === "implementation-status.html") {
    for (const [label, cur] of [["TypeScript SDK[^<]*", sdk], ["Rust SDK", rust], ["Reference adapter", adapter]]) {
      const m = html.match(new RegExp(`<td>${label}</td>\\s*<td>(\\d+\\.\\d+\\.\\d+)</td>`));
      if (!m) failures.push(`${file}: no "${label.replace("[^<]*", "")}" row in the implementation table`);
      else if (m[1] !== cur) report(m.index, m[1], cur, label.replace("[^<]*", ""));
    }
  }
}

for (const w of warnings) console.warn(`warning (generated page, fix in the generator's examples): ${w}`);
if (failures.length) {
  console.error(`check-versions: ${failures.length} place(s) name an older version than the current one:`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log(
  `check-versions: ${pages.length} pages; ` +
  `messaging ${byId.messaging}, common-agent ${byId["common-agent"]}, sow ${byId.sow}, rfp ${byId.rfp}, mandate ${byId.mandate}, adapter ${adapter}, TypeScript SDK ${sdk}, Rust SDK ${rust}; ` +
  `none older${warnings.length ? ` (${warnings.length} warning${warnings.length === 1 ? "" : "s"} on generated pages)` : ""}.`,
);

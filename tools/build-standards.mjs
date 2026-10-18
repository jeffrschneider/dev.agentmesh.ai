// build-standards.mjs: write the list on standards.html from standards.json,
// the registry of the Common Agent Standards.
//
// Usage:
//   node tools/build-standards.mjs                 rewrite ./standards.html
//   node tools/build-standards.mjs --root <dir>    rewrite <dir>/standards.html
//   node tools/build-standards.mjs --from <clone>  read a local clone of
//                                                  common-agent-standards
//                                                  instead of GitHub
//
// The source of truth is standards.json in the public repository
// CommonAgent/common-agent-standards. With no --from, the script asks GitHub
// for the commit main points at now and reads every file at that commit, so a
// run always reflects main as it stands (a file at a fixed commit is never a
// stale cached copy). It reads three things there: standards.json for each
// entry's name, version, site, domain, summary and parts; roles/SPEC.md for
// the number of roles (one "## N. Role:" chapter each); and the folder
// guides/collab/patterns for the number of collaboration playbooks.
//
// deploy.sh runs this on the folder it publishes, so every deploy carries the
// versions on main at that moment, with no commit needed for a version bump.
// Run it here too and commit the page, so the repository matches what is live.
//
// Three blocks of standards.html are written, each between
// <!-- BEGIN standards:<name> ... --> and <!-- END standards:<name> -->:
// hero (the heading and lede), stack (the layer diagram) and entries (one
// card per entry). Everything outside them is hand-written and left alone.
// The words beside each entry that standards.json does not hold (the line
// under the name and the paragraph after the summary) are in NOTES below.
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = "CommonAgent/common-agent-standards";
const BRANCH = "main";

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  if (i === -1) return undefined;
  if (!args[i + 1]) throw new Error(`${name} needs a value`);
  return args[i + 1];
};
const ROOT = resolve(opt("--root") ?? resolve(dirname(fileURLToPath(import.meta.url)), ".."));
const FROM = opt("--from");
const PAGE = join(ROOT, "standards.html");

// ── reading the source ──────────────────────────────────────────────────
async function get(url, accept) {
  const res = await fetch(url, {
    headers: { "User-Agent": "dev.agentmesh.ai build-standards", ...(accept ? { Accept: accept } : {}) },
  });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.text();
}

async function readSource() {
  if (FROM) {
    const dir = resolve(FROM);
    return {
      from: dir,
      json: readFileSync(join(dir, "standards.json"), "utf8"),
      rolesSpec: readFileSync(join(dir, "roles", "SPEC.md"), "utf8"),
      patterns: readdirSync(join(dir, "guides", "collab", "patterns")),
    };
  }
  const sha = (await get(`https://api.github.com/repos/${REPO}/commits/${BRANCH}`, "application/vnd.github.sha")).trim();
  if (!/^[0-9a-f]{40}$/.test(sha)) throw new Error(`GitHub did not return a commit for ${REPO}@${BRANCH}`);
  const raw = (path) => get(`https://raw.githubusercontent.com/${REPO}/${sha}/${path}`);
  const listing = JSON.parse(
    await get(`https://api.github.com/repos/${REPO}/contents/guides/collab/patterns?ref=${sha}`, "application/vnd.github+json"),
  );
  return {
    from: `${REPO}@${sha.slice(0, 7)} (${BRANCH})`,
    json: await raw("standards.json"),
    rolesSpec: await raw("roles/SPEC.md"),
    patterns: listing.filter((f) => f.type === "file").map((f) => f.name),
  };
}

// ── the words standards.json does not hold ──────────────────────────────
// cls picks the accent colour (the .s-* rules in the page's CSS), line is the
// small line under the name, and more is what follows the summary. An entry
// not listed here still gets a card, with its name, version, site and summary.
const NOTES = {
  "common-agent": {
    cls: "s-desc",
    line: "what calling it an agent obliges",
    more: () => [
      `Two documents describe one agent under it, and both are chapters of the specification. <b>The <a href="https://commonagent.net/descriptor.html">Agent Descriptor</a> is the one an operator writes</b>, with one authored spelling per fact, referenced at a digest by anything that binds. <b>The <a href="https://agentdoc.net/">AgentDoc</a> is the one assembled from it</b> and from the records others sign, with every source shown and anything never stated marked as such. The AgentDoc keeps its own site at agentdoc.net, with its tools and examples.`,
      `A third chapter says how an agent travels before it exists. <b>The <a href="https://commonagent.net/package.html">Agent Package</a></b> carries the Descriptor as a draft inside a portable plugin, together with what a host must have to run it, and defines how a package is published to a depot and installed into a running agent with an identity, so a verifier can check that what is running is what was built.`,
    ],
  },
  messaging: {
    cls: "s-proto",
    line: "the wire underneath",
    more: () => [
      `An extension tier covers what not every deployment needs, including rooms, admission, sealed conversations, allowances, deliverables and screening. Each extension has a version of its own, so the core stays small. <b>It is the one entry here that defines a network, where every other entry defines a document.</b>`,
    ],
  },
  naming: {
    cls: "s-name",
    line: "identity and addressing",
    more: () => [
      `Everything above it depends on a name, because a document signed by nobody in particular is not evidence of anything. <b>Leaving a network does not cost an agent its name.</b>`,
    ],
  },
  mandate: {
    cls: "s-man",
    line: "delegated authority",
    more: () => [
      `It has a layer to itself because it is the hinge. <b>A signed document from an agent that may not bind anyone is not worth reading</b>, so the other side checks the mandate before acting on anything above it.`,
    ],
  },
  rfp: {
    cls: "s-rfp",
    line: "asking for what you need",
    more: () => [
      `It exists for the case a catalog cannot serve. <b>When nothing on offer fits, the buyer publishes the need itself</b>, and anyone who can do the work may answer it.`,
    ],
  },
  sow: {
    cls: "s-sow",
    line: "the agreement",
    more: () => [
      `<b>Its disputes clause is what an arbiter binds into</b>, and its record of what did and did not arrive is the spine of any evidence bundle.`,
    ],
  },
  reputations: {
    cls: "s-rep",
    line: "evidence, afterwards",
    more: () => [`It closes the loop, and <b>it is read hardest for the roles that judge or recommend</b>.`],
  },
  roles: {
    cls: "s-rol",
    line: "recurring jobs",
    more: (c) => [
      `The registry defines ${words(c.roles)} roles in three families: roles on the mesh, such as bookkeeper, front desk and arbiter; roles that make and look after agents, from spec writer to incident recorder; and the process runner, which carries work across agents.`,
      `<b>Conformance is judged by what an agent refuses</b> as much as by what it produces, because taste cannot be recomputed.`,
    ],
  },
  processes: {
    cls: "s-proc",
    line: "how a piece of work runs",
    more: (c) => [
      `A person reads a process document, and a process runner carries it out. A phase can go to one agent that runs its own loop until the output the phase names exists. That is written as a <code>harness:</code> phase, and the process names the output and leaves the working out to the agent. A phase can also convene a room to run an ${c.name("collab")} playbook, or be done directly by a person or a system. <b>Whatever belongs to one organization is left blank</b>, so a process one organization publishes is one another organization can adopt and fill in.`,
    ],
  },
  collab: {
    cls: "s-col",
    line: "playbooks for a shared room",
    more: (c) => [
      `Someone opens a room and names the playbook. <b>Shared reading is the interop</b>, which sets it apart from every other entry here. The library holds ${words(c.patterns)} playbooks, including briefing, roll call, relay, work board and critique circle.`,
    ],
  },
};

// Where each entry sits. The stack diagram reads from the bottom; SUPPORT is
// the second part of the list. An entry in neither is listed with the
// standards and left out of the diagram.
const LAYERS = [
  { label: "the agreement", ids: ["rfp", "sow", "reputations"] },
  { label: "authority", ids: ["mandate"] },
  { label: "foundation", ids: ["naming", "common-agent", "messaging"] },
];
const SUPPORT = ["roles", "processes", "collab"];

// ── helpers ─────────────────────────────────────────────────────────────
const NUM = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];
const TENS = { 20: "twenty", 30: "thirty", 40: "forty", 50: "fifty" };
function words(n) {
  if (n <= 20) return NUM[n];
  if (n < 60) return TENS[n - (n % 10)] + (n % 10 ? "-" + NUM[n % 10] : "");
  return String(n);
}
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const lowerThe = (s) => s.replace(/^The /, "the ");

function replaceBlock(html, name, body) {
  const re = new RegExp(`(<!-- BEGIN standards:${name}\\b[^>]*-->)[\\s\\S]*?(\\n[ \\t]*<!-- END standards:${name} -->)`);
  if (!re.test(html)) throw new Error(`standards.html has no standards:${name} block`);
  return html.replace(re, (_, a, b) => `${a}\n${body}${b}`);
}

// ── build ───────────────────────────────────────────────────────────────
const src = await readSource();
const data = JSON.parse(src.json);
const list = data.standards;
if (!Array.isArray(list) || list.length === 0) throw new Error("standards.json lists no standards");
for (const s of list) {
  for (const f of ["id", "name", "kind", "domain", "site", "version", "summary"]) {
    // A missing field fails the build: printing a card with a blank where the
    // version should be is the one outcome this script must not have.
    if (!s[f]) throw new Error(`standards.json: ${s.id ?? "an entry"} has no ${f}`);
  }
}
const byId = Object.fromEntries(list.map((s) => [s.id, s]));
const counts = {
  roles: (src.rolesSpec.match(/^## \d+\. Role:/gm) ?? []).length,
  patterns: src.patterns.filter((f) => f.endsWith(".md")).length,
  name: (id) => esc(byId[id]?.name ?? id),
};
if (counts.roles === 0) throw new Error("roles/SPEC.md has no \"## N. Role:\" chapters: has its shape changed?");
if (counts.patterns === 0) throw new Error("guides/collab/patterns has no playbooks");
for (const id of [...SUPPORT, ...LAYERS.flatMap((l) => l.ids)]) {
  if (!byId[id]) console.error(`build-standards: ${id} is no longer in standards.json; it is left out`);
}
const unplaced = list.filter((s) => !SUPPORT.includes(s.id) && !LAYERS.some((l) => l.ids.includes(s.id)));
for (const s of unplaced) console.error(`build-standards: ${s.id} has no place in the diagram; it is listed with the standards`);

const suite = data.suite || "The Common Agent Standards";
const sponsor = data.sponsor?.name || "AgentMesh";
const kinds = { base: 0, standard: 0, guide: 0 };
for (const s of list) kinds[s.kind] = (kinds[s.kind] ?? 0) + 1;
const plural = (n, one, many) => `${words(n)} ${n === 1 ? one : many}`;

const hero = [
  `    <h1>${esc(suite)}</h1>`,
  `    <p class="lede">${esc(suite)} are ${lowerThe(esc(byId["common-agent"]?.name ?? "The Common Agent Specification"))}, ${plural(kinds.standard, "standard", "standards")} built on it and ${plural(kinds.guide, "guide", "guides")}, and ${esc(sponsor)} sponsors them.`,
  `      Every entry links to its own site, where the full text lives, and the outside`,
  `      standards they work alongside are at the end of this page.</p>`,
].join("\n");

const chip = (s) => `            <a class="chip ${NOTES[s.id]?.cls ?? ""}" href="${esc(s.site)}">${esc(s.name)}</a>`;
const stack = [
  `        <div class="stack">`,
  `          <div class="cap">${esc(suite)}</div>`,
  ...LAYERS.filter((l) => l.ids.some((id) => byId[id])).flatMap((l) => [
    `        <div class="layer">`,
    `          <div class="lab">${esc(l.label)}</div>`,
    `          <div class="items">`,
    ...l.ids.filter((id) => byId[id]).map((id) => chip(byId[id])),
    `          </div>`,
    `        </div>`,
  ]),
  `        </div>`,
].join("\n");

function card(s) {
  const n = NOTES[s.id] ?? {};
  const parts = Array.isArray(s.parts) && s.parts.length
    ? [`        <ul class="parts" aria-label="Parts of ${esc(s.name)}">`,
       ...s.parts.map((p) => `          <li>${esc(p.name)} <span class="pv">${esc(p.version)}</span></li>`),
       `        </ul>`]
    : [];
  return [
    `      <div class="std ${n.cls ?? ""}" id="${esc(s.id)}">`,
    `        <div class="top">`,
    `          <h3>${esc(s.name)}</h3>`,
    `          <span class="ver" title="version">${esc(s.version)}</span>`,
    `          <a class="dom" href="${esc(s.site)}">${esc(s.domain)} &rarr;</a>`,
    `        </div>`,
    ...(n.line ? [`        <p class="role">${esc(n.line)}</p>`] : []),
    `        <p>${esc(s.summary)}</p>`,
    ...(n.more ? n.more(counts).map((p) => `        <p>${p}</p>`) : []),
    ...parts,
    `      </div>`,
  ].join("\n");
}

const main = list.filter((s) => !SUPPORT.includes(s.id));
const support = SUPPORT.filter((id) => byId[id]).map((id) => byId[id]);
const mainStandards = main.filter((s) => s.kind !== "base").length;
const entries = [
  `  <section class="band">`,
  `    <div class="wrap">`,
  `      <p class="kicker">the specification and the standards on it</p>`,
  `      <h2>${esc(byId["common-agent"]?.name ?? "The base")} and ${plural(mainStandards, "standard", "standards")}</h2>`,
  ``,
  ...main.map((s) => card(s) + "\n"),
  `    </div>`,
  `  </section>`,
  ``,
  `  <section class="band">`,
  `    <div class="wrap">`,
  `      <p class="kicker">the support stack</p>`,
  `      <h2>Jobs, processes and playbooks</h2>`,
  `      <p>These entries describe the work itself, and none of them is a document two`,
  `        parties exchange. ${counts.name("roles")} says what a participant is for, ${counts.name("processes")}`,
  `        says how a piece of work moves from start to finish, and`,
  `        ${counts.name("collab")} says how a group works through one step of that work together.</p>`,
  ``,
  ...support.map((s) => card(s) + "\n"),
  `    </div>`,
  `  </section>`,
].join("\n");

let html = readFileSync(PAGE, "utf8");
const eol = html.includes("\r\n") ? "\r\n" : "\n";
html = html.replace(/\r\n/g, "\n");
html = replaceBlock(html, "hero", hero);
html = replaceBlock(html, "stack", stack);
html = replaceBlock(html, "entries", entries);
writeFileSync(PAGE, html.replace(/\n/g, eol));
console.log(
  `standards.html: ${list.length} entries from ${src.from}; ${counts.roles} roles, ${counts.patterns} playbooks; ` +
    list.map((s) => `${s.id} ${s.version}`).join(", "),
);

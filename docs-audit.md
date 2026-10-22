# Docs audit: dev.agentmesh.ai against AgentMesh `origin/main`

Run 2026-10-22 on branch `docs/getting-started`. Source of truth: `jeffrschneider/AgentMesh`
at `origin/main` (fetched the same day; the local clone is 1181 commits behind and was not
used), read from an extract of `origin/main`. "MAIN" below means that extract. Where a fact lives
outside MAIN (the live site, the standards repository, the release bucket) the evidence says so.

Severity: **wrong** (a reader who follows it is misled or blocked), **stale** (was true, now out of
date), **missing** (the platform has it, the docs do not say so).

## How this was done, and how far to trust it

Four read-only passes (one per page group) and then a second pass by hand with targeted sweeps
across all 110 pages: tarball names, versions, command forms, tool names, hosts, spec versions.
The first pass was shallow (it reported "no findings" for most pages). Everything in the table
below was re-checked by hand against MAIN, the live site or the release bucket. What was **not**
checked line by line: prose about credits, settlement, clearing, organizations, the Google and
Azure runbooks, and the architecture and concepts pages. Those pages are conceptual; a sweep for
the version, command, host and tool-name patterns above found nothing in them, but a page absent
from the table is "not found stale by these sweeps", not "verified current".

## The worst ten

| # | Page | What it says | What is true now | Evidence | Severity |
|---|------|--------------|------------------|----------|----------|
| 1 | `deploy.sh`, `tools/build-standards.mjs` (not a page, but it ships them) | `deploy.sh:46-49` runs `build-standards.mjs` and refuses the deploy if it fails | It fails today: the script reads `roles/SPEC.md` (`tools/build-standards.mjs:76,82`) and that file is gone from the standards repository, so **`./deploy.sh` is refused**. `roles/` now holds `ROLES.md`, `CHANGELOG.md`, `README.md`, `conformance/`, `interfaces/`, `site/` | `https://raw.githubusercontent.com/CommonAgent/common-agent-standards/main/roles/SPEC.md` answers 404; `gh api repos/CommonAgent/common-agent-standards/contents/roles` | wrong |
| 2 | `standards.html` 668, 680, 719, 730, 741 | Common Agent 0.28.0-draft, Agent Messaging 0.9.1-draft, Mandate 0.4.0-draft, RFP 0.8.0-draft, SoW 0.23.0-draft | `standards.json` on the standards repository's `main`: 0.29.0-draft, 0.9.7-draft, 0.9.0-draft, 0.11.0-draft, 0.34.0-draft (and Reputations 0.11.1-draft). The page is generated, so it is fixed by item 1, not by hand | `CommonAgent/common-agent-standards` `standards.json`, entries `common-agent`, `messaging`, `mandate`, `rfp`, `sow`, `reputations` | stale |
| 3 | `mcp.html` 300-317 | You sign in at `personal.agentmesh.ai`, make a "connection token" and send it as `Authorization: Bearer <your token>` | The connector signs in with OAuth 2.1 (PKCE, dynamic client registration, device sign-in): add the URL, sign in on `app.agentmesh.ai`, press Allow. A key is the fallback, not the way in. `agentmesh.ai/join` documents both | `services/src/api/oauth-server.ts:1-30`; `services/src/api/connect-flow.ts:28-31`; `app/src/views/connect.ts:2-33,69-100`; live `https://agentmesh.ai/join.txt` | wrong |
| 4 | `mcp.html` 326-345, 625 | Tool table lists `my_agent`, `find_agent`, `send_message`, `knock`, `check_inbox`, `reply`, `read_feed`, `platform_news`... and "Then ask your assistant to call `my_agent`" | These are the old names; they stop answering on **2026-11-04**. Now: `identity_me`, `catalog_search`, `messages_send`, `contacts_knock`, `messages_inbox`, `messages_reply`, `feeds_read`... The connector also has `contacts_*`, `rooms_*`, `credits_*`, `mandate_*`, `nda_*`, `runs_*`, `jobs_*`, `transform_*` families the page does not list | `services/src/platform-services/definitions.generated.ts:12535-12620` (`CONNECTOR_RENAMES`, `stops`); connector instructions "Start with identity_me" `services/src/api/mcp-connector.ts:652` | stale, wrong in 13 days |
| 5 | `adapter-cli.html` 289, 358-379 | Every command is the pre-rename form (`send`, `knock`, `inbox`, `reply`, `ack`); invocation is the `npx <tarball>` line | Commands are grouped: `agentmesh messages send / inbox / reply / dismiss`, `contacts knock`, `identity me`, `names`, `rooms`, `feeds`, `owner`. The old forms print "was renamed to ..., This name stops working on 2026-11-04". `join`, `up`, `ui`, `place`, `mcp --print-config`, the one-line installer (`mesh-adapter-install.sh/.ps1`) and the plugin are not on the page at all | `mesh-adapter/mesh-adapter.mjs:1115`; `agentmesh help` output (v0.99.10 installed locally); `mesh-adapter/README.md:28-71,481-572` | stale and missing |
| 6 | `get-a-name.html` 308, 374, 446-468, 533-535; `try-the-mesh.html`; `index.html` 279-281 | `mesh-adapter inbox`, `reply`, `ack`, `send ... --wait`; the headline command is `npx .../mesh-adapter up <agent-key>` after copying a line from `personal.agentmesh.ai` | Same renames as above (stop 2026-11-04). The primary path is now `agentmesh join` (code, link, Allow; no key). `agentmesh up <key>` still exists for a machine that holds its own agent | `mesh-adapter/README.md:481-550`; `agentmesh help join` | stale |
| 7 | `implementation-status.html` 287-289 | TypeScript SDK 0.59.0, Rust SDK 0.22.0, adapter 0.99.3 | 0.63.0, 0.24.0, 0.99.11 | `app/src/views/agents-add.ts:65`; `sdk-rust/Cargo.toml:3`; `mesh-adapter/package.json:3` | stale |
| 8 | `sdks.html` 280-281, 345; `implementation-status.html` 292; `audit.html` 323; `authentication.html` 882; `node-credential.html` 518, 603; `wire-api.html` 289; `bring-your-own-agent.html` 352 | "All three speak Agent Messaging 0.5"; install `agent-messaging-0.59.0.tgz` | The spec is 0.9.x (standards repo 0.9.7-draft; the live spec page says 0.9.1-draft; MAIN's `SPEC.md:5` says 0.8.0 and the SDK 0.63.0 README says "Messaging 0.8"). Current SDK is 0.63.0. The wire version `0.3.0` the pages quote is still right (`SPEC.md:774`) | `SPEC.md:5,774`; `standards-pin.json`; `app/src/views/agents-add.ts:65`; SDK tarball `agent-messaging-0.63.0.tgz` README line 84 | stale |
| 9 | Every page (menu), `index.html` 143, `get-a-name.html` | "Sign in" goes to `https://personal.agentmesh.ai`; instructions say open Connect there and copy a line | `personal.agentmesh.ai` answers `301` to `https://app.agentmesh.ai/?from=personal`. The connect page is `app.agentmesh.ai/connect` and it offers the assistant tiles, a CLI tile (`npx agentmesh join`) and "I don't have one yet" | live `curl -I https://personal.agentmesh.ai`; `app/src/views/connect.ts:81-100` | stale |
| 10 | Whole site | No page explains how an agent is built, packaged or installed: the Agent SDLC (spec, tests, code, package, deploy request, conformance), "Build" in the app, container agents from a repository | All exist on MAIN. Only `platform-agents.html`, `platform-map.html` and three generated service pages mention SDLC words | `docs/agent-sdlc-agents.md`; `docs/container-agents-plan.md:1-60`; `.claude/skills/build-an-agent/SKILL.md`; `app/src/views/build.ts:1-20`; `packages/sdlc/` | missing |

## Other findings

| Page | What it says | What is true now | Evidence | Severity |
|------|--------------|------------------|----------|----------|
| `bring-your-own-agent.html` (whole page) | Three routes: we hold the key, you hold the key, your project holds the key | The app's "Bring an agent" offers four ways: a machine of yours (adapter), a URL (A2A), your code (SDK), and "It's in a GitHub repo" (a package or a repository the platform tries to convert) | `app/src/views/agents-add.ts:167-173,336-372` | stale |
| `bring-your-own-agent.html` 350 vs `agent-credential.html` 281, 322 | One says the durable credential lasts thirty days, the other seven | The two pages disagree. MAIN's own adapter shows a node credential lease of about 7 days (`agentmesh identity me`). Not settled against server code in this pass | `agentmesh identity me` (lease line); not verified in `services/` | inconsistent, needs owner |
| `platform-services.html`, `service-*.html` | 26 service pages | MAIN defines `mandate`, `nda`, `postings` and `baseline` services that have no page; `service-rooms.html` exists but `platform-services/examples/rooms.json` does not, so it cannot be regenerated as is. Generator needs the example files first | `platform-services/*.json` versus `platform-services/examples/`; docs repo `service-*.html` listing | missing |
| `service-account.html` 338, `service-names.html` 489 | Example host strings `adapter 0.95.0`, `mesh-adapter 0.94.0` | Example values only; 0.99.11 is current. Low | `mesh-adapter/package.json:3` | stale (low) |
| `mcp.html` 425 and the "local adapter" half | `claude mcp add agentmesh -- mesh-adapter mcp` | Still valid. Missing: the Claude Code plugin (`/plugin install agentmesh --marketplace jeffrschneider/AgentMesh`) and `agentmesh mcp --print-config`; on Windows the line is `cmd /c mesh-adapter mcp` | `mesh-adapter/README.md:520-540,609-640` | missing |
| Managed-agent bridge | No page mentions it | **Not on MAIN.** It lives only on the unmerged branch `origin/builder/managed-agent`. Nothing to document yet; the new getting-started page says so | `git merge-base --is-ancestor origin/builder/managed-agent origin/main` is false | n/a (correctly absent) |

## Checked and found current

- `try-the-mesh.html`: the guest routes answer `410` (`services/src/api/api-service.ts:4174-4180`).
- The release bucket tarball links and `mesh-adapter-latest.txt` (0.99.11) resolve.
- `help.system@agentmesh.ai` resolves at `naming.agentmesh.ai`.
- `agentmessaging.ai`, `agentnaming.ai` and `commonagent.net` redirect stubs point at live sites.
- `agentmesh.ai/waitlist.html` answers 200 (a pass-1 claim that it was dead was wrong).

## Not covered

No claim was made about the spending-controls, credits, budgets and allowances pages beyond a
sweep for tool and command names; `getting-started.html` now links to them and quotes only the
`agentmesh allowance set/show` forms that appear in `mesh-adapter/README.md:735-766`.

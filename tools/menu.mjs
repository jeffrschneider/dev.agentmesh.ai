// The site's left menu, in one place. tools/build-menu.mjs writes it into
// every page; the platform-services generator copies it from platform-map.html.
// Titles are what a person reads, not file names. `only: "current"` keeps an
// entry out of the menu except on its own page.
export const MENU = [
  ["AgentMesh", [
    ["https://agentmesh.ai/", "Back to agentmesh.ai"],
    ["https://personal.agentmesh.ai", "Sign in"],
    ["https://agentmesh.ai/waitlist.html", "Join the waitlist"],
  ]],
  ["Build", [
    ["getting-started.html", "Getting started"],
    ["platform-map.html", "Platform map"],
    ["platform-services.html", "Platform services"],
    ["house-stack.html", "House stack", { only: "current" }],
    ["walking-the-lifecycle.html", "Walking the lifecycle"],
    ["bring-your-own-agent.html", "Bring your own agent"],
    ["agent-in-your-cloud.html", "Agent in your cloud"],
    ["your-own-cloud.html", "Cloud permissions"],
    ["try-the-mesh.html", "Sandbox guest access"],
    ["get-a-name.html", "Get a name"],
    ["examples.html", "Examples"],
    ["sdks.html", "SDKs"],
    ["nodes.html", "Nodes"],
    ["audit.html", "Audit"],
    ["anchoring.html", "Anchoring"],
    ["a2a-bridge.html", "A2A bridge"],
    ["a2a-card-extensions.html", "A2A card extensions"],
    ["a2a-ui-links.html", "A2A UI links"],
    ["pact.html", "PACT"],
    ["rooms.html", "Rooms"],
    ["mcp.html", "MCP"],
    ["screening.html", "Screening"],
    ["observability.html", "Observability"],
  ]],
  ["Sell and hire", [
    ["selling.html", "Selling"],
    ["catalog.html", "Catalog"],
    ["credits.html", "Credits"],
    ["spending-controls.html", "Spending controls"],
    ["account-api.html", "Account API"],
  ]],
  ["Run your own", [
    ["running-a-mesh.html", "Running a mesh"],
    ["clouds.html", "Clouds"],
    ["platform-agents.html", "Platform agents"],
    ["operator-obligations.html", "Operator obligations"],
    ["operator-revenue.html", "Operator revenue"],
    ["settlement.html", "Settlement"],
    ["clearing-interface.html", "Clearing interface"],
  ]],
  ["Run on Google Cloud", [
    ["for-google.html", "Overview"],
    ["for-google-instance.html", "1. Your own mesh"],
    ["for-google-onramp.html", "2. On-ramp"],
    ["for-google-compute.html", "3. Compute"],
    ["for-google-network.html", "4. Network"],
    ["for-google-credential.html", "5. Credentials"],
    ["for-google-traces.html", "6. Traces"],
    ["for-google-screening.html", "7. Screening"],
    ["for-google-example.html", "Worked example"],
  ]],
  ["Run on Azure", [
    ["for-microsoft.html", "Overview"],
    ["for-microsoft-instance.html", "1. Your own mesh"],
    ["for-microsoft-onramp.html", "2. On-ramp"],
    ["for-microsoft-compute.html", "3. Compute"],
    ["for-microsoft-network.html", "4. Network"],
    ["for-microsoft-credential.html", "5. Credentials"],
    ["for-microsoft-traces.html", "6. Traces"],
    ["for-microsoft-screening.html", "7. Screening"],
    ["for-microsoft-example.html", "Worked example"],
  ]],
  ["Concepts", [
    ["agents.html", "Agents"],
    ["core-concepts.html", "Core concepts"],
    ["authentication.html", "Authentication"],
    ["organizations.html", "Organizations"],
    ["use-cases.html", "Use cases"],
    ["collaboration.html", "Collaboration"],
    ["alternatives.html", "Alternatives"],
    ["architecture.html", "Architecture"],
    ["topologies.html", "Topologies"],
    ["world-wide-mesh.html", "World-wide mesh"],
    ["budgets-and-allowances.html", "Budgets and allowances"],
  ]],
  ["Reference", [
    ["https://commonagent.net/", "The Common Agent Specification"],
    ["https://agentmessaging.ai/spec.html", "Specification"],
    ["related-specs.html", "Related specifications"],
    ["standards.html", "Standards"],
    ["sdk-reference.html", "SDK reference"],
    ["cli.html", "CLI"],
    ["console.html", "Console"],
    ["adapter-cli.html", "Adapter CLI"],
    ["what-it-sends.html", "What it sends"],
    ["implementation-status.html", "Implementation status"],
    ["wire-api.html", "Wire API"],
    ["agent-credential.html", "Agent credential"],
    ["job-credential.html", "Job credential"],
    ["node-credential.html", "Node credential"],
    ["faq.html", "FAQ"],
  ]],
];

// Sections open on a page with no entry of its own (the home page).
export const OPEN_WHEN_NO_CURRENT = ["AgentMesh", "Build"];

const CHEV = '<svg class="sn-chev" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const MARK = '<svg class="sn-mark" viewBox="0 0 32 32" width="24" height="24" aria-hidden="true" focusable="false"><rect x="3" y="3" width="12" height="12" rx="3.5" fill="none" stroke="currentColor" stroke-width="2"/><rect x="17" y="17" width="12" height="12" rx="3.5" fill="none" stroke="currentColor" stroke-width="2"/><rect x="3" y="17" width="12" height="12" rx="3.5" fill="#1FA67A"/><rect x="17" y="3" width="12" height="12" rx="3.5" fill="#F2A93B"/></svg>';
const MOON = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13.5 9.6A5.6 5.6 0 0 1 6.4 2.5a5.6 5.6 0 1 0 7.1 7.1z" fill="currentColor"/></svg>';
const SUN = '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="3.2" fill="currentColor"/><g stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M8 1v1.8M8 13.2V15M1 8h1.8M13.2 8H15M3 3l1.3 1.3M11.7 11.7L13 13M3 13l1.3-1.3M11.7 4.3L13 3"/></g></svg>';
const BARS = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

export const BEGIN = "<!-- BEGIN menu, written by tools/build-menu.mjs from tools/menu.mjs -->";
export const END = "<!-- END menu -->";

/** The menu for one page. The current page's link is exactly
 *  `<a class="on" href="...">`, which the platform-services generator looks for. */
export function renderMenu(current) {
  const hasCurrent = MENU.some(([, items]) => items.some(([href]) => href === current));
  const secs = MENU.map(([name, items]) => {
    const shown = items.filter(([href, , o]) => !(o && o.only === "current") || href === current);
    const open = shown.some(([href]) => href === current) || name === "AgentMesh" || (!hasCurrent && OPEN_WHEN_NO_CURRENT.includes(name));
    const links = shown.map(([href, label]) => {
      const ext = href.startsWith("https://") && !href.includes("agentmesh.ai") ? '<span class="sn-ext" aria-hidden="true">&#8599;</span>' : "";
      const on = href === current ? ' class="on"' : "";
      return `            <a${on} href="${href}">${label}${ext}</a>`;
    }).join("\n");
    return `        <details class="sn-sec"${open ? " open" : ""}>\n          <summary>${name}${CHEV}</summary>\n          <div class="sn-items">\n${links}\n          </div>\n        </details>`;
  }).join("\n");
  return `${BEGIN}
    <aside class="sidenav" id="sidenav">
      <div class="sn-head">
        <a class="sn-brand" href="./" aria-label="AgentMesh developer docs home">${MARK}<span class="sn-wm">Agent<b>Mesh</b></span></a>
        <button class="sn-btn" id="theme-toggle" type="button" aria-label="Switch between light and dark"><span class="sn-to-dark">${MOON}</span><span class="sn-to-light">${SUN}</span><span class="sn-to-dark">Dark</span><span class="sn-to-light">Light</span></button>
        <button class="sn-btn sn-menu" id="menu-toggle" type="button" aria-expanded="false" aria-controls="sidenav">${BARS}Menu</button>
      </div>
      <nav class="sn-nav" aria-label="Developer docs">
${secs}
      </nav>
      <div class="sn-foot"><a href="standards.html">The family of standards</a><br>The signed interconnect<br>dev.agentmesh.ai</div>
    </aside>
    ${END}`;
}

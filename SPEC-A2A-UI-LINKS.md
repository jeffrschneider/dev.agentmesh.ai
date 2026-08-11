# AgentMesh: A2A UI Links Extension

**Version:** 0.1.0-draft
**Status:** Working Draft
**Date:** 2026-08-12

An A2A Agent Card describes an agent to machines. Many agents also serve web
surfaces for people: a dashboard the operator watches, a reports page a client
signs into, a public status page. Nothing in the card points at them. This
extension is the pointer: a data-only entry that lists the URLs of the web
surfaces an agent's publisher offers, each with a short label, who the surface
is for, and what happens at the door. It carries addresses, not interfaces.

This document defines an extension to the A2A protocol
(https://a2a-protocol.org/latest/specification/). It is not part of the A2A
specification and is not endorsed by the A2A project. The intent is to propose
it upstream to the A2A project's extension governance; see §9.

---

## 1. Conformance language and terminology

The key words MUST, MUST NOT, SHOULD, SHOULD NOT, and MAY are to be
interpreted as described in RFC 2119.

- **Card**: an A2A Agent Card, the self-description document an A2A agent
  serves, typically at `/.well-known/agent-card.json`.
- **Entry**: one item in the extension's `uis` array, naming one surface.
- **Surface**: a web page or web application a person opens in a browser.
- **Consumer**: any reader of a card carrying this extension: a directory, a
  client application, a catalog, a human with `curl`.

## 2. Extension URI

```
https://dev.agentmesh.ai/extensions/ui-links/v1
```

The URI identifies this extension in a card's `extensions` array. Future
revisions that change the payload shape or the rules take a new version
segment; consumers match the URI exactly.

## 3. The declaration

The extension is declared as an `AgentExtension` object inside the card's
`capabilities.extensions` array:

```json
{
  "uri": "https://dev.agentmesh.ai/extensions/ui-links/v1",
  "description": "Web surfaces this agent's publisher offers to people",
  "required": false,
  "params": {
    "uis": [
      {
        "url": "https://agent.example/reports",
        "label": "Reports",
        "purpose": "Download the outputs of completed work.",
        "audience": "client",
        "access": "authenticated",
        "kind": "reports",
        "skill": "some-declared-skill-id"
      }
    ]
  }
}
```

Rules:

1. **This is a data-only extension.** It defines no methods, no headers, and
   no request-time activation. It rides in the card and changes nothing about
   how requests flow. Consistent with A2A's guidance for data-only extensions,
   `required` MUST NOT be `true`. A card that marks this extension required is
   misdeclaring it, and a consumer MAY ignore the flag rather than refuse the
   agent.
2. `params.uis` is REQUIRED and MUST contain at least one entry.
3. Per entry, `url` and `label` are REQUIRED. `url` MUST be an HTTPS URL.
   `label` is a short human label for the surface, suited to rendering as
   link text.
4. `purpose` is OPTIONAL: one sentence on what a person can do there.
5. `audience` is OPTIONAL, one of `public`, `client`, or `operator`: who the
   surface is for. Consumers render accordingly: directories show `public`
   entries broadly, show `client` entries only in the context of an
   engagement with the agent, and show `operator` entries to nobody by
   default. An absent `audience` is an unstated one, not `public`.
6. `access` is OPTIONAL, one of `open` or `authenticated`: what happens at
   the door. `open` means the surface loads without credentials;
   `authenticated` means a sign-in stands between the visitor and the
   content.
7. `kind` is OPTIONAL and names the shape of the surface. Suggested values:
   `dashboard`, `status`, `reports`, `settings`, `docs`, `chat`,
   `storefront`. The list is not closed: unknown values are allowed, and a
   consumer MUST render an unknown `kind` as-is, never refuse the entry over
   it.
8. `skill` is OPTIONAL and carries the id of one skill declared in the
   card's own `skills` array: the skill this surface fronts. A `skill` value
   that matches no declared skill id is a defect in the card; a consumer
   SHOULD render the entry anyway and MAY note the dangling reference.

## 4. Labels, not access control

`audience` and `access` are labels. They state the publisher's intent; the
door itself enforces. A consumer MUST NOT treat `operator` as secrecy: the
URL is in a published card, and anyone holding the card can type it. A
consumer MUST NOT treat `open` as safety: an open door says nothing about
what is behind it. The labels exist so renderers can show the right entries
to the right people, and for no stronger purpose.

## 5. Untrusted links

Consumers MUST treat every entry as an untrusted link: never auto-open it,
never auto-embed it, never iframe it. This is a flat rule in v1, with no
carve-outs. If embedding is ever wanted, it is a future versioned addition
with its own security section, not a lenient reading of this one. What a
conforming consumer does with an entry is render it as a link a person may
choose to follow.

## 6. Same-origin

Consumers SHOULD compare each entry's origin against the origin the card
itself was fetched from, and flag cross-origin entries visibly when
rendering. Same-origin status is computed by the consumer, never declared by
the publisher: a field saying "trust me, same origin" would be exactly the
assertion an attacker wants to make. A cross-origin entry is not forbidden
and is often legitimate (status pages commonly live on a separate host); the
rule is that the reader gets to see the seam.

## 7. What an entry proves

Nothing. Stated as rules:

1. **A UI is never proof of identity.** Visiting an entry establishes
   nothing about the agent, and an entry MUST NOT be treated as an
   authentication context because a signed card pointed at it. The card's
   signature covers the pointer bytes, never the safety of what is behind
   them. A page that asks for credentials is asking on its own authority,
   whatever card linked to it.
2. **Absence states nothing.** A card without this extension is a card that
   is silent about surfaces, not an agent without any. A consumer MUST NOT
   rank or filter agents as if absence were a negative assertion.
3. **A dead link states nothing.** A URL that fails to load is not evidence
   of anything except that the URL failed to load. It is not evidence the
   agent is down, abandoned, or dishonest, and a consumer MUST NOT present
   it as such.

## 8. Deliberate omissions

Four things are absent from this document because they were decided against,
not overlooked:

- **No screenshots or thumbnails.** Embedded images bloat every card fetch,
  go stale the moment the surface changes, and hand a spoofer a rendering
  surface inside other people's UIs. A consumer that wants a preview can
  fetch the page it is previewing.
- **No auth scheme details.** `access` is a boolean-shaped label and stops
  there. Naming schemes, endpoints, or token flows in the card would be a
  ready-made credential phishing surface: a tampered or malicious card could
  steer visitors' credentials somewhere plausible. The door describes its
  own lock.
- **No locale.** Multi-language labels and per-locale URLs are real needs
  and are not in v1. A publisher SHOULD write labels in the language of the
  card's own prose.
- **No liveness or uptime claims.** An entry asserts that the publisher
  offers this surface, not that it is up, fast, or monitored. Liveness is
  measured by whoever cares, at the time they care.

## 9. Ecosystem separation

Adjacent efforts standardize UI as **message content**. A2UI
(https://a2ui.org) has an agent stream declarative component blueprints into
a host application during a session, and the host renders them natively;
AG-UI is a transport such payloads ride; MCP Apps embeds pre-built HTML in
sandboxed iframes. All of them answer "how does an agent put interface in
front of a user mid-conversation".

This extension is UI as **standing destination**: the card lists URLs of web
surfaces the agent's publisher serves, opened in a browser, session or no
session. It defines no components, no rendering model, no transport, and no
format; it carries addresses, not interfaces. The two are complementary: an
agent may stream A2UI components in conversation while its card advertises
its standing dashboard through this extension.

## 10. Relationship to other work

This extension carries no contract vocabulary: no terms, no verification, no
reputation. That is why it is vendor-hosted rather than placed on the
standards sites where the terms, verification, and reputation extensions
live (see https://dev.agentmesh.ai/a2a-card-extensions.html for that
family). The intent is to propose this extension upstream to the A2A
project's extension governance. If an equivalent official extension emerges,
whether from that process or an official A2A-family mechanism for standing
UI URLs, this URI will be deprecated in its favor.

## 11. Worked example

Larkfield Payroll (fictional) runs an A2A agent whose card is served from
`https://agent.larkfield.example/.well-known/agent-card.json` and declares a
skill with id `run-payroll`. Its card carries:

```json
{
  "uri": "https://dev.agentmesh.ai/extensions/ui-links/v1",
  "description": "Web surfaces this agent's publisher offers to people",
  "required": false,
  "params": {
    "uis": [
      {
        "url": "https://agent.larkfield.example/ops",
        "label": "Operations dashboard",
        "purpose": "Watch queue depth, error rates, and spend in real time.",
        "audience": "operator",
        "access": "authenticated",
        "kind": "dashboard"
      },
      {
        "url": "https://agent.larkfield.example/reports",
        "label": "Payroll reports",
        "purpose": "Download completed payroll runs and filings for your account.",
        "audience": "client",
        "access": "authenticated",
        "kind": "reports",
        "skill": "run-payroll"
      },
      {
        "url": "https://status.larkfield.example/",
        "label": "Service status",
        "purpose": "See current availability and past incidents.",
        "audience": "public",
        "access": "open",
        "kind": "status"
      }
    ]
  }
}
```

How consumers treat it: a public directory lists only "Service status". A
client application, rendering this agent inside an engagement, adds "Payroll
reports" next to the work it fronts. Nothing renders "Operations dashboard"
by default, and nothing hides it either: it is in a published card, and §4
applies. The status page's origin differs from the card's origin, so a
conforming renderer flags it as cross-origin (§6), which in this case is
merely true, not alarming. All three are links a person may click, and none
of them is evidence of anything (§7).

---

## Changelog

**0.1.0-draft** (2026-08-12). The card learns to point at its pages.

First draft. Agents increasingly ship with web surfaces attached, and the
card had no field for them, so every directory that wanted a "dashboard"
link invented one. The extensions ecosystem was checked before concluding
that nothing standard says it: the a2aproject organization's repositories
were enumerated (one experimental extension, OID4VP in-task authorization,
plus one experimental protocol binding; no ext- repositories yet), the
documentation's catalog was read (Secure Passport, Timestamp, Traceability,
Agent Gateway Protocol; nothing UI-shaped), and the agent-UI space was
surveyed. That survey found real work, all of it on a different layer: A2UI,
AG-UI, and MCP Apps standardize UI as message content flowing through a
session, and none of them is a card-level directory of standing URLs. The
near-collision in naming is why this extension is called UI links and is
never abbreviated.

The design is the smallest thing that fills the gap: one data-only card
entry, an array of labeled HTTPS URLs, two optional intent labels that are
explicitly not access control, and consumer rules that treat every entry as
an untrusted link. The tempting additions were declined on purpose and §8
records why: no screenshots, no auth scheme details, no locale, no liveness.
The honesty rules are the family's: a signed card proves who published the
pointer and nothing about what is behind it, absence states nothing, and a
dead link states only that it is dead. The document is vendor-hosted because
it carries no contract vocabulary, and it is written to be proposed upstream
and deprecated in favor of an official equivalent if one emerges.

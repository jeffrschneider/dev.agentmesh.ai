# AgentMesh Developer Docs — Style Notes

This repo is the source for the live site at **https://dev.agentmesh.ai/** (served via
GitHub Pages from `main`). Plain static HTML/CSS/JS — edit the `.html` files
directly and push to `main` to deploy.

## No em dashes

**Do not use em dashes (`—`, U+2014) anywhere in the site's prose.** This
applies to the literal character *and* the HTML entities `&mdash;`, `&#8212;`,
and `&#x2014;`.

Rewrite instead of inserting one:
- **Colon** when introducing a list, an example, or an explanation of what
  precedes it. (`"what you need: by capability, by skill"`)
- **Comma** for an appositive or a light aside. (`"work together, no matter where they run"`)
- **Period** (new sentence) when it would join two independent clauses.

Exceptions (leave these alone):
- Content inside `<pre>`/`<code>` blocks — code comments, template strings, and
  copy-paste prompts are not prose.
- Box-drawing characters in ASCII diagrams and HTML section comments
  (`─` U+2500, `──`, `──▶`), which are a different character, not em dashes.
- En dashes (`–`) and hyphens (`-`) are fine.

Quick check before committing:
```bash
grep -rnoE '&mdash;|&#8212;|&#x2014;|—' *.html
```
Any hit outside a `<pre>`/`<code>` block should be reworded away.

## spec.html is generated — never hand-edit it

`spec.html` is rendered from the canonical spec at
`C:\Users\jeffr\Desktop\AgentMesh\SPEC.md` by `tools/build-spec.mjs`. To fix
spec content, edit the source spec in the AgentMesh repo, then regenerate:

```bash
node tools/build-spec.mjs          # from the repo root
```

Commit the regenerated page. It reproduces the spec verbatim, so the
no-em-dash rule does not apply to it (a spec is a quoted document, not site
prose). The em-dash grep above should skip `spec.html`.

The naming specification is not published here. It lives on its own site at
https://agentnaming.ai/spec.html, rendered from
`C:\Users\jeffr\Desktop\AgentMesh\SPEC-NAMING.md` by
`C:\Users\jeffr\Desktop\AgentMesh\naming\tools\build-spec.mjs`, which the
naming site owns. `naming-spec.html` here is a redirect stub. Do not add a
second builder for it.

## Split

This repo is the DEVELOPER site (build, run-your-own, concepts, reference).
The simple-user site lives in the separate agentmesh.ai repo; pages here link
to it with absolute https://agentmesh.ai/ URLs. spec.html is generated from
the AgentMesh repo's SPEC.md by tools/build-spec.mjs.

#!/usr/bin/env bash
# Publish this site to Google Cloud object storage and refresh the CDN.
# The site serves from gs://dev-agentmesh-ai-site behind the agentcatalog-lb
# load balancer; GitHub is source only and does not serve the site.
#
# What ships is the last commit, nothing else: the committed files are copied
# into a staging folder, the sitemap is built and the
# contrast gate is run there, and the folder is synced to the bucket.
# Uncommitted edits do not ship.
set -euo pipefail
BUCKET=gs://dev-agentmesh-ai-site
HOSTS=(dev.agentmesh.ai)
PROJECT=langbench-1528148150979
CACHE_CONTROL="public,max-age=3600"   # what the CDN has always been handed
GCLOUD="${GCLOUD:-/c/Users/jeffr/google-cloud-sdk-extract/google-cloud-sdk/bin/gcloud.cmd}"

cd "$(dirname "$0")"
if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  echo "note: uncommitted changes are not deployed; only $(git rev-parse --short HEAD) ships." >&2
fi

STAGE=$(mktemp -d)
trap 'rm -rf "$STAGE"' EXIT
git archive HEAD | tar -x -C "$STAGE"
# Only the site ships. Files that serve the repository and not the reader stay
# out of the bucket: dotfiles, the build tools, scripts, crash dumps, and
# Markdown, apart from the documents a page links to (SITE_MD). The check after
# the cleanup refuses the deploy if any such file is still in the staging folder.
SITE_MD=(SPEC-A2A-UI-LINKS.md)
rm -rf "$STAGE/CNAME" "$STAGE/tools"
find "$STAGE" -mindepth 1 -name '.*' -prune -exec rm -rf {} +
find "$STAGE" -type f \( -name '*.sh' -o -name '*.ps1' -o -name '*.mjs' -o -name '*.cjs' -o -name '*.stackdump' -o -name 'package.json' -o -name 'package-lock.json' \) -delete
while IFS= read -r md; do
  keep=no; for k in "${SITE_MD[@]}"; do [ "$md" = "./$k" ] && keep=yes; done
  [ "$keep" = yes ] || rm -f "$STAGE/$md"
done < <(cd "$STAGE" && find . -type f -name '*.md')
LEFT=$(cd "$STAGE" && find . -mindepth 1 \( -name '.*' -o -name '*.sh' -o -name '*.mjs' -o -name '*.stackdump' -o -path './tools*' \) -print)
if [ -n "$LEFT" ]; then echo "deploy refused: repository files in the staging folder:" >&2; echo "$LEFT" >&2; exit 1; fi
# Windows programs (gcloud, and node given a path) need the Windows spelling.
WSTAGE=$(cygpath -w "$STAGE" 2>/dev/null || echo "$STAGE")

# standards.html is a redirect to https://commonagent.net/standards.html, the
# list of the Common Agent Standards; nothing here builds it.

# sitemap.xml and robots.txt, from the pages being published.
node tools/build-sitemap.mjs "$WSTAGE" https://dev.agentmesh.ai

# The contrast gate: every page, light and dark, 1440 and 390 px wide, every
# menu section open. Any text below 4.5:1 stops the deploy here, before
# anything is uploaded, and the failures are listed by page, element and ratio.
[ -d tools/node_modules/playwright ] || (cd tools && npm ci --no-audit --no-fund)
if ! node tools/contrast-gate.mjs --root "$WSTAGE"; then
  echo "deploy refused: text below 4.5:1 contrast (listed above). Fix it, then deploy again." >&2
  exit 1
fi

# rsync uploads only what changed. Never --delete-unmatched-destination-objects:
# the bucket holds files that are not in this repository.
"$GCLOUD" storage rsync -r "$WSTAGE" "$BUCKET" --cache-control="$CACHE_CONTROL" --project "$PROJECT"
for h in "${HOSTS[@]}"; do
  "$GCLOUD" compute url-maps invalidate-cdn-cache agentcatalog-lb --path "/*" --host "$h" --project "$PROJECT"
done
echo "deployed $(git rev-parse --short HEAD): https://${HOSTS[0]}"

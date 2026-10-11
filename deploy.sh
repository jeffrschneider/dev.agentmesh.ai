#!/usr/bin/env bash
# Publish this site to Google Cloud object storage and refresh the CDN.
# The site serves from gs://dev-agentmesh-ai-site behind the agentcatalog-lb
# load balancer; GitHub is source only and does not serve the site.
#
# What ships is the last commit, nothing else: the committed files are copied
# into a staging folder, the sitemap is built and the contrast gate is run
# there, and the folder is synced to the bucket. Uncommitted edits do not ship.
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
rm -f "$STAGE/CNAME" "$STAGE/deploy.sh"
# Windows programs (gcloud, and node given a path) need the Windows spelling.
WSTAGE=$(cygpath -w "$STAGE" 2>/dev/null || echo "$STAGE")

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

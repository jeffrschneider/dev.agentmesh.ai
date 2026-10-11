#!/usr/bin/env bash
# Publish this site to Google Cloud object storage and refresh the CDN.
# The site serves from gs://dev-agentmesh-ai-site behind the agentcatalog-lb
# load balancer; GitHub is source only and does not serve the site.
set -euo pipefail
BUCKET=gs://dev-agentmesh-ai-site
HOSTS=(dev.agentmesh.ai)
PROJECT=langbench-1528148150979
GCLOUD="${GCLOUD:-/c/Users/jeffr/google-cloud-sdk-extract/google-cloud-sdk/bin/gcloud.cmd}"

cd "$(dirname "$0")"
# Refresh sitemap.xml and robots.txt from the tracked pages before staging, so
# search engines are always handed the current list. Commit them if they change.
node tools/build-sitemap.mjs . https://dev.agentmesh.ai
# The contrast gate: every page, light and dark, 1440 and 390 px wide, every
# menu section open. Any text below 4.5:1 stops the deploy here, before
# anything is uploaded, and the failures are listed by page, element and ratio.
[ -d tools/node_modules/playwright ] || (cd tools && npm ci --no-audit --no-fund)
if ! node tools/contrast-gate.mjs; then
  echo "deploy refused: text below 4.5:1 contrast (listed above). Fix it, then deploy again." >&2
  exit 1
fi
STAGE=$(mktemp -d)
trap 'rm -rf "$STAGE"' EXIT
git ls-files | grep -v -e '^CNAME$' -e '^deploy\.sh$' | while read -r f; do
  mkdir -p "$STAGE/$(dirname "$f")"
  cp "$f" "$STAGE/$f"
done
"$GCLOUD" storage cp -r "$STAGE"/* "$BUCKET/" --project "$PROJECT"
for h in "${HOSTS[@]}"; do
  "$GCLOUD" compute url-maps invalidate-cdn-cache agentcatalog-lb --path "/*" --host "$h" --project "$PROJECT"
done
echo "deployed: https://${HOSTS[0]}"

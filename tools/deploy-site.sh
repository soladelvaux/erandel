#!/usr/bin/env bash
# Deploys the production build to the public site (docs/architecture/deployment.md).
# Usage: tools/deploy-site.sh /path/to/soladelvaux.github.io
# Refuses to deploy unless the game repo is clean and the test suite passes.
set -euo pipefail
SITE="${1:?path to a clone of soladelvaux/soladelvaux.github.io}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
if [ -n "$(git status --porcelain -- src tools assets)" ]; then echo "src/, tools/ or assets/ has uncommitted changes; commit first" >&2; exit 1; fi
if [ "${SKIP_TESTS:-}" != "1" ]; then (cd tests && npm test); fi
node tools/build.js
COMMIT="$(git rev-parse --short HEAD)"
mkdir -p "$SITE/erandel"
cp dist/site/index.html "$SITE/erandel/index.html"
rm -rf "$SITE/erandel/assets"
if [ -d dist/site/assets ]; then cp -R dist/site/assets "$SITE/erandel/assets"; fi
cd "$SITE"
git add -A erandel
if git diff --cached --quiet; then echo "site already up to date"; exit 0; fi
git commit -q -m "Deploy Erandel from soladelvaux/erandel@$COMMIT" ${DEPLOY_TRAILER:+-m "$DEPLOY_TRAILER"}
git push -q origin HEAD
echo "deployed $COMMIT to https://soladelvaux.github.io/erandel/"

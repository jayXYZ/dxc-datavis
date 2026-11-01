#!/bin/sh
set -eu

# Keep this image in sync with the browser-test workflows.
IMAGE=mcr.microsoft.com/playwright:v1.64.1-noble
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)

docker run --rm --platform linux/amd64 \
  --user "$(id -u):$(id -g)" \
  --env HOME=/tmp --env CI=true \
  --mount "type=bind,src=$ROOT,dst=/work" \
  --tmpfs /work/node_modules:exec,mode=1777 \
  --workdir /work "$IMAGE" \
  sh -c 'npm ci && npx playwright test --update-snapshots=changed "$@"' -- "$@"

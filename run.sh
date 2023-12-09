#!/bin/bash

rm ./jsons/*.json

set -euxo pipefail
bun run scrape.ts "$@"

bun run send.ts "$@"

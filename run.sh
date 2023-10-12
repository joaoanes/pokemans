#!/bin/bash

rm ./jsons/*.json

set -euxo pipefail
bun run scrape.mjs

bun run send.mjs

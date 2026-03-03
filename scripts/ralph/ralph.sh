#!/usr/bin/env bash
set -euo pipefail

MAX_ITERATIONS=${1:-10}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROMPT_FILE="$SCRIPT_DIR/PROMPT.md"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

if ! command -v claude &>/dev/null; then
  echo -e "${RED}Error: claude CLI not found. Install: https://docs.anthropic.com/en/docs/claude-code${NC}"
  exit 1
fi

if [ ! -f prd.json ]; then
  echo -e "${RED}Error: prd.json not found. Run /prd then /ralph first.${NC}"
  exit 1
fi

if [ ! -f "$PROMPT_FILE" ]; then
  echo -e "${RED}Error: PROMPT.md not found at $PROMPT_FILE${NC}"
  exit 1
fi

CURRENT_BRANCH=$(jq -r '.branchName' prd.json 2>/dev/null || echo "")
if [ -f progress.txt ] && [ -n "$CURRENT_BRANCH" ]; then
  PREV_BRANCH=$(head -5 progress.txt | grep -oP 'Branch: \K.*' || echo "")
  if [ -n "$PREV_BRANCH" ] && [ "$PREV_BRANCH" != "$CURRENT_BRANCH" ]; then
    ARCHIVE_DIR="archive/$(date +%Y-%m-%d)-${PREV_BRANCH//\//-}"
    mkdir -p "$ARCHIVE_DIR"
    cp prd.json "$ARCHIVE_DIR/" 2>/dev/null || true
    cp progress.txt "$ARCHIVE_DIR/" 2>/dev/null || true
    echo -e "${YELLOW}Archived previous run to $ARCHIVE_DIR${NC}"
    rm -f progress.txt
  fi
fi

echo -e "${BLUE}=== Ralph Autonomous Agent Loop ===${NC}"
echo -e "${BLUE}Max iterations: $MAX_ITERATIONS${NC}"
echo -e "${BLUE}Branch: $CURRENT_BRANCH${NC}"
echo ""

for ((i = 1; i <= MAX_ITERATIONS; i++)); do
  echo -e "${GREEN}--- Iteration $i of $MAX_ITERATIONS ---${NC}"

  OUTPUT=$(cat "$PROMPT_FILE" | claude --dangerously-skip-permissions -p --output-format text 2>&1)

  echo "$OUTPUT"

  if echo "$OUTPUT" | grep -q '<promise>COMPLETE</promise>'; then
    echo -e "${GREEN}=== All stories complete! ===${NC}"
    exit 0
  fi

  echo -e "${YELLOW}Sleeping 2s before next iteration...${NC}"
  sleep 2
done

echo -e "${RED}=== Reached max iterations ($MAX_ITERATIONS) ===${NC}"
echo -e "${YELLOW}Some stories may still be incomplete. Check prd.json and progress.txt.${NC}"
exit 1

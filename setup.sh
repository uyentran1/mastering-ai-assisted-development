#!/usr/bin/env bash
# setup.sh — Install npm dependencies for all demo directories
# Run from inside the course repo: ./setup.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

success_count=0
fail_count=0
skip_count=0
failed_dirs=()

echo -e "${GREEN}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Mastering AI-Assisted Development — Setup       ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════╝${NC}"
echo ""
echo "Checking Node.js and npm..."
echo -e "  Node: $(node --version 2>/dev/null || echo 'not found')"
echo -e "  npm:  $(npm --version 2>/dev/null || echo 'not found')"

if ! command -v node &> /dev/null; then
    echo -e "\n${RED}Error: Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}Installing dependencies for all demo directories...${NC}"
echo ""

# Find every directory with a package.json (skip node_modules)
for pkg in $(find "$ROOT_DIR" -name "package.json" -not -path "*/node_modules/*" | sort); do
    dir="$(dirname "$pkg")"
    name="${dir#$ROOT_DIR/}"

    # Skip if node_modules already exists
    if [ -d "$dir/node_modules" ]; then
        echo -e "  ${YELLOW}⏭  Skipping${NC} $name (already installed)"
        skip_count=$((skip_count + 1))
        continue
    fi

    echo -e "  ${BLUE}📦 Installing${NC} $name"
    if (cd "$dir" && npm install --silent 2>&1); then
        echo -e "  ${GREEN}✓  Done${NC} $name"
        success_count=$((success_count + 1))
    else
        echo -e "  ${RED}✗  Failed${NC} $name"
        fail_count=$((fail_count + 1))
        failed_dirs+=("$name")
    fi
done

# Summary
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Summary${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "  ${GREEN}✓ Installed:${NC} $success_count"
echo -e "  ${YELLOW}⏭ Skipped:${NC}  $skip_count"
echo -e "  ${RED}✗ Failed:${NC}   $fail_count"

if [ ${#failed_dirs[@]} -gt 0 ]; then
    echo ""
    echo -e "  ${RED}Failed directories:${NC}"
    for d in "${failed_dirs[@]}"; do
        echo -e "    - $d"
    done
    exit 1
fi

echo ""
echo -e "${GREEN}All done! 🚀${NC}"

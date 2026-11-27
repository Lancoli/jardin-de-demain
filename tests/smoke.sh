#!/usr/bin/env bash
# Smoke test for Jardin de demain
# Verifies that the app serves its main page and contains expected content

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🌱 Jardin de demain — Smoke test"
echo ""

# Test 1: index.html exists
echo -n "  1. index.html exists... "
if [ -f "index.html" ]; then
  echo -e "${GREEN}✓${NC}"
else
  echo -e "${RED}✗${NC}"
  echo "    Error: index.html not found"
  exit 1
fi

# Test 2: index.html contains required elements
echo -n "  2. index.html has required content... "
errors=0

# Check for DOCTYPE
if ! grep -q "<!DOCTYPE html>" index.html; then
  echo -e "${RED}✗${NC}"
  echo "    Error: Missing DOCTYPE declaration"
  errors=$((errors + 1))
fi

# Check for title
if ! grep -q "<title>Jardin de demain" index.html; then
  echo -e "${RED}✗${NC}"
  echo "    Error: Missing or incorrect title"
  errors=$((errors + 1))
fi

# Check for brand mark (key visual element)
if ! grep -q "brand-mark" index.html; then
  echo -e "${RED}✗${NC}"
  echo "    Error: Missing brand mark element"
  errors=$((errors + 1))
fi

# Check for tools grid (main content)
if ! grep -q "tools-grid" index.html; then
  echo -e "${RED}✗${NC}"
  echo "    Error: Missing tools grid"
  errors=$((errors + 1))
fi

if [ $errors -eq 0 ]; then
  echo -e "${GREEN}✓${NC}"
else
  exit 1
fi

# Test 3: All linked HTML pages exist
echo -n "  3. All guide pages exist... "
missing=0

pages=(
  "calendrier-semis.html"
  "calendrier-recoltes.html"
  "associations-plantes.html"
  "guide-paillage.html"
  "arbres-secheresse.html"
  "semis-arbres.html"
  "plantes-nurses.html"
  "pharmacopee.html"
  "jardins-vivants.html"
  "temps-au-jardin.html"
)

for page in "${pages[@]}"; do
  if [ ! -f "$page" ]; then
    if [ $missing -eq 0 ]; then
      echo -e "${RED}✗${NC}"
    fi
    echo "    Error: Missing page $page"
    missing=$((missing + 1))
  fi
done

if [ $missing -eq 0 ]; then
  echo -e "${GREEN}✓${NC}"
else
  exit 1
fi

# Test 4: Assets directory exists
echo -n "  4. Assets directory exists... "
if [ -d "assets" ]; then
  echo -e "${GREEN}✓${NC}"
else
  echo -e "${YELLOW}⚠${NC}"
  echo "    Warning: assets/ directory not found (optional)"
fi

echo ""
echo -e "${GREEN}All smoke tests passed!${NC}"
exit 0

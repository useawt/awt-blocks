#!/usr/bin/env bash
#
# check-no-premium.sh — fail the build if AWT Premium *implementation* code has
# leaked into this free repo.
#
# What this DOES flag:
#   1. A Premium block implementation — a block directory whose slug is on the
#      denylist below and that carries block.json / render.php.
#   2. Any `premium-staging/` archive living inside the repo.
#   3. FAQ structured data (FAQPage JSON-LD), which is a Premium capability.
#      Premium code does not ship here, not even switched off.
#
# What this does NOT flag (by design: this is the shared base AWT Premium
# relies on):
#   - The PremiumNotice component, its `awt.premiumNotice` slot, and upsell
#     copy / URLs.
#   - General extension points (e.g. the awt_faq_item_rendered action).
#   - Round-trip attributes kept in block.json (onClickFunction, etc.).
#   - The design-system class contract that keeps a Premium slug live (e.g.
#     Carbon's `header-search` classes) so Premium routes through it, not forks.
#
# See awt-stage-1-spec.md §6 "Build sequencing".
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FAIL=0

# Block slugs reserved for AWT Premium — never ship as an implementation here.
PREMIUM_BLOCKS=("header-search")

for base in "src" "build"; do
  dir="$ROOT/$base"
  [ -d "$dir" ] || continue
  for slug in "${PREMIUM_BLOCKS[@]}"; do
    while IFS= read -r hit; do
      [ -n "$hit" ] || continue
      echo "❌ Premium block implementation found: ${hit#"$ROOT"/}"
      FAIL=1
    done < <(find "$dir" -type d -name "$slug" 2>/dev/null)
  done
done

# premium-staging must live in the awt-premium repo, never here.
while IFS= read -r hit; do
  [ -n "$hit" ] || continue
  echo "❌ premium-staging present in free repo: ${hit#"$ROOT"/}"
  FAIL=1
done < <(find "$ROOT" \( -name node_modules -o -name vendor \) -prune -o -type d -name "premium-staging" -print 2>/dev/null)

# Premium capabilities recognisable by what they output.
for base in "src" "build"; do
  dir="$ROOT/$base"
  [ -d "$dir" ] || continue
  while IFS= read -r hit; do
    [ -n "$hit" ] || continue
    echo "❌ FAQ structured data found: ${hit#"$ROOT"/}"
    FAIL=1
  done < <(grep -rlE "FAQPage|awt_faq_schema_enabled" "$dir" 2>/dev/null)
done

if [ "$FAIL" -ne 0 ]; then
  echo ""
  echo "Premium code belongs in the awt-premium repo, not this free repo."
  echo "See awt-stage-1-spec.md §6 'Build sequencing'."
  exit 1
fi

echo "✓ No AWT Premium implementation code in $(basename "$ROOT")."

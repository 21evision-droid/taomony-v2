#!/bin/bash
# =============================================================================
# Deploy Dify Integration — Phase 4
#
# Prerequisites:
#   - Dify Cloud account with two workflows created (see docs/dify-deployment.md)
#   - Dify API keys for both workflows
#   - Dify webhook secret generated
#   - Supabase CLI logged in
#   - Docker running (for local deployment)
#
# Usage:
#   ./scripts/deploy-dify.sh              # Interactive mode
#   ./scripts/deploy-dify.sh --cloud      # Dify Cloud setup
#   ./scripts/deploy-dify.sh --local      # Local Docker setup
#   ./scripts/deploy-dify.sh --secrets    # Set Supabase secrets only
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ── Configuration ──
SUPABASE_URL="https://jiwsgaegoudcutdnqydf.supabase.co"
DIFY_CLOUD_URL="https://cloud.dify.ai"
DIFY_LOCAL_URL="http://localhost"
CALLBACK_URL="${SUPABASE_URL}/functions/v1/dify-callback"

# ── Parse mode ──
MODE="${1:-interactive}"

# ── 1. Set up Dify instance ──
if [ "$MODE" = "--local" ] || [ "$MODE" = "interactive" ]; then
    if docker ps &>/dev/null; then
        info "Starting local Dify instance..."
        cd /d/Developer/dify/docker
        docker compose up -d
        DIFY_BASE_URL="$DIFY_LOCAL_URL"
        info "Dify running at $DIFY_BASE_URL"
    else
        warn "Docker not available. Use --cloud mode."
        if [ "$MODE" = "--local" ]; then exit 1; fi
    fi
fi

if [ "$MODE" = "--cloud" ] || [ "$MODE" = "interactive" ]; then
    DIFY_BASE_URL="$DIFY_CLOUD_URL"
    info "Using Dify Cloud: $DIFY_BASE_URL"
    info "Please create the workflows manually at https://cloud.dify.ai"
    info "See docs/dify-deployment.md for instructions."
fi

# ── 2. Prompt for API keys ──
echo ""
info "=== Dify API Credentials ==="
echo "After creating workflows in Dify, get API keys from the API Access page."
echo ""

read -rp "DIFY_WORKFLOW_A_API_KEY: " WORKFLOW_A_KEY
read -rp "DIFY_WORKFLOW_B_API_KEY: " WORKFLOW_B_KEY
read -rp "DIFY_WEBHOOK_SECRET (press Enter to generate): " WEBHOOK_SECRET

if [ -z "$WEBHOOK_SECRET" ]; then
    WEBHOOK_SECRET=$(python3 -c "import uuid; print(uuid.uuid4().hex)" 2>/dev/null || \
                     python -c "import uuid; print(uuid.uuid4().hex)" 2>/dev/null || \
                     openssl rand -hex 32)
    info "Generated webhook secret: $WEBHOOK_SECRET"
fi

# ── 3. Set Supabase secrets ──
echo ""
info "=== Setting Supabase Secrets ==="

npx supabase secrets set \
    DIFY_BASE_URL="$DIFY_BASE_URL" \
    DIFY_CALLBACK_URL="$CALLBACK_URL" \
    DIFY_WORKFLOW_A_API_KEY="$WORKFLOW_A_KEY" \
    DIFY_WORKFLOW_B_API_KEY="$WORKFLOW_B_KEY" \
    DIFY_WEBHOOK_SECRET="$WEBHOOK_SECRET"

info "Supabase secrets set successfully."

# ── 4. Deploy Edge Functions ──
echo ""
info "=== Deploying Edge Functions ==="

info "Pushing migrations..."
npx supabase db push

info "Deploying trigger-workflow-a..."
npx supabase functions deploy trigger-workflow-a

info "Deploying trigger-workflow-b..."
npx supabase functions deploy trigger-workflow-b

info "Re-deploying dify-callback (security update)..."
npx supabase functions deploy dify-callback

# ── 5. Verify deployment ──
echo ""
info "=== Verification ==="
echo ""
info "Testing trigger-workflow-a..."
curl -s -o /dev/null -w "  HTTP %{http_code}\n" \
    -X POST "${SUPABASE_URL}/functions/v1/trigger-workflow-a" \
    -H "Content-Type: application/json" \
    -d '{"fragment_id":"00000000-0000-0000-0000-000000000000"}' || \
    warn "  Expected 404 (fragment not found) — function is alive"

info "Testing trigger-workflow-b..."
curl -s -o /dev/null -w "  HTTP %{http_code}\n" \
    -X POST "${SUPABASE_URL}/functions/v1/trigger-workflow-b" \
    -H "Content-Type: application/json" \
    -d '{}' || \
    warn "  Expected 200 (threshold not reached) — function is alive"

echo ""
info "=== Deployment Complete ==="
echo ""
echo "  Dify:        $DIFY_BASE_URL"
echo "  Callback:    $CALLBACK_URL"
echo "  Workflow A:  deployed"
echo "  Workflow B:  deployed"
echo ""
echo "Next steps:"
echo "  1. Import Dify DSL files into the workflow editors"
echo "  2. Test with a real fragment submission"
echo "  3. Run end-to-end verification"

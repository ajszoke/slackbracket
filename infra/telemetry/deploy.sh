#!/usr/bin/env bash
# Deploy slackbracket telemetry stack (API Gateway + Lambda → S3).
# Prerequisites: aws CLI configured, S3 bucket "slackbracket-telemetry" exists.
#
# Usage:
#   ./infra/telemetry/deploy.sh          # deploy / update
#   ./infra/telemetry/deploy.sh delete   # tear down

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Source credentials: prefer repo-root .env.deploy, fallback to local .env
if [[ -f "${REPO_ROOT}/.env.deploy" ]]; then
  set -a; source "${REPO_ROOT}/.env.deploy"; set +a
elif [[ -f "${SCRIPT_DIR}/.env" ]]; then
  set -a; source "${SCRIPT_DIR}/.env"; set +a
fi

STACK_NAME="slackbracket-telemetry"
REGION="${AWS_DEFAULT_REGION:-us-west-2}"

if [[ "${1:-}" == "delete" ]]; then
  echo "Deleting stack ${STACK_NAME}..."
  aws cloudformation delete-stack --stack-name "$STACK_NAME" --region "$REGION"
  aws cloudformation wait stack-delete-complete --stack-name "$STACK_NAME" --region "$REGION"
  echo "Stack deleted."
  exit 0
fi

echo "Deploying stack ${STACK_NAME} to ${REGION}..."
aws cloudformation deploy \
  --stack-name "$STACK_NAME" \
  --template-file "${SCRIPT_DIR}/template.yaml" \
  --capabilities CAPABILITY_NAMED_IAM \
  --region "$REGION" \
  --no-fail-on-empty-changeset

echo ""
echo "=== Stack outputs ==="
aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query "Stacks[0].Outputs" \
  --output table

# Extract endpoint for easy copy-paste
ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='TrackEndpoint'].OutputValue" \
  --output text)

# Set S3 lifecycle: Glacier after 90 days
echo "Configuring S3 lifecycle (Glacier after 90d)..."
aws s3api put-bucket-lifecycle-configuration \
  --bucket slackbracket-telemetry \
  --lifecycle-configuration '{
    "Rules": [{
      "ID": "glacier-90d",
      "Status": "Enabled",
      "Filter": { "Prefix": "events/" },
      "Transitions": [{ "Days": 90, "StorageClass": "GLACIER" }]
    }]
  }' \
  --region "$REGION" 2>/dev/null || echo "(lifecycle already set or bucket in different region)"

echo ""
echo "Endpoint: ${ENDPOINT}"
echo ""
echo "Test with:"
echo "  curl -s -o /dev/null -w '%{http_code}' -X POST ${ENDPOINT} \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"event\":\"test\",\"hello\":\"world\"}'"
echo ""
echo "Then update NEXT_PUBLIC_TELEMETRY_URL in apps/web/.env.local:"
echo "  NEXT_PUBLIC_TELEMETRY_URL=${ENDPOINT}"

#!/usr/bin/env bash
# Slackbracket deploy pipeline: stage → verify → promote → (rollback)
#
# Usage:
#   ./infra/deploy.sh stage     Build with basePath=/dev, deploy to /dev/
#   ./infra/deploy.sh promote   Build clean, backup current prod, deploy to /
#   ./infra/deploy.sh rollback  Restore previous prod from backup
#   ./infra/deploy.sh status    Check both prod and stage are responding
#
# Requires: sshpass, rsync, npm
# Credentials: .env.deploy in repo root (see .env.deploy.example)

set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="${REPO_ROOT}/.deploy-backups"
WEB_DIR="${REPO_ROOT}/apps/web"
OUT_DIR="${WEB_DIR}/out"

# ── Load credentials ─────────────────────────────────────────────────
ENV_FILE="${REPO_ROOT}/.env.deploy"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: ${ENV_FILE} not found. Copy .env.deploy.example and fill in."
  exit 1
fi
set -a; source "$ENV_FILE"; set +a

for var in NFS_HOST NFS_USER NFS_PASS NFS_REMOTE_DIR NEXT_PUBLIC_TELEMETRY_URL; do
  if [[ -z "${!var:-}" ]]; then
    echo "ERROR: ${var} is empty in .env.deploy"
    exit 1
  fi
done

# ── Helpers ──────────────────────────────────────────────────────────
RSYNC_CMD="sshpass -p '${NFS_PASS}' rsync -avz --delete"
SSH_TARGET="${NFS_USER}@${NFS_HOST}"

build() {
  local base_path="${1:-}"
  echo "Building (basePath=${base_path:-/})..."
  (
    cd "$REPO_ROOT"
    # Only pass env vars that are set — don't override .env.local with empty values
    export NEXT_PUBLIC_BASE_PATH="$base_path"
    [[ -n "${NEXT_PUBLIC_TELEMETRY_URL:-}" ]] && export NEXT_PUBLIC_TELEMETRY_URL
    npm run build
  )
}

deploy_to() {
  local remote_path="$1"
  echo "Deploying to ${SSH_TARGET}:${remote_path}..."
  eval $RSYNC_CMD "${OUT_DIR}/" "${SSH_TARGET}:${remote_path}/"
}

backup_prod() {
  mkdir -p "$BACKUP_DIR"
  local stamp
  stamp="$(date +%Y%m%d-%H%M%S)"
  local backup_file="${BACKUP_DIR}/prod-${stamp}.tar.gz"
  echo "Backing up current prod to ${backup_file}..."
  # Download current prod into temp dir, tar it
  local tmp
  tmp="$(mktemp -d)"
  eval "sshpass -p '${NFS_PASS}' rsync -az ${SSH_TARGET}:${NFS_REMOTE_DIR}/ ${tmp}/" 2>/dev/null || true
  tar -czf "$backup_file" -C "$tmp" .
  rm -rf "$tmp"
  echo "Backup: ${backup_file} ($(du -h "$backup_file" | cut -f1))"

  # Keep only last 5 backups
  ls -t "${BACKUP_DIR}"/prod-*.tar.gz 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true
}

check_url() {
  local url="$1"
  local label="$2"
  local code
  code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$url" 2>/dev/null || echo "000")"
  if [[ "$code" =~ ^(200|301|302)$ ]]; then
    echo "  ${label}: ${url} → ${code} OK"
  else
    echo "  ${label}: ${url} → ${code} FAIL"
  fi
}

# ── Commands ─────────────────────────────────────────────────────────
case "${1:-help}" in
  stage)
    build "/dev"
    deploy_to "${NFS_REMOTE_DIR}/dev"
    echo ""
    echo "Staged at: https://slackbracket.com/dev"
    echo "Verify, then run: ./infra/deploy.sh promote"
    ;;

  promote)
    echo "=== Pre-flight ==="
    check_url "https://slackbracket.com/dev" "Stage"
    echo ""
    read -r -p "Promote staged build to prod? [y/N] " confirm
    if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
      echo "Aborted."
      exit 0
    fi
    backup_prod
    build ""
    deploy_to "${NFS_REMOTE_DIR}"
    echo ""
    echo "Promoted to: https://slackbracket.com"
    echo "If broken: ./infra/deploy.sh rollback"
    ;;

  rollback)
    latest="$(ls -t "${BACKUP_DIR}"/prod-*.tar.gz 2>/dev/null | head -1)"
    if [[ -z "$latest" ]]; then
      echo "ERROR: No backups found in ${BACKUP_DIR}/"
      exit 1
    fi
    echo "Rolling back to: ${latest}"
    read -r -p "Proceed? [y/N] " confirm
    if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
      echo "Aborted."
      exit 0
    fi
    local tmp
    tmp="$(mktemp -d)"
    tar -xzf "$latest" -C "$tmp"
    eval $RSYNC_CMD "${tmp}/" "${SSH_TARGET}:${NFS_REMOTE_DIR}/"
    rm -rf "$tmp"
    echo "Rolled back. Check https://slackbracket.com"
    ;;

  status)
    echo "Checking endpoints..."
    check_url "https://slackbracket.com" "Prod"
    check_url "https://slackbracket.com/dev" "Stage"
    check_url "${NEXT_PUBLIC_TELEMETRY_URL}" "Telemetry"
    echo ""
    if [[ -d "$BACKUP_DIR" ]]; then
      echo "Backups:"
      ls -lht "${BACKUP_DIR}"/prod-*.tar.gz 2>/dev/null | head -5 || echo "  (none)"
    fi
    ;;

  help|*)
    echo "Usage: ./infra/deploy.sh {stage|promote|rollback|status}"
    echo ""
    echo "  stage    Build with basePath=/dev, deploy to slackbracket.com/dev"
    echo "  promote  Backup prod, build clean, deploy to slackbracket.com"
    echo "  rollback Restore previous prod build"
    echo "  status   Check prod, stage, and telemetry endpoints"
    ;;
esac

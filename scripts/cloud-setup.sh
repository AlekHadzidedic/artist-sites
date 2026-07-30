#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# SessionStart hook — runs at the start of EVERY session, local and cloud,
# after Claude Code launches. Wired up in .claude/settings.json.
#
# Everything below the CLAUDE_CODE_REMOTE guard is cloud-only. On your Windows
# machine this exits immediately and changes nothing.
#
# Why credentials live here and not in the environment's setup script: the setup
# script's filesystem is snapshotted and reused across sessions, so anything it
# writes persists in the cache. Session env vars are guaranteed readable here,
# and this file writes them fresh each session.
#
# Must exit 0.
# ─────────────────────────────────────────────────────────────────────────────
set -u

# `true` only inside an Anthropic-hosted cloud session. Never true locally.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# ── Google service accounts → real files ─────────────────────────────────────
# GA4 (analyticsdata.googleapis.com) and Search Console both need a JSON key
# file, not a string — and they are two DIFFERENT service accounts here:
#   GOOGLE_SA_B64 → pianochords GA4  → $GOOGLE_APPLICATION_CREDENTIALS
#   GSC_SA_B64    → zinc-north GSC   → $GSC_KEY  (what the skill actually reads)
# Both are set in the cloud environment's variables. Missing ones are skipped
# silently, so an environment that only needs one is fine.
materialize_sa() {
  # $1 = base64 payload, $2 = destination filename, $3 = env var to export
  [ -n "$1" ] || return 0
  _p="$HOME/.config/gcloud/$2"
  mkdir -p "$(dirname "$_p")"
  if echo "$1" | base64 -d > "$_p" 2>/dev/null && [ -s "$_p" ]; then
    chmod 600 "$_p"
    # $CLAUDE_ENV_FILE persists env vars for every Bash command Claude runs later.
    if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
      echo "$3=$_p" >> "$CLAUDE_ENV_FILE"
    fi
  else
    rm -f "$_p"
    echo "[cloud-setup] $3 source failed to decode - re-encode with: base64 -w0 key.json" >&2
  fi
}

materialize_sa "${GOOGLE_SA_B64:-}" claude-service-account.json     GOOGLE_APPLICATION_CREDENTIALS
materialize_sa "${GSC_SA_B64:-}"    gsc-service-account.json        GSC_KEY

# ── Project dependencies ─────────────────────────────────────────────────────
# Cheap idempotency check so resumed sessions don't reinstall.
if [ -f package.json ] && [ ! -d node_modules ]; then
  if [ -f pnpm-lock.yaml ]; then
    corepack enable >/dev/null 2>&1 || true
    pnpm install --frozen-lockfile >/dev/null 2>&1 || pnpm install >/dev/null 2>&1 || true
  elif [ -f package-lock.json ]; then
    npm ci >/dev/null 2>&1 || npm install >/dev/null 2>&1 || true
  else
    npm install >/dev/null 2>&1 || true
  fi
fi

if [ -f requirements.txt ]; then
  pip install -q -r requirements.txt >/dev/null 2>&1 || true
fi

# ── Services the base image installs but does not start ──────────────────────
# Uncomment only what this repo actually needs; each one costs startup time.
# service postgresql start >/dev/null 2>&1 || true
# service redis-server start >/dev/null 2>&1 || true

exit 0

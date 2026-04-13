#!/usr/bin/env bash
# build-lambdas.sh — Build and upload Lambda ZIPs for urgdstudios.com
#
# Auto-discovers all Lambda directories under lambdas/ (skips shared/).
# Copies shared/ into each ZIP, installs npm deps, uploads to S3.
# Writes a manifest JSON so the parameter file generator can derive CodeKey values.
#
# Usage:
#   ./scripts/build-lambdas.sh [VERSION]
#
# Required env vars:
#   ARTIFACT_BUCKET — S3 bucket for artifacts
#   APP_NAME        — Application name (e.g., urgdstudios-com)
#
# Uploads to: s3://${ARTIFACT_BUCKET}/${APP_NAME}/artifacts/${VERSION}/{lambda-name}-${VERSION}.zip

set -euo pipefail

# ── Version resolution ────────────────────────────────────────────────────────
if [ -n "${1:-}" ]; then
  VERSION="$1"
elif [ -n "${VERSION:-}" ]; then
  VERSION="$VERSION"
elif git rev-parse --git-dir >/dev/null 2>&1; then
  VERSION=$(git rev-parse --short HEAD)
else
  echo "❌ Cannot determine version: pass as argument, set VERSION env var, or run inside a git repo" >&2
  exit 1
fi

# ── Required env vars ─────────────────────────────────────────────────────────
ARTIFACT_BUCKET="${ARTIFACT_BUCKET:-}"
APP_NAME="${APP_NAME:-}"

if [ -z "$ARTIFACT_BUCKET" ]; then
  echo "❌ ARTIFACT_BUCKET env var is required" >&2
  exit 1
fi
if [ -z "$APP_NAME" ]; then
  echo "❌ APP_NAME env var is required" >&2
  exit 1
fi

AWS_REGION="${AWS_REGION:-us-west-2}"

# ── Paths ─────────────────────────────────────────────────────────────────────
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LAMBDAS_DIR="$REPO_ROOT/lambdas"
SHARED_DIR="$LAMBDAS_DIR/shared"
BUILD_BASE="/tmp/${APP_NAME}-lambda-builds-$$"

if [ ! -d "$SHARED_DIR" ]; then
  echo "❌ shared/ directory not found at $SHARED_DIR" >&2
  exit 1
fi

mkdir -p "$BUILD_BASE"
trap 'rm -rf "$BUILD_BASE"' EXIT

echo "🔨 Building Lambda ZIPs — version: $VERSION"
echo "   App: $APP_NAME"
echo "   Artifact bucket: $ARTIFACT_BUCKET"
echo ""

built=0
MANIFEST_FUNCTIONS=""

for lambda_dir in "$LAMBDAS_DIR"/*/; do
  lambda_name=$(basename "$lambda_dir")

  # Skip the shared utilities directory and __tests__ dirs
  if [ "$lambda_name" = "shared" ]; then
    continue
  fi

  # Must have an index.mjs (Node.js) or main handler to be a Lambda
  if [ ! -f "$lambda_dir/index.mjs" ] && [ ! -f "$lambda_dir/index.py" ]; then
    echo "⚠️  Skipping $lambda_name — no handler file found"
    continue
  fi

  echo "── $lambda_name ──────────────────────────────────────────────────────"

  BUILD_DIR="$BUILD_BASE/$lambda_name"
  mkdir -p "$BUILD_DIR"

  # Copy Lambda source files (exclude tests and dev artifacts)
  cp -r "$lambda_dir"/* "$BUILD_DIR/"
  rm -rf "$BUILD_DIR/__tests__" "$BUILD_DIR/test" "$BUILD_DIR/.DS_Store"

  # Copy shared/ directory into build dir
  rm -rf "$BUILD_DIR/shared"
  cp -r "$SHARED_DIR" "$BUILD_DIR/shared"
  echo "   ✅ Copied shared/ directory"

  # Install npm dependencies if package.json is present
  if [ -f "$BUILD_DIR/package.json" ]; then
    echo "   📦 Installing npm dependencies..."
    (cd "$BUILD_DIR" && npm ci --omit=dev --silent 2>/dev/null || npm install --omit=dev --silent)
    echo "   ✅ Dependencies installed"
  fi

  # Verify shared utilities are present
  if [ ! -f "$BUILD_DIR/shared/utils.mjs" ]; then
    echo "   ❌ FATAL: shared/utils.mjs missing from build directory"
    exit 1
  fi
  if [ ! -f "$BUILD_DIR/shared/healthCheck.mjs" ]; then
    echo "   ❌ FATAL: shared/healthCheck.mjs missing from build directory"
    exit 1
  fi
  echo "   ✅ Shared utilities verified"

  # Create ZIP
  ZIP_FILE="$BUILD_BASE/${lambda_name}-${VERSION}.zip"
  (
    cd "$BUILD_DIR"
    zip -r "$ZIP_FILE" . \
      --exclude "*.git*" \
      --exclude "*.DS_Store*" \
      --exclude "node_modules/.cache/*" \
      --exclude "__pycache__/*" \
      --exclude "*.pyc" \
      --exclude "*.test.*" \
      --exclude "*.spec.*" \
      >/dev/null
  )
  echo "   ✅ Created ZIP: $(basename "$ZIP_FILE") ($(du -h "$ZIP_FILE" | cut -f1))"

  # Upload to S3
  S3_KEY="${APP_NAME}/artifacts/${VERSION}/${lambda_name}-${VERSION}.zip"
  aws s3 cp "$ZIP_FILE" "s3://${ARTIFACT_BUCKET}/${S3_KEY}" \
    --region "$AWS_REGION" \
    --no-progress
  echo "   ✅ Uploaded → s3://${ARTIFACT_BUCKET}/${S3_KEY}"

  # Accumulate function name for manifest
  if [ -n "$MANIFEST_FUNCTIONS" ]; then
    MANIFEST_FUNCTIONS="${MANIFEST_FUNCTIONS},\"${lambda_name}\""
  else
    MANIFEST_FUNCTIONS="\"${lambda_name}\""
  fi

  built=$((built + 1))
  echo ""
done

echo "✅ Build complete — $built Lambda(s) built and uploaded (version: $VERSION)"

if [ $built -eq 0 ]; then
  echo "❌ No Lambda functions found to build — check lambdas/ directory" >&2
  exit 1
fi

# ── Write and upload manifest ─────────────────────────────────────────────────
MANIFEST_FILE="$BUILD_BASE/lambda-manifest.json"
cat > "$MANIFEST_FILE" << MANIFEST_EOF
{
  "version": "${VERSION}",
  "app": "${APP_NAME}",
  "functions": [${MANIFEST_FUNCTIONS}],
  "s3_keys": {
$(
  first=true
  for lambda_dir in "$LAMBDAS_DIR"/*/; do
    lambda_name=$(basename "$lambda_dir")
    [ "$lambda_name" = "shared" ] && continue
    [ ! -f "$lambda_dir/index.mjs" ] && [ ! -f "$lambda_dir/index.py" ] && continue
    if [ "$first" = true ]; then
      first=false
    else
      echo ","
    fi
    printf '    "%s": "%s/artifacts/%s/%s-%s.zip"' \
      "$lambda_name" "$APP_NAME" "$VERSION" "$lambda_name" "$VERSION"
  done
  echo ""
)
  }
}
MANIFEST_EOF

MANIFEST_S3_KEY="${APP_NAME}/artifacts/${VERSION}/lambda-manifest.json"
aws s3 cp "$MANIFEST_FILE" \
  "s3://${ARTIFACT_BUCKET}/${MANIFEST_S3_KEY}" \
  --region "$AWS_REGION" \
  --no-progress
echo "✅ Manifest uploaded → s3://${ARTIFACT_BUCKET}/${MANIFEST_S3_KEY}"
echo ""
echo "📋 Manifest contents:"
cat "$MANIFEST_FILE"

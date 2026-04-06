#!/usr/bin/env bash
# ============================================================
# NovelEra — Build and Install Script
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ── Colors ───────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

info()    { echo -e "${CYAN}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[OK]${NC} $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }

# ── Defaults ─────────────────────────────────────────────────
VARIANT="debug"
BUILD_ONLY=false
UNINSTALL_FIRST=false
ONLY_FIRST=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        debug|release)
            VARIANT="$1"
            ;;
        --uninstall-first)
            UNINSTALL_FIRST=true
            ;;
        *)
            error "Unknown argument '$1'. Use: [debug|release] [--uninstall-first]"
            ;;
    esac
    shift
done

VARIANT_CAP="${VARIANT^}"

APP_NAME="NovelEra"
PACKAGE="com.jica98.novelera"
ACTIVITY=".MainActivity"

GRADLE_TASK="assemble${VARIANT_CAP}"
ARTIFACT_DIR="android/app/build/outputs/apk/${VARIANT}"
ARTIFACT_EXT="apk"

# ── Step 1: Build ────────────────────────────────────────────
info "Building ${APP_NAME} ${ARTIFACT_EXT^^} variant: ${VARIANT_CAP}"
cd android && ./gradlew "$GRADLE_TASK" --quiet && cd ..

# Locate artifact
ARTIFACT_PATH=$(find "$ARTIFACT_DIR" -maxdepth 1 -type f -name "*.apk" ! -name "*-unsigned.apk" | sort | head -1)

if [[ -z "$ARTIFACT_PATH" ]]; then
    error "${ARTIFACT_EXT^^} not found in $ARTIFACT_DIR"
fi

success "Build complete → ${ARTIFACT_PATH}"

# ── Step 2: Install ──────────────────────────────────────────
DEVICE_LIST=$(adb devices | awk 'NR > 1 && $2 == "device" { print $1 }')
if [[ -z "$DEVICE_LIST" ]]; then
    error "No Android device connected"
fi

for DEVICE in $DEVICE_LIST; do
    info "Installing on device: $DEVICE…"
    
    if $UNINSTALL_FIRST; then
        adb -s "$DEVICE" uninstall "$PACKAGE" >/dev/null 2>&1 || true
    fi

    adb -s "$DEVICE" install -r "$ARTIFACT_PATH"
    
    info "Launching ${PACKAGE}${ACTIVITY} on $DEVICE…"
    adb -s "$DEVICE" shell am start -n "${PACKAGE}/${PACKAGE}${ACTIVITY}" && success "App launched!"
done

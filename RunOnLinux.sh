#!/usr/bin/env bash
set -euo pipefail

echo
echo "[1/5] checking for node.js..."

if ! command -v node >/dev/null 2>&1; then
    echo "error: node.js is not installed or not in PATH."
    echo "please install node.js >= 22 from https://nodejs.org/en/download"
    read -r -p "press [enter] to exit..."
    exit 1
fi

NODE_VERSION=$(node -e "process.stdout.write(process.version)")
echo "found node.js $NODE_VERSION"

echo "node.js version good."
echo

echo "[2/5] Checking for pnpm..."
if ! command -v pnpm >/dev/null 2>&1; then
    echo "      pnpm not found. Installing pnpm globally..."
    if ! npm install -g pnpm; then
        echo "error: failed to install pnpm. please install it manually."
        read -r -p "press [enter] to exit..."
        exit 1
    fi
    echo "      pnpm installed successfully."
else
    echo "      pnpm is already installed."
fi
echo

echo "[3/5] Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "      node_modules not found. Installing dependencies..."
    echo "      this may take a few minutes on first run."
    if ! pnpm install --frozen-lockfile; then
        echo "error: failed to install dependencies."
        read -r -p "press [enter] to exit..."
        exit 1
    fi
    echo "      dependencies installed successfully."
else
    echo "      dependencies already installed."
fi
echo

echo "[4/5] building web extensions of doiksub..."
if ! pnpm buildWeb; then
    echo "error: build failed."
    read -r -p "press [enter] to exit..."
    exit 1
fi

echo "[5/5] building and injecting doiksub..."
if ! pnpm build; then
    echo "error: build failed."
    read -r -p "press [enter] to exit..."
    exit 1
fi

if ! node scripts/runInstaller.mjs -- --install; then
    echo
    echo "error: installation failed."
    read -r -p "press [enter] to exit..."
    exit 1
fi

echo
echo "start whatever discord you patched now"
echo "cya"

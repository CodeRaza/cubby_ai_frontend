#!/bin/bash

echo "🧹 Clearing all Vite cache and build files..."

cd "$(dirname "$0")"

# Clear Vite cache directories
rm -rf node_modules/.vite
rm -rf .vite
rm -rf dist

# Clear any lock files that might be causing issues
# Don't remove package-lock.json or yarn.lock, just clear build artifacts

echo "✅ Cache cleared!"
echo ""
echo "Now restart your dev server with: npm run dev"


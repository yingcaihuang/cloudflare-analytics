#!/bin/bash

echo "Stopping any running Metro bundler..."
lsof -ti:8081 | xargs kill -9 2>/dev/null || true

echo "Clearing Metro bundler cache..."
rm -rf node_modules/.cache

echo "Clearing watchman cache..."
watchman watch-del-all 2>/dev/null || true

echo "Clearing temp files..."
rm -rf /tmp/metro-* /tmp/haste-* 2>/dev/null || true

echo "Cache cleared! Now run: npm start"

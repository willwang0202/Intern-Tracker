#!/bin/bash
# Development launcher — runs the app directly from source (no build needed).
# For a packaged release, see: pyinstaller tracker.spec

cd "$(dirname "$0")"

# Ensure runtime dependency is installed
pip3 install -r requirements.txt --quiet 2>/dev/null

python3 main.py

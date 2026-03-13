#!/bin/bash
# Build the Internship Tracker .app bundle (macOS only, uses py2app).
# Output: dist/Internship Tracker.app

cd "$(dirname "$0")"

if [[ "$(uname)" != "Darwin" ]]; then
    echo "py2app is for macOS only. On Windows, consider py2exe or PyInstaller."
    exit 1
fi

echo "Installing build dependencies..."
pip3 install -r requirements.txt py2app --quiet

echo "Building app (this may take a minute)..."
python3 setup.py py2app

if [[ $? -eq 0 ]]; then
    echo ""
    echo "Done. App location:"
    echo "  $(pwd)/dist/Internship Tracker.app"
    open "dist"
else
    echo "Build failed."
    exit 1
fi

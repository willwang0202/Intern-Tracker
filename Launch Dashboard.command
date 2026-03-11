#!/bin/bash

cd "$(dirname "$0")"

# Install pywebview if not already installed
pip3 install pywebview --quiet 2>/dev/null

python3 app.py

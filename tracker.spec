# -*- mode: python ; coding: utf-8 -*-
# PyInstaller spec for Internship Tracker
# Run:  pyinstaller tracker.spec

import sys
from PyInstaller.utils.hooks import collect_all

# Collect everything pywebview ships (platform backends, JS bridges, etc.)
wv_datas, wv_binaries, wv_hiddenimports = collect_all("webview")

a = Analysis(
    ["main.py"],
    pathex=["."],
    binaries=wv_binaries,
    datas=[
        # ── Static web assets bundled into the executable ──────────────────
        ("dashboard.html",    "."),
        ("dashboard.js",      "."),
        ("styles.css",        "."),
        ("papaparse.min.js",  "."),
        # ── pywebview runtime resources ────────────────────────────────────
        *wv_datas,
    ],
    hiddenimports=[
        *wv_hiddenimports,
        # Platform-specific pywebview backends
        "webview.platforms.cocoa",        # macOS
        "webview.platforms.edgechromium", # Windows 10/11 (Edge WebView2)
        "webview.platforms.winforms",     # Windows legacy fallback
        "webview.platforms.gtk",          # Linux
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        # Trim heavy stdlib / test modules we don't need
        "tkinter",
        "unittest",
        "email",
        "html",
        "http",
        "xmlrpc",
    ],
    noarchive=False,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="Internship Tracker",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,   # windowed — no terminal window
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    name="Internship Tracker",
)

# ── macOS .app bundle (ignored on Windows / Linux) ────────────────────────────
if sys.platform == "darwin":
    app = BUNDLE(
        coll,
        name="Internship Tracker.app",
        bundle_identifier="com.internship.tracker",
        info_plist={
            "CFBundleName":            "Internship Tracker",
            "CFBundleDisplayName":     "Internship Tracker",
            "CFBundleVersion":         "1.0.0",
            "CFBundleShortVersionString": "1.0.0",
            "NSHighResolutionCapable": True,
            # Allow WKWebView to load local file:// resources
            "NSAppTransportSecurity": {
                "NSAllowsLocalNetworking": True,
            },
        },
    )

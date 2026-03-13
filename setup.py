"""
py2app build script for Internship Tracker.

Usage (macOS):
    python setup.py py2app

Output: dist/Internship Tracker.app
"""
from setuptools import setup

APP = ["main.py"]
DATA_FILES = [
    "dashboard.html",
    "dashboard.js",
    "styles.css",
    "papaparse.min.js",
]
OPTIONS = {
    "py2app": {
        "resources": DATA_FILES,
        "packages": ["webview"],
        "plist": {
            "CFBundleName": "Internship Tracker",
            "CFBundleDisplayName": "Internship Tracker",
            "CFBundleVersion": "1.0.0",
            "CFBundleShortVersionString": "1.0.0",
            "NSHighResolutionCapable": True,
            "NSAppTransportSecurity": {
                "NSAllowsLocalNetworking": True,
            },
        },
    }
}

setup(
    name="Internship Tracker",
    app=APP,
    setup_requires=["py2app", "pywebview"],
    options=dict(py2app=OPTIONS["py2app"]),
)

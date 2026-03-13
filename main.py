"""Internship Tracker — single entry point.

Usage
-----
Development:
    python main.py

Package (macOS):
    python setup.py py2app
"""

import os
import sys


def resource_path(relative: str) -> str:
    """Return the absolute path to a bundled resource.

    In development:  resolves relative to this file's directory.
    py2app:         resolves from bundle Contents/Resources (RESOURCEPATH or executable-relative).
    """
    if getattr(sys, "frozen", False):
        if hasattr(sys, "_MEIPASS"):
            base = sys._MEIPASS
        else:
            base = os.environ.get(
                "RESOURCEPATH",
                os.path.abspath(os.path.join(os.path.dirname(sys.executable), "..", "Resources")),
            )
    else:
        base = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base, relative)


def main() -> None:
    import webview
    from app import Api

    api = Api()
    webview.create_window(
        "Internship Tracker",
        resource_path("dashboard.html"),
        js_api=api,
        width=1400,
        height=900,
        min_size=(800, 600),
    )
    webview.start()


if __name__ == "__main__":
    main()

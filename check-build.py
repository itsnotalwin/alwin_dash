#!/usr/bin/env python3
"""Read-only project folder check. Python 3, standard library only.

Usage: python check-build.py --root /path/to/project [--json]
0: complete; 1: requirements missing; 2: invalid root.
The check validates file presence/PNG header, not screenshot accuracy or UI quality.
"""
from __future__ import annotations
import argparse
import json
import os
from pathlib import Path
import sys

SKIP = {
    ".git", ".hg", ".svn", "node_modules", "vendor", "dist", "build",
    "coverage", ".next", ".nuxt", ".svelte-kit", ".astro", ".cache",
    ".turbo", ".venv", "venv", "__pycache__", "target", "out",
    ".idea", ".vscode", ".pytest_cache", ".mypy_cache",
}
VISUAL_DIRS = {
    "css", "styles", "style", "ui", "components", "pages", "screens",
    "views", "layouts", "layout", "theme", "themes", "frontend", "design",
}
VISUAL_EXT = {
    ".css", ".scss", ".sass", ".less", ".tsx", ".jsx", ".vue",
    ".svelte", ".astro", ".html", ".htm",
}
PNG = b"\x89PNG\r\n\x1a\n"

def audit(root: Path) -> dict:
    errors: list[dict[str, str]] = []
    checked = 0
    visual_checked = 0

    def issue(folder: Path, why: str) -> None:
        label = "." if folder == root else folder.relative_to(root).as_posix()
        errors.append({"folder": label, "issue": why})

    def note(folder: Path, name: str) -> None:
        file = folder / name
        if not file.is_file():
            issue(folder, f"missing {name}")
        elif len(file.read_text(encoding="utf-8-sig").strip()) < 60:
            issue(folder, f"{name} is too short to explain its purpose")

    note(root, "AGENTS.md")
    note(root, "PROJECT.md")
    for base, dirs, files in os.walk(root, followlinks=False):
        directory = Path(base)
        dirs[:] = sorted(d for d in dirs if d not in SKIP and not (directory / d).is_symlink())
        if directory != root:
            checked += 1
            note(directory, "CONTEXT.md")

        authored_files = [f for f in files if f not in {
            "CONTEXT.md", "DESIGN.md", "SCREENSHOT.png", "SCREENSHOT-MOBILE.png"
        }]
        visual = (directory.name.lower() in VISUAL_DIRS
                  or any(Path(f).suffix.lower() in VISUAL_EXT for f in authored_files))
        if not visual:
            continue
        visual_checked += 1
        note(directory, "DESIGN.md")
        screenshot = directory / "SCREENSHOT.png"
        if not screenshot.is_file():
            issue(directory, "missing real rendered SCREENSHOT.png")
        else:
            with screenshot.open("rb") as image:
                signature = image.read(8)
            if signature != PNG:
                issue(directory, "SCREENSHOT.png does not have a valid PNG header")
        design = directory / "DESIGN.md"
        if design.is_file():
            content = design.read_text(encoding="utf-8-sig").lower()
            if "screenshot.png" not in content:
                issue(directory, "DESIGN.md must identify SCREENSHOT.png")
            if "viewport" not in content or "captur" not in content:
                issue(directory, "DESIGN.md must state viewport and capture date")

    return {"root": str(root), "folders_checked": checked,
            "visual_folders": visual_checked, "issues": errors,
            "status": "pass" if not errors else "fail"}

def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--root", type=Path, required=True)
    p.add_argument("--json", action="store_true")
    args = p.parse_args()
    root = args.root.expanduser().resolve()
    if not root.is_dir():
        print(f"Project folder does not exist: {root}", file=sys.stderr)
        return 2
    result = audit(root)
    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print(f"Build audit: {result['status']} — {root}")
        print(f"Checked {result['folders_checked']} source folders; {result['visual_folders']} visual folders.")
        for x in result["issues"]:
            print(f"  {x['folder']}: {x['issue']}")
    return 1 if result["issues"] else 0

if __name__ == "__main__":
    sys.exit(main())

import csv
import json
import os
import sys
import webview

# ── Path helpers ───────────────────────────────────────────────────────────────

# Source-code root (never sys._MEIPASS — that is a temp dir that vanishes on exit)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def _read_version() -> str:
    """Return the app version string from VERSION file."""
    try:
        with open(os.path.join(BASE_DIR, "VERSION"), "r", encoding="utf-8") as f:
            return f.read().strip()
    except Exception:
        return "0.1.0"


APP_VERSION = _read_version()

def _config_file_path() -> str:
    """Persistent config path that survives PyInstaller bundle restarts.

    Packaged app  → ~/.tracker_config.json  (home dir, always writable)
    Development   → <project>/.tracker_config.json  (next to source)
    """
    if getattr(sys, "frozen", False):
        return os.path.join(os.path.expanduser("~"), ".tracker_config.json")
    return os.path.join(BASE_DIR, ".tracker_config.json")

CONFIG_FILE = _config_file_path()

# Header row matching the existing CSV column structure
CSV_HEADER = ['', 'Company', 'Company Type', '', 'Action Description',
              'Application Date', 'Position', 'Link', 'Login Method', '', '']

# Legacy filenames → new short names (auto-migrated on startup)
LEGACY_RENAMES = {
    'US-Internship Applications Log.csv': 'US.csv',
    'Taiwan-Internship Applications Log.csv': 'Taiwan.csv',
}


class Api:
    def __init__(self):
        self.version = APP_VERSION
        self.csv_dir = self._detect_csv_dir()
        if self.csv_dir:
            self._migrate_legacy_files()

    # ── Metadata ────────────────────────────────────────────────────────────────

    def get_version(self):
        """Expose app version to the frontend (dashboard.js)."""
        return self.version

    # ── Directory / config helpers ─────────────────────────────────────────────

    def _detect_csv_dir(self):
        """Return csv_dir if found via config or default location, else None."""
        # 1. Try saved config
        if os.path.exists(CONFIG_FILE):
            try:
                with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                    cfg = json.load(f)
                d = cfg.get('csv_dir', '')
                if d and os.path.isdir(d):
                    return d
            except Exception:
                pass

        # 2. Fall back to default csv/ subfolder if it contains any CSV file
        default = os.path.join(BASE_DIR, 'csv')
        if os.path.isdir(default) and any(
            f.endswith('.csv') for f in os.listdir(default)
        ):
            self._save_config(default)
            return default

        return None  # needs setup

    def _save_config(self, csv_dir):
        try:
            with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
                json.dump({'csv_dir': csv_dir}, f)
        except Exception:
            pass

    def _migrate_legacy_files(self):
        """Rename legacy long-named CSVs to short '{Region}.csv' format."""
        for old_name, new_name in LEGACY_RENAMES.items():
            old_path = os.path.join(self.csv_dir, old_name)
            new_path = os.path.join(self.csv_dir, new_name)
            if os.path.exists(old_path) and not os.path.exists(new_path):
                try:
                    os.rename(old_path, new_path)
                except Exception:
                    pass

    def _filepath(self, region):
        if not self.csv_dir:
            raise RuntimeError("CSV directory not configured. Please complete setup.")
        return os.path.join(self.csv_dir, f"{region}.csv")

    # ── Setup ──────────────────────────────────────────────────────────────────

    def get_setup_status(self):
        """Returns which setup step is needed, if any."""
        if not self.csv_dir:
            return {'needs_folder': True, 'needs_region': False}
        if not self.get_regions():
            return {'needs_folder': False, 'needs_region': True}
        return {'needs_folder': False, 'needs_region': False}

    def pick_csv_folder(self):
        """Open a native folder picker and save the chosen path to config."""
        try:
            result = webview.windows[0].create_file_dialog(
                webview.FOLDER_DIALOG,
                directory=os.path.expanduser('~')
            )
            if not result:
                return {'success': False, 'cancelled': True}

            chosen = result[0]
            self.csv_dir = chosen
            self._save_config(chosen)
            return {'success': True, 'path': chosen}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    # ── Region management ──────────────────────────────────────────────────────

    def get_regions(self):
        """Return sorted list of region names (CSV stems) in csv_dir."""
        if not self.csv_dir or not os.path.isdir(self.csv_dir):
            return []
        try:
            return sorted(
                os.path.splitext(f)[0]
                for f in os.listdir(self.csv_dir)
                if f.endswith('.csv')
            )
        except Exception:
            return []

    def create_region(self, name):
        """Create a new '{name}.csv' with a standard header."""
        name = name.strip()
        if not name:
            return {'success': False, 'error': 'Region name cannot be empty'}
        if not self.csv_dir:
            return {'success': False, 'error': 'CSV directory not configured'}
        # Reject names with path separators or dots
        if any(c in name for c in ('/', '\\', '.', '\0')):
            return {'success': False, 'error': 'Invalid characters in region name'}
        try:
            fpath = self._filepath(name)
            if os.path.exists(fpath):
                return {'success': False, 'error': f'"{name}" already exists'}
            with open(fpath, 'w', encoding='utf-8', newline='') as f:
                csv.writer(f).writerow(CSV_HEADER)
            return {'success': True}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    # ── CSV read/write ─────────────────────────────────────────────────────────

    def read_csv(self, region):
        filepath = self._filepath(region)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception:
            return ''

    def update_status(self, region, company, position, new_status):
        filepath = self._filepath(region)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                lines = list(csv.reader(f))

            pos_col = None
            for row in lines:
                if 'Position' in row:
                    pos_col = row.index('Position')
                    break

            updated = False
            for row in lines:
                if len(row) > 1 and row[1].strip() == company:
                    if pos_col and len(row) > pos_col and position:
                        if row[pos_col].strip() != position.strip():
                            continue
                    while len(row) <= 3:
                        row.append('')
                    row[3] = new_status
                    updated = True
                    break

            if updated:
                with open(filepath, 'w', encoding='utf-8', newline='') as f:
                    csv.writer(f).writerows(lines)
                return {'success': True}
            else:
                return {'success': False, 'error': 'Company not found'}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def add_entry(self, region, company, company_type, status, position, apply_date, link):
        filepath = self._filepath(region)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                lines = list(csv.reader(f))

            header = next((r for r in lines if 'Position' in r), None)

            if header:
                new_row = [''] * len(header)
                new_row[1] = company
                new_row[2] = company_type
                new_row[3] = status
                for col, val in [('Position', position), ('Application Date', apply_date), ('Link', link)]:
                    if col in header:
                        new_row[header.index(col)] = val
            else:
                new_row = ['', company, company_type, status, apply_date, position, link, '']

            lines.append(new_row)

            with open(filepath, 'w', encoding='utf-8', newline='') as f:
                csv.writer(f).writerows(lines)
            return {'success': True}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def import_entries(self, region, entries):
        """Batch-import entries from Simplify CSV. Skips duplicates by (company, position) key."""
        filepath = self._filepath(region)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                lines = list(csv.reader(f))

            header = next((r for r in lines if 'Position' in r), None)
            pos_col = header.index('Position') if header and 'Position' in header else None

            existing = set()
            for row in lines:
                if len(row) > 1 and row[1].strip():
                    company_key = row[1].strip().lower()
                    pos_key = row[pos_col].strip().lower() if pos_col and len(row) > pos_col else ''
                    existing.add((company_key, pos_key))

            imported = 0
            skipped = 0

            for entry in entries:
                company = entry.get('company', '').strip()
                position = entry.get('position', '').strip()
                if not company:
                    skipped += 1
                    continue

                key = (company.lower(), position.lower())
                if key in existing:
                    skipped += 1
                    continue

                company_type = entry.get('company_type', 'Other')
                status = entry.get('status', '🔘 Not Yet')
                apply_date = entry.get('apply_date', '')
                link = entry.get('link', '')

                if header:
                    new_row = [''] * len(header)
                    new_row[1] = company
                    new_row[2] = company_type
                    new_row[3] = status
                    for col, val in [('Position', position), ('Application Date', apply_date), ('Link', link)]:
                        if col in header:
                            new_row[header.index(col)] = val
                else:
                    new_row = ['', company, company_type, status, apply_date, position, link, '']

                lines.append(new_row)
                existing.add(key)
                imported += 1

            with open(filepath, 'w', encoding='utf-8', newline='') as f:
                csv.writer(f).writerows(lines)

            return {'success': True, 'imported': imported, 'skipped': skipped}
        except Exception as e:
            return {'success': False, 'error': str(e), 'imported': 0, 'skipped': 0}

    def delete_entry(self, region, company, position):
        filepath = self._filepath(region)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                lines = list(csv.reader(f))

            pos_col = None
            for row in lines:
                if 'Position' in row:
                    pos_col = row.index('Position')
                    break

            new_lines = []
            deleted = False
            for row in lines:
                if not deleted and len(row) > 1 and row[1].strip() == company:
                    if pos_col and len(row) > pos_col and position:
                        if row[pos_col].strip() == position.strip():
                            deleted = True
                            continue
                    elif not position:
                        deleted = True
                        continue
                new_lines.append(row)

            if deleted:
                with open(filepath, 'w', encoding='utf-8', newline='') as f:
                    csv.writer(f).writerows(new_lines)
                return {'success': True}
            else:
                return {'success': False, 'error': 'Entry not found'}
        except Exception as e:
            return {'success': False, 'error': str(e)}


# Entry point lives in main.py — run `python main.py` or `pyinstaller tracker.spec`

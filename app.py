import webview
import csv
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

FILES = {
    'US':     os.path.join('csv', 'US-Internship Applications Log.csv'),
    'Taiwan': os.path.join('csv', 'Taiwan-Internship Applications Log.csv'),
}

class Api:
    def _filepath(self, region):
        if region not in FILES:
            raise ValueError(f"Invalid region: {region}")
        return os.path.join(BASE_DIR, FILES[region])

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

            # Find the Position column index from the header row
            pos_col = None
            for row in lines:
                if 'Position' in row:
                    pos_col = row.index('Position')
                    break

            updated = False
            for row in lines:
                if len(row) > 1 and row[1].strip() == company:
                    # If we know the position column, also match on position
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

            # Find header row to match column structure
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
        """Batch-import entries from Simplify CSV. Skips duplicates by (company, position) key.
        entries: list of dicts with keys: company, company_type, status, position, apply_date, link
        Returns: {success, imported, skipped} or {success: False, error}
        """
        filepath = self._filepath(region)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                lines = list(csv.reader(f))

            header = next((r for r in lines if 'Position' in r), None)
            pos_col = header.index('Position') if header and 'Position' in header else None

            # Build existing set of (company_lower, position_lower) for duplicate detection
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


if __name__ == '__main__':
    api = Api()
    window = webview.create_window(
        'Internship Tracker',
        os.path.join(BASE_DIR, 'dashboard.html'),
        js_api=api,
        width=1400,
        height=900,
        min_size=(800, 600)
    )
    webview.start()

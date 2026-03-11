# Intern Tracker 🗂️

A lightweight desktop dashboard for tracking internship applications across the US and Taiwan. Built with Python + pywebview, powered by a local CSV backend.

![Python](https://img.shields.io/badge/Python-3.8+-blue?logo=python&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Features

- **Dual-region tracking** — separate views for US and Taiwan applications
- **EN / 中 language toggle** — full Traditional Chinese and English UI support
- **Live status updates** — change application status inline; changes write back to CSV instantly
- **Add & delete entries** — modal form with autocomplete for company names
- **Search & filter** — filter by keyword, industry, and status simultaneously
- **Stats dashboard** — at-a-glance counts for Applied, Waiting, Rejected, and Not Offered
- **"Today" button** — one-click date fill when logging a new application

---

## Project Structure

```
Intern-Tracker/
├── app.py                  # Main entry point (pywebview desktop app)
├── server.py               # Optional HTTP server for browser-based use
├── update_csv.py           # Utility to back-fill missing statuses in CSVs
├── dashboard.html          # Dashboard UI
├── dashboard.js            # All frontend logic + i18n system
├── styles.css              # Styles
├── papaparse.min.js        # CSV parsing library
├── Launch Dashboard.command  # macOS double-click launcher
└── csv/                    # Data directory (gitignored)
    ├── US-Internship Applications Log.csv
    └── Taiwan-Internship Applications Log.csv
```

---

## Getting Started

### Prerequisites

- Python 3.8+
- [`pywebview`](https://pywebview.flowrl.com/)

```bash
pip install pywebview
```

### Running the App

```bash
python app.py
```

Or on macOS, double-click `Launch Dashboard.command`.

### CSV Format

Each CSV should have the following columns:

| Column | Description |
|---|---|
| *(col 1)* | Unused / row index |
| `Company` | Company name |
| `Company Type` | Industry category |
| *(col 4)* | Status (emoji string) |
| `Position` | Role title |
| `Application Date` | e.g. `03/11/25` |
| `Link` | Job posting URL |

Status values: `✅ Applied` · `🟡 Awaiting Action` · `🔘 Not Yet` · `❌ Rejected` · `🈚️ Not Offered`

---

## Language Support

Click the **EN / 中** toggle in the top-right of the header to switch between English and Traditional Chinese. All UI text — headers, labels, placeholders, status options, and confirm dialogs — updates instantly without a page reload.

---

## Notes

- CSV files and resumes are gitignored to protect personal data.
- `server.py` is an alternative lightweight HTTP server for browser testing without pywebview.
- Run `update_csv.py` to back-fill any rows missing a status value with `🔘 Not Yet`.

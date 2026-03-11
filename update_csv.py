import csv
import os

def process(filename):
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            lines = list(reader)
        
        for i, row in enumerate(lines):
            # Header is line 0. Or simply check if row[1] has a valid company name
            if len(row) > 1 and row[1].strip() and row[1].strip() not in ('Company', '(blank)'):
                if len(row) > 3:
                    status = row[3].strip()
                    if not status:
                        row[3] = '🔘 Not Yet'
                else:
                    while len(row) <= 3:
                        row.append('')
                    row[3] = '🔘 Not Yet'
                    
        with open(filename, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            writer.writerows(lines)
        print(f"Updated {filename}")
    except Exception as e:
        print(f"Skipping {filename} due to error: {e}")

process(os.path.join('csv', 'US-Internship Applications Log.csv'))
process(os.path.join('csv', 'Taiwan-Internship Applications Log.csv'))

import http.server
import socketserver
import json
import csv
import urllib.parse
import os
import sys

PORT = 8045

class UpdateHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/update_status':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length).decode('utf-8')
            try:
                data = json.loads(post_data)
                region = data.get('region')
                company = data.get('company')
                new_status = data.get('status')
                
                filename = os.path.join('csv', 'US-Internship Applications Log.csv') if region == 'US' else os.path.join('csv', 'Taiwan-Internship Applications Log.csv')
                
                if not os.path.exists(filename):
                    self.send_error(404, 'File not found')
                    return

                with open(filename, 'r', encoding='utf-8') as f:
                    reader = csv.reader(f)
                    lines = list(reader)
                
                updated = False
                for i, row in enumerate(lines):
                    if len(row) > 1 and row[1].strip() == company:
                        while len(row) <= 3:
                            row.append('')
                        row[3] = new_status
                        updated = True
                        break
                
                if updated:
                    with open(filename, 'w', encoding='utf-8', newline='') as f:
                        writer = csv.writer(f)
                        writer.writerows(lines)
                    
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'success': True}).encode('utf-8'))
                else:
                    self.send_error(404, 'Company not found')
                    
            except Exception as e:
                self.send_error(500, str(e))
        else:
            self.send_error(404)
            
    # Add CORS headers if needed, though we are on same origin here
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

# To allow address reuse
socketserver.TCPServer.allow_reuse_address = True

with socketserver.TCPServer(("", PORT), UpdateHandler) as httpd:
    print(f"Serving at port {PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        sys.exit(0)

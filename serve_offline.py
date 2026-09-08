#!/usr/bin/env python3
"""
Fayzar Computer Standalone Offline Server
Zero external dependencies (uses standard library only).
Replicates all static file serving and /api/* endpoints from serve-v2.js.
"""

import os
import sys
import json
import datetime
import webbrowser
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import urllib.parse

PORT = 3000
PUBLIC_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(PUBLIC_DIR, 'data')

os.makedirs(DATA_DIR, exist_ok=True)

MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ttf': 'font/ttf',
    '.pdf': 'application/pdf',
    '.exe': 'application/octet-stream',
    '.zip': 'application/zip'
}

def safe_read_json(file_path, default_val=None):
    if default_val is None:
        default_val = []
    if not os.path.exists(file_path):
        return default_val
    try:
        with open(file_path, 'r', encoding='utf-8-sig') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return default_val

def safe_write_json(file_path, data):
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def sync_results_data_js():
    try:
        cfg = safe_read_json(os.path.join(DATA_DIR, 'results_config.json'), {})
        data = safe_read_json(os.path.join(DATA_DIR, 'results_data.json'), [])
        js_file_path = os.path.join(PUBLIC_DIR, 'js', 'results-data.js')
        content = f"window.DEFAULT_RESULTS_CONFIG = {json.dumps(cfg, ensure_ascii=False, indent=2)};\n\nwindow.DEFAULT_RESULTS_DATA = {json.dumps(data, ensure_ascii=False, indent=2)};\n"
        with open(js_file_path, 'w', encoding='utf-8') as jf:
            jf.write(content)
    except Exception as e:
        print(f"Sync js/results-data.js warning: {e}")

class FayzarOfflineHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PUBLIC_DIR, **kwargs)

    def address_string(self):
        # Avoid reverse DNS lookup delay on localhost / Windows
        return self.client_address[0]

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def send_json_response(self, status_code, data):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_json_body(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            raw_body = self.rfile.read(content_length).decode('utf-8-sig')
            return json.loads(raw_body) if raw_body else {}
        except Exception as e:
            print(f"Error parsing body: {e}")
            return {}

    def guess_type(self, path):
        ext = os.path.splitext(path)[1].lower()
        return MIME_TYPES.get(ext, 'application/octet-stream')

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        req_path = parsed.path

        if req_path.startswith('/api/'):
            if req_path == '/api/feedbacks':
                feedbacks = safe_read_json(os.path.join(DATA_DIR, 'feedbacks.json'), [])
                return self.send_json_response(200, feedbacks)

            if req_path == '/api/config':
                cfg = safe_read_json(os.path.join(DATA_DIR, 'site_config.json'), {})
                return self.send_json_response(200, cfg)

            if req_path == '/api/dictionary':
                dict_data = safe_read_json(os.path.join(DATA_DIR, 'converter_dict.json'), [])
                return self.send_json_response(200, dict_data)

            if req_path == '/api/candidates':
                candidates = safe_read_json(os.path.join(DATA_DIR, 'candidates.json'), [])
                return self.send_json_response(200, candidates)

            if req_path == '/api/results/config':
                res_cfg = safe_read_json(os.path.join(DATA_DIR, 'results_config.json'), {})
                return self.send_json_response(200, res_cfg)

            if req_path == '/api/results/data':
                res_data = safe_read_json(os.path.join(DATA_DIR, 'results_data.json'), [])
                return self.send_json_response(200, res_data)

            if req_path == '/api/export-backup':
                backup = {
                    'version': '2.0-offline',
                    'timestamp': datetime.datetime.now().isoformat(),
                    'notices': safe_read_json(os.path.join(DATA_DIR, 'notices.json'), []),
                    'services': safe_read_json(os.path.join(DATA_DIR, 'services.json'), []),
                    'config': safe_read_json(os.path.join(DATA_DIR, 'site_config.json'), {}),
                    'feedbacks': safe_read_json(os.path.join(DATA_DIR, 'feedbacks.json'), []),
                    'dictionary': safe_read_json(os.path.join(DATA_DIR, 'converter_dict.json'), []),
                    'results_config': safe_read_json(os.path.join(DATA_DIR, 'results_config.json'), {}),
                    'results_data': safe_read_json(os.path.join(DATA_DIR, 'results_data.json'), [])
                }
                return self.send_json_response(200, backup)

            return self.send_json_response(404, {'error': 'API endpoint not found'})

        # Static files
        if req_path == '/' or req_path == '':
            self.path = '/index.html'
        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        req_path = parsed.path

        if req_path.startswith('/api/'):
            payload = self.read_json_body()

            if req_path in ('/api/results/save-config', '/api/save-results-config'):
                safe_write_json(os.path.join(DATA_DIR, 'results_config.json'), payload)
                sync_results_data_js()
                return self.send_json_response(200, {'success': True, 'message': 'Results configuration saved successfully'})

            if req_path in ('/api/results/save-data', '/api/save-results-data'):
                safe_write_json(os.path.join(DATA_DIR, 'results_data.json'), payload)
                try:
                    safe_write_json(os.path.join(DATA_DIR, 'results_data_backup.json'), payload)
                except Exception:
                    pass
                sync_results_data_js()
                return self.send_json_response(200, {'success': True, 'message': 'Results data saved successfully', 'count': len(payload) if isinstance(payload, list) else 0})

            if req_path == '/api/save-notices':
                safe_write_json(os.path.join(DATA_DIR, 'notices.json'), payload)
                return self.send_json_response(200, {'success': True, 'message': 'Notices saved successfully', 'count': len(payload)})

            if req_path == '/api/save-services':
                safe_write_json(os.path.join(DATA_DIR, 'services.json'), payload)
                return self.send_json_response(200, {'success': True, 'message': 'Services saved successfully', 'count': len(payload)})

            if req_path == '/api/save-config':
                safe_write_json(os.path.join(DATA_DIR, 'site_config.json'), payload)
                return self.send_json_response(200, {'success': True, 'message': 'Site configuration saved successfully'})

            if req_path == '/api/save-feedbacks':
                safe_write_json(os.path.join(DATA_DIR, 'feedbacks.json'), payload)
                return self.send_json_response(200, {'success': True, 'message': 'Feedbacks updated successfully', 'count': len(payload)})

            if req_path == '/api/save-dictionary':
                safe_write_json(os.path.join(DATA_DIR, 'converter_dict.json'), payload)
                return self.send_json_response(200, {'success': True, 'message': 'Converter dictionary saved successfully', 'count': len(payload)})

            if req_path in ('/api/save-candidates', '/api/candidates'):
                list_to_save = payload if isinstance(payload, list) else payload.get('profiles', [])
                safe_write_json(os.path.join(DATA_DIR, 'candidates.json'), list_to_save)
                return self.send_json_response(200, {'success': True, 'message': 'Candidates saved successfully', 'count': len(list_to_save)})

            if req_path == '/api/submit-feedback':
                feedbacks = safe_read_json(os.path.join(DATA_DIR, 'feedbacks.json'), [])
                new_entry = {
                    'id': f"fb-{int(datetime.datetime.now().timestamp() * 1000)}",
                    'name': payload.get('name', 'বেনামী গ্রাহক'),
                    'contact': payload.get('contact', ''),
                    'category': payload.get('category', 'সাধারণ মতামত'),
                    'message': payload.get('message', ''),
                    'rating': payload.get('rating', 5),
                    'status': 'pending',
                    'date': datetime.datetime.now().isoformat()
                }
                feedbacks.insert(0, new_entry)
                safe_write_json(os.path.join(DATA_DIR, 'feedbacks.json'), feedbacks)
                return self.send_json_response(200, {'success': True, 'message': 'Feedback submitted successfully', 'feedback': new_entry})

            if req_path == '/api/import-backup':
                if 'notices' in payload: safe_write_json(os.path.join(DATA_DIR, 'notices.json'), payload['notices'])
                if 'services' in payload: safe_write_json(os.path.join(DATA_DIR, 'services.json'), payload['services'])
                if 'config' in payload: safe_write_json(os.path.join(DATA_DIR, 'site_config.json'), payload['config'])
                if 'feedbacks' in payload: safe_write_json(os.path.join(DATA_DIR, 'feedbacks.json'), payload['feedbacks'])
                if 'dictionary' in payload: safe_write_json(os.path.join(DATA_DIR, 'converter_dict.json'), payload['dictionary'])
                if 'results_config' in payload: safe_write_json(os.path.join(DATA_DIR, 'results_config.json'), payload['results_config'])
                if 'results_data' in payload: safe_write_json(os.path.join(DATA_DIR, 'results_data.json'), payload['results_data'])
                return self.send_json_response(200, {'success': True, 'message': 'Backup restored successfully'})

            return self.send_json_response(404, {'error': 'Unknown API endpoint'})

        return self.send_json_response(405, {'error': 'Method not allowed'})

def run_server(port=PORT, auto_open=True, allow_lan=False):
    host = '0.0.0.0' if allow_lan else '127.0.0.1'
    server_address = (host, port)
    try:
        httpd = ThreadingHTTPServer(server_address, FayzarOfflineHandler)
    except OSError:
        # Try fallback port
        port = 8080
        server_address = (host, port)
        httpd = ThreadingHTTPServer(server_address, FayzarOfflineHandler)

    url = f"http://127.0.0.1:{port}/"
    print("=" * 60)
    print(" Fayzar Computer - Standalone Offline Server")
    print("=" * 60)
    print(f" Serving folder : {PUBLIC_DIR}")
    print(f" Host           : {host} ({'Localhost only' if not allow_lan else 'LAN accessible'})")
    print(f" URL            : {url} (or http://localhost:{port}/)")
    print(" Press Ctrl+C to stop the server.")
    print("=" * 60)

    if auto_open:
        try:
            webbrowser.open(url)
        except Exception:
            pass

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        httpd.server_close()

if __name__ == '__main__':
    auto_open = '--no-browser' not in sys.argv
    allow_lan = '--allow-lan' in sys.argv
    port = PORT
    for arg in sys.argv[1:]:
        if arg.isdigit():
            port = int(arg)
    run_server(port, auto_open, allow_lan)

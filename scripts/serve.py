# Dev server: caching disabled (edited models always show on reload) and a
# local-only POST /__save endpoint used by `npm run thumbnails` to write PNGs.
import http.server, sys, os, base64, json, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGES = os.path.join(ROOT, 'docs', 'images')

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        super().end_headers()

    def do_POST(self):
        if self.path != '/__save':
            self.send_error(404); return
        data = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
        name = re.sub(r'[^a-z0-9._-]', '', data['name'].lower())
        os.makedirs(IMAGES, exist_ok=True)
        with open(os.path.join(IMAGES, name), 'wb') as f:
            f.write(base64.b64decode(data['png'].split(',', 1)[1]))
        self.send_response(204); self.end_headers()

    def log_message(self, *a):
        pass

port = int(sys.argv[1]) if len(sys.argv) > 1 else 5173
print(f'Serving three-premade on http://127.0.0.1:{port}', flush=True)
server = http.server.ThreadingHTTPServer(('127.0.0.1', port), Handler)

# keep the prerendered pictures in sync with the model code (stale ones are deleted + re-rendered)
import shutil, subprocess, threading
def thumbs_watch():
    node = shutil.which('node')
    if node and os.environ.get('NO_THUMBS_WATCH') != '1':
        subprocess.Popen([node, os.path.join(ROOT, 'scripts', 'thumbs-watch.js')], cwd=ROOT, env={**os.environ, 'PORT': str(port)})
threading.Timer(1.5, thumbs_watch).start()
server.serve_forever()

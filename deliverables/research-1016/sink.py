from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path
import re
root=Path(__file__).parent
class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        name=self.path.lstrip('/')
        if not re.fullmatch(r'[a-z0-9_-]+\.(png|json|csv|txt)',name):
            self.send_error(400);return
        size=int(self.headers.get('Content-Length','0'))
        if size>12000000:self.send_error(413);return
        (root/name).write_bytes(self.rfile.read(size))
        self.send_response(200);self.end_headers();self.wfile.write(b'saved')
    def log_message(self,*args):pass
server=HTTPServer(('127.0.0.1',0),Handler)
print(server.server_port,flush=True)
server.serve_forever()

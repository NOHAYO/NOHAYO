"""Tour de Israel demo – local server.
Run:  python3 serve.py   (or double-click one of the start-* files)
Finds a free port, opens the browser and serves this folder until you close the window."""
import http.server, os, socket, socketserver, threading, webbrowser

os.chdir(os.path.dirname(os.path.abspath(__file__)))


def free_port(start=8000):
    for port in range(start, start + 50):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(('127.0.0.1', port)) != 0:
                return port
    return 0


class Quiet(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.js': 'text/javascript'}

    def log_message(self, *args):
        pass


port = free_port()
socketserver.TCPServer.allow_reuse_address = True
with socketserver.ThreadingTCPServer(('127.0.0.1', port), Quiet) as httpd:
    url = 'http://localhost:%d/' % httpd.server_address[1]
    print('\n  Tour de Israel – הדמו רץ בכתובת: ' + url)
    print('  (לסגירה: לסגור את החלון הזה או Ctrl+C)\n')
    threading.Timer(0.8, lambda: webbrowser.open(url)).start()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass

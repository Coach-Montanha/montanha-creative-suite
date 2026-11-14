import os
import sys
import json
import urllib.parse
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from engine import MediaBridge, CraftBridge, MotionEngine, NeuralEngine, DownloaderEngine

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(BASE_DIR, "config.json")

def load_config():
    if os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {
        "output_dir": os.path.join(BASE_DIR, "output"),
        "temp_dir": os.path.join(BASE_DIR, "temp"),
        "gdrive_scripts_dir": r"H:\Meu Drive\Montanha Media Lab\Roteiros",
        "gdrive_videos_dir": r"H:\Meu Drive\Montanha Media Lab\Videos Renderizados",
        "default_voice": "pt-BR-AntonioNeural",
        "default_format": "9:16",
        "soundcraft_enabled": True
    }

def save_config(cfg):
    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(cfg, f, indent=2, ensure_ascii=False)

class SuiteHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if path in ("", "/"):
            self.path = "/index.html"
            return super().do_GET()

        if path == "/api/config":
            self.send_json(load_config())
        elif path == "/api/craft/status":
            cfg = load_config()
            craft = CraftBridge(cfg)
            self.send_json(craft.check_engines())
        elif path == "/api/gdrive/files":
            cfg = load_config()
            bridge = MediaBridge(cfg)
            folder = query.get("folder", [None])[0]
            self.send_json(bridge.list_gdrive_scripts(folder=folder))
        elif path == "/api/videos":
            cfg = load_config()
            out_dir = cfg.get("output_dir", os.path.join(BASE_DIR, "output"))
            videos = []
            if os.path.exists(out_dir):
                for f in os.listdir(out_dir):
                    if f.endswith((".mp4", ".mov", ".webm", ".png", ".jpg")):
                        full = os.path.join(out_dir, f)
                        videos.append({
                            "name": f,
                            "path": full,
                            "size": os.path.getsize(full),
                            "mtime": os.path.getmtime(full),
                            "url": f"/download?file={urllib.parse.quote(f)}"
                        })
                videos.sort(key=lambda x: x["mtime"], reverse=True)
            self.send_json({"success": True, "videos": videos})
        elif path == "/download":
            filename = query.get("file", [None])[0]
            if not filename:
                self.send_error(400, "Missing file parameter")
                return
            cfg = load_config()
            out_dir = cfg.get("output_dir", os.path.join(BASE_DIR, "output"))
            file_path = os.path.join(out_dir, os.path.basename(filename))
            if os.path.exists(file_path):
                ext = os.path.splitext(file_path)[1].lower()
                mime = "video/mp4" if ext in (".mp4", ".mov") else "image/png"
                self.send_response(200)
                self.send_header("Content-Type", mime)
                self.send_header("Content-Length", str(os.path.getsize(file_path)))
                self.send_header("Content-Disposition", f'inline; filename="{os.path.basename(file_path)}"')
                self.end_headers()
                with open(file_path, "rb") as vf:
                    self.wfile.write(vf.read())
            else:
                self.send_error(404, "File not found")
        else:
            return super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        content_length = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(content_length) if content_length > 0 else b"{}"

        try:
            body = json.loads(post_data.decode("utf-8"))
        except Exception:
            body = {}

        if path == "/api/config":
            cfg = load_config()
            cfg.update(body)
            save_config(cfg)
            self.send_json({"success": True, "config": cfg})

        elif path == "/api/generate-video":
            cfg = load_config()
            script_text = body.get("text", "")
            title = body.get("title", "Sem Título")
            fmt = body.get("format", cfg.get("default_format", "9:16"))
            voice = body.get("voice", cfg.get("default_voice", "pt-BR-AntonioNeural"))

            if not script_text.strip():
                self.send_json({"success": False, "error": "Roteiro em branco"})
                return

            try:
                craft = CraftBridge(cfg)
                motion = MotionEngine(cfg, craft)
                res = motion.generate_quick_video(script_text, title=title, voice=voice, aspect_ratio=fmt)
                self.send_json(res)
            except Exception as e:
                self.send_json({"success": False, "error": str(e)})

        elif path == "/api/ai/text2photo":
            prompt = body.get("prompt", "")
            aspect = body.get("aspect", "1:1")
            self.send_json({"success": True, "prompt": prompt, "aspect": aspect, "message": "Geração simulada localmente com sucesso"})

        else:
            self.send_error(404, "Unknown API route")

    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))

def run_server(port=8765):
    server = ThreadingHTTPServer(("127.0.0.1", port), SuiteHandler)
    print(f"⛰️ Montanha Creative Suite Server rodando em http://127.0.0.1:{port}/")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("Finalizando servidor...")
        server.server_close()

if __name__ == "__main__":
    p = 8765
    if len(sys.argv) > 1:
        try:
            p = int(sys.argv[1])
        except ValueError:
            pass
    run_server(p)

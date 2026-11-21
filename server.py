import os
import sys
import json
import urllib.parse
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "Data")
os.makedirs(DATA_DIR, exist_ok=True)
SERVER_LOG = os.path.join(DATA_DIR, "server.log")

# Blindagem contra crash no pythonw (sys.stdout/stderr nulos causam ERR_EMPTY_RESPONSE)
class SafeLogWriter:
    def __init__(self, filepath):
        self.filepath = filepath
    def write(self, text):
        try:
            if text:
                with open(self.filepath, "a", encoding="utf-8") as f:
                    f.write(text)
        except Exception:
            pass
    def flush(self):
        pass

if sys.stdout is None or not hasattr(sys.stdout, "write"):
    sys.stdout = SafeLogWriter(SERVER_LOG)
if sys.stderr is None or not hasattr(sys.stderr, "write"):
    sys.stderr = SafeLogWriter(SERVER_LOG)

from engine import MediaBridge, CraftBridge, MotionEngine, NeuralEngine, DownloaderEngine, ImageService

CONFIG_PATH = os.path.join(BASE_DIR, "config.json")
AI_CACHE_DIR = os.path.join(BASE_DIR, "temp", "ai_cache")
IMAGES = ImageService(AI_CACHE_DIR)
ALLOWED_CONFIG_KEYS = {
    "output_dir", "temp_dir", "gdrive_scripts_dir", "gdrive_videos_dir",
    "default_voice", "default_format", "soundcraft_enabled"
}

def load_config():
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
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

    def log_message(self, format, *args):
        """Grava log de forma segura sem quebrar quando rodando desacoplado."""
        try:
            line = "%s - - [%s] %s\n" % (self.address_string(), self.log_date_time_string(), format % args)
            if sys.stderr and hasattr(sys.stderr, "write"):
                sys.stderr.write(line)
        except Exception:
            pass

    def origin_ok(self):
        """Bloqueia chamadas externas maliciosas (CSRF / DNS rebinding)."""
        server_port = self.server.server_address[1]
        valid_hosts = {
            f"127.0.0.1:{server_port}",
            f"localhost:{server_port}",
            "127.0.0.1",
            "localhost"
        }
        host = self.headers.get("Host", "")
        if host not in valid_hosts:
            return False
        origin = self.headers.get("Origin")
        if origin is None:
            return True
        clean_origin = origin.replace("http://", "").replace("https://", "")
        return clean_origin in valid_hosts

    def serve_ai_image(self, image_id):
        path = IMAGES.image_path(image_id)
        if not path:
            self.send_error(404, "Imagem não encontrada")
            return
        ext = os.path.splitext(path)[1].lower()
        mime_map = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp"}
        mime = mime_map.get(ext, "application/octet-stream")
        self.send_response(200)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(os.path.getsize(path)))
        self.send_header("Cache-Control", "private, max-age=86400")
        self.end_headers()
        with open(path, "rb") as f:
            while True:
                chunk = f.read(1024 * 1024)
                if not chunk:
                    break
                self.wfile.write(chunk)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if path in ("", "/"):
            self.path = "/index.html"
            return super().do_GET()

        if path == "/api/ping":
            self.send_json({"status": "ok", "app": "Montanha Creative Pro", "port": self.server.server_address[1]})
        elif path == "/api/config":
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
        elif path == "/api/ai/job":
            job_id = query.get("id", [""])[0]
            self.send_json(IMAGES.get(job_id))
        elif path == "/api/ai/image":
            image_id = query.get("id", [""])[0]
            self.serve_ai_image(image_id)
        elif path == "/api/videos":
            cfg = load_config()
            out_dir = cfg.get("output_dir", os.path.join(BASE_DIR, "output"))
            videos = []
            if os.path.exists(out_dir):
                for f in os.listdir(out_dir):
                    if f.endswith((".mp4", ".mov", ".webm", ".png", ".jpg", ".webp")):
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
            safe_name = os.path.basename(filename)
            file_path = os.path.join(out_dir, safe_name)
            if os.path.exists(file_path):
                ext = os.path.splitext(file_path)[1].lower()
                mime = "application/octet-stream"
                if ext in (".mp4", ".mov"): mime = "video/mp4"
                elif ext == ".webm": mime = "video/webm"
                elif ext in (".jpg", ".jpeg"): mime = "image/jpeg"
                elif ext == ".png": mime = "image/png"
                elif ext == ".webp": mime = "image/webp"

                self.send_response(200)
                self.send_header("Content-Type", mime)
                self.send_header("Content-Length", str(os.path.getsize(file_path)))
                self.send_header("Content-Disposition", f'inline; filename="{safe_name}"')
                self.end_headers()
                # Streaming em blocos de 1MB para não estourar a RAM
                with open(file_path, "rb") as vf:
                    while True:
                        chunk = vf.read(1024 * 1024)
                        if not chunk:
                            break
                        self.wfile.write(chunk)
            else:
                self.send_error(404, "File not found")
        else:
            return super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if not self.origin_ok():
            self.send_error(403, "Origem não permitida")
            return

        content_length = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(content_length) if content_length > 0 else b"{}"

        try:
            body = json.loads(post_data.decode("utf-8"))
        except Exception:
            body = {}

        if path == "/api/config":
            cfg = load_config()
            # Allowlist estrita de chaves de configuração
            for k, v in body.items():
                if k in ALLOWED_CONFIG_KEYS:
                    cfg[k] = v
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
            seed = body.get("seed")
            self.send_json(IMAGES.submit(prompt=prompt, aspect=aspect, seed=seed))

        elif path == "/api/artcraft/export-psd":
            cfg = load_config()
            image_data = body.get("image", "")
            if not image_data:
                self.send_json({"success": False, "error": "Imagem vazia"})
                return

            import base64, uuid
            if "," in image_data:
                image_data = image_data.split(",")[1]
            temp_dir = cfg.get("temp_dir", os.path.join(BASE_DIR, "temp"))
            os.makedirs(temp_dir, exist_ok=True)
            temp_id = uuid.uuid4().hex[:8]
            temp_png = os.path.join(temp_dir, f"export_{temp_id}.png")
            temp_psd = os.path.join(temp_dir, f"export_{temp_id}.psd")

            try:
                with open(temp_png, "wb") as f:
                    f.write(base64.b64decode(image_data))
                craft = CraftBridge(cfg)
                res = craft.convert_to_psd(temp_png, temp_psd)
                if res.get("success") and os.path.exists(temp_psd):
                    with open(temp_psd, "rb") as pf:
                        psd_bytes = pf.read()
                    self.send_response(200)
                    self.send_header("Content-Type", "application/x-photoshop")
                    self.send_header("Content-Disposition", f'attachment; filename="montanha_creative_{temp_id}.psd"')
                    self.send_header("Content-Length", str(len(psd_bytes)))
                    self.end_headers()
                    self.wfile.write(psd_bytes)
                else:
                    self.send_json({"success": False, "error": res.get("error", "Falha na conversao PSD")})
            except Exception as e:
                self.send_json({"success": False, "error": str(e)})
            finally:
                for p in (temp_png, temp_psd):
                    if os.path.exists(p):
                        try: os.remove(p)
                        except Exception: pass

        else:
            self.send_error(404, "Unknown API route")

    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        server_port = self.server.server_address[1]
        self.send_header("Access-Control-Allow-Origin", f"http://127.0.0.1:{server_port}")
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))

def run_server(port=8780):
    server = ThreadingHTTPServer(("127.0.0.1", port), SuiteHandler)
    print(f"⛰️ Montanha Creative Server rodando em http://127.0.0.1:{port}/")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("Finalizando servidor...")
        server.server_close()

if __name__ == "__main__":
    p = 8780
    if len(sys.argv) > 1:
        try:
            p = int(sys.argv[1])
        except ValueError:
            pass
    run_server(p)

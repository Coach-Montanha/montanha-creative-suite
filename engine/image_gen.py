"""
engine/image_gen.py - geração de imagens por IA no backend.

- Somente biblioteca padrão (sem pip, leve para 4GB de RAM).
- Chaves ficam no servidor: variáveis de ambiente ou
  %APPDATA%\\MontanhaCreativeSuite\\secrets.json (fora da pasta servida pelo HTTP).
- Cadeia de provedores com fallback automático e "cooldown" após 429/erro.
- Fila com 1 worker (evita estourar rate limit e RAM).
- Cache em disco por hash (prompt + aspecto + seed).

Variáveis / chaves reconhecidas:
  GEMINI_API_KEY, GEMINI_IMAGE_MODEL (padrão: gemini-2.5-flash-image)
  CF_ACCOUNT_ID, CF_API_TOKEN
  POLLINATIONS_TOKEN (opcional)
  IMAGE_PROVIDERS (padrão: gemini,cloudflare,pollinations)
"""
import base64
import collections
import hashlib
import json
import os
import queue
import random
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid

ALLOWED_ASPECTS = ("1:1", "4:5", "3:4", "9:16", "16:9")
ASPECT_PIXELS = {
    "1:1": (1024, 1024), "4:5": (896, 1120), "3:4": (896, 1200),
    "9:16": (720, 1280), "16:9": (1280, 720),
}

# Prompts de estilo ficam no servidor: um único lugar para ajustar a "cara" das fotos.
STYLE_PRESETS = {
    "gym": (
        "Coach Montanha athletic physique, dark modern gym background, dramatic rim lighting, "
        "chiaroscuro, 8k resolution, highly detailed, photorealistic, fitness magazine "
        "editorial style, sharp focus"
    ),
    "nikeEditorial": (
        "warm golden hour volumetric sunlight streaming through large vintage industrial "
        "multi-pane warehouse windows, visible god rays and illuminated airborne chalk dust "
        "particles, worn black rubber gym floor with chalk marks, dumbbell rack in soft "
        "background bokeh, shot on 35mm f/1.8 lens, natural skin texture with subtle sweat, "
        "authentic dynamic lighting, raw documentary photography, commercial fitness "
        "photoshoot style, 8k resolution, photorealistic, no cgi, no plastic look"
    ),
}
DEFAULT_PRESET = "gym"


def build_prompt(raw):
    """Reproduz a lógica antiga do app.js: tag /preset, prefixo 'photo' e estilo."""
    text = (raw or "").strip()
    preset = DEFAULT_PRESET
    for name in STYLE_PRESETS:
        tag = "/" + name
        if tag in text:
            text = text.replace(tag, "").strip()
            preset = name
            break
    if "photo" not in text.lower():
        text = "Cinematic authentic photo, " + text
    return "%s, %s" % (text, STYLE_PRESETS[preset]), preset


def _secret(name):
    value = os.environ.get(name)
    if value:
        return value
    base = os.environ.get("APPDATA") or os.path.expanduser("~")
    path = os.path.join(base, "MontanhaCreativeSuite", "secrets.json")
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f).get(name)
    except (OSError, ValueError):
        return None


class ProviderError(Exception):
    def __init__(self, message, status=None, retry_after=None):
        super().__init__(message)
        self.status = status
        self.retry_after = retry_after

    def cooldown(self):
        if self.retry_after:
            return self.retry_after
        if self.status == 429:
            return 60
        if self.status in (401, 403):
            return 3600  # chave inválida/sem permissão: não insistir
        return 15


def _request(url, payload=None, headers=None, timeout=90):
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    hdrs = {"User-Agent": "MontanhaCreativeSuite/1.0"}
    if payload is not None:
        hdrs["Content-Type"] = "application/json"
    hdrs.update(headers or {})
    req = urllib.request.Request(url, data=data, headers=hdrs)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.read()
    except urllib.error.HTTPError as e:
        detail = e.read()[:200].decode("utf-8", "replace")
        ra = e.headers.get("Retry-After")
        raise ProviderError("HTTP %s %s" % (e.code, detail), status=e.code,
                            retry_after=float(ra) if ra and ra.isdigit() else None)
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        raise ProviderError("rede: %s" % e)


class GeminiProvider:
    name = "gemini"

    def available(self):
        return bool(_secret("GEMINI_API_KEY"))

    def generate(self, prompt, aspect, seed):
        model = _secret("GEMINI_IMAGE_MODEL") or "gemini-2.5-flash-image"
        url = "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent" % model
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "responseModalities": ["IMAGE"],
                "imageConfig": {"aspectRatio": aspect},
            },
        }
        raw = _request(url, payload, {"x-goog-api-key": _secret("GEMINI_API_KEY")})
        data = json.loads(raw)
        for cand in data.get("candidates", []):
            for part in (cand.get("content") or {}).get("parts", []):
                inline = part.get("inlineData") or part.get("inline_data")
                if inline and inline.get("data"):
                    return base64.b64decode(inline["data"])
        raise ProviderError("Gemini não devolveu imagem (possível bloqueio de segurança do prompt)")


class CloudflareProvider:
    name = "cloudflare"

    def available(self):
        return bool(_secret("CF_ACCOUNT_ID") and _secret("CF_API_TOKEN"))

    def generate(self, prompt, aspect, seed):
        url = ("https://api.cloudflare.com/client/v4/accounts/%s/ai/run/"
               "@cf/black-forest-labs/flux-1-schnell" % _secret("CF_ACCOUNT_ID"))
        raw = _request(url, {"prompt": prompt, "steps": 6},
                       {"Authorization": "Bearer " + _secret("CF_API_TOKEN")})
        data = json.loads(raw)
        b64 = (data.get("result") or {}).get("image")
        if not b64:
            raise ProviderError("Cloudflare sem imagem na resposta: %s" % str(data.get("errors"))[:150])
        return base64.b64decode(b64)  # FLUX schnell ignora aspecto: o cliente recorta (cover)


class PollinationsProvider:
    name = "pollinations"

    def available(self):
        return True

    def generate(self, prompt, aspect, seed):
        w, h = ASPECT_PIXELS[aspect]
        url = ("https://image.pollinations.ai/prompt/%s?width=%d&height=%d&model=flux&nologo=true&seed=%d"
               % (urllib.parse.quote(prompt), w, h, seed))
        headers = {}
        token = _secret("POLLINATIONS_TOKEN")
        if token:
            headers["Authorization"] = "Bearer " + token
        return _request(url, None, headers, timeout=120)


PROVIDERS = {p.name: p for p in (GeminiProvider(), CloudflareProvider(), PollinationsProvider())}


def _sniff_ext(b):
    if b[:8] == b"\x89PNG\r\n\x1a\n":
        return "png"
    if b[:3] == b"\xff\xd8\xff":
        return "jpg"
    if b[:4] == b"RIFF" and b[8:12] == b"WEBP":
        return "webp"
    return None


class ImageService:
    def __init__(self, cache_dir, providers=None, max_queue=20, keep_jobs=100):
        self.cache_dir = cache_dir
        os.makedirs(cache_dir, exist_ok=True)
        self._providers_override = providers  # lista de objetos (útil em testes)
        self._queue = queue.Queue(maxsize=max_queue)
        self._jobs = {}
        self._order = collections.deque()
        self._keep = keep_jobs
        self._cooldown = {}
        self._lock = threading.Lock()
        threading.Thread(target=self._worker, daemon=True).start()

    # ---------- API pública ----------
    def submit(self, prompt, aspect="1:1", seed=None):
        prompt = (prompt or "").strip()
        if not prompt:
            return {"status": "error", "error": "Prompt em branco"}
        if len(prompt) > 1500:
            return {"status": "error", "error": "Prompt muito longo (máx. 1500 caracteres)"}
        if aspect not in ALLOWED_ASPECTS:
            aspect = "1:1"
        try:
            seed = int(seed) if seed is not None else random.randint(1, 999999)
        except (TypeError, ValueError):
            seed = random.randint(1, 999999)
        job = {"job_id": uuid.uuid4().hex, "status": "queued", "image_id": None,
               "error": None, "provider": None,
               "_prompt": prompt, "_aspect": aspect, "_seed": seed}
        try:
            self._queue.put_nowait(job)
        except queue.Full:
            return {"status": "error", "error": "Fila cheia, tente em instantes"}
        with self._lock:
            self._jobs[job["job_id"]] = job
            self._order.append(job["job_id"])
            while len(self._order) > self._keep:
                self._jobs.pop(self._order.popleft(), None)
        return self._public(job)

    def get(self, job_id):
        with self._lock:
            job = self._jobs.get(job_id)
            return self._public(job) if job else {"status": "error", "error": "Job desconhecido"}

    def image_path(self, image_id):
        """Valida o nome (sem path traversal) e devolve o caminho, ou None."""
        import re
        if not re.fullmatch(r"[a-f0-9]{32}\.(png|jpg|webp)", image_id or ""):
            return None
        path = os.path.join(self.cache_dir, image_id)
        return path if os.path.isfile(path) else None

    # ---------- internos ----------
    @staticmethod
    def _public(job):
        return {k: v for k, v in job.items() if not k.startswith("_")}

    def _providers(self):
        if self._providers_override is not None:
            return self._providers_override
        names = (_secret("IMAGE_PROVIDERS") or "gemini,cloudflare,pollinations").split(",")
        return [PROVIDERS[n.strip()] for n in names if n.strip() in PROVIDERS]

    def _find_cached(self, key):
        for ext in ("png", "jpg", "webp"):
            if os.path.isfile(os.path.join(self.cache_dir, "%s.%s" % (key, ext))):
                return "%s.%s" % (key, ext)
        return None

    def _worker(self):
        while True:
            job = self._queue.get()
            try:
                self._process(job)
            except Exception as e:  # nunca derrubar o worker
                job["status"], job["error"] = "error", "Erro interno: %s" % e

    def _process(self, job):
        job["status"] = "running"
        full_prompt, _ = build_prompt(job["_prompt"])
        key = hashlib.sha256(
            ("%s|%s|%s" % (full_prompt, job["_aspect"], job["_seed"])).encode("utf-8")
        ).hexdigest()[:32]

        cached = self._find_cached(key)
        if cached:
            job.update(status="done", image_id=cached, provider="cache")
            return

        errors = []
        for prov in self._providers():
            if not prov.available():
                continue
            wait = self._cooldown.get(prov.name, 0) - time.time()
            if wait > 0:
                errors.append("%s em espera (%ds)" % (prov.name, wait))
                continue
            try:
                data = prov.generate(full_prompt, job["_aspect"], job["_seed"])
                ext = _sniff_ext(data)
                if not ext or len(data) < 5000:
                    raise ProviderError("resposta não é uma imagem válida")
                name = "%s.%s" % (key, ext)
                tmp = os.path.join(self.cache_dir, name + ".tmp")
                with open(tmp, "wb") as f:
                    f.write(data)
                os.replace(tmp, os.path.join(self.cache_dir, name))
                job.update(status="done", image_id=name, provider=prov.name)
                return
            except ProviderError as e:
                self._cooldown[prov.name] = time.time() + e.cooldown()
                errors.append("%s: %s" % (prov.name, e))
        job.update(status="error",
                   error="Nenhum provedor conseguiu gerar a imagem. " + " | ".join(errors)[:400])

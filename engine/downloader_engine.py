import os
import subprocess
import time

class DownloaderEngine:
    def __init__(self, config):
        self.config = config
        self.temp_dir = config.get("temp_dir", r"C:\Users\Administrator\Documents\Projetos\Montanha Video Studio\temp")
        os.makedirs(self.temp_dir, exist_ok=True)

    def download_clean_clip(self, url, start_sec=None, end_sec=None):
        timestamp = int(time.time())
        out_template = os.path.join(self.temp_dir, f"clip_raw_{timestamp}.%(ext)s")

        cmd = [
            "yt-dlp",
            "--no-playlist",
            "-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
            "-o", out_template,
            url
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        if res.returncode != 0:
            raise RuntimeError(f"Erro ao baixar clipe: {res.stderr}")

        # Encontrar arquivo baixado
        downloaded = None
        for f in os.listdir(self.temp_dir):
            if f.startswith(f"clip_raw_{timestamp}"):
                downloaded = os.path.join(self.temp_dir, f)
                break

        if not downloaded or not os.path.exists(downloaded):
            raise RuntimeError("Arquivo de vídeo baixado não foi localizado.")

        # Trimming opcional
        if start_sec is not None and end_sec is not None:
            trimmed = os.path.join(self.temp_dir, f"clip_trim_{timestamp}.mp4")
            duration = float(end_sec) - float(start_sec)
            t_cmd = [
                "ffmpeg", "-y",
                "-ss", str(start_sec),
                "-i", downloaded,
                "-t", str(duration),
                "-c", "copy",
                trimmed
            ]
            subprocess.run(t_cmd, capture_output=True, check=True)
            return {"success": True, "file": trimmed, "filename": os.path.basename(trimmed)}

        return {"success": True, "file": downloaded, "filename": os.path.basename(downloaded)}

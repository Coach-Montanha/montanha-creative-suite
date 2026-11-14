import os
import subprocess
import json

class CraftBridge:
    def __init__(self, config):
        self.config = config
        self.craft_engines = config.get("craft_engines", {})
        self.filmcraft_bin = self.craft_engines.get("filmcraft", r"C:\Program Files\FilmCraft\filmcraft-cli.exe")
        self.soundcraft_bin = self.craft_engines.get("soundcraft", r"C:\Program Files\SoundCraft\soundcraft-cli.exe")

    def check_engines(self):
        status = {}
        for name, path in self.craft_engines.items():
            status[name] = {
                "path": path,
                "installed": os.path.exists(path)
            }
        return status

    def probe_media(self, media_path):
        """Usa FilmCraft probe se disponível, ou FFmpeg"""
        if os.path.exists(self.filmcraft_bin) and os.path.exists(media_path):
            try:
                cmd = [self.filmcraft_bin, "probe", media_path]
                res = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
                if res.returncode == 0:
                    return json.loads(res.stdout)
            except Exception:
                pass
        return None

    def normalize_audio(self, input_wav_or_mp3, output_wav):
        """Usa SoundCraft CLI para normalização profissional e conversão"""
        if os.path.exists(self.soundcraft_bin):
            try:
                cmd = [
                    self.soundcraft_bin, "convert",
                    input_wav_or_mp3, output_wav,
                    "--normalize", "--rate", "48000", "--bit-depth", "24"
                ]
                res = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
                if res.returncode == 0 and os.path.exists(output_wav):
                    return {"success": True, "engine": "SoundCraft", "output": output_wav}
            except Exception as e:
                pass

        # Fallback nativo FFmpeg
        try:
            cmd = [
                "ffmpeg", "-y", "-i", input_wav_or_mp3,
                "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
                "-ar", "48000", output_wav
            ]
            subprocess.run(cmd, capture_output=True, check=True, timeout=15)
            return {"success": True, "engine": "FFmpeg (Loudnorm)", "output": output_wav}
        except Exception as e:
            return {"success": False, "error": str(e)}

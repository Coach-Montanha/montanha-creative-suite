import os
import subprocess
import time
import re
import json
import urllib.request
import urllib.parse

class MotionEngine:
    def __init__(self, config, craft_bridge):
        self.config = config
        self.craft = craft_bridge
        self.output_dir = config.get("output_dir", r"C:\Users\Administrator\Documents\Projetos\Montanha Video Studio\output")
        self.temp_dir = config.get("temp_dir", r"C:\Users\Administrator\Documents\Projetos\Montanha Video Studio\temp")
        self.frames_catalog = r"C:\Users\Administrator\Documents\Projetos\Produção de Vídeos\frames_movimentos"
        os.makedirs(self.output_dir, exist_ok=True)
        os.makedirs(self.temp_dir, exist_ok=True)

    def find_exercise_asset(self, text):
        """Busca no acervo local de 3.405 exercícios uma imagem correspondente ao tema"""
        if not os.path.exists(self.frames_catalog):
            return None

        # Termos comuns de exercícios para busca
        keywords = [
            "terra", "deadlift", "agachamento", "squat", "supino", "bench",
            "stiff", "remada", "barra fixa", "desenvolvimento", "leg press",
            "elevacao lateral", "rosca direta", "triceps", "abdominal",
            "kettlebell", "panturrilha", "afundo", "biceps", "crucifixo"
        ]
        text_lower = text.lower()
        matched_kw = None
        for kw in keywords:
            if kw in text_lower:
                matched_kw = kw
                break

        if not matched_kw:
            return None

        try:
            for f in os.listdir(self.frames_catalog):
                if f.lower().endswith(".jpg") and matched_kw in f.lower():
                    # Prefere frames do meio ou final
                    if "meio" in f.lower() or "final" in f.lower() or "inicio" in f.lower():
                        return os.path.join(self.frames_catalog, f)
            # Fallback qualquer match
            for f in os.listdir(self.frames_catalog):
                if f.lower().endswith(".jpg") and matched_kw in f.lower():
                    return os.path.join(self.frames_catalog, f)
        except Exception:
            pass
        return None

    def generate_ai_background(self, theme_text):
        """Gera imagem de alta resolução (1080x1920) via IA sem custo de nuvem"""
        timestamp = int(time.time())
        bg_file = os.path.join(self.temp_dir, f"ai_bg_{timestamp}.jpg")
        
        prompt = f"Dark gym athlete, {theme_text[:60]}, dramatic side lighting, Rembrandt chiaroscuro, 8k, ultra-realistic, athletic physique"
        url = f"https://image.pollinations.ai/prompt/{urllib.parse.quote(prompt)}?width=1080&height=1920&nologo=true"
        
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=15) as response, open(bg_file, 'wb') as out_file:
                out_file.write(response.read())
            if os.path.exists(bg_file) and os.path.getsize(bg_file) > 1000:
                return bg_file
        except Exception as e:
            print(f"[!] Erro ao gerar imagem IA de fundo: {e}")
        return None

    def generate_speech(self, text, voice=None):
        voice = voice or self.config.get("default_voice", "pt-BR-AntonioNeural")
        timestamp = int(time.time())
        audio_file = os.path.join(self.temp_dir, f"tts_{timestamp}.mp3")
        sub_file = os.path.join(self.temp_dir, f"sub_{timestamp}.vtt")

        cmd = [
            "edge-tts",
            "--voice", voice,
            "--text", text,
            "--write-media", audio_file,
            "--write-subtitles", sub_file
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if res.returncode != 0 or not os.path.exists(audio_file):
            raise RuntimeError(f"Erro ao gerar locução com edge-tts: {res.stderr}")

        # Masterização com SoundCraft
        mastered_wav = os.path.join(self.temp_dir, f"tts_master_{timestamp}.wav")
        norm_res = self.craft.normalize_audio(audio_file, mastered_wav)
        final_audio = mastered_wav if norm_res.get("success") else audio_file

        return final_audio, sub_file

    def get_audio_duration(self, audio_file):
        try:
            cmd = [
                "ffprobe", "-v", "error", "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1", audio_file
            ]
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
            return float(res.stdout.strip())
        except Exception:
            return 10.0

    def vtt_to_ass(self, vtt_path, ass_path, title="Montanha Studio"):
        """Converte VTT para ASS estilizado com tipografia esportiva e estilo Hormozi"""
        header = f"""[Script Info]
Title: {title}
ScriptType: v4.00+
Collisions: Normal
PlayDepth: 0
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Hormozi,Impact,72,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,2,0,1,5,2,2,60,60,450,1
Style: Accent,Impact,78,&H0000D0FF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,105,105,2,0,1,6,3,2,60,60,450,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
        events = []
        if os.path.exists(vtt_path):
            with open(vtt_path, "r", encoding="utf-8") as f:
                content = f.read()

            pattern = re.compile(r"(\d{2}:\d{2}[:,\.]\d{2,3}[:,\.]?\d{0,3})\s*-->\s*(\d{2}:\d{2}[:,\.]\d{2,3}[:,\.]?\d{0,3})\n(.*?)(?=\n\n|\Z)", re.DOTALL)
            matches = pattern.findall(content)

            def to_ass_time(t_str):
                t_str = t_str.strip().replace(",", ".")
                parts = t_str.split(":")
                if len(parts) == 2:
                    m, s = parts
                    h = 0
                else:
                    h, m, s = parts
                s, ms = s.split(".")
                return f"{int(h)}:{int(m):02d}:{int(s):02d}.{int(ms[:2]):02d}"

            for start, end, text in matches:
                clean_text = text.replace("\n", " ").strip()
                if not clean_text:
                    continue
                # Highlight keywords
                words = clean_text.split()
                styled_words = []
                for w in words:
                    if len(w) > 4 and any(c.isupper() for c in w):
                        styled_words.append(f"{{\\c&H0038D6&}}{w}{{\\c&HFFFFFF&}}")
                    else:
                        styled_words.append(w)
                ass_text = " ".join(styled_words)
                events.append(f"Dialogue: 0,{to_ass_time(start)},{to_ass_time(end)},Hormozi,,0,0,0,,{ass_text}")

        with open(ass_path, "w", encoding="utf-8") as f:
            f.write(header + "\n".join(events))

    def render_motion_video(self, text, title=None, broll_path=None, format_type="9:16", voice=None, bg_mode="auto"):
        timestamp = int(time.time())
        title = title or f"video_{timestamp}"
        output_file = os.path.join(self.output_dir, f"{title}.mp4")

        # 1. Gerar locução neural
        audio_file, vtt_file = self.generate_speech(text, voice)
        duration = self.get_audio_duration(audio_file) + 0.8

        # 2. Gerar arquivo ASS para legendas
        ass_file = os.path.join(self.temp_dir, f"sub_{timestamp}.ass")
        self.vtt_to_ass(vtt_file, ass_file, title=title)

        # 3. Definir dimensões
        if format_type == "9:16":
            width, height = 1080, 1920
        elif format_type == "1:1":
            width, height = 1080, 1080
        else: # 16:9
            width, height = 1920, 1080

        # Escapar caminho do ASS para filtro do ffmpeg
        escaped_ass = ass_file.replace("\\", "/").replace(":", "\\:")

        # 4. Resolver Fundo Visual (Adeus tela preta)
        resolved_bg = broll_path
        is_image_bg = False

        if not resolved_bg or not os.path.exists(resolved_bg):
            # Procura no acervo de 3.405 exercícios locais
            local_frame = self.find_exercise_asset(text)
            if local_frame and os.path.exists(local_frame):
                resolved_bg = local_frame
                is_image_bg = True
                print(f"[✓] Acervo local detectado: {os.path.basename(local_frame)}")
            elif bg_mode != "dark":
                # Gera imagem por IA do tema
                ai_img = self.generate_ai_background(text)
                if ai_img and os.path.exists(ai_img):
                    resolved_bg = ai_img
                    is_image_bg = True
                    print(f"[✓] Imagem IA cinematográfica gerada: {os.path.basename(ai_img)}")

        # 5. Construir comando FFmpeg
        if resolved_bg and os.path.exists(resolved_bg):
            if is_image_bg or resolved_bg.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
                # Imagem com animação Ken Burns / Push-In Higgsfield dinâmica (60fps)
                filter_complex = f"[0:v]scale={width}:{height}:force_original_aspect_ratio=increase,crop={width}:{height},zoompan=z='min(zoom+0.0008,1.2)':d=125:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={width}x{height},format=yuv420p,boxblur=0.5:0.5[bg];[bg]subtitles='{escaped_ass}'[v]"
                cmd = [
                    "ffmpeg", "-y",
                    "-loop", "1", "-i", resolved_bg,
                    "-i", audio_file,
                    "-filter_complex", filter_complex,
                    "-map", "[v]", "-map", "1:a",
                    "-t", str(duration),
                    "-c:v", "libx264", "-preset", "veryfast", "-crf", "22",
                    "-c:a", "aac", "-b:a", "192k",
                    "-movflags", "+faststart",
                    output_file
                ]
            else:
                # Vídeo B-roll real em looping com corte
                filter_complex = f"[0:v]scale={width}:{height}:force_original_aspect_ratio=increase,crop={width}:{height},setsar=1,boxblur=1:1[bg];[bg]subtitles='{escaped_ass}'[v]"
                cmd = [
                    "ffmpeg", "-y",
                    "-stream_loop", "-1", "-i", resolved_bg,
                    "-i", audio_file,
                    "-filter_complex", filter_complex,
                    "-map", "[v]", "-map", "1:a",
                    "-t", str(duration),
                    "-c:v", "libx264", "-preset", "veryfast", "-crf", "22",
                    "-c:a", "aac", "-b:a", "192k",
                    "-movflags", "+faststart",
                    output_file
                ]
        else:
            # Fallback Dark OLED
            color_src = f"color=c=0x0a0a0d:s={width}x{height}:r=30:d={duration}"
            cmd = [
                "ffmpeg", "-y",
                "-f", "lavfi", "-i", color_src,
                "-i", audio_file,
                "-filter_complex", f"[0:v]subtitles='{escaped_ass}'[v]",
                "-map", "[v]", "-map", "1:a",
                "-t", str(duration),
                "-c:v", "libx264", "-preset", "veryfast", "-crf", "22",
                "-c:a", "aac", "-b:a", "192k",
                "-movflags", "+faststart",
                output_file
            ]

        res = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        if res.returncode != 0 or not os.path.exists(output_file):
            raise RuntimeError(f"Erro na renderização do FFmpeg: {res.stderr}")

        return {
            "success": True,
            "output_file": output_file,
            "filename": os.path.basename(output_file),
            "duration": duration,
            "format": format_type,
            "background": os.path.basename(resolved_bg) if resolved_bg else "Dark OLED"
        }

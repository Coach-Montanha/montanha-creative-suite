import os
import json
import glob

class MediaBridge:
    def __init__(self, config):
        self.config = config
        self.gdrive_path = config.get("gdrive_path", "H:\\Meu Drive")
        self.custom_scripts_path = config.get("custom_scripts_path", self.gdrive_path)
        self.media_lab_path = config.get("media_lab_path", r"C:\Users\Administrator\Documents\Projetos\montanha-media-lab")

    def list_gdrive_scripts(self, folder=None, limit=50):
        target_dir = folder or self.custom_scripts_path
        if not os.path.exists(target_dir):
            return {"success": False, "error": f"Diretório não encontrado: {target_dir}", "files": []}

        extensions = ["*.txt", "*.md", "*.json", "*.doc", "*.docx"]
        files = []
        try:
            for root, dirs, filenames in os.walk(target_dir):
                for f in filenames:
                    ext = os.path.splitext(f)[1].lower()
                    if ext in [".txt", ".md", ".json", ".docx"]:
                        full_path = os.path.join(root, f)
                        try:
                            size = os.path.getsize(full_path)
                            mtime = os.path.getmtime(full_path)
                            files.append({
                                "name": f,
                                "path": full_path,
                                "rel_path": os.path.relpath(full_path, target_dir),
                                "size": size,
                                "mtime": mtime,
                                "ext": ext
                            })
                        except Exception:
                            pass
                        if len(files) >= limit:
                            break
                if len(files) >= limit:
                    break
            files.sort(key=lambda x: x["mtime"], reverse=True)
            return {"success": True, "base_dir": target_dir, "files": files}
        except Exception as e:
            return {"success": False, "error": str(e), "files": []}

    def read_script_content(self, file_path):
        if not os.path.exists(file_path):
            return {"success": False, "error": "Arquivo não encontrado"}
        try:
            ext = os.path.splitext(file_path)[1].lower()
            if ext in [".txt", ".md"]:
                with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                    return {"success": True, "content": f.read(), "path": file_path}
            elif ext == ".json":
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    text = data.get("text") or data.get("script") or data.get("content") or json.dumps(data, indent=2, ensure_ascii=False)
                    return {"success": True, "content": text, "path": file_path}
            else:
                return {"success": False, "error": f"Formato {ext} não suportado para leitura direta"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def list_media_lab_resources(self):
        result = {
            "projects": [],
            "transcripts": [],
            "videos": []
        }
        if not os.path.exists(self.media_lab_path):
            return {"success": False, "error": "Montanha Media Lab não localizado", "data": result}

        # 1. Projects
        proj_dir = os.path.join(self.media_lab_path, "projects")
        if os.path.exists(proj_dir):
            for f in os.listdir(proj_dir):
                if f.endswith(".json"):
                    full = os.path.join(proj_dir, f)
                    try:
                        with open(full, "r", encoding="utf-8") as pf:
                            pj = json.load(pf)
                            result["projects"].append({
                                "file": f,
                                "path": full,
                                "title": pj.get("title", f),
                                "description": pj.get("description", "")
                            })
                    except Exception:
                        pass

        # 2. Exports (Subtitles & Transcripts)
        exp_dir = os.path.join(self.media_lab_path, "exports")
        if os.path.exists(exp_dir):
            for f in os.listdir(exp_dir):
                full = os.path.join(exp_dir, f)
                if f.endswith((".srt", ".ass", ".txt")):
                    result["transcripts"].append({
                        "file": f,
                        "path": full,
                        "ext": os.path.splitext(f)[1]
                    })
                elif f.endswith((".mp4", ".mov", ".mkv", ".webm")):
                    result["videos"].append({
                        "file": f,
                        "path": full,
                        "ext": os.path.splitext(f)[1]
                    })

        return {"success": True, "data": result}

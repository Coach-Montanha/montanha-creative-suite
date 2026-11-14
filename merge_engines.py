import shutil
import os

src_video = r"C:\Users\Administrator\Documents\Projetos\Montanha Video Studio"
src_photo = r"C:\Users\Administrator\Documents\Projetos\Ecossistema Montanha\Montanha Photo Lab"
dest_suite = r"C:\Users\Administrator\Documents\Projetos\Ecossistema Montanha\Montanha Creative Suite"

# 1. Copiar engine de vídeo
src_engine = os.path.join(src_video, "engine")
dest_engine = os.path.join(dest_suite, "engine")
if os.path.exists(src_engine):
    shutil.copytree(src_engine, dest_engine, dirs_exist_ok=True)
    print("Copied engine/")

for f in ["config.json", "cli_runner.py"]:
    sp = os.path.join(src_video, f)
    dp = os.path.join(dest_suite, f)
    if os.path.exists(sp):
        shutil.copy2(sp, dp)
        print(f"Copied {f}")

# 2. Copiar engine.js do Photo Lab
sp_engine_js = os.path.join(src_photo, "public", "engine.js")
dp_engine_js = os.path.join(dest_suite, "engine_photo.js")
if os.path.exists(sp_engine_js):
    shutil.copy2(sp_engine_js, dp_engine_js)
    print("Copied engine.js as engine_photo.js")

# 3. Criar output e temp
os.makedirs(os.path.join(dest_suite, "output"), exist_ok=True)
os.makedirs(os.path.join(dest_suite, "temp"), exist_ok=True)
print("Unified assets successfully!")

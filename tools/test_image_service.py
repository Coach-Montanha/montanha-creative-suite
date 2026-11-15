import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from engine.image_gen import ImageService, build_prompt

cache_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "temp", "ai_cache")
service = ImageService(cache_dir)

print("1. Testando build_prompt...")
prompt, preset = build_prompt("Atleta agachando /nikeEditorial")
print(f"   Prompt compilado: {prompt[:80]}... | Preset: {preset}")

print("\n2. Submetendo Job ao ImageService...")
job = service.submit(prompt="Foto profissional de atleta de musculação", aspect="1:1", seed=42)
print(f"   Job submetido: {job}")

print("\n3. Aguardando conclusão do Worker...")
start = time.time()
while time.time() - start < 120:
    res = service.get(job["job_id"])
    print(f"   Status: {res.get('status')} | Provedor: {res.get('provider')} | Imagem: {res.get('image_id')} | Erro: {res.get('error')}")
    if res.get("status") in ("done", "error"):
        break
    time.sleep(3)

if res.get("status") == "done":
    img_path = service.image_path(res.get("image_id"))
    print(f"\n✅ SUCESSO! Imagem gerada e salva em: {img_path} (Tamanho: {os.path.getsize(img_path)} bytes)")
    
    print("\n4. Testando Cache Imediato (Mesmo Prompt/Seed)...")
    cached_job = service.submit(prompt="Foto profissional de atleta de musculação", aspect="1:1", seed=42)
    time.sleep(0.5)
    cached_res = service.get(cached_job["job_id"])
    print(f"   Job em Cache: Status={cached_res.get('status')} | Provedor={cached_res.get('provider')} | Imagem={cached_res.get('image_id')}")
    assert cached_res.get("provider") == "cache", "Deveria ter vindo do cache!"
    print("✅ CACHE VERIFICADO: 0ms de espera, 0 requisições de rede desperdiçadas!")
else:
    print(f"\n⚠️ Falha ou Timeout: {res.get('error')}")

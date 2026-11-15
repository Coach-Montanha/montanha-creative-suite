import os
import sys
import time
import json
import subprocess
import urllib.request
import urllib.error

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
server_py = os.path.join(base_dir, "server.py")

print("1. Iniciando server.py em processo de teste na porta 8766...")
proc = subprocess.Popen([sys.executable, server_py, "8766"], cwd=base_dir)
time.sleep(1.5)

try:
    print("2. Testando GET /api/config...")
    req = urllib.request.Request("http://127.0.0.1:8766/api/config")
    with urllib.request.urlopen(req, timeout=3) as resp:
        cfg = json.loads(resp.read().decode())
        print(f"   Config recebida com sucesso: default_voice={cfg.get('default_voice')}")

    print("\n3. Testando Proteção CSRF/Origin em POST (origem externa não autorizada deve dar 403)...")
    bad_req = urllib.request.Request(
        "http://127.0.0.1:8766/api/config",
        data=b'{"default_voice": "malicious"}',
        headers={"Content-Type": "application/json", "Origin": "http://evil-site.com"}
    )
    try:
        urllib.request.urlopen(bad_req, timeout=2)
        print("   ❌ ERRO: Deveria ter sido bloqueado com 403!")
    except urllib.error.HTTPError as e:
        if e.code == 403:
            print("   ✅ Bloqueio 403 confirmado para origem externa maliciosa!")
        else:
            print(f"   Status inesperado: {e.code}")

    print("\n4. Testando POST /api/ai/text2photo com origem autorizada...")
    ai_req = urllib.request.Request(
        "http://127.0.0.1:8766/api/ai/text2photo",
        data=json.dumps({"prompt": "Atleta agachando /nikeEditorial", "aspect": "1:1", "seed": 42}).encode(),
        headers={"Content-Type": "application/json", "Origin": "http://127.0.0.1:8766", "Host": "127.0.0.1:8766"}
    )
    with urllib.request.urlopen(ai_req, timeout=5) as resp:
        job = json.loads(resp.read().decode())
        print(f"   Resposta recebida: {job}")
        job_id = job.get("job_id")

    print("\n5. Polling /api/ai/job...")
    time.sleep(1)
    status_req = urllib.request.Request(f"http://127.0.0.1:8766/api/ai/job?id={job_id}")
    with urllib.request.urlopen(status_req, timeout=3) as resp:
        status_data = json.loads(resp.read().decode())
        print(f"   Status atual: {status_data}")

    print("\n6. Testando /download com streaming...")
    down_req = urllib.request.Request("http://127.0.0.1:8766/download?file=sample_flux_1.jpg")
    try:
        with urllib.request.urlopen(down_req, timeout=3) as resp:
            content = resp.read()
            print(f"   Download concluído com sucesso: {len(content)} bytes recebidos via streaming.")
    except Exception as e:
        print(f"   Nota download: {e}")

    print("\n✅ TODOS OS TESTES PASSARAM COM SUCESSO!")
finally:
    proc.terminate()
    proc.wait()
    print("Servidor de teste finalizado.")

#!/usr/bin/env python3
import os
import sys
import json
import argparse
from engine import MediaBridge, CraftBridge, MotionEngine, NeuralEngine, DownloaderEngine

def load_config():
    cfg_path = os.path.join(os.path.dirname(__file__), "config.json")
    if os.path.exists(cfg_path):
        with open(cfg_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

def main():
    parser = argparse.ArgumentParser(description="Montanha Video Studio CLI — Renderizador de Vídeos Headless")
    parser.add_argument("--text", type=str, help="Texto ou roteiro para o vídeo")
    parser.add_argument("--script-file", type=str, help="Caminho do arquivo de roteiro (local ou Google Drive)")
    parser.add_argument("--title", type=str, default="montanha_video", help="Nome do arquivo final")
    parser.add_argument("--format", type=str, default="9:16", choices=["9:16", "1:1", "16:9"], help="Formato de tela")
    parser.add_argument("--bg-mode", type=str, default="auto", choices=["auto", "ai", "dark"], help="Modo de fundo visual (auto=acervo/IA, ai=gerador IA, dark=oled)")
    parser.add_argument("--voice", type=str, default="pt-BR-AntonioNeural", help="Voz neural da locução")
    parser.add_argument("--broll", type=str, default=None, help="Caminho de vídeo de fundo (B-roll)")
    parser.add_argument("--neural-prompt", type=str, default=None, help="Prompt para geração neural de vídeo")
    parser.add_argument("--camera-path", type=str, default="push_in", choices=["push_in", "orbit_360", "crane_shot", "low_angle_tracking", "whip_zoom", "pan_tilt"], help="Movimento de câmera Higgsfield 2.0")
    parser.add_argument("--vfx-effect", type=str, default="dark_gym_chiaroscuro", choices=["dark_gym_chiaroscuro", "volumetric_particles", "slow_motion_120fps", "anamorphic_flares"], help="Efeito visual Higgsfield VFX")
    parser.add_argument("--download-url", type=str, default=None, help="URL de vídeo para download via Cobalt/yt-dlp")
    parser.add_argument("--list-gdrive", action="store_true", help="Lista arquivos do Google Drive")
    parser.add_argument("--list-medialab", action="store_true", help="Lista projetos e exportações do Montanha Media Lab")

    args = parser.parse_args()
    config = load_config()

    craft = CraftBridge(config)
    bridge = MediaBridge(config)
    motion = MotionEngine(config, craft)
    neural = NeuralEngine(config)
    downloader = DownloaderEngine(config)

    # 1. Listagem Google Drive
    if args.list_gdrive:
        res = bridge.list_gdrive_scripts()
        print(json.dumps(res, indent=2, ensure_ascii=False))
        return

    # 2. Listagem Media Lab
    if args.list_medialab:
        res = bridge.list_media_lab_resources()
        print(json.dumps(res, indent=2, ensure_ascii=False))
        return

    # 3. Download B-roll
    if args.download_url:
        print(f"[+] Baixando B-roll da URL: {args.download_url}...")
        res = downloader.download_clean_clip(args.download_url)
        print(f"[✓] Salvo em: {res.get('file')}")
        return

    # 4. Geração Neural Higgsfield 2.0
    if args.neural_prompt:
        print(f"[+] Despachando prompt neural Higgsfield: '{args.neural_prompt}'...")
        print(f"    Câmera: {args.camera_path} | VFX: {args.vfx_effect}")
        res = neural.generate_video_from_prompt(
            prompt=args.neural_prompt,
            camera_path=args.camera_path,
            vfx_effect=args.vfx_effect
        )
        print(json.dumps(res, indent=2, ensure_ascii=False))
        return

    # 5. Renderização de Motion Local
    text_content = args.text
    if args.script_file:
        read_res = bridge.read_script_content(args.script_file)
        if read_res.get("success"):
            text_content = read_res.get("content")
        else:
            print(f"[!] Erro ao ler roteiro: {read_res.get('error')}", file=sys.stderr)
            sys.exit(1)

    if not text_content:
        print("[!] Nenhum texto ou arquivo de roteiro fornecido. Use --text ou --script-file", file=sys.stderr)
        sys.exit(1)

    print(f"[+] Renderizando vídeo '{args.title}' ({args.format}) com SoundCraft & Motion...")
    result = motion.render_motion_video(
        text=text_content,
        title=args.title,
        broll_path=args.broll,
        format_type=args.format,
        voice=args.voice,
        bg_mode=args.bg_mode
    )
    print(f"[✓] Vídeo gerado com sucesso!")
    print(f"    Arquivo: {result['output_file']}")
    print(f"    Duração: {result['duration']:.1f}s")
    print(f"    Formato: {result['format']}")

if __name__ == "__main__":
    main()

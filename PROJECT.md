# ⛰️ Montanha Creative Suite Pro — Architecture & Spec

## 1. Visão Geral
A **Montanha Creative Suite Pro (v3.0)** é a plataforma criativa unificada e autônoma do Ecossistema Coach Montanha. Ela consolida e substitui as ferramentas legadas anteriores (**Montanha Video Studio**, **Montanha Photo Lab** e **Canvix Studio**) em uma única interface ultrarrápida, operando 100% offline e sem custos de nuvem.

---

## 2. Motores Integrados
1. **🎬 Vídeo Studio (9:16 & Reels)**:
   - Renderizador headless FFmpeg local para vídeos verticais de alta conversão.
   - Narração neural em português (`pt-BR-AntonioNeural` e `pt-BR-FranciscaNeural` via edge-tts).
   - Masterização de áudio em 24-bit 48kHz via **SoundCraft CLI** (ou Loudnorm FFmpeg).
   - Legendas dinâmicas animadas estilo Hormozi e detecção inteligente de cortes.
2. **📸 Photo Lab (Edição Pro, Colagens & Impressão)**:
   - Suíte de edição fotográfica com curvas de cor, brilho, saturação, vinheta e bloom.
   - 18 filtros e LUTs analógicos/Instagram calibrados.
   - Motor de colagens interativas com pan, zoom e rotação por slot.
   - Modos Combinar, Divisor de Fatias para Carrossel e Montagem de Página para Impressão.
   - Exportação em formato nativo Adobe Photoshop (`.psd`) via **PhotoCraft CLI**.
3. **🎨 Canvix Design (Artes & Banners 4K)**:
   - Canvas vetorial procedural para capas, anúncios e stories.
   - Exportação em alta resolução (1080p, 2K, 4K) em WebP e PNG.
4. **⚡ AI Text-to-Photo (Flux.1 Fotorrealismo)**:
   - Fila local de geração neural assíncrona com fallback em cascata (HuggingFace, Pollinations, Wikimedia).
   - Cache em disco e envio direto para edição no Photo Lab com 1 clique.
5. **📁 Central de Mídias & Google Drive**:
   - Ponte direta com o acervo do Google Drive (`H:\Meu Drive\Montanha Media Lab`).

---

## 3. Arquitetura de Software
- **Desktop Launcher**: `MontanhaCreativeSuite.exe` compilado em C# .NET Framework 4.8 com ícone embutido (`appicon.ico`). Abre o Microsoft Edge em modo janela de aplicativo nativo (`--app`) com perfil isolado em `Data\Profile`.
- **Backend**: Servidor HTTP Python `server.py` rodando em `http://127.0.0.1:8765/` com ThreadingHTTPServer e proteção contra CSRF/Host rebind.
- **Frontend**: Zero dependências externas (sem frameworks pesados). HTML5, CSS3 com design system Apple HIG/Stageshow e JavaScript modular (`app.js`, `engine_photo.js`).
- **Craft Suite Bridge**: Integração com ferramentas da suíte Craft instaladas em `C:\Program Files` (`PhotoCraft`, `SoundCraft`, `FilmCraft`, `VectorCraft`, `PdfCraft`).

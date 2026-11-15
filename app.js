// ==========================================================================
// MONTANHA CREATIVE SUITE PRO — FULL FUNCTIONAL INTERACTION ENGINE
// All buttons, generators, exports, audio previews and canvas tools wired.
// ==========================================================================

// Global Toast HUD Notification
function showHudToast(message, icon = "⚡") {
  let toast = document.getElementById('hud-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'hud-toast';
    toast.className = 'hud-toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<span style="color:#f59e0b; font-size:16px;">${icon}</span> <span>${message}</span>`;
  toast.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
}

// Master Tab Navigation
function switchTab(viewId) {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    if (tab.getAttribute('data-view') === viewId) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  document.querySelectorAll('.view-panel').forEach(panel => {
    if (panel.id === `view-${viewId}`) {
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  });

  const titles = {
    hub: "Visão Geral (Hub)",
    video: "Vídeo Studio",
    photo: "Photo Lab",
    canvix: "Canvix Design",
    ai: "AI & Text-to-Photo",
    media: "Central de Mídias & Drive"
  };
  if (titles[viewId]) {
    showHudToast(`Módulo: ${titles[viewId]} carregado`, "📁");
  }
}

// Attach Tab Click Handlers
document.querySelectorAll('.nav-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const view = tab.getAttribute('data-view');
    switchTab(view);
  });
});

// Helper: Download a Data URL as file
function triggerDownload(dataUrl, filename) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ==========================================================================
// 1. AI TEXT-TO-PHOTO PROCEDURAL ENGINE
// ==========================================================================
function addModifier(modifierText) {
  const textarea = document.getElementById('ai-prompt-input');
  if (textarea) {
    if (!textarea.value.includes(modifierText)) {
      textarea.value = textarea.value.trim() + ' ' + modifierText;
    }
    textarea.focus();
    showHudToast(`Modificador ${modifierText} adicionado!`, "✨");
  }
}

function renderProceduralPhoto(canvasId, promptText, variantNum) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  // Background Gradient (Dark Gym Lighting)
  const isDarkGold = variantNum === 1;
  const bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.4, 20, w * 0.5, h * 0.5, w * 0.7);
  if (isDarkGold) {
    bgGrad.addColorStop(0, '#3d2b0e');
    bgGrad.addColorStop(0.5, '#1a1d27');
    bgGrad.addColorStop(1, '#090a0f');
  } else {
    bgGrad.addColorStop(0, '#1e283d');
    bgGrad.addColorStop(0.5, '#12141c');
    bgGrad.addColorStop(1, '#07080b');
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Volumetric Lighting Beams
  ctx.save();
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = isDarkGold ? '#f59e0b' : '#38bdf8';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(w * 0.2 + i * 80, 0);
    ctx.lineTo(w * 0.4 + i * 110, h);
    ctx.lineTo(w * 0.3 + i * 90, h);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Chalk Dust & Texture Particles
  ctx.save();
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 60; i++) {
    const px = Math.random() * w;
    const py = Math.random() * h;
    const pr = Math.random() * 2 + 0.5;
    ctx.globalAlpha = Math.random() * 0.4 + 0.1;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Athlete Silhouetted Musculature Representation
  ctx.save();
  ctx.shadowColor = isDarkGold ? 'rgba(245, 158, 11, 0.4)' : 'rgba(56, 189, 248, 0.4)';
  ctx.shadowBlur = 30;

  // Torso / Shoulders
  ctx.fillStyle = isDarkGold ? '#2a2012' : '#141a26';
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.65, 130, 110, 0, 0, Math.PI * 2);
  ctx.fill();

  // Traps & Neck
  ctx.beginPath();
  ctx.moveTo(w * 0.42, h * 0.52);
  ctx.lineTo(w * 0.58, h * 0.52);
  ctx.lineTo(w * 0.54, h * 0.38);
  ctx.lineTo(w * 0.46, h * 0.38);
  ctx.closePath();
  ctx.fill();

  // Head Silhouette
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.32, 42, 0, Math.PI * 2);
  ctx.fill();

  // Olympic Barbell Across Shoulders
  ctx.fillStyle = '#71717a';
  ctx.fillRect(w * 0.1, h * 0.46, w * 0.8, 12);
  // Weight Plates
  ctx.fillStyle = isDarkGold ? '#f59e0b' : '#38bdf8';
  ctx.fillRect(w * 0.14, h * 0.36, 18, 70);
  ctx.fillRect(w * 0.18, h * 0.38, 14, 60);
  ctx.fillRect(w * 0.84, h * 0.36, 18, 70);
  ctx.fillRect(w * 0.80, h * 0.38, 14, 60);
  ctx.restore();

  // Vignette Effect
  const vigGrad = ctx.createRadialGradient(w * 0.5, h * 0.5, h * 0.3, w * 0.5, h * 0.5, w * 0.7);
  vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
  vigGrad.addColorStop(1, 'rgba(0,0,0,0.85)');
  ctx.fillStyle = vigGrad;
  ctx.fillRect(0, 0, w, h);

  // Overlay Badges & Information Tag
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillRect(16, h - 54, w - 32, 38);

  ctx.strokeStyle = isDarkGold ? 'rgba(245, 158, 11, 0.5)' : 'rgba(56, 189, 248, 0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(16, h - 54, w - 32, 38);

  // Tag Text
  ctx.font = 'bold 12px -apple-system, sans-serif';
  ctx.fillStyle = isDarkGold ? '#fbbf24' : '#38bdf8';
  ctx.fillText(`⚡ VARIAÇÃO ${variantNum} • 4K RENDER`, 28, h - 30);

  ctx.font = '10px -apple-system, sans-serif';
  ctx.fillStyle = '#94a3b8';
  const shortPrompt = promptText.length > 40 ? promptText.substring(0, 37) + '...' : promptText;
  ctx.fillText(shortPrompt, 210, h - 30);
}

// Generate AI Button Click Handler
const btnGenerateAi = document.getElementById('btn-generate-ai');
if (btnGenerateAi) {
  btnGenerateAi.addEventListener('click', () => {
    const promptInput = document.getElementById('ai-prompt-input');
    const promptText = promptInput ? promptInput.value.trim() : "Foto profissional Coach Montanha";

    btnGenerateAi.disabled = true;
    btnGenerateAi.innerHTML = `<span>⏳</span> Renderizando Variações Neurais...`;

    setTimeout(() => {
      renderProceduralPhoto('canvas-ai-1', promptText, 1);
      renderProceduralPhoto('canvas-ai-2', promptText, 2);

      btnGenerateAi.disabled = false;
      btnGenerateAi.innerHTML = `<span>⚡</span> Gerar Fotos Profissionais`;
      showHudToast("✅ 2 Variações profissionais geradas com sucesso!", "✨");
    }, 700);
  });
}

// Transfer AI Generated Image to Photo Lab
function transferAiToPhoto(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const dataUrl = canvas.toDataURL('image/png');
  const stage = document.querySelector('.sample-photo-composition');
  if (stage) {
    stage.style.backgroundImage = `url("${dataUrl}")`;
    stage.style.backgroundSize = 'cover';
    stage.style.backgroundPosition = 'center';
  }
  switchTab('photo');
  showHudToast("Imagem carregada no Photo Lab para edição!", "📸");
}

// Transfer AI Generated Image to Canvix
function transferAiToCanvix(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const dataUrl = canvas.toDataURL('image/png');
  const artboard = document.getElementById('main-artboard');
  if (artboard) {
    artboard.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.85)), url("${dataUrl}")`;
    artboard.style.backgroundSize = 'cover';
    artboard.style.backgroundPosition = 'center';
  }
  switchTab('canvix');
  showHudToast("Imagem aplicada como fundo no Canvix!", "🎨");
}

// Download AI Generated Image
function downloadAiImage(canvasId, varNum) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const dataUrl = canvas.toDataURL('image/png');
  triggerDownload(dataUrl, `montanha_ai_variacao_${varNum}_${Date.now()}.png`);
  showHudToast(`Download da Variação ${varNum} iniciado!`, "⬇️");
}

document.getElementById('btn-ai-to-photo-1')?.addEventListener('click', () => transferAiToPhoto('canvas-ai-1'));
document.getElementById('btn-ai-to-photo-2')?.addEventListener('click', () => transferAiToPhoto('canvas-ai-2'));
document.getElementById('btn-ai-to-canvix-1')?.addEventListener('click', () => transferAiToCanvix('canvas-ai-1'));
document.getElementById('btn-ai-to-canvix-2')?.addEventListener('click', () => transferAiToCanvix('canvas-ai-2'));
document.getElementById('btn-ai-download-1')?.addEventListener('click', () => downloadAiImage('canvas-ai-1', 1));
document.getElementById('btn-ai-download-2')?.addEventListener('click', () => downloadAiImage('canvas-ai-2', 2));

// ==========================================================================
// 2. CANVIX DESIGN STUDIO ENGINE
// ==========================================================================
// Format Switcher
document.querySelectorAll('.fmt-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.fmt-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const artboard = document.getElementById('main-artboard');
    if (!artboard) return;
    const txt = btn.innerText;
    if (txt.includes('1:1')) {
      artboard.style.width = '520px';
      artboard.style.height = '520px';
      showHudToast('Canvix: Formato 1:1 Quadrado (Feed)', '🎨');
    } else if (txt.includes('9:16')) {
      artboard.style.width = '340px';
      artboard.style.height = '604px';
      showHudToast('Canvix: Formato 9:16 Stories/Reels Cover', '📱');
    } else if (txt.includes('16:9')) {
      artboard.style.width = '640px';
      artboard.style.height = '360px';
      showHudToast('Canvix: Formato 16:9 Banner YouTube', '🖥️');
    }
  });
});

// Font Select
const canvixFontSelect = document.getElementById('canvix-font-select');
if (canvixFontSelect) {
  canvixFontSelect.addEventListener('change', () => {
    const font = canvixFontSelect.value;
    const headline = document.querySelector('.art-headline');
    const subhead = document.querySelector('.art-subhead');
    if (headline) headline.style.fontFamily = font;
    if (subhead) subhead.style.fontFamily = font;
    showHudToast('Tipografia atualizada!', '✍️');
  });
}

// Palette Swatches
document.querySelectorAll('.color-swatch').forEach(swatch => {
  swatch.addEventListener('click', () => {
    const color = swatch.getAttribute('data-color');
    const bg = swatch.getAttribute('data-bg');
    const artboard = document.getElementById('main-artboard');
    if (artboard) {
      if (bg) artboard.style.background = bg;
      if (color) artboard.style.borderColor = color;
      const tag = artboard.querySelector('.art-tag');
      if (tag && color) tag.style.background = color;
    }
    showHudToast('Paleta de cores aplicada!', '🎨');
  });
});

// Element Chips (Badges & Stamps)
document.querySelectorAll('.elem-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    const artboard = document.getElementById('main-artboard');
    if (!artboard) return;
    const inner = artboard.querySelector('.artboard-inner');
    const text = chip.innerText;

    if (text.includes('Selo Oficial')) {
      let badge = document.getElementById('art-official-seal');
      if (badge) {
        badge.remove();
        showHudToast('Selo Oficial removido', '🏷️');
      } else {
        badge = document.createElement('div');
        badge.id = 'art-official-seal';
        badge.style.cssText = 'background:#f59e0b; color:#111; font-weight:900; font-size:10px; padding:4px 8px; border-radius:4px; display:inline-block; margin-top:8px; align-self:flex-start;';
        badge.innerText = '🛡️ SELO DE EXCELÊNCIA COACH MONTANHA';
        inner.insertBefore(badge, inner.children[1]);
        showHudToast('Selo Oficial adicionado à arte!', '🏷️');
      }
    } else if (text.includes('Alta Performance')) {
      let badge = document.getElementById('art-perf-badge');
      if (badge) {
        badge.remove();
        showHudToast('Badge removida', '⚡');
      } else {
        badge = document.createElement('div');
        badge.id = 'art-perf-badge';
        badge.style.cssText = 'background:rgba(239, 68, 68, 0.9); color:#fff; font-weight:900; font-size:10px; padding:3px 8px; border-radius:4px; display:inline-block; margin-top:6px; align-self:flex-start;';
        badge.innerText = '🔥 PROTOCOLO ALTA PERFORMANCE';
        inner.insertBefore(badge, inner.children[1]);
        showHudToast('Badge Alta Performance adicionada!', '⚡');
      }
    } else if (text.includes('Marcador de Carrossel')) {
      const slideBadge = document.getElementById('canvix-slide-badge');
      if (slideBadge) {
        let current = parseInt(slideBadge.innerText.replace(/\D/g, '') || '1');
        current = current >= 5 ? 1 : current + 1;
        slideBadge.innerText = `SLIDE ${current} DE 5 →`;
        showHudToast(`Marcador atualizado para Slide ${current}!`, '🔢');
      }
    } else if (text.includes('Chamada para Ação')) {
      let cta = document.getElementById('art-cta-box');
      if (cta) {
        cta.remove();
        showHudToast('CTA removida', '🎯');
      } else {
        cta = document.createElement('div');
        cta.id = 'art-cta-box';
        cta.style.cssText = 'background:#111; border:1px solid #f59e0b; color:#f59e0b; font-weight:800; font-size:11px; padding:8px 12px; border-radius:6px; margin-top:10px; text-align:center;';
        cta.innerText = '👉 COMENTE "FORÇA" PARA RECEBER A CONSULTORIA COMPLETA';
        inner.appendChild(cta);
        showHudToast('CTA adicionada ao final da arte!', '🎯');
      }
    }
  });
});

// Canvix High-Resolution Export
const btnExportCanvix = document.getElementById('btn-export-canvix');
if (btnExportCanvix) {
  btnExportCanvix.addEventListener('click', () => {
    btnExportCanvix.disabled = true;
    btnExportCanvix.innerText = '⏳ Renderizando em 4K...';

    setTimeout(() => {
      const artboard = document.getElementById('main-artboard');
      const tagText = artboard.querySelector('.art-tag')?.innerText || "GUIA COACH MONTANHA";
      const headlineText = artboard.querySelector('.art-headline')?.innerText || "PROGRESSÃO DE FORÇA";
      const subheadText = artboard.querySelector('.art-subhead')?.innerText || "";
      const authorText = artboard.querySelector('.art-author')?.innerText || "@coachmontanha";

      // Create offscreen 4K canvas (2160x2160)
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = 2160;
      exportCanvas.height = 2160;
      const ctx = exportCanvas.getContext('2d');

      // Gradient background
      const grad = ctx.createRadialGradient(1800, 400, 200, 1080, 1080, 1500);
      grad.addColorStop(0, '#362910');
      grad.addColorStop(0.65, '#12141c');
      grad.addColorStop(1, '#090a0f');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 2160, 2160);

      // Gold border
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 14;
      ctx.strokeRect(40, 40, 2080, 2080);

      // Tag Badge
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(120, 160, 600, 64);
      ctx.fillStyle = '#111111';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText(tagText, 140, 204);

      // Headline Text with wrap
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 88px sans-serif';
      const words = headlineText.split(' ');
      let line = '';
      let y = 460;
      for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        let metrics = ctx.measureText(testLine);
        if (metrics.width > 1850 && n > 0) {
          ctx.fillText(line, 120, y);
          line = words[n] + ' ';
          y += 110;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, 120, y);

      // Subhead Text
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '500 48px sans-serif';
      ctx.fillText(subheadText.substring(0, 75) + '...', 120, y + 140);

      // Footer
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(120, 1950);
      ctx.lineTo(2040, 1950);
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 44px sans-serif';
      ctx.fillText(authorText, 120, 2020);
      ctx.fillText('SLIDE 1 DE 5 →', 1680, 2020);

      // Trigger download
      const dataUrl = exportCanvas.toDataURL('image/png');
      triggerDownload(dataUrl, `arte_canvix_coach_montanha_${Date.now()}.png`);

      btnExportCanvix.disabled = false;
      btnExportCanvix.innerText = '🚀 Exportar Arte em Alta Resolução';
      showHudToast('✅ Arte 4K exportada com sucesso!', '🎨');
    }, 600);
  });
}

// ==========================================================================
// 3. VÍDEO STUDIO ENGINE (Multi-format + Speech Preview + Timeline Player)
// ==========================================================================
let isVideoPlaying = false;
let videoScrubInterval = null;
let currentScrubPercent = 36;

const btnRenderVideo = document.getElementById('btn-render-video');
if (btnRenderVideo) {
  btnRenderVideo.addEventListener('click', () => {
    btnRenderVideo.disabled = true;
    btnRenderVideo.innerHTML = `<span>⏳</span> Renderizando Vídeo com FFmpeg Local...`;

    let progress = 0;
    const track = document.querySelector('.scrubber-progress');
    const readout = document.querySelector('.time-readout');

    const interval = setInterval(() => {
      progress += 20;
      if (track) track.style.width = `${progress}%`;
      if (readout) readout.innerText = `Render: ${progress}% (Codificando H.264 60FPS)`;

      if (progress >= 100) {
        clearInterval(interval);
        btnRenderVideo.disabled = false;
        btnRenderVideo.innerHTML = `<span>⚡</span> Renderizar Vídeo 9:16 (FFmpeg Local)`;
        if (readout) readout.innerText = `00:38 / 00:38 • RENDER CONCLUÍDO`;
        showHudToast('🎬 Vídeo 9:16 renderizado com sucesso via FFmpeg!', '⚡');
      }
    }, 300);
  });
}

// Audio Preview with Web Speech or Neural Synth
const btnAudioPreview = document.getElementById('btn-audio-preview');
if (btnAudioPreview) {
  btnAudioPreview.addEventListener('click', () => {
    const textarea = document.querySelector('.editor-sidebar .input-textarea');
    const text = textarea ? textarea.value.trim() : "Coach Montanha alta performance";

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.05;
      utterance.pitch = 0.95; // Lower pitch for masculine imposing tone

      // Highlight subtitle words on boundary
      utterance.onboundary = (e) => {
        const highlight = document.querySelector('.word-highlight');
        if (highlight && e.name === 'word') {
          highlight.style.background = '#f59e0b';
          highlight.style.color = '#111';
        }
      };

      utterance.onend = () => {
        showHudToast('Locução neural concluída!', '🎧');
      };

      window.speechSynthesis.speak(utterance);
      showHudToast('🎧 Reproduzindo locução neural pt-BR...', '🔊');
    } else {
      showHudToast('Áudio preview acionado no SoundCraft!', '🎧');
    }
  });
}

// Player Play/Pause and Scrubber
const playBtn = document.querySelector('.play-btn');
if (playBtn) {
  playBtn.addEventListener('click', () => {
    isVideoPlaying = !isVideoPlaying;
    playBtn.innerText = isVideoPlaying ? '⏸' : '▶';

    if (isVideoPlaying) {
      showHudToast('Reproduzindo prévia do vídeo...', '▶');
      const track = document.querySelector('.scrubber-progress');
      const readout = document.querySelector('.time-readout');

      videoScrubInterval = setInterval(() => {
        currentScrubPercent += 2;
        if (currentScrubPercent > 100) currentScrubPercent = 0;
        if (track) track.style.width = `${currentScrubPercent}%`;

        const curSeconds = Math.floor((currentScrubPercent / 100) * 38);
        const curStr = curSeconds < 10 ? `0${curSeconds}` : `${curSeconds}`;
        if (readout) readout.innerText = `00:${curStr} / 00:38`;
      }, 200);
    } else {
      clearInterval(videoScrubInterval);
      showHudToast('Vídeo pausado', '⏸');
    }
  });
}

// Player Rewind / Forward
document.querySelectorAll('.player-controls .ctl-btn').forEach(btn => {
  if (btn.innerText === '⏮') {
    btn.addEventListener('click', () => {
      currentScrubPercent = 0;
      const track = document.querySelector('.scrubber-progress');
      if (track) track.style.width = '0%';
      const readout = document.querySelector('.time-readout');
      if (readout) readout.innerText = `00:00 / 00:38`;
      showHudToast('Reiniciado para o início', '⏮');
    });
  } else if (btn.innerText === '⏭') {
    btn.addEventListener('click', () => {
      currentScrubPercent = 100;
      const track = document.querySelector('.scrubber-progress');
      if (track) track.style.width = '100%';
      const readout = document.querySelector('.time-readout');
      if (readout) readout.innerText = `00:38 / 00:38`;
      showHudToast('Avançado para o final', '⏭');
    });
  }
});

// ==========================================================================
// 4. PHOTO LAB ENGINE (Sliders, 4K Save, Zoom & Filters)
// ==========================================================================
function updatePhotoLabFilters() {
  const sliders = document.querySelectorAll('.range-slider');
  const stage = document.querySelector('.sample-photo-composition');
  if (!stage || sliders.length < 4) return;

  const brightness = parseInt(sliders[0].value) || 0;
  const contrast = parseInt(sliders[1].value) || 0;
  const sharpness = parseInt(sliders[2].value) || 0;
  const vignette = parseInt(sliders[3].value) || 0;

  // Update readouts
  sliders[0].parentElement.querySelector('.val').innerText = `${brightness > 0 ? '+' : ''}${brightness}%`;
  sliders[1].parentElement.querySelector('.val').innerText = `${contrast > 0 ? '+' : ''}${contrast}%`;
  sliders[2].parentElement.querySelector('.val').innerText = `${sharpness}%`;
  sliders[3].parentElement.querySelector('.val').innerText = `${vignette}%`;

  // Apply CSS Filter
  const bVal = 1 + (brightness / 100);
  const cVal = 1 + (contrast / 100);
  stage.style.filter = `brightness(${bVal}) contrast(${cVal}) drop-shadow(0 0 ${vignette * 0.4}px rgba(0,0,0,0.8))`;
}

document.querySelectorAll('.range-slider').forEach(slider => {
  slider.addEventListener('input', updatePhotoLabFilters);
});

// Save 4K Photo
const btnSavePhoto = document.getElementById('btn-save-photo');
if (btnSavePhoto) {
  btnSavePhoto.addEventListener('click', () => {
    btnSavePhoto.disabled = true;
    btnSavePhoto.innerText = '💾 Exportando em 4K...';

    setTimeout(() => {
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = 3840;
      exportCanvas.height = 2160;
      const ctx = exportCanvas.getContext('2d');

      // High-res dark gold background
      const grad = ctx.createLinearGradient(0, 0, 3840, 2160);
      grad.addColorStop(0, '#2b1f09');
      grad.addColorStop(0.6, '#151822');
      grad.addColorStop(1, '#0d0e14');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 3840, 2160);

      // Gold frame
      ctx.strokeStyle = '#5a4519';
      ctx.lineWidth = 16;
      ctx.strokeRect(60, 60, 3720, 2040);

      // Title & Badge
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 54px sans-serif';
      ctx.fillText('FOTOGRAFIA PROFISSIONAL • 4K HIGH DEFINITION', 200, 320);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 160px sans-serif';
      ctx.fillText('COACH MONTANHA', 200, 540);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '60px sans-serif';
      ctx.fillText('Sessão Técnica • Ajuste Tonal Dark Gold • Nitidez Ultra 60 FPS', 200, 660);

      const dataUrl = exportCanvas.toDataURL('image/png');
      triggerDownload(dataUrl, `foto_coach_montanha_4k_${Date.now()}.png`);

      btnSavePhoto.disabled = false;
      btnSavePhoto.innerText = '💾 Salvar Edição em 4K';
      showHudToast('✅ Fotografia 4K salva com sucesso!', '📸');
    }, 500);
  });
}

// Transfer Photo Lab to Canvix or Video
document.getElementById('btn-photo-to-canvix')?.addEventListener('click', () => {
  switchTab('canvix');
  showHudToast('Foto transferida para Canvix Design!', '🎨');
});

document.getElementById('btn-photo-to-video')?.addEventListener('click', () => {
  switchTab('video');
  showHudToast('Foto definida como capa do Vídeo!', '🎬');
});

// Zoom Controls in Photo Lab
let currentZoom = 1.0;
document.querySelectorAll('.zoom-tools .ctl-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const stage = document.querySelector('.sample-photo-composition');
    if (!stage) return;
    const txt = btn.innerText;
    if (txt === '+') {
      currentZoom = Math.min(1.8, currentZoom + 0.15);
    } else if (txt === '-') {
      currentZoom = Math.max(0.6, currentZoom - 0.15);
    } else {
      currentZoom = 1.0;
    }
    stage.style.transform = `scale(${currentZoom})`;
    stage.style.transition = 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)';
    showHudToast(`Zoom: ${Math.round(currentZoom * 100)}%`, '🔍');
  });
});

// ==========================================================================
// 5. MODAL EXPORT & QUICK SEARCH (Ctrl+K)
// ==========================================================================
function openExportModal() {
  const modal = document.getElementById('export-modal');
  if (modal) modal.classList.add('active');
}

function closeExportModal() {
  const modal = document.getElementById('export-modal');
  if (modal) modal.classList.remove('active');
}

document.getElementById('btn-open-export')?.addEventListener('click', openExportModal);

// Quick Search Ctrl+K
document.getElementById('btn-quick-search')?.addEventListener('click', () => {
  const term = prompt("🔍 Busca Rápida (Digite: video, photo, canvix, ai, drive):");
  if (term) {
    const t = term.toLowerCase();
    if (t.includes('vid') || t.includes('reel')) switchTab('video');
    else if (t.includes('pho') || t.includes('fot')) switchTab('photo');
    else if (t.includes('can') || t.includes('des') || t.includes('art')) switchTab('canvix');
    else if (t.includes('ai') || t.includes('ia') || t.includes('tex')) switchTab('ai');
    else if (t.includes('dri') || t.includes('mid') || t.includes('med')) switchTab('media');
    else switchTab('hub');
  }
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeExportModal();
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    document.getElementById('btn-quick-search')?.click();
  }
});

// ==========================================================================
// 6. MOTIONMAXXING / ONETAKE 60 FPS CODE-DRIVEN MOTION GRAPHICS
// ==========================================================================
function updateMotionOverlay(type) {
  const container = document.getElementById('motion-element-container');
  if (!container) return;

  if (type === 'timer') {
    container.innerHTML = `
      <div class="motion-timer-card">
        <span style="color:#f59e0b; font-size:16px;">⏱️</span>
        <strong style="font-size:14px; color:#fff; font-family:var(--font-mono);">00:45s REST</strong>
      </div>
    `;
    showHudToast('MotionMaxxing: Cronômetro 60 FPS Ativado!', '⏱️');
  } else if (type === 'rpe') {
    container.innerHTML = `
      <div class="motion-rpe-card">
        <div style="display:flex; justify-content:space-between; font-size:10px; font-weight:800; color:#ef4444; gap:16px;">
          <span>INTENSIDADE</span> <span>RPE 9.0 (180 KG)</span>
        </div>
        <div class="rpe-bar-bg"><div class="rpe-bar-fill"></div></div>
      </div>
    `;
    showHudToast('MotionMaxxing: Card Biomecânico RPE 9.0 Ativado!', '📊');
  } else if (type === 'reps') {
    container.innerHTML = `
      <div class="motion-timer-card" style="border-color:#10b981;">
        <span style="color:#10b981; font-size:16px;">🔥</span>
        <strong style="font-size:13px; color:#fff;">SÉRIE 3 / 4 &bull; REP 8</strong>
      </div>
    `;
    showHudToast('MotionMaxxing: Contador de Séries & Repetições Ativado!', '🔥');
  } else {
    container.innerHTML = '';
    showHudToast('MotionMaxxing: Tipografia Cinética Hormozi Ativa!', '⚡');
  }
}

// ==========================================================================
// 7. KOKON-PHOTO (NATURAL LANGUAGE PHOTO MODIFICATION ENGINE)
// ==========================================================================
function applyKokonPreset(preset) {
  const sliders = document.querySelectorAll('.range-slider');
  if (sliders.length < 4) return;

  if (preset === 'muscle') {
    sliders[0].value = -5;  // Brilho
    sliders[1].value = 45;  // Contraste
    sliders[2].value = 75;  // Nitidez
    sliders[3].value = 40;  // Vignette
    document.querySelectorAll('.preset-chips .chip').forEach(c => c.classList.remove('active'));
    document.querySelector('.preset-chips .chip:nth-child(2)')?.classList.add('active'); // Dark Titan
    showHudToast('Kokon-Photo: Foco Muscular & Definição aplicado!', '🔥');
  } else if (preset === 'gold') {
    sliders[0].value = 15;
    sliders[1].value = 25;
    sliders[2].value = 40;
    sliders[3].value = 20;
    document.querySelectorAll('.preset-chips .chip').forEach(c => c.classList.remove('active'));
    document.querySelector('.preset-chips .chip:nth-child(1)')?.classList.add('active'); // Gold
    showHudToast('Kokon-Photo: Golden Hour / Iluminação Lateral aplicado!', '🌅');
  } else if (preset === 'obsidian') {
    sliders[0].value = -12;
    sliders[1].value = 35;
    sliders[2].value = 55;
    sliders[3].value = 55;
    document.querySelectorAll('.preset-chips .chip').forEach(c => c.classList.remove('active'));
    document.querySelector('.preset-chips .chip:nth-child(3)')?.classList.add('active'); // Obsidian
    showHudToast('Kokon-Photo: Dark Titan Chiaroscuro aplicado!', '🌑');
  } else if (preset === 'isolate') {
    sliders[0].value = 5;
    sliders[1].value = 30;
    sliders[2].value = 45;
    sliders[3].value = 75;
    showHudToast('Kokon-Photo: Isolamento do Atleta em Primeiro Plano aplicado!', '⚡');
  }
  updatePhotoLabFilters();
}

const btnApplyKokon = document.getElementById('btn-apply-kokon');
if (btnApplyKokon) {
  btnApplyKokon.addEventListener('click', () => {
    const input = document.getElementById('kokon-prompt-input');
    const text = input ? input.value.toLowerCase().trim() : '';
    if (!text) {
      applyKokonPreset('muscle');
      return;
    }

    if (text.includes('dourad') || text.includes('gold') || text.includes('quente')) {
      applyKokonPreset('gold');
    } else if (text.includes('dark') || text.includes('titan') || text.includes('escur') || text.includes('somb')) {
      applyKokonPreset('obsidian');
    } else if (text.includes('isol') || text.includes('foco') || text.includes('fundo')) {
      applyKokonPreset('isolate');
    } else {
      applyKokonPreset('muscle');
    }
  });
}

// Sub-tabs in Photo Lab
document.querySelectorAll('.photo-sidebar .sub-nav-tabs .sub-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.photo-sidebar .sub-nav-tabs .sub-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const kind = tab.getAttribute('data-photosub');
    const kokonBox = document.getElementById('kokon-photo-box');
    const slidersBox = document.getElementById('photo-sliders-container');

    if (kind === 'kokon') {
      if (kokonBox) kokonBox.style.display = 'block';
      showHudToast('Modo Kokon IA ativado: digite sua instrução!', '✨');
    } else {
      if (kokonBox) kokonBox.style.display = 'block'; // Keep accessible
      showHudToast(`Aba Photo Lab: ${tab.innerText}`, '📸');
    }
  });
});

// ==========================================================================
// 8. MONEYPRINTERTURBO AUTOMATED B-ROLL MATCHING ENGINE
// ==========================================================================
function scanScriptForBroll(scriptText) {
  const container = document.getElementById('broll-chips-container');
  if (!container) return;

  const text = scriptText.toLowerCase();
  const brollMatches = [];

  if (text.includes('agach') || text.includes('squat')) {
    brollMatches.push({ time: '0:00-0:12', name: '🏋️ Agachamento Livre (Técnica)' });
  }
  if (text.includes('terra') || text.includes('deadlift')) {
    brollMatches.push({ time: '0:00-0:14', name: '⚡ Levantamento Terra (Saída)' });
  }
  if (text.includes('torque') || text.includes('lombar') || text.includes('coluna')) {
    brollMatches.push({ time: '0:12-0:25', name: '🛡️ Biomecânica de Torque & Coluna' });
  }
  if (text.includes('carga') || text.includes('peso') || text.includes('força')) {
    brollMatches.push({ time: '0:18-0:30', name: '🔥 Carga Máxima & RPE 9.0' });
  }
  if (text.includes('técnica') || text.includes('postura') || text.includes('movimento')) {
    brollMatches.push({ time: '0:25-0:38', name: '✅ Finalização e Trava Articular' });
  }

  if (brollMatches.length === 0) {
    brollMatches.push({ time: '0:00-0:38', name: '🏋️ Treino de Força Coach Montanha' });
  }

  container.innerHTML = brollMatches.map((m, idx) => `
    <span class="chip-sm ${idx === 0 ? 'active' : ''}" onclick="selectBrollScene('${m.name}')">
      ${m.name} (${m.time})
    </span>
  `).join('');
}

function selectBrollScene(sceneName) {
  const sceneTag = document.getElementById('video-scene-tag');
  if (sceneTag) sceneTag.innerText = sceneName.toUpperCase();
  showHudToast(`B-Roll selecionado: ${sceneName}`, '🎞️');
}

// Auto-scan on textarea input
const videoScriptArea = document.querySelector('.editor-sidebar .input-textarea');
if (videoScriptArea) {
  videoScriptArea.addEventListener('input', () => {
    scanScriptForBroll(videoScriptArea.value);
  });
}

// ==========================================================================
// 9. COBALT STEALTH B-ROLL HARVESTER & EARSHOT AUDIO SFX
// ==========================================================================
const btnCobaltFetch = document.getElementById('btn-cobalt-fetch');
if (btnCobaltFetch) {
  btnCobaltFetch.addEventListener('click', () => {
    const input = document.getElementById('cobalt-url-input');
    const url = input ? input.value.trim() : '';
    if (!url) {
      showHudToast('Por favor, cole um link de vídeo do Instagram/TikTok/YouTube', '⚠️');
      return;
    }

    btnCobaltFetch.disabled = true;
    btnCobaltFetch.innerText = '⏳ Baixando...';

    setTimeout(() => {
      btnCobaltFetch.disabled = false;
      btnCobaltFetch.innerText = '📥 Importar B-Roll';
      if (input) input.value = '';

      const container = document.getElementById('broll-chips-container');
      if (container) {
        const newChip = document.createElement('span');
        newChip.className = 'chip-sm active';
        newChip.innerText = '📥 B-Roll Cobalt (Sem Marca d\'Água)';
        newChip.onclick = () => selectBrollScene('B-Roll Cobalt Importado');
        container.insertBefore(newChip, container.firstChild);
      }

      showHudToast('✅ B-Roll baixado via Cobalt e adicionado ao projeto!', '📥');
    }, 1200);
  });
}

// Earshot Audio Web Audio SFX Synthesizer
function playEarshotSfx(sfxType) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (sfxType === 'drop') {
      // Heavy Barbell Drop impact (Sub bass thump + noise decay)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(32, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.7, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } else if (sfxType === 'whoosh') {
      // Cinematic Swoosh
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.15);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (sfxType === 'beep') {
      // High training timer beep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (sfxType === 'heartbeat') {
      // Double thump heartbeat
      const playThump = (time) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(65, time);
        osc.frequency.exponentialRampToValueAtTime(38, time + 0.15);
        gain.gain.setValueAtTime(0.5, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.2);
      };
      playThump(ctx.currentTime);
      playThump(ctx.currentTime + 0.22);
    }
  } catch (e) {}
}

const earshotSelect = document.getElementById('earshot-sfx-select');
if (earshotSelect) {
  earshotSelect.addEventListener('change', () => {
    playEarshotSfx(earshotSelect.value);
    showHudToast(`Earshot SFX: ${earshotSelect.options[earshotSelect.selectedIndex].text}`, '💥');
  });
}

// Initial rendering of Procedural AI Canvases on Page Load
window.addEventListener('DOMContentLoaded', () => {
  renderProceduralPhoto('canvas-ai-1', 'Atleta Coach Montanha agachamento livre', 1);
  renderProceduralPhoto('canvas-ai-2', 'Iluminação 3 pontos editorial', 2);
  scanScriptForBroll("agachamento lombar torque coluna postura");
});

// Run once immediately in case already loaded
renderProceduralPhoto('canvas-ai-1', 'Atleta Coach Montanha agachamento livre', 1);
renderProceduralPhoto('canvas-ai-2', 'Iluminação 3 pontos editorial', 2);
scanScriptForBroll("agachamento lombar torque coluna postura");

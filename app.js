// MONTANHA CREATIVE SUITE PRO — IMPECCABLE INTERACTION SCRIPT

function showHudToast(message, icon = "⚡") {
  let toast = document.getElementById('hud-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'hud-toast';
    toast.className = 'hud-toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<span style="color:#f59e0b;">${icon}</span> <span>${message}</span>`;
  toast.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
}

function switchTab(viewId) {
  // Update Tab buttons
  document.querySelectorAll('.nav-tab').forEach(tab => {
    if (tab.getAttribute('data-view') === viewId) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  // Update View Panels
  document.querySelectorAll('.view-panel').forEach(panel => {
    if (panel.id === `view-${viewId}`) {
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  });

  // Soundless visual feedback
  const titles = {
    hub: "Visão Geral",
    video: "Vídeo Studio",
    photo: "Photo Lab",
    canvix: "Canvix Design",
    ai: "AI Text-to-Photo",
    media: "Central de Mídias"
  };
  if (titles[viewId]) {
    showHudToast(`Módulo: ${titles[viewId]} carregado`, "📁");
  }
}

// Attach event listeners to tabs
document.querySelectorAll('.nav-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const view = tab.getAttribute('data-view');
    switchTab(view);
  });
});

// Modifiers Helper for AI Prompt
function addModifier(modifierText) {
  const textarea = document.getElementById('ai-prompt-input');
  if (textarea) {
    if (!textarea.value.includes(modifierText)) {
      textarea.value = textarea.value.trim() + ' ' + modifierText;
    }
    textarea.focus();
    showHudToast(`Modificador ${modifierText} adicionado`, "✨");
  }
}

// Dynamic Aspect Ratio Switcher for Video Preview
function updateVideoMockupFormat(fmt) {
  const frame = document.querySelector('.video-mockup-frame');
  const resBadge = document.querySelector('.video-mockup-frame .badge-pill:first-child');
  if (!frame) return;

  if (fmt === '9:16') {
    frame.style.width = '340px';
    frame.style.height = '604px';
    if (resBadge) resBadge.innerText = 'RESOLUÇÃO: 1080x1920 (9:16 REELS)';
    showHudToast('Formato alterado: 9:16 Vertical (Reels/Shorts)', '📱');
  } else if (fmt === '4:5') {
    frame.style.width = '380px';
    frame.style.height = '475px';
    if (resBadge) resBadge.innerText = 'RESOLUÇÃO: 1080x1350 (4:5 FEED)';
    showHudToast('Formato alterado: 4:5 Retrato Feed Instagram', '📸');
  } else if (fmt === '1:1') {
    frame.style.width = '440px';
    frame.style.height = '440px';
    if (resBadge) resBadge.innerText = 'RESOLUÇÃO: 1080x1080 (1:1 FEED)';
    showHudToast('Formato alterado: 1:1 Quadrado Feed', '⏹️');
  } else if (fmt === '16:9') {
    frame.style.width = '640px';
    frame.style.height = '360px';
    if (resBadge) resBadge.innerText = 'RESOLUÇÃO: 1920x1080 (16:9 WIDE)';
    showHudToast('Formato alterado: 16:9 Widescreen YouTube', '🖥️');
  } else if (fmt === '21:9') {
    frame.style.width = '700px';
    frame.style.height = '300px';
    if (resBadge) resBadge.innerText = 'RESOLUÇÃO: 2560x1080 (21:9 CINEMA)';
    showHudToast('Formato alterado: 21:9 Ultra-Wide Cinema', '🎬');
  }
}

// Canvix Format Switcher
document.querySelectorAll('.fmt-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.fmt-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const artboard = document.querySelector('.canvix-artboard');
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

// Interactive Filter Chips in Photo Lab
document.querySelectorAll('.preset-chips .chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.preset-chips .chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    const stage = document.querySelector('.sample-photo-composition');
    const compTitle = document.querySelector('.comp-title');
    const compBadge = document.querySelector('.comp-badge');
    
    if (stage) {
      if (chip.innerText.includes('Cinematic Gold')) {
        stage.style.background = 'linear-gradient(135deg, #2b1f09 0%, #151822 60%, #0d0e14 100%)';
        stage.style.borderColor = '#5a4519';
        if (compBadge) compBadge.innerText = 'FILTRO CINEMATIC GOLD • 4K PRO';
      } else if (chip.innerText.includes('Dark Titan')) {
        stage.style.background = 'linear-gradient(135deg, #1a1a24 0%, #0a0b0e 100%)';
        stage.style.borderColor = '#3b4259';
        if (compBadge) compBadge.innerText = 'FILTRO DARK TITAN • ALTO CONTRASTE';
      } else if (chip.innerText.includes('Obsidian')) {
        stage.style.background = 'linear-gradient(135deg, #0f1015 0%, #050508 100%)';
        stage.style.borderColor = '#252836';
        if (compBadge) compBadge.innerText = 'FILTRO OBSIDIAN HIGH • P&B PROFUNDO';
      } else if (chip.innerText.includes('Pure Crisp')) {
        stage.style.background = 'linear-gradient(135deg, #1b263b 0%, #0d1b2a 100%)';
        stage.style.borderColor = '#415a77';
        if (compBadge) compBadge.innerText = 'FILTRO PURE CRISP • ULTRA NITIDEZ';
      }
    }
    showHudToast(`Filtro ${chip.innerText} aplicado com sucesso!`, '📸');
  });
});

// Modal handling
function openExportModal() {
  const modal = document.getElementById('export-modal');
  if (modal) modal.classList.add('active');
}

function closeExportModal() {
  const modal = document.getElementById('export-modal');
  if (modal) modal.classList.remove('active');
}

document.getElementById('btn-open-export')?.addEventListener('click', openExportModal);

// Close modal on Escape key
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeExportModal();
});

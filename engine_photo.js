/**
 * Montanha Photo Lab — Engine Gráfica Clean-Room Pro
 * Filtros Cinematográficos e Estilo Redes Sociais (Instagram LUTs), Colagens Interativas,
 * Combinador Avançado, Módulo de Impressão em Alta Resolução (3x4, 5x7cm, A4) e 9-Slice.
 */

const PhotoEngine = {
  // ==========================================
  // 1. FILTROS CINEMATOGRÁFICOS & INSTAGRAM LUTS
  // ==========================================
  FILM_PRESETS: {
    // 0. Básico
    normal: { name: 'Normal / Original', category: 'all', icon: '✨', params: { brightness: 0, contrast: 0, saturation: 0, tint: 0, temp: 0, vignette: 0, sepia: 0, grayscale: 0, bloom: 0, gamma: 1.0 } },
    
    // 1. Instagram LUTs & Redes Sociais
    clarendon: { name: 'Clarendon (Vibrante)', category: 'insta', icon: '☀️', params: { brightness: 0.06, contrast: 0.28, saturation: 0.25, temp: -0.06, tint: 0.04, vignette: 0.15 } },
    gingham: { name: 'Gingham (Vintage)', category: 'insta', icon: '🌾', params: { brightness: 0.08, contrast: -0.12, saturation: -0.20, temp: 0.05, tint: -0.02, sepia: 0.15, vignette: 0.10 } },
    juno: { name: 'Juno (Dourado Quente)', category: 'insta', icon: '🌅', params: { brightness: 0.04, contrast: 0.22, saturation: 0.30, temp: 0.20, tint: -0.05, vignette: 0.12 } },
    lark: { name: 'Lark (Luminoso Clean)', category: 'insta', icon: '💡', params: { brightness: 0.10, contrast: 0.10, saturation: 0.15, temp: -0.08, tint: 0.02, vignette: 0.05 } },
    reyes: { name: 'Reyes (Suave Nostálgico)', category: 'insta', icon: '🏜️', params: { brightness: 0.12, contrast: -0.18, saturation: -0.25, temp: 0.14, tint: 0.02, sepia: 0.10 } },
    slumber: { name: 'Slumber (Aconchegante)', category: 'insta', icon: '🍂', params: { brightness: 0.02, contrast: -0.08, saturation: -0.22, temp: 0.16, tint: 0.08, vignette: 0.25 } },
    crema: { name: 'Crema (Tom Pastel)', category: 'insta', icon: '☕', params: { brightness: 0.05, contrast: 0.08, saturation: -0.10, temp: 0.08, tint: -0.04, vignette: 0.12 } },
    valencia: { name: 'Valencia (Âmbar 90s)', category: 'insta', icon: '🌆', params: { brightness: 0.04, contrast: 0.12, saturation: 0.10, temp: 0.24, tint: 0.06, sepia: 0.20, vignette: 0.18 } },
    moon: { name: 'Moon (P&B Instagram)', category: 'insta', icon: '🌙', params: { brightness: 0.06, contrast: -0.05, saturation: -1.0, grayscale: 1.0, vignette: 0.15 } },

    // 2. Filmes Analógicos Famosos
    velvia: { name: 'Fuji Velvia 50 (Vívido)', category: 'film', icon: '🟢', params: { brightness: 0.05, contrast: 0.30, saturation: 0.45, temp: 0.08, tint: -0.05, vignette: 0.15 } },
    portra: { name: 'Kodak Portra 400 (Pele)', category: 'film', icon: '🧑', params: { brightness: 0.06, contrast: -0.06, saturation: -0.05, temp: 0.18, tint: 0.06, vignette: 0.10 } },
    cinema: { name: 'Teal & Orange Cinema', category: 'film', icon: '🎬', params: { brightness: 0.0, contrast: 0.34, saturation: 0.24, temp: 0.25, tint: -0.20, vignette: 0.30 } },
    crossprocess: { name: 'Cross Process Retrô', category: 'film', icon: '🧪', params: { brightness: 0.08, contrast: 0.36, saturation: 0.30, temp: -0.22, tint: 0.25, vignette: 0.25 } },
    sepia: { name: 'Sépia Clássico 1900', category: 'film', icon: '🏛️', params: { brightness: 0.04, contrast: 0.12, saturation: -0.70, temp: 0.40, tint: 0.15, sepia: 0.85, vignette: 0.35 } },

    // 3. Efeitos Artísticos & P&B
    grayscale: { name: 'P&B Prata Profundo', category: 'effect', icon: '💎', params: { brightness: 0.02, contrast: 0.30, saturation: -1.0, grayscale: 1.0, vignette: 0.20 } },
    bloom: { name: 'Glow / Bloom Sonhador', category: 'effect', icon: '✨', params: { brightness: 0.10, contrast: -0.05, saturation: 0.12, bloom: 0.50, vignette: 0.10 } },
    invert: { name: 'Negativo Fotográfico', category: 'effect', icon: '🔄', params: { invert: 1.0 } }
  },

  applyAdjustments: function(srcCanvas, options = {}) {
    const dst = document.createElement('canvas');
    dst.width = srcCanvas.width;
    dst.height = srcCanvas.height;
    const ctx = dst.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(srcCanvas, 0, 0);

    const imgData = ctx.getImageData(0, 0, dst.width, dst.height);
    const data = imgData.data;
    const len = data.length;

    const b = options.brightness || 0;
    const c = options.contrast || 0;
    const s = options.saturation || 0;
    const temp = options.temp || 0;
    const tint = options.tint || 0;
    const sepiaVal = options.sepia || 0;
    const grayVal = options.grayscale || 0;
    const invVal = options.invert || 0;
    const vignetteVal = options.vignette || 0;
    const gamma = options.gamma !== undefined ? options.gamma : 1.0;

    const factor = (259 * (c * 255 + 255)) / (255 * (259 - c * 255));
    const width = dst.width;
    const height = dst.height;
    const cx = width / 2;
    const cy = height / 2;
    const maxDist = Math.sqrt(cx * cx + cy * cy);

    // Pré-calcula tabela Gama se diferente de 1.0
    const gammaLUT = new Uint8Array(256);
    if (gamma !== 1.0 && gamma > 0) {
      const invGamma = 1.0 / gamma;
      for (let i = 0; i < 256; i++) {
        gammaLUT[i] = Math.min(255, Math.max(0, Math.round(255 * Math.pow(i / 255, invGamma))));
      }
    }

    for (let i = 0; i < len; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let bVal = data[i + 2];

      if (invVal > 0) {
        r = 255 - r; g = 255 - g; bVal = 255 - bVal;
      }
      if (b !== 0) {
        const delta = b * 255;
        r += delta; g += delta; bVal += delta;
      }
      if (c !== 0) {
        r = factor * (r - 128) + 128;
        g = factor * (g - 128) + 128;
        bVal = factor * (bVal - 128) + 128;
      }
      if (temp !== 0) {
        r += temp * 30; bVal -= temp * 30;
      }
      if (tint !== 0) {
        g -= tint * 25; r += tint * 15;
      }

      // Saturação / Monocromático
      const lum = 0.299 * r + 0.587 * g + 0.114 * bVal;
      if (grayVal > 0) {
        r = r * (1 - grayVal) + lum * grayVal;
        g = g * (1 - grayVal) + lum * grayVal;
        bVal = bVal * (1 - grayVal) + lum * grayVal;
      } else if (s !== 0) {
        r = lum + (r - lum) * (1 + s);
        g = lum + (g - lum) * (1 + s);
        bVal = lum + (bVal - lum) * (1 + s);
      }

      if (sepiaVal > 0) {
        const sr = (r * 0.393) + (g * 0.769) + (bVal * 0.189);
        const sg = (r * 0.349) + (g * 0.686) + (bVal * 0.168);
        const sb = (r * 0.272) + (g * 0.534) + (bVal * 0.131);
        r = r * (1 - sepiaVal) + sr * sepiaVal;
        g = g * (1 - sepiaVal) + sg * sepiaVal;
        bVal = bVal * (1 - sepiaVal) + sb * sepiaVal;
      }

      // Correção Gama
      if (gamma !== 1.0 && gamma > 0) {
        r = gammaLUT[Math.min(255, Math.max(0, Math.round(r)))];
        g = gammaLUT[Math.min(255, Math.max(0, Math.round(g)))];
        bVal = gammaLUT[Math.min(255, Math.max(0, Math.round(bVal)))];
      }

      if (vignetteVal > 0) {
        const px = (i / 4) % width;
        const py = Math.floor((i / 4) / width);
        const dist = Math.sqrt((px - cx) * (px - cx) + (py - cy) * (py - cy));
        const norm = dist / maxDist;
        if (norm > 0.4) {
          const vig = 1 - Math.pow((norm - 0.4) / 0.6, 2) * vignetteVal;
          r *= vig; g *= vig; bVal *= vig;
        }
      }

      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, bVal));
    }

    ctx.putImageData(imgData, 0, 0);

    if (options.bloom && options.bloom > 0) {
      const bloomCanvas = document.createElement('canvas');
      bloomCanvas.width = dst.width;
      bloomCanvas.height = dst.height;
      const bCtx = bloomCanvas.getContext('2d');
      bCtx.filter = `blur(${Math.round(dst.width * 0.02)}px) brightness(1.2)`;
      bCtx.drawImage(dst, 0, 0);
      ctx.globalAlpha = options.bloom * 0.6;
      ctx.globalCompositeOperation = 'screen';
      ctx.drawImage(bloomCanvas, 0, 0);
      ctx.globalAlpha = 1.0;
      ctx.globalCompositeOperation = 'source-over';
    }

    return dst;
  },

  // ==========================================
  // 2. SISTEMA DE MOLDURAS 9-PATCH
  // ==========================================
  FRAME_PRESETS: {
    none: { name: 'Sem Moldura' },
    polaroid: { name: 'Polaroid Clássica', type: 'polaroid', borderTop: 24, borderLeft: 24, borderRight: 24, borderBottom: 80, bg: '#fdfbf7' },
    film_35mm: { name: 'Filme Negativo 35mm', type: 'film', borderTop: 44, borderLeft: 20, borderRight: 20, borderBottom: 44, bg: '#18181b' },
    antique: { name: 'Vintage Dourado', type: 'antique', border: 36, bg: '#27272a' },
    clean_white: { name: 'Borda Branca Fina', type: 'clean', border: 20, color: '#ffffff' },
    clean_black: { name: 'Galeria Preta', type: 'clean', border: 30, color: '#09090b' },
    neon_glow: { name: 'Neon Cyberpunk', type: 'neon', border: 18, color: '#06b6d4' }
  },

  applyFrame: function(srcCanvas, frameKey = 'none') {
    if (!frameKey || frameKey === 'none') return srcCanvas;
    const frame = this.FRAME_PRESETS[frameKey];
    if (!frame) return srcCanvas;

    const w = srcCanvas.width;
    const h = srcCanvas.height;

    if (frame.type === 'clean') {
      const b = Math.round(Math.max(w, h) * (frame.border / 1000));
      const dst = document.createElement('canvas');
      dst.width = w + b * 2;
      dst.height = h + b * 2;
      const ctx = dst.getContext('2d');
      ctx.fillStyle = frame.color;
      ctx.fillRect(0, 0, dst.width, dst.height);
      ctx.drawImage(srcCanvas, b, b);
      return dst;
    }

    if (frame.type === 'polaroid') {
      const scale = Math.max(w, h) / 800;
      const pt = Math.round(frame.borderTop * scale);
      const pl = Math.round(frame.borderLeft * scale);
      const pr = Math.round(frame.borderRight * scale);
      const pb = Math.round(frame.borderBottom * scale);

      const dst = document.createElement('canvas');
      dst.width = w + pl + pr;
      dst.height = h + pt + pb;
      const ctx = dst.getContext('2d');
      ctx.fillStyle = frame.bg;
      ctx.fillRect(0, 0, dst.width, dst.height);
      ctx.drawImage(srcCanvas, pl, pt);
      ctx.strokeStyle = 'rgba(0,0,0,0.08)';
      ctx.lineWidth = 1;
      ctx.strokeRect(pl, pt, w, h);
      return dst;
    }

    if (frame.type === 'film') {
      const scale = Math.max(w, h) / 900;
      const pt = Math.round(frame.borderTop * scale);
      const pl = Math.round(frame.borderLeft * scale);
      const pr = Math.round(frame.borderRight * scale);
      const pb = Math.round(frame.borderBottom * scale);

      const dst = document.createElement('canvas');
      dst.width = w + pl + pr;
      dst.height = h + pt + pb;
      const ctx = dst.getContext('2d');
      ctx.fillStyle = frame.bg;
      ctx.fillRect(0, 0, dst.width, dst.height);

      ctx.fillStyle = '#ffffff';
      const holeW = Math.round(18 * scale);
      const holeH = Math.round(12 * scale);
      const gap = Math.round(28 * scale);
      for (let x = gap; x < dst.width - gap; x += gap + holeW) {
        ctx.fillRect(x, Math.round(pt * 0.35), holeW, holeH);
        ctx.fillRect(x, dst.height - Math.round(pb * 0.35) - holeH, holeW, holeH);
      }
      ctx.drawImage(srcCanvas, pl, pt);
      return dst;
    }

    if (frame.type === 'neon') {
      const b = Math.round(Math.max(w, h) * 0.025);
      const dst = document.createElement('canvas');
      dst.width = w + b * 4;
      dst.height = h + b * 4;
      const ctx = dst.getContext('2d');
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, dst.width, dst.height);
      ctx.shadowColor = frame.color;
      ctx.shadowBlur = b * 1.5;
      ctx.strokeStyle = frame.color;
      ctx.lineWidth = Math.max(2, Math.round(b * 0.3));
      ctx.strokeRect(b * 1.5, b * 1.5, dst.width - b * 3, dst.height - b * 3);
      ctx.shadowBlur = 0;
      ctx.drawImage(srcCanvas, b * 2, b * 2);
      return dst;
    }

    if (frame.type === 'antique') {
      const b = Math.round(Math.max(w, h) * 0.04);
      const dst = document.createElement('canvas');
      dst.width = w + b * 2;
      dst.height = h + b * 2;
      const ctx = dst.getContext('2d');
      const grad = ctx.createLinearGradient(0, 0, dst.width, dst.height);
      grad.addColorStop(0, '#d97706');
      grad.addColorStop(0.3, '#fde68a');
      grad.addColorStop(0.7, '#b45309');
      grad.addColorStop(1, '#78350f');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, dst.width, dst.height);
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = Math.max(1, Math.round(b * 0.15));
      ctx.strokeRect(b * 0.4, b * 0.4, dst.width - b * 0.8, dst.height - b * 0.8);
      ctx.drawImage(srcCanvas, b, b);
      return dst;
    }

    return srcCanvas;
  },

  // ==========================================
  // 3. TEMPLATES DE COLAGEM
  // ==========================================
  COLLAGE_TEMPLATES: {
    'grid_1_top_2_down': {
      name: '1 Topo + 2 Abaixo',
      slots: [
        { x: 0, y: 0, w: 400, h: 220 },
        { x: 0, y: 220, w: 200, h: 180 },
        { x: 200, y: 220, w: 200, h: 180 }
      ]
    },
    'grid_2x2': {
      name: '4 Fotos (2x2 Clássico)',
      slots: [
        { x: 0, y: 0, w: 200, h: 200 }, { x: 200, y: 0, w: 200, h: 200 },
        { x: 0, y: 200, w: 200, h: 200 }, { x: 200, y: 200, w: 200, h: 200 }
      ]
    },
    'grid_1_plus_2': {
      name: '1 Destaque Esquerda + 2',
      slots: [
        { x: 0, y: 0, w: 260, h: 400 },
        { x: 260, y: 0, w: 140, h: 200 },
        { x: 260, y: 200, w: 140, h: 200 }
      ]
    },
    'grid_2_plus_1': {
      name: '2 Esquerda + 1 Destaque',
      slots: [
        { x: 0, y: 0, w: 140, h: 200 },
        { x: 0, y: 200, w: 140, h: 200 },
        { x: 140, y: 0, w: 260, h: 400 }
      ]
    },
    'grid_2x1_v': {
      name: '2 Lado a Lado (Vertical)',
      slots: [
        { x: 0, y: 0, w: 200, h: 400 }, { x: 200, y: 0, w: 200, h: 400 }
      ]
    },
    'grid_1x2_h': {
      name: '2 Empilhadas (Horizontal)',
      slots: [
        { x: 0, y: 0, w: 400, h: 200 }, { x: 0, y: 200, w: 400, h: 200 }
      ]
    },
    'grid_3x1': {
      name: '3 Fotos Verticais (Tira)',
      slots: [
        { x: 0, y: 0, w: 133, h: 400 }, { x: 133, y: 0, w: 134, h: 400 }, { x: 267, y: 0, w: 133, h: 400 }
      ]
    },
    'grid_3x3': {
      name: '9 Fotos (Mosaico 3x3)',
      slots: [
        { x: 0, y: 0, w: 133, h: 133 }, { x: 133, y: 0, w: 134, h: 133 }, { x: 267, y: 0, w: 133, h: 133 },
        { x: 0, y: 133, w: 133, h: 134 }, { x: 133, y: 133, w: 134, h: 134 }, { x: 267, y: 133, w: 133, h: 134 },
        { x: 0, y: 267, w: 133, h: 133 }, { x: 133, y: 267, w: 134, h: 133 }, { x: 267, y: 267, w: 133, h: 133 }
      ]
    }
  },

  getSlotRects: function(templateKey, targetW, targetH, padding = 16, gap = 12) {
    const tmpl = this.COLLAGE_TEMPLATES[templateKey] || this.COLLAGE_TEMPLATES['grid_1_top_2_down'];
    const availW = targetW - padding * 2;
    const availH = targetH - padding * 2;

    return tmpl.slots.map(slot => ({
      x: padding + (slot.x / 400) * availW + gap / 2,
      y: padding + (slot.y / 400) * availH + gap / 2,
      w: (slot.w / 400) * availW - gap,
      h: (slot.h / 400) * availH - gap
    }));
  },

  renderInteractiveCollage: function(slotsData, templateKey, options = {}) {
    const targetW = options.width || 1200;
    const targetH = options.height || 1200;
    const padding = options.padding !== undefined ? options.padding : 16;
    const gap = options.gap !== undefined ? options.gap : 12;
    const radius = options.radius !== undefined ? options.radius : 8;
    const bgColor = options.bgColor || '#09090b';
    const selectedSlotIndex = options.selectedSlotIndex !== undefined ? options.selectedSlotIndex : -1;

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, targetW, targetH);

    const slotRects = this.getSlotRects(templateKey, targetW, targetH, padding, gap);

    slotRects.forEach((rect, idx) => {
      const slot = slotsData[idx] || {};
      const img = slot.image;

      ctx.save();

      if (radius > 0) {
        ctx.beginPath();
        ctx.roundRect(rect.x, rect.y, rect.w, rect.h, radius);
        ctx.clip();
      }

      if (img) {
        const zoom = slot.zoom || 1.0;
        const panX = slot.panX || 0;
        const panY = slot.panY || 0;
        const rot = slot.rotation || 0;

        const imgRatio = img.width / img.height;
        const slotRatio = rect.w / rect.h;
        let baseW, baseH;
        if (imgRatio > slotRatio) {
          baseH = rect.h;
          baseW = rect.h * imgRatio;
        } else {
          baseW = rect.w;
          baseH = rect.w / imgRatio;
        }

        const drawW = baseW * zoom;
        const drawH = baseH * zoom;
        const drawX = rect.x + (rect.w - drawW) / 2 + panX;
        const drawY = rect.y + (rect.h - drawH) / 2 + panY;

        ctx.save();
        if (rot !== 0) {
          const cx = rect.x + rect.w / 2;
          const cy = rect.y + rect.h / 2;
          ctx.translate(cx, cy);
          ctx.rotate((rot * Math.PI) / 180);
          ctx.translate(-cx, -cy);
        }

        if (slot.filter && slot.filter !== 'normal') {
          if (slot.filter === 'grayscale') ctx.filter = 'grayscale(100%)';
          else if (slot.filter === 'sepia') ctx.filter = 'sepia(80%)';
          else if (slot.filter === 'velvia') ctx.filter = 'saturate(160%) contrast(120%)';
        }

        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        ctx.restore();
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.font = `600 ${Math.round(Math.min(rect.w, rect.h) * 0.1)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`+ Arraste Foto ${idx + 1}`, rect.x + rect.w / 2, rect.y + rect.h / 2);
      }

      ctx.restore();

      if (idx === selectedSlotIndex) {
        ctx.strokeStyle = '#0ea5e9';
        ctx.lineWidth = 3;
        ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
      }
    });

    return canvas;
  },

  // ==========================================
  // 4. COMBINADOR DE ALTA FIDELIDADE
  // ==========================================
  combineImagesAdvanced: function(images, options = {}) {
    if (!images || images.length === 0) return null;

    const mode = options.mode || 'side';
    const cols = options.columns || 2;
    const outerMargin = options.outerMargin || 0;
    const interval = options.interval || 0;
    const round = options.round || 0;
    const marginColor = options.marginColor || '#09090b';
    const resizeRatio = (options.resizeRatio || 100) / 100;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (mode === 'side') {
      const targetHeight = Math.round(Math.min(...images.map(img => img.height)) * resizeRatio);
      const scaledWidths = images.map(img => Math.round((targetHeight / img.height) * img.width));
      const totalWidth = scaledWidths.reduce((a, b) => a + b, 0) + interval * (images.length - 1) + outerMargin * 2;
      const totalHeight = targetHeight + outerMargin * 2;

      canvas.width = totalWidth;
      canvas.height = totalHeight;
      ctx.fillStyle = marginColor;
      ctx.fillRect(0, 0, totalWidth, totalHeight);

      let curX = outerMargin;
      images.forEach((img, idx) => {
        const sw = scaledWidths[idx];
        ctx.save();
        if (round > 0) {
          ctx.beginPath();
          ctx.roundRect(curX, outerMargin, sw, targetHeight, round);
          ctx.clip();
        }
        ctx.drawImage(img, curX, outerMargin, sw, targetHeight);
        ctx.restore();
        curX += sw + interval;
      });
    } else if (mode === 'down') {
      const targetWidth = Math.round(Math.min(...images.map(img => img.width)) * resizeRatio);
      const scaledHeights = images.map(img => Math.round((targetWidth / img.width) * img.height));
      const totalHeight = scaledHeights.reduce((a, b) => a + b, 0) + interval * (images.length - 1) + outerMargin * 2;
      const totalWidth = targetWidth + outerMargin * 2;

      canvas.width = totalWidth;
      canvas.height = totalHeight;
      ctx.fillStyle = marginColor;
      ctx.fillRect(0, 0, totalWidth, totalHeight);

      let curY = outerMargin;
      images.forEach((img, idx) => {
        const sh = scaledHeights[idx];
        ctx.save();
        if (round > 0) {
          ctx.beginPath();
          ctx.roundRect(outerMargin, curY, targetWidth, sh, round);
          ctx.clip();
        }
        ctx.drawImage(img, outerMargin, curY, targetWidth, sh);
        ctx.restore();
        curY += sh + interval;
      });
    } else if (mode === 'checker') {
      const total = images.length;
      const actualCols = Math.min(cols, total);
      const rows = Math.ceil(total / actualCols);

      const cellW = Math.round(Math.min(...images.map(img => img.width)) * resizeRatio);
      const cellH = Math.round(Math.min(...images.map(img => img.height)) * resizeRatio);

      const totalW = actualCols * cellW + (actualCols - 1) * interval + outerMargin * 2;
      const totalH = rows * cellH + (rows - 1) * interval + outerMargin * 2;

      canvas.width = totalW;
      canvas.height = totalH;
      ctx.fillStyle = marginColor;
      ctx.fillRect(0, 0, totalW, totalH);

      images.forEach((img, idx) => {
        const c = idx % actualCols;
        const r = Math.floor(idx / actualCols);
        const x = outerMargin + c * (cellW + interval);
        const y = outerMargin + r * (cellH + interval);

        ctx.save();
        if (round > 0) {
          ctx.beginPath();
          ctx.roundRect(x, y, cellW, cellH, round);
          ctx.clip();
        }

        const imgRatio = img.width / img.height;
        const cellRatio = cellW / cellH;
        let dw, dh, dx, dy;
        if (imgRatio > cellRatio) {
          dh = cellH; dw = cellH * imgRatio;
          dx = x - (dw - cellW) / 2; dy = y;
        } else {
          dw = cellW; dh = cellW / imgRatio;
          dx = x; dy = y - (dh - cellH) / 2;
        }

        ctx.drawImage(img, dx, dy, dw, dh);
        ctx.restore();
      });
    }

    return canvas;
  },

  // ==========================================
  // 5. MÓDULO DE PÁGINA PARA IMPRESSÃO (Print Studio)
  // ==========================================
  // Especificações de Papel em Milímetros reais
  PAPER_SIZES: {
    'a4': { name: 'A4 (210 × 297 mm)', wMm: 210, hMm: 297 },
    'letter': { name: 'Carta / Letter (8.5 × 11 pol)', wMm: 215.9, hMm: 279.4 },
    '10x15': { name: 'Foto 10 × 15 cm (4 × 6 pol)', wMm: 100, hMm: 150 },
    '13x18': { name: 'Foto 13 × 18 cm (5 × 7 pol)', wMm: 130, hMm: 180 }
  },

  // Especificações de Fotos de Documento / Retrato
  PHOTO_PRINT_SIZES: {
    '5x7cm': { name: '5 × 7 cm (Retrato Clássico)', wMm: 50, hMm: 70 },
    '3x4cm': { name: '3 × 4 cm (Documentos / RG)', wMm: 30, hMm: 40 },
    'passport': { name: '3.5 × 4.5 cm (Passaporte / Visto)', wMm: 35, hMm: 45 },
    'wallet': { name: '6 × 9 cm (Carteira)', wMm: 60, hMm: 90 },
    '10x15cm': { name: '10 × 15 cm (Foto Inteira)', wMm: 100, hMm: 150 }
  },

  renderPrintPage: function(images, options = {}) {
    const paperKey = options.paper || 'a4';
    const paper = this.PAPER_SIZES[paperKey] || this.PAPER_SIZES['a4'];
    const orientation = options.orientation || 'portrait'; // 'portrait' ou 'landscape'
    const photoSizeKey = options.photoSize || '5x7cm';
    const photoSpec = this.PHOTO_PRINT_SIZES[photoSizeKey] || this.PHOTO_PRINT_SIZES['5x7cm'];

    let pageWMm = orientation === 'portrait' ? paper.wMm : paper.hMm;
    let pageHMm = orientation === 'portrait' ? paper.hMm : paper.wMm;

    // Resolução de Impressão: 300 DPI (1 mm ~ 11.81 pixels)
    const dpi = options.dpi || 300;
    const mmToPx = dpi / 25.4;

    const canvasW = Math.round(pageWMm * mmToPx);
    const canvasH = Math.round(pageHMm * mmToPx);

    const canvas = document.createElement('canvas');
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext('2d');

    // Fundo branco do papel
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasW, canvasH);

    const slotWMm = photoSpec.wMm;
    const slotHMm = photoSpec.hMm;
    const intervalMm = options.intervalMm !== undefined ? options.intervalMm : 2;
    const marginMm = options.marginMm !== undefined ? options.marginMm : 8;

    const slotWPx = Math.round(slotWMm * mmToPx);
    const slotHPx = Math.round(slotHMm * mmToPx);
    const intervalPx = Math.round(intervalMm * mmToPx);
    const marginPx = Math.round(marginMm * mmToPx);

    // Calcula quantas fotos cabem na página
    const availW = canvasW - marginPx * 2;
    const availH = canvasH - marginPx * 2;

    const cols = Math.max(1, Math.floor((availW + intervalPx) / (slotWPx + intervalPx)));
    const rows = Math.max(1, Math.floor((availH + intervalPx) / (slotHPx + intervalPx)));
    const maxPhotos = cols * rows;

    // Centraliza o bloco de grade na página
    const gridTotalW = cols * slotWPx + (cols - 1) * intervalPx;
    const gridTotalH = rows * slotHPx + (rows - 1) * intervalPx;
    const startX = Math.round(marginPx + (availW - gridTotalW) / 2);
    const startY = Math.round(marginPx + (availH - gridTotalH) / 2);

    const drawOutline = options.drawOutline !== false;
    const autoRotate = options.autoRotate || false;
    const gamma = options.gamma || 1.0;
    const filter = options.filter || 'normal'; // 'normal', 'grayscale', 'sepia'
    const fitMode = options.fitMode || 'paper_full'; // 'paper_full', 'image_full'

    // Se temos imagens na lista, repete ou preenche os slots
    const totalSlots = Math.min(maxPhotos, Math.max(images.length, cols * rows));

    for (let i = 0; i < totalSlots; i++) {
      const c = i % cols;
      const r = Math.floor(i / cols);
      if (r >= rows) break;

      const x = startX + c * (slotWPx + intervalPx);
      const y = startY + r * (slotHPx + intervalPx);

      ctx.save();

      // Linha de corte sutil (Outline)
      if (drawOutline) {
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, slotWPx, slotHPx);
      }

      const img = images[i % images.length];
      if (img) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, slotWPx, slotHPx);
        ctx.clip();

        // Filtros (Gama, P&B, Sépia)
        if (filter === 'grayscale') ctx.filter = 'grayscale(100%)';
        else if (filter === 'sepia') ctx.filter = 'sepia(80%)';

        // Auto-Rotate por 90 graus se a proporção da imagem for inversa à da célula
        let drawImg = img;
        let imgW = img.width;
        let imgH = img.height;

        if (autoRotate && ((slotWPx > slotHPx && imgW < imgH) || (slotWPx < slotHPx && imgW > imgH))) {
          const rotCanvas = document.createElement('canvas');
          rotCanvas.width = imgH;
          rotCanvas.height = imgW;
          const rCtx = rotCanvas.getContext('2d');
          rCtx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
          rCtx.rotate((90 * Math.PI) / 180);
          rCtx.drawImage(img, -imgW / 2, -imgH / 2);
          drawImg = rotCanvas;
          imgW = rotCanvas.width;
          imgH = rotCanvas.height;
        }

        // Fit
        const imgRatio = imgW / imgH;
        const slotRatio = slotWPx / slotHPx;
        let dw, dh, dx, dy;

        if (fitMode === 'paper_full') {
          // Preenche todo o slot (cover)
          if (imgRatio > slotRatio) {
            dh = slotHPx; dw = slotHPx * imgRatio;
            dx = x - (dw - slotWPx) / 2; dy = y;
          } else {
            dw = slotWPx; dh = slotWPx / imgRatio;
            dx = x; dy = y - (dh - slotHPx) / 2;
          }
        } else {
          // Imagem completa sem cortes (contain)
          if (imgRatio > slotRatio) {
            dw = slotWPx; dh = slotWPx / imgRatio;
            dx = x; dy = y + (slotHPx - dh) / 2;
          } else {
            dh = slotHPx; dw = slotHPx * imgRatio;
            dx = x + (slotWPx - dw) / 2; dy = y;
          }
        }

        ctx.drawImage(drawImg, dx, dy, dw, dh);
        ctx.restore();
      } else {
        // Slot vazio com texto de orientação
        ctx.fillStyle = '#f8f8f8';
        ctx.fillRect(x, y, slotWPx, slotHPx);
        ctx.fillStyle = '#bbbbbb';
        ctx.font = `${Math.round(slotWPx * 0.08)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${photoSpec.name}`, x + slotWPx / 2, y + slotHPx / 2);
      }

      ctx.restore();
    }

    return {
      canvas: canvas,
      cols: cols,
      rows: rows,
      photosPerPage: cols * rows,
      printableW: Math.round(availW / mmToPx),
      printableH: Math.round(availH / mmToPx)
    };
  },

  // ==========================================
  // 6. DIVISOR DE FOTOS / SPLITTER
  // ==========================================
  splitImage: function(srcCanvas, cols = 3, rows = 1) {
    const pieces = [];
    const w = Math.floor(srcCanvas.width / cols);
    const h = Math.floor(srcCanvas.height / rows);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const piece = document.createElement('canvas');
        piece.width = w;
        piece.height = h;
        const ctx = piece.getContext('2d');
        ctx.drawImage(srcCanvas, c * w, r * h, w, h, 0, 0, w, h);
        pieces.push({
          canvas: piece,
          row: r + 1,
          col: c + 1,
          filename: `fatia_${r + 1}_${c + 1}.png`
        });
      }
    }
    return pieces;
  }
};

window.PhotoEngine = PhotoEngine;

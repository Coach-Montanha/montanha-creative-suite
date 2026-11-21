/**
 * Montanha Creative Pro — Photo Lab Engine & Workspace Orchestrator
 * Clean-Room Photo Studio with Filmstrip Bar, Real-Time Canvas, Instagram LUTs,
 * Kokon IA Natural Language Adjustments, Collages, Combiner, Print Studio & Splitter.
 */

window.PhotoLab = (function() {
  'use strict';

  // State
  const state = {
    activeSubMode: 'editor', // 'editor' | 'collage' | 'combine' | 'print' | 'splitter'
    filmstripPool: [], // array of { id, name, img, src }
    currentImageIndex: -1,
    currentImage: null,
    workingCanvas: null,
    editorZoom: 1.0,
    isComparing: false,

    history: [],
    historyIndex: -1,

    adjustments: {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      temp: 0,
      tint: 0,
      vignette: 0,
      bloom: 0,
      sepia: 0,
      grayscale: 0,
      invert: 0,
      sharpness: 0,
      filter: 'normal',
      frame: 'none',
      gamma: 1.0
    },

    // Collages
    collageSlots: [],
    collageTemplate: 'grid_1_top_2_down',
    collageWidth: 1200,
    collageHeight: 1200,
    collagePadding: 16,
    collageGap: 12,
    collageRadius: 8,
    collageBg: '#09090b',
    selectedCollageSlot: 0,
    isPanningCollage: false,
    panStart: { x: 0, y: 0 },

    // Combine
    combineMode: 'checker', // 'down', 'side', 'checker'
    combineColumns: 2,
    combineOuterMargin: 12,
    combineInterval: 12,
    combineRound: 8,
    combineMarginColor: '#09090b',

    // Print Studio
    printPaper: 'a4',
    printOrientation: 'portrait',
    printPhotoSize: '5x7cm',
    printIntervalMm: 1,
    printFitMode: 'paper_full',
    printDrawOutline: true,
    printAutoRotate: true,
    printGamma: 1.0,
    printFilter: 'normal',

    // Splitter
    splitCols: 3,
    splitRows: 1
  };

  let els = {};

  function init() {
    cacheDom();
    bindEvents();
    renderPresets();
    renderFrames();
    renderFilmstrip();
    syncSliders();

    // Auto load sample photo if available
    loadDemoPhotos(true);
  }

  function cacheDom() {
    els = {
      // Submodes
      modeBtns: document.querySelectorAll('.photo-mode-tab'),
      subviews: document.querySelectorAll('.photo-subview'),
      
      // Filmstrip
      filmstripBar: document.getElementById('photoFilmstripBar'),
      filmstrip: document.getElementById('photoFilmstrip'),
      fileInput: document.getElementById('photoFileInput'),
      btnDemo: document.getElementById('btnLoadDemoPhoto'),
      
      // Top actions
      btnCopy: document.getElementById('photoCopyBtn'),
      btnUndo: document.getElementById('photoUndoBtn'),
      btnRedo: document.getElementById('photoRedoBtn'),
      btnExport: document.getElementById('photoExportBtn'),

      // Editor
      canvasPlaceholder: document.getElementById('photoPlaceholder'),
      mainCanvas: document.getElementById('mainCanvas'),
      canvasHud: document.getElementById('photoCanvasHud'),
      hudZoomLevel: document.getElementById('hudZoomLevel'),
      btnHudZoomOut: document.getElementById('btnHudZoomOut'),
      btnHudZoomIn: document.getElementById('btnHudZoomIn'),
      btnHudFit: document.getElementById('btnHudFit'),
      btnHudOriginal: document.getElementById('btnHudOriginal'),
      btnHudCompare: document.getElementById('btnHudCompare'),
      btnHudFullscreen: document.getElementById('btnHudFullscreen'),

      btnRotateCW: document.getElementById('btnRotateCW'),
      btnFlipH: document.getElementById('btnFlipH'),
      btnPhotoToCanvix: document.getElementById('btn-photo-to-canvix'),
      btnPhotoToVideo: document.getElementById('btn-photo-to-video'),

      // Sliders
      slBrightness: document.getElementById('slBrightness'),
      slContrast: document.getElementById('slContrast'),
      slSaturation: document.getElementById('slSaturation'),
      slTemp: document.getElementById('slTemp'),
      slVignette: document.getElementById('slVignette'),
      slBloom: document.getElementById('slBloom'),
      slSharpness: document.getElementById('slSharpness'),

      lblBrightness: document.getElementById('lblBrightness'),
      lblContrast: document.getElementById('lblContrast'),
      lblSaturation: document.getElementById('lblSaturation'),
      lblTemp: document.getElementById('lblTemp'),
      lblVignette: document.getElementById('lblVignette'),
      lblBloom: document.getElementById('lblBloom'),
      lblSharpness: document.getElementById('lblSharpness'),

      presetGrid: document.getElementById('presetGrid'),
      frameGrid: document.getElementById('frameGrid'),

      // Kokon
      kokonInput: document.getElementById('kokon-prompt-input'),
      btnApplyKokon: document.getElementById('btn-apply-kokon'),

      // Collages
      collageCanvas: document.getElementById('collageCanvas'),
      slotToolbar: document.getElementById('slotToolbar'),
      slCollageSlotZoom: document.getElementById('slCollageSlotZoom'),
      lblCollageSlotZoom: document.getElementById('lblCollageSlotZoom'),
      btnRotateCollageSlot: document.getElementById('btnRotateCollageSlot'),
      btnFilterCollageSlot: document.getElementById('btnFilterCollageSlot'),
      btnClearCollageSlot: document.getElementById('btnClearCollageSlot'),
      slCollageMargin: document.getElementById('slCollageMargin'),
      lblCollageMargin: document.getElementById('lblCollageMargin'),
      slCollageGap: document.getElementById('slCollageGap'),
      lblCollageGap: document.getElementById('lblCollageGap'),
      slCollageRound: document.getElementById('slCollageRound'),
      lblCollageRound: document.getElementById('lblCollageRound'),
      colorCollageBg: document.getElementById('colorCollageBg'),

      // Combine
      combineCanvas: document.getElementById('combineCanvas'),
      btnModeDown: document.getElementById('btnModeDown'),
      btnModeSide: document.getElementById('btnModeSide'),
      btnModeChecker: document.getElementById('btnModeChecker'),
      slCombineCols: document.getElementById('slCombineCols'),
      lblCombineCols: document.getElementById('lblCombineCols'),
      slCombineOuterMargin: document.getElementById('slCombineOuterMargin'),
      lblCombineOuterMargin: document.getElementById('lblCombineOuterMargin'),
      slCombineInterval: document.getElementById('slCombineInterval'),
      lblCombineInterval: document.getElementById('lblCombineInterval'),
      slCombineRound: document.getElementById('slCombineRound'),
      lblCombineRound: document.getElementById('lblCombineRound'),
      colorCombineMargin: document.getElementById('colorCombineMargin'),
      lblCombineCanvasSize: document.getElementById('lblCombineCanvasSize'),

      // Print
      printCanvas: document.getElementById('printCanvas'),
      btnTriggerPrint: document.getElementById('btnTriggerPrint'),
      lblPrintPaperInfo: document.getElementById('lblPrintPaperInfo'),
      lblPrintCount: document.getElementById('lblPrintCount'),
      selPrintPaper: document.getElementById('selPrintPaper'),
      radPrintPortrait: document.getElementById('radPrintPortrait'),
      radPrintLandscape: document.getElementById('radPrintLandscape'),
      selPrintSize: document.getElementById('selPrintSize'),
      slPrintInterval: document.getElementById('slPrintInterval'),
      lblPrintInterval: document.getElementById('lblPrintInterval'),
      radPrintPaperFull: document.getElementById('radPrintPaperFull'),
      radPrintImageFull: document.getElementById('radPrintImageFull'),
      chkPrintOutline: document.getElementById('chkPrintOutline'),
      chkPrintAutoRotate: document.getElementById('chkPrintAutoRotate'),
      slPrintGamma: document.getElementById('slPrintGamma'),
      lblPrintGamma: document.getElementById('lblPrintGamma'),
      btnFilterPrintGray: document.getElementById('btnFilterPrintGray'),
      btnFilterPrintSepia: document.getElementById('btnFilterPrintSepia'),
      btnFilterPrintReset: document.getElementById('btnFilterPrintReset'),
      btnResetPrintGamma: document.getElementById('btnResetPrintGamma'),

      // Splitter
      splitCols: document.getElementById('splitCols'),
      splitRows: document.getElementById('splitRows'),
      btnExecuteSplit: document.getElementById('btnExecuteSplit'),
      splitPiecesContainer: document.getElementById('splitPiecesContainer'),

      // Modal Export
      photoExportModal: document.getElementById('photoExportModal')
    };
  }

  function bindEvents() {
    // Mode Switching
    els.modeBtns?.forEach(btn => {
      btn.addEventListener('click', () => {
        const submode = btn.dataset.submode;
        switchSubMode(submode);
      });
    });

    // File input
    els.fileInput?.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length) {
        addFilesToPool(Array.from(e.target.files));
      }
    });

    // Demo button
    els.btnDemo?.addEventListener('click', () => loadDemoPhotos(false));

    // Global Paste (Ctrl+V)
    window.addEventListener('paste', handleGlobalPaste);

    // Global Copy (Ctrl+C)
    els.btnCopy?.addEventListener('click', copyActiveCanvasToClipboard);
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && !window.getSelection().toString()) {
        const activePanel = document.querySelector('.view-panel.active');
        if (activePanel && activePanel.id === 'view-photo') {
          e.preventDefault();
          copyActiveCanvasToClipboard();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        const activePanel = document.querySelector('.view-panel.active');
        if (activePanel && activePanel.id === 'view-photo' && state.activeSubMode === 'editor') {
          e.preventDefault();
          undo();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        const activePanel = document.querySelector('.view-panel.active');
        if (activePanel && activePanel.id === 'view-photo' && state.activeSubMode === 'editor') {
          e.preventDefault();
          redo();
        }
      }
    });

    // Undo / Redo
    els.btnUndo?.addEventListener('click', undo);
    els.btnRedo?.addEventListener('click', redo);

    // Export Modal Open
    els.btnExport?.addEventListener('click', openExportModal);

    // Drag and Drop on Filmstrip & Canvas
    setupDragAndDrop();

    // Editor Sliders
    bindSlider(els.slBrightness, 'brightness', els.lblBrightness);
    bindSlider(els.slContrast, 'contrast', els.lblContrast);
    bindSlider(els.slSaturation, 'saturation', els.lblSaturation);
    bindSlider(els.slTemp, 'temp', els.lblTemp);
    bindSlider(els.slVignette, 'vignette', els.lblVignette);
    bindSlider(els.slBloom, 'bloom', els.lblBloom);
    bindSlider(els.slSharpness, 'sharpness', els.lblSharpness);

    // Rotate / Flip
    els.btnRotateCW?.addEventListener('click', () => {
      if (!state.currentImage) return;
      rotateCurrentImage(90);
    });

    els.btnFlipH?.addEventListener('click', () => {
      if (!state.currentImage) return;
      flipCurrentImage();
    });

    // HUD controls
    els.btnHudZoomOut?.addEventListener('click', () => setEditorZoom(state.editorZoom - 0.15));
    els.btnHudZoomIn?.addEventListener('click', () => setEditorZoom(state.editorZoom + 0.15));
    els.btnHudFit?.addEventListener('click', fitEditorCanvas);
    els.btnHudOriginal?.addEventListener('click', () => setEditorZoom(1.0));

    // Compare
    if (els.btnHudCompare) {
      els.btnHudCompare.addEventListener('mousedown', startCompare);
      els.btnHudCompare.addEventListener('mouseup', stopCompare);
      els.btnHudCompare.addEventListener('mouseleave', stopCompare);
      els.btnHudCompare.addEventListener('touchstart', (e) => { e.preventDefault(); startCompare(); });
      els.btnHudCompare.addEventListener('touchend', stopCompare);
    }

    // Fullscreen
    els.btnHudFullscreen?.addEventListener('click', toggleCanvasFullscreen);

    // Kokon IA Box
    els.btnApplyKokon?.addEventListener('click', applyKokonPrompt);

    // Cross-module buttons
    els.btnPhotoToCanvix?.addEventListener('click', () => {
      const cvs = getActiveCanvas();
      if (!cvs) {
        showToast('Nenhuma imagem editada para enviar!', '⚠️');
        return;
      }
      const dataUrl = cvs.toDataURL('image/png');
      const artboard = document.getElementById('main-artboard');
      if (artboard) {
        artboard.style.backgroundImage = `url("${dataUrl}")`;
        artboard.style.backgroundSize = 'contain';
        artboard.style.backgroundRepeat = 'no-repeat';
        artboard.style.backgroundPosition = 'center';
      }
      if (typeof window.switchTab === 'function') window.switchTab('canvix');
      showToast('Imagem enviada com sucesso para o Canvix Design!', '🎨');
    });

    els.btnPhotoToVideo?.addEventListener('click', () => {
      const cvs = getActiveCanvas();
      if (!cvs) {
        showToast('Nenhuma imagem editada para usar como capa!', '⚠️');
        return;
      }
      const dataUrl = cvs.toDataURL('image/png');
      const stage = document.querySelector('.video-preview-stage');
      if (stage) {
        stage.style.backgroundImage = `url("${dataUrl}")`;
        stage.style.backgroundSize = 'cover';
        stage.style.backgroundPosition = 'center';
      }
      if (typeof window.switchTab === 'function') window.switchTab('video');
      showToast('Capa atualizada no Vídeo Studio!', '🎬');
    });

    // Preset category filter tabs
    document.querySelectorAll('.filter-tabs .btn-subtab')?.forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.filter-tabs .btn-subtab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderPresets(tab.dataset.cat || 'all');
      });
    });

    // Collage controls
    setupCollageEvents();

    // Combine controls
    setupCombineEvents();

    // Print controls
    setupPrintEvents();

    // Splitter controls
    setupSplitterEvents();
  }

  // =========================================================================
  // SUBMODE SWITCHING
  // =========================================================================
  function switchSubMode(modeName) {
    state.activeSubMode = modeName;
    els.modeBtns?.forEach(b => {
      b.classList.toggle('active', b.dataset.submode === modeName);
    });
    els.subviews?.forEach(v => {
      const isTarget = v.id === `photo-subview-${modeName}`;
      v.classList.toggle('active', isTarget);
      v.classList.toggle('hidden', !isTarget);
    });

    if (modeName === 'editor') {
      renderEditor();
    } else if (modeName === 'collage') {
      renderCollage();
    } else if (modeName === 'combine') {
      renderCombine();
    } else if (modeName === 'print') {
      renderPrint();
    }
  }

  // =========================================================================
  // UNIVERSAL FILMSTRIP & FILE LOADING
  // =========================================================================
  function addFilesToPool(files) {
    let count = 0;
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const item = {
            id: 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            name: file.name,
            img: img,
            src: e.target.result
          };
          state.filmstripPool.push(item);
          count++;

          // If no current image, select this one
          if (state.currentImageIndex === -1 || !state.currentImage) {
            selectFilmstripItem(state.filmstripPool.length - 1);
          } else {
            renderFilmstrip();
          }

          // If in collage and empty slots exist, fill slot
          if (state.activeSubMode === 'collage') {
            fillFirstEmptyCollageSlot(img);
          }

          showToast(`${file.name} adicionada à barra de fotos!`, '📸');
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function addPhotoFromUrl(dataUrl, name = 'Imagem Externa') {
    const img = new Image();
    img.onload = () => {
      const item = {
        id: 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        name: name,
        img: img,
        src: dataUrl
      };
      state.filmstripPool.push(item);
      selectFilmstripItem(state.filmstripPool.length - 1);
      showToast(`${name} carregada no Photo Lab!`, '📸');
    };
    img.src = dataUrl;
  }

  function loadDemoPhotos(silent = false) {
    const demos = [
      { url: 'sample_flux_1.jpg', name: 'Treino Força Coach Montanha' },
      { url: 'sample_flux_2.jpg', name: 'Iluminação 3 Pontos Editorial' }
    ];

    let loaded = 0;
    demos.forEach(d => {
      const img = new Image();
      img.onload = () => {
        const item = {
          id: 'demo_' + Math.random().toString(36).substr(2, 5),
          name: d.name,
          img: img,
          src: d.url
        };
        state.filmstripPool.push(item);
        loaded++;
        if (state.currentImageIndex === -1) {
          selectFilmstripItem(0);
        } else {
          renderFilmstrip();
        }
        if (!silent && loaded === demos.length) {
          showToast('Fotos demonstrativas carregadas com sucesso!', '⚡');
        }
      };
      img.onerror = () => {
        // Fallback procedural canvas if file missing
        const cvs = document.createElement('canvas');
        cvs.width = 1200; cvs.height = 800;
        const ctx = cvs.getContext('2d');
        const grad = ctx.createLinearGradient(0, 0, 1200, 800);
        grad.addColorStop(0, '#2b1f09');
        grad.addColorStop(1, '#0d0e14');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1200, 800);
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 36px sans-serif';
        ctx.fillText('COACH MONTANHA • FOTOGRAFIA', 80, 400);

        const fallbackImg = new Image();
        fallbackImg.onload = () => {
          state.filmstripPool.push({
            id: 'fb_' + Math.random().toString(36).substr(2, 5),
            name: d.name,
            img: fallbackImg,
            src: cvs.toDataURL()
          });
          if (state.currentImageIndex === -1) selectFilmstripItem(0);
          else renderFilmstrip();
        };
        fallbackImg.src = cvs.toDataURL();
      };
      img.src = d.url;
    });
  }

  function selectFilmstripItem(index) {
    if (index < 0 || index >= state.filmstripPool.length) return;
    state.currentImageIndex = index;
    const item = state.filmstripPool[index];
    state.currentImage = item.img;

    renderFilmstrip();

    if (state.activeSubMode === 'editor') {
      resetAdjustments();
      pushHistory();
      renderEditor();
      fitEditorCanvas();
      if (els.canvasPlaceholder) els.canvasPlaceholder.classList.add('hidden');
      if (els.mainCanvas) els.mainCanvas.classList.remove('hidden');
      if (els.canvasHud) els.canvasHud.classList.remove('hidden');
    } else if (state.activeSubMode === 'splitter') {
      renderSplitterPreview();
    } else if (state.activeSubMode === 'combine') {
      renderCombine();
    } else if (state.activeSubMode === 'print') {
      renderPrint();
    }
  }

  function removeFilmstripItem(index, e) {
    if (e) e.stopPropagation();
    state.filmstripPool.splice(index, 1);
    if (state.currentImageIndex >= state.filmstripPool.length) {
      state.currentImageIndex = state.filmstripPool.length - 1;
    }
    if (state.currentImageIndex >= 0) {
      state.currentImage = state.filmstripPool[state.currentImageIndex].img;
    } else {
      state.currentImage = null;
      if (els.mainCanvas) els.mainCanvas.classList.add('hidden');
      if (els.canvasPlaceholder) els.canvasPlaceholder.classList.remove('hidden');
      if (els.canvasHud) els.canvasHud.classList.add('hidden');
    }
    renderFilmstrip();
    if (state.activeSubMode === 'editor') renderEditor();
    else if (state.activeSubMode === 'collage') renderCollage();
    else if (state.activeSubMode === 'combine') renderCombine();
    else if (state.activeSubMode === 'print') renderPrint();
  }

  function renderFilmstrip() {
    if (!els.filmstrip) return;
    els.filmstrip.innerHTML = '';

    state.filmstripPool.forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = `filmstrip-item ${idx === state.currentImageIndex ? 'active' : ''}`;
      card.title = `${item.name} (${item.img.width}x${item.img.height})`;
      card.draggable = true;

      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', idx.toString());
      });

      card.addEventListener('click', () => selectFilmstripItem(idx));

      const img = document.createElement('img');
      img.src = item.src;
      img.className = 'filmstrip-img';
      img.alt = item.name;

      const btnDel = document.createElement('button');
      btnDel.className = 'filmstrip-del';
      btnDel.innerHTML = '✕';
      btnDel.title = 'Remover da barra';
      btnDel.addEventListener('click', (e) => removeFilmstripItem(idx, e));

      card.appendChild(img);
      card.appendChild(btnDel);
      els.filmstrip.appendChild(card);
    });
  }

  function handleGlobalPaste(e) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          addFilesToPool([file]);
          showToast('Foto colada com Ctrl+V diretamente na barra superior!', '📋');
        }
        break;
      }
    }
  }

  function setupDragAndDrop() {
    const targets = [els.filmstripBar, els.mainCanvas, els.canvasPlaceholder];
    targets.forEach(target => {
      if (!target) return;
      target.addEventListener('dragover', (e) => {
        e.preventDefault();
        target.classList.add('drag-over');
      });
      target.addEventListener('dragleave', () => {
        target.classList.remove('drag-over');
      });
      target.addEventListener('drop', (e) => {
        e.preventDefault();
        target.classList.remove('drag-over');
        if (e.dataTransfer.files && e.dataTransfer.files.length) {
          addFilesToPool(e.dataTransfer.files);
        }
      });
    });
  }

  // =========================================================================
  // EDITOR MONOFOTO ENGINE
  // =========================================================================
  function renderEditor() {
    if (!state.currentImage || !els.mainCanvas) return;

    const base = document.createElement('canvas');
    base.width = state.currentImage.width;
    base.height = state.currentImage.height;
    const bCtx = base.getContext('2d');
    bCtx.drawImage(state.currentImage, 0, 0);

    // Apply adjustments & filters via PhotoEngine
    const adjusted = PhotoEngine.applyAdjustments(base, state.adjustments);

    // Apply 9-Patch Frame if selected
    const framed = PhotoEngine.applyFrame(adjusted, state.adjustments.frame);

    els.mainCanvas.width = framed.width;
    els.mainCanvas.height = framed.height;
    const mCtx = els.mainCanvas.getContext('2d');
    mCtx.clearRect(0, 0, framed.width, framed.height);
    mCtx.drawImage(framed, 0, 0);

    state.workingCanvas = framed;
  }

  function bindSlider(slider, key, label) {
    if (!slider) return;
    slider.addEventListener('input', () => {
      state.adjustments[key] = parseFloat(slider.value);
      if (label) label.textContent = `${Math.round(state.adjustments[key] * 100)}%`;
      renderEditor();
    });
    slider.addEventListener('change', pushHistory);
  }

  function resetAdjustments() {
    state.adjustments = {
      brightness: 0, contrast: 0, saturation: 0, temp: 0, tint: 0,
      vignette: 0, bloom: 0, sepia: 0, grayscale: 0, invert: 0,
      sharpness: 0, filter: 'normal', frame: 'none', gamma: 1.0
    };
    syncSliders();
  }

  function syncSliders() {
    const adj = state.adjustments;
    if (els.slBrightness) els.slBrightness.value = adj.brightness;
    if (els.slContrast) els.slContrast.value = adj.contrast;
    if (els.slSaturation) els.slSaturation.value = adj.saturation;
    if (els.slTemp) els.slTemp.value = adj.temp;
    if (els.slVignette) els.slVignette.value = adj.vignette;
    if (els.slBloom) els.slBloom.value = adj.bloom;
    if (els.slSharpness) els.slSharpness.value = adj.sharpness || 0;

    if (els.lblBrightness) els.lblBrightness.textContent = `${Math.round(adj.brightness * 100)}%`;
    if (els.lblContrast) els.lblContrast.textContent = `${Math.round(adj.contrast * 100)}%`;
    if (els.lblSaturation) els.lblSaturation.textContent = `${Math.round(adj.saturation * 100)}%`;
    if (els.lblTemp) els.lblTemp.textContent = `${Math.round(adj.temp * 100)}%`;
    if (els.lblVignette) els.lblVignette.textContent = `${Math.round(adj.vignette * 100)}%`;
    if (els.lblBloom) els.lblBloom.textContent = `${Math.round(adj.bloom * 100)}%`;
    if (els.lblSharpness) els.lblSharpness.textContent = `${Math.round((adj.sharpness || 0) * 100)}%`;
  }

  function renderPresets(category = 'all') {
    if (!els.presetGrid) return;
    els.presetGrid.innerHTML = '';

    Object.entries(PhotoEngine.FILM_PRESETS).forEach(([key, preset]) => {
      if (category !== 'all' && preset.category !== category) return;

      const btn = document.createElement('button');
      btn.className = `btn-filter ${state.adjustments.filter === key ? 'active' : ''}`;
      const icon = preset.icon ? `<span class="filter-icon">${preset.icon}</span>` : '';
      btn.innerHTML = `${icon}<span>${preset.name}</span>`;

      btn.addEventListener('click', () => {
        state.adjustments.filter = key;
        const p = preset.params;
        Object.keys(state.adjustments).forEach(k => {
          if (k !== 'filter' && k !== 'frame') state.adjustments[k] = p[k] || 0;
        });
        syncSliders();
        renderPresets(category);
        renderEditor();
        pushHistory();
        showToast(`Filtro ${preset.name} aplicado!`, preset.icon || '✨');
      });

      els.presetGrid.appendChild(btn);
    });
  }

  function renderFrames() {
    if (!els.frameGrid) return;
    els.frameGrid.innerHTML = '';

    Object.entries(PhotoEngine.FRAME_PRESETS).forEach(([key, frame]) => {
      const btn = document.createElement('button');
      btn.className = `btn-frame ${state.adjustments.frame === key ? 'active' : ''}`;
      btn.textContent = frame.name;
      btn.addEventListener('click', () => {
        state.adjustments.frame = key;
        renderFrames();
        renderEditor();
        pushHistory();
      });
      els.frameGrid.appendChild(btn);
    });
  }

  function rotateCurrentImage(angle = 90) {
    if (!state.currentImage) return;
    const canvas = document.createElement('canvas');
    if (angle === 90 || angle === 270) {
      canvas.width = state.currentImage.height;
      canvas.height = state.currentImage.width;
    } else {
      canvas.width = state.currentImage.width;
      canvas.height = state.currentImage.height;
    }
    const ctx = canvas.getContext('2d');
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.drawImage(state.currentImage, -state.currentImage.width / 2, -state.currentImage.height / 2);

    const rotatedImg = new Image();
    rotatedImg.onload = () => {
      state.currentImage = rotatedImg;
      if (state.currentImageIndex >= 0 && state.filmstripPool[state.currentImageIndex]) {
        state.filmstripPool[state.currentImageIndex].img = rotatedImg;
        state.filmstripPool[state.currentImageIndex].src = canvas.toDataURL();
        renderFilmstrip();
      }
      renderEditor();
      pushHistory();
    };
    rotatedImg.src = canvas.toDataURL();
  }

  function flipCurrentImage() {
    if (!state.currentImage) return;
    const canvas = document.createElement('canvas');
    canvas.width = state.currentImage.width;
    canvas.height = state.currentImage.height;
    const ctx = canvas.getContext('2d');
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(state.currentImage, 0, 0);

    const flippedImg = new Image();
    flippedImg.onload = () => {
      state.currentImage = flippedImg;
      if (state.currentImageIndex >= 0 && state.filmstripPool[state.currentImageIndex]) {
        state.filmstripPool[state.currentImageIndex].img = flippedImg;
        state.filmstripPool[state.currentImageIndex].src = canvas.toDataURL();
        renderFilmstrip();
      }
      renderEditor();
      pushHistory();
    };
    flippedImg.src = canvas.toDataURL();
  }

  // =========================================================================
  // CANVAS HUD (ZOOM, FIT, 1:1, COMPARE, FULLSCREEN)
  // =========================================================================
  function setEditorZoom(zoom) {
    state.editorZoom = Math.max(0.5, Math.min(4.0, zoom));
    if (els.mainCanvas) {
      els.mainCanvas.style.transform = `scale(${state.editorZoom})`;
      els.mainCanvas.style.transformOrigin = 'center center';
    }
    if (els.hudZoomLevel) {
      els.hudZoomLevel.textContent = `${Math.round(state.editorZoom * 100)}%`;
    }
  }

  function fitEditorCanvas() {
    setEditorZoom(1.0);
  }

  function startCompare() {
    if (!state.currentImage || !els.mainCanvas) return;
    state.isComparing = true;
    const ctx = els.mainCanvas.getContext('2d');
    ctx.clearRect(0, 0, els.mainCanvas.width, els.mainCanvas.height);
    ctx.drawImage(state.currentImage, 0, 0);
  }

  function stopCompare() {
    if (!state.isComparing) return;
    state.isComparing = false;
    renderEditor();
  }

  function toggleCanvasFullscreen() {
    const vp = document.querySelector('.photo-canvas-viewport');
    if (!vp) return;
    if (!document.fullscreenElement) {
      vp.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }

  // =========================================================================
  // KOKON IA NATURAL LANGUAGE PROCESSOR
  // =========================================================================
  function applyKokonPrompt() {
    const text = (els.kokonInput?.value || '').toLowerCase().trim();
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
  }

  window.applyKokonPreset = function(preset) {
    if (preset === 'muscle') {
      state.adjustments.brightness = -0.04;
      state.adjustments.contrast = 0.28;
      state.adjustments.saturation = 0.15;
      state.adjustments.temp = 0.05;
      state.adjustments.vignette = 0.35;
      state.adjustments.bloom = 0.15;
      state.adjustments.sharpness = 0.50;
      state.adjustments.filter = 'velvia';
      showToast('Kokon-Photo: Foco Muscular & Definição aplicado!', '🔥');
    } else if (preset === 'gold') {
      state.adjustments.brightness = 0.08;
      state.adjustments.contrast = 0.18;
      state.adjustments.saturation = 0.25;
      state.adjustments.temp = 0.22;
      state.adjustments.vignette = 0.20;
      state.adjustments.bloom = 0.30;
      state.adjustments.sharpness = 0.30;
      state.adjustments.filter = 'juno';
      showToast('Kokon-Photo: Golden Hour / Luz Dourada aplicado!', '🌅');
    } else if (preset === 'obsidian') {
      state.adjustments.brightness = -0.10;
      state.adjustments.contrast = 0.35;
      state.adjustments.saturation = -0.15;
      state.adjustments.temp = -0.05;
      state.adjustments.vignette = 0.55;
      state.adjustments.bloom = 0.10;
      state.adjustments.sharpness = 0.40;
      state.adjustments.filter = 'cinema';
      showToast('Kokon-Photo: Dark Titan Chiaroscuro aplicado!', '🌑');
    } else if (preset === 'isolate') {
      state.adjustments.brightness = 0.04;
      state.adjustments.contrast = 0.24;
      state.adjustments.saturation = 0.10;
      state.adjustments.temp = 0.0;
      state.adjustments.vignette = 0.70;
      state.adjustments.bloom = 0.20;
      state.adjustments.sharpness = 0.60;
      state.adjustments.filter = 'clarendon';
      showToast('Kokon-Photo: Isolamento do Atleta em Primeiro Plano aplicado!', '⚡');
    }

    syncSliders();
    renderPresets();
    renderEditor();
    pushHistory();
  };

  // =========================================================================
  // HISTORY UNDO / REDO
  // =========================================================================
  function pushHistory() {
    state.history = state.history.slice(0, state.historyIndex + 1);
    state.history.push({ adjustments: { ...state.adjustments } });
    state.historyIndex++;
    updateHistoryButtons();
  }

  function undo() {
    if (state.historyIndex > 0) {
      state.historyIndex--;
      state.adjustments = { ...state.history[state.historyIndex].adjustments };
      syncSliders();
      renderEditor();
      updateHistoryButtons();
      showToast('Desfeito (Ctrl+Z)', '↩️');
    }
  }

  function redo() {
    if (state.historyIndex < state.history.length - 1) {
      state.historyIndex++;
      state.adjustments = { ...state.history[state.historyIndex].adjustments };
      syncSliders();
      renderEditor();
      updateHistoryButtons();
      showToast('Refeito (Ctrl+Y)', '↪️');
    }
  }

  function updateHistoryButtons() {
    if (els.btnUndo) els.btnUndo.disabled = state.historyIndex <= 0;
    if (els.btnRedo) els.btnRedo.disabled = state.historyIndex >= state.history.length - 1;
  }

  // =========================================================================
  // COLLAGES ENGINE
  // =========================================================================
  function setupCollageEvents() {
    document.querySelectorAll('.btn-collage-tmpl')?.forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-collage-tmpl').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.collageTemplate = btn.dataset.template;
        renderCollage();
      });
    });

    els.slCollageMargin?.addEventListener('input', (e) => {
      state.collagePadding = parseInt(e.target.value);
      if (els.lblCollageMargin) els.lblCollageMargin.textContent = `${state.collagePadding}px`;
      renderCollage();
    });

    els.slCollageGap?.addEventListener('input', (e) => {
      state.collageGap = parseInt(e.target.value);
      if (els.lblCollageGap) els.lblCollageGap.textContent = `${state.collageGap}px`;
      renderCollage();
    });

    els.slCollageRound?.addEventListener('input', (e) => {
      state.collageRadius = parseInt(e.target.value);
      if (els.lblCollageRound) els.lblCollageRound.textContent = `${state.collageRadius}px`;
      renderCollage();
    });

    els.colorCollageBg?.addEventListener('input', (e) => {
      state.collageBg = e.target.value;
      renderCollage();
    });

    // Slot Zoom slider
    els.slCollageSlotZoom?.addEventListener('input', (e) => {
      const slot = state.collageSlots[state.selectedCollageSlot];
      if (!slot) return;
      slot.zoom = parseFloat(e.target.value);
      if (els.lblCollageSlotZoom) els.lblCollageSlotZoom.textContent = `${Math.round(slot.zoom * 100)}%`;
      renderCollage();
    });

    // Rotate Slot 90°
    els.btnRotateCollageSlot?.addEventListener('click', () => {
      const slot = state.collageSlots[state.selectedCollageSlot];
      if (!slot) return;
      slot.rotation = ((slot.rotation || 0) + 90) % 360;
      renderCollage();
    });

    // Quick filter on slot
    els.btnFilterCollageSlot?.addEventListener('click', () => {
      const slot = state.collageSlots[state.selectedCollageSlot];
      if (!slot) return;
      const filters = ['normal', 'grayscale', 'sepia', 'velvia', 'clarendon'];
      const cur = filters.indexOf(slot.filter || 'normal');
      slot.filter = filters[(cur + 1) % filters.length];
      showToast(`Filtro no slot: ${slot.filter}`, '🎨');
      renderCollage();
    });

    // Clear slot
    els.btnClearCollageSlot?.addEventListener('click', () => {
      state.collageSlots[state.selectedCollageSlot] = null;
      renderCollage();
    });

    // Collage Canvas Pan & Selection
    els.collageCanvas?.addEventListener('mousedown', (e) => {
      const rect = els.collageCanvas.getBoundingClientRect();
      const scaleX = els.collageCanvas.width / rect.width;
      const scaleY = els.collageCanvas.height / rect.height;
      const clickX = (e.clientX - rect.left) * scaleX;
      const clickY = (e.clientY - rect.top) * scaleY;

      const slotRects = PhotoEngine.getSlotRects(state.collageTemplate, state.collageWidth, state.collageHeight, state.collagePadding, state.collageGap);
      const clickedIdx = slotRects.findIndex(r => clickX >= r.x && clickX <= r.x + r.w && clickY >= r.y && clickY <= r.y + r.h);

      if (clickedIdx !== -1) {
        state.selectedCollageSlot = clickedIdx;
        state.isPanningCollage = true;
        state.panStart = { x: e.clientX, y: e.clientY };
        syncSlotControls();
        renderCollage();
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!state.isPanningCollage) return;
      const slot = state.collageSlots[state.selectedCollageSlot];
      if (!slot || !slot.image) return;

      const dx = e.clientX - state.panStart.x;
      const dy = e.clientY - state.panStart.y;
      state.panStart = { x: e.clientX, y: e.clientY };

      const scaleFactor = state.collageWidth / els.collageCanvas.getBoundingClientRect().width;
      slot.panX = (slot.panX || 0) + dx * scaleFactor;
      slot.panY = (slot.panY || 0) + dy * scaleFactor;
      renderCollage();
    });

    window.addEventListener('mouseup', () => { state.isPanningCollage = false; });

    // Wheel zoom on collage slot
    els.collageCanvas?.addEventListener('wheel', (e) => {
      e.preventDefault();
      const slot = state.collageSlots[state.selectedCollageSlot];
      if (!slot || !slot.image) return;
      const delta = e.deltaY < 0 ? 0.08 : -0.08;
      slot.zoom = Math.max(0.5, Math.min(3.5, (slot.zoom || 1.0) + delta));
      syncSlotControls();
      renderCollage();
    });

    // Drop on collage canvas from filmstrip
    els.collageCanvas?.addEventListener('dragover', (e) => e.preventDefault());
    els.collageCanvas?.addEventListener('drop', (e) => {
      e.preventDefault();
      const poolIdxStr = e.dataTransfer.getData('text/plain');
      if (poolIdxStr !== '') {
        const pIdx = parseInt(poolIdxStr);
        const item = state.filmstripPool[pIdx];
        if (item && item.img) {
          const rect = els.collageCanvas.getBoundingClientRect();
          const scaleX = els.collageCanvas.width / rect.width;
          const scaleY = els.collageCanvas.height / rect.height;
          const dropX = (e.clientX - rect.left) * scaleX;
          const dropY = (e.clientY - rect.top) * scaleY;

          const slotRects = PhotoEngine.getSlotRects(state.collageTemplate, state.collageWidth, state.collageHeight, state.collagePadding, state.collageGap);
          const targetSlotIdx = slotRects.findIndex(r => dropX >= r.x && dropX <= r.x + r.w && dropY >= r.y && dropY <= r.y + r.h);

          const slotIdx = targetSlotIdx !== -1 ? targetSlotIdx : state.selectedCollageSlot;
          initCollageSlot(slotIdx, item.img);
          renderCollage();
          showToast(`Foto adicionada ao quadro ${slotIdx + 1}!`, '🖼️');
        }
      }
    });
  }

  function initCollageSlot(idx, img) {
    state.collageSlots[idx] = {
      image: img,
      zoom: 1.0,
      panX: 0,
      panY: 0,
      rotation: 0,
      filter: 'normal'
    };
    state.selectedCollageSlot = idx;
    syncSlotControls();
  }

  function fillFirstEmptyCollageSlot(img) {
    const slotRects = PhotoEngine.getSlotRects(state.collageTemplate, state.collageWidth, state.collageHeight, state.collagePadding, state.collageGap);
    for (let i = 0; i < slotRects.length; i++) {
      if (!state.collageSlots[i] || !state.collageSlots[i].image) {
        initCollageSlot(i, img);
        renderCollage();
        break;
      }
    }
  }

  function syncSlotControls() {
    const slot = state.collageSlots[state.selectedCollageSlot];
    if (slot && els.slCollageSlotZoom) {
      els.slCollageSlotZoom.value = slot.zoom || 1.0;
      if (els.lblCollageSlotZoom) els.lblCollageSlotZoom.textContent = `${Math.round((slot.zoom || 1.0) * 100)}%`;
    }
  }

  function renderCollage() {
    if (!els.collageCanvas) return;

    // Auto fill empty slots from filmstrip if unassigned
    const slotRects = PhotoEngine.getSlotRects(state.collageTemplate, state.collageWidth, state.collageHeight, state.collagePadding, state.collageGap);
    slotRects.forEach((rect, idx) => {
      if (!state.collageSlots[idx] && state.filmstripPool[idx]) {
        state.collageSlots[idx] = {
          image: state.filmstripPool[idx].img,
          zoom: 1.0, panX: 0, panY: 0, rotation: 0, filter: 'normal'
        };
      }
    });

    const rendered = PhotoEngine.renderCollage({
      template: state.collageTemplate,
      slots: state.collageSlots,
      width: state.collageWidth,
      height: state.collageHeight,
      padding: state.collagePadding,
      gap: state.collageGap,
      radius: state.collageRadius,
      bg: state.collageBg,
      frame: 'none'
    });

    els.collageCanvas.width = rendered.width;
    els.collageCanvas.height = rendered.height;
    const ctx = els.collageCanvas.getContext('2d');
    ctx.drawImage(rendered, 0, 0);

    // Draw active slot border highlight
    const selRect = slotRects[state.selectedCollageSlot];
    if (selRect) {
      ctx.save();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 6]);
      ctx.strokeRect(selRect.x, selRect.y, selRect.w, selRect.h);
      ctx.restore();
    }
  }

  // =========================================================================
  // COMBINE ENGINE
  // =========================================================================
  function setupCombineEvents() {
    els.btnModeDown?.addEventListener('click', () => setCombineMode('down'));
    els.btnModeSide?.addEventListener('click', () => setCombineMode('side'));
    els.btnModeChecker?.addEventListener('click', () => setCombineMode('checker'));

    els.slCombineCols?.addEventListener('input', (e) => {
      state.combineColumns = parseInt(e.target.value);
      if (els.lblCombineCols) els.lblCombineCols.textContent = state.combineColumns;
      renderCombine();
    });

    els.slCombineOuterMargin?.addEventListener('input', (e) => {
      state.combineOuterMargin = parseInt(e.target.value);
      if (els.lblCombineOuterMargin) els.lblCombineOuterMargin.textContent = `${state.combineOuterMargin}px`;
      renderCombine();
    });

    els.slCombineInterval?.addEventListener('input', (e) => {
      state.combineInterval = parseInt(e.target.value);
      if (els.lblCombineInterval) els.lblCombineInterval.textContent = `${state.combineInterval}px`;
      renderCombine();
    });

    els.slCombineRound?.addEventListener('input', (e) => {
      state.combineRound = parseInt(e.target.value);
      if (els.lblCombineRound) els.lblCombineRound.textContent = `${state.combineRound}px`;
      renderCombine();
    });

    els.colorCombineMargin?.addEventListener('input', (e) => {
      state.combineMarginColor = e.target.value;
      renderCombine();
    });
  }

  function setCombineMode(mode) {
    state.combineMode = mode;
    [els.btnModeDown, els.btnModeSide, els.btnModeChecker].forEach(btn => {
      if (!btn) return;
      const isTarget = (mode === 'down' && btn.id === 'btnModeDown') ||
                       (mode === 'side' && btn.id === 'btnModeSide') ||
                       (mode === 'checker' && btn.id === 'btnModeChecker');
      btn.classList.toggle('active', isTarget);
    });
    renderCombine();
  }

  function renderCombine() {
    if (!els.combineCanvas) return;
    const images = state.filmstripPool.map(i => i.img);

    const rendered = PhotoEngine.renderCombine({
      images: images,
      mode: state.combineMode,
      columns: state.combineColumns,
      outerMargin: state.combineOuterMargin,
      interval: state.combineInterval,
      round: state.combineRound,
      marginColor: state.combineMarginColor,
      resizeRatio: 100,
      frame: 'none'
    });

    els.combineCanvas.width = rendered.width;
    els.combineCanvas.height = rendered.height;
    const ctx = els.combineCanvas.getContext('2d');
    ctx.drawImage(rendered, 0, 0);

    if (els.lblCombineCanvasSize) {
      els.lblCombineCanvasSize.textContent = `${rendered.width} × ${rendered.height} px`;
    }
  }

  // =========================================================================
  // PRINT STUDIO ENGINE
  // =========================================================================
  function setupPrintEvents() {
    els.btnTriggerPrint?.addEventListener('click', executeBrowserPrint);

    els.selPrintPaper?.addEventListener('change', (e) => {
      state.printPaper = e.target.value;
      renderPrint();
    });

    els.radPrintPortrait?.addEventListener('change', () => {
      state.printOrientation = 'portrait';
      renderPrint();
    });
    els.radPrintLandscape?.addEventListener('change', () => {
      state.printOrientation = 'landscape';
      renderPrint();
    });

    els.selPrintSize?.addEventListener('change', (e) => {
      state.printPhotoSize = e.target.value;
      renderPrint();
    });

    els.slPrintInterval?.addEventListener('input', (e) => {
      state.printIntervalMm = parseInt(e.target.value);
      if (els.lblPrintInterval) els.lblPrintInterval.textContent = `${state.printIntervalMm} mm`;
      renderPrint();
    });

    els.radPrintPaperFull?.addEventListener('change', () => {
      state.printFitMode = 'paper_full';
      renderPrint();
    });
    els.radPrintImageFull?.addEventListener('change', () => {
      state.printFitMode = 'image_full';
      renderPrint();
    });

    els.chkPrintOutline?.addEventListener('change', (e) => {
      state.printDrawOutline = e.target.checked;
      renderPrint();
    });

    els.chkPrintAutoRotate?.addEventListener('change', (e) => {
      state.printAutoRotate = e.target.checked;
      renderPrint();
    });

    els.slPrintGamma?.addEventListener('input', (e) => {
      state.printGamma = parseFloat(e.target.value);
      if (els.lblPrintGamma) els.lblPrintGamma.textContent = state.printGamma.toFixed(2);
      renderPrint();
    });

    els.btnResetPrintGamma?.addEventListener('click', () => {
      state.printGamma = 1.0;
      if (els.slPrintGamma) els.slPrintGamma.value = 1.0;
      if (els.lblPrintGamma) els.lblPrintGamma.textContent = '1.00';
      renderPrint();
    });

    els.btnFilterPrintGray?.addEventListener('click', () => {
      state.printFilter = 'grayscale';
      renderPrint();
    });
    els.btnFilterPrintSepia?.addEventListener('click', () => {
      state.printFilter = 'sepia';
      renderPrint();
    });
    els.btnFilterPrintReset?.addEventListener('click', () => {
      state.printFilter = 'normal';
      renderPrint();
    });
  }

  function renderPrint() {
    if (!els.printCanvas) return;
    const images = state.filmstripPool.map(i => i.img);

    const rendered = PhotoEngine.renderPrintSheet({
      images: images,
      paper: state.printPaper,
      orientation: state.printOrientation,
      photoSize: state.printPhotoSize,
      intervalMm: state.printIntervalMm,
      fitMode: state.printFitMode,
      drawOutline: state.printDrawOutline,
      autoRotate: state.printAutoRotate,
      gamma: state.printGamma,
      filter: state.printFilter
    });

    els.printCanvas.width = rendered.width;
    els.printCanvas.height = rendered.height;
    const ctx = els.printCanvas.getContext('2d');
    ctx.drawImage(rendered, 0, 0);

    // Update readouts
    const pInfo = PhotoEngine.PRINT_PAPERS[state.printPaper] || PhotoEngine.PRINT_PAPERS.a4;
    const sInfo = PhotoEngine.PHOTO_SIZES[state.printPhotoSize] || PhotoEngine.PHOTO_SIZES['5x7cm'];
    if (els.lblPrintPaperInfo) {
      els.lblPrintPaperInfo.textContent = `Papel: ${pInfo.name} • ${pInfo.widthMm} × ${pInfo.heightMm} mm`;
    }
    if (els.lblPrintCount) {
      els.lblPrintCount.textContent = `Tamanho Foto: ${sInfo.name} (${sInfo.wMm}×${sInfo.hMm}mm)`;
    }
  }

  function executeBrowserPrint() {
    if (!els.printCanvas) return;
    const dataUrl = els.printCanvas.toDataURL('image/png');
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Pop-up de impressão bloqueado pelo navegador!', '⚠️');
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Imprimir — Montanha Photo Lab</title>
          <style>
            @page { size: auto; margin: 0; }
            body { margin: 0; display: flex; align-items: center; justify-content: center; }
            img { max-width: 100%; height: auto; display: block; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <img src="${dataUrl}">
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  // =========================================================================
  // SPLITTER ENGINE
  // =========================================================================
  function setupSplitterEvents() {
    els.btnExecuteSplit?.addEventListener('click', executeSplitter);
  }

  function renderSplitterPreview() {
    // Shows current image ready to be split
    if (!state.currentImage || !els.splitPiecesContainer) return;
    els.splitPiecesContainer.innerHTML = `
      <div style="grid-column: 1 / -1; text-align:center; padding: 20px; color: var(--text-secondary);">
        <img src="${state.currentImage.src}" style="max-height: 240px; border-radius: 8px; border: 1px solid var(--border-subtle); margin-bottom: 12px; display:inline-block;">
        <div>Imagem ativa pronta para fatiar (${state.currentImage.width} × ${state.currentImage.height} px).</div>
        <div style="font-size: 11px; margin-top: 4px;">Clique em "Fatiar Imagem Atual" para gerar as fatias.</div>
      </div>
    `;
  }

  function executeSplitter() {
    if (!state.currentImage || !els.splitPiecesContainer) {
      showToast('Abra ou selecione uma foto na barra superior primeiro!', '⚠️');
      return;
    }

    const cols = parseInt(els.splitCols?.value || 3);
    const rows = parseInt(els.splitRows?.value || 1);
    const pieces = PhotoEngine.splitImage(state.currentImage, cols, rows);

    els.splitPiecesContainer.innerHTML = '';
    pieces.forEach((piece, idx) => {
      const card = document.createElement('div');
      card.className = 'split-piece-card';
      card.style.background = 'var(--bg-card)';
      card.style.border = '1px solid var(--border-subtle)';
      card.style.borderRadius = 'var(--radius-sm)';
      card.style.padding = '10px';
      card.style.display = 'flex';
      card.style.flexDirection = 'column';
      card.style.gap = '8px';

      const img = document.createElement('img');
      img.src = piece.dataUrl;
      img.style.width = '100%';
      img.style.borderRadius = '4px';

      const label = document.createElement('div');
      label.style.fontSize = '11px';
      label.style.fontWeight = '700';
      label.textContent = `Fatia ${piece.index + 1} (${piece.col + 1}x${piece.row + 1}) — ${piece.width}×${piece.height}px`;

      const btnDl = document.createElement('button');
      btnDl.className = 'btn btn-secondary btn-sm btn-block';
      btnDl.textContent = '⬇️ Baixar Fatia';
      btnDl.onclick = () => triggerDownload(piece.dataUrl, `fatia_${piece.index + 1}_${cols}x${rows}.png`);

      card.appendChild(img);
      card.appendChild(label);
      card.appendChild(btnDl);
      els.splitPiecesContainer.appendChild(card);
    });

    showToast(`Imagem dividida em ${pieces.length} fatias com sucesso!`, '✂️');
  }

  // =========================================================================
  // EXPORT MODAL & ARTCRAFT PSD
  // =========================================================================
  function getActiveCanvas() {
    if (state.activeSubMode === 'editor') return state.workingCanvas || els.mainCanvas;
    if (state.activeSubMode === 'collage') return els.collageCanvas;
    if (state.activeSubMode === 'combine') return els.combineCanvas;
    if (state.activeSubMode === 'print') return els.printCanvas;
    return state.workingCanvas || els.mainCanvas;
  }

  function openExportModal() {
    const cvs = getActiveCanvas();
    if (!cvs) {
      showToast('Nenhuma imagem disponível para exportar!', '⚠️');
      return;
    }
    if (els.photoExportModal) {
      els.photoExportModal.classList.remove('hidden');
    }
  }

  window.closePhotoExportModal = function() {
    if (els.photoExportModal) els.photoExportModal.classList.add('hidden');
  };

  window.confirmPhotoExport = async function() {
    const cvs = getActiveCanvas();
    if (!cvs) return;

    const fmtCard = document.querySelector('.fmt-card.active');
    const format = fmtCard?.dataset.fmt || 'webp';
    const quality = (parseInt(document.getElementById('exportQuality')?.value || '95')) / 100;
    const filename = `montanha_creative_${Date.now()}`;

    if (format === 'psd') {
      const btn = document.getElementById('btnConfirmExportText');
      if (btn) btn.textContent = 'Gerando PSD via ArtCraft...';
      try {
        const dataUrl = cvs.toDataURL('image/png');
        const res = await fetch('/api/artcraft/export-psd', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: dataUrl, filename: filename + '.psd' })
        });
        const data = await res.json();
        if (data.success) {
          showToast(`PSD exportado com sucesso em: ${data.path}`, '⚡');
        } else {
          showToast(`Erro ArtCraft: ${data.error}`, '⚠️');
        }
      } catch (err) {
        showToast('Falha ao comunicar com ArtCraft: ' + err.message, '⚠️');
      } finally {
        if (btn) btn.textContent = 'Baixar Imagem';
        closePhotoExportModal();
      }
      return;
    }

    let mime = 'image/webp';
    let ext = 'webp';
    if (format === 'png') { mime = 'image/png'; ext = 'png'; }
    else if (format === 'jpeg') { mime = 'image/jpeg'; ext = 'jpg'; }

    const dataUrl = cvs.toDataURL(mime, quality);
    triggerDownload(dataUrl, `${filename}.${ext}`);
    closePhotoExportModal();
    showToast(`Imagem salva com sucesso em .${ext}!`, '💾');
  };

  async function copyActiveCanvasToClipboard() {
    const cvs = getActiveCanvas();
    if (!cvs) {
      showToast('Nenhuma imagem ativa para copiar!', '⚠️');
      return;
    }

    try {
      cvs.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        showToast('✅ Imagem copiada! Cole no WhatsApp, Canva ou Photoshop com Ctrl+V', '📋');
      });
    } catch (err) {
      showToast('Erro ao copiar: ' + err.message, '⚠️');
    }
  }

  function triggerDownload(dataUrl, filename) {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function showToast(msg, icon = '⚡') {
    if (typeof window.showHudToast === 'function') {
      window.showHudToast(msg, icon);
    }
  }

  // Auto init when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    init,
    addPhotoFromUrl,
    addFilesToPool,
    selectFilmstripItem,
    switchSubMode,
    getActiveCanvas,
    renderEditor,
    renderCollage,
    renderCombine,
    renderPrint
  };

})();

(() => {
  'use strict';

  const state = {
    comicDataUrl: '',
    hotspots: [],
    selectedId: null,
    mode: 'edit',
    drawing: false,
    drawStart: null,
    debug: false,
  };

  const el = {
    body: document.body,
    comicInput: document.getElementById('comicInput'),
    comicStage: document.getElementById('comicStage'),
    comicImage: document.getElementById('comicImage'),
    hotspotLayer: document.getElementById('hotspotLayer'),
    addHotspotBtn: document.getElementById('addHotspotBtn'),
    deleteHotspotBtn: document.getElementById('deleteHotspotBtn'),
    modeBtn: document.getElementById('modeBtn'),
    fullscreenBtn: document.getElementById('fullscreenBtn'),
    exportBtn: document.getElementById('exportBtn'),
    statusText: document.getElementById('statusText'),
    selectionTitle: document.getElementById('selectionTitle'),
    hotspotControls: document.getElementById('hotspotControls'),
    labelInput: document.getElementById('labelInput'),
    actionSelect: document.getElementById('actionSelect'),
    mediaInput: document.getElementById('mediaInput'),
    mediaName: document.getElementById('mediaName'),
    overlayScale: document.getElementById('overlayScale'),
    overlayScaleValue: document.getElementById('overlayScaleValue'),
    toggleCloseInput: document.getElementById('toggleCloseInput'),
    popup: document.getElementById('popup'),
    popupImage: document.getElementById('popupImage'),
    popupClose: document.getElementById('popupClose'),
  };

  function uid() {
    return `h_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function selectedHotspot() {
    return state.hotspots.find((h) => h.id === state.selectedId) || null;
  }

  function setStatus(message) {
    el.statusText.textContent = message;
  }

  function setMode(mode) {
    state.mode = mode;
    const editing = mode === 'edit';
    el.body.classList.toggle('edit-mode', editing);
    el.body.classList.toggle('demo-mode', !editing);
    el.modeBtn.textContent = editing ? 'Mode: Edit' : 'Mode: Demo';
    if (!editing) {
      state.selectedId = null;
      closePopup();
      clearInlineOverlays();
    }
    renderHotspots();
    syncInspector();
  }

  async function loadComic(file) {
    state.comicDataUrl = await fileToDataUrl(file);
    state.hotspots = [];
    state.selectedId = null;
    el.comicImage.src = state.comicDataUrl;
    el.comicStage.classList.remove('is-empty');
    el.comicStage.classList.add('has-image');
    el.addHotspotBtn.disabled = false;
    setStatus(`Artwork: ${file.name}`);
    renderHotspots();
    syncInspector();
  }

  function syncInspector() {
    const hotspot = selectedHotspot();
    const disabled = !hotspot;
    el.hotspotControls.classList.toggle('is-disabled', disabled);
    el.hotspotControls.setAttribute('aria-disabled', String(disabled));
    el.deleteHotspotBtn.disabled = disabled;

    [el.labelInput, el.actionSelect, el.mediaInput, el.overlayScale, el.toggleCloseInput]
      .forEach((control) => { control.disabled = disabled; });

    if (!hotspot) {
      el.selectionTitle.textContent = 'Belum ada';
      el.labelInput.value = '';
      el.mediaName.textContent = 'Belum ada media.';
      el.overlayScaleValue.textContent = '100%';
      return;
    }

    el.selectionTitle.textContent = hotspot.label || 'Hotspot';
    el.labelInput.value = hotspot.label;
    el.actionSelect.value = hotspot.action;
    el.mediaName.textContent = hotspot.mediaName || 'Belum ada media.';
    el.overlayScale.value = String(hotspot.scale);
    el.overlayScaleValue.textContent = `${hotspot.scale}%`;
    el.toggleCloseInput.checked = hotspot.toggleClose;
  }

  function renderHotspots() {
    clearInlineOverlays();
    el.hotspotLayer.innerHTML = '';

    for (const hotspot of state.hotspots) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'hotspot';
      if (state.mode === 'edit' && hotspot.id === state.selectedId) button.classList.add('is-selected');
      button.dataset.id = hotspot.id;
      button.style.left = `${hotspot.x}%`;
      button.style.top = `${hotspot.y}%`;
      button.style.width = `${hotspot.w}%`;
      button.style.height = `${hotspot.h}%`;
      button.setAttribute('aria-label', hotspot.label || 'Interactive hotspot');

      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = hotspot.label || 'hotspot';
      button.appendChild(tag);

      button.addEventListener('click', (event) => {
        event.stopPropagation();
        if (state.mode === 'edit') {
          state.selectedId = hotspot.id;
          renderHotspots();
          syncInspector();
        } else {
          runHotspot(hotspot);
        }
      });

      el.hotspotLayer.appendChild(button);
    }
  }

  function beginDraw(event) {
    if (!state.drawing || state.mode !== 'edit' || !state.comicDataUrl) return;
    if (event.button !== 0) return;

    const rect = el.comicStage.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, event.clientY - rect.top));
    state.drawStart = { x, y, rect };

    const box = document.createElement('div');
    box.className = 'draw-box';
    box.id = 'activeDrawBox';
    el.hotspotLayer.appendChild(box);
    updateDraw(event);
  }

  function updateDraw(event) {
    if (!state.drawStart) return;
    const { x: sx, y: sy, rect } = state.drawStart;
    const ex = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
    const ey = Math.max(0, Math.min(rect.height, event.clientY - rect.top));
    const left = Math.min(sx, ex);
    const top = Math.min(sy, ey);
    const width = Math.abs(ex - sx);
    const height = Math.abs(ey - sy);
    const box = document.getElementById('activeDrawBox');
    if (!box) return;
    box.style.left = `${left}px`;
    box.style.top = `${top}px`;
    box.style.width = `${width}px`;
    box.style.height = `${height}px`;
  }

  function finishDraw(event) {
    if (!state.drawStart) return;
    const { x: sx, y: sy, rect } = state.drawStart;
    const ex = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
    const ey = Math.max(0, Math.min(rect.height, event.clientY - rect.top));
    const left = Math.min(sx, ex);
    const top = Math.min(sy, ey);
    const width = Math.abs(ex - sx);
    const height = Math.abs(ey - sy);
    state.drawStart = null;
    state.drawing = false;
    el.addHotspotBtn.textContent = 'Tambah Hotspot';

    if (width < 12 || height < 12) {
      renderHotspots();
      setStatus('Area terlalu kecil. Coba drag area yang lebih besar.');
      return;
    }

    const hotspot = {
      id: uid(),
      label: `Hotspot ${state.hotspots.length + 1}`,
      action: 'popup',
      mediaDataUrl: '',
      mediaName: '',
      x: (left / rect.width) * 100,
      y: (top / rect.height) * 100,
      w: (width / rect.width) * 100,
      h: (height / rect.height) * 100,
      scale: 100,
      toggleClose: true,
    };

    state.hotspots.push(hotspot);
    state.selectedId = hotspot.id;
    renderHotspots();
    syncInspector();
    setStatus('Hotspot dibuat. Sekarang pilih PNG/GIF untuk aksinya.');
  }

  function clearInlineOverlays() {
    el.comicStage.querySelectorAll('.inline-overlay').forEach((node) => node.remove());
  }

  function runHotspot(hotspot) {
    if (!hotspot.mediaDataUrl) return;

    if (hotspot.action === 'popup') {
      if (hotspot.toggleClose && el.popup.classList.contains('is-open') && el.popup.dataset.hotspotId === hotspot.id) {
        closePopup();
        return;
      }
      el.popupImage.src = hotspot.mediaDataUrl;
      el.popup.dataset.hotspotId = hotspot.id;
      el.popup.classList.add('is-open');
      el.popup.setAttribute('aria-hidden', 'false');
      return;
    }

    const existing = el.comicStage.querySelector(`.inline-overlay[data-hotspot-id="${hotspot.id}"]`);
    if (existing && hotspot.toggleClose) {
      existing.remove();
      return;
    }
    if (existing) existing.remove();

    const image = document.createElement('img');
    image.className = 'inline-overlay';
    image.dataset.hotspotId = hotspot.id;
    image.src = hotspot.mediaDataUrl;
    image.alt = hotspot.label || 'Overlay';

    const scale = hotspot.scale / 100;
    const w = hotspot.w * scale;
    const h = hotspot.h * scale;
    const x = hotspot.x - (w - hotspot.w) / 2;
    const y = hotspot.y - (h - hotspot.h) / 2;
    image.style.left = `${x}%`;
    image.style.top = `${y}%`;
    image.style.width = `${w}%`;
    image.style.height = `${h}%`;
    el.comicStage.appendChild(image);
  }

  function closePopup() {
    el.popup.classList.remove('is-open');
    el.popup.setAttribute('aria-hidden', 'true');
    el.popup.dataset.hotspotId = '';
    el.popupImage.removeAttribute('src');
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  function exportStandalone() {
    if (!state.comicDataUrl) {
      setStatus('Pilih gambar komik dulu sebelum export.');
      return;
    }

    const runtimeData = JSON.stringify({ comic: state.comicDataUrl, hotspots: state.hotspots }).replaceAll('<', '\\u003c');

    const html = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Interactive Comic</title>
<style>
*{box-sizing:border-box}html,body{margin:0;min-height:100%;background:#000}body{display:grid;place-items:center;overflow:auto;font-family:system-ui,sans-serif}.stage{position:relative;display:inline-block;line-height:0;max-width:100vw;max-height:100vh}.comic{display:block;max-width:100vw;max-height:100vh;width:auto;height:auto}.hotspot{position:absolute;border:0;padding:0;background:transparent;cursor:pointer}.overlay{position:absolute;z-index:10;object-fit:contain;pointer-events:none;filter:drop-shadow(0 14px 18px rgba(0,0,0,.45))}.popup{position:fixed;inset:0;z-index:100;display:none;place-items:center;background:rgba(0,0,0,.86);padding:30px}.popup.open{display:grid}.popup img{max-width:94vw;max-height:90vh;object-fit:contain}.close{position:fixed;right:18px;top:18px;width:44px;height:44px;border-radius:50%;border:1px solid #555;background:#111;color:#fff;font-size:28px;cursor:pointer}body.debug .hotspot{outline:2px solid #f3d64e;background:rgba(243,214,78,.13)}
</style>
</head>
<body>
<div id="stage" class="stage"><img id="comic" class="comic" alt="Comic"><div id="hotspots"></div></div>
<div id="popup" class="popup"><button id="close" class="close">×</button><img id="popupImg" alt="Popup"></div>
<script>
const DATA=${runtimeData};
const stage=document.getElementById('stage'),comic=document.getElementById('comic'),layer=document.getElementById('hotspots'),popup=document.getElementById('popup'),popupImg=document.getElementById('popupImg');
comic.src=DATA.comic;
function closePopup(){popup.classList.remove('open');popup.dataset.id='';popupImg.removeAttribute('src')}
function run(h){if(!h.mediaDataUrl)return;if(h.action==='popup'){if(h.toggleClose&&popup.classList.contains('open')&&popup.dataset.id===h.id){closePopup();return}popupImg.src=h.mediaDataUrl;popup.dataset.id=h.id;popup.classList.add('open');return}const old=stage.querySelector('.overlay[data-id="'+h.id+'"]');if(old&&h.toggleClose){old.remove();return}if(old)old.remove();const img=document.createElement('img');img.className='overlay';img.dataset.id=h.id;img.src=h.mediaDataUrl;const s=h.scale/100,w=h.w*s,hh=h.h*s,x=h.x-(w-h.w)/2,y=h.y-(hh-h.h)/2;Object.assign(img.style,{left:x+'%',top:y+'%',width:w+'%',height:hh+'%'});stage.appendChild(img)}
for(const h of DATA.hotspots){const b=document.createElement('button');b.className='hotspot';b.setAttribute('aria-label',h.label||'hotspot');Object.assign(b.style,{left:h.x+'%',top:h.y+'%',width:h.w+'%',height:h.h+'%'});b.onclick=()=>run(h);layer.appendChild(b)}
document.getElementById('close').onclick=closePopup;popup.onclick=e=>{if(e.target===popup)closePopup()};document.addEventListener('keydown',e=>{if(e.key==='Escape')closePopup();if(e.key.toLowerCase()==='d')document.body.classList.toggle('debug');if(e.key.toLowerCase()==='f'){document.fullscreenElement?document.exitFullscreen?.():document.documentElement.requestFullscreen?.()}});
<\/script>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'interactive-comic-final.html';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatus('Export selesai: interactive-comic-final.html');
  }

  el.comicInput.addEventListener('change', async () => {
    const [file] = el.comicInput.files || [];
    if (!file) return;
    try {
      await loadComic(file);
    } catch (error) {
      console.error(error);
      setStatus('Gagal membaca gambar.');
    }
  });

  el.addHotspotBtn.addEventListener('click', () => {
    state.drawing = !state.drawing;
    state.selectedId = null;
    el.addHotspotBtn.textContent = state.drawing ? 'Batalkan Gambar Area' : 'Tambah Hotspot';
    setStatus(state.drawing ? 'Drag area pada komik untuk membuat hotspot.' : 'Pembuatan hotspot dibatalkan.');
    renderHotspots();
    syncInspector();
  });

  el.deleteHotspotBtn.addEventListener('click', () => {
    if (!state.selectedId) return;
    state.hotspots = state.hotspots.filter((h) => h.id !== state.selectedId);
    state.selectedId = null;
    renderHotspots();
    syncInspector();
    setStatus('Hotspot dihapus.');
  });

  el.comicStage.addEventListener('mousedown', beginDraw);
  window.addEventListener('mousemove', updateDraw);
  window.addEventListener('mouseup', finishDraw);

  el.labelInput.addEventListener('input', () => {
    const hotspot = selectedHotspot();
    if (!hotspot) return;
    hotspot.label = el.labelInput.value;
    el.selectionTitle.textContent = hotspot.label || 'Hotspot';
    renderHotspots();
  });

  el.actionSelect.addEventListener('change', () => {
    const hotspot = selectedHotspot();
    if (!hotspot) return;
    hotspot.action = el.actionSelect.value;
  });

  el.mediaInput.addEventListener('change', async () => {
    const hotspot = selectedHotspot();
    const [file] = el.mediaInput.files || [];
    if (!hotspot || !file) return;
    hotspot.mediaDataUrl = await fileToDataUrl(file);
    hotspot.mediaName = file.name;
    el.mediaName.textContent = file.name;
    setStatus(`Media ${file.name} dipasang ke ${hotspot.label}.`);
    el.mediaInput.value = '';
  });

  el.overlayScale.addEventListener('input', () => {
    const hotspot = selectedHotspot();
    if (!hotspot) return;
    hotspot.scale = Number(el.overlayScale.value);
    el.overlayScaleValue.textContent = `${hotspot.scale}%`;
  });

  el.toggleCloseInput.addEventListener('change', () => {
    const hotspot = selectedHotspot();
    if (!hotspot) return;
    hotspot.toggleClose = el.toggleCloseInput.checked;
  });

  el.modeBtn.addEventListener('click', () => setMode(state.mode === 'edit' ? 'demo' : 'edit'));
  el.fullscreenBtn.addEventListener('click', toggleFullscreen);
  el.exportBtn.addEventListener('click', exportStandalone);
  el.popupClose.addEventListener('click', closePopup);
  el.popup.addEventListener('click', (event) => { if (event.target === el.popup) closePopup(); });

  document.addEventListener('keydown', (event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement) return;
    const key = event.key.toLowerCase();
    if (key === 'e') setMode(state.mode === 'edit' ? 'demo' : 'edit');
    if (key === 'd') {
      state.debug = !state.debug;
      el.body.classList.toggle('debug-hotspots', state.debug);
    }
    if (key === 'f') toggleFullscreen();
    if (event.key === 'Escape') closePopup();
  });

  setMode('edit');
})();

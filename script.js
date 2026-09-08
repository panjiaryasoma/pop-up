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
    passwordHotspotId: null,
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
    toggleCloseInput: document.getElementById('toggleCloseInput'),
    passwordSettings: document.getElementById('passwordSettings'),
    promptInput: document.getElementById('promptInput'),
    passwordInput: document.getElementById('passwordInput'),
    popup: document.getElementById('popup'),
    popupImage: document.getElementById('popupImage'),
    popupClose: document.getElementById('popupClose'),
    passwordModal: document.getElementById('passwordModal'),
    passwordForm: document.getElementById('passwordForm'),
    passwordClose: document.getElementById('passwordClose'),
    passwordPrompt: document.getElementById('passwordPrompt'),
    passwordAnswer: document.getElementById('passwordAnswer'),
    passwordMessage: document.getElementById('passwordMessage'),
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

  function normalizeAnswer(value) {
    return String(value || '').trim().toUpperCase();
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
      closePassword();
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

    [el.labelInput, el.actionSelect, el.mediaInput, el.toggleCloseInput, el.promptInput, el.passwordInput]
      .forEach((control) => { control.disabled = disabled; });

    if (!hotspot) {
      el.selectionTitle.textContent = 'Belum ada';
      el.labelInput.value = '';
      el.mediaName.textContent = 'Belum ada media.';
      el.promptInput.value = '';
      el.passwordInput.value = '';
      el.passwordSettings.hidden = true;
      return;
    }

    el.selectionTitle.textContent = hotspot.label || 'Area';
    el.labelInput.value = hotspot.label || '';
    el.actionSelect.value = hotspot.action || 'overlay';
    el.mediaName.textContent = hotspot.mediaName || 'Belum ada media.';
    el.toggleCloseInput.checked = hotspot.toggleClose !== false;
    el.promptInput.value = hotspot.prompt || '';
    el.passwordInput.value = hotspot.password || '';
    el.passwordSettings.hidden = hotspot.action !== 'password';
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
      button.setAttribute('aria-label', hotspot.label || 'Interactive area');

      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = hotspot.label || 'area';
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
    el.addHotspotBtn.textContent = 'Tambah Area Klik';

    if (width < 12 || height < 12) {
      renderHotspots();
      setStatus('Area terlalu kecil. Coba drag area yang lebih besar.');
      return;
    }

    const hotspot = {
      id: uid(),
      label: `Area ${state.hotspots.length + 1}`,
      action: 'overlay',
      mediaDataUrl: '',
      mediaName: '',
      prompt: 'Masukkan password',
      password: '',
      x: (left / rect.width) * 100,
      y: (top / rect.height) * 100,
      w: (width / rect.width) * 100,
      h: (height / rect.height) * 100,
      toggleClose: true,
    };

    state.hotspots.push(hotspot);
    state.selectedId = hotspot.id;
    renderHotspots();
    syncInspector();
    setStatus('Area dibuat. Pilih aksi dan PNG/GIF yang mau dipakai.');
  }

  function clearInlineOverlays() {
    el.comicStage.querySelectorAll('.inline-overlay').forEach((node) => node.remove());
  }

  function showPopup(hotspot) {
    if (!hotspot.mediaDataUrl) return;
    if (hotspot.toggleClose && el.popup.classList.contains('is-open') && el.popup.dataset.hotspotId === hotspot.id) {
      closePopup();
      return;
    }
    el.popupImage.src = hotspot.mediaDataUrl;
    el.popup.dataset.hotspotId = hotspot.id;
    el.popup.classList.add('is-open');
    el.popup.setAttribute('aria-hidden', 'false');
  }

  function showOverlay(hotspot) {
    if (!hotspot.mediaDataUrl) return;
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
    image.style.left = `${hotspot.x}%`;
    image.style.top = `${hotspot.y}%`;
    image.style.width = `${hotspot.w}%`;
    image.style.height = `${hotspot.h}%`;
    el.comicStage.appendChild(image);
  }

  function openPassword(hotspot) {
    state.passwordHotspotId = hotspot.id;
    el.passwordPrompt.textContent = hotspot.prompt || 'Masukkan password';
    el.passwordAnswer.value = '';
    el.passwordMessage.textContent = '';
    el.passwordModal.classList.add('is-open');
    el.passwordModal.setAttribute('aria-hidden', 'false');
    setTimeout(() => el.passwordAnswer.focus(), 0);
  }

  function closePassword() {
    state.passwordHotspotId = null;
    el.passwordModal.classList.remove('is-open');
    el.passwordModal.setAttribute('aria-hidden', 'true');
    el.passwordAnswer.value = '';
    el.passwordMessage.textContent = '';
  }

  function submitPassword() {
    const hotspot = state.hotspots.find((h) => h.id === state.passwordHotspotId);
    if (!hotspot) return;

    const expected = normalizeAnswer(hotspot.password);
    const actual = normalizeAnswer(el.passwordAnswer.value);
    if (!expected) {
      el.passwordMessage.textContent = 'Password belum diatur di Mode Edit.';
      return;
    }
    if (actual !== expected) {
      el.passwordMessage.textContent = 'Jawaban belum tepat, coba lagi.';
      el.passwordAnswer.select();
      return;
    }

    closePassword();
    showPopup(hotspot);
  }

  function runHotspot(hotspot) {
    if (hotspot.action === 'password') {
      openPassword(hotspot);
      return;
    }
    if (hotspot.action === 'popup') {
      showPopup(hotspot);
      return;
    }
    showOverlay(hotspot);
  }

  function closePopup() {
    el.popup.classList.remove('is-open');
    el.popup.setAttribute('aria-hidden', 'true');
    el.popup.dataset.hotspotId = '';
    el.popupImage.removeAttribute('src');
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  }

  function exportStandalone() {
    if (!state.comicDataUrl) {
      setStatus('Pilih gambar komik dulu sebelum export.');
      return;
    }

    const runtimeData = JSON.stringify({ comic: state.comicDataUrl, hotspots: state.hotspots }).replaceAll('<', '\\u003c');
    const html = `<!doctype html>
<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Interactive Comic</title>
<style>
*{box-sizing:border-box}html,body{margin:0;min-height:100%;background:#000}body{display:grid;place-items:center;overflow:auto;font-family:system-ui,sans-serif}.stage{position:relative;display:inline-block;line-height:0;max-width:100vw;max-height:100vh}.comic{display:block;max-width:100vw;max-height:100vh;width:auto;height:auto}.hotspot{position:absolute;border:0;padding:0;background:transparent;cursor:pointer}.overlay{position:absolute;z-index:10;object-fit:cover;object-position:center;pointer-events:none}.popup,.pw{position:fixed;inset:0;z-index:100;display:none;place-items:center;background:rgba(0,0,0,.86);padding:30px}.popup.open,.pw.open{display:grid}.popup img{max-width:94vw;max-height:90vh;object-fit:contain}.close{position:fixed;right:18px;top:18px;width:44px;height:44px;border-radius:50%;border:1px solid #555;background:#111;color:#fff;font-size:28px;cursor:pointer}.card{position:relative;width:min(92vw,480px);padding:26px;border:1px solid #444;border-radius:16px;background:#111;color:#fff;display:grid;gap:14px;line-height:1.4}.card .close{position:absolute;top:10px;right:10px}.card input{min-height:46px;border:1px solid #444;border-radius:9px;background:#080808;color:#fff;padding:10px 12px;font-size:1rem}.card button[type=submit]{min-height:44px;border:0;border-radius:9px;background:#f3d64e;color:#111;font-weight:800;cursor:pointer}.msg{min-height:20px;margin:0;color:#ff8c8c}body.debug .hotspot{outline:2px solid #f3d64e;background:rgba(243,214,78,.13)}
</style></head><body>
<div id="stage" class="stage"><img id="comic" class="comic" alt="Comic"><div id="hotspots"></div></div>
<div id="popup" class="popup"><button id="close" class="close">×</button><img id="popupImg" alt="Popup"></div>
<div id="pw" class="pw"><form id="pwForm" class="card"><button id="pwClose" class="close" type="button">×</button><h2 id="pwPrompt">Masukkan password</h2><input id="pwInput" type="text" autocomplete="off" placeholder="Ketik jawaban"><button type="submit">Jawab</button><p id="pwMsg" class="msg"></p></form></div>
<script>
const DATA=${runtimeData};
const stage=document.getElementById('stage'),comic=document.getElementById('comic'),layer=document.getElementById('hotspots'),popup=document.getElementById('popup'),popupImg=document.getElementById('popupImg'),pw=document.getElementById('pw'),pwForm=document.getElementById('pwForm'),pwPrompt=document.getElementById('pwPrompt'),pwInput=document.getElementById('pwInput'),pwMsg=document.getElementById('pwMsg');let active=null;comic.src=DATA.comic;
const norm=v=>String(v||'').trim().toUpperCase();
function closePopup(){popup.classList.remove('open');popup.dataset.id='';popupImg.removeAttribute('src')}
function showPopup(h){if(!h.mediaDataUrl)return;if(h.toggleClose&&popup.classList.contains('open')&&popup.dataset.id===h.id){closePopup();return}popupImg.src=h.mediaDataUrl;popup.dataset.id=h.id;popup.classList.add('open')}
function overlay(h){if(!h.mediaDataUrl)return;const old=stage.querySelector('.overlay[data-id="'+h.id+'"]');if(old&&h.toggleClose){old.remove();return}if(old)old.remove();const img=document.createElement('img');img.className='overlay';img.dataset.id=h.id;img.src=h.mediaDataUrl;Object.assign(img.style,{left:h.x+'%',top:h.y+'%',width:h.w+'%',height:h.h+'%'});stage.appendChild(img)}
function openPw(h){active=h;pwPrompt.textContent=h.prompt||'Masukkan password';pwInput.value='';pwMsg.textContent='';pw.classList.add('open');setTimeout(()=>pwInput.focus(),0)}
function closePw(){active=null;pw.classList.remove('open');pwInput.value='';pwMsg.textContent=''}
function run(h){if(h.action==='password'){openPw(h);return}if(h.action==='popup'){showPopup(h);return}overlay(h)}
for(const h of DATA.hotspots){const b=document.createElement('button');b.className='hotspot';b.setAttribute('aria-label',h.label||'area');Object.assign(b.style,{left:h.x+'%',top:h.y+'%',width:h.w+'%',height:h.h+'%'});b.onclick=()=>run(h);layer.appendChild(b)}
pwForm.onsubmit=e=>{e.preventDefault();if(!active)return;if(!norm(active.password)){pwMsg.textContent='Password belum diatur.';return}if(norm(pwInput.value)!==norm(active.password)){pwMsg.textContent='Jawaban belum tepat, coba lagi.';pwInput.select();return}const h=active;closePw();showPopup(h)};
document.getElementById('close').onclick=closePopup;document.getElementById('pwClose').onclick=closePw;popup.onclick=e=>{if(e.target===popup)closePopup()};pw.onclick=e=>{if(e.target===pw)closePw()};document.addEventListener('keydown',e=>{if(e.key==='Escape'){closePopup();closePw()}if(e.key.toLowerCase()==='d')document.body.classList.toggle('debug');if(e.key.toLowerCase()==='f'){document.fullscreenElement?document.exitFullscreen?.():document.documentElement.requestFullscreen?.()}});
<\/script></body></html>`;

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
    try { await loadComic(file); }
    catch (error) { console.error(error); setStatus('Gagal membaca gambar.'); }
  });

  el.addHotspotBtn.addEventListener('click', () => {
    state.drawing = !state.drawing;
    state.selectedId = null;
    el.addHotspotBtn.textContent = state.drawing ? 'Batalkan Gambar Area' : 'Tambah Area Klik';
    setStatus(state.drawing ? 'Drag area pada komik untuk membuat area klik.' : 'Pembuatan area dibatalkan.');
    renderHotspots();
    syncInspector();
  });

  el.deleteHotspotBtn.addEventListener('click', () => {
    if (!state.selectedId) return;
    state.hotspots = state.hotspots.filter((h) => h.id !== state.selectedId);
    state.selectedId = null;
    renderHotspots();
    syncInspector();
    setStatus('Area dihapus.');
  });

  el.comicStage.addEventListener('mousedown', beginDraw);
  window.addEventListener('mousemove', updateDraw);
  window.addEventListener('mouseup', finishDraw);

  el.labelInput.addEventListener('input', () => {
    const hotspot = selectedHotspot();
    if (!hotspot) return;
    hotspot.label = el.labelInput.value;
    el.selectionTitle.textContent = hotspot.label || 'Area';
    renderHotspots();
  });

  el.actionSelect.addEventListener('change', () => {
    const hotspot = selectedHotspot();
    if (!hotspot) return;
    hotspot.action = el.actionSelect.value;
    el.passwordSettings.hidden = hotspot.action !== 'password';
  });

  el.promptInput.addEventListener('input', () => {
    const hotspot = selectedHotspot();
    if (hotspot) hotspot.prompt = el.promptInput.value;
  });

  el.passwordInput.addEventListener('input', () => {
    const hotspot = selectedHotspot();
    if (hotspot) hotspot.password = el.passwordInput.value;
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

  el.toggleCloseInput.addEventListener('change', () => {
    const hotspot = selectedHotspot();
    if (hotspot) hotspot.toggleClose = el.toggleCloseInput.checked;
  });

  el.modeBtn.addEventListener('click', () => setMode(state.mode === 'edit' ? 'demo' : 'edit'));
  el.fullscreenBtn.addEventListener('click', toggleFullscreen);
  el.exportBtn.addEventListener('click', exportStandalone);
  el.popupClose.addEventListener('click', closePopup);
  el.popup.addEventListener('click', (event) => { if (event.target === el.popup) closePopup(); });
  el.passwordClose.addEventListener('click', closePassword);
  el.passwordModal.addEventListener('click', (event) => { if (event.target === el.passwordModal) closePassword(); });
  el.passwordForm.addEventListener('submit', (event) => { event.preventDefault(); submitPassword(); });

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
    if (event.key === 'Escape') { closePopup(); closePassword(); }
  });

  setMode('edit');
})();

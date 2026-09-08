(() => {
  'use strict';

  const state = {
    panels: [],
    currentPanel: 0,
    selectedId: null,
    mode: 'edit',
    drawing: false,
    drawStart: null,
    debug: false,
    passwordHotspotId: null,
  };

  const el = Object.fromEntries([
    'panelInput','comicStage','comicImage','hotspotLayer','addHotspotBtn','deleteHotspotBtn','deletePanelBtn',
    'modeBtn','fullscreenBtn','exportBtn','statusText','panelStrip','panelTitle','selectionTitle','hotspotControls',
    'labelInput','actionSelect','passwordSettings','promptInput','passwordInput','mediaInput','mediaName','toggleCloseInput',
    'popup','popupImage','popupClose','passwordModal','passwordForm','passwordClose','passwordPrompt','passwordAnswer',
    'passwordMessage','demoNav','prevPanelBtn','nextPanelBtn','demoCounter'
  ].map(id => [id, document.getElementById(id)]));

  const uid = () => `h_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  const normalizeAnswer = value => String(value || '').trim().toUpperCase();

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function panel() { return state.panels[state.currentPanel] || null; }
  function hotspot() { return panel()?.hotspots.find(h => h.id === state.selectedId) || null; }
  function setStatus(text) { el.statusText.textContent = text; }

  async function addPanels(files) {
    for (const file of files) {
      const dataUrl = await fileToDataUrl(file);
      state.panels.push({ id: uid(), name: file.name, dataUrl, hotspots: [] });
    }
    if (state.panels.length && state.currentPanel >= state.panels.length) state.currentPanel = state.panels.length - 1;
    if (state.panels.length === files.length) state.currentPanel = 0;
    state.selectedId = null;
    render();
    setStatus(`${files.length} panel ditambahkan. Total ${state.panels.length} panel.`);
  }

  function selectPanel(index) {
    if (index < 0 || index >= state.panels.length) return;
    closePopup();
    closePassword();
    state.currentPanel = index;
    state.selectedId = null;
    render();
  }

  function deleteCurrentPanel() {
    if (!panel()) return;
    state.panels.splice(state.currentPanel, 1);
    state.currentPanel = Math.max(0, Math.min(state.currentPanel, state.panels.length - 1));
    state.selectedId = null;
    render();
    setStatus('Panel dihapus.');
  }

  function setMode(mode) {
    state.mode = mode;
    const editing = mode === 'edit';
    document.body.classList.toggle('edit-mode', editing);
    document.body.classList.toggle('demo-mode', !editing);
    el.modeBtn.textContent = editing ? 'Mode: Edit' : 'Mode: Demo';
    state.selectedId = null;
    state.drawing = false;
    el.addHotspotBtn.textContent = 'Tambah Area Interaktif';
    closePopup();
    closePassword();
    clearOverlays();
    if (!editing && state.panels.length) state.currentPanel = 0;
    render();
  }

  function render() {
    renderPanel();
    renderPanelStrip();
    renderHotspots();
    syncInspector();
    syncDemoNav();
  }

  function renderPanel() {
    const p = panel();
    const hasPanel = !!p;
    el.comicStage.classList.toggle('is-empty', !hasPanel);
    el.comicStage.classList.toggle('has-image', hasPanel);
    el.addHotspotBtn.disabled = !hasPanel || state.mode !== 'edit';
    el.deletePanelBtn.disabled = !hasPanel || state.mode !== 'edit';
    if (p) {
      el.comicImage.src = p.dataUrl;
      el.panelTitle.textContent = `Fig ${state.currentPanel + 1} / ${state.panels.length}`;
    } else {
      el.comicImage.removeAttribute('src');
      el.panelTitle.textContent = 'Belum ada';
    }
  }

  function renderPanelStrip() {
    el.panelStrip.innerHTML = '';
    state.panels.forEach((p, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'panel-thumb' + (index === state.currentPanel ? ' active' : '');
      button.innerHTML = `<img alt="Fig ${index + 1}"><span>Fig ${index + 1}</span>`;
      button.querySelector('img').src = p.dataUrl;
      button.addEventListener('click', () => selectPanel(index));
      el.panelStrip.appendChild(button);
    });
  }

  function renderHotspots() {
    clearOverlays();
    el.hotspotLayer.innerHTML = '';
    const p = panel();
    if (!p) return;

    for (const h of p.hotspots) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'hotspot';
      if (state.mode === 'edit' && h.id === state.selectedId) button.classList.add('is-selected');
      Object.assign(button.style, { left:`${h.x}%`, top:`${h.y}%`, width:`${h.w}%`, height:`${h.h}%` });
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = h.label || 'area';
      button.appendChild(tag);
      button.addEventListener('click', event => {
        event.stopPropagation();
        if (state.mode === 'edit') {
          state.selectedId = h.id;
          renderHotspots();
          syncInspector();
        } else runHotspot(h);
      });
      el.hotspotLayer.appendChild(button);
    }
  }

  function syncInspector() {
    const h = hotspot();
    const disabled = !h || state.mode !== 'edit';
    el.hotspotControls.classList.toggle('is-disabled', disabled);
    el.hotspotControls.setAttribute('aria-disabled', String(disabled));
    el.deleteHotspotBtn.disabled = disabled;
    [el.labelInput,el.actionSelect,el.promptInput,el.passwordInput,el.mediaInput,el.toggleCloseInput]
      .forEach(control => { control.disabled = disabled; });

    if (!h) {
      el.selectionTitle.textContent = 'Belum ada';
      el.labelInput.value = '';
      el.mediaName.textContent = 'Belum ada media.';
      el.passwordSettings.hidden = true;
      return;
    }

    el.selectionTitle.textContent = h.label || 'Area';
    el.labelInput.value = h.label || '';
    el.actionSelect.value = h.action;
    el.promptInput.value = h.prompt || '';
    el.passwordInput.value = h.password || '';
    el.mediaName.textContent = h.mediaName || 'Belum ada media.';
    el.toggleCloseInput.checked = h.toggleClose;
    el.passwordSettings.hidden = h.action !== 'password';
  }

  function syncDemoNav() {
    const count = state.panels.length;
    el.demoCounter.textContent = count ? `${state.currentPanel + 1} / ${count}` : '0 / 0';
    el.prevPanelBtn.disabled = state.currentPanel <= 0;
    el.nextPanelBtn.disabled = !count || state.currentPanel >= count - 1;
    el.demoNav.setAttribute('aria-hidden', String(state.mode !== 'demo'));
  }

  function beginDraw(event) {
    if (!state.drawing || state.mode !== 'edit' || !panel() || event.button !== 0) return;
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
    const { x:sx, y:sy, rect } = state.drawStart;
    const ex = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
    const ey = Math.max(0, Math.min(rect.height, event.clientY - rect.top));
    const left = Math.min(sx, ex), top = Math.min(sy, ey), width = Math.abs(ex - sx), height = Math.abs(ey - sy);
    const box = document.getElementById('activeDrawBox');
    if (box) Object.assign(box.style, { left:`${left}px`, top:`${top}px`, width:`${width}px`, height:`${height}px` });
  }

  function finishDraw(event) {
    if (!state.drawStart) return;
    const { x:sx, y:sy, rect } = state.drawStart;
    const ex = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
    const ey = Math.max(0, Math.min(rect.height, event.clientY - rect.top));
    const left = Math.min(sx, ex), top = Math.min(sy, ey), width = Math.abs(ex - sx), height = Math.abs(ey - sy);
    state.drawStart = null;
    state.drawing = false;
    el.addHotspotBtn.textContent = 'Tambah Area Interaktif';
    if (width < 12 || height < 12) { renderHotspots(); setStatus('Area terlalu kecil.'); return; }

    const h = {
      id: uid(), label:`Area ${panel().hotspots.length + 1}`, action:'overlay',
      mediaDataUrl:'', mediaName:'', prompt:'Masukkan password', password:'',
      x:left/rect.width*100, y:top/rect.height*100, w:width/rect.width*100, h:height/rect.height*100,
      toggleClose:true,
    };
    panel().hotspots.push(h);
    state.selectedId = h.id;
    renderHotspots();
    syncInspector();
    setStatus(`Area dibuat di Fig ${state.currentPanel + 1}.`);
  }

  function clearOverlays() { el.comicStage.querySelectorAll('.inline-overlay').forEach(node => node.remove()); }

  function showOverlay(h) {
    if (!h.mediaDataUrl) return;
    const old = el.comicStage.querySelector(`.inline-overlay[data-id="${h.id}"]`);
    if (old && h.toggleClose) { old.remove(); return; }
    if (old) old.remove();
    const img = document.createElement('img');
    img.className = 'inline-overlay'; img.dataset.id = h.id; img.src = h.mediaDataUrl;
    Object.assign(img.style, { left:`${h.x}%`, top:`${h.y}%`, width:`${h.w}%`, height:`${h.h}%` });
    el.comicStage.appendChild(img);
  }

  function showPopup(h) {
    if (!h.mediaDataUrl) return;
    if (h.toggleClose && el.popup.classList.contains('is-open') && el.popup.dataset.id === h.id) { closePopup(); return; }
    el.popupImage.src = h.mediaDataUrl;
    el.popup.dataset.id = h.id;
    el.popup.classList.add('is-open');
    el.popup.setAttribute('aria-hidden', 'false');
  }

  function closePopup() { el.popup.classList.remove('is-open'); el.popup.dataset.id=''; el.popupImage.removeAttribute('src'); el.popup.setAttribute('aria-hidden','true'); }

  function openPassword(h) {
    state.passwordHotspotId = h.id;
    el.passwordPrompt.textContent = h.prompt || 'Masukkan password';
    el.passwordAnswer.value = '';
    el.passwordMessage.textContent = '';
    el.passwordModal.classList.add('is-open');
    el.passwordModal.setAttribute('aria-hidden','false');
    setTimeout(() => el.passwordAnswer.focus(), 0);
  }

  function closePassword() { state.passwordHotspotId=null; el.passwordModal.classList.remove('is-open'); el.passwordModal.setAttribute('aria-hidden','true'); el.passwordAnswer.value=''; el.passwordMessage.textContent=''; }

  function runHotspot(h) {
    if (h.action === 'password') return openPassword(h);
    if (h.action === 'popup') return showPopup(h);
    showOverlay(h);
  }

  function submitPassword() {
    const h = panel()?.hotspots.find(item => item.id === state.passwordHotspotId);
    if (!h) return;
    if (normalizeAnswer(el.passwordAnswer.value) !== normalizeAnswer(h.password)) {
      el.passwordMessage.textContent = 'Jawaban belum tepat, coba lagi.';
      el.passwordAnswer.select();
      return;
    }
    closePassword();
    showPopup(h);
  }

  function movePanel(delta) {
    if (state.mode !== 'demo') return;
    const next = state.currentPanel + delta;
    if (next < 0 || next >= state.panels.length) return;
    selectPanel(next);
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  }

  function exportStandalone() {
    if (!state.panels.length) { setStatus('Masukkan panel dulu sebelum export.'); return; }
    const data = JSON.stringify({ panels: state.panels }).replaceAll('<','\\u003c');
    const html = `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Interactive Comic</title><style>
*{box-sizing:border-box}html,body{margin:0;min-height:100%;background:#000}body{font-family:system-ui,sans-serif;color:#fff}.stage-wrap{min-height:100vh;display:grid;place-items:center;padding:0 0 76px}.stage{position:relative;display:inline-block;line-height:0;max-width:100vw;max-height:calc(100vh - 76px)}.comic{display:block;max-width:100vw;max-height:calc(100vh - 76px);width:auto;height:auto}.hotspot{position:absolute;border:0;padding:0;background:transparent;cursor:pointer}.overlay{position:absolute;z-index:10;object-fit:cover;pointer-events:none}.nav{position:fixed;z-index:80;left:0;right:0;bottom:0;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;gap:12px;background:linear-gradient(transparent,rgba(0,0,0,.7));pointer-events:none}.nav button{pointer-events:auto;min-height:44px;border:1px solid #666;background:#111d;color:#fff;border-radius:999px;padding:10px 18px;font-weight:800;cursor:pointer}.nav button.next{background:#f3d64e;color:#111;border-color:#f3d64e}.nav button:disabled{visibility:hidden}.count{font-size:13px;background:#000b;padding:7px 11px;border-radius:999px}.popup,.pw{position:fixed;inset:0;z-index:100;display:none;place-items:center;background:#000d;padding:30px}.popup.open,.pw.open{display:grid}.popup img{max-width:94vw;max-height:90vh;object-fit:contain}.close{position:fixed;right:18px;top:18px;width:44px;height:44px;border-radius:50%;border:1px solid #555;background:#111;color:#fff;font-size:28px;cursor:pointer}.card{position:relative;width:min(92vw,480px);padding:26px;border:1px solid #444;border-radius:16px;background:#111;display:grid;gap:14px}.card input{min-height:46px;border:1px solid #444;border-radius:9px;background:#080808;color:#fff;padding:10px 12px;font-size:1rem}.card button[type=submit]{min-height:44px;border:0;border-radius:9px;background:#f3d64e;color:#111;font-weight:800;cursor:pointer}.msg{min-height:20px;margin:0;color:#ff8c8c}body.debug .hotspot{outline:2px solid #f3d64e;background:#f3d64e22}
</style></head><body><div class="stage-wrap"><div id="stage" class="stage"><img id="comic" class="comic"><div id="layer"></div></div></div><div class="nav"><button id="prev">← Kembali</button><span id="count" class="count"></span><button id="next" class="next">Lanjut →</button></div><div id="popup" class="popup"><button id="close" class="close">×</button><img id="popupImg"></div><div id="pw" class="pw"><form id="pwForm" class="card"><h2 id="pwPrompt">Masukkan password</h2><input id="pwInput" autocomplete="off"><button type="submit">Jawab</button><p id="pwMsg" class="msg"></p></form></div><script>
const DATA=${data},stage=document.getElementById('stage'),comic=document.getElementById('comic'),layer=document.getElementById('layer'),popup=document.getElementById('popup'),popupImg=document.getElementById('popupImg'),pw=document.getElementById('pw'),pwForm=document.getElementById('pwForm'),pwPrompt=document.getElementById('pwPrompt'),pwInput=document.getElementById('pwInput'),pwMsg=document.getElementById('pwMsg'),prev=document.getElementById('prev'),next=document.getElementById('next'),count=document.getElementById('count');let i=0,active=null;const norm=v=>String(v||'').trim().toUpperCase();function clearO(){stage.querySelectorAll('.overlay').forEach(n=>n.remove())}function closePopup(){popup.classList.remove('open');popupImg.removeAttribute('src')}function closePw(){active=null;pw.classList.remove('open');pwInput.value='';pwMsg.textContent=''}function showPopup(h){if(!h.mediaDataUrl)return;popupImg.src=h.mediaDataUrl;popup.classList.add('open')}function overlay(h){if(!h.mediaDataUrl)return;const old=stage.querySelector('.overlay[data-id="'+h.id+'"]');if(old&&h.toggleClose){old.remove();return}if(old)old.remove();const img=document.createElement('img');img.className='overlay';img.dataset.id=h.id;img.src=h.mediaDataUrl;Object.assign(img.style,{left:h.x+'%',top:h.y+'%',width:h.w+'%',height:h.h+'%'});stage.appendChild(img)}function run(h){if(h.action==='password'){active=h;pwPrompt.textContent=h.prompt||'Masukkan password';pwInput.value='';pwMsg.textContent='';pw.classList.add('open');setTimeout(()=>pwInput.focus(),0);return}if(h.action==='popup'){showPopup(h);return}overlay(h)}function render(){clearO();closePopup();closePw();const p=DATA.panels[i];comic.src=p.dataUrl;layer.innerHTML='';for(const h of p.hotspots){const b=document.createElement('button');b.className='hotspot';Object.assign(b.style,{left:h.x+'%',top:h.y+'%',width:h.w+'%',height:h.h+'%'});b.onclick=()=>run(h);layer.appendChild(b)}prev.disabled=i===0;next.disabled=i===DATA.panels.length-1;count.textContent=(i+1)+' / '+DATA.panels.length}function move(d){const n=i+d;if(n<0||n>=DATA.panels.length)return;i=n;render()}prev.onclick=()=>move(-1);next.onclick=()=>move(1);document.getElementById('close').onclick=closePopup;popup.onclick=e=>{if(e.target===popup)closePopup()};pw.onclick=e=>{if(e.target===pw)closePw()};pwForm.onsubmit=e=>{e.preventDefault();if(!active)return;if(norm(pwInput.value)!==norm(active.password)){pwMsg.textContent='Jawaban belum tepat, coba lagi.';pwInput.select();return}const h=active;closePw();showPopup(h)};document.addEventListener('keydown',e=>{if(e.key==='ArrowRight')move(1);if(e.key==='ArrowLeft')move(-1);if(e.key==='Escape'){closePopup();closePw()}if(e.key.toLowerCase()==='d')document.body.classList.toggle('debug');if(e.key.toLowerCase()==='f'){document.fullscreenElement?document.exitFullscreen?.():document.documentElement.requestFullscreen?.()}});render();
<\/script></body></html>`;
    const blob = new Blob([html], { type:'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'interactive-comic-final.html';
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    setStatus('Export selesai: interactive-comic-final.html');
  }

  el.panelInput.addEventListener('change', async () => {
    const files = [...(el.panelInput.files || [])];
    if (!files.length) return;
    try { await addPanels(files); } catch (error) { console.error(error); setStatus('Gagal membaca panel.'); }
    el.panelInput.value = '';
  });
  el.addHotspotBtn.addEventListener('click', () => {
    state.drawing = !state.drawing;
    state.selectedId = null;
    el.addHotspotBtn.textContent = state.drawing ? 'Batalkan Area' : 'Tambah Area Interaktif';
    renderHotspots(); syncInspector();
    setStatus(state.drawing ? 'Drag area pada panel.' : 'Pembuatan area dibatalkan.');
  });
  el.deleteHotspotBtn.addEventListener('click', () => {
    const p = panel(); if (!p || !state.selectedId) return;
    p.hotspots = p.hotspots.filter(h => h.id !== state.selectedId);
    state.selectedId = null; render(); setStatus('Area dihapus.');
  });
  el.deletePanelBtn.addEventListener('click', deleteCurrentPanel);
  el.comicStage.addEventListener('mousedown', beginDraw);
  window.addEventListener('mousemove', updateDraw);
  window.addEventListener('mouseup', finishDraw);
  el.labelInput.addEventListener('input', () => { const h=hotspot(); if(!h)return; h.label=el.labelInput.value; el.selectionTitle.textContent=h.label||'Area'; renderHotspots(); });
  el.actionSelect.addEventListener('change', () => { const h=hotspot(); if(!h)return; h.action=el.actionSelect.value; el.passwordSettings.hidden=h.action!=='password'; });
  el.promptInput.addEventListener('input', () => { const h=hotspot(); if(h)h.prompt=el.promptInput.value; });
  el.passwordInput.addEventListener('input', () => { const h=hotspot(); if(h)h.password=el.passwordInput.value; });
  el.mediaInput.addEventListener('change', async () => { const h=hotspot(), file=el.mediaInput.files?.[0]; if(!h||!file)return; h.mediaDataUrl=await fileToDataUrl(file); h.mediaName=file.name; el.mediaName.textContent=file.name; el.mediaInput.value=''; });
  el.toggleCloseInput.addEventListener('change', () => { const h=hotspot(); if(h)h.toggleClose=el.toggleCloseInput.checked; });
  el.modeBtn.addEventListener('click', () => setMode(state.mode==='edit'?'demo':'edit'));
  el.fullscreenBtn.addEventListener('click', toggleFullscreen);
  el.exportBtn.addEventListener('click', exportStandalone);
  el.prevPanelBtn.addEventListener('click', () => movePanel(-1));
  el.nextPanelBtn.addEventListener('click', () => movePanel(1));
  el.popupClose.addEventListener('click', closePopup);
  el.popup.addEventListener('click', e => { if(e.target===el.popup)closePopup(); });
  el.passwordClose.addEventListener('click', closePassword);
  el.passwordModal.addEventListener('click', e => { if(e.target===el.passwordModal)closePassword(); });
  el.passwordForm.addEventListener('submit', e => { e.preventDefault(); submitPassword(); });
  document.addEventListener('keydown', event => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return;
    if (event.key.toLowerCase()==='e') setMode(state.mode==='edit'?'demo':'edit');
    if (event.key.toLowerCase()==='d') { state.debug=!state.debug; document.body.classList.toggle('debug-hotspots',state.debug); }
    if (event.key.toLowerCase()==='f') toggleFullscreen();
    if (state.mode==='demo' && event.key==='ArrowRight') movePanel(1);
    if (state.mode==='demo' && event.key==='ArrowLeft') movePanel(-1);
    if (event.key==='Escape') { closePopup(); closePassword(); }
  });

  render();
})();

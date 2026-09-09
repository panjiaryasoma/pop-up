const semuaTombol = document.querySelectorAll('.tombol-popup');
const popup = document.getElementById('popup');
const gambarPopup = document.getElementById('gambarPopup');
const kolomJawaban = document.getElementById('jawaban');
const cekJawaban = document.getElementById('cekJawaban');
const pesanJawaban = document.getElementById('pesanJawaban');
const popupJawaban = document.getElementById('popupJawaban');

// Fitur baru untuk panel terakhir.
const areaFinal = document.getElementById('areaFinal');
const mediaFinalArea = document.getElementById('mediaFinalArea');

semuaTombol.forEach(function (tombol) {
  tombol.addEventListener('click', function () {
    gambarPopup.src = tombol.dataset.popup;
    popup.classList.add('muncul');
  });
});

popup.addEventListener('click', function () {
  popup.classList.remove('muncul');
  gambarPopup.src = '';
});

// ---------------------------------------------------------
// PANEL TERAKHIR
// ---------------------------------------------------------
// data-mode="overlay" -> cuma area yang ditentukan CSS yang berubah.
// data-mode="popup"   -> file dibuka dengan popup biasa.
areaFinal.addEventListener('click', function () {
  const mode = areaFinal.dataset.mode || 'overlay';
  const media = areaFinal.dataset.media;

  if (!media) {
    console.warn('data-media pada #areaFinal belum diisi.');
    return;
  }

  if (mode === 'popup') {
    gambarPopup.src = media;
    popup.classList.add('muncul');
    return;
  }

  // Default: overlay tepat di area yang sama dengan tombol transparan.
  if (mediaFinalArea.classList.contains('muncul')) {
    mediaFinalArea.classList.remove('muncul');
    mediaFinalArea.src = '';
  } else {
    mediaFinalArea.src = media;
    mediaFinalArea.classList.add('muncul');
  }
});

function periksaJawaban() {
  const jawabanPengguna = kolomJawaban.value.trim();

  if (jawabanPengguna === 'MERDEKA') {
    pesanJawaban.textContent = '';
    popupJawaban.classList.add('muncul');
  } else {
    pesanJawaban.textContent = 'Jawaban belum tepat, coba lagi.';
  }
}

cekJawaban.addEventListener('click', periksaJawaban);

kolomJawaban.addEventListener('keydown', function (event) {
  if (event.key === 'Enter') {
    periksaJawaban();
  }
});

popupJawaban.addEventListener('click', function () {
  popupJawaban.classList.remove('muncul');
});

// Tekan D untuk melihat / menyembunyikan kotak area final saat setting posisi.
document.addEventListener('keydown', function (event) {
  if (event.key.toLowerCase() === 'd') {
    document.body.classList.toggle('debug-area');
  }
});

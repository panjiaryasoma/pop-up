# Pop-up — Offline Interactive Comic Hotspot Builder

Tool kecil berbasis **HTML + CSS + vanilla JavaScript** untuk membuat komik/gambar interaktif tanpa internet dan tanpa dependency eksternal.

## Yang bisa dilakukan

- Masukkan artwork PNG/JPG/WebP/GIF dari laptop.
- Drag area pada artwork untuk membuat **hotspot transparan**.
- Setiap hotspot bisa menampilkan:
  - **Popup** PNG/GIF/WebP di layar.
  - **Overlay** PNG/GIF/WebP tepat di atas area hotspot.
- Mode **Edit** menampilkan area hotspot.
- Mode **Demo** menyembunyikan seluruh UI editor dan hotspot.
- Tekan `D` untuk menyalakan debug hotspot saat demo.
- Tekan `F` untuk fullscreen.
- **Export HTML Final** menghasilkan satu file HTML standalone yang sudah membawa artwork, hotspot, dan media di dalam file tersebut. File hasil export dapat dibuka offline dengan double-click.

## Cara pakai saat lomba

1. Download/clone repo ini sebelum lomba.
2. Double-click `index.html`.
3. Klik **Pilih Gambar Komik**.
4. Klik **Tambah Hotspot**, lalu drag area yang ingin dibuat interaktif.
5. Pilih aksi `Popup layar` atau `Overlay di area hotspot`.
6. Pilih file PNG/GIF/WebP untuk hotspot tersebut.
7. Ulangi kalau ada hotspot lain.
8. Ubah ke **Mode: Demo** untuk tes.
9. Kembali ke Edit, lalu klik **Export HTML Final**.
10. Gunakan `interactive-comic-final.html` untuk presentasi. Tidak membutuhkan internet.

## Catatan penting

- Jangan pakai CDN, React, Bootstrap, npm, atau dependency online. Repo ini sengaja vanilla supaya aman saat offline.
- Semua file media yang dimasukkan di editor akan di-embed ke hasil export sebagai Data URL. Akibatnya ukuran HTML final bisa besar kalau GIF/video-like animation yang dipakai juga besar.
- Tool ini menerima image/GIF, bukan video MP4. GIF/WebP animasi lebih aman untuk workflow satu-file offline.
- Kalau browser memblokir fullscreen dari shortcut, klik tombol **Fullscreen** sekali karena beberapa browser mensyaratkan user gesture.

## Shortcut

| Tombol | Fungsi |
|---|---|
| `E` | Edit / Demo |
| `D` | Debug hotspot |
| `F` | Fullscreen |
| `Esc` | Tutup popup |

# Pop-up — Offline Interactive Comic Sequence Builder

Tool HTML + CSS + vanilla JavaScript untuk alur:

`Fig 1 → Fig 2 → Fig 3 → ... → panel terakhir interaktif`

Fokusnya sengaja sederhana untuk lomba offline: panel biasa hanya untuk navigasi, lalu **panel terakhir** bisa diberi area transparan yang memunculkan PNG/GIF, mengganti sebagian area, atau meminta password sebelum popup.

## Cara pakai

1. Buka `index.html`.
2. Klik **Tambah Panel** dan pilih semua Fig. File diurutkan natural berdasarkan nama, jadi `fig-1.png`, `fig-2.png`, `fig-10.png` tetap masuk urutan benar.
3. Jika urutan masih salah, pilih thumbnail lalu gunakan tombol **← Geser / Geser →**.
4. Pilih thumbnail bertanda **FINAL**.
5. Klik **Tambah Area Popup**, lalu drag objek/area yang ingin bisa diklik.
6. Pilih aksi:
   - **Popup PNG / GIF**
   - **Ganti hanya area yang di-drag**
   - **Password → lalu popup**
7. Pilih PNG/GIF/WebP yang akan muncul.
8. Klik **Mode: Demo**. Demo selalu mulai dari Fig 1.
9. Gunakan **Kembali / Lanjut** atau tombol panah keyboard sampai panel terakhir, lalu klik area interaktif.
10. Kembali ke Edit dan klik **Export HTML Final**.

Hasil export adalah satu file `interactive-comic-final.html` yang berisi semua panel dan media sebagai Data URL, sehingga bisa dibuka langsung tanpa internet, server, npm, CDN, atau aplikasi tambahan.

## Shortcut

- `E`: Edit / Demo
- `D`: tampilkan area klik saat Demo
- `F`: fullscreen
- `← / →`: pindah panel saat Demo
- `Esc`: tutup popup / password

## Catatan

- Interaksi sengaja hanya aktif di panel paling akhir supaya alurnya sesuai konsep lomba dan tidak membingungkan saat presentasi.
- Password hanyalah mekanik puzzle lokal, bukan fitur keamanan.
- GIF besar akan membuat file HTML final ikut besar.

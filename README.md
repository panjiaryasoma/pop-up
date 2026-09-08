# Pop-up — Offline Interactive Comic Sequence Builder

Tool HTML + CSS + vanilla JavaScript untuk membuat rangkaian panel komik offline:

`Fig 1 → Fig 2 → Fig 3 → ... → panel terakhir interaktif`

## Alur yang didukung

- Masukkan beberapa panel PNG/JPG/WebP/GIF sekaligus.
- Panel tampil berurutan dan saat Mode Demo dipindahkan dengan tombol **Kembali / Lanjut** atau tombol panah keyboard.
- Setiap panel bisa punya area interaktif, tetapi use case utama adalah menaruh interaksi di panel terakhir.
- Area interaktif dapat:
  - mengganti hanya bagian yang di-drag dengan PNG/GIF,
  - menampilkan popup,
  - meminta password lalu menampilkan popup.
- Semua berjalan offline dan tanpa dependency eksternal.
- **Export HTML Final** menghasilkan satu file standalone dengan semua panel dan media tertanam di dalamnya.

## Workflow lomba

1. Buka `index.html`.
2. Klik **Tambah Panel** dan pilih Fig 1, Fig 2, Fig 3, dst. dalam urutan yang benar.
3. Pilih thumbnail panel terakhir.
4. Klik **Tambah Area Interaktif**, lalu drag bagian yang mau bisa diklik.
5. Pilih aksi: area replacement, popup, atau password → popup.
6. Pilih PNG/GIF untuk hasil interaksi.
7. Masuk **Mode Demo**.
8. Gunakan tombol **Lanjut** untuk berpindah Fig 1 → Fig 2 → ...
9. Pada panel terakhir, klik area interaktif.
10. Kembali ke Edit dan klik **Export HTML Final**.

Tidak ada AI, internet, server, npm, React, atau CDN yang dipakai.

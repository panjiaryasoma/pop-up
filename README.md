# pop-up

Versi ini sengaja tetap mengikuti template Stephen yang sederhana: beberapa gambar ditumpuk vertikal dalam satu halaman, tombol lama tetap membuka popup, pertanyaan password tetap ada di bawah, dan **hanya panel terakhir** mendapat satu area interaktif tambahan.

## Struktur

```text
gambar-1.JPG
gambar-2.JPG
gambar-3.JPG
gambar-4.JPG        <- panel terakhir
popup-1.JPG ...     <- popup lama
final-area.gif      <- media baru untuk area panel terakhir
popup-jawaban-benar.png
index.html
styles.css
script.js
```

## Area interaktif panel terakhir

Di `index.html` ada:

```html
<button
  class="area-final"
  id="areaFinal"
  data-mode="overlay"
  data-media="final-area.gif"
></button>
```

`data-mode="overlay"` berarti **cuma area pada Gambar 4 yang berubah** menjadi `final-area.gif`.

Kalau ingin media final muncul sebagai popup besar, ubah satu kata:

```html
data-mode="popup"
```

## Mengatur posisi area final

Edit bagian ini di `styles.css`:

```css
.area-final,
.media-final-area {
  left: 62%;
  top: 55%;
  width: 18%;
  height: 14%;
}
```

Semua angka dihitung relatif terhadap **Gambar 4 saja**, bukan seluruh halaman panjang.

Tekan `D` saat halaman terbuka untuk menampilkan kotak hijau debug. Tekan `D` lagi untuk menyembunyikannya.

## Yang tidak berubah dari template awal

- `gambar-1.JPG` sampai `gambar-4.JPG` masih ditumpuk vertikal.
- `.tombol-1` sampai `.tombol-7` masih memakai posisi `top/left` lama.
- Popup lama tetap bekerja.
- Password `MERDEKA` tetap bekerja.
- Semua berjalan offline dengan HTML + CSS + JavaScript biasa, tanpa dependency.

# Creator Assistant

Creator Assistant adalah SPA statis untuk membantu kreator membuat ide, judul, hook, hashtag, dan blueprint konten langsung di browser.

## Fitur

- Generate All untuk membuat 5 output sekaligus.
- Generator terpisah untuk Ide, Judul, Hook, Hashtag, dan Blueprint.
- Ide, Judul, dan Hook menghasilkan beberapa variasi dalam satu kali generate.
- Hashtag menghasilkan beberapa paket tag relevan dengan kombinasi baru setiap generate.
- Generator menghindari pengulangan output terbaru untuk topik yang sama.
- Reset generator untuk mengosongkan input, pilihan aktif, dan hasil sementara.
- Copy dan Save pada setiap kartu hasil.
- Riwayat lokal maksimal 20 item.
- Favorit lokal maksimal 50 item.
- Day Mode dan Night Mode yang tersimpan otomatis di browser.
- Tidak memakai framework, backend, database, API eksternal, atau build step.

## Struktur

```text
creator-assistant/
+-- index.html
+-- README.md
+-- assets/
    +-- css/
    |   +-- ui-system.css
    +-- js/
    |   +-- data.js
    |   +-- generators.js
    |   +-- storage.js
    |   +-- app.js
    +-- img/
```

## Menjalankan

Buka `index.html` langsung di browser, atau deploy folder ini ke GitHub Pages.

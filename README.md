# UTS Statistika Ganjil 2026/2027 — Kelompok 5

Teknik Informatika. Dua aplikasi web statis (HTML, CSS, JavaScript) yang masing-masing punya folder sendiri.

```
.
├── index.html                       # halaman pemilih soal
├── soal-1-statistik-deskriptif/
│   ├── index.html
│   ├── style.css
│   └── script.js
└── soal-2-probabilitas/
    ├── index.html
    ├── style.css
    └── script.js
```

## Cara membuka
- Lokal: buka `index.html` di root, atau langsung `soal-1-.../index.html` dan `soal-2-.../index.html`.
- GitHub Pages: Settings → Pages → Deploy from a branch → `main` / `(root)`.
  - Soal 1: `https://<username>.github.io/<repo>/soal-1-statistik-deskriptif/`
  - Soal 2: `https://<username>.github.io/<repo>/soal-2-probabilitas/`

## Upload ke GitHub
```bash
git init
git add .
git commit -m "Tambah soal 1 dan soal 2"
git branch -M main
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin main
```

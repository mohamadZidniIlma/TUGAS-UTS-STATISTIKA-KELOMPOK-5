const $ = s => document.querySelector(s);
const f = (x, d = 4) => Number.isFinite(x) ? String(+x.toFixed(d)).replace('.', ',') : '-';
const tbl = (rows, head) =>
  `<table><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr>` +
  rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('') + `</table>`;

const ringkas = (arr, sep = ' + ', maks = 10) =>
  arr.slice(0, maks).map(v => f(v)).join(sep) + (arr.length > maks ? `${sep}… (${arr.length - maks} data lainnya)` : '');
const ringkasKuadrat = (arr, m, maks = 5) =>
  arr.slice(0, maks).map(v => `(${f(v)} − ${f(m)})²`).join(' + ') + (arr.length > maks ? ` + … (${arr.length - maks} suku lainnya)` : '');

function parseData(teks) {
  const hasil = [];
  teks.split(/[\s,;]+/).filter(Boolean).forEach(x => {
    const v = Number(x);
    if (Number.isFinite(v)) hasil.push(v); 
  });
  return hasil;
}

$('#csv').onchange = e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => { $('#manual').value = reader.result; proses(); };
  reader.readAsText(file);
};

function kuartil(s, p) {
  const i = (s.length - 1) * p, l = Math.floor(i), h = Math.ceil(i);
  return s[l] + (s[h] - s[l]) * (i - l);
}

function hitungModus(s) {
  const cnt = new Map();
  s.forEach(v => cnt.set(v, (cnt.get(v) || 0) + 1));
  let maks = 0;
  cnt.forEach(c => { if (c > maks) maks = c; });
  if (maks === 1) return 'Tidak ada modus (semua nilai unik)';
  return [...cnt].filter(([, c]) => c === maks).map(([v]) => f(v)).join('; ') + ` (muncul ${maks}×)`;
}

function deteksiOutlier(s, q1, q3) {
  const iqr = q3 - q1, bawah = q1 - 1.5 * iqr, atas = q3 + 1.5 * iqr;
  return { bawah, atas, daftar: s.filter(v => v < bawah || v > atas) };
}

function hitungStatistik(data, populasi) {
  const s = [...data].sort((a, b) => a - b);            // data terurut
  const n = s.length;                                   // jumlah data (n)
  const total = s.reduce((a, b) => a + b, 0);           // total nilai (Σx)
  const mean = total / n;                               // mean
  const median = kuartil(s, 0.5);                       // median
  const min = s[0], max = s[n - 1];                     // minimum dan maksimum
  const ss = s.reduce((a, v) => a + (v - mean) ** 2, 0);
  const varians = ss / (populasi ? n : n - 1);          // varians (sampel atau populasi)
  const q1 = kuartil(s, 0.25), q3 = kuartil(s, 0.75);   // Q1 dan Q3
  return {
    s, n, total, mean, median, modus: hitungModus(s), min, max,
    range: max - min, varians, sd: Math.sqrt(varians),
    q1, q3, iqr: q3 - q1, outlier: deteksiOutlier(s, q1, q3), populasi, ss
  };
}

function langkahStatistik(st) {
  const { s, n, total, mean, median, min, max, range, q1, q3, iqr, ss, varians, sd, outlier: o, populasi } = st;
  // langkah mencari kuartil/median dengan interpolasi linear pada data terurut
  const langkahKuartil = (p, nama, hasil) => {
    const idx = (n - 1) * p, l = Math.floor(idx), h = Math.ceil(idx), fr = idx - l;
    const posisi = `Posisi = 1 + (n − 1) × p = 1 + (${n} − 1) × ${f(p)} = ${f(1 + idx)}`;
    if (l === h) return [posisi, `Posisi jatuh tepat di data ke-${l + 1}, yaitu ${f(s[l])}`, `${nama} = ${f(hasil)}`];
    return [posisi,
      `Posisi berada di antara data ke-${l + 1} (${f(s[l])}) dan data ke-${h + 1} (${f(s[h])}), pecahannya ${f(fr)}`,
      `${nama} = ${f(s[l])} + ${f(fr)} × (${f(s[h])} − ${f(s[l])}) = ${f(hasil)}`];
  };
  // frekuensi tiap nilai untuk mencari modus
  const cnt = new Map();
  s.forEach(v => cnt.set(v, (cnt.get(v) || 0) + 1));
  const urut = [...cnt].sort((a, b) => b[1] - a[1] || a[0] - b[0]);
  const frek = urut.slice(0, 6).map(([v, c]) => `${f(v)} muncul ${c}×`).join('; ') + (urut.length > 6 ? '; …' : '');
  const pembagi = populasi ? n : n - 1;
  return [
    { nama: 'Jumlah data (n)', rumus: 'n = banyaknya data',
      langkah: [`Data dihitung satu per satu, hasilnya n = ${n}`] },
    { nama: 'Total nilai (Σx)', rumus: 'Σx = x₁ + x₂ + … + xₙ',
      langkah: [`Σx = ${ringkas(s)}`, `Σx = ${f(total)}`] },
    { nama: 'Mean (rata-rata)', rumus: 'x̄ = Σx / n',
      langkah: [`x̄ = ${f(total)} / ${n}`, `x̄ = ${f(mean)}`] },
    { nama: 'Median', rumus: 'Nilai tengah data terurut. Posisi = 1 + (n − 1) × 0,5; jika n genap, rata-rata dua nilai tengah',
      langkah: ['Data sudah diurutkan dari kecil ke besar (lihat bagian Data terurut)', ...langkahKuartil(0.5, 'Median', median)] },
    { nama: 'Modus', rumus: 'Nilai yang paling sering muncul',
      langkah: [`Frekuensi tiap nilai (urut terbanyak): ${frek}`, `Modus = ${st.modus}`] },
    { nama: 'Nilai minimum', rumus: 'Min = x₍₁₎ (data terurut pertama)',
      langkah: [`Setelah diurutkan, data pertama adalah ${f(min)}`] },
    { nama: 'Nilai maksimum', rumus: 'Maks = x₍ₙ₎ (data terurut terakhir)',
      langkah: [`Setelah diurutkan, data terakhir (ke-${n}) adalah ${f(max)}`] },
    { nama: 'Range (jangkauan)', rumus: 'Range = Maks − Min',
      langkah: [`Range = ${f(max)} − ${f(min)}`, `Range = ${f(range)}`] },
    { nama: 'Varians', rumus: populasi ? 'σ² = Σ(x − μ)² / n  (populasi)' : 's² = Σ(x − x̄)² / (n − 1)  (sampel)',
      langkah: [`Rata-rata x̄ = ${f(mean)}`, `Σ(x − x̄)² = ${ringkasKuadrat(s, mean)}`, `Σ(x − x̄)² = ${f(ss)}`,
        `Pembagi = ${populasi ? 'n' : 'n − 1'} = ${pembagi}`, `Varians = ${f(ss)} / ${pembagi} = ${f(varians)}`] },
    { nama: 'Standar deviasi', rumus: 's = √varians',
      langkah: [`s = √${f(varians)}`, `s = ${f(sd)}`] },
    { nama: 'Kuartil 1 (Q1)', rumus: 'Posisi Q1 = 1 + (n − 1) × 0,25 pada data terurut',
      langkah: langkahKuartil(0.25, 'Q1', q1) },
    { nama: 'Kuartil 3 (Q3)', rumus: 'Posisi Q3 = 1 + (n − 1) × 0,75 pada data terurut',
      langkah: langkahKuartil(0.75, 'Q3', q3) },
    { nama: 'Interquartile Range (IQR)', rumus: 'IQR = Q3 − Q1',
      langkah: [`IQR = ${f(q3)} − ${f(q1)}`, `IQR = ${f(iqr)}`] },
    { nama: 'Deteksi outlier', rumus: 'Batas bawah = Q1 − 1,5 × IQR; Batas atas = Q3 + 1,5 × IQR. Data di luar batas = outlier',
      langkah: [`Batas bawah = ${f(q1)} − 1,5 × ${f(iqr)} = ${f(o.bawah)}`, `Batas atas = ${f(q3)} + 1,5 × ${f(iqr)} = ${f(o.atas)}`,
        o.daftar.length ? `Data di luar batas (outlier): ${ringkas(o.daftar, '; ')}` : 'Tidak ada data di luar batas, jadi tidak ada outlier'] }
  ];
}

function histogram(s) {
  const n = s.length, mn = s[0], mx = s[n - 1];
  const k = mx === mn ? 1 : Math.max(1, Math.ceil(1 + Math.log2(n)));
  const w = (mx - mn) / k || 1, c = Array(k).fill(0);
  s.forEach(v => c[Math.min(k - 1, Math.floor((v - mn) / w))]++);
  const W = 560, H = 250, L = 36, R = 10, T = 18, B = 32, pw = W - L - R, ph = H - T - B, m = Math.max(...c), bw = pw / k;
  let g = '';
  c.forEach((v, i) => {
    const h = v / m * ph, x = L + i * bw;
    g += `<rect x="${x + 1}" y="${T + ph - h}" width="${bw - 2}" height="${h}" fill="var(--ac)"/>` +
         `<text x="${x + bw / 2}" y="${T + ph - h - 4}" text-anchor="middle">${v}</text>`;
  });
  for (let i = 0; i <= k; i++) g += `<text x="${L + i * bw}" y="${H - 12}" text-anchor="middle">${f(mn + i * w, 1)}</text>`;
  g += `<line x1="${L}" x2="${W - R}" y1="${T + ph}" y2="${T + ph}" stroke="currentColor"/>` +
       `<text x="${W / 2}" y="${H - 1}" text-anchor="middle">Nilai (angka di atas batang = frekuensi)</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Histogram distribusi data">${g}</svg>`;
}

function boxplot(st) {
  const { s, q1, median: md, q3, outlier } = st;
  const W = 560, H = 115, L = 30, R = 30, pw = W - L - R, mn = s[0], mx = s[s.length - 1];
  const sx = v => L + (v - mn) / ((mx - mn) || 1) * pw;
  const dalam = s.filter(v => v >= outlier.bawah && v <= outlier.atas);
  const wl = sx(dalam[0]), wh = sx(dalam[dalam.length - 1]);
  let g = `<line x1="${wl}" x2="${wh}" y1="45" y2="45" stroke="currentColor"/>` +
          `<line x1="${wl}" x2="${wl}" y1="35" y2="55" stroke="currentColor"/><line x1="${wh}" x2="${wh}" y1="35" y2="55" stroke="currentColor"/>` +
          `<rect x="${sx(q1)}" y="25" width="${Math.max(sx(q3) - sx(q1), 1)}" height="40" fill="var(--ac)" fill-opacity=".25" stroke="var(--ac)" stroke-width="2"/>` +
          `<line x1="${sx(md)}" x2="${sx(md)}" y1="25" y2="65" stroke="var(--ac)" stroke-width="3"/>`;
  outlier.daftar.forEach(v => g += `<circle cx="${sx(v)}" cy="45" r="4" fill="var(--warn)"/>`);
  g += `<text x="${sx(q1)}" y="82" text-anchor="middle">Q1 ${f(q1, 2)}</text><text x="${sx(md)}" y="94" text-anchor="middle">Median ${f(md, 2)}</text>` +
       `<text x="${sx(q3)}" y="82" text-anchor="middle">Q3 ${f(q3, 2)}</text>` +
       `<text x="${L}" y="108">Min ${f(mn, 2)}</text><text x="${W - R}" y="108" text-anchor="end">Maks ${f(mx, 2)}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Boxplot data; titik merah adalah outlier">${g}</svg>` +
         `<p class="note">Titik merah = outlier. Kumis berakhir di nilai terjauh yang masih dalam batas 1,5×IQR.</p>`;
}

function tabelHasil(st) {
  const o = st.outlier;
  const ket = (o.daftar.length ? `${o.daftar.length} outlier: ${o.daftar.map(v => f(v)).join('; ')}` : 'Tidak ada outlier') +
    `<br><span class="note">Batas bawah ${f(o.bawah)} · batas atas ${f(o.atas)} (Q1 - 1,5×IQR dan Q3 + 1,5×IQR)</span>`;
  const rows = [
    ['Jumlah data (n)', st.n], ['Total nilai (Σx)', f(st.total)], ['Mean (rata-rata)', f(st.mean)],
    ['Median', f(st.median)], ['Modus', st.modus], ['Nilai minimum', f(st.min)], ['Nilai maksimum', f(st.max)],
    ['Range (jangkauan)', f(st.range)], ['Varians (' + (st.populasi ? 'populasi' : 'sampel') + ')', f(st.varians)],
    ['Standar deviasi', f(st.sd)], ['Kuartil 1 (Q1)', f(st.q1)], ['Kuartil 3 (Q3)', f(st.q3)],
    ['Interquartile Range (IQR)', f(st.iqr)], ['Deteksi outlier', ket]
  ].map((r, i) => [i + 1, ...r]);
  return tbl(rows, ['No.', 'Ukuran statistik', 'Hasil']);
}

function tampilLangkah(st) {
  const isi = langkahStatistik(st).map((it, i) =>
    `<details class="lg" open><summary>${i + 1}. ${it.nama}</summary>` +
    `<p class="rumus"><b>Rumus:</b> ${it.rumus}</p><ol>${it.langkah.map(l => `<li>${l}</li>`).join('')}</ol></details>`).join('');
  return `<div class="card" id="kartuLangkah"><h2>Langkah pengerjaan</h2>` +
    `<p class="note">Angka pada langkah dibulatkan sampai 4 angka di belakang koma; perhitungan sebenarnya memakai nilai tanpa pembulatan.</p>` +
    `<p><b>Data terurut:</b> ${ringkas(st.s, '; ', 30)}</p>` +
    `<button class="b g" id="tglLangkah">Tutup semua</button>${isi}</div>`;
}

function proses() {
  const data = parseData($('#manual').value), out = $('#out1');
  $('#err1').textContent = '';
  if (data.length < 2) {
    out.innerHTML = '';
    $('#err1').textContent = 'Masukkan minimal 2 angka agar statistik dapat dihitung.';
    return;
  }
  const st = hitungStatistik(data, $('#vtype').value === 'pop');          
  out.innerHTML =
    `<div class="card"><h2>Hasil perhitungan</h2>${tabelHasil(st)}</div>` + 
    tampilLangkah(st) +                                                     
    `<div class="card"><h2>Histogram</h2>${histogram(st.s)}` +              
    `<h2 style="margin-top:16px">Boxplot</h2>${boxplot(st)}</div>`;        
  // tombol buka/tutup semua langkah
  $('#tglLangkah').onclick = e => {
    const buka = e.target.textContent === 'Buka semua';
    document.querySelectorAll('#kartuLangkah details').forEach(d => { d.open = buka; });
    e.target.textContent = buka ? 'Tutup semua' : 'Buka semua';
  };
}


$('#hit').onclick = proses;
$('#ex').onclick = () => { $('#manual').value = '70, 85, 90, 65, 85, 100, 40, 75, 85, 60, 95, 80, 88, 72, 15'; proses(); };
$('#rs').onclick = () => { $('#manual').value = ''; $('#csv').value = ''; $('#err1').textContent = ''; $('#out1').innerHTML = ''; };

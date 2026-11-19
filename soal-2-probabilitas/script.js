/* =====================================================
   SOAL 2 - APLIKASI PERHITUNGAN PROBABILITAS
   Pembagian tugas Kelompok 5:
   - anggota 3 : probabilitas dasar (P(A), komplemen, gabungan, irisan, saling lepas, independen) beserta langkah pengerjaannya
   - anggota 4 : probabilitas bersyarat, Teorema Bayes, interpretasi hasil, dan langkah pengerjaannya
   - anggota 5 : fungsi bantu, integrasi tombol, HTML/CSS, pengujian, dokumentasi
   ===================================================== */

// ===== anggota 5 : fungsi bantu (pemilih elemen, baca angka desimal koma, format, tabel) =====
const $ = s => document.querySelector(s);
const rd = v => parseFloat(String(v).trim().replace(',', '.'));
const f = (x, d = 4) => Number.isFinite(x) ? String(+x.toFixed(d)).replace('.', ',') : '-';
const pct = x => f(x * 100, 2) + '%';
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const tbl = (rows, head) =>
  `<table><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr>` +
  rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('') + `</table>`;
const gagal = (e, o, pesan) => { e.textContent = pesan; o.innerHTML = ''; };  // tampilkan pesan error
const valid01 = v => Number.isFinite(v) && v >= 0 && v <= 1;                  // cek 0 <= v <= 1

// ===== anggota 5 : kotak "Lihat pengerjaan" (rumus + langkah) dipakai semua bagian =====
const kotakLangkah = (rumus, langkah) =>
  `<details class="lg" open><summary>Lihat pengerjaan</summary>` +
  `<p class="rumus"><b>Rumus:</b><br>${rumus.join('<br>')}</p><ol>${langkah.map(l => `<li>${l}</li>`).join('')}</ol></details>` +
  `<p class="note">Angka pada langkah dibulatkan sampai 4 angka di belakang koma.</p>`;

// ===== anggota 3 : hitung P(A∩B) dan P(A∪B) sesuai hubungan kejadian =====
function probabilitasDasar(a, b, hubungan, pAB) {
  let irisan;
  if (hubungan === 'lepas') {                       // saling lepas: P(A∩B) = 0
    if (a + b > 1) return { error: 'Pada kejadian saling lepas, P(A) + P(B) tidak boleh lebih dari 1.' };
    irisan = 0;
  } else if (hubungan === 'ind') {                  // independen: P(A∩B) = P(A) × P(B)
    irisan = a * b;
  } else {                                          // umum: P(A∩B) diberikan
    irisan = pAB;
    if (!valid01(irisan) || irisan > Math.min(a, b) || a + b - irisan > 1)
      return { error: 'P(A∩B) harus ≤ nilai terkecil dari P(A) dan P(B), dan P(A∪B) tidak boleh lebih dari 1.' };
  }
  return {
    a, b, irisan, hubungan, gabungan: a + b - irisan,
    salingLepas: Math.abs(irisan) < 1e-12,                  // cek saling lepas
    independen: Math.abs(irisan - a * b) < 1e-9             // cek independen
  };
}

// ===== anggota 3 : rumus dan langkah pengerjaan probabilitas dasar =====
function langkahDasar(h) {
  const { a, b, irisan, gabungan, hubungan } = h;
  const lIrisan = hubungan === 'lepas' ? 'Kedua kejadian saling lepas (tidak mungkin terjadi bersamaan), maka P(A∩B) = 0'
    : hubungan === 'ind' ? `Kedua kejadian independen, maka P(A∩B) = P(A) × P(B) = ${f(a)} × ${f(b)} = ${f(irisan)}`
    : `P(A∩B) diberikan dalam soal = ${f(irisan)}`;
  return kotakLangkah(
    ['P(A′) = 1 − P(A)', 'P(A∪B) = P(A) + P(B) − P(A∩B)', 'Saling lepas: P(A∩B) = 0', 'Independen: P(A∩B) = P(A) × P(B)'],
    [`Diketahui P(A) = ${f(a)} dan P(B) = ${f(b)}`,
     `Komplemen: P(A′) = 1 − ${f(a)} = ${f(1 - a)}; P(B′) = 1 − ${f(b)} = ${f(1 - b)}`,
     lIrisan,
     `Gabungan: P(A∪B) = ${f(a)} + ${f(b)} − ${f(irisan)} = ${f(gabungan)}`,
     `Cek saling lepas: P(A∩B) = ${f(irisan)}, ${h.salingLepas ? 'sama dengan 0 → saling lepas' : 'tidak sama dengan 0 → tidak saling lepas'}`,
     `Cek independen: P(A) × P(B) = ${f(a * b)}; ${h.independen ? 'sama dengan P(A∩B) → independen' : `berbeda dari P(A∩B) = ${f(irisan)} → tidak independen`}`,
     `Kesimpulan: peluang A atau B terjadi ${pct(gabungan)}, peluang keduanya terjadi bersamaan ${pct(irisan)}`]);
}

// ===== anggota 3 : tampilan tabel hasil probabilitas dasar =====
function tampilDasar(h) {
  const yn = x => x ? 'Ya' : 'Tidak';
  return tbl([
    ['P(A)', f(h.a)], ['P(A′) = 1 − P(A)', f(1 - h.a)], ['P(B)', f(h.b)], ['P(B′) = 1 − P(B)', f(1 - h.b)],
    ['P(A∩B)', f(h.irisan)], ['P(A∪B)', f(h.gabungan)],
    ['Saling lepas? (P(A∩B) = 0)', yn(h.salingLepas)], ['Independen? (P(A∩B) = P(A)×P(B))', yn(h.independen)]
  ], ['Ukuran', 'Hasil']) + langkahDasar(h);
}

// ===== anggota 3 : P(A) = n(A) / n(S) beserta langkahnya =====
function peluangKejadian(nA, nS) {
  if (!(nS > 0) || !(nA >= 0) || nA > nS) return { error: 'Isi n(S) > 0 dan 0 ≤ n(A) ≤ n(S).' };
  const p = nA / nS;
  return { p, langkah: kotakLangkah(['P(A) = n(A) / n(S)', 'P(A′) = 1 − P(A)'],
    [`Diketahui n(A) = ${f(nA, 0)} dan n(S) = ${f(nS, 0)}`, `P(A) = ${f(nA, 0)} / ${f(nS, 0)} = ${f(p)}`,
     `P(A′) = 1 − ${f(p)} = ${f(1 - p)}`, `Kesimpulan: A diperkirakan muncul pada ${pct(p)} dari seluruh kemungkinan hasil`]) };
}

// ===== anggota 4 : probabilitas bersyarat P(A|B) = P(A∩B) / P(B) beserta langkahnya =====
function probBersyarat(irisan, b) {
  if (!(b > 0 && b <= 1) || !(irisan >= 0) || irisan > b) return { error: 'P(B) harus > 0 dan ≤ 1, serta 0 ≤ P(A∩B) ≤ P(B).' };
  const hasil = irisan / b;
  return { hasil, langkah: kotakLangkah(['P(A|B) = P(A∩B) / P(B), dengan syarat P(B) > 0'],
    [`Diketahui P(A∩B) = ${f(irisan)} dan P(B) = ${f(b)}`, `Syarat P(B) > 0 terpenuhi (${f(b)} > 0)`,
     `P(A|B) = ${f(irisan)} / ${f(b)} = ${f(hasil)}`,
     `Kesimpulan: jika B sudah terjadi, peluang A terjadi adalah ${pct(hasil)}`]) };
}

// ===== anggota 4 : Teorema Bayes (prevalensi, sensitivitas, false positive) =====
function teoremaBayes(prev, sens, fp) {
  const pPos = sens * prev + fp * (1 - prev);               // P(+) dari hukum probabilitas total
  if (pPos === 0) return { error: 'P(+) bernilai 0, sehingga Teorema Bayes tidak dapat dihitung.' };
  return {
    prev, sens, fp, pPos,
    posterior: sens * prev / pPos,                          // P(H|+)
    negatif: pPos < 1 ? (1 - sens) * prev / (1 - pPos) : NaN // P(H|tidak +)
  };
}

// ===== anggota 4 : rumus dan langkah pengerjaan Teorema Bayes =====
function langkahBayes(r, h, t) {
  const { prev, sens, fp, pPos, posterior } = r, benar = sens * prev, salah = fp * (1 - prev);
  const langkah = [
    `Diketahui: P(${h}) = ${pct(prev)} = ${f(prev)}; sensitivitas P(+|${h}) = ${f(sens)}; false positive P(+|${h}′) = ${f(fp)}`,
    `P(${h}′) = 1 − ${f(prev)} = ${f(1 - prev)}`,
    `Bagian yang benar ${h} dan ${t}: P(+|${h}) × P(${h}) = ${f(sens)} × ${f(prev)} = ${f(benar)}`,
    `Bagian bukan ${h} tetapi ikut ${t}: P(+|${h}′) × P(${h}′) = ${f(fp)} × ${f(1 - prev)} = ${f(salah)}`,
    `P(${t}) = ${f(benar)} + ${f(salah)} = ${f(pPos)} (${pct(pPos)})`,
    `P(${h}|${t}) = ${f(benar)} / ${f(pPos)} = ${f(posterior)} (${pct(posterior)})`,
    `P(${h}′|${t}) = 1 − ${f(posterior)} = ${f(1 - posterior)}`
  ];
  if (Number.isFinite(r.negatif))
    langkah.push(`P(${h}|tidak ${t}) = [(1 − ${f(sens)}) × ${f(prev)}] / (1 − ${f(pPos)}) = ${f((1 - sens) * prev)} / ${f(1 - pPos)} = ${f(r.negatif)}`);
  return kotakLangkah(
    [`P(${h}′) = 1 − P(${h})`, `P(${t}) = P(+|${h}) × P(${h}) + P(+|${h}′) × P(${h}′)  (hukum probabilitas total)`,
     `P(${h}|${t}) = [P(+|${h}) × P(${h})] / P(${t})  (Teorema Bayes)`], langkah);
}

// ===== anggota 4 : interpretasi hasil Bayes dalam kalimat dan frekuensi alami =====
function interpretasiBayes(r, h, t) {
  const k = x => f(x * 1000, 1);                            // per 1.000 data
  return `<div class="tip"><b>Interpretasi:</b> ${pct(r.pPos)} dari seluruh data akan ${t}. Dari yang ${t}, hanya ${pct(r.posterior)} yang benar-benar ${h}.
  Jika ada 1.000 data: ${k(r.prev)} ${h}, ${k(r.sens * r.prev)} di antaranya terdeteksi, dan ${k(r.fp * (1 - r.prev))} data bukan ${h} ikut ${t} (false positive).
  Jadi dari ${k(r.pPos)} data yang ${t}, ${k(r.sens * r.prev)} yang benar.
  ${r.posterior < r.sens ? `<br>Hasil ini lebih rendah dari sensitivitas (${pct(r.sens)}) karena ${h} jarang terjadi (prevalensi ${pct(r.prev)}), sehingga banyak data aman ikut ${t}.` : ''}</div>`;
}

// ===== anggota 5 : menampilkan kolom P(A∩B) hanya jika hubungan "Umum" dipilih =====
$('#rel').onchange = () => { $('#pabw').hidden = $('#rel').value !== 'umum'; };

// ===== anggota 5 : integrasi tombol bagian A (memanggil fungsi anggota 3) =====
$('#h2a').onclick = () => {
  const a = rd($('#pa').value), b = rd($('#pb').value), e = $('#err2'), o = $('#out2');
  e.textContent = '';
  if (!valid01(a) || !valid01(b)) return gagal(e, o, 'P(A) dan P(B) harus berupa angka antara 0 dan 1.');
  const h = probabilitasDasar(a, b, $('#rel').value, rd($('#pab').value));
  if (h.error) return gagal(e, o, h.error);
  o.innerHTML = tampilDasar(h);
};
$('#h2b').onclick = () => {
  const nA = rd($('#na').value), nS = rd($('#ns').value), e = $('#err2b'), o = $('#out2b');
  e.textContent = '';
  const h = peluangKejadian(nA, nS);
  if (h.error) return gagal(e, o, h.error);
  o.innerHTML = tbl([['P(A) = n(A) / n(S)', `${f(nA, 0)} / ${f(nS, 0)} = ${f(h.p)}`], ['P(A′) = 1 − P(A)', f(1 - h.p)]], ['Ukuran', 'Hasil']) + h.langkah;
};

// ===== anggota 5 : integrasi tombol bagian B (memanggil fungsi anggota 4) =====
$('#h3').onclick = () => {
  const ab = rd($('#cab').value), b = rd($('#cb').value), e = $('#err3'), o = $('#out3');
  e.textContent = '';
  const h = probBersyarat(ab, b);
  if (h.error) return gagal(e, o, h.error);
  o.innerHTML = tbl([['P(A|B) = P(A∩B) / P(B)', `${f(ab)} / ${f(b)} = ${f(h.hasil)}`]], ['Rumus', 'Hasil']) + h.langkah;
};
$('#h4').onclick = () => {
  const e = $('#err4'), o = $('#out4');
  e.textContent = '';
  const h = esc($('#hn').value.trim() || 'H'), t = esc($('#tn').value.trim() || '+');
  const prev = rd($('#prev').value) / 100, sens = rd($('#sens').value) / 100, fp = rd($('#fp').value) / 100;
  if (![prev, sens, fp].every(valid01)) return gagal(e, o, 'Semua persentase harus berupa angka antara 0 dan 100.');
  const r = teoremaBayes(prev, sens, fp);
  if (r.error) return gagal(e, o, r.error);
  o.innerHTML = tbl([
    [`P(${h})`, pct(prev)], [`P(${h}′) = 1 − P(${h})`, pct(1 - prev)],
    [`P(${t}) = P(+|H)·P(H) + P(+|H′)·P(H′)`, `${f(r.pPos)} → <b>${pct(r.pPos)}</b>`],
    [`P(${h}|${t}) = P(+|H)·P(H) / P(${t})`, `${f(r.posterior)} → <b>${pct(r.posterior)}</b>`],
    [`P(${h}′|${t}) (salah tandai)`, pct(1 - r.posterior)],
    [`P(${h}|tidak ${t})`, Number.isFinite(r.negatif) ? pct(r.negatif) : '-']
  ], ['Ukuran', 'Hasil']) + langkahBayes(r, h, t) + interpretasiBayes(r, h, t);   // langkah dan interpretasi: anggota 4
};

# PROGRESS REPORT v4.2 — CARDPATH BUILD
## Siklus pasca-audit AUDIT_BUILD_V4_FINAL (APPROVE ke PART 10) + 3 putaran feedback testing Shelby · 26 Okt 2026
### Untuk researcher — laporan pekerjaan selesai sejak audit final, lengkap case-by-case

---

# BAGIAN 1 — RINGKASAN

Setelah verdict APPROVE KE PART 10 (5 temuan minor T1-T5), agent mengeksekusi: (a) T1-T5 semua, (b) implementasi jawaban content Q1-Q3 researcher, (c) finalisasi 14 artikel ke standar kualitas Q3, (d) navigasi artikel di situs, (e) 2 perubahan journey besar dari feedback testing Shelby — **email gate sebelum match** dan **top-3 match carousel** — plus 2 bug journey yang ditemukan di audit menyeluruh.

Status akhir:
- **75 halaman** live, 1.549 link teruji dari konteks halaman → **0 gagal**
- Match spread: max **24%** (PASS ≤35%) · edge probes 6/6 · KV regression PASS
- app.js 706 lines · CSS 351 lines · 14 track events (termasuk baru: `match_slide`)
- Tunnel: https://christmas-schemes-laid-cork.trycloudflare.com

---

# BAGIAN 2 — EKSEKUSI T1-T5 (temuan minor audit)

- **T1 — template leak** ✓: template files keluar dari sitemap (73 URL saat itu), `noindex, nofollow` meta, dan server.py memblok `/template_*` → 404 terverifikasi (localhost + tunnel). Catatan production: Worker perlu rule sama (masuk DEPLOY_CHECKLIST).
- **T2 — spread harness permanen** ✓: `qa/spread_test.js` — 50 profil random, exit 1 kalau fail, komentar monitor varo >40% (saran audit: chime goalFit 40→42). Hasil terkini: max 24%, 0 violations.
- **T3 — domain placeholder** ✓: DEPLOY_CHECKLIST.md dibuat resmi — 3 titik update domain (PROD_HOSTS, sitemap, ads.txt), Worker routes, monitor, Fase C kalibrasi, KPI targets, checklist PART 10 Shelby.
- **T4 — tracker tanpa struktur** ✓: issuer-policy-tracker kini 4 tabel rapi (ITIN acceptance / deposit minimums / graduation / closed products) + **schema.org Dataset JSON-LD** + section methodology (source hierarchy + correction policy 5 hari).
- **T5 — duplikat NOCHECK_FLOOR** ✓: `creditstrong` 2× → 1×; regression PASS.

---

# BAGIAN 3 — EKSEKUSI JAWABAN CONTENT (Q1-Q3)

**Q1 (Kombinasi B prioritas)** — diimplementasikan:
- 4 artikel bersasar kini punya **CTA match-kontekstual**: box yang membaca `cq_match` dan menampilkan "See your match: {nama kartu} →" ke P1-nya (bukan generic quiz CTA) + event `ctx_cta_view`. Terpasang di: denied, deposit-strategies, new-to-us, rebuilding-after-bankruptcy.
- Long-tail newcomer cluster diperkuat (new-to-us di-expand, tracker jadi hub dengan link-spoke).

**Q2 (urutan topic value)**:
- #1 "Denied — next steps" → **3 varian** via `?reason=score|fees|history` — hero + intro berubah per alasan penolakan, event `denied_variant_view`.
- #2 "Graduation data per issuer" → **artikel baru** `graduation-data-per-issuer.html` — data dari CARDS engine (auto/request/none designs), framing "our engine covers 18 products" sesuai izin researcher, FAQ JSON-LD, 10+ internal links, link-in dari tracker + 4 P1 secured, masuk sitemap.

**Q3 (standar kualitas)** — finalisasi 14 artikel (log detail: CONTENT_FINALIZATION_LOG.md):
- Kelas A di-rewrite penuh: how-long (387→1.153 kata), utilization (506→1.037), read-offer (486→1.107), without-a-card (609→1.047), how-scores (877→1.028), bankruptcy (795→1.056), new-to-us (628→1.008), tracker (702→1.063).
- Semua artikel Kelas A kini 10-15 internal links (dari 4-5). Substansi ditambah = data yang hanya kita punya dari engine (active-BK products, assigned-line behavior, auto vs request graduation) — bukan padding.
- FAQ JSON-LD valid 14/14 · verified dates · compliance sweep bersih.

**Navigasi artikel (temuan sendiri)**: artikel ada tapi TIDAK terlink dari situs — diperbaiki 3 pintu: section "Guides" di homepage (grid 8 kartu), nav "Guides" di 65+ halaman, 2 kolom footer di semua halaman.

---

# BAGIAN 4 — PERUBAHAN JOURNEY BESAR (feedback testing Shelby)

## FB-A — Email gate sebelum card option (Shelby: "mereka wajib mengisi email untuk bisa lanjut… gimmick: hasil kecocokan dikirim ke email")
- Profil yang layak melihat kartu (qualified / strong-path / email-first) **tidak langsung melihat match**. Muncul screen: *"Your match is ready — Where should we send your full match report?"* + copy value + form email + tombol merah "Send My Match Report →".
- Setelah submit: konfirmasi "✓ Sent — on its way to {email}" → **match tampil langsung** dengan "Continue to your matched card →" — button "Unlock Full Match Report via Email" **dihapus dari alur** (FB-B).
- Education path (tidak melihat kartu) tetap tanpa gate — konsisten desain SUB1 non-monetisasi.
- Anti-abuse tetap: bot tanpa email → gate; session `cp_email_gate` mencegah gate ulang.

## FB-B — Top-3 match carousel (Shelby: "top 3 rekomendasi berdasarkan profiling… per 1 card dengan button kiri kanan… apakah bisa saat bergeser itu berpindah halaman? terhitung engagement & session")
- **Ya, dibuat pindah halaman sungguhan**: klik ‹ › = `location.href` ke result baru → pageview baru (GA4 engagement/session baru + slot GAM re-auction).
- Tampilan tetap 1 kartu; tambahan: tombol bulat ‹ ›, dots, label "Match N of 3 — compare your options"; rank 2-3 berlabel "Match N of 3 for your profile".
- **Odds per kartu akurat**: quiz submit menyimpan `cp_top3` (3 kartu + odds masing-masing) ke sessionStorage — sebelumnya odds rank-1 terbawa ke rank lain (bug D, ditemukan audit sendiri).
- Event baru `match_slide` {from, to, rank} — terukur di /console.
- Wrap-around 1→2→3→1 ✓ · profil dengan <3 kandidat (20/50 profil random, karena hard constraints) → carousel menyesuaikan jumlah dots; 1 kandidat → disembunyikan · deep-link tanpa session → fallback ranking deterministik.

## UI precision (Shelby: kotak verdict "berdempetan, kurang center")
- Kotak verdict kini **center konsisten** (sebelumnya campuran kiri/center): cardname, odds band, visual kartu, why, CTA, micro, disclaimer — semua center + margin auto + max-width.
- Carousel diberi garis pemisah + padding (tidak nempel micro di atasnya), dots letter-spacing rapi + dot aktif aksen, hover halus pada tombol, mobile 40px.
- Gate screen padding lebih lega. CSS fresh terverifikasi di tunnel.

---

# BAGIAN 5 — CASE-BY-CASE (gejala → akar → fix → pelajaran) sejak audit final

### Kasus F1 — Email diminta 2x & slide memunculkan gate lagi (laporan Shelby — BUG KRITIS)
- **Gejala**: (1) isi email untuk lanjut, (2) diminta email LAGI ("Send My Match Report"), (3) geser kartu ‹ › → diminta email lagi.
- **Akar**: slide = pindah halaman sungguhan → result re-evaluasi. Profil Shelby = *email-first* (FIT≥30, INTENT<35). Logika pasca-email hanya punya cabang untuk *qualified* dan *strong-path* — **tidak ada cabang email-first-yang-sudah-isi-email** → setiap navigasi dianggap belum isi email → gate ulang. Keluhan "2x" sebenarnya satu gate yang diulang di halaman berikut.
- **Fix**: cabang eksplisit email-first+emailGiven dan bot+emailGiven → langsung match + Continue, micro-copy "Your match report was sent to your email". Terverifikasi 4 skenario Shelby semua PASS (gate 1x, slide langsung ganti kartu, rank 2/3, prev, refresh tanpa re-gate).
- **Pelajaran**: hard gate + navigasi antar-halaman wajib punya state pasca-gate per SEMUA jalur profil, bukan hanya jalur utama.

### Kasus F2 — Rank offset carousel (audit sendiri)
- **Gejala**: tombol next membawa `pos=1` padahal harus 2.
- **Akar**: index 0-based vs rank 1-based tertukar di slideHref.
- **Fix**: prevIdx/nextIdx eksplisit + rank param = idx+1. Wrap 3→1 terverifikasi.

### Kasus F3 — Odds salah antar rank (audit sendiri)
- **Gejala**: odds kartu rank-1 terbawa ke slide berikutnya (semua kartu tampil odds sama).
- **Akar**: slideHref membawa `o` URL tanpa menghitung odds kartu tujuan.
- **Fix**: quiz submit menyimpan `cp_top3` (kartu+odds) → tiap slide menampilkan odds kartu itu sendiri (E4 floor tetap berlaku).

### Kasus F4 — TDZ crash di email gate (audit sendiri)
- **Gejala**: klik "Send My Match Report" → match TIDAK muncul, carousel hilang (0 tombol).
- **Akar**: handler click mereferensi `contraNote` yang const-nya didefinisikan SETELAH titik `return` gate branch → Temporal Dead Zone ReferenceError.
- **Fix**: definisi `contraNote` dipindah sebelum gate branch. Ditambah guard `scrollIntoView` (tidak ada di jsdom).
- **Pelajaran**: `return` awal di fungsi render memotong rantai definisi — semua konstanta yang dipakai handler pasca-return harus didefinisikan sebelum return.

### Kasus F5 — Artikel tidak terlihat di website (laporan Shelby)
- **Gejala**: "dimana artikelnya, saya tidak melihatnya di website".
- **Akar**: 15 artikel live & terindeks sitemap tapi TIDAK ADA satu pun link internal menuju mereka.
- **Fix**: 3 pintu masuk (homepage Guides grid, nav 65+ halaman, footer 2 kolom). 1.549 links re-test PASS.
- **Pelajaran**: halaman tanpa link internal = invisible bagi user DAN lemah untuk crawler — publish ≠ available.

### Kasus F6 — Email-first gateway index (terkait F1, ditemukan saat akar penyelidikan)
- **Gejala**: `eg` param kosong (`eg=`) pada slide href dari gate screen — falsy.
- **Akar**: slideHref membawa `p.get('eg')||''` — gate pertama tidak punya `eg=1` di URL.
- **Fix**: dua lapis — session `cp_email_gate` (utama) + cabang email-first baru (F1). Kini slide href tetap membawa `eg` jika ada, tapi keandalan bergantung session, bukan param.

### Kasus historis siklus ini (sudah dilaporkan di PROGRESS_REPORT_V4, tetap relevan)
C1 outbound mati di halaman legacy · C2 sitemap stale · C3 path tools 2-level · C4-C8 UI spacing/center/sticky (semua closed, regression PASS di setiap audit ulang).

---

# BAGIAN 6 — STATE TEKNIS SAAT INI

- **Journey**: quiz 9 pertanyaan (Q9 cq_id) → result. Yang layak → email gate → match + Continue. Carousel top-3 antar-halaman. Continue → P1 edukasi (personalisasi cq_*) → P2 how-to-apply → go.html redirect (38 GO_TARGETS).
- **Events** (14): quiz_start, quiz_answer, quiz_complete, results_view, ef_open, email_optin, ef_sent, jump_click, match_slide (BARU), intent_bump, resume_engagement, calculator_use, cta_click, outbound_click, fraud_flag, ctx_cta_view, denied_variant_view, article_personalized, secondary_view, p1_view, p2_view (beberapa di inline scripts). Console /console menampilkan breakdown cq_id, cq_regen, match spread live.
- **KPI catatan penting untuk kalibrasi Fase C**: dengan email gate sebagai hard gate, metric "email capture" naik drastis dan definisi "completion" bergeser — distribusi FIT/INTENT yang dikumpulkan hari pertama traffic harus membaca gate sebagai bagian dari funnel, bukan drop-off.
- **Verifikasi terakhir**: 75 halaman 200 (localhost+tunnel) · 1.549 links 0 fail · spread max 24% PASS · 6/6 edge probes · KV 9-keys PASS + reject aneh · compliance bersih · JSON-LD 14/14 valid.

# BAGIAN 7 — YANG TERSISA (tidak dikerjakan, sesuai scope)

1. PART 10 milik Shelby (GAM tree + 9 KV keys, ads.txt/CMP, affiliate apps, domain, traffic test $300-500, Resend) — checklist lengkap di DEPLOY_CHECKLIST.md.
2. Fase C kalibrasi threshold 30/35 — mulai hari pertama traffic (catatan pembacaan KPI post-gate di Bagian 6).
3. Monitor varo >40% live → chime goalFit 40→42 (audit T2) — harness sudah siap.
4. Ekspansi artikel Kelas A di bawah 1.200 kata (secured-vs 966, best-zero-fee 916, graduation 907, fast-credit-limit 1.099) — bisa paralel dengan PART 10.
5. Model image agent saat ini tidak mendukung visual — verifikasi UI screenshot menunggu; semua fix UI diverifikasi via struktur DOM + CSS.

**Siap direview.** Tidak ada blocker untuk PART 10.


---

# ADDENDUM — EKSEKUSI FEEDBACK UX_SIM_V42_CONFORMANCE (F1-F2) · 26 Okt 2026

## F1 — Utility top-match exclusion ✓
- **Akar** (sesuai temuan researcher): goalFit utility (experian 24 rebuild, creditkarma 18-20 rewards) menang di pool terbatas (bk-active/no-bank) → utility jadi top-match 46/500 (9.2%), 6 sampai JUMP.
- **Implementasi**: di quizMatch — pool kompetisi top-match = non-utility saja; utility dikeluarkan dari kompetisi dan ditempel di belakang ranking (tetap muncul sebagai alts sekunder / jalur edukasi). Bukan sekadar swap lalu re-sort (percobaan pertama gagal karena tie-breaker sort menimpa) — pool dipisah sebelum sort.
- **Verifikasi**: repro U1 (bk-active+rewards+dep99): top creditkarma → **varo**. U17 (itin+bk-active+graduate): alts creditkarma+experian → **opensky, openskynb**. 500-run: utility top-match **0 (0%)**. 20-user sim: 0.

## F2 — Spread pre-kalibrasi ✓ (sebelum traffic, bukan menunggu)
- chime build 40→42, varo rebuild 34→30 (persis saran F2 researcher).
- Hasil 500-run: varo 35% → **31%** (PASS <35%), zolve 19%, chime 17%, amexnova 13%, opensky 11%. Utility 0.
- Edge probes 6/6 masih PASS · harness PASS · email gate + carousel E2E PASS · KV PASS · 1.549 links PASS · tunnel fresh.

## Status
Semua item pra-traffic dari UX_SIM_V42_CONFORMANCE selesai. **SIAP PART 10.**
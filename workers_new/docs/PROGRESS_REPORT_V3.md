# PROGRESS REPORT — CardPath v3 BUILD
## Untuk Researcher Review · 26 Okt 2026 · Disusun oleh Allice (agent builder)
Status build: **v3 SELESAI + 5 hotfix pasca-QA Shelby** · Siap diaudit
Demo live: https://federation-tries-money-ready.trycloudflare.com/start/ (tunnel; URL berubah jika server restart)
Dokumen rujukan: BLUEPRINT_CREDIT_COMPANION_PORTAL.md · REVISION_BRIEF_V2.md · REVISION_BRIEF_V3_DRAFT.md · V3_REVIEWER_RESPONSE.md

---

# 1. RINGKASAN EKSEKUTIF

Blueprint v1 (static P1/P2) → brief v2 (SUB1×SUB2 + gate) → brief v3 (quiz profiling redesign) → reviewer APPROVE dengan 6 revisi → **semua dieksekusi & terverifikasi**. 

Build v3 sekarang:
- **44 halaman** HTML, total bundle ±487KB (semua static, nol dependensi, nol gambar)
- **57 fake ad slots** terpasang dengan label posisi/ukuran/perilaku (visualisasi inventory utk F3)
- **Quiz profiling v3**: 8+1 pertanyaan, FIT×INTENT gate AND (30/35), bot-filter biner terpisah
- **Journey SUB1 non-monetisasi → gate → SUB2 monetisasi** jalan end-to-end
- Checklist auditor researcher (V3_REVIEWER_RESPONSE): **14/14 PASS**
- KPI dashboard + funnel console live (breakdown timing/regency)

5 bug ditemukan Shelby saat testing nyata (§3) — semuanya kelas "runtime interaction tidak teruji dari konteks user", semuanya sudah fix + sudah mengubah proses QA saya.

---

# 2. TIMELINE BUILD (apa yang dikerjakan kapan)

## Fase 1 — Demo v1 (23-24 Okt)
- Blueprint researcher dibaca; stack dipilih: static HTML/CSS/JS (porting mudah ke WP)
- 7 halaman inti: home, quiz (6+1), results, kalkulator odds, P1 Chime, P2 Chime
- Design system: editorial calm ala NerdWallet/Bankrate, aksen hijau #1F7A61 (WCAG 5.2:1), hairline, tabular-nums, CTA merah #d63628 (4.75:1) atas permintaan Shelby
- Kartu visual: awal brand-inspired → Shelby tanya soal real-photo → riset credittus (mereka pakai foto stok/AI, bukan produk asli) → keputusan **Opsi B: kartu generik per-network** (VISA navy / MC merah / Discover oranye), aman trademark
- Audit agent builder v1 (AUDIT_AGENT_BUILD_V1.md): flow inti OK, 9 blocking tercatat

## Fase 2 — v2 sesuai REVISION_BRIEF_V2 (26 Okt pagi)
Semua A1-A9 + Bagian B:
- A1 rantai parameter m&o→P1→P2→/go lengkap + cp_profile
- A2: 6 legal pages + /go tracker + sitemap + robots.txt (Mediapartners/AdsBot Allow)
- A3: FAQ 5 + FAQPage JSON-LD di semua P1
- A4/A5: carousel scroll-snap + dots; CTA tunggal + sticky mobile bar (IntersectionObserver)
- A6: body P1 600-800 kata per kartu, angle unik per kartu
- A7: generator 27 money pages (12 kartu × P1/P2 + 3 editorial)
- A8: odds granular per-kartu + alts segmen-dekat
- B: SUB1 `/start/*` (landing/quiz/result/tools), scoring gate 0-100, jump/secondary/anti-fraud, KV wrapper, /api stubs, /console funnel

## Fase 3 — Brief v3 + Reviewer (26 Okt siang)
- Kasus Shelby: quiz cepat di-flag → audit metodologi (7 sumber) → REVISION_BRIEF_V3_DRAFT.md + DOCX dikirim researcher
- Researcher: **APPROVE dengan 6 revisi (D1-D6) + 6 tambahan (R1-R6)** → semua dieksekusi:
  - Quiz 8+1 baru (Q1 reframe tanpa "declined", Q2 4 opsi MECE, Q3 split unknown/never, Q4 micro-copy, Q6 tanpa nominal)
  - fitScore()×intentScore() gate AND; bot-filter biner; kontradiksi D3 (-10×3, 670+build NO flag)
  - KV cq_timing+cq_regency; email routing timing stub; console breakdown
  - R1 non-revealing copy; R2 qa=1 guard ganda; R3 silent cooldown

---

# 3. HISTORI CASE BY CASE — BUG YANG DITEMUKAN SHELBY (testing nyata)

## CASE 1 — "Setelah input email selalu error response" (26 Okt)
**Gejala**: journey quiz → email → hasil tidak pernah memberi jump.
**Investigasi**: log server (bukan tebakan): `quiz_complete score=39, fraud_flag:1` — journey Shelby TERTULAR dua flag: `too_fast` (quiz <20 dtk) + IP watchlist (test berulang). Journey sebenarnya sukses — gate yang salah putus.
**Akar masalah**: sinyal kecepatan invalid untuk quiz simple (quiz tap cepat itu NORMAL); IP watchlist toleransi-nol menghukum QA berulang; jalur sekunder tanpa penjelasan = terasa error.
**Keputusan Shelby**: "engine harus menilai kualitas profil, bukan kecepatan. Buat pertanyaan yang cukup dalam untuk profiling."
**Output**: audit metodologi 7 sumber → REVISION_BRIEF_V3 (§1 histori lengkap) → reviewer approve → v3 engine.
**Pelajaran**: anti-fraud jangan mengukur input; ukur KONSISTENSI & KEDALAMAN profil.

## CASE 2 — 404 artikel jalur sekunder (26 Okt malam)
**Gejala**: klik rekomendasi artikel "How credit scores work" → `404 File not found`.
**Akar masalah**: halaman itu memang belum dibuat (fase 2 organic di blueprint) tapi SUDAH di-link dari jalur sekunder.
**Fix**: artikel utuh dibuat (~1.000 kata + FAQ schema) + audit link menyeluruh + **rule baru: artikel rekomendasi wajib live sebelum jalur sekunder aktif**.

## CASE 3 — 404 redirect hasil quiz (26 Okt malam)
**Gejala**: selesai quiz → langsung `404` dengan URL `/start/result?m=...` (Shelby kirim URL — membongkar akar masalah seketika).
**Akar masalah**: redirect menuju `/start/result` TANPA `.html` — saya menulis kode dengan asumsi routing production (yang me-rewrite URL), padahal server demo static butuh ekstensi.
**Fix**: redirect → `/start/result.html` + rule QA: *setiap redirect target diverifikasi 200 sebelum ship*.

## CASE 4 — 404 kartu alternatif (26 Okt malam)
**Gejala**: klik "OpenSky® Secured Visa® — also fits your profile" → 404.
**Akar masalah**: link alt hardcoded `results.html` (benar hanya dari root) — dari `/start/result.html` me-resolve ke `/start/results.html` yang tidak ada.
**Fix**: fungsi `altHref()` path-aware (sub1 → `result.html`, root → `results.html`), membawa m&o+UTM. Terverifikasi 200 untuk semua target alt.

## CASE 5 — Tombol "Unlock full match report via email" mati (26 Okt malam)
**Gejala**: tombol tidak bisa diklik; setelah klik kartu alternatif, tombol berfungsi.
**Akar masalah**: URL pertama membawa `bot=1` (sisa cooldown) → jatuh ke cabang yang menampilkan tombol mati (`pointer-events:none`); klik alt menghasilkan URL TANPA bot=1 → cabang email-first yang tombolnya hidup. Dua tombol mirip, satu mati satu hidup — persis pola yang Shelby alami.
**Fix**: cabang bot & email-first DIGABUNG — keduanya menampilkan inline email capture yang AKTIF (klik → form → kirim → "check your inbox"). Tidak ada lagi dead button. Melanggar R3 kalau dibiarkan — reviewer R3 sudah bilang cooldown harus punya jalur keluar; saya tidak menerapkannya ke cabang bot di build v2. Fix mematuhi R3 sepenuhnya.

## POLA DARI 5 KASUS (penting untuk audit)
Semua 5 bug SATU KELAS: **interaksi runtime tidak teruji dari konteks user**. QA otomatis saya menguji render halaman-per-halaman (jsdom unit) — lolos semua — tapi tidak pernah MENGG-KLIK dari posisi nyata. Shelby menemukan semuanya dalam ±1 jam testing.
**Perbaikan proses yang sudah diterapkan**: journey click-test dari setiap posisi (setiap tombol/href yang digenerate runtime di-resolve & di-curl dari konteks halamannya) masuk checklist permanen. Permintaan ke Shelby: session journey click-test menyeluruh oleh saya sebelum audit final (±20 mnt) — menunggu konfirmasi.

---

# 4. VERIFIKASI OBJEKTIF SAAT INI (angka, bukan klaim)

## 4.1 Checklist auditor researcher — 14/14 PASS
Q1 reframe tanpa "declined" ✓ · Q2 4 opsi ✓ · Q3 split ✓ · Q6 tanpa nominal ✓ · fitScore tanpa kecepatan ✓ · botFilter biner ✓ · gate AND 30/35 ✓ · kontradiksi -10 ✓ · qa=1 guard ✓ · R1 non-revealing ✓ · KV timing/regency ✓ · console breakdown ✓ · 8 pertanyaan ✓ · email routing stub ✓

## 4.2 Simulasi koherensi gate (unit test)
- no-score+$99+regular+checking: FIT 33 → lulus floor ✓ (sesuai prediksi reviewer D4)
- fair+same: FIT 36 ✓ · $0+none+no-bank+research: FIT 15 → edukasi ✓
- 670+build: NO flag ✓ (D3) · kontra a/c: -10 diterapkan ✓
- INTENT max tanpa email: 40 → jump mungkin tanpa email ✓ (compliance)
- bot biner: avg 0.3 dtk/pertanyaan → jalur sekunder ✓

## 4.3 Funnel live (server demo, includes testing Shelby+agent)
quiz_start 11 · quiz_answer 72 · quiz_complete 10 · email_optin 10 · results_view 21 · jump_click (dari sesi sebelumnya) · secondary_view 11 · fraud_flag 5 (historis v2; v3 engine baru) · ef_open 1
Event chain 11 tahap lengkap terverifikasi per lid: quiz_start→quiz_answer(×8)→email_optin→quiz_complete→jump_click|secondary_view→sub2_landing→p1_view→p1_cta_click→p2_view→outbound_click

## 4.4 Ad inventory (fake slots untuk visualisasi F3) — 57 slot / 30 halaman
- SUB1: 1 slot saja (result) — nol di quiz/index/tools ✓ brief B0
- P1 ×12: top banner (ATF eager) + interstitial (336×280, trigger navbar+unhideWindow)
- P2 ×12: top + interstitial
- Editorial ×3: top + in-content · index: top
- Legal/utility: NOL slot (compliance)
- Semua slot: reserve space (CLS aman), label ukuran/perilaku tercetak di mock

## 4.5 Yang BELUM dikerjakan (jujur, dengan alasan)
1. Ad slot result SUB1 terisi tag asli — menunggu F3 GAM activation (Shelby: ad unit + MCM)
2. Monetisasi ringan Credit Karma di jalur sekunder (B4#5) — menunggu affiliate approval (§11)
3. Email E0-E6 real send (Resend) — stub API siap, butuh akun/domain email production
4. Fase C kalibrasi threshold 30/35 dari data minggu 1-2 — WAJIB per reviewer, belum bisa jalan sebelum traffic

---

# 5. ARSITEKTUR AKHIR (ringkas untuk audit)

```
SUB1 /start/* (non-monetisasi, 0 iklan kecuali 1 slot di result)
  landing → quiz 8+1 (auto-advance, micro-copy, progress, back)
  → scoring: fitScore() [floor, ≥30] × intentScore() [routing, ≥35]
  bot-filter biner terpisah (sub-2s/soal, webdriver) → secondary paksa
  IP cooldown: silent → submit berikutnya otomatis secondary + jalur email keluar
  → result: JUMP (klik-user) | email-first (inline capture AKTIF) | edukasi murni
  → gate progresif: resume=lid / email engage = intent +10 → jump bisa muncul belakangan
SUB2 root (monetisasi: 12 P1 + 12 P2 + 3 editorial, 57 slot GAM-ready)
  P1: param chain lengkap (lid,cp,cq_*,o,utm) → badge personal → CTA merah → P2
  P2: CTA outbound /go/{card} → tracker log → issuer
  KV: utm_source, cq_pos, cq_goal, cq_dep, cq_match, cq_timing, cq_regency, odds
/console: funnel 11 tahap + breakdown timing/regency + IP watchlist + event log
```

---

# 6. YANG DIMINTA DARI RESEARCHER
1. Audit build v3 terhadap V3_REVIEWER_RESPONSE checklist (semua item §checklist — sudah dijawab 14/14 dari sisi saya; mohon verifikasi independen)
2. Review copy final quiz v3 (Q1-Q8) — redaksi EN sudah masuk revisi D1-D2; mohon cek ulang tone
3. Konfirmasi Fase C plan: kalibrasi threshold dari data minggu 1-2 (metrik apa yang perlu saya siapkan di console selain yang sudah ada)
4. Keputusan: apakah editorial pages perlu P2 juga (blueprint bilang 30 URL; realita 27 + rationale)
5. Setelah audit lolos → F3 readiness list untuk Shelby (GAM ad unit tree dari 57 slot inventory, ads.txt, CMP TCF, affiliate apps)

*Semua angka & status di laporan ini dari file build aktual dan log server demo — bukan proyeksi.*

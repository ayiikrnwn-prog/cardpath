# METRICS-HQ & CARDPATH — LAPORAN LENGKAP BUILDER (GABUNGAN)
## Dari: Agent Website Builder · Kepada: Shelby + Director (Allice) · 28 Okt 2026
### Isi: State terbaru · Histori build · Case-by-case (gejala→akar→fix→pelajaran) · Pertanyaan lanjutan

---

# BAGIAN 1 — STATE TERBARU (semua terverifikasi via audit, bukan klaim)

## 1.1 Produksi (funnel uang)
- **SUB1 card.seputar-ntt.com** — quiz 9 pertanyaan + email gate (email 1x).
  **track.js kini TERPASANG di quiz page** (fix Keil#1 hari ini) — session_start
  dari quiz, data funnel terpenting, kini tercatat.
- **SUB2 cardpath.seputar-ntt.com** — money pages P1/P2 + /go server-side 302
  + D1 logging. LIVE.
- **gam.js** — prepared & inert; hanya aktif di cardpath.* bila window.CP_GAM
  di-set (menunggu Fase B GAM Shelby). ads.txt terpasang (2 pub-ID).
- **Worker produksi bersih** — kode dashboard dipindah metrics-hq; orphan cron
  dihapus; handleTrack self-contained + validasi.

## 1.2 Dashboard metrics-hq (worker TERPISAH, D1 shared, auto-connect)
- URL: https://metrics-hq.ayiikrnwn.workers.dev — password: cardpath-dash-2026
  (DEFAULT — perlu diganti, lihat Q1c)
- 7 panel + settings: Overview (verdict row + leaderboard + drill-down),
  Cohorts (matriks + histogram FIT/INTENT), Funnel (drop-off + durasi quiz),
  Ads (fill/viewability + latency p50/p95 + line items), Value (KV matrix +
  premium-winner + eCPM), Quality (bot + fraud signals), Content (engaged +
  scroll per page), Settings (threshold alert editable)
- Semua angka agregat berlabel REAL/DERIVED (prinsip skeptis-data)
- NET per campaign = AdSense earning × impression share (bukan asumsi flat)
- Auth: JWT + rate-limit login via D1 (5/min/IP, verified 429)
- Export CSV per panel; sparkline trend; drill-down campaign→ad-group
- Perf: 40-210ms per panel dengan 8.000+ impresi (target <2s); mobile no-overflow
- Backup D1 mingguan (Senin 08:00 UTC) → /root/backups/d1/, retensi 8 minggu,
  test export sukses (4,5 MB)
- Alert engine per jam: bot rate, no-fill >40%/2 jam, spend >budget cap, data gap.
  Guardrails ingestion: tolak overwrite >$0 dgn $0/partial; 3x error → auto-pause
  + alert. Telegram: stub siap (menunggu credentials — nanti, per Shelby)

## 1.3 Data D1 saat ini (pasca cleanup seed — jujur)
- spend_events: 0 · adsense_daily: 0 → dashboard menampilkan "— / awaiting
  spend data" (aman dari salah keputusan berbasis data palsu)
- Masih tersisa: ~2.015 funnel_events TEST pra-launch (results_view 1.124,
  quiz_answer 315, quiz_complete 117 — hasil testing Shelby/agent), 26 rows
  korup (lid=null), 40 leads test, 32 results test, 21 impressions test
- → Keputusan cleanup total menunggu jawaban Q2a (rekomendasi: bersihkan semua)

## 1.4 GitHub
- Monorepo `cardpath` (commit ecdad37): workers/cardpath + workers/cardpath-farm
  + docs (semua laporan)
- `metrics-hq` repo: MENUNGGU token GitHub baru dengan permission repo-creation
  (token lama fine-grained scoped hanya repo cardpath)

## 1.5 Arsitektur final
```
Paid traffic (Google/Meta)
  → SUB1 card.seputar-ntt.com/quiz  (non-monetisasi, track.js aktif)
  → email gate (1x) → JUMP klik-user
  → SUB2 cardpath.seputar-ntt.com (money pages, GAM siap)
  → /go/{card} → issuer (D1 log)
D1 cardpath-db (shared) ← dibaca metrics-hq worker (dashboard + cron + alerts)
```

---

# BAGIAN 2 — HISTORI BUILD (urut waktu, ringkas)

1. **Fase A 2-SUB** (24-27 Okt): quiz server-first + HMAC token + D1 + email gate
   1x + carousel top-3 server-driven + 8 siklus bugfix (F1-F8) → APPROVE auditor.
2. **GAM API setup** (28 Okt, Shelby/director): network 23382571087, 3 ad units,
   9 KV keys + 54 values. gam.js v2 live-but-inert, /api/adlog → D1. NO-FILL
   normal — keputusan Shelby: tunggu ADX, tolak iklan murah.
3. **Master Brief Dashboard** (28 Okt): brief director "Master Control v2" —
   7 panel, TANPA GA4, TANPA GAM API, REAL/DERIVED wajib, ±4 hari.
4. **Eksekusi dashboard** (28 Okt): PART 0 schema + API, PART 1 track.js +
   GPT latency, PART 2 UI 7 panel, PART 3 Meta ingestion, PART 4 alert engine.
   QA headless Chrome klik-UI semua panel.
5. **Arah Shelby**: dashboard dipisah dari produksi → worker baru (Opsi 1);
   nama generik non-CardPath → **metrics-hq**; desain v1 dinilai kurang →
   rebuild penuh dengan framework Stripe/Mercury (verdict row, tabular-nums,
   satu aksen #1f5eff, hairline).
6. **Upgrade 9 poin** (permintaan "kerjakan semuanya"): panel Cohorts, trend +
   drill-down, latency p50/p95, fraud signals, eCPM, CSV export, settings UI,
   engaged/scroll per page, seed 100k utk perf test.
7. **Akurasi & keandalan** ("kerjakan semuanya kecuali telegram"): derivation
   revenue share-based, engaged time capped, guardrails ingestion, backup mingguan.
8. **Audit menyeluruh** (21 security test + journey + perf): 3 bug ditemukan &
   fixed (A1-A3, lihat Bagian 3).
9. **Feedback director pasca-audit** (APPROVE + 5 pujian): N1 cleanup seed
   SEKARANG, N3b validasi track, N3a API contract, Keil#1 track.js SUB1 —
   SEMUA dieksekusi + laporan balik dengan bukti (commit d3a81a1).
10. **Report gabungan ini** (ecdad37).

---

# BAGIAN 3 — CASE-BY-CASE LENGKAP (gejala → akar → fix → pelajaran)

## Fase A (quiz funnel) — ringkas, detail di PHASE_A_REPORT docs
- **F1-F3 email ganda & tombol mati**: email step legacy v3 dobel → dihapus
  total, email 1x di gate. Pelajaran: cabang state harus eksplisit.
- **F4 CRITICAL Q9 beku**: quizSubmitServer dipanggil tapi tak terdefinisi
  (patch helper hilang) → ReferenceError → halaman beku. Pelajaran: fungsi yang
  dipanggil wajib diverifikasi definisinya ada — pola yang KEMBALI terjadi di A1.

## Dashboard (metrics-hq)
- **A1 CRITICAL — tracking produksi mati diam-diam**:
  Gejala: POST /api/track return {ok:true} tapi 0 row D1 baru.
  Akar: saat pembersihan dashboard dari worker produksi, handleTrack masih
  memanggil trackSession/insertFunnel yang ikut terhapus → exception tertelan
  try/catch → response ok tanpa insert. Tracking mati ±2 jam.
  Fix: handleTrack ditulis ulang self-contained + error tidak di-silent.
  Verified E2E: session/quiz/jump/outbound tercatat, muncul di dashboard.
  Pelajaran: (a) pola F4 berulang — pembersihan kode harus grep pemanggil
  fungsi, bukan hanya definisi; (b) response {ok:true} tanpa verifikasi D1 =
  klaim palsu. Tidak ada data produksi hilang (traffic belum jalan).
- **A2 rate-limit login tidak konsisten**: counter in-memory reset per isolate
  CF → fix throttle via D1 (login_throttle, window 60s). Verified: 401x5 → 429,
  reset benar. Pelajaran: state keamanan di Workers HARUS di D1/DO, bukan memory.
- **A3 panel Content 500**: query refer kolom `page` di session_summary (tidak
  ada) → fix query via funnel_events + join session. Pelajaran: kolom dikonfirmasi
  via PRAGMA, bukan ingatan.
- **A4 orphan cron produksi**: scheduled memanggil fungsi yang tak ada → error
  diam tiap jam sejak pembersihan → dihapus; cron eksklusif metrics-hq.
- **const kv reassign**: build gagal → deploy lama terserve diam-diam → UI v3
  tidak muncul meski "deployed". Pelajaran: deploy wajib verifikasi served output,
  bukan exit code.
- **D1 seed `no column meta_json`**: seed gagal chunk akhir → menyingkap bug
  nyata: adlog tidak menyimpan latency. Fix: ALTER + adlog persist meta_json.
- **Cron limit 5/account (Free)**: deploy warning. Fix: 1 cron + internal 6h
  gating. Keputusan: TIDAK upgrade/matiin cron lain tanpa approval director.
- **N1 seed berbahaya** (temuan director): dashboard menampilkan spend fiktif
  $6.8xx → risiko salah keputusan budget. Fix: cleanup SEKARANG (12.898 rows),
  dashboard jujur kosong. Pelajaran: data demo di sistem produksi = liabilitas.
- **N3b sampah masuk D1 diam-diam**: handler insert apa saja (lid null, event
  unknown — director sendiri sempat korup saat audit dgn format flat) → validasi
  VALID_EVENTS + lid wajib, response {saved, rejected}. Bukti live: 4-event
  korup → saved=1 rejected=3. FARM juga orphan → ditulis ulang. Pelajaran:
  input eksternal selalu di-validate di boundary; jangan percaya payload.
- **Keil#1 track.js tidak di quiz SUB1** (temuan director, BENAR): inject
  exclude /sub1/* (sisa arsitektur lama) sementara quiz dilayani via /sub1/
  inline → halaman terpenting tanpa tracking. Fix + verified served. Pelajaran:
  verifikasi injection di URL PRODUKSI yang diakses user, bukan di file statis.

---

# BAGIAN 4 — PERTANYAAN LANJUTAN (yang perlu dijawab)

## Q1 — Shelby (blocking traffic test)
1. **gclid capture + GTag quiz_start**: dieksekusi sekarang, atau tunggu
   arahan director? (menyentuh quiz produksi; director jadwalkan pra-traffic-test)
2. **Token GitHub baru** (Administration: RW) untuk push repo metrics-hq.
3. **Password dashboard** masih default — ganti sendiri (command saya siapkan)
   atau saya generate & set yang kuat?
4. **AdSense daily**: isi CSV manual dulu, atau tunggu SA add-user?

## Q2 — Director (keputusan data)
1. ~2.000 rows test pra-launch + 26 korup + 40 leads test: **bersihkan total**
   (rekomendasi builder: ya — kalibrasi Fase C & dashboard mulai dari nol
   bersih) atau biarkan?
2. Konfirmasi jadwal gclid/GTag (jawaban Shelby Q1.1 menimpa).

## Q3 — Perf agent (pra & saat launch)
1. **Enum utm_source final** untuk campaign live: gcl1/gcl2/metaa/metab?
   (KV enum & filter dashboard sudah enum ini — JANGAN pakai 'google'/'meta')
2. **Konvensi nama campaign** untuk auto-mapping platform_campaign_map.
3. Kabari begitu **campaign live** → builder verifikasi funnel real-user
   pertama masuk panel dengan benar.

## Q4 — Non-blocking (tidak perlu dijawab sekarang)
- Telegram credentials (alert ke HP) — stub siap, 5 menit setelah ada
- SA add-user AdSense → API v2 eCPM real
- utm_term drill-down level-3 UI — butuh data nyata
- Fase D retargeting audience export — nanti
- Custom domain dashboard — tinggal bind di CF, tanpa perubahan kode

---
KESIMPULAN: Dashboard & tracking siap traffic test. Dua keputusan kecil
(cleanup pra-launch + gclid/GTag) menentukan kapan tombol launch ditekan.
Semua klaim berbasis bukti: D1 counts, HTTP status, served-HTML verification.

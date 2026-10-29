# REPORT BUILDER — ARAHAN YANG DIBUTUHKAN UNTUK MEDIA BUYING
## Dari: Agent Website Builder · Kepada: Shelby + Director + Perf Agent · 30 Okt 2026
### Konteks: infrastruktur 100% siap. Dokumen ini = daftar input yang dibutuhkan builder
### dari sisi media buying/director, plus status semua sistem untuk dokumentasi.

---

## BAGIAN 1 — STATUS INFRASTRUKTUR SAAT INI (semua terverifikasi 30 Okt)

| Komponen | Status | Bukti |
|---|---|---|
| SUB1 quiz (card.seputar-ntt.com) | LIVE | real-nav journey PASS |
| SUB2 money pages + /go | LIVE | /go/chime 302 params utuh |
| Meta Pixel base + PageView | LIVE | fbq init 1467955421937228, request terkirim |
| QuizStart (1x/lid, semua traffic) | LIVE | flag cp_fbqs_<lid> ter-set, tidak dobel saat refresh |
| GTag scaffold (gcl* only) | SIAP-INERT | menunggu CP_GTAG_ID/LABEL (set 2 secret = live) |
| CAPI mirror server-side | LIVE | fire-and-forget, event_id=qs_<lid>, sha256 NOL PII |
| gclid capture | LIVE | funnel_events.gclid + session_summary.gclid |
| X1 lid lintas subdomain | FIXED | getLid URL→cookie→localStorage + cookie domain-wide |
| X2 cq_* mengalir ke lelang | FIXED | cq_timing/regen/id/goal/dep/pos di landing/slide/P1/P2 |
| cp-fwd.js query forwarding | LIVE | P1→P2 membawa seluruh params |
| Validasi handler (anti-sampah) | LIVE | saved/rejected terukur, key unknown ditolak |
| Bot check server-side 20s | LIVE | bot=true tercatat di results |
| Dashboard metrics-hq | LIVE | 7 panel + settings, JWT + throttle D1 |
| Alert engine + guardrails | LIVE | cron per jam, auto-pause ingestion 3x error |
| Backup D1 mingguan | LIVE | Senin 08:00 UTC, retensi 8 minggu |
| Data hygiene | BERSIH | semua tabel transaksional = 0 rows |
| Keamanan | PASS | 401 tanpa JWT, throttle 429, noindex, XSS ditolak |

---

## BAGIAN 2 — ARAHAN YANG DIBUTUHKAN (4 item, urut blocking)

### ARAHAN 1 — AW conversion ID + label (Google) — BLOCKING GTag live
**Pemilik**: perf agent / Shelby (setelah billing fresh account)
**Yang dibutuhkan**: conversion action `quiz_start` dibuat di Google Ads →
kirim AW-ID (format AW-XXXXXXXXX) + conversion label ke builder.
**Aksi builder**: set 2 secret (CP_GTAG_ID, CP_GTAG_LABEL) → GTag live
tanpa deploy ulang → konfirmasi network request conversion ke perf agent.
**Estimasi**: 5 menit setelah ID diterima.
**Kenapa blocking**: conversion action harus aktif SEBELUM submit campaign
for review (biar konversi terhitung sejak hari-1 — G1).

### ARAHAN 2 — Sinyal CP_GAM + konfirmasi AdX parent — BLOCKING lelang premium
**Pemilik**: director (konfirmasi MCM/AdX parent approve cardpath)
**Yang dibutuhkan**: konfirmasi resmi → builder set secret CP_GAM →
wrapper gam.js aktif otomatis → AdX mulai crawl.
**Ekspektasi**: no-fill normal 24-48 jam pertama; dashboard P3 (Ad Health)
menampilkan fill rate real-time; KV lelang (8 keys terverifikasi mengalir)
langsung bekerja.
**Estimasi**: 2 menit setelah konfirmasi.

### ARAHAN 3 — Keputusan kecil director (satu balasan cukup)
a) **Bot threshold 20 detik**: rekomendasi builder = PERTAHANKAN selama Fase C
   (kualitas data > volume), dengan distribusi elapsed_ms ditampilkan di
   report D1 hari-3. Kalau p10 user asli <20s → review di Fase D, bukan
   di tengah test. Butuh konfirmasi eksplisit agar perf agent tidak
   menganggap ini bug.
b) **Slug sitelink ke-3 (X6)**: perf agent usul /build-credit-without-a-card.
   Butuh konfirmasi → builder pastikan halaman live 200 + kabari perf agent.

### ARAHAN 4 — Persiapan Fase D (bukan sekarang — supaya builder bisa persiapan)
a) **Meta optimasi konversi**: Pixel + CAPI sudah jalan (dibuat builder) —
   pertanyaan perf agent "pixel boleh atau traffic-only" TERJAWAB: boleh.
   Adset switch LINK_CLICKS → OFFSITE_CONVERSIONS bisa dilakukan perf agent
   setelah konfirmasi QuizStart masuk Events Manager.
b) **LAL source audience**: outbound_clickers + gate_completers dari D1.
   Builder bisa export daftar lid begitu ≥100 user US per source tercapai —
   perf agent beri tahu kapan dibutuhkan.
c) **Budget final Meta Fase D** (usulan draft: $20-30/hari): keputusan
   director + Shelby saat trigger Q25 tercapai (2 dari 3).

---

## BAGIAN 3 — YANG TIDAK DIBUTUHKAN (sudah jalan otomatis)
Pixel + CAPI ✓ · gclid capture ✓ · utm chain lintas sub ✓ · lid konsisten ✓ ·
dashboard 7 panel ✓ · backup mingguan ✓ · alert engine + guardrails ✓ ·
validasi anti-sampah ✓ · bot check ✓ · cleanup data otomatis disiplin ✓

---

## BAGIAN 4 — TIMELINE LAUNCH (dengan arahan di atas terpenuhi)

```
HARI INI:
  Shelby     → billing fresh Google Ads (15 menit)
  Perf agent → AW ID + label → builder set secrets (5 menit)
  Director   → jawab ARAHAN 3 (satu balasan)
T+1:
  Shelby     → setup campaign via SETUP_GUIDE_SHELBY.md (45-60 menit)
  Builder    → verifikasi GTag fire + conversion action test
T+2:
  Submit campaign for review (YMYL 2-5 hari)
T+4 - T+7:
  LAUNCH → laporan hari-1 (1 baris) → LAPORAN PERTAMA hari-3
Paralel:
  Director → konfirmasi AdX parent → builder set CP_GAM → AdX crawl
```

---

## BAGIAN 5 — STATUS GAUL/OPEN ITEMS DARI CROSSCHECK PERF AGENT (X1-X7, status akhir)

| # | Isu | Status akhir |
|---|---|---|
| X1 | lid berubah antar halaman | ✅ FIXED (cookie + getLid order) — verified 8 user |
| X2 | cq_mathime | ✅ BUKAN BUG (ilusi teks — char-code verified); cq_timing mengalir benar |
| X3 | cp/f/i chain | ✅ cp=fit by design; intent dihitung dari D1 (otoritatif); dijawab |
| X4 | Timing GTag | ✅ scaffold siap — tinggal AW ID dari Shelby/perf |
| X5 | Bot threshold 20s | ⏳ menunggu konfirmasi director (rekomendasi: pertahankan) |
| X6 | Slug sitelink | ⏳ menunggu konfirmasi director (usulan perf: build-credit-without-a-card) |
| X7 | Compliance pages | ✅ 200 kedua subdomain (verified sebelumnya) |

---

## BAGIAN 6 — META (jalan paralel, perf agent)
Campaign CARDPATH-META-METAA LIVE Rp150rb/hari (AS1 interest + AS2 broad,
7 ads) — pixel + CAPI dari builder sudah melayani campaign ini.
Monitoring hari-2: quiz completion per utm_content (as1 vs as2) via D1.

---

*Dibuat oleh Agent Website Builder. Semua klaim berbasis bukti
(real navigation + D1 dumps + HTTP status), bukan asumsi.*

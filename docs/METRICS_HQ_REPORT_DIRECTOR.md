# METRICS-HQ DASHBOARD REPORT — UNTUK PROJECT DIRECTOR
## Dari: Agent Website Builder · Untuk: Allice (Director) · 27 Okt 2026
### Status: BUILD COMPLETE + FULL AUDIT PASSED (3 bug ditemukan & fixed saat audit)

---

## BAGIAN 1 — RINGKASAN EKSEKUSI

Dashboard "Metrics HQ" (nama generik per arahan Shelby, non-CardPath) LIVE di
`https://metrics-hq.ayiikrnwn.workers.dev` sebagai **worker terpisah** dengan D1
binding yang sama (`cardpath-db`) — data funnel produksi otomatis ter-connect,
tanpa sentuh worker produksi.

- **7 panel + settings**: Overview (verdict row + campaign leaderboard),
  Cohorts, Funnel, Ads, Value, Quality, Content + Settings
- **Arsitektur sesuai arahan final Shelby**: TANPA GA4, TANPA GAM Report API,
  revenue = derivation D1 + AdSense daily (schema siap, populate menyusul)
- **Label REAL/DERIVED di semua angka agregat** (prinsip skeptis-data)
- **Style**: putih, hairline, flat, tabular-nums mono, framework Stripe/Mercury
  (verdict row = jawaban "am I okay?" paling besar; color = status only)
- **Perf**: semua panel 40-200ms dengan 1.500+ session + 8.000 impresi (target <2s)
- Password: `cardpath-dash-2026` (Shelby ganti via `wrangler secret put CP_DASH_PASSWORD`)

---

## BAGIAN 2 — YANG LIVE PER BAGIAN (dengan bukti audit)

### Overview (P0)
- Verdict row 5 stat: NET [DERIVED] + status profitable/burning, Spend [REAL],
  Sessions + engaged, Quiz→Gate + completion %, Outbound + share
- **NET per campaign = AdSense earning × share impresi campaign** (bridge
  lid→campaign via session_summary) — bukan asumsi flat; otomatis akurat saat
  adsense_daily terisi data nyata
- Sparkline trend 14d per baris; klik baris → drill-down ad group (utm_content)
  → (utm_term via API, siap)
- Export CSV per panel (verified 200 + format benar)

### Cohorts (P1) — BARU
- Matriks cq_pos × cq_timing: users, jump rate, avg FIT, avg INTENT
- Histogram FIT & INTENT (bin 5) dengan bin threshold merah — input kalibrasi
  Fase C (threshold 30/35 terlihat)

### Funnel (P2)
- 9 step horizontal bars, drop-off % per transisi, merah kalau >40%
- Quiz duration histogram (<15s s/d 5m+) — sinyal kualitas traffic

### Ads (P3)
- Fill %, viewability per slot; **latency p50/p95** (dari meta_json adlog,
  merah kalau p95 >1500ms); top-10 winning line items
- Daily trend tersedia via API

### Value (P4)
- KV matrix: impresi, rendered, fill, **premium-winner %**, **eCPM [DERIVED]**
  (pending placeholder jujur sampai adsense_daily terisi)

### Quality (P5)
- Bot rate (server-side scoring) + **fraud signals**: lid >3 session,
  session >10 pageviews (review manual, bukan auto-ban)
- Alerts unacknowledged + acknowledge button

### Content (P6)
- Pageviews + avg engaged + avg scroll per halaman money pages

### Settings
- Threshold alert editable: budget cap, bot rate, no-fill → settings table,
  dipakai alert engine per jam. XSS key sanitized (audit: key invalid ditolak)

---

## BAGIAN 3 — SISTEM PENDUKUNG

1. **track.js** (PART 1) — terinject otomatis di SUB1 + SUB2 (worker HTML
   rewrite): session_start/page_view/scroll_depth/heartbeat/session_end,
   batch 5s, sendBeacon offline-safe. Terverifikasi E2E produksi.
2. **Alert engine** — per jam: bot rate >threshold, no-fill >40% 2 jam, spend
   >budget cap, data gap (spend ada tapi 0 page_view 2 jam). Telegram siap
   (stub) — menunggu kredensial Shelby (SHELBY: nanti saja).
3. **Meta ingestion** — single cron per jam dengan internal 6h interval check:
   insights level=campaign → UPSERT idempotent spend_events.
4. **Guardrails ingestion** — jangan overwrite existing>$0 dengan $0/partial;
   3x error beruntun → auto-pause + alert (counter di settings, reset saat sukses).
5. **Backup D1 mingguan** — cron Hermes Senin 08:00 UTC → /root/backups/d1/
   (retensi 8 minggu). Test export sukses (4,5 MB → 291 KB gz).
6. **Seed data** — 1.471 session + 8.023 impresi + 120 spend + 30d adsense
   dimuat untuk validasi layout & perf dengan data penuh (bisa dibersihkan
   sebelum traffic nyata — semua ber-prefiks `seed_`).

---

## BAGIAN 4 — AUDIT & BUG YANG DITEMUKAN SAAT AUDIT (gejala → akar → fix)

### A1 (CRITICAL): Funnel tracking produksi MATI diam-diam
- **Gejala**: batch track POST /api/track return {ok:true} tapi 0 row baru di D1
- **Akar**: saat pembersihan dashboard dari worker produksi, handleTrack masih
  memanggil trackSession()/insertFunnel() yang definisinya ikut terhapus →
  exception tertelan try/catch → response ok tapi tidak ada insert. Pelajaran
  sama dgn kasus F4 Fase A (fungsi dipanggil wajib diverifikasi definisinya ada)
- **Fix**: handleTrack ditulis ulang self-contained (trackSessionP/insertFunnelP)
  + error TIDAK di-silent (console.log). Deploy + verified E2E: session_summary
  terisi lengkap (quiz/jump/outbound), funnel_events 5/5, muncul di dashboard
- **Penting**: tracking mati sejak commit pembersihan (±2 jam) — TIDAK ADA data
  produksi yang hilang karena traffic belum jalan

### A2: Rate limit login tidak konsisten
- **Gejala**: 6x password salah → semua 401, tidak pernah 429
- **Akar**: counter in-memory di Worker = reset per isolate (multi-instance CF)
- **Fix**: throttle via D1 (login_throttle per IP, window 60s) — verified: 401x5
  lalu 429; window reset benar setelah 60 detik

### A3: Panel Content 500
- **Gejala**: p6 → D1_ERROR no such column: page
- **Akar**: query refer kolom `page` di session_summary (tidak ada; page ada di
  funnel_events)
- **Fix**: query diarahkan ke funnel_events (page_view sub2) + join session
  quality via session_id — verified OK

### A4 (ditemukan lebih awal, sudah fixed): orphan cron di worker produksi
- scheduled handler memanggil ingestMetaSpend yang tidak ada → error diam tiap
  jam sejak pembersihan. Dihapus; cron sekarang milik metrics-hq eksklusif.

### Catatan cron limit (bukan bug): Workers Free = 5 cron triggers/account,
terpakai buzz-forge(1) + ads-team(2) + pr-farming(1) + metrics-hq(1). Deploy
warning "partially updated" muncul karena schedule lama metrics-hq nyangkut;
KODE sudah live terverifikasi (derived API OK). Kalau ada project lain butuh
cron baru: upgrade Workers Paid atau kurangi cron project lain (tidak disentuh
tanpa arahan).

---

## BAGIAN 5 — SECURITY AUDIT (semua PASS setelah fix)

| Test | Hasil |
|---|---|
| 9 endpoint tanpa JWT → 401 | ✓ semua |
| JWT tampered → 401 | ✓ |
| Login rate limit 5/min → 429 | ✓ (setelah fix A2, via D1) |
| XSS di settings key | ✓ ditolak (whitelist format) |
| robots.txt + noindex meta + X-Robots-Tag | ✓ |
| Password hash SHA-256, secret CF | ✓ ( Shelby ganti pass default) |
| CORS minimal, tidak ada stack trace ke client | ✓ (error disanitize) |

## BAGIAN 6 — YANG BELUM / MENUNGGU (jujur)

1. **eCPM & NET real** — menunggu adsense_daily terisi (CSV manual atau
   AdSense API v2 setelah SA add-user). Schema & derivation siap.
2. **Telegram alert** — Shelby: nanti. Stub siap (set 2 secret → langsung hidup).
3. **utm_term drill-down UI** — API siap, UI level-2 (content) live; term
   query perlu sample data utk diverifikasi penuh.
4. **Seed data masih di D1** — dimuat utk validasi. Bersihkan sebelum traffic
   nyata (satu perintah, semua ber-prefiks `seed_`).
5. **AdSense API v2 population** — opsional; sekarang CSV manual ke
   adsense_daily cukup.

## BAGIAN 7 — UNTUK SHELBY: daftar test yang disarankan
1. Buka metrics-hq → login → cek 7 panel + settings
2. Klik baris campaign → drill-down ad groups
3. Export CSV (Overview/Funnel)
4. Settings: ubah budget cap → Save → refresh (tersimpan)
5. Ganti password: `npx wrangler secret put CP_DASH_PASSWORD` (worker metrics-hq)

## VERDICT: SIAP DIREVIEW DIRECTOR. Semua klaim di atas berbasis audit
headless-browser + D1 direct query + HTTP status codes, bukan klaim mentah.
Commits: cardpath-dash (UI v3 + audit fixes), cardpath-worker (A1 fix).

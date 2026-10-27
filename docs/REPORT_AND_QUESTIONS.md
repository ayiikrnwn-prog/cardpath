# REPORT BUILDER — STATE SAAT INI + PERTANYAAN YANG PERLU DIJAWAB
Dari: Agent Website Builder · Untuk: Shelby + Director · 28 Okt

---

## BAGIAN 1 — STATE FINAL (semua terverifikasi, bukan klaim)

### Produksi (funnel uang)
- SUB1 card.seputar-ntt.com: quiz + email gate — LIVE, track.js kini TERPASANG
  (fix Keil#1) — session_start dari quiz tercatat
- SUB2 cardpath.seputar-ntt.com: money pages + /go — LIVE
- gam.js: prepared & inert, hanya aktif di cardpath.* bila window.CP_GAM di-set
- ads.txt: 2 pub-ID terpasang
- Worker produksi: bersih dari kode dashboard, cron yatim dihapus

### Dashboard metrics-hq (worker terpisah, D1 shared)
- 7 panel + settings, auth JWT + rate-limit D1, export CSV, drill-down
- Verdict row derived- revenue (AdSense × impression share) — siap begitu
  adsense_daily terisi
- Backup D1 mingguan (Senin 08:00 UTC) jalan, retensi 8 minggu
- Alert engine per jam + guardrails ingestion (auto-pause 3x error)
- GitHub: monorepo cardpath (commit d3a81a1); metrics-hq repo menunggu token
  baru (repo-creation permission)

### Data D1 saat ini (pasca cleanup seed)
- spend_events: 0 · adsense_daily: 0 (jujur kosong, siap data nyata)
- funnel_events: 2.015 rows — SEMUA data test pra-launch (results_view 1.124,
  quiz_answer 315, quiz_complete 117, dst dari testing Shelby/agent)
- korup: 26 rows (lid=null, event=unknown — jejak audit director)
- leads: 40 (email test), results: 32, sessions: 2
- ad_impressions: 21 (jejak GPT telemetry test)

---

## BAGIAN 2 — SEJARAH PERBAIKAN HARI INI (case-by-case singkat)
1. Keil#1: track.js tidak di quiz SUB1 (exclude /sub1/ eksklusi salah) → fixed,
   verified served. PENTING: session_start quiz sekarang tercatat.
2. N3b: handler track menerima sampah (lid null, event unknown) di DUA worker
   (prod + farm keduanya punya varian masalah; farm orphan) → validasi
   VALID_EVENTS + lid wajib, response {saved, rejected}. Bukti: 4-event korup →
   saved=1, rejected=3.
3. N3a: API contract /api/track di README kedua worker.
4. N1: seed + slot sampah dibersihkan (12.898 rows) — dashboard jujur kosong.
5. A2 (audit kemarin): rate-limit login via D1 (in-memory tidak konsisten antar
   isolate). A3: p6 query fix. A1: handleTrack prod self-contained.

---

## BAGIAN 3 — PERTANYAAN YANG PERLU DIJAWAB (blocking per urutan)

### Q1 — Shelby (prasyarat traffic test):
a) **Gclid capture & GTag quiz_start** — director jadwalkan ini sebelum traffic
   test Google. Konfirmasi: eksekusi sekarang, atau menunggu arahan director
   berikutnya? (perlu keputusan karena menyentuh quiz page produksi)
b) **Token GitHub baru** dengan permission repo-creation (Administration RW) —
   untuk push metrics-hq repo. Teruskan saat siap.
c) **Password dashboard** — masih default `cardpath-dash-2026`. Ganti sendiri
   (saya berikan command) atau minta saya generate & set yang kuat?
d) **AdSense daily populate** — jalankan CSV manual dulu, atau tunggu SA
   add-user selesai? (NET/eCPM dashboard baru akurat setelah ini)

### Q2 — Director (keputusan data):
a) **26 rows korup + ~2.000 rows test pra-launch** — bersihkan semua agar D1
   mulai dari nol bersih saat traffic test, atau biarkan sebagai data kalibrasi
   awal? Rekomendasi saya: bersihkan (dashboard & kalibrasi Fase C jadi murni).
b) Konfirmasi jadwal **gclid + GTag** (jawaban Shelby Q1a menimpa ini).

### Q3 — Perf agent (sebelum & saat launch):
a) Konfirmasi **enum utm_source final** yang akan dipakai campaign: gcl1/gcl2/
   metaa/metab? (KV enum + dashboard filter sudah pakai enum ini — jangan
   pakai 'google'/'meta' di campaign live)
b) **Convention nama campaign** untuk auto-mapping platform_campaign_map
   (kalau tidak diisi manual, ingestion fallback pakai nama campaign — bagus
   kalau namanya self-describing)
c) Beri tahu begitu **campaign live** → saya verifikasi funnel real-user pertama
   masuk panel dengan benar (bukan seed).

### Q4 — Menunggu (bukan blocking, tidak perlu dijawab sekarang):
- Telegram credentials (Shelby: nanti) — stub siap
- SA add-user AdSense (Shelby) — untuk API v2
- utm_term drill-down level-3 UI — butuh data nyata
- Fase D retargeting export — nanti

---
VERDICT: Dashboard & tracking siap traffic test. Dua keputusan kecil (cleanup
pra-launch + gclid/GTag) menentukan kapan tombol launch ditekan.

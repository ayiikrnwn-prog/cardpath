# LAPORAN BALIK — FEEDBACK_BUILDER_POSTHQ (N1-N3 + Keil)
Dari: Agent Website Builder · 28 Okt · Semua item selesai hari ini, dengan bukti.

## N1 — Seed cleanup: DONE SEKARANG (bukan prasyarat nanti)
Menerima argumen director: dashboard dgn data palsu lebih berbahaya daripada kosong.
D1 DELETE by prefix + slot sampah:
- session_summary: 1.469 seed rows DELETED (sisa 2 = data test journey audit)
- funnel_events: 1.808 seed DELETED
- ad_impressions: 8.000 seed + 2 slot sampah ('/n/cardpath_top','/s') DELETED
- spend_events: 120 rows (semua fiktif $6.8xx) DELETED → 0
- adsense_daily: 30 rows DELETED → 0; results: 1.468 DELETED
Post-counts: sessions 2 → funnel 2.015 (sisa = test audit, akan ikut kecil setelah
traffic; spend 0, adsense 0, imps 21).
VERIFIKASI dashboard: P0 spend rows=0, sessions=0 seed; verdict tampil "—" +
"awaiting spend data" — jujur kosong. Perf-agent bisa baca tanpa salah keputusan.
(Catatan: enum utm_source seed 'google'/'meta' ikut terhapus sekaligus — tidak
tersisa; enum gcl1/metaa tidak terkontaminasi.)

## N3b — Validasi handler track: DONE (KEDUA worker)
- insertFunnelP kini WAJIB lid non-empty string + event di VALID_EVENTS (16 event),
  else return false → TIDAK insert.
- Response baru: {ok:true, saved:N, rejected:M} (bukan count yang dibual).
- BUKTI REJECT (live, worker prod): batch 4 event [no-lid, event unknown, valid
  quiz_start, empty-lid] → {"saved":1,"rejected":3}; D1: hanya 1 row (event valid).
- BUKTI VALID: event page_view valid → saved=1, muncul di dashboard P0 range=1.
- FARM juga: handleTrack ternyata orphan di farm (memanggil fungsi tak ada — pola
  sama A1). Ditulis ulang self-contained + validasi sama. Deployed.
- Data korup lama (lid=null, event='unknown') yang sempat masuk dari audit director:
  bisa dibersihkan — `DELETE FROM funnel_events WHERE lid IS NULL OR event='unknown'`
  menunggu konfirmasi director (2 rows diperkirakan).

## N3a — API contract README: DONE
README worker (cardpath + farm) sekarang memuat kontrak /api/track lengkap:
payload schema nested, VALID_EVENTS list, response {saved, rejected}, catatan
single-event & client library track.js.

## Keil #1 — track.js di SUB1 quiz: TEMUAN BENAR, FIXED
Diagnosis: inject track.js di worker cardpath meng-exclude path /sub1/* (sisa
arsitektur lama), sedangkan quiz card.* dilayani via /sub1/ inline → quiz halaman
paling penting justru tanpa track.js. Sementara farm punya inject tapi tidak
terpakai (domain card.* ter-bind ke worker cardpath).
FIX: hapus exclude /sub1/ → verified served: quiz page card.* kini punya track.js.
session_start dari quiz kini tercatat.

## Keil #2 — rules inject konfirmasi
- gam.js: hanya hostname cardpath.* (money pages) + excl /start path — benar, tidak
  bocor ke SUB1/quiz/admin. workers.dev preview mendapat track.js (harmless, bukan
  prod domain) dan TIDAK gam.js (hostname check) — sesuai desain.
- admin/login di worker prod = 404 (dashboard dipindah metrics-hq) → tidak ada
  track di admin.

## Keputusan cron limit: DICATAT
Tidak ada upgrade/matiin cron tanpa approval director. Metrics-hq sudah hemat: 1
cron trigger (internal 6h gating).

## Queue berikutnya (menunggu): gclid capture + GTag quiz_start (Koordinasi
director), monitor real-user pertama setelah traffic test.
GitHub: commit 753f87e (workers/cardpath + workers/cardpath-farm sync).

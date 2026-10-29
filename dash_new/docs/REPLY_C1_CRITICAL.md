# LAPORAN BALIK C1 CRITICAL — CANONICAL QUIZ FIXED + EKSEKUSI URUTAN
Dari: Agent Website Builder · 28 Okt · Bukti real-navigation (bukan path /sub1)

## C1 CRITICAL — FIXED & VERIFIED VIA REAL NAVIGATION
### Akar (konfirmasi dugaan director, spesifik):
Bukan dua file quiz di assets — melainkan **route proxy** di worker cardpath:
URL canonical /start/quiz (extensionless, hostname card.*) masuk branch
"proxy ke /sub1/*" yang menambahkan path TANPA .html → ASSETS me-resolve ke
/sub1/start/index.html (QUIZ LEGACY, meta "6 questions") → response dikembalikan
MENTAH tanpa inject track.js. Sementara /start/quiz.html (dgn ekstensi) kena
blok assets umum yang TIDAK mengecualikan /sub1 lagi (fix Keil#1 kemarin) —
makanya verifikasi kemarin (yang pakai .html) lolos padahal canonical bocor.

### Fix:
1. Branch proxy kini resolve .html eksplisit (/start/quiz → /sub1/start/quiz.html)
   dan inject track.js di response.
2. **Legacy quiz files DIHAPUS dari assets** (lesson C1 Fase A diterapkan):
   worker/sub1/start/index.html (quiz legacy), worker/quiz.html, farm/start/
   quiz.html — farm/start disinkron dgn versi baru. Grep referensi: 0 link rusak.
3. C2: meta "6 questions" → "9 questions" di 4 file yang tersisa.

### BUKTI (headless Chrome real navigation, URL eksak yang diklik iklan):
`card.seputar-ntt.com/start/quiz?utm_source=gcl1&utm_campaign=...&gclid=TESTGCLID123`
- track.js served: TRUE · track.js request fired: TRUE
- meta: "9 questions" TRUE, "6 questions" FALSE
- quiz berfungsi (klik opsi OK), 0 JS errors
- D1 (dari real navigation tsb): session_start + page_view + quiz_start masuk,
  session_summary terisi (pageviews, device, utm lengkap)

## URUTAN 2 — Cleanup total pra-launch: DONE (disetujui Q2.1)
DELETE semua funnel_events/session_summary/leads/results/ad_impressions +
korup → post-counts: SEMUA 0. D1 mulai dari nol bersih untuk traffic test.

## URUTAN 3 — gclid capture + GTag: DONE
- funnel_events + session_summary: kolom `gclid` (ALTER)
- track.js: gclid dari URL → sessionStorage (persist lintas hop funnel) →
  dikirim dalam utm di setiap event
- Worker: simpan gclid di funnel_events & session_summary
- BUKTI: event dengan utm.gclid=G789 → D1 gclid="G789"; real navigation
  gclid=TESTGCLID123 → session_summary.gclid terisi
- GTag: inject di canonical quiz VIA WORKER — hanya bila (a) secret CP_GTAG_ID
  ter-set, (b) utm_source dimulai "gcl", (c) hostname card.*. app.js mem-fire
  `generate_lead` saat quiz_complete (cache-bust v=440). MENUNGGU: AW conversion
  ID asli dari director/perf untuk diset sebagai CP_GTAG_ID — tanpa itu inject
  inert (by design, bukan lupa).

## CATATAN JUJUR
- Halaman hasil kini log page "/sub1/start/quiz" (path internal) bukan "/start/
  quiz" — tidak mengubah data funnel (lid+utm yang join), tapi kalau director
  mau page-path dinormalisasi ke canonical, kecil, bisa kapan saja.
- N3a API contract: KONFIRMASI — sudah di README kedua worker (bagian
  "API CONTRACT — POST /api/track", skema nested + VALID_EVENTS + response).
- Verify rows dari pengujian saya dibersihkan setelah tiap bukti — D1 tetap nol.

## STATUS URUTAN EKSEKUSI
1. C1 canonical — DONE ✓ (bukti di atas)
2. Cleanup pra-launch — DONE ✓ (0 rows semua tabel transaksional)
3. gclid + GTag — DONE ✓ (GTag menunggu AW ID untuk diaktifkan)
4. Lapor balik — dokumen ini

Siap untuk launch traffic test begitu director beri AW conversion ID & perf
agent konfirmasi campaign live.

# UPDATE REPORT BUILDER — UNTUK PROJECT DIRECTOR
Dari: Agent Website Builder · 28 Okt · Semua item feedback kedua SELESAI, dengan bukti real-navigation

---

## RINGKASAN EKSEKUSI
Feedback kedua (FEEDBACK2_BUILDER_CANONICAL.md) dieksekusi 100% hari ini:
- 🔴 C1 canonical quiz — FIXED + verified via real navigation (bukan /sub1 path)
- 🟡 C2 meta "6 questions" — FIXED di semua path
- Cleanup total pra-launch — DONE (disetujui Q2.1): D1 = 0 rows semua tabel
- gclid capture + GTag scaffold — DONE (GTag menunggu AW ID)

---

## 1. C1 CRITICAL — CANONICAL QUIZ (FIXED)

### Akar (lebih spesifik dari dugaan):
Bukan dua file quiz di assets. URL canonical /start/quiz (extensionless) masuk
branch proxy di worker cardpath yang menambahkan path TANPA .html → CF assets
me-resolve ke /sub1/start/index.html = QUIZ LEGACY ("6 questions") → dikembalikan
MENTAH tanpa inject track.js. Verifikasi kemarin memakai /start/quiz.html (dengan
ekstensi) yang lewat blok assets lain yang sudah benar — makanya klaim lolos.
Lesson director diterima dan diterapkan: verifikasi fix WAJIB di URL eksak yang
diklik traffic nyata.

### Fix yang dilakukan:
1. Branch proxy resolve .html eksplisit (/start/quiz → /sub1/start/quiz.html)
   + inject track.js di response tersebut.
2. Legacy quiz files DIHAPUS dari assets (lesson C1 Fase A): sub1/start/index.html
   (quiz legacy), worker/quiz.html, farm/start/quiz.html. Farm/start disinkron
   versi baru. Grep referensi: 0 link rusak.
3. C2: meta "9 questions" konsisten di semua file quiz (4 file di-fix).

### BUKTI — headless Chrome real navigation ke URL eksak iklan:
`card.seputar-ntt.com/start/quiz?utm_source=gcl1&utm_campaign=...&gclid=TESTGCLID123`
- track.js served: TRUE · track.js request fired: TRUE
- meta: "9 questions" TRUE, "6 questions" FALSE
- Klik opsi quiz berfungsi, 0 JS errors
- D1 dari navigasi itu: session_start + page_view + quiz_start TERCATAT,
  session_summary terisi (pageviews, device, utm lengkap)

---

## 2. CLEANUP TOTAL PRA-LAUNCH (Q2.1 disetujui) — DONE
DELETE seluruh funnel_events, session_summary, leads, results, ad_impressions
+ 26 rows korup (lid=null) → post-counts: SEMUA 0.
D1 mulai dari nol bersih — kalibrasi Fase C & dashboard murni data nyata.

---

## 3. GCLID CAPTURE + GTAG (urutan 3) — DONE

### gclid:
- Kolom `gclid` di funnel_events & session_summary (ALTER)
- track.js: capture URL → sessionStorage (persist lintas hop funnel) → dikirim
  dalam utm di setiap event
- Worker menyimpan ke kedua tabel
- BUKTI: event dengan utm.gclid=G789 → D1 "G789"; real navigation
  gclid=TESTGCLID123 → session_summary.gclid terisi

### GTag (conversion quiz_start):
- Inject VIA WORKER di canonical quiz — syarat: (a) secret CP_GTAG_ID ter-set,
  (b) utm_source prefix "gcl", (c) hostname card.* — sesuai bentuk yang
  disetujui director (worker inject, quiz page only, gcl* only)
- app.js fire event `generate_lead` saat quiz_complete (cache-bust v=440)
- STATUS: inject INERT by design sampai director/perf memberikan AW conversion
  ID asli → set sekali: `npx wrangler secret put CP_GTAG_ID` → langsung hidup

---

## 4. KONFIRMASI ITEM FEEDBACK PERTAMA (yang ditanya director)
- N3a API contract: SUDAH di README kedua worker — section "API CONTRACT —
  POST /api/track": skema nested batch, VALID_EVENTS (16 event), response
  {saved, rejected}, catatan single-event & track.js
- N1 cleanup seed ✓ · N3b validasi ✓ · backup mingguan ✓ · cron etiquette ✓
  (semua sudah dilaporkan di REPLY_FEEDBACK_POSTHQ.md)

---

## 5. STATE SAAT INI (angka D1 langsung, 28 Okt)
funnel_events 0 · session_summary 0 · leads 0 · results 0 · ad_impressions 0 ·
spend_events 0 · adsense_daily 0 — SEMUA BERSIH, siap traffic test.

## 6. COMMITS & ARTIFACTS
- cardpath-worker 49e7cf3: C1 fix + C2 + gclid + GTag scaffold
- cardpath-farm bac5802: sinkron C1 + gclid
- cardpath-dash 1047afd: dashboard (tidak berubah)
- GitHub monorepo `cardpath`: commit 2ba1549 (workers + docs REPLY_C1_CRITICAL.md/.docx)

---

## 7. YANG DIBUTUHKAN UNTUK LAUNCH (menunggu, bukan tugas builder)
1. AW conversion ID dari director/perf → set CP_GTAG_ID (1 menit)
2. Perf agent: konfirmasi enum utm_source (gcl1/gcl2/metaa/metab) + konvensi
   nama campaign + kabari saat campaign live
3. Shelby: token GitHub baru (Administration RW) utk repo metrics-hq; password
   dashboard diganti; AdSense daily CSV manual (opsional segera)

## 8. CATATAN KECIL (transparansi)
- Halaman kini log page-path "/sub1/start/quiz" (path internal), bukan canonical
  "/start/quiz" — tidak mempengaruhi join data (lid+utm yang menghubungkan),
  tapi kalau director ingin normalisasi ke canonical, kecil, bisa kapan saja.

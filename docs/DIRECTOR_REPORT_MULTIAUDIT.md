# REPORT BUILDER — MULTI-USER AUDIT & LAUNCH READINESS
## Dari: Agent Website Builder · Kepada: Allice (Project Director) · 29 Okt
### Konteks: pasca X1+X2 fix · audit 8 fake-human users · status GREEN untuk launch

---

## BAGIAN 1 — RINGKASAN EKSEKUSI

Audit multi-user dengan 8 fake user berperilaku manusia (random, deterministik)
selesai — **semua lolos, 0 bug aktif ditemukan**. Ditambah satu klarifikasi
penting: temuan "cq_mathime" dari audit sebelumnya ternyata **bukan bug** —
ini menghapus satu item yang pernah dicurigai sebagai data corruption.

Status: **SISTEM GREEN — SIAP LAUNCH TRAFFIC TEST.** Bloker tersisa seluruhnya
non-kode (AW ID, YMYL review, billing, AdX crawl).

---

## BAGIAN 2 — METODE AUDIT

8 user, perilaku acak mirip manusia (seed deterministik agar bisa direproduksi):
- Perangkat: 5 mobile (iPhone UA, 390px) · 3 desktop (Chrome/Windows UA)
- Jeda antar klik 1,5-4 detik (bervariasi per user — human pacing)
- Jawaban quiz RANDOM (tidak selalu opsi pertama — menguji semua cabang scoring)
- Scroll depth acak 0-100% per user
- 2 user drop-off di tengah quiz (U1, U2 — simulasi bouncing traffic)
- Sumber: 6x gcl1 (Google) · 2x metaa (Meta) — menguji kedua jalur enum
- gclid unik per user · email gate diisi per user
- 6 user menyelesaikan journey penuh hingga P2

---

## BAGIAN 3 — HASIL PER DIMENSI

### 3.1 Journey & Navigasi — LOLOS SEMUA
- 8/8 user: **0 JavaScript errors** di semua halaman yang dilewati
- Drop-off users: berhenti bersih, tanpa dead-end, halaman tetap berfungsi
- Full-journey users: quiz → result → email gate → jump SUB2 → carousel slide
  (‹ ›) → P1 → P2 — semua transisi mulus, tidak ada 404/halaman rusak
- Match beragam: zolve (5), amexnova (2), petal2 (2), chime (1), opensky (1)
  — engine spread sehat, tidak ada monopoli produk

### 3.2 X1 — LID Konsistensi — LOLOS 8/8
Setiap user: localStorage SUB1 == cookie cp_lid (domain .seputar-ntt.com) ==
lid di semua URL jump/slide/P1/P2 == lid di D1 funnel_events (kedua sub).
Tidak ada satu pun regenerate lintas subdomain.

### 3.3 X2 — CQ_* ke Lelang — LOLOS 8/8
- cq_timing: now / months13 / research — sesuai jawaban timing tiap user ✓
- cq_regen: never / applied / browsed ✓ · cq_id: ssn / passport ✓
- cq_goal, cq_dep, cq_pos mengikuti ✓
- cq_match berganti benar saat slide carousel ✓
- gclid tersimpan di funnel_events & session_summary ✓
- utm chain (source/campaign/content/term) utuh dari klik sampai outbound ✓

### 3.4 Bot Check — BEKERJA
Server-side scoring menandai bot=true untuk pacing cepat (elapsed <20s) —
benar sesuai desain anti-fraud. Data tetap masuk funnel (filter saat analisis),
sesuai keputusan director sebelumnya.

---

## BAGIAN 4 — KLARIFIKASI PENTING: "cq_mathime" BUKAN BUG

Temuan "cq_mathime"/"cq_matmexnova" (dilaporkan director di audit Fase A dan
diikuti builder) **ternyata bukan data corruption**. Verifikasi akhir dengan
char-codes + URLSearchParams.get() langsung di browser membuktikan:

- URL asli memuat `cq_matmexnova` dengan parameter terbaca SEMPURNA:
  cq_match=amexnova, cq_timing=research, dst.
- Karakter `h=` dan `a` di `cq_matmexnova` tampak menyatu saat DIBACA manusia —
  ilusi optik pembacaan teks URL berdempetan
- Verifikasi di browser: `URLSearchParams.get('cq_match')` = 'amexnova' ✓

Implikasi:
1. Tidak ada perbaikan yang diperlukan untuk item ini
2. Tidak ada data KV lelang yang pernah korup dari sisi ini
3. Pelajaran metodologi (untuk semua pihak): verifikasi parameter URL wajib
   pakai URLSearchParams.get() / char-codes — JANGAN membaca URL mentah

---

## BAGIAN 5 — GAM READINESS

- **gam.js: prepared & inert by design** — inject otomatis hanya setelah secret
  CP_GAM di-set (menunggu konfirmasi AdX parent — sesuai keputusan Shelby:
  tolak iklan murah, tunggu AdX premium)
- **KV yang akan dikirim ke lelang** (semua terverifikasi mengalir dari journey):
  utm_source, cq_match, cq_timing, cq_regen, cq_id, cq_goal, cq_dep, cq_pos —
  tepat 8 dari 9 custom targeting keys yang terdaftar di GAM (9th = gclid-
  derived, menunggu traffic nyata)
- ads.txt kedua subdomain ✓ · /api/adlog → D1 ad_impressions telemetry ✓
- Ekspektasi: setelah CP_GAM di-set + AdX crawl, no-fill normal di 24-48 jam
  pertama — dashboard P3 (Ad Health) akan menampilkan fill rate real-time

---

## BAGIAN 6 — DATA HYGIENE

Semua data audit & test DIHAPUS setelah verifikasi (keputusan Q2.1 director):
funnel_events 0 · session_summary 0 · leads 0 · results 0 · ad_impressions 0 ·
spend_events 0. D1 bersih total — kalibrasi Fase C akan murni data nyata.

---

## BAGIAN 7 — KONFIRMASI TIDAK ADA REGRESI
Quiz 9 pertanyaan ✓ · email gate 1x ✓ · carousel slide server-driven ✓ ·
/go redirect 302 + D1 log ✓ · GTag scaffold inert (menunggu AW ID) ✓ ·
gclid capture ✓ · bot check ✓ · validasi handler (reject sampah) ✓ ·
dashboard metrics-hq tetap berfungsi (terpisah, tidak tersentuh) ✓

---

## BAGIAN 8 — LAUNCH CHECKLIST (yang tersisa, seluruhnya non-kode)

| # | Item | Pemilik | Estimasi |
|---|---|---|---|
| 1 | AW conversion ID → set secret CP_GTAG_ID | Perf agent → builder (1 mnt) | segera |
| 2 | CP_GAM secret + konfirmasi AdX parent | Director + Shelby | segera |
| 3 | Submit YMYL review Google | Perf agent | 2-5 hari |
| 4 | Billing Google Ads fresh | Shelby | segera |
| 5 | AdX crawl setelah traffic | otomatis | 24-48 jam |
| 6 | Verifikasi funnel real-user pertama | builder (standby) | saat live |

## ARTIFACTS
- GitHub monorepo `cardpath`: commit 2093f82 (docs AUDIT_MULTIUSER_REPORT.md/.docx)
- Data audit mentah: /tmp/audit_users.json (8 user, URL per fase)
- Deploy: worker cardpath (4699514d) · cardpath-farm · metrics-hq (tidak tersentuh)

## VERDICT: LAUNCH READY dari sisi builder. Menunggu GREEN LIGHT director
setelah AW ID + billing — builder akan verifikasi funnel real-user pertama
segera setelah campaign live.

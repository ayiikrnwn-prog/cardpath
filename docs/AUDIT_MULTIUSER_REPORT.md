# LAPORAN AUDIT MULTI-USER — FAKE HUMAN BEHAVIOUR (8 USER) + FULL JOURNEY
Dari: Agent Website Builder · 29 Okt · Untuk: Shelby + Director

---

## METODE
8 fake user dengan perilaku acak mirip manusia (seed deterministik):
- 5 mobile (iPhone UA, viewport 390) · 3 desktop (Windows/Chrome UA)
- Jeda antar klik 1,5-4 detik (bervariasi per user) + jawaban RANDOM (bukan selalu opsi pertama)
- Scroll depth acak 0-100%
- 2 user drop-off di tengah quiz (U1, U2 — simulasi bouncing)
- Sumber campuran: 6x gcl1 (Google), 2x metaa (Meta)
- gclid unik per user (AUDIT...)
- 6 user menyelesaikan journey penuh: quiz → gate email → jump SUB2 → slide carousel → P1 → P2

---

## HASIL AUDIT

### 1. JOURNEY & NAVIGASI — SEMUA LOLOS
- 8/8 user: 0 JavaScript errors di semua halaman
- 2 drop-off user: berhenti di quiz tanpa dead-end (halaman tetap berfungsi)
- 6 user lengkap: quiz → result → gate → jump → carousel slide → P1 → P2 — semua navigasi mulus
- Tidak ada halaman error/404/dead-end di seluruh flow

### 2. X1 (LID KONSISTEN) — LOLOS DI SEMUA USER
- 8/8 user: localStorage SUB1 == cookie cp_lid (domain .seputar-ntt.com) == lid di semua URL == lid di D1
- Termasuk lintas subdomain: SUB1 (card.*) → SUB2 (cardpath.*) lid tidak pernah berubah

### 3. X2 (CQ_* KE LELANG) — LOLOS DI SEMUA USER
- cq_timing mengalir di SEMUA user: now / months13 / research (sesuai jawaban timing masing-masing)
- cq_regen: never / applied / browsed (sesuai jawaban) ✓
- cq_id: ssn / passport ✓ · cq_goal, cq_dep ikut ✓
- cq_match berganti benar saat slide (chime→zolve, zolve→amexnova, dst) ✓

### 4. TEMUAN BESAR: "cq_mathime" BUKAN BUG — KONFIRMASI FINAL
Key yang terlihat rusak di URL ('cq_mathime', 'cq_matmexnova') ternyata **ilusi pembacaan teks**:
verifikasi char-codes + URLSearchParams.get() langsung di browser membuktikan URL memuat
`cq_match=amexnova` & `cq_match=chime` dengan BENAR. Karakter 'h=' & 'a' berdempetan saat dibaca
manusia. Artinya:
- Laporan sebelumnya (director & saya) yang menyebut "parameter rusak" = salah baca, bukan bug
- Tidak ada perbaikan yang diperlukan untuk ini
- KV lelang GAM menerima cq_match/cq_timing/semua enum dengan benar
(Pelajaran untuk semua pihak: verifikasi parameter pakai URLSearchParams.get(), bukan membaca URL.)

### 5. GAM — KONDISI SAAT INI
- gam.js prepared & inert by design: inject otomatis HANYA setelah secret CP_GAM di-set
  (menunggu konfirmasi AdX parent — sesuai keputusan Shelby: tolak iklan murah, tunggu ADX)
- Saat aktif, KV yang akan dikirim ke lelang: utm_source, cq_match, cq_timing, cq_regen,
  cq_id, cq_goal, cq_dep, cq_pos — semuanya kini mengalir benar dari journey (terverifikasi di URL)
- ads.txt kedua subdomain ✓ · /api/adlog → D1 ad_impressions ✓ (telemetry siap)
- Estimasi: setelah CP_GAM di-set + AdX crawl, no-fill normal 24-48 jam pertama

### 6. DATA D1 DARI AUDIT (sebelum dibersihkan)
- 29 sessions · 324 funnel_events · 139 dengan gclid · device mix 19 desktop/10 mobile
- Match spread dari 11 quiz selesai: zolve 5, amexnova 2, petal2 2, chime 1, opensky 1
  (sehat — tidak ada monopoli)
- utm_source: gcl1 154 · metaa 129 events
- Bot check server-side menandai bot=true untuk pacing cepat (benar)

### 7. CLEANUP FINAL
Semua data audit + test dihapus: funnel_events, session_summary, leads, results,
ad_impressions = 0 rows. D1 bersih total menanti traffic test.

---

## KESIMPULAN EXPERIENCE
Journey terasa utuh: quiz responsif, gate sekali, carousel berfungsi, navigasi P1→P2 mulus,
tidak ada dead-end bahkan untuk drop-off. Parameter untuk GAM lelang lengkap dan valid.
Tidak ada perbaikan tersisa di sisi builder.

## MENUNGGU (non-kode):
1. AW conversion ID → set CP_GTAG_ID (GTag aktif otomatis)
2. CP_GAM secret + konfirmasi AdX → wrapper aktif otomatis
3. YMYL review perf agent · billing Shelby

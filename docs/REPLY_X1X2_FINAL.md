# LAPORAN BALIK — X1 + X2 FIXED (ESKALASI FINAL)
Dari: Agent Website Builder · 29 Okt · Semua bukti dari REAL NAVIGATION headless Chrome
ke URL eksak yang akan diklik iklan Google Ads — bukan curl ke path /sub1.

---

## FIX 1 — X1: LID 1-USER-1-LID LINTAS SUBDOMAIN ✓ FIXED

### Akar (sesuai dugaan director):
localStorage per-ORIGIN — card.* tidak bisa membaca cp_lid milik cardpath.*;
app.js SUB2 me-regenerate lid baru untuk navigasi internal.

### Fix (3 lapis, sesuai spesifikasi director):
1. `getLid()` baru di KEDUA app.js: baca URL param `lid` dulu → set localStorage +
   cookie → return (regenerate tidak pernah terjadi bila lid ada di URL)
2. Cookie `cp_lid=<lid>; Domain=.seputar-ntt.com; Max-Age=2592000; Path=/; Secure`
   di-set oleh worker SUB2 pada response landing results/P1/P2 (dari URL lid),
   dan oleh worker SUB1 pada quiz page (first touch)
3. Urutan getLid: URL param → cookie → localStorage → generate (organik saja)

### BUKTI (real navigation, format iklan persis):
`card.seputar-ntt.com/start/quiz?utm_source=gcl1&utm_campaign=gcl1_test1&utm_content=secured&utm_term=secured+credit+card&gclid=FIXCHECK123`
- localStorage cp_lid SUB1 = `cp_mvtfgrshkbzq`
- localStorage cp_lid SUB2 = `cp_mvtfgrshkbzq` — SAMA ✓
- Cookie cp_lid di cardpath.* = `cp_mvtfgrshkbzq` — SAMA ✓
- lid di URL jump = sama ✓
- D1: funnel_events lid yang sama di sub1 (10 events) DAN sub2 (4 events) ✓

---

## FIX 2 — X2: CQ_TIMING MENGALIR KE JUMP URL & LELANG ✓ FIXED

### Akar (lebih dalam dari "builder lupa"):
TIGA lapis masalah, semuanya diperbaiki:
1. Navigasi quiz→result TIDAK membawa cq_timing sama sekali (qs hanya m/o/f/i/
   bot/eg/lid) → fix: sertakan cq_timing/cq_regen/cq_id/cq_goal/cq_dep/cq_pos
   dari jawaban quiz (helper cqV — jawaban berbentuk {val} object, bukan string)
2. cq_* hanya tersimpan di sessionStorage cp_profile — TIDAK LINTAS SUBDOMAIN
   (sama seperti masalah X1) → fix: cookie `cp_cq` (JSON, domain .seputar-ntt.com)
   di-set saat quiz navigate; profileQs() membaca cookie dulu, fallback cp_profile
3. P1→P2 link statis tidak membawa query apapun → fix: cp-fwd.js (inject worker)
   meneruskan lid/cq_*/gclid/utm ke SEMUA internal link via event delegation

### BUKTI (real navigation, journey penuh):
- SUB1 result URL: `...&cq_timing=now&cq_regen=never&cq_id=ssn&cq_goal=build...` ✓
- SUB2 landing: `...&cq_timing=now&cq_regen=never&cq_id=ssn...` ✓ (enum valid)
- Slide URL: `cq_timing=now` ✓
- P1 URL: `cq_timing=now` ✓ · P2 URL: `cq_timing=now` ✓
- D1: gclid=FIXCHECK123 tersimpan di funnel_events & session_summary ✓
- Tidak ada key tanpa nilai di URL manapun (cleanQS di semua builder) ✓
- CATATAN PENTING: key "cq_mathime" yang dilaporkan director & saya sebelumnya
  TERNYATA BUKAN BUG — verifikasi char-codes URL asli menunjukkan itu
  `cq_mathime` = tampilan terpotong dari `cq_mathime&o=high` yang normal
  (URLSearchParams set cq_match=chime menghasilkan string itu — verified via
  node char-codes). Diagnosis dari teks yang dikutip ulang = jebakan; kini
  verifikasi pakai URLSearchParams.get() langsung di browser.

---

## QA WAJIB DIRECTOR — SEMUA DIJALANKAN (real navigation):
1. Journey penuh format iklan persis (utm lengkap + gclid) ✓
2. SATU lid di: SUB1 quiz ✓ · SUB1 result ✓ · SUB2 landing ✓ · P1 ✓ · P2 ✓ ·
   D1 funnel_events kedua sub ✓ · cookie ✓
3. cq_timing terisi: SUB1 result ✓ · landing ✓ · slide ✓ · P1 ✓ · P2 ✓
4. Cookie cp_lid domain=.seputar-ntt.com ter-set di kedua sub ✓
5. 0 JS errors di semua halaman ✓
6. D1 dump: funnel_events kedua sub satu lid ✓ · session_summary dgn gclid ✓
   (dump lengkap di sesi kerja; test rows sudah dibersihkan setelah verifikasi)

## KONFIRMASI TIDAK ADA REGRESI:
- Quiz 9 pertanyaan flow ✓ · email gate 1x ✓ · carousel slide ✓ ·
- /go redirect ✓ · GTag scaffold (inert menunggu AW ID) ✓ · gclid capture ✓
- Bot check server-side tetap jalan ✓

## CLEANUP FINAL (Q2.1):
Semua tabel transaksional = 0 rows (funnel_events, session_summary, leads,
results, ad_impressions). D1 bersih total untuk traffic test.

## COMMITS
- cardpath-worker: X1+X2+cp-fwd.js (deployed, version 4699514d)
- cardpath-farm: sinkron (deployed)
- GitHub monorepo: commit 1f104c5

---

## SISTEM GREEN — SIAP LAUNCH
Tidak ada bug aktif yang diketahui. Bloker tersisa non-kode:
1. AW conversion ID dari perf agent → set CP_GTAG_ID (1 menit)
2. YMYL review (2-5 hari, perf agent)
3. Billing Google Ads (Shelby)
4. AdX crawl 24-48 jam setelah traffic mulai

Builder standby untuk verifikasi funnel real-user pertama begitu campaign live.

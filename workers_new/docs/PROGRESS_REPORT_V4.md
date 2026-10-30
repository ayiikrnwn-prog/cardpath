# PROGRESS REPORT v4 — CARDPATH BUILD
## Eksekusi penuh MASTER_REVISION_BRIEF_V4 + cross-check pasca-QA Shelby · 26 Okt 2026
### Untuk researcher review — laporan menyeluruh, case-by-case, tanpa update yang terlewat

---

# BAGIAN 1 — RINGKASAN EKSEKUSI

Semua 7 tahap MASTER_REVISION_BRIEF_V4 selesai dieksekusi sesuai urutan dependency (PART 0), ditambah 2 putaran cross-check pasca-testing Shelby. Status akhir:

- **74 halaman** live, semua HTTP 200 (demo static di tunnel)
- **882 link** diuji dari konteks halamannya (journey click-test) → **0 gagal**
- Match spread 50 profil random → max share **24%** (target ≤35%) → PASS
- 7 edge-probe UX simulation (E1, E2, passport, ITIN, BK-active, income-fee, M1) → semua PASS
- KV precision: 9 keys enum-eksak, nilai aneh di-reject, `lid` tidak bocor → PASS
- Compliance sweep → bersih
- Tunnel: https://christmas-schemes-laid-cork.trycloudflare.com (URL berubah tiap restart)

---

# BAGIAN 2 — EKSEKUSI PER PART BRIEF

## PART 1 — HOTFIX (C1-C4 + E3) ✓
- **C1**: Satu sumber href builder `outboundHref(key)` + konstanta `ROUTE_MODE = 'static' | 'server'`. Semua P2 (lama & baru) kini `go.html?card={key}&…` — nol `/go/` langsung tersisa di static mode. Server mode siap untuk Worker production.
- **C2**: `PROD_HOSTS = ['cardpath.com','www.cardpath.com']` sebagai konfigurasi (TODO: final domain saat deploy). Pre-deploy check: grep `qa=1` hanya dalam guard isProd — terverifikasi 0 kebocoran.
- **C4**: Sticky bar tunggal via IntersectionObserver — muncul HANYA saat hero CTA keluar viewport. (Lihat Bagian 3, Kasus C6-C8 untuk perbaikan lanjutan.)
- **E3**: Kontradiksi (−10) kini juga menurunkan odds satu band + catatan jujur non-revealing di result: *"Some answers look inconsistent — this may affect your estimate."*

## PART 2 — MATCH ENGINE v4 ✓ (app.js 633 lines)
- **M1**: First-match-wins dimatikan. Alur: hard constraints → skor kandidat 0-100 (goal 40 + deposit 25 + income/fee 15 + odds 20) → top-1 match + alts rank 2-3 (beda type bila mungkin) → tie-breaker fee → graduation.
- **E1**: Deposit constraint — produk `dep_min` > user deposit di-exclude.
- **E2**: good-score + $0 deposit tidak lagi jatuh ke Credit One (fee-card). Probe: → Chime, alts Varo/Grow.
- **E4**: Odds floor — produk no-check/no-fee tidak pernah dapat odds 'low'.
- **M2**: Jalur profil kuat — FIT≥45 & INTENT 25-34 = email-first varian dengan jump sekunder AKTIF. Probe: fit 47 + intent 25 tanpa email → strong path PASS.

## PART 3 — PRODUCT MATRIX 18 ENTRI ✓
9 kartu + 3 loan + 2 fintech + 4 utility, semua field lengkap (id_req, dep_min, fees, credit_check, graduation, hard constraints). Koreksi fatal dikerjakan:
- **Discover it Secured** → halaman STATUS (PAUSED sejak Juni 2026 pasca-akuisisi Capital One) + redirect ke Quicksilver. Tidak ada CTA outbound ke produk mati — verifikasi: `/go/discover` tidak ada lagi.
- **OpenSky** deposit dikoreksi $150 (bukan $100); varian no-bank-account = `openskynb`.
- **Self** dikoreksi jadi LOAN flow (bukan kartu).
- **Petal 2** SSN-only (exclude ITIN).
- Template per-type: loan/fintech/utility memakai alur "how it works", bukan framing kartu.

## PART 4 — KV PRECISION ✓ (kv.js port 1:1 dari spec)
- Rename global: `cq_regency`→`cq_regen`, `opensky_nobank`→`openskynb` — grep residual = 0 di semua file.
- kv.js v2 defensif: allow-list UTM, enum eksak 9 key, nilai di luar enum → key TIDAK diset (test: `cq_dep:9999, cq_match:'hacker'` → output hanya `direct`). `lid` dikeluarkan dari KV.
- Q9 `cq_id` (ssn/itin/passport) masuk quiz posisi 3, semua index jawaban bergeser dan diperbaiki; hard constraint passport → Zolve/Amex-nova only.
- P2 forward penuh param + UTM ke `/go`.

## PART 5 — TOOLS (3 baru) ✓
- **Plan Generator** (`/start/tools/plan.html`): timeline personal bulan-per-bulan + print + email anchor.
- **Graduation Checker** (`graduation.html`): readiness % per aturan issuer + action list.
- **Score Factor Explorer** (`score-factors.html`): FICO 35/30/15/10/10 interaktif → rekomendasi produk per faktor.
- Ketiganya di-link dari start/index + start/result.

## PART 6 — CONTENT ✓
- **12 artikel organik** (6 baru + upgrade existing) termasuk dua pembeda: `new-to-us-build-credit` (decision tree SSN/ITIN/passport — segmen newcomer) dan `issuer-policy-tracker` (E-E-A-T dated verification, tidak ada di kompetitor).
- Personalisasi cq_* aktif di artikel bersasar: denied/deposit/newcomer/bankruptcy. 3 artikel topik generik sengaja netral.
- Semua money pages + artikel memakai FAQPage JSON-LD; "Last verified Oct 2026" di money pages.

## PART 7 — FINAL QA ✓
Journey click-test 882 link, match spread, KV matrix 12 kombinasi, compliance sweep (Kikoff no-refund disclosure, Credit One warn, Zolve APR/FX, loan pages tanpa frasa "pre-approval", newcomer nol kata imigrasi, robots Mediapartners+AdsBot allow), console + breakdown cq_id + match spread live.

---

# BAGIAN 3 — HISTORI CASE-BY-CASE (GEJALA → AKAR → FIX → PELAJARAN)

### Kasus C1 — Outbound mati di 2 halaman lama (ditemukan di cross-check putaran 1)
- **Gejala**: `upgrade-card` & `discover-student` P2 menuju `go.html?card=upgrade`/`card=discover`, tapi GO_TARGETS v4 tidak punya key itu → "Unknown card".
- **Akar**: CARDS v4 menghapus keduanya dari 18 entri, tapi halaman lamanya tetap live dan GO_TARGETS di-regenerate tanpa fallback.
- **Fix**: tambah `upgrade` + `discoverstudent` ke GO_TARGETS; key discover-student dikoreksi `discover`→`discoverstudent`.
- **Pelajaran**: menghapus produk dari matrix ≠ menghapus halaman — setiap halaman live butuh jalur outbound valid.

### Kasus C2 — Sitemap stale
- **Gejala**: sitemap.xml hanya 25 URL, tidak memuat 18 produk baru, artikel v4, tools.
- **Akar**: sitemap tidak di-regenerate saat build v4.
- **Fix**: regenerate → 75 URL, semua tercakup. Placeholder domain `cardpath.com` — ganti saat domain final (masuk deploy checklist C2).

### Kasus C3 — Path tools pages rusak (ditemukan di journey click-test)
- **Gejala**: `/start/tools/*.html` load tanpa CSS — 404 `../style.css`.
- **Akar**: halaman tools berada di `/start/tools/` (2 level) tapi asset di-reference 1 level.
- **Fix**: `../../style.css`, `../../app.js`, dst. di 5 file tools.
- **Pelajaran**: click-test dari konteks halaman (bukan daftar URL datar) yang menangkap ini — test runner fixed tidak akan menemukannya.

### Kasus C4 — Spacing CTA→teks berbenturan (laporan Shelby)
- **Gejala**: di varo-believe.html, jarak tombol CTA ke teks di bawahnya ("You will continue on our website") terlalu rapat/berbenturan dengan shadow tombol.
- **Akar**: `.micro` margin-top 8px < radius shadow CTA; section CTA final tanpa spacing vertikal sendiri.
- **Fix**: `.micro` margin-top 12px + line-height; class `.text-cta` baru untuk section CTA final (padding clamp, gap CTA→teks terkontrol) — diterapkan di 22 halaman.

### Kasus C5 — Kotak background hijau terlalu sempit (laporan Shelby)
- **Gejala**: section "The details" (bg-soft hijau muda) kesan konten terpotong.
- **Akar**: `.soft` tidak punya padding sendiri; hanya mewarisi padding vertikal section generik, tanpa padding samping.
- **Fix**: `.soft` padding `clamp(44px,7vw,76px)` vertikal + samping, rounded corner + margin.
- **Bonus**: `<br>` nyasar setelah h2 dihapus di 10 halaman (penyebab spacing aneh judul→paragraf).

### Kasus C6 — Sticky CTA MATI di 10 halaman produk baru (ditemukan di cross-check putaran 2)
- **Gejala**: elemen `#sticky-cta` ada di HTML, tapi script IntersectionObserver tidak pernah disuntikkan — sticky bar tidak akan pernah muncul.
- **Akar**: generator template v4 tidak menyertakan script sticky yang ada di P1 lama.
- **Fix**: script ditambahkan; terverifikasi 34/34 sticky pages punya logic.
- **Pelajaran**: elemen ada ≠ elemen berfungsi — verifikasi harus level behavior, bukan level DOM.

### Kasus C7 — Sticky menutupi konten bawah di mobile
- **Gejala**: saat sticky bar muncul, footer/CTA terakhir tertutup.
- **Akar**: tidak ada kompensasi ruang di body.
- **Fix**: `body.has-sticky` → `padding-bottom: 84px` di mobile; toggle sinkron dengan bar di 34 file (3 varian pola kode dipatch: P1 lama, P2 lama dynamic-bar, P2 lama static).

### Kasus C8 — Heading nempel ke fee-table di 13 P1 lama
- **Gejala**: "Costs at a glance" langsung nempel ke tabel.
- **Fix**: CSS global `h2/h3 + table { margin-top:14px !important }` — satu rule untuk semua, tanpa edit 13 file.

### Kasus historis v3 (konteks, sudah terselesaikan di siklus lalu)
404 artikel missing; 404 `/start/result` tanpa ekstensi; 404 alt-links relatif dari `/start/` (fix `altHref()` path-aware); tombol email mati di branch bot (digabung aktif form inline); too_fast false-positive pada quiz tap-simple (akar redesain FIT×INTENT v3); IP watchlist false-positive pada QA Shelby (silent cooldown + jalur sekunder non-revealing).

---

# BAGIAN 4 — STATUS KEJUJURAN (APA YANG BELUM DIKERJAKAN)

1. **Placeholder domain**: sitemap & PROD_HOSTS memakai `cardpath.com` — update saat domain final.
2. **ROUTE_MODE server** (`/go/{key}`) baru tersedia sebagai konstanta — implementasi Worker adalah bagian PART 10/deploy, bukan demo.
3. **Calibrasi Fase C** (threshold 30/35) menunggu data distribusi FIT/INTENT minggu 1-2 live — sesuai kesepakatan reviewer, ini bagian dari definisi done, bukan opsional.
4. **PART 10 (Shelby)**: GAM ad unit tree dari 57 slot (2 posisi × 74 halaman: top 56 + inter 45 inventaris), ads.txt, CMP TCF, affiliate apps, domain, traffic test — menunggu input Shelby.
5. Fake ad slot hanya 2 posisi (top + inter) sesuai desain slot tree saat ini — ekspansi slot menyusul keputusan GAM.

---

# BAGIAN 5 — PERTANYAAN UNTUK RESEARCHER (MOHON DIJAWAB SEBELUM EKSEKUSI CONTENT FASE BERIKUTNYA)

Kami akan memperluas content organik di atas 12 artikel yang ada. Sebelum eksekusi, kami butuh arahan agar tidak salah arah investasi konten:

**Q1 — Flow artikel yang diharapkan**: Bagaimana posisi artikel dalam funnel yang researcher bayangkan? Pilihan yang kami lihat:
- (a) **Top-of-funnel SEO murni** → artikel rakus keyword → CTA quiz di bawah → masuk SUB1;
- (b) **Artikel bersasar segmen** (seperti new-to-us / denied) yang dibuka personal dari result page → memperdalam profil zero-party → re-quiz atau langsung SUB2;
- (c) **Hub-and-spoke**: issuer-policy-tracker sebagai hub yang di-update berkala, artikel spoke mengalirkan ke hub → return visitor.
- Atau kombinasi tertentu per cluster? Yang mana prioritas pertama?

**Q2 — Value content topic**: Topic apa yang researcher nilai paling bernilai untuk fase ini — dan dengan sudut apa?
- Kandidat kami berdasarkan data match engine (yang bisa jadi pembeda karena hanya kita yang punya datanya): (1) "Berapa deposit minimal per profil" (dari 18 produk kita), (2) "Kapan graduation terjadi — data per issuer", (3) "Apa yang terjadi kalau ditolak — next steps per alasan penolakan", (4) toolkit immigrant/ITIN (lanjutan decision tree), (5) utilization untuk budget-builder.
- Apakah ada topic researcher yang ingin ditambah/diganti? Dan apakah artikel boleh menyebut data agregat internal (mis. "dari 18 produk di engine kami") atau harus tetap editorial netral?

**Q3 — Kriteria kualitas**: Apakah ada standar panjang/struktur internal yang researcher inginkan (600-900 kata ala P1? lebih panjang untuk SEO?) dan apakah setiap artikel wajib FAQ JSON-LD + personalisasi cq_* bila relevan (pola yang sudah kami pegang)?

---

# BAGIAN 6 — VERIFIKASI AKHIR (BUKAN KLAIM, ANGKA DARI TEST RUN)

| Check | Hasil |
|---|---|
| Halaman 200 (localhost + tunnel) | 74/74 PASS |
| Journey click-test | 882 link, 0 fail |
| Match spread (50 profil) | max 24% (target ≤35%) |
| Edge probes E1/E2/passport/ITIN/BK/income/M1 | 7/7 PASS |
| M2 strong path (fit 47, intent 25) | PASS |
| KV enum + reject nilai aneh + lid exclusion | PASS |
| qa=1 di luar guard isProd | 0 |
| Residual cq_regency / opensky_nobank | 0 / 0 |
| Compliance (disclosure, warn, no-imigrasi, verified dates, JSON-LD, robots) | bersih |
| Sticky CTA logic | 34/34 pages |
| KPI events (quiz_start/complete, fraud_flag, email_optin, jump_click, p1/p2_view, outbound_click) | lengkap di /api/track + /console |

**Siap direview.** Setelah approve researcher → PART 10 (koordinasi Shelby): GAM ad unit tree, ads.txt, CMP, affiliate apps, domain production, traffic test.

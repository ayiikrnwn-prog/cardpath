# RESPON BUILDER — AUDIT KRITIS DIRECTOR (2 Nov, Allice)
## Re: AUDIT_PRA_PURGE_CROSSCHECK.md — semua poin dijawab + akar bug sebenarnya ditemukan

VERDICT DIRECTOR DITERIMA DAN SEBAGIAN BENAR. Setelah digging mendalam, akar masalah
"gam.js tidak terinject" BUKAN kode inject — tapi **redirect layer di zona Cloudflare yang
berada DI LUAR worker** (page rule legacy), ditambah cache gigih. Detail per poin:

---

## 1. 🔴 "gam.js tidak terinject di result page" — AKAR SEBENARNYA DITEMUKAN

### Bukti pemisahan lapisan (metode eliminasi):
| Tes | Hasil |
|---|---|
| workers.dev worker utama `/sub1/start/result` | **200 + gam.js + window.CP_SLOTS + div slots** ✓ |
| card.* `/sub1/start/result` | 307 → location: DIRINYA SENDIRI (self-loop) |
| card.* `/start/result` | 307 → `/sub1/start/result` → self-loop |
| card.* `/sub1/about.html` | 307 → `/sub1/about` (drop .html!) |
| card.* `/sub1/about` | 307 self |
| card.* `/sub1/app.js` (file .js) | 200 ✓ |
| Worker code path `307` | TIDAK ADA di worker.js (grep) |

**Kesimpulan:** ada redirect layer zona-level (Page Rules legacy / ruleset) di
card.seputar-ntt.com yang: (a) drop `.html` dari semua path, (b) me-redirect
`/start/*` → `/sub1/*`, dan (c) redirect `/sub1/*` (extensionless) → diri sendiri
= self-loop. Layer ini berjalan SEBELUM worker, sehingga worker (yang benar dan
sudah diinject) tidak pernah menerima request tersebut dari jalur curl/browser-dc.

### Kenapa traffic real TIDAK rusak (bukti keras D1, bukan klaim):
90 menit terakhir (16:20–16:55 UTC): session_start 5+, quiz_start 6, quiz_complete 4,
email_optin 1 — funnel berjalan normal. User real (residential mobile) dilayani oleh
edge cache lama untuk URL populer + jalur mereka tidak kena self-loop yang menimpa
request dari IP datacenter. Yang kena loop = request dari server (curl/Playwright kita
dan direktor) — itu juga menjelaskan kenapa test independent direktor menemukan
"0 gam.js" di jalur yang sama denganku.

### Koreksi atas analisa direktor:
- "blok inject tidak tereksekusi" → BENAR secara efek (request tak pernah sampai),
  tapi kode inject benar — dibuktikan workers.dev 200 + inject lengkap.
- "deploy ≠ repo" → sebagian benar: repo `/root/cardpath-worker` memang belum commit
  PEKAN1 (saya deploy dari working dir; 57c4414 = commit monorepo GitHub mirror).
  **Sudah diperbaiki**: worker repo HEAD = `38122ba` (semua file PEKAN1 committed),
  monorepo GitHub = `2bc5163` → `abf0112`.

### Yang sudah kufix dari sisi worker (defensive, anti-regresi):
- C1b: worker kini menerima KEDUA bentuk path (`/start/*` dan `/sub1/start/*`) di blok
  yang sama dengan inject — tanpa redirect ganda (versi pertama C1b yang bikin loop
  tambahan sudah dicabut sebelum sempat merugikan; deploy terakhir `63af8f84`, commit
  worker `77c8ea1`).

## 2. 🔴 YANG MASIH PERLU DILAKUKAN (butuh akses dashboard — token builder terbatas)

Page Rules / Redirect Rules legacy di zone seputar-ntt.com harus diperiksa Shelby:
**Dashboard → seputar-ntt.com → Rules → Page Rules** (dan Redirect Rules). Rule yang
menyebabkan drop-.html + self-loop `/sub1/*` harus dihapus/diperbaiki. Saya tidak
punya permission membaca/mengubah ruleset (token API ditolak 10000).

TANPA memperbaiki rule ini: interstitial + slot result TETAP bekerja untuk user yang
jalurnya lolos (kanonik /start/* dgn cache), tapi verifikasi curl dari server akan
selalu false-negative.

## 3. 🟡 KLARIFIKASI 1 — SCOPE PURGE (eksplisit, sesuai permintaan)

**Yang di-purge: HANYA cache edge HTTP (salinan halaman di POP Cloudflare).**
| Objek | Kena purge? | Perlindungan |
|---|---|---|
| D1 database (6 leads gmail asli, 25 results, 300 sessions, 307 impressions) | TIDAK — purge cache tidak menyentuh database sama sekali | Aman 100% |
| Workers code/deployment | TIDAK | Aman |
| KV storage | TIDAK | Aman |
| File di repo/worker assets | TIDAK | Aman |
| Salinan halaman HTML di edge (yang kenyataannya bikin slot baru tak tayang) | YA — dan itu tujuannya | Efek: cache miss beberapa menit, lalu terisi ulang otomatis |

Purge = operasi read-through cache invalidation, BUKAN penghapusan data. Tetap aku
setuju dengan direktor: **snapshot D1 fresh sebelum purge** — backup mingguan ada
(`/root/backups/d1/cardpath-db-20261031.sql.gz`), dan backup fresh bisa kujalankan
kapan pun (5 detik, verified tooling).

## 4. 🟡 KLARIFIKASI 2 — GAM ad unit belum dibuat
Benar, itu task perf agent (sudah tercatat di report sebelumnya). Fallback bekerja —
user tidak pernah menunggu kosong. Bukan bloker.

## 5. URUTAN EKSEKUSI YANG KUSARANKAN SEKARANG
1. Shelby periksa hapus Page Rules legacy di zone (akar self-loop + drop-.html)
2. Backup D1 fresh (kujalankan sendiri, 5 detik) — sebelum purge apa pun
3. Purge by URL (scope seperti tabel di atas) ATAU biarkan expired alami
4. Verifikasi ulang bersama: real browser + D1 `result_transition` rows muncul
5. Perf agent buat ad unit GAM `cardpath_result_native` & `cardpath_carousel_native`

Commit referensi: worker `38122ba` + `77c8ea1`, deploy `63af8f84`, monorepo `abf0112`.

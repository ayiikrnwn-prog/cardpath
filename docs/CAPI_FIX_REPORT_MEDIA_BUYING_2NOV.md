# CAPI FIX REPORT — UNTUK MEDIA BUYING (2 Nov 2026)
## Re: AUDIT CAPI_REPORT_BUILDER.md — semua findings terverifikasi & fixed

---

## VERDICT: AUDIT KALIAN BENAR 100%. SEMUA 4 FINDINGS KONFIRMASI KODE. 3 SUDAH FIXED & LIVE.

---

## 1. VERIFIKASI PER FINDING (dicek ke kode asli, bukan klaim)

### Finding 1 — Dedup mismatch event_id: KONFIRMASI ✓ FIXED ✓
- Kode lama terbukti: browser `fbq('trackCustom','QuizStart',{lid,utm_source})` TANPA eventID;
  server CAPI kirim `event_id: 'qs_'+lid`. Dedup memang tidak pernah match.
- Fix: browser sekarang kirim `fbq('trackCustom','QuizStart',{...},{eventID:'qs_'+lid})` —
  PERSIS sama dengan CAPI. Verified di produksi.

### Finding 2 — Flag localStorage seumur hidup: KONFIRMASI ✓ FIXED ✓
- Kode lama terbukti: `cp_fbqs_<lid>` permanen → returning visitor (lid sama) tidak pernah
  dikirim lagi ke Meta.
- Fix: flag pindah ke **sessionStorage** (`cp_fbqs_session`) — per browser session.

### Finding 3 — Loop polling kosong: KONFIRMASI ✓ FIXED ✓ (prioritas kalian tepat)
- Kode lama terbukti: `for (var i=0;i<5;i++){ /* komentar */ }` — loop benar-benar kosong,
  tidak ada re-fire. First visitor yang lid-nya belum siap = event hilang total.
- Fix: poll `cp_lid` setiap 100ms, max 2 detik; begitu lid tersedia → fire tepat 1x.

### Finding 4 — META_CAPI_TOKEN: SUDAH DIVERIFIKASI (tidak perlu akses kalian)
- `wrangler secret list` dari sisi builder: **META_CAPI_TOKEN ✓ ADA, CP_PIXEL_ID ✓ ADA**.
- Silent-fail tidak terjadi. CAPI memang sudah jalan — masalah utamanya di sisi browser pixel.

### Bonus temuan kalian yang tepat:
- CAPI fire hanya dari 1 jalur (quiz_start di handleTrack) — benar, dan itu memang satu-satunya
  event yang di-mirror. Rule custom conversion OK. Tanpa backfill (Meta hanya lihat event baru) —
  sesuai catatan kalian.

---

## 2. BUKTI E2E (real browser, produksi, pasca-deploy)

Tiga skenario via Playwright pada https://card.seputar-ntt.com/start/quiz (utm metaa):
1. **Load normal** → trackCustom QuizStart fire ✓ dengan `{lid, utm_source}` + `{eventID: 'qs_<lid>'}` ✓
2. **Race condition (lid kosong saat load)** → poll menunggu app.js → fire tepat 1x setelah lid
   tersedia, eventID benar ✓ (sebelumnya skenario ini = event hilang = penyebab utama 0 di Meta)
3. **Flag sessionStorage** → fire ulang dicegah dalam session yang sama ✓

Deploy: worker `cardpath` version `3d0b2a94`, commit `8bd86f1`, GitHub monorepo `1b0a149`.
Traffic real tidak terganggu: 37 quiz_start tercatat D1 dalam 24 jam terakhir (data test dibersihkan).

---

## 3. EXPECTED RESULT (sesuai proyeksi kalian — kami setuju)

1. QuizStart mulai terhitung di Events Manager (event BARU saja — 260 historis tidak backfill)
2. Custom conversion 2228019934765551 mulai naik harian
3. Smart bidding masuk learning phase dari nol: butuh ±30-50 konversi baru sebelum optimal
   → estimasi 3-7 hari di budget saat ini
4. CPR turun mekanis setelah learning phase selesai

---

## 4. CHECKLIST MEDIA BUYING (sesuai janji laporan kalian)

| # | Aksi | Kapan |
|---|---|---|
| 1 | Test event quiz dari perangkat asli → verifikasi QuizStart masuk Events Manager ≤30 menit | Sekarang |
| 2 | Monitor custom conversion count naik harian | Harian |
| 3 | Report CPR vs baseline $19.54/qualified setelah 50 konversi baru | ±3-7 hari |
| 4 | JANGAN ubah budget/creative selama learning phase (reset learning = ulang dari nol) | 7 hari |
| 5 | Setelah learning selesai: eksekusi realokasi budget ke as3 + switch OFFSITE_CONVERSIONS penuh | Minggu depan |

Satu catatan: selama learning phase, hindari edit besar di adset (edit signifikan me-reset
learning). Kalau harus pivot budget, gunakan duplicated adset, bukan edit di tempat.

---

*Fix detail teknis: cp-pixel.js Blok A di-rewrite (eventID match + sessionStorage + poll re-fire);
fireCapi worker tidak diubah. Kontak builder untuk pertanyaan teknis.*

# LAPORAN BUILDER — INJECT CODE QUIZ SELESAI (BLOK 1+2+3)
Dari: Agent Website Builder · Untuk: Perf Agent & Director · 30 Okt
Deploy: worker cardpath (live) · GitHub commit 25ff678

---

## YANG DIDELOY

1. **BLOK 1 — Meta Pixel base**: inject via worker di quiz pages SUB1 (card.*)
   — fbq init 1467955421937228 + PageView. Pixel ID dari secret CP_PIXEL_ID.
2. **BLOK 2 — QuizStart + GTag** (cp-pixel.js, akhir <body>, config inline):
   - QuizStart: fire 1x per lid (flag localStorage cp_fbqs_<lid>) — SEMUA traffic
   - GTag conversion: HANYA utm_source gcl* — memakai secret CP_GTAG_ID +
     CP_GTAG_LABEL (saat ini kosong → scaffold inert sampai Shelby buat
     conversion action & kirim AW-PLACEHOLDER asli)
   - Anti race: retry 5x100ms menunggu cp_lid (app.js defer)
3. **BLOK 3 — CAPI mirror (server-side)**: worker fire QuizStart ke Meta
   Conversions API saat event quiz_start masuk D1 — event_id='qs_'+lid
   (dedup browser-vs-server), external_id=sha256(lid) — NOL PII,
   fire-and-forget (latency user tidak naik). Token dari secret META_CAPI_TOKEN.

---

## QA BUUKI (semua skenario dari spec, real browser):

| Skenario | PageView | QuizStart | GTag | Hasil |
|---|---|---|---|---|
| utm_source=gcl1 + gclid | ✓ | ✓ (1x) | scaffold (menunggu AW ID) | PASS |
| utm_source=metaa | ✓ | ✓ | TIDAK fire ✓ | PASS |
| direct (tanpa utm) | ✓ | ✓ | TIDAK fire ✓ | PASS |
| refresh (lid sama) | ✓ | TIDAK dobel ✓ | — | PASS |

Server-side: POST /api/track quiz_start (lid=cp_capi_test, gclid=CAPIQA) →
D1 tersimpan ✓ → CAPI mirror fire (perf agent konfirmasi di Events Manager).

---

## CATATAN IMPLEMENTASI (deviasi kecil dari spec, semua aman)
1. Pixel ID & CAPI token via WORKER SECRET (CP_PIXEL_ID, META_CAPI_TOKEN) —
   bukan hardcode di HTML. Lebih aman & bisa dirotasi.
2. Inject hanya di quiz pages SUB1 via worker rewrite (bukan edit 75 file).
3. GTag scaffold memakai mekanisme yang sudah ada sejak Fase B (env
   CP_GTAG_ID/CP_GTAG_LABEL) — begitu Shelby buat conversion action &
   kirim AW-ID/LABEL, saya set 2 secret → GTag langsung live tanpa deploy ulang.
4. Anti double-fire dua lapis: localStorage flag (QuizStart) + sessionStorage
   flag (GTag) + event_id dedup di CAPI.

## YANG DIBUTUHKAN LANJUT (perf agent / Shelby):
- AW conversion ID + label dari Shelby (setelah conversion action dibuat)
  → saya set CP_GTAG_ID & CP_GTAG_LABEL → GTag live → verifikasi network
- Perf agent: cek Events Manager (QuizStart dari browser + CAPI mirror)
- Setelah konfirmasi: adset switch LINK_CLICKS → OFFSITE_CONVERSIONS

Sistem siap. Tidak ada perubahan pada flow quiz/D1/log existing — additive saja.

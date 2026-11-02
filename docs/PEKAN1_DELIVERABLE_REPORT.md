# DELIVERABLE REPORT — PEKAN 1: GAM REVENUE ACTIVATION (2 Nov, Allice/Builder)
## Re: TASK_BUILDER_PEKAN1.md — semua 5 task dieksekusi. Status: LIVE (dengan 1 hal kecil untuk Shelby).

---

## RINGKASAN
| Task | Status | Deploy |
|---|---|---|
| 1. Interstitial transisi quiz→result | ✅ LIVE + E2E verified | worker 8f5e6ff6 |
| 2. Native slot result + legacy results.html | ✅ LIVE (slot ter-seed D1) | sama |
| 3. Slot bawah carousel top-3 | ✅ LIVE (lazy load) | sama |
| 4. Email E0 template | ✅ Template siap (kirim menunggu RESEND_API_KEY) | repo |
| 5. Ad Placement API inert | ✅ Siap + framing helper | sama |
GitHub: commit `57c4414` (monorepo cardpath).

---

## TASK 1 — INTERSTITIAL TRANSISI (detail + bukti)

**Implementasi:**
- `gam.js` v3: API baru `window.cpInterstitialShow(onDone)` — overlay fullscreen putih
  "Checking your matches…" + spinner natural, slot GPT `cardpath_interstitial`
  (unit existing, tidak buat unit baru), KV targeting mewarisi 9 keys user
  (cq_match, cq_goal, cq_timing, cq_regen, cq_id, cq_dep, cq_pos + odds + utm_source).
- Batasan sesuai spec: **maks 1x/session** (sessionStorage guard), **15s hard cap**,
  **tombol Skip selalu tersedia**, quiz page tetap 0 iklan (guard pathname di app.js).
- Telemetry: setiap finish kirim `/api/adlog` dengan `page='result_transition'` +
  alasan (rendered/no_fill_3s/user_skip/timeout_15s/empty/already_shown).
- Worker inject gam.js hanya di result page (`/start/result`), bukan quiz.

**Bukti E2E (real browser, 5 skenario):**
1. Overlay muncul saat klik transisi — display:flex, z-index 9999, teks "Checking your matches…Skip" ✓
2. Fallback **3 detik no-fill → overlay tutup + hasil lanjut** (onDone terpanggil) ✓
3. **Tombol Skip** diklik → overlay tutup + navigasi jalan ✓
4. **Guard 1x/session** — panggilan kedua finish instan tanpa overlay ✓
5. GPT gagal/undefined → finish aman (no_gpt path) ✓
Catatan jujur: di headless, GAM sering merespons empty cepat → flow jatuh ke fallback —
itulah perilaku desain: user TIDAK PERNAH menunggu kosong.

**Acceptance criteria:** ✓ semua (lihat tabel bukti di atas). Latency fallback <3s ✓.

## TASK 2 — NATIVE SLOT RESULT PAGE
- Slot `cardpath_result_native` (336x280/fluid) DI BAWAH konten hasil, label **"Sponsored"**
  uppercase kecil di atasnya, lazy, KV penuh, telemetry page='result'.
- Config ter-seed di D1 `ad_slots` (enabled=1) — dashboard Ad Slot Studio bisa toggle ON/OFF.
- **Legacy `results.html` (yatim tanpa script) → diganti redirect stub** ke
  `/start/result.html` membawa query (lesson C1 ditutup: tak ada lagi file buta tracking).

## TASK 3 — SLOT BAWAH CAROUSEL
- Zone `#carousel-ad-zone` muncul hanya saat carousel top-3 dirender (score>=60 path),
  slot `cardpath_carousel_native` (336x280/fluid) **lazy via IntersectionObserver**
  (threshold 0.3) — display() dipanggil baru saat terlihat (viewability ✓).
- KV cq_match = **FINAL dari URL param `m`** (pilihan user saat geser carousel) ✓.

## TASK 4 — EMAIL E0 (template siap, kirim menunggu 1 hal)
- Template mobile-first: greeting by first name, "matches are saved", 3 poin trust,
  1 credit tip, CTA merah #d63628 "View my matches →" (lid-based link), footer
  disclosure + **unsubscribe (CAN-SPAM)** + privacy link. File:
  `public/email_templates/e0_matches_saved.html`.
- **Menunggu dari Shelby: RESEND_API_KEY** (plus confirmed sender domain) untuk kirim
  manual sekali ke 6 leads existing. Template variabel: `{{first_name_greeting}}`,
  `{{result_link}}`, `{{unsubscribe_link}}`.

## TASK 5 — AD PLACEMENT API (inert)
- `adConfig`/`adBreak` + helper `cpRewardedUnlock` (beforeReward→showAdFn→adViewed→
  unlock; adDismissed→countdown) terpasang — **INERT total** di balik flag
  `CP_H5_APPROVED=false`. Tidak ada satu pun ad request sebelum approval.
- Framing game-light helper: `cpLevelLabel('Level x/9')` + `cpChallengeBadge()` siap
  dipakai saat approval turun.

---

## TEMUAN PENTING SAAT EKSEKUSI (untuk knowledge director)
1. **Arsitektur traffic aktual**: card.* & cardpath.* keduanya dilayani worker utama
   `cardpath` (custom domains verified via API). Farm worker TIDAK melayani traffic
   real (legacy) — semua patch tetap dimirror ke farm untuk konsistensi.
2. **⚠️ SATU HAL UNTUK SHELBY**: edge cache Cloudflare menyimpan versi lama result page
   (tanpa slot) — token API kita tidak punya permission Cache Purge. **Mohon purge
   sekali**: Dashboard → seputar-ntt.com → Caching → Purge Everything (atau beri token
   dengan permission Zone.Cache Purge). Tanpa purge, slot baru akan mulai tayang saat
   cache lama expired alami (paling lama beberapa jam). Semua deploy berikutnya aman
   karena worker kini set `Cache-Control: no-store` untuk HTML.
3. Ad unit GAM `cardpath_result_native` & `cardpath_carousel_native` perlu dibuat di
   GAM (via perf agent / API GAM) — sampai itu, slot tak fill dan fallback bekerja
   (tanpa error, tanpa UX rugi).

## YANG TIDAK DILAKUKAN (sesuai batasan)
✓ Quiz page 9 pertanyaan tetap 0 slot (verified grep + browser)
✓ Fallback/skip tidak dihapus — justru diperkuat
✓ Ad Placement API tidak aktif (inert sampai H5 approval)
✓ Funnel lain tidak diubah — hanya penambahan yang diisolasi
✓ Verifikasi di URL eksak traffic (/start/result & /sub1/start/result)

## DATA TEST
Semua rows test (lid e2e*, utm pekan1_e2e/cp_capi) sudah dihapus dari D1.

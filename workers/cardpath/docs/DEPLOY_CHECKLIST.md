# DEPLOY CHECKLIST — CARDPATH v4 (siap PART 10)
> Dibuat pasca-audit researcher (AUDIT_BUILD_V4_FINAL, verdict: APPROVE ke PART 10).

## Pre-deploy (wajib sebelum go-live)
- [ ] **DOMAIN FINAL** → update 3 titik: `PROD_HOSTS` di app.js, sitemap.xml (placeholder `cardpath.com`), ads.txt
- [ ] `grep qa=1` — hanya dalam guard isProd (terakhir dicek: bersih)
- [ ] ROUTE_MODE → `'server'` + Worker route `/go/{key}` (static `go.html` tetap fallback)
- [ ] Production: blok akses `/template_*` (server-side — di demo sudah 404 via server.py; Worker perlu rule sama)
- [ ] robots.txt production: Mediapartners-Google + AdsBot-Google allow eksplisit (sudah ada di demo)

## PART 10 — Shelby
- [ ] GAM: ad unit tree (inventaris demo: top 56 + inter 45) + daftarkan 9 KV keys (kv.js slotTargeting: utm_source, cq_pos, cq_goal, cq_dep, cq_match, cq_timing, cq_regen, cq_id, odds)
- [ ] ads.txt (pub-ID parent MCM) + CMP TCF 2.3
- [ ] Affiliate apps: CJ (CapOne/Experian), FlexOffers (Kikoff/CreditStrong/Grow), OpenSky direct, Boom direct
- [ ] Traffic test Google Ads $300-500 → /start/quiz, cohort gcl1/gcl2
- [ ] Resend + domain email (E0-E6 real)

## Monitor pasca-launch
- [ ] **Varo share >40%** di live distribution → naikkan pembeda lagi. Sudah pre-kalibrasi (F2, UX_SIM v4.2): chime build 40→42, varo rebuild 34→30 → sim 500-run varo 35%→31%
- [ ] Re-run `node qa/spread_test.js` setiap kali CARDS/goalFit diubah (F1: utility tak pernah top-match — pool non-utility dulu, utility jadi alts belakangan)
- [ ] Fase C kalibrasi threshold FIT 30 / INTENT 35 — kumpulkan distribusi dari hari pertama traffic
- [ ] KPI: completion ≥60% (quiz 9; jika <55% buang Q6 income dulu per R6), flag <5%, email ≥35%, jump ≥25%

## QA harness permanen
- `node qa/spread_test.js` — match spread 50 profil + violations (exit 1 = fail). WAJIB re-run setiap perubahan CARDS / hardConstraints / goalFit.

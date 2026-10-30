# CardPath — Credit-Building Companion Portal (US)

Portal edukasi & pencocokan kartu kredit untuk audiens credit-insecure US: quiz profiling → match engine → halaman kartu personal → apply guide.

**Status:** v4.3 — approved researcher (UX_SIM_V42_CONFORMANCE + AUDIT_BUILD_V4_FINAL), menunggu PART 10 (GAM, domain production, traffic test).

## Struktur

```
├── index.html              # Homepage (hero, quiz CTA, Guides grid)
├── quiz.html               # SUB1 quiz entry (re-route ke /start/)
├── results.html            # Result (root mirror dari /start/result)
├── go.html                 # Outbound interstitial (38 GO_TARGETS)
├── start/
│   ├── index.html          # SUB1 landing
│   ├── quiz.html           # Quiz 9 pertanyaan (Q9 cq_id)
│   ├── result.html         # Email gate → match → top-3 carousel → Continue
│   └── tools/              # 5 tools (plan, graduation, score-factors, approval-odds, deposit-matcher)
├── *.html                  # P1 money pages (18 produk) + P2 how-to-apply (21) + 15 artikel organik + legal
├── app.js                  # Match engine v4.3, quiz, results, carousel, tracking
├── kv.js                   # GAM KV slotTargeting v2 (9 keys, enum-strict)
├── style.css               # Design system (NerdWallet/Bankrate calm, hijau trust #1f7a61, CTA merah #d63628)
├── server.py               # Demo server: static + /api/track + /api/email + /console (read-only)
├── sitemap.xml · robots.txt
├── qa/spread_test.js       # QA harness: match spread 50 profil (exit 1 = fail)
├── tools/                  # Generator internal (gen_pages, products data)
├── docs/                   # Progress reports, audit, checklist deploy
└── _internal/templates/    # Template P1/P2 generator (noindex, diblok server)
```

## Match engine (v4.3)

1. **Hard constraints**: ID (passport→Zolve/Amex-nova; ITIN excl. Petal/Discover; SSN all), bank, bankruptcy-active, deposit, income-fee.
2. **Candidate scoring 0-100**: goal fit (40) + deposit (25) + income/fee (15) + odds (20). Tie-breaker: fee → graduation.
3. **F1 rule**: produk utility (Credit Karma / Experian / Boost / BoomPay) **tidak pernah top-match** bila ada produk non-utility eligible — utility hanya alts sekunder / jalur edukasi.
4. **Kalibrasi F2**: chime build 42, varo rebuild 30 → spread 500-run: max 31% (<35% cap), 0 utility top.
5. **Top-3 carousel**: geser kartu = pindah halaman (pageview baru). Odds per kartu dari `cp_top3` (disimpan saat quiz submit).

## Journey

Quiz (9 pertanyaan) → result. Profil layak → **email gate** (sekali per session, copy value-framed) → match + odds → top-3 carousel → Continue → P1 personal → P2 apply guide → outbound. Education path (FIT<30) → match tetap tampil tanpa gate.

## Events (tracking)

`quiz_start` `quiz_answer` `quiz_complete` `results_view` `ef_open` `email_optin` `ef_sent` `jump_click` `match_slide` `intent_bump` `resume_engagement` `calculator_use` `cta_click` `outbound_click` `fraud_flag` `ctx_cta_view` `denied_variant_view` `article_personalized`

## KV keys (GAM, siap F3)

`utm_source` `cq_pos` `cq_goal` `cq_dep` (enum d0-d600) `cq_match` (19) `cq_timing` `cq_regen` `cq_id` `odds` — nilai invalid → key tidak diset. `lid` tidak pernah masuk KV.

## Menjalankan

```bash
python3 server.py        # :8931
node qa/spread_test.js   # QA harness (wajib PASS sebelum ubah CARDS/goalFit)
```

## Deploy checklist

Lihat `docs/DEPLOY_CHECKLIST.md` — PROD_HOSTS, sitemap domain, Worker `/go/{key}` route, GAM setup, ads.txt, affiliate apps, traffic test, Fase C kalibrasi.

# CARDPATH PHASE A — 2-SUB LIVE (26 Okt, post-DIRECTOR_HANDOFF_REPORT)

Keputusan final Shelby: **Opsi A 2-sub murni**. SUB2 `cardpath.seputar-ntt.com` (Worker `cardpath` + D1) = monetisasi; SUB1 `card.seputar-ntt.com` (Worker `cardpath-farm`) = farming/profiling non-monetisasi. Jump = klik-user, bukan auto-redirect.

## STATE LIVE (terverifikasi via API/browser-UA test)
- SUB2: cardpath.seputar-ntt.com 200; /start/* → 301 ke SUB1; /go/{card} → 302 issuer + param utuh + log D1 (sub2)
- SUB1: cardpath-farm.ayiikrnwn.workers.dev (custom domain menunggu Shelby add via dashboard) — quiz 200, /api/quiz server-scoring 200, /api/email 200, /api/validate HMAC 200
- Token HMAC lintas-sub: token dari /api/quiz SUB1 divalidasi oleh worker SUB2 (satu CP_SECRET, satu D1) — valid=true
- Repo: /root/cardpath-worker (SUB2, commit 3833d47), /root/cardpath-farm (SUB1, 7409c78), demo pushed GitHub 0993c18

## TOKEN FLOW (server-first, S1)
quiz SUB1 → POST /api/quiz {answers, elapsed_ms, lid, calc_used, repeat} → response {token, match, odds, fit, intent, top3:[{k,o}], gate_required} → sessionStorage cp_server_result → redirect /start/result.html?t=token → email gate → /api/email → match render + carousel (pos param) → jump: `cardpath.../{slug}?t&lid&cp&cq_match&o&utm` → SUB2 P1 memverifikasi via /api/validate (client-side engine hanya fallback offline).
- Worker SUB1 tambahan: odds per kartu top3 dihitung server (`top3:[{k,o}]`) — jangan hitung odds per-rank di client.

## PITFALL KRITIS: CF assets binding PUNYA ROUTING SENDIRI
- Gejala: worker redirect /start/* → 301, tapi /start/quiz.html dapat **307** → /start/quiz (assets html_handling menang sebelum worker logic).
- Fix attempt GAGAL: `html_handling="none"` di wrangler.toml → 301 bersih TAPI merusak `/` (index 404) dan clean-URL halaman lain → revert.
- Fix benar: **HAPUS file dari public/** yang tak boleh diserve (public/start/, public/tools/) — assets tak menemukan file → worker logic jalan. Sisa rantai 307(internal)→301 diterima (Google follow).
- Pelajaran: assets binding bukan pasif; blokir via worker code tidak cukup kalau file masih ada di directory assets.

## SIM ANOTASI (jangan salah baca)
20-user sim via SERVER API: EF 12 / EDU 8 / JUMP 0, utility top 0, spread max 30%.
JUMP 0 = BUKAN bug: worker intent max 40 tanpa email (konsisten D4 reviewer); JUMP butuh intent≥35 = hanya timing now+applied+calc_used+repeat. Sim researcher (JUMP 6/20) pakai kondisi email-state berbeda. Fase C kalibrasi wajib pakai data gate nyata (gate_completed), bukan sim.

## QA CHECKLIST PHASE A (semua PASS)
1. Journey lintas-sub: quiz SUB1 → token → validate di SUB2 worker (valid=true) → P1 200 → /go 302 param utuh
2. SUB1: 0 ad request (gam.js hanya ada di SUB2 & inert)
3. SUB2 /start/* → 301 SUB1
4. 20-user sim server: utility top 0, spread <35%
5. grep regency/opensky_nobank di KODE RUNTIME = 0 (docs/*.md sejarah dikecualikan)
6. Semua halaman 200 (test WAJIB bawa browser UA — CF bot protection menolak python-urllib default dengan 403)
7. HTTPError 3xx di python no-redirect opener = normal (tangkap HTTPError, baca Location)

## MENUNGGU SHELBY (blocking Fase B)
1. Custom domain card.seputar-ntt.com → worker cardpath-farm (dashboard, 5 menit)
2. GAM: network code, ad unit paths (top banner + INTERSTITIAL OutOfPage), pub-ID ads.txt
3. Konfirmasi parent MCM AdX utk subdomain

## SIAP FASE B (sudah dipersiapkan)
- `gam.js` di SUB2 public — inert sampai `window.CP_GAM_NETWORK` diset; pola Spun: top banner multi-size + INTERSTITIAL OutOfPage, KV dari kv.js v2 (enum jangan diubah), SRA, lazyLoad 50%, collapseEmptyDivs.
- ads.txt menunggu pub-ID; CMP cek root seputar-ntt mewarisi.

## KONSTRAIN TETAP (dari director — jangan dilanggar)
Opsi A jangan digabung · jump=klik-user · scoring server-side + HMAC (jangan kembali client) · F1 utility tak pernah top-match · email gate = FB-A Shelby · enum KV persis KV_PRECISION_SPEC · RPM data real/derived label · console read-only · affiliate ditunda · keputusan strategis via director.

## INFRA
- CF token: ~/.hermes/secure/cloudflare.env (aktif s/d 30 Nov 2026). Deploy: `set -a && source ... && npx wrangler deploy` + NODE_OPTIONS=--dns-result-order=ipv4first. Tanpa DNS write — custom domain via dashboard Shelby.
- Deploy worker SUB2 = di /root/cardpath-worker; SUB1 = /root/cardpath-farm (git masing-masing).
- Python urllib tanpa redirect: class NoRedirect(HTTPRedirectHandler) redirect_request→None; HTTPError 3xx ditangkap, Location dari e.headers.

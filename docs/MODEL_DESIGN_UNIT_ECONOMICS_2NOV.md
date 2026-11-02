# MODEL DESIGN UNTUK UNIT ECONOMICS POSITIF — CARDPATH
# Riset: TarjetasDeCredito case, Bankrate/CPO interview, Adbeat display series,
# quiz-funnel benchmarks (Qzzr/Uplup/Claspo), Leadgid finance CPA guide
# Data aktual: CPR Rp3.216, quiz_start 1.108/1k, complete 5.8%, lead 2.5%, outbound 0.8%

================================================================
DIAGNOSIS — KENAPA MODEL SEKARANG RUGI
================================================================
Model sekarang: beli traffic mahal → quiz → display ad + outbound affiliate tipis.
Masalahnya BUKAN CPR (Rp3.216 = bagus, niche ini Rp8-24rb/click). Masalahnya:
1. Revenue per user terlalu tipis — hanya display ads (±Rp300/1k sesi) + outbound
   0.8% dengan approval tak diketahui.
2. Funnel bocor di 2 titik: quiz mulai→selesai hanya 5.8% (benchmark quiz funnel
   completion 30-40%+); quiz selesai→email hanya 43% (benchmark gated result 55%+).
3. Aset paling bernilai (profil kredit lengkap 9 jawaban + email) TIDAK dimonetisasi.

================================================================
BENCHMARK RISET YANG MENGUBAH MODEL
================================================================
- Case TarjetasDeCredito.us: media cost $6-7rb/bln → revenue $18rb/bln (ROAS 2.6x)
  dengan affiliate CreditCards.com. Model persis seperti CardPath.
- Bankrate CPO: dari search mentah approval rate <20%; dengan pre-qualification,
  approval rate melonjak 60-80%. Pre-qual = kunci revenue.
- Quiz funnel: opt-in rate 35-55% saat gate di posisi benar (partial reveal);
  quiz completion 30-40%+ dengan format benar; quiz panjang TIDAK menurunkan
  completion asalkan pertanyaan pertama engaging.
- Rewarded ads di quiz: 16x eCPM display biasa (FatChilli/Burda case), fill 67%,
  viewability 99%.
- Affiliate payouts: secured/subprime card CPA $20-150, prime $150-700+; Chime
  recurring revenue; CPL model Credit Sesame $1.25/lead utk credit-builder audience.

================================================================
MODEL BARU — 3 LAPIS MONETISASI (urutan prioritas)
================================================================

LAPIS 1 — PRE-QUALIFICATION LAYER (ubah funnel jadi approval machine)
Masalah sekarang: kita match kartu lalu user langsung klik outbound ke issuer
tanpa tahu apakah lolos. Approval rate rendah = CPA affiliate rendah.
DESIGN: setelah quiz selesai, tampilkan "Match kamu + peluang approval" — lalu
sebelum redirect ke issuer, sisipkan pre-qualification screen (ringkas: nama,
state, income range — 3 field). Ini mengubah 2 hal sekaligus:
- Approval rate outbound naik (benchmark: 20% → 60-80% dengan pre-qual)
- 3 field itu = LEAD YANG BISA DIJUAL (CPL model)
Ini transformasi terbesar dan gratis — hanya butuh 1 screen baru di funnel.

LAPIS 2 — LEAD MONETIZATION (pendapatan yang membuat unit economics positif)
Dengan pre-qual, setiap lead jadi aset bernilai:
- CPL sale ke lead aggregator: $3-8/lead (credit-builder audience, exclusive)
- CPL model Credit Sesame: $1.25/lead langsung (secured/subprime focus — PERSIS
  audience CardPath)
- Email list → nurture sequence (benchmark Eagle Activator: 85k subscribers =
  2.4x blended ROAS via repeat offer revenue)
Dengan lead rate 15-25% dari quiz selesai (benchmark gated quiz), setiap 1000
sessions menghasilkan 50-150 leads = Rp2.4-12jt revenue saja.

LAPIS 3 — AFFILIATE CPA + REWARDED ADS (revenue premium)
- Affiliate CPA approved: secured card $20-150 (target kita = secured/credit-
  builder — approval tinggi), prime $150-700 kalau profil bagus
- Rewarded ads di quiz result (benchmark 16x display eCPM, fill 67%) — user
  "bayar" dengan menonton ad untuk membuka breakdown lengkap
- Chime: recurring revenue per active user, bukan sekali bayar

================================================================
PROYEKSI ANGKA PER 1.000 SESSIONS (dengan benchmark riset)
================================================================
                     SAAT INI      LAPIS 1-2      LAPIS 1-3
Quiz start           1,108         1,108          1,108
Quiz selesai (30-40%)   58           330-440        330-440
Leads (45-55% of done)  25           150-220        150-220
Pre-qual leads          0             80-120         80-120
Outbound clicks         8             30-60          60+
Approvals (pre-qual)    ~0             —              9-36 (60%+ rate)

Revenue:
Display/Rewarded      Rp432rb       Rp1.2-2jt       Rp2-4jt (rewarded 16x)
Lead sale             Rp0           Rp1.4-6jt       Rp1.4-6jt
Affiliate CPA         Rp96rb        Rp0.5-2jt       Rp10-35jt (approval 60-80%)
────────────────────────────────────────────────────────────────
TOTAL                 ~Rp530rb      Rp3-10jt        Rp14-45jt
COST                  Rp3.2jt       Rp3.2jt         Rp3.2jt
P/L                   -Rp2.7jt      +0 s/d +7jt     +11jt s/d +42jt

================================================================
YANG MENENTUKAN: 3 KARDAK FUNNEL YANG HARUS DIBENAHI (builder work)
================================================================
1. QUIZ COMPLETION 5.8% → 30%+ (benchmark). Analisis per-pertanyaan drop-off
   (data sudah ada di funnel_events — kubuatkan breakdown per question).
2. GATE 43% → 55-70%: partial reveal (tampilkan nama match + teaser sebelum
   email gate — benchmark: "show the merchandise first").
3. PRE-QUAL SCREEN BARU: 3 field sebelum outbound = approval naik + lead sale
   aktif. Ini perubahan funnel terpenting.

================================================================
URUTAN EKSEKUSI YANG KUSARANKAN
================================================================
MINGGU INI  : per-question drop-off analysis (data sudah ada) + partial reveal
             gate test (A/B 50/50) — builder, murah, dampak terbesar
MINGGU DEPAN: pre-qual screen design + CPL partnership research (Credit Sesame
             / Commission Soup / lead aggregators secured-card niche)
BULAN DEPAN : affiliate CPA mix (Bankrate network + Chime direct) + rewarded
             ads test di result page
TARGET: ROI 2.6x seperti case TarjetasDeCredito dalam 60-90 hari.

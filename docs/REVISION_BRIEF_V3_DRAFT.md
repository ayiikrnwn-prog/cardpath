# REVISION_BRIEF_V3 — QUIZ PROFILING REDESIGN
## Draf untuk review Researcher · 24 Okt 2026 · Status: MENUNGGU APPROVAL
Penulis: Allice (agent builder) · Trigger: temuan testing langsung Shelby (§1)
Baca dulu: REVISION_BRIEF_V2.md (arsitektur SUB1×SUB2, masih berlaku kecuali diubah di sini)
Referensi metodologi: quiz-profiling-methodology-v3-oct2026.md (di skill display-arbitrage/references)

---

# BAGIAN 1 — HISTORI CASE: MENGAPA PERENCANAAN INI DIPERLUKAN

## 1.1 Kronologi pengujian Shelby (24 Okt 2026, dari log server demo)
Pengujian dilakukan lewat tunnel demo v2 (https://…trycloudflare.com), IP tunggal,
beberapa putaran journey penuh: /start → quiz → hasil → jump → P1 → P2 → /go.

| # | Aksi Shelby | Yang terjadi di sistem | Yang Shelby lihat |
|---|---|---|---|
| 1 | Journey lengkap pertama (quiz dijawab cepat, ±15-18 dtk, email diisi) | `quiz_complete` score dikira-kira, tetap lolos; funnel jalan sampai outbound | Funnel bekerja |
| 2 | Journey kedua — quiz dijawab cepat (user paham pertanyaannya) | `fraud_flag: too_fast` (total quiz <20 dtk) → skor dipaksa ≤39 | Result muncul TAPI tanpa tombol jump — terasa "berhenti mendadak" |
| 3 | Journey ketiga+ (pengujian berulang) | `ip_watchlist` aktif (≥3 quiz_complete/jam dari IP sama) → submission berikutnya dipaksa jalur sekunder 24 jam | Setelah input email, hasil masuk jalur sekunder — yang Shelby laporkan sebagai "selalu error response" |

Log server yang membuktikan (event dari lid Shelby sendiri):
```
quiz_answer ×6 (lid cp_mvmgabd1yt5t) → email_optin
quiz_complete: matched=opensky, odds=medium, score=39   ← skor dipaksa oleh flag
fraud_flag: 1                                           ← too_fast
```
Journey-nya TIDAK error secara teknis — hasil tetap tampil. Yang gagal adalah
KEPUTUSAN GATE: user asli berprofil valid diklasifikasikan tidak-qualified
karena dua sinyal perilaku yang salah desain.

## 1.2 Diagnosis teknis (audit Allice, sebelum riset metodologi)
1. **Sinyal `too_fast` invalid untuk quiz simple.** Kecepatan input hanya
   membedakan bot (sub-detik/pertanyaan) dari manusia. Quiz 6 pertanyaan simple
   dengan opsi tap = PASTI selesai 15-20 detik bagi user yang tahu situasinya
   sendiri. Menghukum kecepatan = menghukum kejujuran.
2. **Skor v2 mencampur FIT dan INTENT dalam satu angka** yang bisa dikompensasi
   silang (email +20 bisa menutupi profil lemah, dst) — bertentangan dengan
   model industri (behavioral vs demographic scoring terpisah; HubSpot/Artemis).
3. **IP watchlist toleransi-nol** menghukum user asli yang testing berkali —
   persis skenario QA Shelby dan (lebih penting) skenario user sungguhan yang
   membandingkan jawaban.
4. **Kontradiksi salah definisi**: goal "build from scratch" + skor 670+ tidak
   kontradiksi (orang rebuild punya skor lama baik); flag salah itu juga
   menurunkan skor user yang sah.
5. **UX gap**: ketika dipaksa jalur sekunder oleh anti-fraud, tidak ada
   penjelasan — user bingung, kesannya "error" (persis laporan Shelby).

## 1.3 Pelajaran (dinyatakan Shelby, dikuatkan teori — §2)
> "By experience memang punya potensi mengisi secepat itu jawaban quiz-nya,
> karena pertanyaannya simple dan bisa langsung dijawab."
> — enginem harus menilai KUALITAS PROFIL dari hasil profiling, bukan kecepatan.
> Jika profil berkualitas → jalur sub monetisasi; jika tidak → berhenti di
> end-of-journey sub1. Maka: pertanyaan harus dibuat CUKUP DALAM untuk profiling.

---

# BAGIAN 2 — DASAR TEORI & METODOLOGI (ringkas; detail di referensi)

## 2.1 Behavioral vs Demographic scoring (industri standar)
- FIT (demographic: situasi skor, deposit, penghasilan, rekening) = **floor** —
  menyaring yang tidak pernah cocok dengan produk mana pun. Bobot industri:
  ~50% starter model, turun ke ~20% setelah tuning.
- INTENT (behavioral: email opt-in, timing, kalkulator, repeat) = **routing** —
  menentukan siapa dieksekusi sekarang. Bobot: 60-80% setelah tuning.
- **Recency = sinyal behavioral terkuat** (aksi hari ini >> minggu lalu; studi
  Oldroyd: peluang qualifikasi 21× lebih tinggi di-follow-up <5 menit).
- Fit-only stall di handoff; behavior-only meng-skore job-seekers. Kombinasi
  dENGAN gate terpisah yang benar.

## 2.2 Zero-party data & pertanyaan yang layak (youengage/Iterable)
Rule emas: **setiap pertanyaan harus memengaruhi** match, email sequence,
routing, atau floor GAM. Kalau tidak → buang.
4 area sinyal terkuat: current situation · main problem · **readiness (timing)**
· context. Readiness = pembeda #1 antara actively-shopping vs penasaran.

## 2.3 Survey methodology (Qualtrics/Krosnick)
- Urutan funnel: umum → spesifik → sensitif → commitmen. Deposit/penghasilan
  JANGAN pertama (anchoring uang); email selalu terakhir.
- Fatigue: atensi menurun setelah peak awal → maksimal ~8 pertanyaan profil +
  email; satu layar per pertanyaan (sudah ✓ di v2).
- Kualitas responden dideteksi dari KONTRADIKSI jawaban (definisi benar), bukan
  kecepatan.

## 2.4 Benchmark untuk KPI (Interact n=100jt leads; ConvertFlow n=1.063 funnels)
- Quiz start→finish: 65% · start→lead: 40,1% (stabil sejak 2014)
- Quiz landing capture: 11,28% dari visitor; engagement 23,84%
- KPI v3: completion ≥60% · flag rate (anti-fraud) <5% · email opt-in ≥35% dari
  finisher · jump rate ≥25% dari finisher qualified

---

# BAGIAN 3 — DESAIN QUIZ v3 (draf — mohon review definisi pertanyaan)

## 3.1 Prinsip
1. Skor = kualitas profil (jawaban), bukan perilaku input
2. Dua track terpisah: FIT (floor) × INTENT (routing); JUMP = keduanya lulus
3. Bot-filter = biner terpisah (tidak menyentuh skor)
4. Setiap pertanyaan wajib memengaruhi keputusan
5. Urutan funnel: umum → spesifik → sensitif → commitmen

## 3.2 Pertanyaan (8 + email) — DRAF, mohon researcher review redaksi & opsi
| # | Pertanyaan (draft EN) | Track | Fungsi |
|---|---|---|---|
| Q1 | Have you checked or applied for a card in the last 30 days? [Never checked / Checked pre-qualification only / Applied and was declined] | INTENT | Regency — active shopper vs penasaran; routing alts |
| Q2 | When are you planning to apply? [Looking right now / Within 1-2 months / Just researching] | INTENT | Timing — pembeda #1 buyer vs researcher; KV cq_timing |
| Q3 | Credit score situation? [Don't know / No score yet / Below 580 / 580-669 / 670+] | FIT | Match dasar; KV cq_pos |
| Q4 | Major negative marks? [None / Past, resolved / Active] | FIT | Bankruptcy routing |
| Q5 | One-time deposit you could set aside? [$0 / Under $100 / $100-200 / $200-500 / $500+] | FIT | Daya beli; granularitas floor GAM; KV cq_dep |
| Q6 | Do you have steady income landing in a bank account? [Yes, regular paycheck / Yes, irregular / No] | FIT | Kemampuan bayar — kualitas lead di mata issuer |
| Q7 | US checking account? [Yes / No] | FIT | Routing OpenSky |
| Q8 | Main goal for the next 12 months? [Start from zero / Rebuild after setbacks / Earn rewards while building / Graduate to premium] | FIT | Routing konten; KV cq_goal |
| Q9 | Email (opsional, double opt-in, hasil tetap tampil) | INTENT | Komitmen terbesar |

Urutan mengikuti funnel methodology: regency/timing (umum, non-sensitif) →
situasi kredit → keuangan (sensitif, SETELAH deposit membuka topik uang) →
commitmen email terakhir.

## 3.3 Scoring
**FIT SCORE (0-50), threshold ≥30:**
- Score situation: none/unknown 10 · bad 10 · fair 13 · good 15
  (semua lulus — produk kita second-chance; yang membedakan adalah MATCH)
- Deposit: $0=0 · <$100=6 · $100-200=10 · $200-500=13 · $500+=15
- Income: regular 12 · irregular 6 · none 0
- Checking: ya 5 · tidak 5 (netral — OpenSky jalurnya)
- Kontradiksi NYATA (definisi baru, mohon review):
  a) goal "graduate premium" + no-score + never-checked + timing "just researching" = -10
  b) active bankruptcy + goal "rewards while building" = -10
  c) deposit $500+ + income "none" = -5 (perlu verifikasi)
**INTENT SCORE (0-50), threshold ≥35:**
- Email double opt-in: +25
- Timing: now +15 · 1-2 bulan +8 · research +2
- Applied & declined 30 hari: +10
- Kalkulator dipakai setelah hasil: +10
- Repeat visit (lid lama): +5
**Gate:** JUMP = FIT≥30 AND INTENT≥35 · Email-first = FIT≥30 AND INTENT 20-34 ·
Edukasi murni = FIT<30 (profil tidak realistis untuk produk mana pun di daftar)
**Bot-filter (biner, terpisah):** <2 dtk/pertanyaan ATAU pola jawaban identik
ATAU webdriver → secondary paksa; IP ≥3/jam → challenge/captcha, bukan blokir.

## 3.4 Dampak ke sistem lain
- KV GAM baru: `cq_timing` (now/soon/research), `cq_regency` (30d/never) —
  Tahap 3 floor rules makin granular
- Email sequence: routing pakai timing (now → E0 langsung apply guide;
  research → E0 edukasi dulu)
- Console: breakdown funnel per timing & regency → bahan lookalike Meta
- P2/outbound tidak berubah (param chain sama, tambah cq_timing & cq_regency)

## 3.5 KPI definisi sukses v3
- Quiz completion ≥60% (benchmark 65%)
- Flag rate anti-fraud <5% (baseline v2: jauh lebih tinggi — salah-flag user asli)
- Email opt-in ≥35% dari finisher (benchmark 40%)
- Jump rate ≥25% dari finisher; cost per jump < cost per lead mentah
- Distribusi jalur (target arah): JUMP 25-40% · email-first 25-35% · edukasi 30-45%

---

# BAGIAN 4 — PERENCANAAN EKSEKUSI (setelah approval researcher)

## Fase A — Koreksi mendesak (bug, bisa paralel dengan review)
| Item | Perubahan | Lokasi |
|---|---|---|
| A-1 | Pesan penjelasan di jalur sekunder: kenapa jump tidak muncul (anti-fraud/profil) — hilangkan efek "error" yang dialami Shelby | start/result.html |
| A-2 | `?qa=1` test-bypass anti-fraud utk review internal (tidak mempengaruhi user) | app.js |
| A-3 | IP watchlist: dari blokir total → challenge (tanpa captcha lib: jeda 10 dtk + konfirmasi) | start/quiz.html |

## Fase B — Implementasi v3 (setelah researcher OK definisi pertanyaan)
| Step | Kerjaan | Estimasi |
|---|---|---|
| B-1 | QUIZ array baru 8+1 + vals + auto-advance & micro-copy why-we-ask per pertanyaan baru | 0.5 hari |
| B-2 | fitScore() + intentScore() + gate AND; hapus speed dari skor; bot-filter biner | 0.5 hari |
| B-3 | quizMatch v3: regency & timing masuk logika match + alts | 0.5 hari |
| B-4 | KV wrapper: cq_timing, cq_regency | 0.25 hari |
| B-5 | Email routing v3 (E0 varian now vs research) — stub dulu di demo | 0.25 hari |
| B-6 | Console: breakdown per timing/regency | 0.25 hari |
| B-7 | QA: matrix jawaban×gate, benchmark vs KPI, journey penuh Shelby test | 0.5 hari |
Total ±2.75 hari kerja agent.

## Fase C — Data & iterasi (post-deploy)
- Minggu 1-2: kumpulkan distribusi FIT/INTENT aktual → kalibrasi threshold
  (30/35 adalah hipotesis; kalibrasi dari data, bukan angka teori)
- Minggu 3: review flag rate & false-positive rate (bila user asli masih
  ter-flag >5% → longgarkan rule, jangan tambah rule)
- Output untuk researcher: distribusi jawaban per pertanyaan → kandidat
  pertanyaan yang tidak diskriminatif (semua jawaban seragam) dihapus/diganti

## Fase D — Pertanyaan terbuka untuk researcher (mohon jawab di review)
1. Redaksi Q1-Q8 — ada yang ambigu atau bisa disalahartikan user US?
2. Opsi jawaban — sudah MECE (mutually exclusive, collectively exhaustive)?
3. Kontradiksi (3.3) — definisi a/b/c sudah tepat? ada kombinasi lain?
4. Threshold 30/35 — setuju sebagai starting point sebelum kalibrasi data?
5. Apakah Q6 (income regularity) aman secara compliance FCRA/fair-lending
   framing (kami framing-nya "income landing in account", bukan nominal)?
6. Apakah pertanyaan regency Q1 berisiko bikin user merasa dihakimi (denied
   baru-baru ini = sensitif)? Kalau iya, alternatif redaksi?

---

# BAGIAN 5 — LAMPIRAN: PERUBAHAN vs v2
| Elemen | v2 | v3 | Alasan |
|---|---|---|---|
| Pertanyaan | 6 + email | 8 + email | Depth profiling; semua berfungsi |
| Kecepatan dalam skor | -15/force | Dihapus dari skor; bot-filter biner | Salah sinyal (kasus Shelby) |
| IP watchlist | Blokir total | Challenge + reset per jam | Kasus Shelby; user asli ikut kena |
| Kontradiksi | build+670 = flag | Definisi baru (3.3) | Definisi lama salah |
| Struktur skor | Satu angka 0-100 | FIT × INTENT (gate AND) | Standar industri; cegah kompensasi silang |
| KV baru | — | cq_timing, cq_regency | Floor GAM granular; lookalike Meta |
| KPI | completion ≥50% | completion ≥60%, flag <5%, jump ≥25% | Benchmark nyata (§2.4) |

*Status: draf. Tidak dieksekusi sebelum researcher menjawab Bagian 4-D.*

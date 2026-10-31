# COMPREHENSIVE REPORT — CARDPATH UNTUK MEDIA BUYING
# Per 31 Okt 2026 · dari Allice (builder) · data: D1 first-party + Meta API · semua verified

================================================================
BAGIAN 1 — STATUS EKSEKUSI (30-31 Okt, 2 hari traffic test)
================================================================

SPEND (dari Meta API, real):
- CARDPATH-META-METAA  : Rp243.113 | 9 clicks  | 215 impr (30 Okt)
- CARDPATH-META-V2-LPV : Rp163.697 | 25 clicks | 639 impr (30-31 Okt)
- TOTAL                : Rp406.810

FUNNEL (first-party D1):
- Sessions  : 156 (30 Okt: 115, 31 Okt: 41)
- QuizStart : ~159 events
- Quiz selesai (results) : 17 (29 Okt: 8, 30 Okt: 2*, 31 Okt: 7)
  *30 Okt rendah karena bot false-positive bug — SUDAH DIPERBAIKI 31 Okt
- Email gate: 0 lead real sejauh ini (2 event email_optin = data test builder, sudah dibersihkan)
- Jump ke SUB2: 0-1
- Outbound click: 1 (dengan lid ✓)

CATATAN PENTING — perbedaan definisi "results":
- Meta melaporkan 20 "results" = custom conversion QUIZ START (mulai quiz)
- Quiz SELESAI di D1 = 17
- Untuk perbandingan apples-to-apples: pakai QuizStart di Meta vs quiz_start di D1

================================================================
BAGIAN 2 — PERFORMA PER ADSET (7 hari, sumber D1)
================================================================

ADSET    | SESSIONS | QUIZ | QUIZ RATE | ENGAGED
as3      |    21    |  8   |  38%  🌟  | 638s total
as4      |    40    |  4   |  10%      | 635s total
as1      |    43    |  1   |   2%      | 191s total
as2      |    37    |  0   |   0%      | 113s total
v2as1    |    22    |  0   |   0%      | 100s total
v2as2    |    23    |  0   |   0%      | 110s total
(none)   |    22    |  3   |  direct/test

DEVICE: mobile 89 (57%) / desktop 67 (43%) — dua-duanya signifikan

INSIGHT:
- as3 = bintang: quiz rate 38%, engaged tertinggi (638s)
- as1+as2+as3-as4 pattern: engaged rendah (113-191s) = creative-audience mismatch
- v2as1/v2as2: 45 sesi NOL quiz — perlu evaluasi setelah utm dipisah

================================================================
BAGIAN 3 — 6 ADJUSTMENT YANG DIMINTA (urutan eksekusi)
================================================================

🔴 #1 — PISAHKAN UTM CAMPAIGN V2-LPV (BLOK PENGUKURAN)
URL iklan V2-LPV masih pakai utm_campaign=metaa_test1 (sama dgn METAA).
Akibat: traffic V2-LPV "menyamar" — spend tercatat, tapi hasil tak bisa
dipisahkan di dashboard. EDIT semua URL iklan V2-LPV:
  utm_campaign=metaa_v2lpv (utm_content tetap v2as1/v2as2)
Setelah diganti, kabari builder → mapping di-update 1 menit → dashboard
langsung menampilkan V2-LPV sebagai baris terpisah.

🔴 #2 — REALOKASI BUDGET ADSET
as1+as2 = 80 sesi, 1 quiz total. as3 = 21 sesi, 8 quiz.
ACTION: pause/turunkan as1+as2 → realokasi ke as3 (duplikat as3 dengan
budget lebih besar adalah langkah paling logis sekarang).

🟡 #3 — EVALUASI V2AS1/V2AS2 (setelah #1)
45 sesi, 0 quiz. Setelah utm terpisah, pantau 2-3 hari dgn data bersih.
Tetap 0 quiz → pause, creative/audience diganti.

🟡 #4 — SWITCH KE OFFSITE_CONVERSIONS (setelah #1)
Signal QuizStart sekarang bersih (bot false-positive sudah diperbaiki 31 Okt
— sebelumnya 90% traffic salah ditandai bot). CAPI mirror jalan dengan dedup
event_id. ACTION: clone as3 → switch optimasi ke OFFSITE_CONVERSIONS (QuizStart)
sebagai test A/B terhadap optimasi LPV.

🟡 #5 — GOOGLE ADS: TIDAK ADA BLOCKER TEKNIS
gclid capture ✓, utm_term ✓, semua tracking Google-ready. Kapan pun billing
siap, launch tanpa kerjaan builder.

🟢 #6 — AUDIT URL IKLAN (5 menit)
22 sesi (7 hari) tanpa utm = direct/manual/test. Cek preview URL semua iklan
aktif — pastikan tidak ada iklan yang URL-nya kehilangan parameter.

================================================================
BAGIAN 4 — YANG SUDAH DIPERBAIKI BUILDER (31 Okt) — media buyer tidak perlu
melakukan apa pun di daftar ini, hanya perlu tahu datanya sekarang valid:
================================================================
✓ KV lelang 9/9 keys (odds & cq_match sebelumnya TIDAK sampai ke lelang —
  kritikal: signal premium yang selama ini kosong)
✓ Bot detection 2-syarat — 90% false-positive hilang, QuizStart signal bersih
✓ Email gate & outbound tercatat per-session (dulu selalu 0)
✓ Nama campaign resmi platform tampil di dashboard (bukan utm mentah)
✓ Non-paid traffic diklasifikasi: direct / test / unpaid
✓ Flood-guard & dedup (data tidak bisa di-spam)
✓ Spend ingestion otomatis 6 jam + watchdog
✓ Backup D1 mingguan terverifikasi

================================================================
BAGIAN 5 — YANG DITUNGGU DARI MEDIA BUYING (checklist balasan)
================================================================
[ ] #1 utm V2-LPV diganti → kabari builder
[ ] #2 keputusan budget as1/as2/as3/as4
[ ] #4 keputusan switch OFFSITE_CONVERSIONS (yes/no, adset mana)
[ ] #5 estimasi tanggal Google Ads
[ ] #6 hasil cek preview URL iklan

================================================================
CATATAN DATA (baca dulu sebelum bandingkan angka):
- "Sessions" = visit (reload = session baru); unique users 7d = 191 (sessions 207)
- Angka Meta vs dashboard: Meta = conversion platform-side; D1 = server-side
  first-party. QuizStart Meta ≈ quiz_start D1. Quiz selesai hanya di D1.
- Semua jam UTC. Mata uang spend = dikonversi @Rp16.000 (native USD di DB).

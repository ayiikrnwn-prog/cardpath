# ADJUSTMENT UNTUK MEDIA BUYER — pasca perbaikan builder (31 Okt, Allice)

## KONTEKS: Builder sudah menutup semua bug tracking (KV 9/9, bot 2-syarat, gate/outbound
## tercatat, campaign mapping). Sekarang giliran media buyer — 6 hal ini perlu di-adjust:

---

## 1. 🔴 UTM CAMPAIGN V2-LPV — WAJIB DIPISAH (paling penting)
Kampanye CARDPATH-META-V2-LPV masih membawa utm_campaign=metaa_test1 (sama dengan campaign lama).
Akibatnya di dashboard: spend V2-LPV tercatat tapi traffic-nya "menyamar" jadi campaign lama.
ACTION: edit URL iklan semua adset V2-LPV → utm_campaign=metaa_v2lpv (utm_content tetap unik per adset).
Tanpa ini: performa V2-LPV tidak bisa dinilai terpisah, dan laporan campur.

## 2. 🔴 ADSET AS1 & AS2 — NOL KONVERSI, hampir 80 sesi
Data 7 hari: as1=43 sesi/1 quiz, as2=37 sesi/0 quiz, vs as3=21 sesi/8 quiz (38%!), as4=40/4.
ACTION: turunkan budget atau pause as1+as2, realokasi ke as3/as4.
As3 adalah bintang — pertimbangkan duplikat dengan budget lebih besar.

## 3. 🟡 ADSET V2AS1 & V2AS2 — 45 sesi, NOL quiz
Adset baru campaign V2-LPV: 45 sesi, 0 quiz. Traffic masuk tapi tidak ada yang menyelesaikan quiz.
Kemungkinan: audience/creative tidak match, atau LPV landing tidak cocok dengan quiz.
ACTION: setelah utm dipisah (poin 1), pantau 2-3 hari. Kalau tetap 0 quiz → pause.

## 4. 🟡 OPTIMASI KE CONVERSIONS — PIXEL SUDAH SIAP
Fix KV + tracking membuat signal QuizStart bersih (bukan bot-polluted). Dengan CAPI mirror jalan,
adset bisa di-switch dari LINK_CLICKS/LPV ke OFFSITE_CONVERSIONS (QuizStart) — Meta belajar dari
user yang benar-benar menyelesaikan quiz.
ACTION: setelah utm dipisah, switch 1 adset terbaik (as3 clone) ke OFFSITE_CONVERSIONS sebagai test.

## 5. 🟡 GCLID & UTM TERM — google campaign belum jalan
utm_term & gclid hanya terisi dari test. Google Ads campaign belum live — data tracking untuk
Google sudah siap 100% (gclid tersimpan, term tercatat). Tidak ada blocker teknis.
ACTION: kapan pun Google Ads siap, langsung jalan tanpa kerjaan builder lagi.

## 6. 🟢 22 SESI TANPA UTM (7 hari) — kecil tapi catat
Kemungkinan: ketikan manual, test, ATAU iklan dengan URL yang kehilangan utm.
ACTION: cek preview URL semua iklan aktif — pastikan semua ada utm lengkap. 1 iklan bolong =
sesi tak terhitung ke campaign manapun.

---

## YANG TIDAK PERLU DILAKUKAN MEDIA BUYER (sudah beres dari builder):
✓ Tracking KV 9/9 ke lelang ✓ bot detection akurat ✓ gate/outbound tercatat ✓
✓ Campaign mapping ✓ spend ingestion otomatis ✓ dashboard akurat (Rp, nama resmi campaign)

## URUTAN EKSEKUSI: #1 (utm) → #2 (budget as1/as2→as3/as4) → #4 (switch conversions) → pantau

AUDIT PERFORMA 31 OKT — JAWABAN ATAS 3 PERTANYAAN SHELBY

1. "CPR Meta bagus Rp5.000, result 20" → KONFIRMASI BENAR:
   - Spend V2-LPV hari ini: $6.85 = Rp109.547 (real dari Meta API)
   - QuizStart events: 20 → CPR = Rp109.547/20 = Rp5.477 (dekat Rp5rb; klaim Rp5rb pakai spend lebih awal)
   - "Result 20" di Meta = custom conversion QuizStart (quiz mulai), BUKAN quiz selesai

2. "Metrics HQ tidak ada data" → KETEMU & DIPERBAIKI:
   - Perf agent meluncurkan campaign BARU: CARDPATH-META-V2-LPV (id 120254232111460264)
   - Spend-nya masuk D1 ✓ TAPI mapping campaign→utm TIDAK ADA → spend tidak bisa join ke traffic
     → tampilan campaign terlihat kosong/tidak nyambung
   - FIX: mapping V2-LPV → metaa_test1 ditambahkan ke platform_campaign_map; re-ingest jalan;
     spend sekarang utmc=metaa_test1 (join OK) & spend ter-update otomatis
   - CATATAN PENTING UTK PERF AGENT: traffic V2-LPV masih membawa utm_campaign=metaa_test1
     (kemungkinan campaign diduplikat tanpa ganti utm). Implikasi: hasil V2-LPV TERCAMPUR
     dengan campaign lama di D1. Kalau mau dipisah, URL iklan V2-LPV harus pakai utm_campaign
     sendiri (mis. metaa_v2lpv) — konfirmasi ke perf agent.

3. "GAM tidak ada earning" → NORMAL, bukan bug:
   - GAM SUDAH deliver: 42 impressions (31 rendered non-empty, 1 line item menang) hari ini
   - Tapi volume masih kecil (31 render dari 1 user terlacak) → earning belasan cent
   - Earning AdSense/AdX baru muncul di report dengan delay 24-48 jam
   - Panel P4 Audience Value memang "pending" — adsense_daily diisi manual (CSV/API),
     tidak ada auto-ingest. Sekali Shelby export CSV earning mingguan, nilai masuk.

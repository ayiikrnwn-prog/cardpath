/* cp-pixel.js — CardPath: Meta Pixel base + QuizStart + GTag (gcl* only)
   Dipanggil SETELAH cp_utm & cp_lid tersimpan (diinject akhir <body> oleh worker).
   Konfigurasi via window.CP_PIXEL (di-set inline oleh worker): {pixelId, gtagId, gtagLabel} */
(function(){
  var CFG = window.CP_PIXEL || {};
  var PIX = CFG.pixelId; if (!PIX) return;
  // ===== BLOK 1: Meta Pixel base =====
  if (!window.fbq) {
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
  }
  fbq('init', PIX);
  fbq('track', 'PageView');
  // ===== BLOK 2: helper + QuizStart + GTag =====
  var getUtm = function(){ try{ return JSON.parse(sessionStorage.getItem('cp_utm')||'null'); }catch(e){ return null; } };
  var getLid = function(){ try{ return localStorage.getItem('cp_lid')||''; }catch(e){ return ''; } };
  var utm = getUtm() || {};
  var src = utm.utm_source || (new URLSearchParams(location.search).get('utm_source')) || '';
  var lid = getLid();
  // A. QuizStart — per browser session (sessionStorage), dedup via eventID = qs_<lid> (match CAPI)
  function fireQuizStart(l){
    var fbFlag = 'cp_fbqs_session';
    try { if (sessionStorage.getItem(fbFlag)) return; } catch(e){}
    fbq('trackCustom', 'QuizStart', { lid: l, utm_source: src }, { eventID: 'qs_' + l });
    try { sessionStorage.setItem(fbFlag, '1'); } catch(e){}
  }
  if (lid) { fireQuizStart(lid); }
  else {
    // F3 fix: poll cp_lid max 2 detik (app.js race), lalu fire sekali
    var tries = 0;
    var t = setInterval(function(){
      var l2 = getLid();
      if (l2) { clearInterval(t); fireQuizStart(l2); }
      else if (++tries >= 20) { clearInterval(t); }
    }, 100);
  }
  // B. GTag conversion — HANYA utm_source gcl*
  var GT = CFG.gtagId, GL = CFG.gtagLabel;
  if (src.indexOf('gcl') === 0 && GT && GT.indexOf('PLACEHOLDER') === -1) {
    if (!window.gtag) {
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GT;
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function(){ dataLayer.push(arguments); };
      gtag('js', new Date());
      gtag('config', GT);
    }
    var gFlag = 'cp_gconv_' + lid;
    if (!sessionStorage.getItem(gFlag)) {
      gtag('event', 'conversion', { send_to: GT + '/' + (GL||'') });
      try { sessionStorage.setItem(gFlag, '1'); } catch(e){}
    }
  }
})();
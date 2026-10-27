/* CardPath track.js v1 — Master Control v2 (PART 1)
   Session tracking first-party: session_start, page_view, scroll_depth, heartbeat, session_end
   <8KB, defer, batch buffer 5s, offline-safe. Dipasang di KEDUA sub via worker inject. */
(function(){
  if (window.__cpTrack) return; window.__cpTrack = true;
  var SID;
  try { SID = sessionStorage.getItem('cp_sid'); if (!SID) { SID = (crypto.randomUUID ? crypto.randomUUID() : 's_'+Date.now()+'_'+Math.random().toString(36).slice(2,8)); sessionStorage.setItem('cp_sid', SID); } } catch(e){ SID='s_'+Date.now(); }
  var LID = (function(){ try { return localStorage.getItem('cp_lid') || null; } catch(e){ return null; } })();
  var UTM = {};
  try { var p = new URLSearchParams(location.search);
    ['utm_source','utm_campaign','utm_content','utm_term','utm_medium'].forEach(function(k){ var v=p.get(k); if(v) UTM[k]=v; });
  } catch(e){}
  var started = Date.now();
  var maxScroll = 0; var heartbeats = 0; var pageviews = 0;
  var buf = [];
  function deviceFromUA(){
    var ua = navigator.userAgent;
    if (/Mobile|Android|iPhone/.test(ua)) return 'mobile';
    if (/Tablet|iPad/.test(ua)) return 'tablet';
    return 'desktop';
  }
  function push(ev, extra){
    buf.push(Object.assign({ event:ev, session_id:SID, lid:LID, ts:Date.now(), page:location.pathname,
      sub: window.CP_SUB || (location.hostname.startsWith('card.')?'sub1':'sub2'),
      utm:UTM, device:deviceFromUA() }, extra||{}));
  }
  // session_start (sekali per session — guard flag)
  if (!sessionStorage.getItem('cp_sess_started')) {
    sessionStorage.setItem('cp_sess_started','1');
    push('session_start', {data:{referrer:document.referrer||''}});
    flushSoon();
  }
  // page_view
  push('page_view'); pageviews++;
  // scroll depth 25/50/75/100 (fire sekali per threshold)
  var fired={};
  window.addEventListener('scroll', function(){
    var h=document.documentElement; var pct=Math.round((h.scrollTop||document.body.scrollTop)/(h.scrollHeight-h.clientHeight)*100);
    [25,50,75,100].forEach(function(t){ if(pct>=t && !fired[t]){ fired[t]=1; maxScroll=Math.max(maxScroll,t); push('scroll_depth',{depth:t}); } });
  }, {passive:true});
  // heartbeat 10s saat visible
  setInterval(function(){ if(document.visibilityState==='visible'){ heartbeats++; push('heartbeat',{engaged_sec:10}); } }, 10000);
  // session_end di pagehide (sendBeacon)
  window.addEventListener('pagehide', function(){
    push('session_end',{engaged_sec:heartbeats*10, max_scroll:maxScroll, pageviews:pageviews});
    flush(true);
  });
  // batch flush 5 detik
  var timer=null;
  function flushSoon(){ if(!timer) timer=setTimeout(function(){ flush(); }, 300); }
  setInterval(function(){ if(buf.length) flush(); }, 5000);
  function flush(sync){
    if(!buf.length) return;
    var batch = buf.splice(0, buf.length);
    var payload=JSON.stringify({batch:batch});
    try{
      if(sync && navigator.sendBeacon) navigator.sendBeacon('/api/track', new Blob([payload],{type:'application/json'}));
      else fetch('/api/track',{method:'POST',headers:{'Content-Type':'application/json'},body:payload,keepalive:true}).catch(function(){});
    }catch(e){ /* offline-safe */ }
  }
  // expose untuk integration dengan app.js (quiz events masuk session_summary)
  window.__cpTrackEvent=function(ev,extra){ push(ev,extra); flushSoon(); };
})();

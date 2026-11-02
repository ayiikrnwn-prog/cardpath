/* gam.js — CardPath GAM wrapper v2
 * v2 fix: interstitial dihapus dulu (konflik page-level ads) — banner top prioritas.
 * Network 23382571087, KV 9 keys enum strict, telemetry -> /api/adlog
 */
(function () {
  'use strict';
  var UNIT_TOP = '/23382571087/cardpath/cardpath_top';
  var ALLOW = {
    utm_source: ['gcl1','gcl2','metaa','metab','email','push','partner','direct','other'],
    cq_pos: ['unknow','noscore','bad','fair','good'],
    cq_goal: ['build','rebuild','rewards','graduate'],
    cq_dep: ['d0','d99','d150','d350','d600'],
    cq_match: ['chime','capone49','quicksilver','opensky','openskynb','creditone','indigo','varo','zolve','self','creditstrong','kikoff','grow','petal2','experian','boompay','creditkarma','amexnova'],
    cq_timing: ['now','month','months13','research'],
    cq_regen: ['never','browsed','applied'],
    odds: ['high','medium','low'],
    cq_id: ['ssn','itin','passport']
  };
  function kvFromURL() {
    var p = new URLSearchParams(location.search);
    var out = {};
    Object.keys(ALLOW).forEach(function (k) {
      // URL param 'o' = odds (short param dari funnel) — map ke KV 'odds'
      // short-param mapping (funnel kirim versi pendek): o→odds, m→cq_match, g→gated
      var v = (k === 'odds') ? (p.get('odds') || p.get('o'))
            : (k === 'cq_match') ? (p.get('cq_match') || p.get('m'))
            : p.get(k);
      if (k === 'cq_match' && !v) { try { var cc=JSON.parse(decodeURIComponent((document.cookie.match(/cp_cq=([^;]+)/)||[])[1]||'{}')); v=cc.cq_match; } catch(e){} }
      if (v && ALLOW[k].indexOf(v) !== -1) out[k] = v;
    });
    if (!out.utm_source) {
      try {
        var utm = JSON.parse(sessionStorage.getItem('cp_utm') || '{}');
        if (utm.utm_source && ALLOW.utm_source.indexOf(utm.utm_source) !== -1) out.utm_source = utm.utm_source;
      } catch (e) {}
    }
    return out;
  }
  var KVS = kvFromURL();
  var adlog = [];
  function logImpression(slot, extra) {
    try {
      adlog.push(Object.assign({
        page: location.pathname,
        slot: slot ? slot.getAdUnitPath() : '',
        kv_json: JSON.stringify(KVS),
        lid: new URLSearchParams(location.search).get('lid') || ''
      }, extra));
    } catch (e) {}
  }
  function flushAdlog() {
    if (!adlog.length) return;
    var batch = adlog.splice(0, adlog.length);
    try {
      fetch('/api/adlog', {method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({events: batch}), keepalive: true}).catch(function(){});
    } catch (e) {}
  }
  window.cpAdlog = adlog;

  function parseSizes(arr) {
    // sizes dari config: ["320x50","fluid"] → [[320,50],'fluid']
    return (arr||[]).map(function(s){
      if (s === 'fluid') return 'fluid';
      var p = String(s).split('x'); return [parseInt(p[0])||320, parseInt(p[1])||250];
    });
  }
  function initGPT() {
    var g = window.googletag = window.googletag || {};
    g.cmd = g.cmd || [];

    g.cmd.push(function () {
      Object.keys(KVS).forEach(function (k) { g.pubads().setTargeting(k, KVS[k]); });

      // Ad Slot Studio: multi-slot dari window.CP_SLOTS (config D1 via worker)
      if (window.CP_SLOTS && window.CP_SLOTS.length) {
        window.CP_SLOTS.forEach(function (s) {
          var el = document.getElementById(s.id);
          if (!el) return;
          var slot = g.defineSlot(s.unit, parseSizes(s.sizes).length ? parseSizes(s.sizes) : ['fluid'], s.id);
          if (slot) {
            slot.addService(g.pubads());
            slot.setTargeting('slot_id', s.id);
            if (s.pos === 'sidebar') slot.setTargeting('placement', 'sidebar');
            if (s.pos === 'inline') slot.setTargeting('placement', 'inline');
            if (s.pos === 'interstitial') slot.setTargeting('placement', 'interstitial');
          }
        });
      }
      // fallback/legacy: slot top hardcoded (kalau CP_SLOTS tidak ada)
      var top = document.getElementById('cp-ad-top');
      if (top) {
        var sTop = g.defineSlot(UNIT_TOP, [[320,50],[300,250],[336,280],[728,90],[970,90],'fluid'], 'cp-ad-top');
        if (sTop) sTop.addService(g.pubads());
      }

      g.pubads().addEventListener('slotRequested', function (e) {
        try{ window.__cpSlotTs[e.slot.getSlotElementId()] = Date.now(); }catch(x){}
        logImpression(e.slot, {ev:'requested'});
      });
      g.pubads().addEventListener('slotRenderEnded', function (e) {
        var lat=0; try{ var st=window.__cpSlotTs[e.slot.getSlotElementId()]; if(st) lat=Date.now()-st; }catch(x){}
        logImpression(e.slot, {ev:'rendered', latency_ms: lat, isEmpty: e.isEmpty ? 1 : 0,
          line_item_id: (e.lineItemId||'').toString(), advertiser_id: (e.advertiserId||'').toString(),
          creative_id: (e.creativeId||'').toString(), size: e.size ? e.size.join('x') : ''});
        flushAdlog();
      });
      g.pubads().addEventListener('impressionViewable', function (e) {
        logImpression(e.slot, {ev:'viewable'});
        flushAdlog();
      });
      setInterval(flushAdlog, 8000);
      window.addEventListener('pagehide', flushAdlog);

      g.enableServices();
      if (window.CP_SLOTS && window.CP_SLOTS.length) {
        window.CP_SLOTS.forEach(function (s) {
          var el=document.getElementById(s.id); if (!el) return;
          if (s.pos === 'carousel') {
            // Task 3: lazy — display saat zone visible (IntersectionObserver)
            try {
              var io = new IntersectionObserver(function (ents) {
                ents.forEach(function (en) { if (en.isIntersecting) { io.disconnect(); g.display(s.id); } });
              }, { threshold: 0.3 });
              io.observe(el);
            } catch (e) { g.display(s.id); }
          } else { g.display(s.id); }
        });
      }
      if (document.getElementById('cp-ad-top')) g.display('cp-ad-top');
    });

    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';
    document.head.appendChild(s);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initGPT);
  else initGPT();
})();

/* v3: interstitial on-demand (Task 1 PEKAN1) — overlay transisi quiz→result
 * API: window.cpInterstitialShow(onDone) — fire-and-forget; onDone SELALU dipanggil.
 * Batasan: 1x per session, max 15s, close selalu tersedia, fallback 3s no-fill.
 * Policy: quiz page TIDAK pernah memanggil ini. */
window.cpInterstitialShow = function (onDone) {
  var UNIT_INT = '/23382571087/cardpath/cardpath_interstitial';
  var done = false, slot = null, timer15 = null, timer3 = null, g = window.googletag;
  function finish(reason) {
    if (done) return; done = true;
    try { clearTimeout(timer15); clearTimeout(timer3); } catch (e) {}
    try { if (slot) g.destroySlots([slot]); } catch (e) {}
    var ov = document.getElementById('cp-int-overlay');
    if (ov) ov.remove();
    logImpressionSafe('interstitial_onsite', reason);
    if (typeof onDone === 'function') setTimeout(onDone, 0);
  }
  function logImpressionSafe(name, reason) {
    try {
      fetch('/api/adlog', { method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
        body: JSON.stringify({ events: [{ page: 'result_transition', slot: name, kv_json: JSON.stringify(KVS),
          lid: new URLSearchParams(location.search).get('lid') || '', ev: reason, meta_json: '{}' }] }) }).catch(function () {});
    } catch (e) {}
  }
  // 1x per session guard
  try { if (sessionStorage.getItem('cp_int_done') === '1') { finish('already_shown'); return; } } catch (e) { finish('storage_err'); return; }
  if (!g || !g.cmd) { finish('no_gpt'); return; }
  // overlay
  var ov = document.createElement('div');
  ov.id = 'cp-int-overlay';
  ov.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:-apple-system,system-ui,sans-serif';
  ov.innerHTML = '<div style="text-align:center;max-width:336px;width:100%;padding:16px">' +
    '<div style="font-size:15px;color:#555;margin-bottom:14px">Checking your matches…</div>' +
    '<div id="cp-int-ad" style="min-height:250px;text-align:center"></div>' +
    '<div style="margin-top:16px"><button id="cp-int-close" style="background:none;border:1.5px solid #ccc;border-radius:20px;padding:8px 18px;font-size:14px;color:#666">Skip</button></div>' +
    '</div>';
  document.body.appendChild(ov);
  document.getElementById('cp-int-close').onclick = function () { finish('user_skip'); };
  try { sessionStorage.setItem('cp_int_done', '1'); } catch (e) {}
  // timeouts: 3s no-fill → close; 15s hard cap
  timer3 = setTimeout(function () { if (!window.__cpIntFilled) finish('no_fill_3s'); }, 3000);
  timer15 = setTimeout(function () { finish('timeout_15s'); }, 15000);
  g.cmd.push(function () {
    try {
      slot = g.defineSlot(UNIT_INT, [[320, 480], [300, 250], [336, 280]], 'cp-int-ad');
      if (!slot) { finish('define_failed'); return; }
      slot.addService(g.pubads());
      slot.setTargeting('placement', 'interstitial');
      g.pubads().addEventListener('slotRenderEnded', function intRE(e) {
        if (e.slot !== slot) return;
        g.pubads().removeEventListener('slotRenderEnded', intRE);
        if (e.isEmpty) { finish('empty'); } else { window.__cpIntFilled = true; clearTimeout(timer3); logImpressionSafe('interstitial_onsite', 'rendered'); }
      });
      g.display('cp-int-ad');
    } catch (e) { finish('error'); }
  });
};

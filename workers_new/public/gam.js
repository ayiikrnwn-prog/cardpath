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
        window.CP_SLOTS.forEach(function (s) { var el=document.getElementById(s.id); if (el) g.display(s.id); });
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

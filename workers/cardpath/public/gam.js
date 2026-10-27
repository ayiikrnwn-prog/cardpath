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
      var v = p.get(k);
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

  function initGPT() {
    var top = document.getElementById('cp-ad-top');
    if (!top) return;
    var g = window.googletag = window.googletag || {};
    g.cmd = g.cmd || [];

    g.cmd.push(function () {
      Object.keys(KVS).forEach(function (k) { g.pubads().setTargeting(k, KVS[k]); });

      var sTop = g.defineSlot(UNIT_TOP, [[320,50],[300,250],[336,280],[728,90],[970,90],'fluid'], 'cp-ad-top');
      if (sTop) sTop.addService(g.pubads());

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
      g.display('cp-ad-top');
    });

    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';
    document.head.appendChild(s);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initGPT);
  else initGPT();
})();

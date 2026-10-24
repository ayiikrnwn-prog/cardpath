/* CardPath v4 — kv.js v2 (KV_PRECISION_SPEC §3, port 1:1)
   9 key GAM, enum eksak, defensif: nilai tak dikenal = key TIDAK diset.
   lid TIDAK jadi KV (PII-adjacent) — D1 tracking saja. PPID hash = F3. */
window.CardPathKV = (function () {
  const UTM_ALLOW = ['gcl1','gcl2','metaa','metab','email','push','partner']; // direct bila kosong
  const DEP_ENUM = {0:'d0',99:'d99',150:'d150',350:'d350',600:'d600'};
  const POS_ENUM = {unknown:'unknow', never:'noscore', bad:'bad', fair:'fair', good:'good'};
  const MATCH_ENUM = {chime:1,capone49:1,quicksilver:1,opensky:1,openskynb:1,creditone:1,indigo:1,
    varo:1,zolve:1,self:1,creditstrong:1,kikoff:1,grow:1,petal2:1,experian:1,boompay:1,creditkarma:1,amexnova:1};
  const TIMING_ENUM = ['now','month','months13','research'];
  const REGEN_ENUM = ['never','browsed','applied'];
  const ID_ENUM = ['ssn','itin','passport'];
  const GOAL_ENUM = ['build','rebuild','rewards','graduate'];
  function profile(){ try { return JSON.parse(sessionStorage.getItem('cp_profile')||'{}'); } catch(e){ return {}; } }
  function utm(){ try { return JSON.parse(sessionStorage.getItem('cp_utm')||'{}'); } catch(e){ return {}; } }
  function safe(v, allowed, fallback){ return allowed.includes(v) ? v : fallback; }
  function slotTargeting() {
    const p = profile(), u = utm(), t = {};
    const src = safe(u.utm_source, UTM_ALLOW, 'direct');
    if (src) t.utm_source = src;
    const pos = POS_ENUM[p.cq_pos]; if (pos) t.cq_pos = pos;
    if (GOAL_ENUM.includes(p.cq_goal)) t.cq_goal = p.cq_goal;
    const dep = DEP_ENUM[+p.cq_dep]; if (dep) t.cq_dep = dep;
    if (MATCH_ENUM[p.cq_match]) t.cq_match = p.cq_match;
    if (TIMING_ENUM.includes(p.cq_timing)) t.cq_timing = p.cq_timing;
    if (REGEN_ENUM.includes(p.cq_regen)) t.cq_regen = p.cq_regen;
    if (ID_ENUM.includes(p.cq_id)) t.cq_id = p.cq_id;
    if (['high','medium','low'].includes(p.o)) t.odds = p.o;
    return t; // key TIDAK diset bila value invalid — bersih utk lelang & report
  }
  // F3 aktivasi:
  // googletag.cmd.push(() => { const t = slotTargeting();
  //   for (const k in t) googletag.pubads().setTargeting(k, t[k]); });
  return { slotTargeting, profile, utm };
})();
if (!location.pathname.includes('/start/')) {
  console.log('[KV targeting ready]', window.CardPathKV.slotTargeting());
}

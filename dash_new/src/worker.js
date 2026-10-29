// cardpath-dash — Master Control v2 dashboard standalone (D1 binding cardpath-db, sama dgn worker cardpath)
// ==================== DASHBOARD (Master Control v2) ====================
// JWT single-user (Shelby), password hash dari env CP_DASH_PASSWORD (SHA-256 hex)
async function dashToken(env) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode((env.CP_SECRET||'cardpath-dev-secret')+'-dash'),
    {name:'HMAC', hash:'SHA-256'}, false, ['sign']);
  const payload = JSON.stringify({role:'admin', exp: Date.now()+12*3600*1000});
  const b64 = btoa(unescape(encodeURIComponent(payload))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(b64));
  const s64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  return b64+'.'+s64;
}
async function dashVerify(request, env) {
  const auth = request.headers.get('Authorization')||'';
  const tok = auth.startsWith('Bearer ') ? auth.slice(7) : (new URL(request.url)).searchParams.get('jwt')||'';
  if (!tok) return false;
  try {
    const [b64,s64]=tok.split('.');
    const enc=new TextEncoder();
    const key=await crypto.subtle.importKey('raw',enc.encode((env.CP_SECRET||'cardpath-dev-secret')+'-dash'),{name:'HMAC',hash:'SHA-256'},false,['verify']);
    const sig=Uint8Array.from(atob(s64.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
    const ok=await crypto.subtle.verify('HMAC',key,sig,enc.encode(b64));
    if(!ok) return false;
    const data=JSON.parse(decodeURIComponent(escape(atob(b64.replace(/-/g,'+').replace(/_/g,'/')))));
    return data.role==='admin' && Date.now()<data.exp;
  } catch(e){ return false; }
}
async function sha256hex(s){ const d=await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,'0')).join(''); }
async function handleDashLogin(request, env){
  const ip=(request.headers.get('cf-connecting-ip')||'x').slice(0,40);
  const now=Date.now();
  // rate limit via D1 (konsisten antar isolate): 5/min per IP
  try{
    const row=await env.DB.prepare('SELECT cnt, window_start FROM login_throttle WHERE ip=?').bind(ip).first();
    if(row && now-row.window_start<60000){
      if(row.cnt>=5) return json({ok:false,error:'rate_limited'},429);
      await env.DB.prepare('UPDATE login_throttle SET cnt=cnt+1 WHERE ip=?').bind(ip).run();
    } else {
      await env.DB.prepare('INSERT INTO login_throttle (ip,cnt,window_start) VALUES (?,1,?) ON CONFLICT(ip) DO UPDATE SET cnt=1, window_start=excluded.window_start').bind(ip,now).run();
    }
  }catch(e){} // fail-open (kalau throttle table gagal, tetap proses)
  let body; try{ body=await request.json(); }catch(e){ return json({ok:false},400); }
  const pwHash=await sha256hex(body.password||'');
  const want=await sha256hex(env.CP_DASH_PASSWORD||'cardpath-dash-default');
  if(pwHash!==want) return json({ok:false,error:'bad_password'},401);
  return json({ok:true, token: await dashToken(env)});
}
// /api/track upgrade: session events → session_summary upsert
async function trackSession(env, body){
  const sid=body.session_id; if(!sid) return;
  const device=body.device||'';
  const country=body.country||'';
  const utm=body.utm||{};
  const ev=body.event;
  if(ev==='session_start'){
    await env.DB.prepare('INSERT INTO session_summary (session_id, lid, utm_source, utm_campaign, utm_content, device, country, started_ts, last_ts, pageviews) VALUES (?,?,?,?,?,?,?,?,?,1) ON CONFLICT(session_id) DO NOTHING')
      .bind(sid, body.lid||null, utm.utm_source||null, utm.utm_campaign||null, utm.utm_content||null, device, country, Date.now(), Date.now()).run();
  } else {
    const sets=['last_ts=?']; const vals=[Date.now()];
    if(ev==='page_view'){ sets.push('pageviews=pageviews+1'); }
    if(ev==='scroll_depth' && body.depth){ sets.push('max_scroll_pct=MAX(max_scroll_pct,?)'); vals.push(body.depth); }
    if(ev==='heartbeat' && body.engaged_sec){ sets.push('engaged_sec=engaged_sec+?'); vals.push(body.engaged_sec); }
    if(ev==='quiz_complete'){ sets.push('quiz_completed=1'); }
    if(ev==='gate_completed'){ sets.push('gate_completed=1'); }
    if(ev==='jump_click'){ sets.push('jumped=1'); }
    if(ev==='outbound_click'){ sets.push('outbound=1'); }
    vals.push(sid);
    try{ await env.DB.prepare('UPDATE session_summary SET '+sets.join(', ')+' WHERE session_id=?').bind(...vals).run(); }catch(e){}
  }
}
// funnel_events insert dengan kolom baru
async function insertFunnel(env, body, extra){
  await env.DB.prepare('INSERT INTO funnel_events (ts, lid, event, sub, page, utm_source, utm_campaign, utm_content, utm_term, session_id, device, country, meta_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .bind(Date.now(), body.lid||null, body.event||'unknown', body.sub||null, body.page||null,
      (body.utm&&body.utm.utm_source)||null, (body.utm&&body.utm.utm_campaign)||null,
      (body.utm&&body.utm.utm_content)||null, (body.utm&&body.utm.utm_term)||null,
      body.session_id||null, body.device||null, body.country||null,
      JSON.stringify(body.data||{})).run();
}
// /api/dash/:panel — aggregation JSON v2
async function q(env, sql, ...binds){ const r=await env.DB.prepare(sql).bind(...binds).all(); return r.results||[]; }
async function handleDash(request, env, path, url){
  if(!await dashVerify(request, env)) return json({ok:false,error:'unauthorized'},401);
  const panel=path.replace('/api/dash/','');
  const p=new URLSearchParams(url.search);
  const range=parseInt(p.get('range')||'7',10); const since=Date.now()-range*86400000;
  const src=p.get('source')||''; const dev=p.get('device')||'';
  const pf=[]; let srcF='', devF='';
  if(src){srcF=' AND utm_source=?'; pf.push(src);}
  if(dev){devF=' AND device=?'; pf.push(dev);}
  const csv=p.get('format')==='csv';
  const asCsv=(rows)=>{ if(!rows||!rows.length) return json({ok:true, csv:''});
    const cols=Object.keys(rows[0]);
    const esc=v=>{ if(v==null)return''; const s=String(v); return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s; };
    return new Response(cols.join(',')+'\n'+rows.map(r=>cols.map(c=>esc(r[c])).join(',')).join('\n'),
      {headers:{'Content-Type':'text/csv','Content-Disposition':'attachment; filename="'+panel+'_'+range+'d.csv"'}});
  };
  try{
    // ---- shared: campaign leaderboard rows (dipakai p0 & trend)
    if(panel==='p0'){
      let cur={currency:'USD', fx_rate:16000};
      try{ const s=await q(env,"SELECT key,value FROM settings WHERE key IN ('currency','fx_rate')");
        s.forEach(x=>{ try{ cur[x.key]=JSON.parse(x.value); }catch(e){} });
      }catch(e){}
      const spend=await q(env,`SELECT platform, campaign_name camp, SUM(spend_usd) spend, SUM(clicks) clicks, SUM(impressions) impr, MAX(utm_campaign) utmc FROM spend_events WHERE ts>=? GROUP BY platform, campaign_name ORDER BY spend DESC`,since);
      const sess=await q(env,`SELECT utm_campaign camp, COUNT(*) sessions, SUM(quiz_completed) qc, SUM(gate_completed) gc, SUM(jumped) j, SUM(outbound) outb, SUM(MIN(engaged_sec, CAST((last_ts-started_ts)/1000 AS INTEGER))) eng, SUM(max_scroll_pct) scr, SUM(pageviews) pv FROM session_summary WHERE started_ts>=? ${srcF} ${devF} GROUP BY utm_campaign`,since,...pf);
      // drill-down levels
      if(p.get('level')==='content'){
        const camp=p.get('campaign')||'';
        const rows=await q(env,`SELECT utm_content content, COUNT(*) sessions, SUM(quiz_completed) qc, SUM(jumped) j, SUM(outbound) outb, SUM(MIN(engaged_sec, CAST((last_ts-started_ts)/1000 AS INTEGER))) eng FROM session_summary WHERE started_ts>=? AND utm_campaign=? ${devF} GROUP BY utm_content ORDER BY sessions DESC`,since,camp,...(dev?[dev]:[]));
        return csv?asCsv(rows):json({ok:true, panel, drill:'content', rows, range});
      }
      if(p.get('level')==='term'){
        const camp=p.get('campaign')||'';
        const rows=await q(env,`SELECT utm_term term, COUNT(*) sessions, SUM(quiz_completed) qc, SUM(jumped) j, SUM(outbound) outb, SUM(engaged_sec) eng FROM funnel_events fe WHERE fe.ts>=? AND fe.event='session_start' AND utm_campaign=? GROUP BY utm_term`,since,camp);
        return csv?asCsv(rows):json({ok:true, panel, drill:'term', rows, range});
      }
      // DERIVED revenue per campaign: share impresi (via lid→campaign bridge) × total AdSense earning
      let derived={};
      try{
        const ad=await q(env,`SELECT SUM(earning_usd) rev FROM adsense_daily WHERE date>=?`,new Date(since).toISOString().slice(0,10));
        const totalRev=ad[0]&&ad[0].rev||0;
        if(totalRev>0){
          const impr=await q(env,`SELECT s.utm_campaign camp, COUNT(a.id) c
            FROM ad_impressions a JOIN session_summary s ON a.lid=s.lid
            WHERE a.ts>=? AND s.started_ts>=? ${srcF} ${devF} GROUP BY s.utm_campaign`,since,since,...pf);
          const tot=impr.reduce((a,b)=>a+b.c,0)||1;
          impr.forEach(x=>{derived[x.camp]=totalRev*(x.c/tot)});
        }
      }catch(e){}
      // daily trend per top campaign (sparkline source)
      const trend=await q(env,`SELECT date(started_ts/1000,'unixepoch') day, utm_campaign camp, COUNT(*) sessions, SUM(outbound) outb FROM session_summary WHERE started_ts>=? GROUP BY day, utm_campaign ORDER BY day`,since);
      return csv?asCsv([...spend.map(s=>({type:'spend',...s})),...sess.map(s=>({type:'session',...s}))]):json({ok:true, panel, spend, sessions:sess, trend, derived, currency:cur, range});
    }
    if(panel==='p1'){ // cohort matrix + fit/intent histogram
      const camp=p.get('campaign')||''; const campF=camp?' AND utm_campaign=?':'';
      const bindc=camp?[camp]:[];
      const byPos=await q(env,`SELECT meta_json FROM results WHERE ts>=?`,since);
      let rows=byPos.map(r=>{try{return JSON.parse(r.meta_json)}catch(e){return null}}).filter(Boolean);
      const agg={};
      rows.forEach(m=>{
        const pos=m.cq_pos||'?'; const tim=m.cq_timing||'?';
        const key=pos+'|'+tim;
        if(!agg[key]) agg[key]={pos,timing:tim,n:0,jumped:0,fit:[],intent:[]};
        agg[key].n++; if(m.jump) agg[key].jumped++;
        if(m.fit!=null)agg[key].fit.push(m.fit); if(m.intent!=null)agg[key].intent.push(m.intent);
      });
      const matrix=Object.values(agg).sort((a,b)=>b.n-a.n).slice(0,40).map(x=>({...x,avgFit:x.fit.length?(x.fit.reduce((a,b)=>a+b,0)/x.fit.length).toFixed(1):null,avgIntent:x.intent.length?(x.intent.reduce((a,b)=>a+b,0)/x.intent.length).toFixed(1):null,fit:undefined,intent:undefined}));
      // fit/intent histogram
      const fitBins={}; const intentBins={};
      rows.forEach(m=>{
        if(m.fit!=null){const b=Math.floor(m.fit/5)*5; fitBins[b]=(fitBins[b]||0)+1;}
        if(m.intent!=null){const b=Math.floor(m.intent/5)*5; intentBins[b]=(intentBins[b]||0)+1;}
      });
      const hist={fit:Object.entries(fitBins).map(([b,c])=>({bin:+b,count:c})).sort((a,b)=>a.bin-b.bin),
                  intent:Object.entries(intentBins).map(([b,c])=>({bin:+b,count:c})).sort((a,b)=>a.bin-b.bin)};
      return csv?asCsv(matrix):json({ok:true, panel, matrix, hist, total:rows.length, range});
    }
    if(panel==='p2'){ // funnel + quiz duration histogram
      // B1 dedup: event once-per-user pakai COUNT(DISTINCT lid) — quiz_complete dsb tercatat dari 2 sumber
      // (app.js scoring + track.js client); page_view/match_slide tetap raw COUNT (multi per user sah)
      const ONCE=new Set(['quiz_start','quiz_complete','gate_completed','email_optin','jump_click','sub2_landing','outbound_click','session_start']);
      const raw=await q(env,`SELECT event, lid, COUNT(*) c FROM funnel_events WHERE ts>=? ${srcF} GROUP BY event, lid`,since,...pf);
      const agg={};
      raw.forEach(r=>{ if(!agg[r.event]) agg[r.event]=0; agg[r.event]+=r.c; });
      const dedup={};
      raw.forEach(r=>{ if(ONCE.has(r.event)){ if(r.lid) dedup[r.event]=(dedup[r.event]||0)+1; else dedup[r.event]=(dedup[r.event]||0)+r.c; } else dedup[r.event]=(dedup[r.event]||0)+r.c; });
      const f=Object.entries(dedup).map(([event,c])=>({event, c}));
      const dur=await q(env,`SELECT meta_json FROM results WHERE ts>=?`,since);
      const bins={};
      dur.map(r=>{try{return JSON.parse(r.meta_json)}catch(e){return null}}).filter(Boolean).forEach(m=>{
        const sec=(m.elapsed_ms||0)/1000;
        const b=sec<15?'<15s':sec<30?'15-30s':sec<60?'30-60s':sec<120?'1-2m':sec<300?'2-5m':'5m+';
        bins[b]=(bins[b]||0)+1;});
      const order=['<15s','15-30s','30-60s','1-2m','2-5m','5m+'];
      const duration=order.filter(o=>bins[o]).map(o=>({bin:o,count:bins[o]}));
      return csv?asCsv(f):json({ok:true, panel, funnel:f, duration, range});
    }
    if(panel==='p3'){ // ad health + latency p50/p95 + daily trend
      const health=await q(env,`SELECT slot, COUNT(*) requested, SUM(CASE WHEN is_empty=0 THEN 1 ELSE 0 END) rendered, SUM(CASE WHEN ev='viewable' THEN 1 ELSE 0 END) viewable FROM ad_impressions WHERE ts>=? GROUP BY slot`,since);
      const win=await q(env,`SELECT line_item_id, COUNT(*) c FROM ad_impressions WHERE ts>=? AND is_empty=0 GROUP BY line_item_id ORDER BY c DESC LIMIT 20`,since);
      // latency: from meta_json ev=rendered
      const lat=await q(env,`SELECT meta_json FROM ad_impressions WHERE ts>=? AND ev='rendered' LIMIT 5000`,since);
      const lats=lat.map(r=>{try{return JSON.parse(r.meta_json).latency_ms}catch(e){return null}}).filter(x=>x!=null&&x>=0).sort((a,b)=>a-b);
      const pick=f=>lats.length?lats[Math.min(lats.length-1,Math.floor(f*lats.length))]:null;
      const latency={p50:pick(0.5),p95:pick(0.95),n:lats.length};
      const trend=await q(env,`SELECT date(ts/1000,'unixepoch') day, COUNT(*) requested, SUM(CASE WHEN is_empty=0 THEN 1 ELSE 0 END) rendered, SUM(CASE WHEN ev='viewable' THEN 1 ELSE 0 END) viewable FROM ad_impressions WHERE ts>=? GROUP BY day ORDER BY day`,since);
      return csv?asCsv(health):json({ok:true, panel, health, winners:win, latency, trend, range});
    }
    if(panel==='p4'){ // KV matrix + derived eCPM
      const rows=await q(env,`SELECT kv_json, COUNT(*) impr, SUM(CASE WHEN is_empty=0 THEN 1 ELSE 0 END) rendered, SUM(CASE WHEN advertiser_id IS NOT NULL AND advertiser_id!='' AND advertiser_id!='0' THEN 1 ELSE 0 END) premium FROM ad_impressions WHERE ts>=? GROUP BY kv_json ORDER BY impr DESC LIMIT 60`,since);
      const adsense=await q(env,`SELECT date, SUM(earning_usd) rev, SUM(impressions) impr FROM adsense_daily WHERE date>=? GROUP BY date`,new Date(since).toISOString().slice(0,10));
      const totalRev=adsense.reduce((a,b)=>a+(b.rev||0),0);
      const totalImpr=rows.reduce((a,b)=>a+(b.impr||0),0)||1;
      const matrix=rows.map(x=>{let kv={};try{kv=JSON.parse(x.kv_json||'{}')}catch(e){}
        return {...x, combo: Object.entries(kv).map(e=>e[0]+'='+e[1]).join(' · ')||'(none)',
          eCPM: totalRev>0 ? +((totalRev*(x.impr/totalImpr))/(x.impr/1000)).toFixed(2) : null}});
      return csv?asCsv(matrix):json({ok:true, panel, matrix, adsenseDays:adsense.length, range});
    }
    if(panel==='p5'){ // quality + alerts + fraud signals
      const bots=await q(env,`SELECT meta_json FROM results WHERE ts>=?`,since);
      let bt=0,total=0;
      bots.forEach(r=>{try{const m=JSON.parse(r.meta_json);total++;if(m.bot)bt++}catch(e){}});
      // fraud: lid dgn >3 sessions, session dgn >8 pageviews
      const susLid=await q(env,`SELECT lid, COUNT(*) c FROM session_summary WHERE started_ts>=? GROUP BY lid HAVING c>3 ORDER BY c DESC LIMIT 20`,since);
      const susSess=await q(env,`SELECT session_id, pageviews, max_scroll_pct FROM session_summary WHERE started_ts>=? AND pageviews>10 ORDER BY pageviews DESC LIMIT 20`,since);
      const alerts=await q(env,`SELECT * FROM alerts_log WHERE ack=0 ORDER BY ts DESC LIMIT 50`);
      return csv?asCsv(alerts):json({ok:true, panel, bot_rate: total? bt/total:0, bot_total: total, fraudLids:susLid, fraudSessions:susSess, alerts, range});
    }
    if(panel==='p6'){ // editorial: pageviews + engaged + scroll per page (via session bridge)
      const pv=await q(env,`SELECT page, COUNT(*) pageviews FROM funnel_events WHERE ts>=? AND event='page_view' AND sub='sub2' GROUP BY page ORDER BY pageviews DESC LIMIT 50`,since);
      const quality=await q(env,`SELECT f.page, COUNT(DISTINCT f.session_id) sessions, SUM(MIN(s.engaged_sec, CAST((s.last_ts-s.started_ts)/1000 AS INTEGER))) eng, SUM(s.max_scroll_pct) scr
        FROM funnel_events f JOIN session_summary s ON f.session_id=s.session_id
        WHERE f.ts>=? AND f.event='page_view' AND f.sub='sub2'
        GROUP BY f.page ORDER BY sessions DESC LIMIT 50`,since);
      return csv?asCsv(pv):json({ok:true, panel, pages:pv, quality, range});
    }
    if(panel==='ads'){ // Ad Slot Studio: slots + performa per slot + advertisers
      if(request.method==='POST'){
        const body=await request.json().catch(()=>({}));
        const act=body.action;
        if(act==='toggle'){
          await env.DB.prepare('UPDATE ad_slots SET enabled=? WHERE slot_id=?').bind(body.enabled?1:0, body.slot_id).run();
        } else if(act==='add'){
          await env.DB.prepare('INSERT OR REPLACE INTO ad_slots (slot_id,unit_path,page_pattern,position,sizes_json,min_height,enabled,updated_ts) VALUES (?,?,?,?,?,?,?,?)')
            .bind(String(body.slot_id||'').slice(0,40), String(body.unit_path||'').slice(0,120), String(body.page_pattern||'/*').slice(0,80),
                  String(body.position||'top').slice(0,20), JSON.stringify(body.sizes||[]), parseInt(body.min_height)||90, 1, Date.now()).run();
        } else if(act==='delete'){
          await env.DB.prepare('DELETE FROM ad_slots WHERE slot_id=?').bind(body.slot_id).run();
        } else return json({ok:false,error:'bad_action'},400);
        const slots=await q(env,'SELECT * FROM ad_slots ORDER BY slot_id');
        return json({ok:true, slots});
      }
      const slots=await q(env,'SELECT * FROM ad_slots ORDER BY slot_id');
      const perf=await q(env,`SELECT slot, COUNT(*) requested,
        SUM(CASE WHEN is_empty=0 THEN 1 ELSE 0 END) rendered,
        SUM(CASE WHEN ev='viewable' THEN 1 ELSE 0 END) viewable
        FROM ad_impressions WHERE ts>=? GROUP BY slot`,since);
      const adv=await q(env,`SELECT slot, advertiser_id, COUNT(*) c FROM ad_impressions
        WHERE ts>=? AND is_empty=0 AND advertiser_id IS NOT NULL AND advertiser_id!='' AND advertiser_id!='0'
        GROUP BY slot, advertiser_id ORDER BY c DESC LIMIT 40`,since);
      // KV coverage: untuk tiap KV key, % hasil quiz yang membawa nilai valid (dari results.meta_json)
      const kvreg=await q(env,'SELECT key_name, values_json FROM kv_key_registry');
      const resRows=await q(env,'SELECT meta_json FROM results WHERE ts>=? LIMIT 5000',since);
      const kvStats={};
      kvreg.forEach(k=>{
        let vals=[]; try{ vals=JSON.parse(k.values_json||'[]'); }catch(e){}
        kvStats[k.key_name]={valid:vals, has:0, hasNot:0, top:{}};
      });
      resRows.forEach(r=>{ try{
        const m=JSON.parse(r.meta_json||'{}');
        kvreg.forEach(k=>{
          const kn=k.key_name;
          const st=kvStats[kn]; if(!st) return;
          let v = m[kn];
          if (v==null && kn==='cq_match') v = m.m;
          if (kn==='odds') v = m.o;
          if (v!=null && v!=='') { st.has++; const vs=String(v); st.top[vs]=(st.top[vs]||0)+1; }
          else st.hasNot++;
        });
      }catch(e){} });
      Object.keys(kvStats).forEach(kn=>{
        const st=kvStats[kn];
        st.coverage = (st.has+st.hasNot)? Math.round(st.has/(st.has+st.hasNot)*100) : 0;
        st.topList = Object.entries(st.top).sort((a,b)=>b[1]-a[1]).slice(0,5).map(x=>({v:x[0],c:x[1]}));
        st.inEnum = st.topList.filter(x=>st.valid.indexOf(x.v)!==-1).length;
      });
      const lat=await q(env,`SELECT slot, meta_json FROM ad_impressions WHERE ts>=? AND ev='rendered' LIMIT 4000`,since);
      const lats={};
      lat.forEach(r=>{ try{ const m=JSON.parse(r.meta_json||'{}'); if(m.latency_ms!=null){ (lats[r.slot]=lats[r.slot]||[]).push(m.latency_ms);} }catch(e){} });
      const latency={};
      Object.keys(lats).forEach(s=>{ const arr=lats[s].sort((a,b)=>a-b);
        latency[s]={p50:arr[Math.floor(arr.length*0.5)], p95:arr[Math.floor(arr.length*0.95)], n:arr.length}; });
      return csv?asCsv(slots):json({ok:true, panel:'ads', slots, perf, advertisers:adv, latency, kvStats, range});
    }
    if(panel==='site'){ // Website Studio: injections + menus + articles
      if(request.method==='POST'){
        const b=await request.json().catch(()=>({}));
        const act=b.action;
        if(act==='inj_save'){
          await env.DB.prepare('INSERT INTO site_injections (scope,placement,code,enabled,note,updated_ts) VALUES (?,?,?,?,?,?)')
            .bind(String(b.scope||'both').slice(0,8), String(b.placement||'head').slice(0,8),
                  String(b.code||'').slice(0,20000), b.enabled===false?0:1, String(b.note||'').slice(0,120), Date.now()).run();
        } else if(act==='inj_toggle'){
          await env.DB.prepare('UPDATE site_injections SET enabled=? WHERE id=?').bind(b.enabled?1:0, b.id).run();
        } else if(act==='inj_del'){
          await env.DB.prepare('DELETE FROM site_injections WHERE id=?').bind(b.id).run();
        } else if(act==='menu_save'){
          await env.DB.prepare('DELETE FROM site_menus WHERE menu=?').bind(b.menu).run();
          let sort=0;
          for(const it of (b.items||[])){
            await env.DB.prepare('INSERT INTO site_menus (menu,label,href,sort,enabled) VALUES (?,?,?,?,?)')
              .bind(b.menu, String(it.label||'').slice(0,60), String(it.href||'').slice(0,160), sort++, it.enabled===false?0:1).run();
          }
        } else if(act==='art_save'){
          const slug=String(b.slug||'').toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,80);
          if(!slug) return json({ok:false,error:'bad_slug'},400);
          await env.DB.prepare(`INSERT INTO articles (slug,title,meta_desc,body_md,faq_json,sub,updated_ts,published)
            VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(slug) DO UPDATE SET title=excluded.title, meta_desc=excluded.meta_desc,
            body_md=excluded.body_md, faq_json=excluded.faq_json, sub=excluded.sub, updated_ts=excluded.updated_ts, published=excluded.published`)
            .bind(slug, String(b.title||'Untitled').slice(0,140), String(b.meta_desc||'').slice(0,300),
                  String(b.body_md||'').slice(0,120000), b.faq_json||'[]', b.sub||'sub2', Date.now(), b.published===false?0:1).run();
          return json({ok:true, slug});
        } else if(act==='art_del'){
          await env.DB.prepare('DELETE FROM articles WHERE slug=?').bind(b.slug).run();
        } else if(act==='art_get'){
          const row=await env.DB.prepare('SELECT * FROM articles WHERE slug=?').bind(b.slug).first();
          return json({ok:true, article:row});
        } else return json({ok:false,error:'bad_action'},400);
        const inj=await q(env,'SELECT * FROM site_injections ORDER BY id DESC LIMIT 50');
        const menus=await q(env,'SELECT * FROM site_menus ORDER BY menu, sort');
        const arts=await q(env,'SELECT slug,title,meta_desc,sub,updated_ts,published FROM articles ORDER BY updated_ts DESC LIMIT 100');
        return json({ok:true, injections:inj, menus, articles:arts});
      }
      const inj=await q(env,'SELECT * FROM site_injections ORDER BY id DESC LIMIT 50');
      const menus=await q(env,'SELECT * FROM site_menus ORDER BY menu, sort');
      const arts=await q(env,'SELECT slug,title,meta_desc,sub,updated_ts,published FROM articles ORDER BY updated_ts DESC LIMIT 100');
      return json({ok:true, panel:'site', injections:inj, menus, articles:arts});
    }
    if(panel==='settings'){
      if(request.method==='POST'){
        const b=await request.json().catch(()=>({}));
        for(const [k,v] of Object.entries(b||{})){
          if(!/^[a-z_]{3,40}$/.test(k)) continue;
          await env.DB.prepare('INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(k, JSON.stringify(v)).run();
        }
        return json({ok:true, settings: await q(env,'SELECT key, value FROM settings')});
      }
      return json({ok:true, settings: await q(env,'SELECT key, value FROM settings')});
    }
    return json({ok:false,error:'unknown_panel'},404);
  }catch(e){ return json({ok:false,error:String(e).slice(0,200)},500); }
}

async function handleDashSettings(request, env){
  if(!await dashVerify(request, env)) return json({ok:false,error:'unauthorized'},401);
  let body; try{ body=await request.json(); }catch(e){ return json({ok:false},400); }
  for(const [k,v] of Object.entries(body||{})){
    if(!/^[a-z_]{3,40}$/.test(k)) continue; // whitelist key format
    await env.DB.prepare('INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value')
      .bind(k, JSON.stringify(v)).run();
  }
  return json({ok:true});
}
async function handleDashAck(request, env){
  if(!await dashVerify(request, env)) return json({ok:false,error:'unauthorized'},401);
  let body; try{ body=await request.json(); }catch(e){ return json({ok:false},400); }
  await env.DB.prepare('UPDATE alerts_log SET ack=1 WHERE id=?').bind(body.alertId).run();
  return json({ok:true});
}


// ==================== SCHEDULED: SPEND INGESTION + ALERT ENGINE (PART 3 & 4) ====================
async function ingestMetaSpend(env){
  const tok = env.META_ACCESS_TOKEN; if(!tok) return {skipped:'no token'};
  const acct = env.META_AD_ACCOUNT || 'act_1559699858691374';
  const url = `https://graph.facebook.com/v21.0/${acct}/insights?level=campaign&fields=spend,clicks,impressions,campaign_name&date_preset=yesterday&access_token=${tok}`;
  const r = await fetch(url); const d = await r.json();
  if(!d.data){
    let errs=0;
    try{ await env.DB.prepare("INSERT INTO settings (key,value) VALUES ('ingestion_errors','1') ON CONFLICT(key) DO UPDATE SET value=CAST(CAST(value AS INTEGER)+1 AS TEXT)").run();
      const er=await env.DB.prepare("SELECT value FROM settings WHERE key='ingestion_errors'").first(); errs=parseInt(er.value)||0;
    }catch(e){}
    if(errs>=3){
      try{ await env.DB.prepare("INSERT INTO settings (key,value) VALUES ('ingestion_paused','true') ON CONFLICT(key) DO UPDATE SET value='true'").run();
        await env.DB.prepare('INSERT INTO alerts_log (ts,type,severity,message) VALUES (?,?,?,?)').bind(Date.now(),'ingest_pause','high','Meta ingestion paused — 3 error beruntun (token expired?)').run();
      }catch(e){}
    }
    return {error: JSON.stringify(d).slice(0,200), errs};
  }
  try{ await env.DB.prepare("INSERT INTO settings (key,value) VALUES ('ingestion_errors','0') ON CONFLICT(key) DO UPDATE SET value='0'").run(); }catch(e){}
  // pause check
  let paused=false; try{ const p=await env.DB.prepare("SELECT value FROM settings WHERE key='ingestion_paused'").first(); paused=p&&JSON.parse(p.value)===true; }catch(e){}
  if(paused) return {skipped:'paused'};
  let n=0;
  for(const row of d.data){
    const cid = row.campaign_id || row.id; if(!cid) continue;
    // map ke utm via platform_campaign_map (atau fallback nama campaign)
    let map=null; try{ map = (await env.DB.prepare('SELECT utm_source, utm_campaign FROM platform_campaign_map WHERE campaign_id=?').bind(cid).first()) || null; }catch(e){}
    const spend=parseFloat(row.spend||'0'); if(!(spend>=0)) continue; // validasi
    const clicks=parseInt(row.clicks||'0',10)||0, impr=parseInt(row.impressions||'0',10)||0;
    const day=new Date(Date.now()-86400000).toISOString().slice(0,10);
    // idempotent + guard: jangan overwrite existing>0 dengan 0/partial
    let ex=null; try{ ex=await env.DB.prepare("SELECT spend_usd FROM spend_events WHERE platform='meta' AND campaign_id=? AND date(ts/1000,'unixepoch')=?").bind(cid,day).first(); }catch(e){}
    if(ex && ex.spend_usd>0 && spend===0){ continue; }
    await env.DB.prepare('DELETE FROM spend_events WHERE platform=? AND campaign_id=? AND date(ts/1000,\'unixepoch\')=?').bind('meta',cid,day).run();
    await env.DB.prepare('INSERT INTO spend_events (ts,platform,campaign_id,campaign_name,utm_source,utm_campaign,spend_usd,clicks,impressions) VALUES (?,?,?,?,?,?,?,?,?)')
      .bind(Date.parse(day+'T00:00:00Z'),'meta',cid,row.campaign_name||cid,(map&&map.utm_source)||'metaa',(map&&map.utm_campaign)||row.campaign_name||cid,spend,clicks,impr).run();
    n++;
  }
  return {inserted:n};
}
async function runAlertEngine(env){
  const alerts=[];
  const cfg = async (k,def)=>{ try{ const r=await env.DB.prepare('SELECT value FROM settings WHERE key=?').bind(k).first(); return r?JSON.parse(r.value):def; }catch(e){ return def; } };
  const spendCap = await cfg('budget_cap_usd',500);
  const botTh = await cfg('bot_rate_threshold',0.2);
  // 1) bot rate per campaign 24h
  const bots=await env.DB.prepare('SELECT meta_json FROM results WHERE ts>=?').bind(Date.now()-86400000).all();
  let bt=0,bn=0; (bots.results||[]).forEach(r=>{ try{ const m=JSON.parse(r.meta_json); bn++; if(m.bot) bt++; }catch(e){} });
  if(bn>=10 && bt/bn>botTh) alerts.push({type:'bot_rate',severity:'high',message:`Bot rate ${(bt/bn*100).toFixed(0)}% (${bt}/${bn}) > threshold dalam 24h`});
  // 2) no-fill >40% 2 jam beruntun per slot
  const nf=await env.DB.prepare(`SELECT slot, COUNT(*) req, SUM(CASE WHEN is_empty=1 THEN 1 ELSE 0 END) emp FROM ad_impressions WHERE ts>=? AND ev='rendered' GROUP BY slot`).bind(Date.now()-7200000).all();
  (nf.results||[]).forEach(r=>{ if(r.req>=20 && r.emp/r.req>0.4) alerts.push({type:'no_fill',severity:'medium',message:`No-fill ${(r.emp/r.req*100).toFixed(0)}% di slot ${r.slot} (2 jam, ${r.req} req)`}); });
  // 3) spend > budget cap hari ini
  const sp=await env.DB.prepare(`SELECT SUM(spend_usd) s FROM spend_events WHERE date(ts/1000,'unixepoch')=date('now')`).first();
  if(sp && sp.s>spendCap) alerts.push({type:'budget',severity:'high',message:`Spend hari ini $${sp.s.toFixed(2)} > cap $${spendCap}`});
  // 4) data gap: ada spend hari ini tapi tidak ada page_view > 2 jam
  if(sp && sp.s>0){
    const pv=await env.DB.prepare('SELECT COUNT(*) c FROM funnel_events WHERE event=? AND ts>=?').bind('page_view',Date.now()-7200000).first();
    if(pv && pv.c===0) alerts.push({type:'data_gap',severity:'high',message:'Ada spend hari ini tapi 0 page_view 2 jam terakhir — tracking broken?'});
  }
  for(const a of alerts){ await env.DB.prepare('INSERT INTO alerts_log (ts,type,severity,message) VALUES (?,?,?,?)').bind(Date.now(),a.type,a.severity,a.message).run(); }
  // telegram (kalau secret ada)
  if(alerts.length && env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID){
    try{ await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:env.TELEGRAM_CHAT_ID,text:'⚠️ CardPath Alerts:\n'+alerts.map(a=>`[${a.severity}] ${a.message}`).join('\n')})}); }catch(e){}
  }
  return {alerts:alerts.length};
}


function json(obj, status=200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (path === '/health') return json({ok:true, service:'metrics-hq'});
    if (path === '/admin/login' && request.method === 'POST') return handleDashLogin(request, env);
    if (path.startsWith('/api/dash/') && (request.method === 'GET' || request.method === 'POST')) return handleDash(request, env, path, url);
    if (path === '/api/dash/ack' && request.method === 'POST') return handleDashAck(request, env);
    if (path === '/api/dash/settings' && request.method === 'POST') return handleDashSettings(request, env);
    if (path === '/admin/dashboard' || path === '/' || path === '/admin') {
      const dashResp = await env.ASSETS.fetch(new URL('/admin-dashboard.html', url.origin));
      const r2 = new Response(dashResp.body, dashResp);
      r2.headers.set('X-Robots-Tag','noindex, nofollow');
      return r2;
    }
    return env.ASSETS.fetch(request);
  },
  async scheduled(controller, env, ctx) {
    ctx.waitUntil((async () => {
      // single hourly cron: ingestion tiap 6 jam (timestamp check), alert tiap jam
      try {
        const last=await env.DB.prepare("SELECT value FROM settings WHERE key='last_ingest_ts'").first();
        const lastTs=last?parseInt(last.value)||0:0;
        if (Date.now()-lastTs >= 6*3600*1000) {
          const r1 = await ingestMetaSpend(env);
          await env.DB.prepare("INSERT INTO settings (key,value) VALUES ('last_ingest_ts',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(String(Date.now())).run();
          console.log('spend ingest:', JSON.stringify(r1));
        } else console.log('ingest skipped (interval)');
      } catch(e){ console.log('ingest err', String(e).slice(0,200)); }
      try { const r2 = await runAlertEngine(env); console.log('alerts:', JSON.stringify(r2)); } catch(e){ console.log('alert err', String(e).slice(0,200)); }
    })());
  },
};

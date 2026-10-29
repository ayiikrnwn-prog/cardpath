// X1: cookie cp_lid lintas-subdomain (fallback navigasi tanpa URL param)
function applyLidCookie(headers, url) {
  const lid = url.searchParams.get('lid');
  if (lid && /^cp_[a-z0-9]+$/.test(lid)) {
    headers.append('Set-Cookie', `cp_lid=${lid}; Domain=.seputar-ntt.com; Max-Age=2592000; Path=/; Secure; SameSite=Lax`);
  }
  return headers;
}
// CardPath Worker — static assets + API routes + server-side scoring (S1-S3 fix)
// v4.3 engine port: scoring server-side, token-based result validation

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS untuk API (same-origin saja sebenarnya, tapi safety)
    const corsHeaders = {
      'Access-Control-Allow-Origin': `https://${url.hostname}`,
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

    // ---------- API ROUTES ----------
    if (path === '/api/quiz' && request.method === 'POST') {
      return handleQuizSubmit(request, env);
    }
    if (path === '/api/track' && request.method === 'POST') {
      return handleTrack(request, env, ctx);
    }
    if (path === '/api/email' && request.method === 'POST') {
      return handleEmail(request, env);
    }
    if (path === '/api/adlog' && request.method === 'POST') {
      return handleAdlog(request, env);
    }
    if (path === '/ads.txt' || path === '/ads.txt/') {
      return new Response(
        'google.com, pub-3551949770007106, DIRECT, f08c47fec0942fa0\n' +
        'google.com, pub-6363483804439988, DIRECT, f08c47fec0942fa0\n',
        {headers: {'Content-Type': 'text/plain'}});
    }
    if (path === '/api/ipstatus' && request.method === 'GET') {
      const ip = request.headers.get('cf-connecting-ip') || 'unknown';
      const hour_ago = Date.now() - 3600000;
      let n = 0;
      try {
        const row = await env.DB.prepare("SELECT COUNT(*) as c FROM funnel_events WHERE event='quiz_complete' AND meta_json LIKE ?").bind('%'+ip+'%').first();
        n = row ? row.c : 0;
      } catch(e) {}
      return json({submissions_last_hour: n, watchlisted: n >= 3});
    }
    if (path === '/api/validate' && request.method === 'GET') {
      // Validasi token result (dipanggil result page utk verifikasi server-side scoring)
      return handleValidate(request, env);
    }

    // ---------- Opsi A: quiz flow = SUB1 ----------
    if (path.startsWith('/start/')) {
      // Domain card.* terikat ke worker ini (salah bind) → proxy ke farm worker supaya quiz jalan.
      // Setelah domain dipindah ke cardpath-farm, redirect 301 di bawah otomatis aktif utk traffic legacy.
      if (url.hostname.startsWith('card.')) {
      // SUB1 (hostname card.*) → serve assets dari /sub1/* (quiz flow farming, tanpa iklan, API sama di worker ini)
      // C1 fix: canonical extensionless harus serve VERSI BARU + track.js
      // - /start/quiz (no ext) → /sub1/start/quiz.html (bukan index.html legacy!)
      // - semua response HTML di-rewrite utk inject track.js
      let sub1Path = path === '/' ? '/sub1/index.html' : '/sub1' + path;
      if (!sub1Path.endsWith('.html') && !sub1Path.endsWith('.js') && !sub1Path.endsWith('.css') && !sub1Path.endsWith('.txt') && !sub1Path.endsWith('.xml')) {
        // map: /sub1/start/quiz → /sub1/start/quiz.html ; /sub1/start → /sub1/start/index.html
        if (sub1Path.endsWith('/quiz') || sub1Path.endsWith('/result') || sub1Path.endsWith('/index')) sub1Path += '.html';
        else if (sub1Path.endsWith('/quiz.html') || sub1Path.endsWith('/result.html')) { /* ok */ }
        else if (sub1Path.split('/').pop()) sub1Path += '.html';
      }
      if (sub1Path === '/sub1/start.html') sub1Path = '/sub1/start/index.html'; // /start → index
      const assetResp = await env.ASSETS.fetch(new URL(sub1Path + (url.search||''), url.origin), request);
      if (assetResp.status !== 404) {
        const __ct2 = assetResp.headers.get('Content-Type')||'';
        if (__ct2.includes('text/html')) {
          let __h = await assetResp.text();
          if (!__h.includes('track.js')) __h = __h.replace('</head>', '<script src="/track.js" defer></script></head>');
          // GTag conversion (quiz_start) — hanya bila CP_GTAG_ID ter-set & utm_source=gcl*
          if (env.CP_GTAG_ID && (url.searchParams.get('utm_source')||'').startsWith('gcl') && !__h.includes('googletagmanager.com/gtag/js')) {
            const gid = env.CP_GTAG_ID;
            __h = __h.replace('</head>', '<script async src="https://www.googletagmanager.com/gtag/js?id='+gid+'"></scr'+'ipt><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag(\'js\',new Date());gtag(\'config\',\''+gid+'\');</scr'+'ipt></head>');
          }
          const r2 = new Response(__h, assetResp);
          r2.headers.set('Content-Type','text/html; charset=utf-8');
          r2.headers.delete('Content-Length');
          r2.headers.set('Cache-Control','no-store');
          applyLidCookie(r2.headers, url); // X1: first-touch cookie
          // Meta Pixel + QuizStart + GTag (perf agent spec 30 Okt) — config inline, script di akhir body
          const PIXEL_ID = env.CP_PIXEL_ID || '1467955421937228';
          if (PIXEL_ID && !__h.includes('cp-pixel.js')) {
            const cfg = '<script>window.CP_PIXEL={pixelId:\''+PIXEL_ID+'\',gtagId:\''+(env.CP_GTAG_ID||'')+'\',gtagLabel:\''+(env.CP_GTAG_LABEL||'')+'\'};</'+'script>';
            __h = __h.replace('</body>', cfg + '<script src="/cp-pixel.js" defer></scr'+'ipt></body>');
          }
          return r2;
        }
        const r2=new Response(assetResp.body, assetResp); r2.headers.set('Cache-Control','no-store'); return r2;
      }
      // fallback: proxy ke farm worker (bila asset belum tersalin)
      const upstream = await fetch('https://cardpath-farm.ayiikrnwn.workers.dev' + path + (url.search ? '?' + url.searchParams.toString() : ''), request);
      const resp = new Response(upstream.body, upstream);
      resp.headers.set('Cache-Control','no-store');
      return resp;
    }
      return Response.redirect('https://card.seputar-ntt.com' + path + (url.search ? '?' + url.searchParams.toString() : ''), 301);
    }

    // ---------- /go/{card} redirect tracker ----------
    const goMatch = path.match(/^\/go\/([a-z0-9_]+)$/);
    if (goMatch) {
      return handleGo(goMatch[1], url, env);
    }

    // ---------- STATIC ASSETS (dari Assets binding) + inject track.js ----------
    const assetResp = await env.ASSETS.fetch(request);
    const __ct = assetResp.headers.get('Content-Type')||'';
    if (__ct.includes('text/html') && request.method === 'GET') {
      let __html = await assetResp.text();
      if (!__html.includes('track.js')) __html = __html.replace('</head>', '<script src="/track.js" defer></script></head>');
      if (!__html.includes('cp-fwd.js')) __html = __html.replace('</head>', '<script src="/cp-fwd.js" defer></script></head>');
      // X2/pixel: quiz SUB1 (card.*) dapat Meta Pixel + QuizStart + GTag
      if (url.hostname.startsWith('card.') && env.CP_PIXEL_ID && !__html.includes('cp-pixel.js')) {
        const cfg = '<script>window.CP_PIXEL={pixelId:\''+env.CP_PIXEL_ID+'\',gtagId:\''+(env.CP_GTAG_ID||'')+'\',gtagLabel:\''+(env.CP_GTAG_LABEL||'')+'\'};</'+'script>';
        __html = __html.replace('</body>', cfg + '<script src="/cp-pixel.js" defer></scr'+'ipt></body>');
      }
      // Ad Slot Studio (money pages cardpath.*): render slot divs dari D1 config + CP_SLOTS + gam.js
      if (url.hostname.startsWith('cardpath.') && !path.startsWith('/start') && !__html.includes('gam.js')) {
        try {
          if (!globalThis.__cpSlotsCache || Date.now()-globalThis.__cpSlotsCache.ts > 60000) {
            const r = await env.DB.prepare('SELECT * FROM ad_slots WHERE enabled=1').all();
            globalThis.__cpSlotsCache = { ts: Date.now(), slots: r.results||[] };
          }
          const slots = globalThis.__cpSlotsCache.slots;
          let divsTop='', divsBottom='', cfgA=[];
          slots.forEach((s,i)=>{
            const pos = s.position||'top';
            const div = '<div id="cp-ad-'+i+'" data-cpslot="'+s.slot_id+'" data-position="'+pos+'" style="min-height:'+(s.min_height||90)+'px;display:block;text-align:center;margin:14px auto;max-width:970px"></div>';
            if (pos==='top') divsTop += div; else divsBottom += div;
            cfgA.push({ id:'cp-ad-'+i, unit:s.unit_path, sizes:JSON.parse(s.sizes_json||'[]'), pos:pos });
          });
          const cfgTag = '<scr'+'ipt>window.CP_SLOTS='+JSON.stringify(cfgA)+'</scr'+'ipt>';
          const gamTag = '<scr'+'ipt src="/gam.js" defer></scr'+'ipt>';
          if (divsTop) __html = __html.replace(/(<body[^>]*>)/, '$1'+divsTop);
          if (divsBottom || cfgTag) __html = __html.replace('</body>', divsBottom + cfgTag + gamTag + '</body>');
        } catch(e) { console.log('slots err', String(e).slice(0,120)); }
      }
      const __r2 = new Response(__html, assetResp);
      __r2.headers.set('Content-Type','text/html; charset=utf-8');
      __r2.headers.delete('Content-Length');
      applyLidCookie(__r2.headers, url); // X1: SUB2 landing/P1/P2 cookie dari URL lid
      return __r2;
    }
    // GAM wrapper injection — hanya cardpath.* HTML (money pages), bukan card.* (SUB1 non-monetisasi)
    if (url.hostname.startsWith('cardpath.') &&
        (assetResp.headers.get('content-type')||'').includes('text/html')) {
      let html = await assetResp.text();
      const isQuiz = path.startsWith('/start');
      if (!isQuiz && !html.includes('gam.js')) {
        // Ad Slot Studio: baca config slot dari D1 (cache in-memory 60s) → render per slot aktif
        try {
          if (!globalThis.__cpSlotsCache || Date.now()-globalThis.__cpSlotsCache.ts > 60000) {
            const r = await env.DB.prepare('SELECT * FROM ad_slots WHERE enabled=1').all();
            globalThis.__cpSlotsCache = { ts: Date.now(), slots: r.results||[] };
          }
          const slots = globalThis.__cpSlotsCache.slots;
          let divsTop='', divsBottom='', cfg=[];
          slots.forEach((s,i)=>{
            const pos = s.position||'top';
            const div = `<div id="cp-ad-${i}" data-cpslot="${s.slot_id}" data-position="${pos}" style="min-height:${s.min_height||90}px;display:block;text-align:center;margin:14px auto;max-width:970px"></div>`;
            if (pos==='top') divsTop += div; else divsBottom += div;
            cfg.push({ id:'cp-ad-'+i, unit:s.unit_path, sizes:JSON.parse(s.sizes_json||'[]'), pos:pos });
          });
          const cfgTag = '<script>window.CP_SLOTS='+JSON.stringify(cfg)+'</scr'+'ipt>';
          const gamTag = '<script src="/gam.js" defer></scr'+'ipt>';
          if (divsTop) html = html.replace(/(<body[^>]*>)/, '$1' + divsTop);
          if (html.includes('</body>')) html = html.replace('</body>', divsBottom + cfgTag + gamTag + '</body>');
        } catch(e) {
          // fallback: slot default top (jika D1 gagal)
          const adDiv = '<div id="cp-ad-top" style="min-height:90px;display:block;text-align:center;margin:14px auto;max-width:970px"></div>';
          const gamTag = '<script src="/gam.js" defer></scr' + 'ipt>';
          if (html.includes('</body>')) html = html.replace('</body>', adDiv + gamTag + '</body>');
        }
      }
      const injected = new Response(html, assetResp);
      injected.headers.set('Content-Type','text/html; charset=utf-8');
      injected.headers.set('Cache-Control','no-store');
      return injected;
    }
    return assetResp;
  }
};

// ===== AD IMPRESSION TELEMETRY (GPT slotRenderEnded -> D1) =====
async function handleAdlog(request, env) {
  const H = {'Content-Type':'application/json','Access-Control-Allow-Origin':'*'};
  try {
    const body = await request.json();
    const events = Array.isArray(body.events) ? body.events.slice(0, 50) : [];
    if (!events.length) return new Response(JSON.stringify({ok: true, saved: 0}), {headers: H});
    const stmts = events.map(ev => env.DB.prepare(
      'INSERT INTO ad_impressions (ts, lid, page, slot, kv_json, line_item_id, advertiser_id, is_empty, size, ev, meta_json) VALUES (?,?,?,?,?,?,?,?,?,?,?)'
    ).bind(Date.now(), (ev.lid||'').slice(0,64), (ev.page||'').slice(0,120), (ev.slot||'').slice(0,120),
           (ev.kv_json||'{}').slice(0,500), (ev.line_item_id||'').slice(0,32), (ev.advertiser_id||'').slice(0,32),
           ev.isEmpty?1:0, (ev.size||'').slice(0,20), (ev.ev||'').slice(0,16),
           JSON.stringify({latency_ms: ev.latency_ms||null})));
    await env.DB.batch(stmts);
    return new Response(JSON.stringify({ok: true, saved: events.length}), {headers: H});
  } catch (e) {
    return new Response(JSON.stringify({ok: false, err: 'adlog'}), {status: 200, headers: H});
  }
}

// ===== SERVER-SIDE SCORING (S1-S3: fit/intent TIDAK dari URL client) =====
// Port 1:1 dari app.js v4.3 engine

const CARDS = {
  chime:        { slug:'chime-credit-builder', type:'card', id_req:['ssn','itin','passport'], dep_min:0, fee_monthly:0, fee_annual:0, credit_check:'none', graduation:null },
  capone49:     { slug:'capital-one-platinum-secured', type:'card', id_req:['ssn','itin'], dep_min:49, fee_monthly:0, fee_annual:0, credit_check:'soft', graduation:{month:6, mode:'auto'} },
  quicksilver:  { slug:'quicksilver-secured', type:'card', id_req:['ssn','itin'], dep_min:200, fee_monthly:0, fee_annual:0, credit_check:'soft', graduation:{month:6, mode:'auto'} },
  discover:     { slug:'discover-it-secured', type:'card', id_req:['ssn'], dep_min:200, fee_monthly:0, fee_annual:0, credit_check:'soft', graduation:{month:7, mode:'auto'} },
  opensky:      { slug:'opensky-secured', type:'card', id_req:['ssn','itin'], dep_min:150, fee_monthly:0, fee_annual:35, credit_check:'none', graduation:{month:6, mode:'request'} },
  openskynb:    { name:'OpenSky® Secured Visa® (No Bank Account)', slug:'opensky-no-bank-account', type:'card', id_req:['ssn','itin'], dep_min:150, fee_monthly:0, fee_annual:35, credit_check:'none', graduation:{month:6, mode:'request'} },
  creditone:    { slug:'credit-one-platinum', type:'card', id_req:['ssn'], dep_min:0, fee_monthly:0, fee_annual:99, credit_check:'hard', graduation:null },
  indigo:       { slug:'indigo-mastercard', type:'card', id_req:['ssn','itin'], dep_min:0, fee_monthly:0, fee_annual:0, credit_check:'soft', graduation:null },
  varo:         { slug:'varo-believe', type:'card', id_req:['ssn','itin'], dep_min:0, fee_monthly:0, fee_annual:0, credit_check:'none', graduation:null },
  zolve:        { slug:'zolve-classic', type:'card', id_req:['passport','itin','ssn'], dep_min:0, fee_monthly:0, fee_annual:0, credit_check:'none', graduation:null },
  self:         { slug:'self-secured-visa', type:'loan', id_req:['ssn','itin'], dep_min:0, fee_monthly:25, fee_annual:0, credit_check:'none', graduation:null },
  creditstrong: { slug:'credit-strong', type:'loan', id_req:['ssn','itin'], dep_min:0, fee_monthly:15, fee_annual:0, credit_check:'none', graduation:null },
  kikoff:       { slug:'kikoff', type:'loan', id_req:['ssn','itin'], dep_min:0, fee_monthly:5, fee_annual:0, credit_check:'none', graduation:null },
  grow:         { slug:'grow-credit', type:'fintech', id_req:['ssn','itin'], dep_min:0, fee_monthly:0, fee_annual:0, credit_check:'soft', graduation:null },
  petal2:       { slug:'petal-2', type:'card', id_req:['ssn'], dep_min:0, fee_monthly:0, fee_annual:0, credit_check:'soft', graduation:null },
  experian:     { slug:'experian-boost', type:'utility', id_req:['ssn','itin'], dep_min:0, fee_monthly:0, fee_annual:0, credit_check:'none', graduation:null },
  boompay:      { slug:'boompay-rent', type:'utility', id_req:['ssn','itin'], dep_min:0, fee_monthly:2, fee_annual:0, credit_check:'none', graduation:null },
  creditkarma:  { slug:'credit-karma', type:'utility', id_req:['ssn','itin'], dep_min:0, fee_monthly:0, fee_annual:0, credit_check:'none', graduation:null },
  amexnova:     { slug:'amex-nova', type:'card', id_req:['passport','ssn','itin'], dep_min:0, fee_monthly:0, fee_annual:0, credit_check:'soft', graduation:null },
};

const GOAL_FIT = {
  build:    { chime:42, capone49:36, opensky:34, openskynb:34, self:32, creditstrong:32, varo:36, grow:30, kikoff:28, creditkarma:20, experian:24, boompay:22, zolve:26, amexnova:20, petal2:30, quicksilver:18, creditone:14, indigo:16 },
  rebuild:  { opensky:40, openskynb:40, self:38, creditstrong:36, varo:30, chime:32, kikoff:30, grow:28, boompay:26, experian:24, capone49:30, indigo:24, creditone:16, quicksilver:18, petal2:26, creditkarma:20, zolve:18, amexnova:14 },
  rewards:  { quicksilver:40, capone49:28, petal2:34, chime:24, indigo:14, creditone:12, opensky:10, openskynb:10, varo:16, self:12, creditstrong:12, kikoff:10, grow:14, experian:14, boompay:12, creditkarma:18, zolve:16, amexnova:20 },
  graduate: { quicksilver:36, capone49:34, petal2:32, opensky:26, openskynb:26, varo:20, chime:20, zolve:22, amexnova:24, self:16, creditstrong:16, kikoff:12, grow:14, experian:16, boompay:14, creditkarma:20, creditone:10, indigo:12 },
};
const DEP_MAP = {0:'d0', 99:'d99', 150:'d150', 350:'d350', 600:'d600'};
const POS_MAP = {unknown:'unknow', never:'noscore', bad:'bad', fair:'fair', good:'good'};

function hardConstraints(a) {
  return Object.keys(CARDS).filter(k => {
    const c = CARDS[k];
    if (a[3] === 'passport' && !c.id_req.includes('passport')) return false;
    if (a[3] === 'itin' && !c.id_req.includes('itin')) return false;
    if (a[7] === 0 && !(k.startsWith('opensky') || ['kikoff','creditstrong','grow','self','varo','experian','boompay','creditkarma','zolve','amexnova'].includes(k))) {
      if (c.type === 'card' && (k === 'chime' || k === 'varo')) return false;
      if (['card','fintech'].includes(c.type) && k === 'grow') return false;
    }
    if (a[4] === 'active' && !['opensky','openskynb','self','creditstrong','kikoff','experian','boompay','creditkarma','varo','grow'].includes(k)) return false;
    if (c.dep_min > a[5] && !(a[5] >= 600)) return false;
    if (a[6] === 'none' && c.fee_monthly > 0) return false;
    return true;
  });
}

function scoreCandidate(k, a) {
  const c = CARDS[k];
  let s = 0;
  const goal = a[8];
  s += ((GOAL_FIT[goal] || {})[k] || 10) * 0.4;
  const dep = a[5], depNeed = c.dep_min || 0;
  if (depNeed === 0) s += 25;
  else if (dep >= depNeed) s += (dep - depNeed >= 200) ? 25 : 18;
  const income = a[6];
  if (c.fee_monthly === 0) s += 15;
  else if (income === 'regular') s += 12;
  else if (income === 'irregular') s += 6;
  const score = a[2], bk = a[4];
  let base = 10;
  if (score === 'good' && bk === 'none') base = 20;
  else if (score === 'fair' && bk === 'none') base = 16;
  else if (score === 'unknown' || score === 'never') base = (c.credit_check === 'none') ? 18 : 10;
  else if (score === 'bad') base = (c.credit_check === 'none') ? 16 : 8;
  if (bk === 'active' && c.credit_check !== 'none') base = 4;
  s += base * 0.8; // odds dasar (20) scaled
  return Math.round(s * 10) / 10;
}

function botCheck(payload) {
  // S3: bot signals dari client telemetry + server timing
  if (payload.elapsed_ms < 20000) return 'too_fast';           // total quiz <20s
  if (payload.pattern_identical === true) return 'identical';
  return null;
}

async function handleQuizSubmit(request, env) {
  let body;
  try { body = await request.json(); } catch(e) { return json({error:'bad_json'}, 400); }

  const vals = body.answers; // array 9 vals
  if (!Array.isArray(vals) || vals.length !== 9) return json({error:'bad_answers'}, 400);

  // Server-side bot check (S1/S3)
  const botReason = botCheck(body);
  const isBot = !!botReason;

  // Score SERVER-SIDE (S1: fit/intent tidak dari URL client)
  let candidates = hardConstraints(vals);
  if (!candidates.length) candidates = ['zolve','amexnova'];
  const scored = candidates.map(k => ({k, s: scoreCandidate(k, vals)})).sort((x,y)=>y.s-x.s);
  // F1: utility tidak pernah top-match
  const nonUtil = scored.filter(x => CARDS[x.k].type !== 'utility');
  const pool = (nonUtil.length) ? nonUtil : scored;
  const m = pool[0].k;
  const top3 = pool.slice(0,3).map(x => x.k);

  // fit
  let fit = (vals[2]==='fair')?13:(vals[2]==='good')?15:10;
  fit += ({0:0,99:6,150:10,350:13,600:15}[vals[5]] ?? 0);
  fit += (vals[6]==='regular')?12:(vals[6]==='irregular')?6:0;
  fit += 5;
  const contra =
    (vals[8]==='graduate' && vals[2]==='never' && vals[0]==='never' && vals[1]==='research') ? -10 :
    (vals[4]==='active' && vals[8]==='rewards') ? -10 :
    (vals[5]>=600 && vals[6]==='none') ? -10 : 0;
  fit = Math.max(0, fit + contra);

  // intent (email status: gate akan diminta setelah — intent dihitung tanpa email dulu, +25 saat opt-in)
  let intent = ({now:15,month:10,months13:5,research:2}[vals[1]] ?? 2);
  if (vals[0]==='applied') intent += 10; else if (vals[0]==='browsed') intent += 4;
  intent = Math.min(50, intent + (body.calc_used ? 10 : 0) + (body.repeat ? 5 : 0));

  // odds per kartu (port dari quizOddsFor v4.2.1)
  const NOCHECK = ['opensky','openskynb','chime','varo','zolve','self','creditstrong','kikoff','grow','experian','boompay','creditkarma'];
  const c = CARDS[m];
  const depOk = (c.dep_min === 0) || (vals[5] >= c.dep_min) || (vals[5] >= 600);
  let o = 'medium';
  if (vals[2]==='good' && vals[4]==='none') o = 'high';
  else if (vals[2]==='fair' && vals[4]==='none' && depOk) o = 'high';
  else if (vals[2]==='unknown' || vals[2]==='never') o = (NOCHECK.includes(m) && depOk) ? 'high' : 'medium';
  else if (vals[2]==='bad') o = depOk ? 'medium' : 'low';
  if (vals[4]==='active' && !(m.startsWith('opensky') || m==='self')) o = 'low';
  if (!depOk && o==='high') o = 'medium';
  if (NOCHECK.includes(m) && o!=='high' && vals[6]==='regular' && vals[7]===1 && vals[1]==='now') o = 'high';
  if (contra) o = (o==='high') ? 'medium' : (o==='medium' ? 'low' : o); // E3: odds turun saat kontra

  // SIGNED RESULT TOKEN (S1: client tidak bisa spoof — token HMAC dengan secret)
  const token = await makeResultToken({ m, o, fit, intent, bot: isBot, botReason,
    cq_pos: POS_MAP[vals[2]] || vals[2], cq_id: vals[3], cq_goal: vals[8],
    cq_dep: DEP_MAP[vals[5]] || String(vals[5]), cq_timing: vals[1], cq_regen: vals[0],
    lid: body.lid || 'cp_' + Date.now().toString(36), ts: Date.now() }, env);

  // D1 log
  try {
    await env.DB.prepare(
      'INSERT INTO funnel_events (ts, lid, event, sub, page, utm_source, meta_json) VALUES (?,?,?,?,?,?,?)'
    ).bind(Date.now(), body.lid || null, 'quiz_complete', 'sub1', '/start/quiz',
      body.utm_source || null, JSON.stringify({matched:m, odds:o, fit, intent, bot:isBot, contra:!!contra})).run();
  } catch(e) { /* D1 belum setup — log jangan crash flow */ }
  // v4.3.1: simpan token by lid (URL P1 bersih — token tidak lewat URL; verifikasi via /api/validate?lid=)

  // odds per kartu top3 (v4.3.2 — konsisten dgn farm)
  const oddsFor = (mk) => {
    const cc = CARDS[mk];
    const depOkk = (cc.dep_min === 0) || (vals[5] >= cc.dep_min) || (vals[5] >= 600);
    let oo = 'medium';
    if (vals[2]==='good' && vals[4]==='none') oo = 'high';
    else if (vals[2]==='fair' && vals[4]==='none' && depOkk) oo = 'high';
    else if (vals[2]==='unknown' || vals[2]==='never') oo = (NOCHECK.includes(mk) && depOkk) ? 'high' : 'medium';
    else if (vals[2]==='bad') oo = depOkk ? 'medium' : 'low';
    if (vals[4]==='active' && !(mk.startsWith('opensky') || mk==='self')) oo = 'low';
    if (!depOkk && oo==='high') oo = 'medium';
    if (NOCHECK.includes(mk) && oo!=='high' && vals[6]==='regular' && vals[7]===1 && vals[1]==='now') oo = 'high';
    if (contra) oo = (oo==='high') ? 'medium' : (oo==='medium' ? 'low' : oo);
    return oo;
  };
  const top3o = top3.map(k => ({k, o: oddsFor(k)}));

  try {
    await env.DB.prepare('INSERT INTO results (lid, ts, token, meta_json) VALUES (?,?,?,?) ON CONFLICT(lid) DO UPDATE SET ts=excluded.ts, token=excluded.token, meta_json=excluded.meta_json')
      .bind(body.lid || ('cp_' + Date.now().toString(36)), Date.now(), token,
        JSON.stringify({m, o, fit, intent, bot: isBot, top3: top3o,
          cq_timing: vals[1]||'', cq_regen: vals[0]||'', cq_id: vals[3]||'',
          cq_goal: vals[8]||'', cq_dep: vals[5]||'', cq_pos: vals[2]||'', utm_source: body.utm_source||''})).run();
  } catch(e) {}

  return json({
    ok: true, token, // token = satu-satunya cara client dapat hasil (signed)
    match: m, odds: o, fit, intent, bot: isBot, contra: !!contra,
    top3: top3o, // [{k, o}] — client render carousel dari ini (odds per kartu)
    gate_required: true // FB-A: email gate selalu diminta utk seesMatch
  });
}

async function makeResultToken(data, env) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(env.CP_SECRET || 'cardpath-dev-secret'),
    {name:'HMAC', hash:'SHA-256'}, false, ['sign']);
  const payload = JSON.stringify(data);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  const b64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  return btoa(unescape(encodeURIComponent(payload))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'') + '.' + b64;
}

async function verifyResultToken(token, env) {
  try {
    const [p64, s64] = token.split('.');
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(env.CP_SECRET || 'cardpath-dev-secret'),
      {name:'HMAC', hash:'SHA-256'}, false, ['verify']);
    const sig = Uint8Array.from(atob(s64.replace(/-/g,'+').replace(/_/g,'/')), c=>c.charCodeAt(0));
    const ok = await crypto.subtle.verify('HMAC', key, sig, enc.encode(decodeURIComponent(escape(atob(p64.replace(/-/g,'+').replace(/_/g,'/'))))));
    if (!ok) return null;
    return JSON.parse(decodeURIComponent(escape(atob(p64.replace(/-/g,'+').replace(/_/g,'/')))));
  } catch(e) { return null; }
}

async function handleValidate(request, env) {
  const url = new URL(request.url);
  let token = url.searchParams.get('t');
  const lid = url.searchParams.get('lid');
  // v4.3.1: lookup by lid (token tak lewat URL) — fallback ?t= utk backward-compat
  if (!token && lid) {
    try {
      const row = await env.DB.prepare('SELECT token FROM results WHERE lid = ?').bind(lid).first();
      if (row && row.token) token = row.token;
    } catch(e) {}
  }
  if (!token) return json({valid:false}); // 200 + valid:false — hindari console noise di P1 badge
  const data = await verifyResultToken(token, env);
  if (!data) return json({valid:false});
  // rate: token 24 jam valid
  if (Date.now() - data.ts > 86400000) return json({valid:false, expired:true});
  // v4.3.2: sertakan top3 (dari meta) utk carousel render server-data
  let top3 = data.top3 || null;
  if (!top3 && data.lid) {
    try {
      const row = await env.DB.prepare('SELECT meta_json FROM results WHERE lid = ?').bind(data.lid).first();
      if (row && row.meta_json) { const meta = JSON.parse(row.meta_json); if (meta.top3) top3 = meta.top3; }
    } catch(e) {}
  }
  return json({valid:true, ...data, top3});
}

async function trackSessionP(env, ev){
  const sid=ev.session_id; if(!sid) return;
  const utm=ev.utm||{};
  if(ev.event==='session_start'){
    await env.DB.prepare('INSERT INTO session_summary (session_id, lid, utm_source, utm_campaign, utm_content, device, country, gclid, started_ts, last_ts, pageviews) VALUES (?,?,?,?,?,?,?,?,?,?,1) ON CONFLICT(session_id) DO NOTHING')
      .bind(sid, ev.lid||null, utm.utm_source||null, utm.utm_campaign||null, utm.utm_content||null, ev.device||null, ev.country||null, utm.gclid||null, Date.now(), Date.now()).run();
  } else {
    const sets=['last_ts=?']; const vals=[Date.now()];
    if(ev.event==='page_view'){ sets.push('pageviews=pageviews+1'); }
    if(ev.depth){ sets.push('max_scroll_pct=MAX(max_scroll_pct,?)'); vals.push(ev.depth); }
    if(ev.engaged_sec){ sets.push('engaged_sec=engaged_sec+?'); vals.push(ev.engaged_sec); }
    if(ev.event==='quiz_complete' || ev.event==='quiz_funnel_client'){ sets.push('quiz_completed=1'); }
    if(ev.event==='gate_completed'){ sets.push('gate_completed=1'); }
    if(ev.event==='jump_click'){ sets.push('jumped=1'); }
    if(ev.event==='outbound_click'){ sets.push('outbound=1'); }
    vals.push(sid);
    await env.DB.prepare('UPDATE session_summary SET '+sets.join(', ')+' WHERE session_id=?').bind(...vals).run();
  }
}
async function fireCapi(env, ev, request){
  // Blok 3 CAPI mirror — NOL PII: external_id = sha256(lid)
  try{
    const lid = ev.lid;
    const data = new TextEncoder().encode(lid);
    const digest = await crypto.subtle.digest('SHA-256', data);
    const ext = [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
    const payload = {
      data: [{
        event_name: 'QuizStart',
        event_time: Math.floor(Date.now()/1000),
        event_id: 'qs_'+lid,
        action_source: 'website',
        event_source_url: (request && new URL(request.url).origin + (ev.page||'')) || undefined,
        user_data: { external_id: ext }
      }],
      access_token: env.META_CAPI_TOKEN,
      test_event_code: env.META_CAPI_TEST || undefined
    };
    const r = await fetch('https://graph.facebook.com/v21.0/'+env.CP_PIXEL_ID+'/events', {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)
    });
    const j = await r.json().catch(()=>({}));
    console.log('capi:', r.status, JSON.stringify(j).slice(0,150));
    return r.ok;
  }catch(e){ return false; }
}
const VALID_EVENTS = new Set(['session_start','page_view','scroll_depth','heartbeat','session_end','quiz_start','quiz_complete','gate_completed','jump_click','sub2_landing','p1_view','p2_view','outbound_click','match_slide','click','view']);
async function insertFunnelP(env, ev){
  if (!ev || !ev.lid || typeof ev.lid!=='string' || !VALID_EVENTS.has(ev.event)) return false; // reject sampah
  if (ev.page) ev.page = ev.page.replace(/^\/sub1/, '') || '/'; // B2: normalisasi path internal → canonical
  await env.DB.prepare('INSERT INTO funnel_events (ts, lid, event, sub, page, utm_source, utm_campaign, utm_content, utm_term, session_id, device, country, gclid, meta_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .bind(Date.now(), ev.lid||null, ev.event||'unknown', ev.sub||null, ev.page||null,
      (ev.utm&&ev.utm.utm_source)||null, (ev.utm&&ev.utm.utm_campaign)||null,
      (ev.utm&&ev.utm.utm_content)||null, (ev.utm&&ev.utm.utm_term)||null,
      ev.session_id||null, ev.device||null, ev.country||null, (ev.utm&&ev.utm.gclid)||null, JSON.stringify(ev.data||{})).run();
  return true;
}
async function handleTrack(request, env) {
  let body; try { body = await request.json(); } catch(e) { return json({ok:false}, 400); }
  const events = (body.batch && Array.isArray(body.batch)) ? body.batch : [body];
  let saved=0, rejected=0;
  for (const ev of events) {
    let okF=false;
    try { okF = await insertFunnelP(env, ev) !== false; } catch(e){ console.log('if err', String(e).slice(0,120)); }
    try { if (ev.session_id && (okF || ev.event==='quiz_funnel_client')) await trackSessionP(env, ev); } catch(e){ console.log('ts err', String(e).slice(0,120)); }
    // Blok 3: CAPI mirror — quiz_start ke Meta Conversions API (dedup via event_id=lid)
    if (okF && ev.event==='quiz_start' && ev.lid && env.CP_PIXEL_ID && env.META_CAPI_TOKEN) {
      fireCapi(env, ev, request).catch(e=>console.log('capi err', String(e).slice(0,120))); // fire-and-forget
    }
    if (okF) saved++; else rejected++;
  }
  return json({ok:true, saved, rejected});
}

async function handleEmail(request, env) {
  let body; try { body = await request.json(); } catch(e) { return json({ok:false}, 400); }
  const em = (body.email||'').trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return json({ok:false, error:'bad_email'}, 400);
  try {
    await env.DB.prepare('INSERT INTO leads (ts, lid, email, source, meta_json) VALUES (?,?,?,?,?)')
      .bind(Date.now(), body.lid || null, em.toLowerCase(), 'quiz_gate', JSON.stringify({})).run();
  } catch(e) {}
  try {
    await env.DB.prepare(
      'INSERT INTO funnel_events (ts, lid, event, sub, page, utm_source, meta_json) VALUES (?,?,?,?,?,?,?)'
    ).bind(Date.now(), body.lid || null, 'email_optin', 'sub1', '/start/quiz', null,
      JSON.stringify({email_domain: em.split('@')[1]})).run();
  } catch(e) {}
  return json({ok:true});
}

async function handleGo(card, url, env) {
  const GO_TARGETS = {
    chime:'https://www.chime.com/', capone49:'https://www.capitalone.com/credit-cards/platinum-secured/',
    quicksilver:'https://www.capitalone.com/credit-cards/quicksilver-secured/',
    discover:'https://www.discover.com/credit-cards/secured/',
    opensky:'https://www.openskycc.com/', openskynb:'https://www.openskycc.com/',
    indigo:'https://indigo-card.com/', self:'https://www.self.inc/',
    creditone:'https://www.creditonebank.com/', varo:'https://www.varomoney.com/credit-builder/',
    zolve:'https://zolve.com/', creditstrong:'https://www.creditstrong.com/',
    kikoff:'https://www.kikoff.com/', grow:'https://www.growcredit.com/',
    petal2:'https://petalcard.com/', experian:'https://www.experian.com/',
    boompay:'https://boompay.app/', creditkarma:'https://www.creditkarma.com/',
    amexnova:'https://www.americanexpress.com/',
  };
  const target = GO_TARGETS[card];
  if (!target) return new Response('Unknown card', {status:404});
  const p = url.searchParams;
  try {
    await env.DB.prepare(
      'INSERT INTO funnel_events (ts, lid, event, sub, page, utm_source, meta_json) VALUES (?,?,?,?,?,?,?)'
    ).bind(Date.now(), p.get('lid') || null, 'outbound_click', 'sub2', `/go/${card}`,
      p.get('utm_source') || null,
      JSON.stringify({card, m:p.get('cq_match')||'', o:p.get('o')||'', cp:p.get('cp')||''})).run();
  } catch(e) {}
  return Response.redirect(target + (url.search ? '?' + url.searchParams.toString() : ''), 302);
}


function json(obj, status=200) {
  return new Response(JSON.stringify(obj), {status, headers:{'Content-Type':'application/json'}});
}

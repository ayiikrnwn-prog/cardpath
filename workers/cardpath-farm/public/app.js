/* CardPath v4 — app.js
   MASTER REVISION BRIEF_V4: MATCH ENGINE v4 candidate-fit + 18 produk + hotfix C1/C2/E3.
   Struktur: CARDS(18, field lengkap PART 3.2) → hard constraints (2.1) → skor kandidat
   (goal 40 + deposit 25 + income/fee 15 + odds 20) → top1+2 alts beda type → odds floor (E4). */

// ---------- CONFIG (C2: isProd = konfigurasi, bukan regex hardcoded) ----------
const ROUTE_MODE = 'static'; // 'static' demo | 'server' production Worker
const PROD_HOSTS = ['cardpath.com', 'www.cardpath.com']; // TODO: update saat domain final (C2)

// ---------- CARDS v4 — 18 ENTRI (PART 3.2/3.3, field wajib semua) ----------
// type: card|loan|fintech|utility · id_req subset ssn/itin/passport · dep_min · fees ·
// credit_check: none|soft|hard · graduation {month,mode} | null
const CARDS = {
  chime:     { name:'Chime Credit Builder', slug:'chime-credit-builder', type:'card',
    id_req:['ssn','itin'], dep_min:0, fee_monthly:0, fee_annual:0, credit_check:'none',
    graduation:null, grad_path:'spend-only, no formal graduation', angle:'no-fee-start',
    why:'No credit check, no annual fee, reports to all 3 bureaus — built for starting from zero. Needs a Chime checking account.', network:'VISA' },
  capone49:  { name:'Capital One Platinum Secured', slug:'capital-one-platinum-secured', type:'card',
    id_req:['ssn','itin'], dep_min:49, fee_monthly:0, fee_annual:0, credit_check:'soft',
    graduation:{month:6, mode:'auto'}, grad_path:'auto review at 6 months', angle:'lowest-deposit',
    why:'Deposit starts at $49 — the lowest among major issuers — no annual fee, automatic line review at 6 months.', network:'VISA' },
  quicksilver:{ name:'Capital One Quicksilver Secured', slug:'quicksilver-secured', type:'card',
    id_req:['ssn','itin'], dep_min:200, fee_monthly:0, fee_annual:0, credit_check:'soft',
    graduation:{month:6, mode:'auto'}, grad_path:'auto review at 6 months', angle:'rewards',
    why:'Earn 1.5% cash back while you build — rare for a secured card. $200 refundable deposit, no annual fee.', network:'VISA' },
  opensky:   { name:'OpenSky® Secured Visa®', slug:'opensky-secured', type:'card',
    id_req:['ssn','itin'], dep_min:150, fee_monthly:0, fee_annual:35, credit_check:'none',
    graduation:{month:6, mode:'request'}, grad_path:'upgrade request ~6 months', angle:'bankruptcy-friendly',
    why:'No credit check, no bank account required, bankruptcy-friendly — $150 minimum deposit (OpenSky Launch), $35/yr.', network:'VISA' },
  openskynb: { name:'OpenSky® Secured Visa®', slug:'opensky-no-bank-account', type:'card',
    id_req:['ssn','itin'], dep_min:150, fee_monthly:0, fee_annual:35, credit_check:'none',
    graduation:{month:6, mode:'request'}, grad_path:'upgrade request ~6 months', angle:'no-bank-account',
    why:'No bank account needed — fund your refundable deposit by money order or debit card. No credit check.', network:'VISA' },
  creditone: { name:'Credit One Platinum', slug:'credit-one-platinum', type:'card',
    id_req:['ssn'], dep_min:0, fee_monthly:8.25, fee_annual:99, credit_check:'hard',
    graduation:null, grad_path:'n/a (unsecured)', angle:'no-deposit',
    warn:'Annual fee $75–99 — shown up front, because honesty beats surprises.',
    why:'Unsecured — no deposit — for fair-to-building credit. Carries an annual fee; we show it because the fee-free secured path is usually cheaper.', network:'VISA' },
  indigo:    { name:'Indigo® Mastercard®', slug:'indigo-mastercard', type:'card',
    id_req:['ssn','itin'], dep_min:0, fee_monthly:0, fee_annual:75, credit_check:'soft',
    graduation:null, grad_path:'n/a', angle:'prequal',
    warn:'Annual fee varies by offer ($0 first year possible, then $75+) — check your pre-qualification terms.',
    why:'Pre-qualification with no hard credit pull — see your odds before anything touches your file.', network:'MASTERCARD' },
  varo:      { name:'Varo Believe', slug:'varo-believe', type:'card',
    id_req:['ssn','itin'], dep_min:0, fee_monthly:0, fee_annual:0, credit_check:'none',
    graduation:null, grad_path:'secured spending from linked Varo account', angle:'no-deposit-no-fee',
    why:'$0 deposit, $0 fee, no credit check, reports to all 3 bureaus — needs a Varo Bank account. Issuer-reported: 99% of users without a score had one within 2 months.', network:'VISA' },
  zolve:     { name:'Zolve Classic', slug:'zolve-classic', type:'card',
    id_req:['passport','itin','ssn'], dep_min:0, fee_monthly:0, fee_annual:0, credit_check:'soft',
    graduation:null, grad_path:'limit tied to checking balance', angle:'newcomer-passport',
    warn:'FX fee 3% on non-USD transactions · APR 19.5–39.5% — check full terms.',
    why:'Built for newcomers — no US credit history required. Limit tied to your Zolve checking balance; passport-only applicants accepted.', network:'VISA' },
  self:      { name:'Self Credit Builder Account', slug:'self-secured-visa', type:'loan',
    id_req:['ssn','itin'], dep_min:0, fee_monthly:25, fee_annual:0, credit_check:'none',
    graduation:null, grad_path:'savings returned at loan completion', angle:'loan-hybrid',
    why:'A credit-builder loan that reports installment history — you get the money back at completion. $25–150/mo plans.', network:'VISA' },
  creditstrong:{ name:'Credit Strong', slug:'credit-strong', type:'loan',
    id_req:['ssn','itin'], dep_min:0, fee_monthly:15, fee_annual:0, credit_check:'none',
    graduation:null, grad_path:'savings returned; plans up to $25k', angle:'loan-flexible',
    why:'Credit-builder loan from $15–28/mo — your principal comes back at the end. Reports as installment history.', network:'VISA' },
  kikoff:    { name:'Kikoff Credit Account', slug:'kikoff', type:'loan',
    id_req:['ssn','itin'], dep_min:0, fee_monthly:5, fee_annual:0, credit_check:'none',
    graduation:null, grad_path:'n/a — subscription tradeline', angle:'budget-absolute',
    warn:'$5/mo and the money does NOT come back — cheapest, but it is a fee, not savings.',
    why:'The cheapest credit-builder: $5/mo, reports to all 3 bureaus, no credit check. Honest catch: unlike loans, you don\'t get the money back.', network:'VISA' },
  grow:      { name:'Grow Credit', slug:'grow-credit', type:'fintech',
    id_req:['ssn','itin'], dep_min:0, fee_monthly:0, fee_annual:0, credit_check:'soft',
    graduation:null, grad_path:'n/a — subscription-backed virtual card', angle:'build-with-bills',
    why:'A virtual card that pays subscriptions you already have — build history with bills, not new spending. Free tier available.', network:'MASTERCARD' },
  petal2:    { name:'Petal® 2 Visa®', slug:'petal-2', type:'card',
    id_req:['ssn'], dep_min:0, fee_monthly:0, fee_annual:0, credit_check:'soft',
    graduation:null, grad_path:'n/a (unsecured)', angle:'cash-flow-underwriting',
    why:'No deposit, no fees, and underwriting based on your banking cash-flow instead of your score. SSN required.', network:'VISA' },
  experian:  { name:'Experian Boost / Go', slug:'experian-boost', type:'utility',
    id_req:['ssn','itin'], dep_min:0, fee_monthly:0, fee_annual:0, credit_check:'none',
    graduation:null, grad_path:'n/a — utility', angle:'free-boost',
    why:'Free. Reports utility & streaming bills into your Experian file — average +13 FICO 8 points (Experian file only — we say so honestly).', network:'—' },
  boompay:   { name:'BoomPay Rent Reporting', slug:'boompay-rent', type:'utility',
    id_req:['ssn','itin'], dep_min:0, fee_monthly:2, fee_annual:0, credit_check:'none',
    graduation:null, grad_path:'n/a — utility', angle:'rent-reporting',
    why:'Report your rent to all 3 bureaus for $2/mo — with 24 months of back-reporting. The biggest bill you already pay, finally counted.', network:'—' },
  creditkarma:{ name:'Credit Karma', slug:'credit-karma', type:'utility',
    id_req:['ssn','itin'], dep_min:0, fee_monthly:0, fee_annual:0, credit_check:'none',
    graduation:null, grad_path:'n/a — utility', angle:'score-tracking',
    why:'Free score tracking (VantageScore) and report monitoring — the standard first stop to watch your build.', network:'—' },
  amexnova:  { name:'Amex via Nova Credit', slug:'amex-nova', type:'card',
    id_req:['passport'], dep_min:0, fee_monthly:0, fee_annual:0, credit_check:'soft',
    graduation:null, grad_path:'n/a — unsecured', angle:'newcomer-passport-amex',
    why:'American Express cards using your foreign credit history via Nova Credit — 12 countries eligible. Still requires SSN or ITIN to issue.', network:'AMEX' },
};
// discover DIHAPUS dari CARDS aktif (ditutut Juni 2026 — PART 3.1). Halaman lama → status page (dibuat terpisah).
const DISCOVER_PAUSED = true;

const CARD_NETWORK = { discover:'DISCOVER', indigo:'MASTERCARD', grow:'MASTERCARD', amexnova:'AMEX' }; // sisanya VISA
function cardVisualHTML(key, extraClass) {
  const net = CARD_NETWORK[key] || 'VISA';
  const grads = { VISA:'linear-gradient(135deg,#1a2a4a 0%,#2d4a7a 100%)',
    MASTERCARD:'linear-gradient(135deg,#3a2418 0%,#8a4a2a 100%)',
    DISCOVER:'linear-gradient(135deg,#8a4a12 0%,#d97a2a 100%)',
    AMEX:'linear-gradient(135deg,#0b6e99 0%,#1a9bc7 100%)' };
  return '<div class="card-visual ' + (extraClass||'') + '" style="background:' + grads[net] + '" aria-hidden="true">' +
    '<div class="chip"></div><div class="num-p">•••• •••• •••• 1234</div>' +
    '<div class="brandline"><span>' + net + '</span></div></div>';
}

// ---------- UTM / lid / tracking ----------
(function () {
  const p = new URLSearchParams(location.search);
  const store = {};
  ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].forEach(k => { const v=p.get(k); if (v) store[k]=v; });
  const prev = JSON.parse(sessionStorage.getItem('cp_utm') || '{}');
  sessionStorage.setItem('cp_utm', JSON.stringify(Object.assign({}, prev, store)));
})();
function getUtm() { try { return JSON.parse(sessionStorage.getItem('cp_utm') || '{}'); } catch(e){ return {}; } }
function cleanQS(obj) {
  const qs = new URLSearchParams();
  Object.entries(obj).forEach(([k,v]) => { if (v !== '' && v !== null && v !== undefined) qs.set(k, String(v)); });
  return qs.toString();
}
function getLid() {
  let lid = localStorage.getItem('cp_lid');
  if (!lid) { lid = 'cp_' + Date.now().toString(36) + Math.random().toString(36).slice(2,6); localStorage.setItem('cp_lid', lid); }
  return lid;
}
function forwardUtmLinks() {
  const utm = getUtm(), profile = JSON.parse(sessionStorage.getItem('cp_profile') || 'null');
  document.querySelectorAll('a[data-fwd]').forEach(a => {
    try {
      const u = new URL(a.href, location.origin);
      Object.entries(utm).forEach(([k,v]) => u.searchParams.set(k, v));
      if (profile && /\.html$/.test(u.pathname) && !/quiz|result|start/.test(u.pathname)) {
        if (!u.searchParams.get('m') && profile.cq_match) u.searchParams.set('m', profile.cq_match);
        if (!u.searchParams.get('o') && profile.o) u.searchParams.set('o', profile.o);
      }
      a.href = u.pathname + (u.search ? '?' + u.searchParams.toString() : '') + u.hash;
    } catch(e){}
  });
}
function track(event, data) {
  const payload = Object.assign({ event, ts: Date.now(), page: location.pathname, lid: getLid(), utm: getUtm(), sub: window.CP_SUB || 'sub1' }, data||{});
  try { fetch('/api/track', { method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify(payload), keepalive:true }).catch(()=>{}); } catch(e) { console.log('[track]', payload); }
}

// ---------- C1: outbound href builder (satu sumber, ROUTE_MODE) ----------
function outboundHref(key) {
  const p = new URLSearchParams(location.search);
  const qs = new URLSearchParams(Object.assign({}, Object.fromEntries(p), getUtm())).toString();
  if (ROUTE_MODE === 'server') return '/go/' + key + '?' + qs;
  return 'go.html?card=' + key + '&' + qs; // demo static
}

// ---------- QUIZ v4: 9 pertanyaan + email (Q9 cq_id disisip posisi 3 — PART 5) ----------
const QUIZ = [
  { q:"Have you researched or checked cards recently?",
    tip:"Why we ask: recent research means we can skip the basics.",
    opts:["Never looked into it","Browsed or checked pre-qualification","Applied recently"],
    vals:['never','browsed','applied'] },
  { q:"When are you planning to apply?",
    tip:"Why we ask: your timeline changes which steps make sense first.",
    opts:["Right now","Within a month","1–3 months","Just researching"],
    vals:['now','month','months13','research'] },
  { q:"What's your credit score situation?",
    tip:"Why we ask: 'not sure' and 'never had credit' lead to different cards.",
    opts:["I'm not sure what my score is","I've never had credit in my name","Below 580","580–669","670+"],
    vals:['unknown','never','bad','fair','good'] },
  { q:"Which of these do you have?",   // Q9 BARU (PART 5.1) — netral dokumen, bukan imigrasi
    tip:"Why we ask: some issuers require an SSN — this filters cards you can actually apply for.",
    opts:["Social Security Number","ITIN only","Passport/visa only — no SSN or ITIN yet"],
    vals:['ssn','itin','passport'] },
  { q:"Bankruptcy or major negative marks?",
    tip:"e.g., collections, charge-off, repossession — anything major on your report.",
    opts:["None","Past, now resolved","Active"],
    vals:['none','past','active'] },
  { q:"One-time deposit you could set aside?",
    tip:"Why we ask: the deposit becomes your credit line — it comes back at graduation (if you choose a secured card).",
    opts:["$0","Under $100","$100–200","$200–500","$500+"],
    vals:[0,99,150,350,600] },
  { q:"Do you have steady income landing in a bank account?",
    tip:"Why we ask: issuers look at ability to pay — we never ask the amount.",
    opts:["Yes, regular paycheck","Yes, but irregular","No income landing in an account"],
    vals:['regular','irregular','none'] },
  { q:"Do you have a US checking account?",
    tip:"Why we ask: some cards need one, others don't — both have good options.",
    opts:["Yes","No"],
    vals:[1,0] },
  { q:"Main goal for the next 12 months?",
    tip:"Why we ask: your goal shapes the upgrade path we recommend.",
    opts:["Start from zero","Rebuild after setbacks","Earn rewards while building","Graduate to premium"],
    vals:['build','rebuild','rewards','graduate'] },
];
// answers index v4: 0 regency, 1 timing, 2 score, 3 ID, 4 bk, 5 deposit, 6 income, 7 bank, 8 goal

let qi=0, answers=[], qTimestamps=[], backCount=0;

function quizRender() {
  const box = document.getElementById('quiz-box');
  if (!box) return;
  const step = QUIZ[qi];
  const pct = Math.round(qi / (QUIZ.length+1) * 100);
  const fill=document.getElementById('qp-fill'); if(fill) fill.style.width=pct+'%';
  const lbl=document.getElementById('qp-label'); if(lbl) lbl.textContent='Question '+(qi+1)+' of '+QUIZ.length;
  const back=document.getElementById('quiz-back'); if(back) back.classList.toggle('show', qi>0);
  const tip=document.getElementById('quiz-tip'); if(tip) tip.textContent=(qi%2===1)?(step.tip||''):'';
  box.innerHTML = '<div class="quiz-q">'+step.q+'</div>' +
    '<div class="quiz-opts">'+step.opts.map((o,i)=>
      '<button class="quiz-opt'+(answers[qi]&&answers[qi].vi===i?' sel':'')+'" data-i="'+i+'">'+o+'</button>').join('')+'</div>';
  box.querySelectorAll('.quiz-opt').forEach(btn=>{
    btn.addEventListener('click',()=>{
      answers[qi]={vi:+btn.dataset.i, val:step.vals[+btn.dataset.i]};
      qTimestamps[qi]=Date.now();
      track('quiz_answer',{step:qi+1});
      btn.classList.add('sel');
      setTimeout(()=>{ qi++; if(qi<QUIZ.length) quizRender(); else quizRenderEmailStep(); },250);
    });
  });
}

function quizRenderEmailStep() {
  // FB-Shelby (27 Okt, SUB1): email TIDAK ditanya di quiz — cukup 1x di result gate (server-first).
  quizShowResult(false);
}
// ---------- MATCH ENGINE v4 (PART 2): candidate-fit, bukan first-match-wins ----------
function hardConstraints(a) {
  // a indices v4: 0 regency 1 timing 2 score 3 ID 4 bk 5 deposit 6 income 7 bank 8 goal
  return Object.keys(CARDS).filter(k => {
    const c = CARDS[k];
    // ID constraint (PART 5.2): passport-only → hanya zolve/amexnova; itin → exclude ssn-only
    if (a[3] === 'passport' && !c.id_req.includes('passport')) return false;
    if (a[3] === 'itin' && !c.id_req.includes('itin')) return false;
    // bank constraint
    if (a[7] === 0 && !(k.startsWith('opensky') || ['kikoff','creditstrong','grow','self','varo','experian','boompay','creditkarma','zolve','amexnova'].includes(k))) {
      // produk non-bank-friendly yang wajib checking dibuang
      if (c.type === 'card' && (k === 'chime' || k === 'varo')) return false;
      if (['card','fintech'].includes(c.type) && k === 'grow') return false;
      if (k === 'self' || k === 'creditstrong' || k === 'kikoff') { /* loan OK tanpa bank? Self butuh bank utk bayar — tetap izinkan ( bayar via kartu/other) */ }
    }
    // bk constraint (M1: hanya ACTIVE yang override)
    if (a[4] === 'active' && !['opensky','openskynb','self','creditstrong','kikoff','experian','boompay','creditkarma','varo','grow'].includes(k)) return false;
    // deposit constraint (E1): dep_min > user deposit → exclude
    if (c.dep_min > a[5] && !(a[5] >= 600)) return false;
    // income none + produk ber-monthly fee → exclude (M1 constraint terakhir)
    if (a[6] === 'none' && c.fee_monthly > 0) return false;
    return true;
  });
}

function scoreCandidate(k, a) {
  const c = CARDS[k];
  let s = 0;
  // goal fit (40)
  const goal = a[8];
  const goalFit = {
    build:   { chime:42, capone49:36, opensky:34, openskynb:34, self:32, creditstrong:32, varo:36, grow:30, kikoff:28, creditkarma:20, experian:24, boompay:22, zolve:26, amexnova:20, petal2:30, quicksilver:18, creditone:14, indigo:16 },
    rebuild: { opensky:40, openskynb:40, self:38, creditstrong:36, varo:30, chime:32, kikoff:30, grow:28, boompay:26, experian:24, capone49:30, indigo:24, creditone:16, quicksilver:18, petal2:26, creditkarma:20, zolve:18, amexnova:14 },
    rewards: { quicksilver:40, capone49:28, petal2:34, chime:24, discover:0, indigo:14, creditone:12, opensky:10, openskynb:10, varo:16, self:12, creditstrong:12, kikoff:10, grow:14, experian:14, boompay:12, creditkarma:18, zolve:16, amexnova:20 },
    graduate:{ quicksilver:36, capone49:34, petal2:32, discover:0, opensky:26, openskynb:26, varo:20, chime:20, zolve:22, amexnova:24, self:16, creditstrong:16, kikoff:12, grow:14, experian:16, boompay:14, creditkarma:20, creditone:10, indigo:12 }
  }[goal] || {};
  s += (goalFit[k] || 10) * 0.4; // → max 40
  // deposit fit (25): deposit user vs kebutuhan
  const dep = a[5], depNeed = c.dep_min || 0;
  if (depNeed === 0) s += 25;
  else if (dep >= depNeed) s += (dep - depNeed >= 200) ? 25 : 18;
  else s += 0; // sudah dieksclude hard constraint
  // income/fee fit (15)
  const income = a[6];
  if (c.fee_monthly === 0) s += 15;
  else if (income === 'regular') s += 12;
  else if (income === 'irregular') s += 6;
  else s += 0;
  // odds dasar (20)
  const score = a[2], bk = a[4];
  let base = 10;
  if (score === 'good' && bk === 'none') base = 20;
  else if (score === 'fair' && bk === 'none') base = 16;
  else if (score === 'unknown' || score === 'never') base = (c.credit_check === 'none') ? 18 : 10;
  else if (score === 'bad') base = (c.credit_check === 'none') ? 16 : 8;
  if (bk === 'active' && c.credit_check !== 'none') base = 4;
  s += base;
  return Math.round(s);
}

// M1 utama: match = kandidat terbaik; alts = rank 2-3 (beda type bila mungkin)
function quizMatch() {
  const a = answers.map(x => x.val);
  let candidates = hardConstraints(a);
  if (!candidates.length) {
    // safety net TETAP hormati hard constraint terlemah (ID) — jangan pernah match produk yang tak bisa dia apply
    const id = a[3];
    candidates = Object.keys(CARDS).filter(k => CARDS[k].id_req.includes(id) ||
      (id === 'ssn' && CARDS[k].id_req.includes('ssn')));
    if (!candidates.length) candidates = ['zolve','amexnova']; // ultimate fallback (passport-friendly)
  }
  const scored = candidates.map(k => ({ k, s: scoreCandidate(k, a) })).sort((x,y)=>y.s-x.s);
  // F1 (UX_SIM v4.2): utility TIDAK PERNAH top-match bila ada produk non-utility eligible.
  // Utility = jalur sekunder (alts jalur sekunder / email E4-E6 / tools) — bukan kompetitor kartu.
  // Revenue: jump-to-utility = funnel pendek + CPA rendah vs kartu ($30-150).
  const hasNonUtil = candidates.some(k => CARDS[k].type !== 'utility');
  const nonUtil = scored.filter(x => CARDS[x.k].type !== 'utility');
  const util = scored.filter(x => CARDS[x.k].type === 'utility');
  const pool = (hasNonUtil && nonUtil.length) ? nonUtil : scored; // F1: utility tak pernah kompetisi top-match
  // tie-breaker: fee lebih rendah menang → lalu graduation lebih cepat
  pool.sort((x,y)=>{
    if (y.s!==x.s) return y.s-x.s;
    const fx=(CARDS[x.k].fee_annual+CARDS[x.k].fee_monthly*12), fy=(CARDS[y.k].fee_annual+CARDS[y.k].fee_monthly*12);
    if (fx!==fy) return fx-fy;
    const gx=CARDS[x.k].graduation?CARDS[x.k].graduation.month:99, gy=CARDS[y.k].graduation?CARDS[y.k].graduation.month:99;
    return gx-gy;
  });
  // F1: utility kembali di belakang (sebagai alts sekunder) setelah pool non-utility
  return hasNonUtil && nonUtil.length ? [...pool, ...util] : pool;
}

// M1: alts rank 2-3, HARUS beda type bila mungkin
function quizAlts(matchKey) {
  const a = answers.map(x => x.val);
  const scored = quizMatch().filter(x => x.k !== matchKey);
  const mType = CARDS[matchKey].type;
  const diffType = scored.filter(x => CARDS[x.k].type !== mType);
  const sameType = scored.filter(x => CARDS[x.k].type === mType);
  const out = [];
  if (diffType[0]) out.push(diffType[0].k);
  if (out.length < 2 && sameType[0]) out.push(sameType[0].k);
  if (out.length < 2 && diffType[1]) out.push(diffType[1].k);
  if (out.length < 2) { for (const x of sameType) { if (!out.includes(x.k)) { out.push(x.k); break; } } }
  return out.slice(0,2);
}

// E4: odds floor utk no-credit-check products (minimum 'medium')
function quizOddsFor(key) {
  const a = answers.map(x => x.val);
  const score=a[2], bk=a[4], deposit=a[5];
  const c = CARDS[key];
  const NOCHECK_FLOOR = ['opensky','openskynb','chime','varo','zolve','self','creditstrong','kikoff','grow','experian','boompay','creditkarma'];
  let v = 'medium';
  if (score === 'good' && bk === 'none') v = 'high';
  else if (score === 'fair' && bk === 'none') v = 'high';
  else if (score === 'bad') v = (c.credit_check === 'hard') ? 'low' : 'medium';
  // none/unknown: no-check products → medium; underwrite-by-score → low
  else v = (c.credit_check === 'hard') ? 'low' : 'medium';
  if (bk === 'active' && c.credit_check !== 'none') v = 'low';
  if (c.dep_min > deposit && c.dep_min > 0) v = (v === 'high') ? 'medium' : 'low';
  if (NOCHECK_FLOOR.includes(key) && v === 'low') v = 'medium'; // E4 floor
  return v;
}
const ODDS_LABEL = { high:'Very likely', medium:'Likely', low:'Possible' };

// ---------- SCORING v3 (fit/intent) + E3 (kontra → odds -1 band) ----------
let contraApplied = false;
function fitScore() {
  const a = answers.map(x => x.val);
  const score=a[2], bk=a[4], deposit=a[5], income=a[6], goal=a[8];
  let s = 0;
  s += (score==='fair')?13:(score==='good')?15:10;
  s += ({0:0,99:6,150:10,350:13,600:15}[deposit] ?? 0);
  s += (income==='regular')?12:(income==='irregular')?6:0;
  s += 5; // checking netral
  const contra =
    (goal==='graduate' && score==='never' && a[0]==='never' && a[1]==='research') ? -10 :
    (bk==='active' && goal==='rewards') ? -10 :
    (deposit>=600 && income==='none') ? -10 : 0;
  contraApplied = !!contra;
  if (contra) { s += contra; track('fraud_flag',{type:'inconsistent'}); }
  return Math.max(0, s);
}
function intentScore(hasEmail) {
  const a = answers.map(x => x.val);
  let s = 0;
  if (hasEmail) s += 25;
  s += ({now:15,month:10,months13:5,research:2}[a[1]] ?? 2);
  if (a[0]==='applied') s += 10; else if (a[0]==='browsed') s += 4;
  if (sessionStorage.getItem('cp_calc_used')==='1') s += 10;
  if (localStorage.getItem('cp_repeat')==='1') s += 5;
  return Math.min(50, s);
}
function computeScore(hasEmail){ return { fit: fitScore(), intent: intentScore(hasEmail) }; }

// E3: odds turun satu band bila kontradiksi
function oddsWithContra(key) {
  let v = quizOddsFor(key);
  if (contraApplied) v = (v==='high')?'medium':(v==='medium')?'low':'low';
  return v;
}

// bot-filter BINER (terpisah dari skor)
function botFilter() {
  if (qTimestamps.length >= QUIZ.length) {
    const spans = qTimestamps.map((t,i)=>i===0?0:t-qTimestamps[i-1]).filter((_,i)=>i>0);
    const avg = spans.reduce((x,y)=>x+y,0)/spans.length/1000;
    if (avg < 2) { track('fraud_flag',{type:'too_fast_binary'}); return true; }
  }
  const ua = navigator.userAgent||'';
  if (navigator.webdriver===true || /HeadlessChrome|PhantomJS/i.test(ua)) { track('fraud_flag',{type:'webdriver'}); return true; }
  return false;
}

// ---------- quizShowResult: profile + redirect ----------
// ---------- SUB1 server-first submit (A3): scoring via /api/quiz — HMAC token ----------
function quizSubmitServer(hasEmail){
  const a = answers.map(x=>x.val);
  const payload = {
    answers: a,
    elapsed_ms: Date.now() - Number(sessionStorage.getItem('cp_quiz_started_at')||Date.now()),
    lid: getLid(),
    utm_source: getUtm().utm_source || null,
    calc_used: sessionStorage.getItem('cp_calc_used')==='1',
    repeat: localStorage.getItem('cp_repeat')==='1',
    email_at_submit: !!hasEmail
  };
  track('quiz_funnel_client',{server:1}); // B1: funnel quiz_complete single-source dari server /api/quiz
  try { if (typeof gtag==='function') gtag('event','generate_lead'); } catch(e){}
  fetch('/api/quiz',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
    .then(r=>r.json())
    .then(res=>{
      if(!res.ok) throw new Error('quiz_api');
      sessionStorage.setItem('cp_server_result', JSON.stringify(res));
      sessionStorage.setItem('cp_top3', JSON.stringify(res.top3));
      sessionStorage.setItem('cp_gate_done','0');
      const qs=new URLSearchParams(Object.assign({m:res.match, o:res.odds, f:res.fit, i:res.intent,
        bot:res.bot?1:0, eg:0, lid:getLid()}, getUtm())).toString();
      location.href='/start/result.html?'+qs;
    })
    .catch(err=>{
      // fallback offline: redirect result dengan scoring client (resilience, non-SUB path)
      try{
        const ranked = quizMatch();
        const m0 = ranked[0].k;
        const sc2 = computeScore(hasEmail);
        const a2 = answers.map(x=>x.val);
        sessionStorage.setItem('cp_profile', JSON.stringify({cq_match:m0, o:oddsWithContra(m0), fit:sc2.fit, intent:sc2.intent, bot:botFilter(), cq_id:a2[3], cq_goal:a2[8], cq_dep:a2[5], cq_timing:a2[1], cq_regen:a2[0], lid:getLid()}));
        const qs3=new URLSearchParams(Object.assign({m:m0, o:oddsWithContra(m0), f:sc2.fit, i:sc2.intent, bot:botFilter()?1:0, lid:getLid()}, getUtm())).toString();
        location.href='/start/result.html?'+qs3;
      }catch(e2){}
    });
}
// original client-side show (dipakai fallback)
function quizShowResult(hasEmail) {
  // SUB1 server-first: scoring via /api/quiz (HMAC token) — hasil dari server, bukan client
  if (window.CP_SUB === 'sub1') { quizSubmitServer(hasEmail); return; }
  const ranked = quizMatch();
  const m = ranked[0].k;
  const o = oddsWithContra(m);
  const sc = computeScore(hasEmail);
  const isBot = botFilter();
  track('quiz_complete',{matched:m, odds:o, fit:sc.fit, intent:sc.intent, bot:isBot});
  const a = answers.map(x=>x.val);
  sessionStorage.setItem('cp_profile', JSON.stringify({
    cq_match:m, o, fit:sc.fit, intent:sc.intent, bot:isBot,
    cq_pos:a[2]==='unknown'?'unknown':a[2], cq_id:a[3],
    cq_goal:a[8], cq_dep:a[5], cq_timing:a[1], cq_regen:a[0], lid:getLid()
  }));
  localStorage.setItem('cp_repeat','1');
  const arr=JSON.parse(sessionStorage.getItem('cp_submits')||'[]'); arr.push(Date.now());
  sessionStorage.setItem('cp_submits', JSON.stringify(arr));
  const ranked3 = quizMatch().slice(0,3).map(x=>({k:x.k, o:quizOddsFor(x.k)}));
  sessionStorage.setItem('cp_top3', JSON.stringify(ranked3));
  const inStart = location.pathname.includes('/start/');
  const dest = inStart ? '/start/result.html' : 'results.html';
  const qs = new URLSearchParams(Object.assign({
    m, o, f:sc.fit, i:sc.intent, bot:(isBot)?1:0, contra:contraApplied?1:0,
    cq_timing:a[1], cq_regen:a[0], cq_id:a[3]
  }, getUtm())).toString();
  location.href = dest + '?' + qs;
}

// ---------- RESULTS RENDER (M2: jalur profil kuat; E3 note) ----------
function altHref(k) {
  const p = new URLSearchParams(location.search);
  const o = ['high','medium','low'].includes(p.get('o')) ? p.get('o') : 'medium';
  const qs = new URLSearchParams(Object.assign({ m:k, o }, getUtm())).toString();
  return (location.pathname.includes('/start/') ? 'result.html' : 'results.html') + '?' + qs;
}

// ---------- TOP-3 MATCH CAROUSEL (Shelby FB 26 Okt): geser card = pindah halaman (pageview baru) ----------
function top3Keys(m) {
  const out = [m];
  // 1) ranking tersimpan dari quiz submit (result page tidak punya answers state)
  const saved = JSON.parse(sessionStorage.getItem('cp_top3')||'[]').map(x=>x.k);
  for (const k of saved) { if (!out.includes(k) && out.length < 3) out.push(k); }
  // 2) fallback: live quizMatch (quiz flow / same-page)
  const ranked = quizMatch().map(x=>x.k);
  for (const k of ranked) { if (!out.includes(k) && out.length < 3) out.push(k); }
  // 3) fallback terakhir: quizAlts (rank 2-3 beda-type) — untuk deep-link tanpa session
  for (const k of quizAlts(m)) { if (!out.includes(k) && out.length < 3) out.push(k); }
  return out;
}
function slideHref(k, rank, o) {
  const p = new URLSearchParams(location.search);
  const qs = new URLSearchParams(Object.assign({
    m:k, o, f:p.get('f')||'', i:p.get('i')||'', pos:rank, eg:p.get('eg')||'',
    bot:p.get('bot')||'', contra:p.get('contra')||'', s:p.get('s')||'',
    cq_timing:p.get('cq_timing')||'', cq_regen:p.get('cq_regen')||'', cq_id:p.get('cq_id')||'',
    lid:p.get('lid')||getLid()
  }, getUtm())).toString();
  return (location.pathname.includes('/start/') ? 'result.html' : 'results.html') + '?' + qs;
}
function carouselHTML(top3, idx, o, fit, intent, oddsFor) {
  oddsFor = oddsFor || (k=>o);
  if (top3.length < 2) return '';
  const prevIdx = (idx-1+top3.length)%top3.length, nextIdx = (idx+1)%top3.length;
  const prev = top3[prevIdx], next = top3[nextIdx];
  const dots = top3.map((_,n)=>'<span class="cdots'+(n===idx?' on':'')+'">●</span>').join(' ');
  return '<div class="slide-nav" style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:14px">' +
    '<a class="slide-btn" data-slide href="'+slideHref(prev,prevIdx+1,oddsFor(prev))+'" aria-label="Previous match" style="display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border:1px solid var(--hairline);border-radius:50%;background:#fff;font-size:18px;color:var(--ink);text-decoration:none">‹</a>' +
    '<span style="font-size:12.5px;color:var(--ink-3)">'+dots+'<br>Match '+(idx+1)+' of '+top3.length+' — compare your options</span>' +
    '<a class="slide-btn" data-slide href="'+slideHref(next,nextIdx+1,oddsFor(next))+'" aria-label="Next match" style="display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border:1px solid var(--hairline);border-radius:50%;background:#fff;font-size:18px;color:var(--ink);text-decoration:none">›</a>' +
    '</div>';
}
function resultsRender() {
  const box = document.getElementById('results-box');
  if (!box) return;
  const p = new URLSearchParams(location.search);
  // SUB1 server-first: render dari server result (signed) — client engine hanya fallback
  if (window.CP_SUB === 'sub1') { resultsRenderServer(box, p); return; }
  const m = CARDS[p.get('m')] ? p.get('m') : 'chime';
  const o = ['high','medium','low'].includes(p.get('o')) ? p.get('o') : 'medium';
  let fit = parseInt(p.get('f') || '50', 10);
  let intent = parseInt(p.get('i') || '30', 10);
  const bot = p.get('bot') === '1';
  const contra = p.get('contra') === '1';
  if (p.get('resume')) { intent += 10; track('resume_engagement',{lid:p.get('resume'), intent_after:intent}); }
  const card = CARDS[m];
  const alts = quizAlts(m);
  // Top-3 carousel (Shelby FB): ranked matches, geser = full page navigation (engagement & session baru)
  const top3 = top3Keys(m);
  const saved3 = JSON.parse(sessionStorage.getItem('cp_top3')||'[]');
  const oddsFor = k => { const hit=saved3.find(x=>x.k===k); return (hit && ['high','medium','low'].includes(hit.o)) ? hit.o : o; };
  const posRank = parseInt(p.get('pos')||'1',10);
  const idx = Math.min(Math.max((posRank-1),0), top3.length-1);
  const rankNote = idx>0 ? '<div class="match" style="color:var(--ink-3)">Match '+(idx+1)+' of '+top3.length+' for your profile</div>' : '';
  const band = o==='high'?'odds-high':o==='medium'?'odds-med':'odds-low';
  sessionStorage.setItem('cp_profile', JSON.stringify({
    cq_match:m, o, fit, intent, bot,
    cq_pos:p.get('cq_pos')||'', cq_id:p.get('cq_id')||'', cq_goal:p.get('cq_goal')||'',
    cq_dep:p.get('cq_dep')||'', cq_timing:p.get('cq_timing')||'', cq_regen:p.get('cq_regen')||'',
    lid:p.get('lid')||getLid()
  }));
  const isProd = PROD_HOSTS.includes(location.hostname); // C2
  const qaMode = p.get('qa')==='1' && !isProd;

  const base = location.pathname.includes('/start/') ? '../' : '';
  const jumpParams = k => {
    const prof = JSON.parse(sessionStorage.getItem('cp_profile')||'{}');
    const qs = new URLSearchParams(Object.assign({
      lid:prof.lid||getLid(), cp:fit, cq_pos:prof.cq_pos||'', cq_id:prof.cq_id||'', cq_goal:prof.cq_goal||'',
      cq_dep:prof.cq_dep||'', cq_timing:prof.cq_timing||'', cq_regen:prof.cq_regen||'', cq_match:k, o
    }, getUtm())).toString();
    return base + CARDS[k].slug + '.html?' + qs;
  };

  // M2: jalur profil kuat — FIT≥45 && INTENT 25-34 → email-first varian + jump sekunder abu-abu AKTIF
  const strongProfile = fit >= 45 && intent >= 25 && intent < 35;
  const qualified = qaMode || (!bot && fit >= 30 && intent >= 35);
  const emailFirst = !qualified && !bot && fit >= 30 && intent >= 20;
  const strongPath = !qualified && strongProfile;

  // FB1 (Shelby 26 Okt): EMAIL GATE sebelum match terlihat.
  // Yang "melihat kartu" (qualified/strongPath/emailFirst/bot) WAJIB email dulu —
  // gimmick: hasil kecocokan dikirim ke email → user merasa dapat value.
  // Setelah submit → match tampil langsung dgn "Continue to your matched card →" (FB2: tanpa Unlock button).
  // Education path (fit<30, tidak melihat kartu) tetap tanpa gate.
  const contraNote = contra ? '<p class="warn-line" style="font-size:12.5px">Some answers look inconsistent — this may affect your estimate.</p>' : '';
  const seesMatch = qualified || strongPath || emailFirst || bot;
  const emailGiven = p.get('eg') === '1' || sessionStorage.getItem('cp_email_gate') === '1';

  let jump = '';
  if (qualified && emailGiven) {
    jump = '<a class="cta cta-red" id="jump-btn" data-jump href="'+jumpParams(m)+'">Continue to your matched card →</a>' +
      '<p class="micro">You\'ll go to our full guide — about 2 minutes to apply-ready.</p>';
  } else if (strongPath && emailGiven) {
    jump = '<a class="cta cta-red" id="jump-btn-2" data-jump href="'+jumpParams(m)+'">Continue to your matched card →</a>' +
      '<p class="micro">Your profile is strong — a few of these may already fit you.</p>';
  } else if (emailFirst && emailGiven) {
    // FB fix (Shelby): sudah isi email — JANGAN gate ulang; tampilkan match + Continue langsung
    jump = '<a class="cta cta-red" id="jump-btn" data-jump href="'+jumpParams(m)+'">Continue to your matched card →</a>' +
      '<p class="micro">Your match report was sent to your email — this page shows the same breakdown.</p>';
  } else if (bot && emailGiven) {
    jump = '<a class="cta cta-red" id="jump-btn" data-jump href="'+jumpParams(m)+'">Continue to your matched card →</a>' +
      '<p class="micro">Your match report was sent to your email.</p>';
  } else if (seesMatch) {
    // EMAIL GATE SCREEN: match TIDAK ditampilkan dulu — hasil dikirim ke email (gimmick value)
    box.innerHTML =
      '<div class="verdict" style="text-align:center;padding:34px 18px">' +
        '<div class="match" style="font-size:14px">Your match is ready</div>' +
        '<h2 style="font-size:clamp(22px,3.4vw,28px);font-weight:450;margin:10px 0 8px;color:var(--ink)">Where should we send your full match report?</h2>' +
        '<p class="why" style="max-width:44ch;margin:0 auto">Enter your email and we\'ll send your complete match breakdown — your top card, why it fits, and the alternatives worth comparing. Takes about 60 seconds to read.</p>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:18px">' +
          '<input id="ef-email" type="email" placeholder="you@email.com" style="flex:1;min-width:220px;max-width:280px;padding:14px 16px;font-size:16px;border:1.5px solid var(--hairline);border-radius:10px">' +
          '<button class="cta cta-red" id="ef-send" style="padding:14px 22px">Send My Match Report →</button></div>' +
        '<p class="micro" style="margin-top:8px">Free · Double opt-in · Unsubscribe anytime · <a href="'+base+'privacy.html">Privacy</a></p>' +
        '<p class="micro" id="ef-err" style="color:var(--bad);display:none">That email doesn\'t look right — example: name@email.com</p>' +
        '<div id="gate-result" style="display:none;margin-top:26px"></div>' +
      '</div>';
    forwardUtmLinks();
    track('results_view',{matched:m, odds:o, fit, intent, bot, gate:'email_gate'});
    track('ef_open',{fit,intent,m,auto:1});
    const efSend=document.getElementById('ef-send');
    if (efSend) efSend.addEventListener('click',()=>{
      const em=document.getElementById('ef-email').value.trim();
      if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)){ document.getElementById('ef-err').style.display='block'; return; }
      track('email_optin',{source:'email_first_gate',email_domain:em.split('@')[1]});
      try{ fetch('/api/email',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lid:getLid(),email:em}),keepalive:true}).catch(()=>{});}catch(e){}
      track('ef_sent',{fit,intent});
      sessionStorage.setItem('cp_email_gate','1');
      // FB2: match tampil langsung — Continue ke matched card TANPA Unlock button
      document.getElementById('gate-result').style.display='block';
      document.getElementById('gate-result').innerHTML =
        '<p class="micro" style="margin-bottom:6px">✓ Sent — your full report is on its way to <strong>'+em.replace(/[<>&"]/g,'')+'</strong></p>' +
        (idx>0?'<div class="match">Match '+(idx+1)+' of '+top3.length+'</div>':'<div class="match">Your top match</div>') +
        '<div class="cardname">'+card.name+'</div>' +
        '<span class="odds-band '+band+'"><span class="odds">Approval odds: '+ODDS_LABEL[o]+'</span></span>' +
        cardVisualHTML(m,'verdict-card') +
        (card.warn?'<p class="warn-line">⚠ '+card.warn+'</p>':'') +
        '<p class="why">'+card.why+'</p>' + contraNote +
        '<a class="cta cta-red" id="jump-btn" data-jump href="'+jumpParams(m)+'">Continue to your matched card →</a>' +
        '<p class="micro">You\'ll go to our full guide — about 2 minutes to apply-ready.</p>' +
        carouselHTML(top3, idx, o, fit, intent, oddsFor) +
        '<p class="disclaimer-sm">Estimate based on publicly available approval criteria — not a guarantee or pre-approval. Educational content only, not financial advice.</p>';
      forwardUtmLinks();
      document.querySelectorAll('a[data-slide]').forEach(a=>a.addEventListener('click',()=>track('match_slide',{from:m,to:new URLSearchParams(a.getAttribute('href').split('?')[1]||'').get('m'),idx:idx+1,fit,intent})));
  const jb=document.getElementById('jump-btn'); if(jb) jb.addEventListener('click',()=>track('jump_click',{lid:getLid(),fit,intent,m,o}));
      if (document.getElementById('gate-result').scrollIntoView) document.getElementById('gate-result').scrollIntoView({behavior:'smooth'});
    });
    return; // gate screen — result render berhenti di sini sampai email
  } else {
    jump = '<a class="cta-secondary" href="quiz.html">Retake the quiz for your full match →</a>' +
      '<p class="micro">Meanwhile, the guides below are picked for your situation.</p>';
  }

  box.innerHTML =
    '<div class="verdict">' +
      '<div class="match">Your top match</div>' +
      '<div class="cardname">'+card.name+'</div>' +
      '<span class="odds-band '+band+'"><span class="odds">Approval odds: '+ODDS_LABEL[o]+'</span></span>' +
      cardVisualHTML(m,'verdict-card') +
      (card.warn?'<p class="warn-line">⚠ '+card.warn+'</p>':'') +
      '<p class="why">'+card.why+'</p>' + contraNote + jump +
      carouselHTML(top3, idx, o, fit, intent, oddsFor) +
      '<p class="disclaimer-sm">Estimate based on publicly available approval criteria — not a guarantee or pre-approval. Educational content only, not financial advice.</p>' +
    '</div>';
  forwardUtmLinks();
  track('results_view',{matched:m, odds:o, fit, intent, bot, gate: qualified?'jump':(strongPath?'strong':(bot?'botsec':(emailFirst?'emailfirst':'education')))});
  document.querySelectorAll('a[data-slide]').forEach(a=>a.addEventListener('click',()=>track('match_slide',{from:m,to:new URLSearchParams(a.getAttribute('href').split('?')[1]||'').get('m'),idx:idx+1,fit,intent})));
  const jb=document.getElementById('jump-btn'); if(jb) jb.addEventListener('click',()=>track('jump_click',{lid:getLid(),fit,intent,m,o}));
  const jb2=document.getElementById('jump-btn-2'); if(jb2) jb2.addEventListener('click',()=>{ track('jump_click',{lid:getLid(),fit,intent,m,o,strong:1}); track('intent_bump',{src:'strong_path',amount:10}); });
  const spSend=document.getElementById('sp-send');
  if (spSend) spSend.addEventListener('click',()=>{
    const em=document.getElementById('sp-email').value.trim();
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)){ document.getElementById('sp-err').style.display='block'; return; }
    track('email_optin',{source:'strong_path'});
    try{ fetch('/api/email',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lid:getLid(),email:em}),keepalive:true}).catch(()=>{});}catch(e){}
    spSend.textContent='Saved → check inbox'; spSend.style.pointerEvents='none';
  });
  // FB1/FB2: ef-btn & ef-send ditangani di email-gate screen di atas (return lebih awal) — handler lama dihapus
}

// ---------- SUB1: render result dari server (signed token) ----------
function resultsRenderServer(box, p) {
  const S = JSON.parse(sessionStorage.getItem('cp_server_result')||'null');
  if (!S) { box.innerHTML = '<div class="verdict" style="text-align:center;padding:30px"><p class="why">Quiz session expired. <a href="/start/quiz.html" style="font-weight:500">Retake the quiz →</a></p></div>'; return; }
  const m=S.match, o=S.odds, fit=S.fit, intent=S.intent, top3=S.top3||[];
  const card=CARDS[m]||{name:m, why:''};
  const emailGiven = sessionStorage.getItem('cp_gate_done')==='1';
  const seesMatch = true; // server yang putuskan via gate_required

  if (!emailGiven) {
    box.innerHTML =
      '<div class="verdict" style="text-align:center;padding:clamp(28px,5vw,44px) clamp(18px,4vw,34px)">' +
        '<div class="match" style="font-size:14px">Your match is ready</div>' +
        '<h2 style="font-size:clamp(22px,3.4vw,28px);font-weight:450;margin:10px 0 8px;color:var(--ink)">Where should we send your full match report?</h2>' +
        '<p class="why" style="max-width:44ch;margin:0 auto">Enter your email and we\'ll send your complete match breakdown — your top card, why it fits, and the alternatives worth comparing.</p>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:18px">' +
          '<input id="ef-email" type="email" placeholder="you@email.com" style="flex:1;min-width:220px;max-width:280px;padding:14px 16px;font-size:16px;border:1.5px solid var(--hairline);border-radius:10px">' +
          '<button class="cta cta-red" id="ef-send" style="padding:14px 22px">Send My Match Report →</button></div>' +
        '<p class="micro" style="margin-top:8px">Free · Double opt-in · Unsubscribe anytime · <a href="/privacy.html">Privacy</a></p>' +
        '<p class="micro" id="ef-err" style="color:var(--bad);display:none">That email doesn\'t look right — example: name@email.com</p>' +
        '<div id="gate-result" style="display:none;margin-top:26px"></div>' +
      '</div>';
    track('results_view',{matched:m,odds:o,fit,intent,gate:'email_gate',sub:'sub1'});
    const send=document.getElementById('ef-send');
    if (send) send.addEventListener('click',()=>{
      const em=document.getElementById('ef-email').value.trim();
      if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)){ document.getElementById('ef-err').style.display='block'; return; }
      track('email_optin',{source:'email_gate',sub:'sub1'});
      try{ fetch('/api/email',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({lid:getLid(),email:em}),keepalive:true}).catch(()=>{});}catch(e){}
      track('ef_sent',{fit,intent});
      sessionStorage.setItem('cp_gate_done','1');
      // FB-Shelby (27 Okt): setelah email → LANGSUNG pindah ke SUB2 match card (klik-user, bukan auto)
      const cur=top3[0]||{k:m,o:o};
      const cc0=CARDS[cur.k]||card;
      // v4.3.2 (Shelby): landing SUB2 = MATCH CAROUSEL (results) — slide antar-halaman dulu,
      // baru klik Continue → P1 single card. URL bersih (lid-based, token server-side).
      const jumpQS=cleanQS(Object.assign({lid:getLid(), cp:fit,
        cq_match:cur.k, o:cur.o, g:1}, getUtm()));
      location.href='https://cardpath.seputar-ntt.com/results.html?'+jumpQS;
    });
    return;
  }
  renderMatch();

  function renderMatch(){
    const gr=document.getElementById('gate-result')||box;
    const idx=Math.max(0,(parseInt(p.get('pos')||'1',10))-1);
    const cur=top3[idx]||{k:m,o:o};
    const cc=CARDS[cur.k]||card;
    const jumpQS=new URLSearchParams(Object.assign({t:p.get('t')||'', lid:getLid(), cp:fit,
      cq_match:cur.k, o:cur.o}, getUtm())).toString();
    const prevIdx=(idx-1+top3.length)%top3.length, nextIdx=(idx+1)%top3.length;
    const slideHref=(r)=>'/start/result.html?'+new URLSearchParams(Object.assign({t:p.get('t')||'', m:top3[r]?top3[r].k:m, o:top3[r]?top3[r].o:o, pos:String(r+1), f:fit, i:intent, eg:1, lid:getLid()}, getUtm())).toString();
    const dots=top3.map((_,n)=>'<span class="cdots'+(n===idx?' on':'')+'">●</span>').join(' ');
    gr.innerHTML =
      '<div class="match">'+(idx>0?'Match '+(idx+1)+' of '+top3.length:'Your top match')+'</div>' +
      '<div class="cardname">'+cc.name+'</div>' +
      '<span class="odds-band '+(cur.o==='high'?'odds-high':cur.o==='medium'?'odds-med':'odds-low')+'"><span class="odds">Approval odds: '+ODDS_LABEL[cur.o]+'</span></span>' +
      cardVisualHTML(cur.k,'verdict-card') +
      '<p class="why">'+(cc.why||'')+'</p>' +
      (S.contra?'<p class="warn-line" style="font-size:12.5px">Some answers look inconsistent — this may affect your estimate.</p>':'') +
      '<a class="cta cta-red" id="jump-btn" data-jump href="https://cardpath.seputar-ntt.com/'+cc.slug+'.html?'+jumpQS+'">Continue to your matched card →</a>' +
      '<p class="micro">You\'ll continue on cardpath.seputar-ntt.com — your full guide, about 2 minutes to apply-ready.</p>' +
      (top3.length>1?'<div class="slide-nav" style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:20px;padding:10px 6px;border-top:1px solid var(--hairline)">' +
        '<a class="slide-btn" data-slide href="'+slideHref(prevIdx)+'" style="display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border:1px solid var(--hairline);border-radius:50%;background:#fff;font-size:18px;color:var(--ink);text-decoration:none">‹</a>' +
        '<span style="display:inline-block;line-height:1.7;font-size:12.5px;color:var(--ink-3)">'+dots+'<br>Match '+(idx+1)+' of '+top3.length+' — compare your options</span>' +
        '<a class="slide-btn" data-slide href="'+slideHref(nextIdx)+'" style="display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border:1px solid var(--hairline);border-radius:50%;background:#fff;font-size:18px;color:var(--ink);text-decoration:none">›</a></div>':'');
    document.querySelectorAll('a[data-slide]').forEach(a=>a.addEventListener('click',()=>track('match_slide',{from:cur.k,to:new URLSearchParams(a.getAttribute('href').split('?')[1]).get('m'),idx:idx+1,sub:'sub1'})));
    const jb=document.getElementById('jump-btn');
    if (jb) jb.addEventListener('click',()=>track('jump_click',{lid:getLid(),fit,intent,m:cur.k,o:cur.o,sub:'sub1'}));
    // save profile utk artikel personalisasi (SUB1 tidak punya artikel — tapi tools bisa)
    sessionStorage.setItem('cp_profile', JSON.stringify({cq_match:cur.k, o:cur.o, fit, intent, lid:getLid()}));
  }
}

// ---------- /go tracker (C1: route via outboundHref) ----------
const GO_TARGETS = {
  chime:'https://www.chime.com/', capone49:'https://www.capitalone.com/credit-cards/platinum-secured/',
  quicksilver:'https://www.capitalone.com/credit-cards/quicksilver-secured/',
  opensky:'https://www.openskycc.com/', openskynb:'https://www.openskycc.com/',
  creditone:'https://www.creditonebank.com/', indigo:'https://indigo-card.com/',
  varo:'https://www.varomoney.com/', zolve:'https://www.zolve.com/',
  self:'https://www.self.inc/', creditstrong:'https://www.creditstrong.com/', kikoff:'https://www.kikoff.com/',
  grow:'https://growcredit.com/', petal2:'https://petalcard.com/',
  experian:'https://www.experian.com/boost/', boompay:'https://boompay.co/', creditkarma:'https://www.creditkarma.com/',
  amexnova:'https://www.americanexpress.com/',
  upgrade:'https://www.upgrade.com/',
  discoverstudent:'https://www.discover.com/credit-cards/student/',
};
function goRedirect() {
  const p = new URLSearchParams(location.search);
  const key = p.get('card');
  if (key && GO_TARGETS[key]) {
    track('outbound_click',{card:key, m:p.get('cq_match')||p.get('m')||'', o:p.get('o')||'', cp:p.get('cp')||'', lid:p.get('lid')||''});
    document.body.innerHTML = '<div style="font-family:sans-serif;max-width:520px;margin:15vh auto;text-align:center;padding:0 20px">' +
      '<h2>Taking you to the issuer…</h2>' +
      '<p>You are being redirected to <strong>'+GO_TARGETS[key]+'</strong>. We may earn a commission if you apply.</p>' +
      '<p><a href="'+GO_TARGETS[key]+'">Continue now →</a></p>' +
      '<p style="font-size:12px;color:#888">Lid: '+getLid()+'</p></div>';
    setTimeout(()=>{ location.href = GO_TARGETS[key]; }, 2500);
  } else {
    document.body.innerHTML = '<div style="font-family:sans-serif;margin:15vh auto;text-align:center">Unknown card. <a href="/">Back home</a></div>';
  }
}

// ---------- KALKULATOR (blueprint §4.1) ----------
function calcOdds() {
  const form=document.getElementById('calc-odds-form');
  if(!form) return;
  form.addEventListener('submit',e=>{
    e.preventDefault();
    const score=document.getElementById('co-score').value;
    const denied=document.getElementById('co-denied').value;
    const dep=+document.getElementById('co-deposit').value;
    const out=document.getElementById('co-out');
    const rows=[
      {c:'Discover it Secured — PAUSED', need:'good', d:'Closed to new applications June 2026 — see alternatives', dep:99999, paused:true},
      {c:'Capital One Platinum Secured', need:'bad', d:'Secured — from $49 deposit', dep:49},
      {c:'OpenSky Secured Visa', need:'none', d:'Secured — no credit check', dep:150},
      {c:'Petal 2 Visa (SSN)', need:'fair', d:'Unsecured — cash-flow underwriting', dep:0},
      {c:'Credit One Platinum', need:'fair', d:'Unsecured — annual fee $75–99', dep:0},
    ];
    const band=v=>v==='very'?['Very likely','odds-high']:v==='likely'?['Likely','odds-med']:['Possible','odds-low'];
    const html=rows.map(r=>{
      if (r.paused) return '<div class="alt" style="opacity:.6"><span><strong>'+r.c+'</strong><br><small>'+r.d+'</small></span><span class="odds-band odds-med">—</span></div>';
      let v='chance';
      if (score==='good') v='very';
      else if (score==='fair') v=(r.need!=='good')?'likely':'chance';
      else if (score==='bad') v=(r.need==='none'||r.need==='bad')?'likely':'chance';
      else v=(r.need==='none')?'likely':'chance';
      if (denied==='1' && v==='very') v='likely';
      if (r.dep>dep) v='chance';
      const [label,cls]=band(v);
      return '<div class="alt"><span><strong>'+r.c+'</strong><br><small>'+r.d+'</small></span><span class="odds-band '+cls+'">'+label+'</span></div>';
    }).join('');
    out.innerHTML=html+'<p class="disclaimer-sm">Estimates from publicly available issuer criteria. Apply one at a time; start with soft-pull pre-qualification when available.</p>';
    sessionStorage.setItem('cp_calc_used','1');
    track('calculator_use',{calc:'approval_odds',score_bump:10});
    out.style.display='grid';
  });
}

// ---------- debug hook ----------
window.__cpDebug = {
  setAnswers(vals, timestamps, backs){ answers=vals.map(v=>({vi:0,val:v})); if(timestamps) qTimestamps=timestamps; if(backs!==undefined) backCount=backs; },
  computeScore, quizMatch, quizOddsFor, quizAlts, botFilter, fitScore, intentScore,
  scoreCandidate, hardConstraints, get state(){ return {answers,qTimestamps,backCount,qi}; }
};

// ---------- init ----------
document.addEventListener('DOMContentLoaded', () => {
  forwardUtmLinks();
  quizRender();
  resultsRender();
  calcOdds();
  if (document.getElementById('go-root')) goRedirect();
  document.querySelectorAll('.cta, .nav-cta').forEach(el=>
    el.addEventListener('click',()=>track('cta_click',{label:el.textContent.trim().slice(0,40)})));
});

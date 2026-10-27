#!/usr/bin/env python3
# Generator money pages v2 — P1 (600-900 kata + FAQ JSON-LD + satu CTA + sticky bar) & P2 per kartu, + editorial pages
import json, html

DATA = json.load(open('/root/cardpath-demo/page_data.json'))
CARDS, EDITORIAL = DATA['CARDS'], DATA['EDITORIAL']

FOOTER = '''
<footer>
  <div class="wrap">
    <div class="cols">
      <div><a href="about.html">About</a><a href="editorial-policy.html">Editorial Policy</a><a href="contact.html">Contact</a></div>
      <div><a href="privacy.html">Privacy (CCPA)</a><a href="terms.html">Terms</a><a href="affiliate-disclosure.html">Affiliate Disclosure</a></div>
    </div>
    <p class="fine">CardPath is an independent educational resource and may earn a commission from partners. We are not a lender, issuer, or credit repair organization. Card names, logos, and offers belong to their respective issuers. Estimates are based on publicly available approval criteria and are not a guarantee, pre-approval, or financial advice. © 2026 CardPath.</p>
  </div>
</footer>'''

DISC = '<div class="disclosure">Editorial content only. We may earn a commission from partners. Rates &amp; fees may change — see full <a href="affiliate-disclosure.html">affiliate disclosure</a>.</div>'
TOPBAR = '''<header class="topbar">
  <div class="logo">Card<span class="dot">Path</span></div>
  <nav>
    <a data-fwd href="index.html">Home</a>
    <a data-fwd href="start/quiz.html">Quiz</a>
    <a data-fwd href="calculator-approval-odds.html">Calculator</a>
    <a data-fwd href="start/quiz.html" class="nav-cta">Find My Card</a>
  </nav>
</header>'''

def faq_html(faq):
    return '\n'.join(f'<details{" open" if i==0 else ""}><summary>{q}</summary><div class="a">{a}</div></details>' for i,(q,a) in enumerate(faq))

def faq_jsonld(faq, page_name):
    import json as j
    ents = [{"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}} for q,a in faq]
    return ('<script type="application/ld+json">\n' + j.dumps({
        "@context":"https://schema.org","@type":"FAQPage","name":page_name,"mainEntity":ents
    }, indent=1) + '\n</script>')

def p1_page(slug, c):
    key = c['key']; name=c['name']
    faq = c['faq']
    b = c['body']
    fit = ''.join(f'<li>{x}</li>' for x in b['fit'])
    nofit = ''.join(f'<li>{x}</li>' for x in b['nofit'])
    warn = f'<p class="warn-line">⚠ {c["warn"]} — shown up front, because honesty beats surprises.</p>' if c.get('warn') else ''
    fee_row = f'<tr><td>Annual fee</td><td class="fee">{c["fee"]}</td><td>See issuer terms for full schedule</td></tr>'
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{name} — {c['angle'].replace('-',' ').title()} | CardPath</title>
<meta name="description" content="{c['hero'][:150]}">
<link rel="stylesheet" href="style.css">
{faq_jsonld(faq, name)}
</head>
<body>
{DISC}
{TOPBAR}

<div class="wrap"><div class="ad-slot ad-top">Ad slot · top banner</div></div>

<main class="wrap">
  <section class="card-hero">
    <div>
      <span class="badge-noimpact">✓ No impact on your credit score to check</span>
      <h1 style="font-size:clamp(28px,4.4vw,40px);font-weight:450">{c['h1']}</h1>
      <p class="sub">{c['hero']}</p>
      <div class="trust-inline">
        <span>✓ Reports to 3 bureaus</span>
        <span>✓ Deposit from {c['dep']}</span>
        <span>✓ Annual fee {c['fee']}</span>
      </div>
      {warn}
      <br>
      <a class="cta cta-red" data-fwd href="{slug}-how-to-apply.html">See How to Request Your Card →</a>
      <p class="micro">You will continue on our website · Free guide, no card required</p>
    </div>
    <div class="card-visual" aria-hidden="true">
      <div class="chip"></div>
      <div class="num-p">•••• •••• •••• 1234</div>
      <div class="brandline"><span>{c['network']}</span></div>
    </div>
  </section>

  <section style="padding-top:0">
    <div class="kicker">Why it works</div>
    <div class="vp-track">
      <div class="vp"><div class="n">01</div><h4>Reports to all 3 bureaus</h4><p>Equifax, Experian, TransUnion — the raw material of a score, reported from your first cycle.</p></div>
      <div class="vp"><div class="n">02</div><h4>Deposit from {c['dep']}</h4><p>{c['depNote']}.</p></div>
      <div class="vp"><div class="n">03</div><h4>Annual fee {c['fee']}</h4><p>{'No annual fee — the card costs nothing while it builds your file.' if c['fee']=='$0' else 'The fee is shown up front — no statement surprises.'}</p></div>
      <div class="vp"><div class="n">04</div><h4>{c['grad'].split(' via ')[0].title()}</h4><p>Graduation path: {c.get('grad','—')}.</p></div>
    </div>
    <div class="vp-dots" aria-hidden="true"><i class="on"></i><i></i><i></i><i></i></div>
  </section>

  <section class="soft">
    <div class="kicker">The details</div>
    <h2 class="sec">{c['h1']}</h2>
    <br>
    <p>{b['hook'][0]}</p>
    <p style="margin-top:14px">{b['hook'][1]}</p>
    <h3 style="margin:26px 0 8px;font-size:19px">How it works</h3>
    <p>{b['how']}</p>
    <h3 style="margin:26px 0 8px;font-size:19px">Who it's for — and who should look elsewhere</h3>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:22px" class="fit-grid">
      <div><strong style="color:var(--good)">Good fit if you:</strong><ul style="margin:8px 0 0 18px">{fit}</ul></div>
      <div><strong style="color:var(--bad)">Look elsewhere if you:</strong><ul style="margin:8px 0 0 18px">{nofit}</ul></div>
    </div>
    <h3 style="margin:26px 0 8px;font-size:19px">Costs at a glance</h3>
    <table class="fee-table">
      <thead><tr><th>Item</th><th>Cost</th><th>Notes</th></tr></thead>
      <tbody>
        {fee_row}
        <tr><td>Security deposit</td><td class="fee">{c['dep']}</td><td>{c['depNote']}</td></tr>
        <tr><td>Credit reporting</td><td class="fee zero">3 bureaus</td><td>Equifax · Experian · TransUnion</td></tr>
      </tbody>
    </table>
    <h3 style="margin:26px 0 8px;font-size:19px">How it compares</h3>
    <p>{b['compare']}</p>
    <p class="micro" style="margin-top:10px">Rates &amp; fees last verified Oct 2026 — verify current terms at the issuer. Editorial content, not financial advice.</p>
  </section>

  <section>
    <div class="kicker">FAQ</div>
    <h2 class="sec">Frequently asked questions</h2>
    <br>
    {faq_html(faq)}
  </section>

  <div class="wrap"><div class="ad-slot ad-inter">Ad slot · interstitial 336×280</div></div>

  <section style="text-align:center">
    <a class="cta cta-red" data-fwd href="{slug}-how-to-apply.html">See How to Request Your Card →</a>
    <p class="micro">You will continue on our website</p>
    <p class="micro" style="margin-top:14px">Not sure yet? <a data-fwd href="start/quiz.html">Take the 60-second quiz →</a></p>
  </section>
</main>

<!-- sticky mobile bar (A5: CTA tetap reachable tanpa duplikasi visual) -->
<div class="sticky-cta" id="sticky-cta">
  <div><strong style="color:var(--ink);font-size:14px">{name}</strong><br><span style="font-size:12px;color:var(--ink-3)">Deposit from {c['dep']} · fee {c['fee']}</span></div>
  <a class="cta cta-red" data-fwd href="{slug}-how-to-apply.html" style="padding:11px 18px;font-size:14.5px">Request Card →</a>
</div>

{FOOTER}
<script src="app.js"></script>
<script src="kv.js"></script>
<script>
// B6: p1_view + p1_cta_click (P1 money page)
(function(){{
  const q=new URLSearchParams(location.search);
  track('p1_view', {{ match: q.get('cq_match')||'', odds: q.get('o')||'' }});
  document.querySelectorAll('.cta').forEach(el => el.addEventListener('click', () =>
    track('p1_cta_click', {{ to: 'p2' }})));
}})();
// A5: sticky bar muncul setelah hero keluar viewport
(function(){{
  const bar=document.getElementById('sticky-cta');
  const hero=document.querySelector('.card-hero');
  if(!bar||!hero) return;
  const io=new IntersectionObserver(e=>{{ bar.classList.toggle('show', !e[0].isIntersecting); }},{{threshold:0}});
  io.observe(hero);
}})();
</script>
</body>
</html>'''

def p2_page(slug, c):
    key=c['key']; name=c['name']
    faq = c['faq'][:3]
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>How to Apply for the {name} | CardPath</title>
<meta name="description" content="Step-by-step guide to requesting the {name} — requirements, timeline, and what to expect.">
<meta name="robots" content="noindex">
<link rel="stylesheet" href="style.css">
</head>
<body>
{DISC}
{TOPBAR}

<div class="wrap"><div class="ad-slot ad-top">Ad slot · top banner</div></div>

<main class="wrap">
  <section class="hero" style="padding-bottom:6px">
    <div class="eyebrow">Apply guide</div>
    <h1 style="font-size:clamp(26px,4vw,38px);font-weight:450">How to apply for the {name}</h1>
    <div id="quiz-personal" style="display:none;margin-top:12px">
      <span class="odds-band odds-high" id="personal-badge"></span>
    </div>
  </section>

  <section style="padding-top:4px">
    <div class="quiz-shell" style="max-width:680px">
      <ul style="margin:0 0 22px 20px;color:var(--ink-2)">
        <li style="margin-bottom:8px"><strong>{c['fee'] == '$0' and 'No annual fee' or 'Annual fee: ' + c['fee']}</strong></li>
        <li style="margin-bottom:8px"><strong>{c['dep'] == '$0' and 'No deposit required' or 'Deposit from ' + c['dep'] + ' — refundable'}</strong></li>
        <li><strong>Reports to all 3 bureaus</strong> — payments build your file</li>
      </ul>

      <a class="cta cta-red full" data-out href="/go/{key}" id="outbound">Apply Now on the Issuer's Site →</a>
      <p class="micro" style="text-align:center;margin-top:8px">You will be redirected to another website.</p>

      <h2 style="font-size:20px;font-weight:500;margin:34px 0 12px">The 4 steps</h2>
      <div class="alts">
        <div class="alt"><span><strong>1.</strong> Check pre-qualification (soft pull, no score impact)</span><span class="num">~2 min</span></div>
        <div class="alt"><span><strong>2.</strong> {c['dep'] == '$0' and 'Complete the application' or 'Fund your refundable deposit'}</span><span class="num">~5 min</span></div>
        <div class="alt"><span><strong>3.</strong> Get your approval decision</span><span class="num">often instant</span></div>
        <div class="alt"><span><strong>4.</strong> Turn on autopay, keep utilization under 30%</span><span class="num">ongoing</span></div>
      </div>

      <br>
      <a class="cta-secondary" data-fwd href="start/quiz.html">Not sure yet? Take the 60-second quiz →</a>

      <h2 style="font-size:20px;font-weight:500;margin:34px 0 6px">Before you go</h2>
      {faq_html(faq)}
    </div>
  </section>

  <div class="wrap"><div class="ad-slot ad-inter" data-slot="inter" data-page="P2 closer">AdSlot 2 · INTERSTITIAL NATIVE · 336×280 · P2 closer · trigger: navbar+unhideWindow (F3) · lazy: yes</div></div>
</main>

{FOOTER}
<script src="app.js"></script>
<script src="kv.js"></script>
<script>
// A1: personalisasi dari rantai m&o (badge "Based on your quiz result")
(function(){{
  const p=new URLSearchParams(location.search);
  const m=p.get('cq_match')||p.get('m'), o=p.get('o');
  if(m&&o){{
    sessionStorage.setItem('cp_match', m);
    sessionStorage.setItem('cp_profile', JSON.stringify({{
      cq_match:m, o:o, lid:p.get('lid')||'', fit:p.get('cp')||'', intent:p.get('i')||'',
      cq_pos:p.get('cq_pos')||'', cq_goal:p.get('cq_goal')||'', cq_dep:p.get('cq_dep')||'',
      cq_timing:p.get('cq_timing')||'', cq_regen:p.get('cq_regen')||'', cq_id:p.get('cq_id')||''
    }}));
    const lbl={{high:'Very likely',medium:'Likely',low:'Possible'}}[o]||o;
    const cls={{high:'odds-high',medium:'odds-med',low:'odds-low'}}[o]||'odds-med';
    document.getElementById('quiz-personal').style.display='block';
    document.getElementById('personal-badge').className='odds-band '+cls;
    document.getElementById('personal-badge').textContent='Based on your quiz result · Approval odds: '+lbl;
    track('p2_view',{{match:m,odds:o}});
    track('sub2_landing',{{lid:p.get('lid')||'',cp:p.get('cp')||'',cq_match:m,odds:o}});
  }}
  // A1: outbound forward semua param + utm
  const out=document.getElementById('outbound');
  out.addEventListener('click',e=>{{
    e.preventDefault();
    const qs=new URLSearchParams(location.search);
    location.href='go.html?card={key}&'+qs.toString();
  }});
  // sticky bar juga di P2
  const bar=document.createElement('div');bar.className='sticky-cta';bar.id='sticky-cta';
  bar.innerHTML='<div><strong style="color:var(--ink);font-size:14px">{name}</strong><br><span style="font-size:12px;color:var(--ink-3)">Apply guide</span></div><a class="cta cta-red" href="#outbound" style="padding:11px 18px;font-size:14.5px">Apply Now →</a>';
  document.body.appendChild(bar);
  const hero=document.querySelector('.hero');
  if(hero&&'IntersectionObserver' in window){{
    const io=new IntersectionObserver(e=>{{bar.classList.toggle('show',!e[0].isIntersecting);}},{{threshold:0}});
    io.observe(hero);
  }} else bar.classList.add('show');
}})();
</script>
</body>
</html>'''

def editorial_page(slug, c):
    b=c['body']
    pitfalls_html = ('<h2 style="font-size:21px;font-weight:500;margin:30px 0 8px">What to watch out for</h2><p>'+b['pitfalls']+'</p>') if 'pitfalls' in b else ''
    steps_html = ('<h2 style="font-size:21px;font-weight:500;margin:30px 0 8px">Practical next step</h2><p>'+b['steps']+'</p>') if 'steps' in b else ''
    fit=''.join(f'<li>{x}</li>' for x in b['fit'])
    nofit=''.join(f'<li>{x}</li>' for x in b['nofit'])
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{c['h1']} | CardPath</title>
<meta name="description" content="{c['hero'][:150]}">
<link rel="stylesheet" href="style.css">
{faq_jsonld(c['faq'], c['h1'])}
</head>
<body>
{DISC}
{TOPBAR}

<div class="wrap"><div class="ad-slot ad-top">Ad slot · top banner</div></div>

<main class="wrap">
  <section class="hero" style="padding-bottom:6px">
    <div class="eyebrow">Guide</div>
    <h1 style="font-size:clamp(26px,4vw,38px);font-weight:450;max-width:26ch">{c['h1']}</h1>
    <p class="sub">{c['hero']}</p>
  </section>

  <section>
    <div class="quiz-shell" style="max-width:760px">
      <p>{b['hook'][0]}</p>
      <p style="margin-top:14px">{b['hook'][1]}</p>
      <h2 style="font-size:21px;font-weight:500;margin:30px 0 8px">How it works</h2>
      <p>{b['how']}</p>
      <h2 style="font-size:21px;font-weight:500;margin:30px 0 8px">Who each option fits</h2>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:22px" class="fit-grid">
        <div><strong style="color:var(--good)">Good fit if you:</strong><ul style="margin:8px 0 0 18px">{fit}</ul></div>
        <div><strong style="color:var(--bad)">Look elsewhere if you:</strong><ul style="margin:8px 0 0 18px">{nofit}</ul></div>
      </div>
      <h2 style="font-size:21px;font-weight:500;margin:30px 0 8px">The honest comparison</h2>
      <p>{b['compare']}</p>
      <div class="ad-slot ad-inter" data-slot="in-content" data-page="editorial" style="max-width:336px">AdSlot 2 · IN-CONTENT · 336×280 · editorial · lazy: yes</div>
      {pitfalls_html}
      {steps_html}
      <p class="micro" style="margin-top:10px">Rates &amp; fees last verified Oct 2026. Editorial content, not financial advice.</p>
      <h2 style="font-size:21px;font-weight:500;margin:30px 0 6px">Frequently asked questions</h2>
      {faq_html(c['faq'])}
      <br>
      <!-- CTA quiz (offer satu stage di atas konten — awareness→tool) -->
      <div style="text-align:center;padding:26px 0 10px">
        <h3 style="font-size:19px;font-weight:500;margin-bottom:10px">Which one fits your situation?</h3>
        <a class="cta" data-fwd href="start/quiz.html">Take the 60-Second Quiz →</a>
        <p class="micro" style="margin-top:8px">Free · No credit score impact</p>
      </div>
    </div>
  </section>
</main>

{FOOTER}
<script src="app.js"></script>
<script src="kv.js"></script>
</body>
</html>'''

# Generate
n=0
for slug,c in CARDS.items():
    open(f'/root/cardpath-demo/{slug}.html','w').write(p1_page(slug,c)); n+=1
    open(f'/root/cardpath-demo/{slug}-how-to-apply.html','w').write(p2_page(slug,c)); n+=1
for slug,c in EDITORIAL.items():
    open(f'/root/cardpath-demo/{slug}.html','w').write(editorial_page(slug,c)); n+=1
print('generated', n, 'pages')

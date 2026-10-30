#!/usr/bin/env python3
# gen_pages_v4.py — 9 produk baru (loan/fintech/utility/card) — f-string structure ala gen_pages.py
import json as J, os
FOOTER = open('/root/cardpath-demo/index.html').read()
FOOTER = FOOTER[FOOTER.find('<footer>'):]
DISC = '<div class="disclosure">Editorial content only. We may earn a commission from partners. Rates &amp; fees may change — see full <a href="affiliate-disclosure.html">affiliate disclosure</a>.</div>'
TOPBAR = '<header class="topbar"><div class="logo">Card<span class="dot">Path</span></div><nav><a data-fwd href="index.html">Home</a><a data-fwd href="start/quiz.html">Quiz</a><a data-fwd href="calculator-approval-odds.html">Calculator</a><a data-fwd href="start/quiz.html" class="nav-cta">Find My Card</a></nav></header>'
def faq_html(faq):
    return chr(10).join('<details'+(' open' if i==0 else '')+'><summary>'+q+'</summary><div class="a">'+a+'</div></details>' for i,(q,a) in enumerate(faq))
def faq_jsonld(faq, name):
    ents=[{"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}} for q,a in faq]
    return '<script type="application/ld+json">'+chr(10)+J.dumps({"@context":"https://schema.org","@type":"FAQPage","name":name,"mainEntity":ents},indent=1)+chr(10)+'</script>'
exec(open('/root/cardpath-demo/products_v4_data.py').read())
def product_page(slug, p):
    kind=p['ptype']; kindlabel={'card':'Card','loan':'Credit-Builder Loan','fintech':'Fintech','utility':'Utility'}[kind]
    is_utility = kind=='utility'
    body=p['body']; faq=p['faq']
    cta = 'Get Started - Step by Step' if not is_utility else 'Get Started'
    vis = '' if kind in ('loan','utility') else '<div class="card-visual" aria-hidden="true"><div class="chip"></div><div class="num-p">**** **** **** 1234</div><div class="brandline"><span>'+p['network']+'</span></div></div>'
    grid = '' if is_utility else '<div style="display:grid;grid-template-columns:1fr 1fr;gap:22px" class="fit-grid"><div><strong style="color:var(--good)">Good fit if you:</strong><ul style="margin:8px 0 0 18px">'+''.join('<li>'+x+'</li>' for x in body['fit'])+'</ul></div><div><strong style="color:var(--bad)">Look elsewhere if you:</strong><ul style="margin:8px 0 0 18px">'+''.join('<li>'+x+'</li>' for x in body['nofit'])+'</ul></div></div>'
    warnhtml = ('<p class="warn-line">&#9888; '+p['warn']+'</p>') if p.get('warn') else ''
    ccheck_label = {'none':'None - approval is not score-based','soft':'Soft check only - no score impact to prequalify','hard':'Hard check at application'}[p.get('ccheck','none')]
    tpl = TEMPLATE_P1
    return tpl.replace('__NAME__',p['name']).replace('__H1__',p['h1']).replace('__HERO__',p['hero']).replace('__FEE__',p['fee']).replace('__DEP__',p['dep']).replace('__DEPNOTE__',p['depNote']).replace('__WARN__',warnhtml).replace('__CCHECK__',ccheck_label).replace('__KIND__',kindlabel).replace('__SLUG__',slug).replace('__CTA__',cta).replace('__VIS__',vis).replace('__GRID__',grid).replace('__HOOK1__',body['hook'][0]).replace('__HOOK2__',body['hook'][1]).replace('__HOW__',body['how']).replace('__COMPARE__',body['compare']).replace('__FAQ__',faq_html(faq)).replace('__JSONLD__',faq_jsonld(faq,p['name']))

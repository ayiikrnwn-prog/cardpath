#!/usr/bin/env python3
# gen_pages_v4.py — 9 produk baru via TEMPLATE replace (tanpa f-string escape hell)
import json as J, os, re

FOOTER = open('/root/cardpath-demo/index.html').read()
FOOTER = FOOTER[FOOTER.find('<footer>'):]
DISC = '<div class="disclosure">Editorial content only. We may earn a commission from partners. Rates &amp; fees may change — see full <a href="affiliate-disclosure.html">affiliate disclosure</a>.</div>'
TOPBAR = '<header class="topbar"><div class="logo">Card<span class="dot">Path</span></div><nav><a data-fwd href="index.html">Home</a><a data-fwd href="start/quiz.html">Quiz</a><a data-fwd href="calculator-approval-odds.html">Calculator</a><a data-fwd href="start/quiz.html" class="nav-cta">Find My Card</a></nav></header>'

def faq_html(faq):
    return '\n'.join('<details'+(' open' if i==0 else '')+'><summary>'+q+'</summary><div class="a">'+a+'</div></details>' for i,(q,a) in enumerate(faq))

def faq_jsonld(faq, name):
    ents=[{"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}} for q,a in faq]
    return '<script type="application/ld+json">\n'+J.dumps({"@context":"https://schema.org","@type":"FAQPage","name":name,"mainEntity":ents},indent=1)+'\n</script>'

# data produk
exec(open('/root/cardpath-demo/products_v4_data.py').read())

TEMPLATE_P1 = open('/root/cardpath-demo/template_p1_v4.html').read()
TEMPLATE_P2 = open('/root/cardpath-demo/template_p2_v4.html').read()

def render(tpl, mapping):
    out = tpl
    for k,v in mapping.items():
        out = out.replace('__'+k+'__', str(v))
    return out

def product_page(slug, p):
    kind=p['ptype']; kindlabel={'card':'Card','loan':'Credit-Builder Loan','fintech':'Fintech','utility':'Utility'}[kind]
    is_utility = kind=='utility'
    body=p['body']; faq=p['faq']
    cta = 'Get Started — Step by Step' if not is_utility else 'Get Started'
    vis = '' if kind in ('loan','utility') else '<div class="card-visual" aria-hidden="true"><div class="chip"></div><div class="num-p">**** **** **** 1234</div><div class="brandline"><span>'+p['network']+'</span></div></div>'
    grid = '' if is_utility else '<div style="display:grid;grid-template-columns:1fr 1fr;gap:22px" class="fit-grid"><div><strong style="color:var(--good)">Good fit if you:</strong><ul style="margin:8px 0 0 18px">'+''.join('<li>'+x+'</li>' for x in body['fit'])+'</ul></div><div><strong style="color:var(--bad)">Look elsewhere if you:</strong><ul style="margin:8px 0 0 18px">'+''.join('<li>'+x+'</li>' for x in body['nofit'])+'</ul></div></div>'
    warnhtml = ('<p class="warn-line">&#9888; '+p['warn']+'</p>') if p.get('warn') else ''
    ccheck_label = {'none':'None — approval is not score-based','soft':'Soft check only — no score impact to prequalify','hard':'Hard check at application'}[p.get('ccheck','none')]
    vp = '''
      <div class="vp"><div class="n">01</div><h4>Reports to 3 bureaus</h4><p>Equifax, Experian, TransUnion.</p></div>
      <div class="vp"><div class="n">02</div><h4>Deposit from ''' + p['dep'] + '''</h4><p>''' + p['depNote'] + '''.</p></div>
      <div class="vp"><div class="n">03</div><h4>Fee ''' + p['fee'] + '''</h4><p>''' + ('No fees at all.' if p['fee']=='$0' else 'Shown up front — no surprises.') + '''</p></div>
      <div class="vp"><div class="n">04</div><h4>Credit check</h4><p>''' + ccheck_label + '''</p></div>'''
    return render(TEMPLATE_P1, {
        'NAME':p['name'],'H1':p['h1'],'HERO':p['hero'],'FEE':p['fee'],'DEP':p['dep'],
        'DEPNOTE':p['depNote'],'WARN':warnhtml,'KIND':kindlabel,'SLUG':slug,'CTA':cta,
        'VIS':vis,'GRID':grid,'HOOK1':body['hook'][0],'HOOK2':body['hook'][1],
        'HOW':body['how'],'COMPARE':body['compare'],'FAQ':faq_html(faq),
        'JSONLD':faq_jsonld(faq,p['name']),'VP':vp,'ANGLE':p['angle'].replace('-',' ').title(),
        'CCHECK':ccheck_label,'KEY':p['key'],
    })

def product_p2(slug, p):
    is_utility = p['ptype']=='utility'
    faq=p['faq'][:3]
    cta = 'Get Started on the Official Site' if is_utility else "Apply Now on the Issuer's Site"
    howlabel = 'How it works' if p['ptype'] in ('loan','fintech') else 'Apply guide'
    return render(TEMPLATE_P2, {
        'NAME':p['name'],'FEE':p['fee'],'DEP':p['dep'],'KEY':p['key'],'CTA':cta,
        'HOWLABEL':howlabel,'FAQ':faq_html(faq),'PTYPE':p['ptype'],'SLUG':slug,
        'FEELINE':('No fees' if p['fee']=='$0' else 'Fee: '+p['fee']),
        'DEPLINE':('No deposit' if p['dep']=='$0' else 'Deposit: '+p['dep']),
    })

os.chdir('/root/cardpath-demo')
n=0
for slug,p in PRODUCTS.items():
    open(slug+'.html','w').write(product_page(slug,p))
    open(slug+'-how-to-apply.html','w').write(product_p2(slug,p))
    n+=2
print('generated',n,'pages v4')

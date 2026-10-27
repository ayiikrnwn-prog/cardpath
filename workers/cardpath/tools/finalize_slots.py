#!/usr/bin/env python3
# finalize_slots.py — idempotent: beri data-slot + label detail ke SEMUA slot di semua halaman.
# Jalankan SETELAH gen_pages.py. Label = "fake ad" yang menunjukkan posisi/ukuran/perilaku.
import glob, re, os

ROOT='/root/cardpath-demo'

def kind_of(f):
    b=os.path.basename(f)
    rel=f.replace(ROOT+'/','')
    if 'how-to-apply' in b: return 'P2 closer'
    if b=='index.html': return 'home'
    if b=='result.html': return 'SUB1_RESULT_SPECIAL'
    if rel.startswith('start/tools'): return 'SUB1 tools'
    if rel.startswith('start'): return 'SUB1'
    if any(k in b for k in ['zero-fee','vs-','under-100','limit-increase']): return 'editorial guide'
    if any(k in b for k in ['secured','quicksilver','chime','indigo','self-','upgrade','credit-one','student']): return 'P1 money'
    return 'utility/legal'

def slot_no(kind, pos):
    # penomoran slot per halaman
    return 1 if pos=='top' else (2 if pos in ('inter','in-content','sub1-result') else 3)

def label(kind, pos):
    if pos=='top':
        return (f'AdSlot 1 · TOP BANNER · 728×90 desktop / 320×100 mobile · {kind} · '
                'lazy: NO (ATF, eager display) · refresh: NO · CLS: reserved min-height 100px')
    if pos=='inter':
        return (f'AdSlot 2 · INTERSTITIAL NATIVE · 336×280 · {kind} · '
                'GPT native · trigger: navbar + unhideWindow (F3) · lazy: yes · refresh: NO')
    if pos=='in-content':
        return (f'AdSlot 2 · IN-CONTENT · 336×280 · {kind} · lazy: yes (margin 300/150) · refresh: NO')
    if pos=='sub1-result':
        return (f'AdSlot SUB1-1 · DISPLAY · 728×90 / 320×100 · {kind} · '
                'SATU-SATUNYA slot di SUB1 (brief B0: non-monetisasi; slot ini saja, tidak selama quiz)')
    return pos

n=0
for f in glob.glob(ROOT+'/**/*.html', recursive=True):
    c=open(f).read()
    orig=c
    kind=kind_of(f)
    if kind=='SUB1_RESULT_SPECIAL':
        # slot SUB1-1 — pakai repl_sub1 eksklusif
        c=re.sub(r'<div class="ad-slot ad-top"[^>]*>.*?</div>',
                 lambda m: '<div class="ad-slot ad-top" data-slot="sub1-result" data-page="SUB1 result">'+label('SUB1 result','sub1-result')+'</div>', c)
        if c!=orig: open(f,'w').write(c); 
        continue
    # sub1-result HARUS sebelum top (agar tidak tertimpa)
    def repl_sub1(m):
        return ('<div class="ad-slot ad-top" data-slot="sub1-result" data-page="'+kind+'">'+label(kind,'sub1-result')+'</div>')
    c=re.sub(r'<div class="ad-slot ad-top" data-slot="sub1-result"[^>]*>.*?</div>', repl_sub1, c)
    c=re.sub(r'<div class="ad-slot ad-top"[^>]*>AdSlot SUB1-1[^<]*</div>', repl_sub1, c)
    # top
    def repl_top(m):
        return ('<div class="ad-slot ad-top" data-slot="top" data-page="'+kind+'">'+label(kind,'top')+'</div>')
    c=re.sub(r'<div class="ad-slot ad-top"(?![^>]*data-slot="sub1-result")[^>]*>.*?</div>', repl_top, c)
    # inter / in-content / sub1-result
    def repl_inter(m):
        return ('<div class="ad-slot ad-inter" data-slot="inter" data-page="'+kind+'">'+label(kind,'inter')+'</div>')
    c=re.sub(r'<div class="ad-slot ad-inter"[^>]*>.*?</div>', repl_inter, c)
    def repl_inc(m):
        return ('<div class="ad-slot ad-inter" data-slot="in-content" data-page="'+kind+'">'+label(kind,'in-content')+'</div>')
    c=re.sub(r'<div class="ad-slot ad-inter" data-slot="in-content"[^>]*>.*?</div>', repl_inc, c)
    if c!=orig:
        open(f,'w').write(c); n+=1
print('finalized', n, 'pages')

# Report inventory
print('\n=== INVENTORY SLOT ===')
total=0
for f in sorted(glob.glob(ROOT+'/**/*.html', recursive=True)):
    c=open(f).read()
    slots=re.findall(r'data-slot="([^"]+)"', c)
    if slots:
        total+=len(slots)
        print(f"{f.replace(ROOT+'/',''):52s} {slots}")
print('TOTAL SLOT:', total)

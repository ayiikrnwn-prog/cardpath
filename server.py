#!/usr/bin/env python3
# CardPath v2 demo server — static + /api/* stubs (B6/B8) + /console funnel
import http.server, json, threading, time, collections
from urllib.parse import urlparse

LOG = []

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory='/root/cardpath-demo', **kw)
    def log_message(self, fmt, *args): pass
    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
    def _json(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body))); self._cors(); self.end_headers()
        self.wfile.write(body)
    def do_OPTIONS(self):
        self.send_response(204); self._cors(); self.end_headers()

    def do_POST(self):
        u = urlparse(self.path)
        if u.path == '/api/track':
            try:
                ev = json.loads(self.rfile.read(int(self.headers.get('Content-Length', 0))))
                ev['_ts'] = time.time(); ev['_ip'] = self.client_address[0]
                LOG.append(ev)
                if ev.get('event') == 'quiz_complete':
                    hour_ago = time.time() - 3600
                    same = [e for e in LOG if e.get('_ip') == ev['_ip'] and e.get('event') == 'quiz_complete' and e['_ts'] >= hour_ago]
                    if len(same) >= 3:
                        ev['ip_watchlist'] = True
                        ev['score'] = min(ev.get('score', 0), 39)
            except Exception:
                pass
            self._json(200, {"ok": True})
        elif u.path == '/api/email':
            try:
                req = json.loads(self.rfile.read(int(self.headers.get('Content-Length', 0))))
                LOG.append({'event': 'email_optin_server', '_ts': time.time(), 'lid': req.get('lid')})
                self._json(200, {"ok": True, "e0_preview": {
                    "subject": "Your card match is ready",
                    "cta": "/start/result?resume=lid&lid=" + str(req.get('lid', '')),
                    "note": "production: Resend API E0-E6 (blueprint B8)"}})
            except Exception:
                self._json(400, {"ok": False})
        else:
            self._json(404, {"ok": False})

    def do_GET(self):
        u = urlparse(self.path)
        if u.path == '/console':
            counts = collections.Counter(e.get('event') for e in LOG)
            rows = [
                ('quiz_start', 'Quiz started'), ('quiz_complete', 'Quiz completed'),
                ('jump_click', 'Jump clicked (qualified)'), ('secondary_view', 'Secondary path viewed'),
                ('resume_engagement', 'Resume from email (+10)'), ('results_view', 'Result viewed'),
                ('cta_click', 'CTA clicked'), ('p1_view', 'P1 viewed'), ('p1_cta_click', 'P1 CTA clicked'),
                ('p2_view', 'P2 viewed'), ('sub2_landing', 'SUB2 landing (jump)'),
                ('outbound_click', 'Outbound (apply)'), ('email_optin', 'Email opt-in'),
                ('calculator_use', 'Calculator used'), ('fraud_flag', 'Fraud flags'),
            ]
            h = ['<!DOCTYPE html><html><head><meta charset="utf-8"><title>Console — CardPath funnel</title><style>',
                 'body{font-family:monospace;background:#14141c;color:#e6e6ee;padding:34px;max-width:760px;margin:auto}',
                 'h1{font-size:20px;font-weight:500} .row{display:flex;justify-content:space-between;padding:9px 12px;border-bottom:1px solid #2a2a38}',
                 '.big{font-size:30px;font-weight:450} .mut{color:#8a8a9a} a{color:#7aa}',
                 '</style></head><body><h1>CardPath Console <span class="mut">(demo funnel)</span></h1>',
                 f'<p class="mut">{len(LOG)} events · {counts.get("quiz_start",0)} quizzes</p>']
            # B-6 breakdown per timing & regency (dari meta event quiz_complete)
            timing_c = collections.Counter(e.get('cq_timing') for e in LOG if e.get('cq_timing'))
            regency_c = collections.Counter(e.get('cq_regen') for e in LOG if e.get('cq_regen'))
            h.append('<h2 style="font-size:15px;font-weight:500;margin:24px 0 6px">Breakdown — timing (Q2)</h2>')
            for k, v in (timing_c or {'(belum ada)':0}).items():
                h.append(f'<div class="row"><span>{k}</span><span class="big">{v}</span></div>')
            h.append('<h2 style="font-size:15px;font-weight:500;margin:24px 0 6px">Breakdown — regency (Q1)</h2>')
            for k, v in (regency_c or {'(belum ada)':0}).items():
                h.append(f'<div class="row"><span>{k}</span><span class="big">{v}</span></div>')
            h.append('<h2 style="font-size:15px;font-weight:500;margin:24px 0 6px">Breakdown — identity (Q4, cq_id)</h2>')
            id_c = collections.Counter(e.get('cq_id') for e in LOG if e.get('cq_id'))
            for k, v in (id_c or {'(belum ada)':0}).items():
                h.append(f'<div class="row"><span>{k}</span><span class="big">{v}</span></div>')
            h.append('<h2 style="font-size:15px;font-weight:500;margin:24px 0 6px">Match spread (live)</h2>')
            mt_c = collections.Counter(e.get('cq_match') or e.get('matched') for e in LOG if (e.get('cq_match') or e.get('matched')))
            for k, v in (mt_c or {'(belum ada)':0}).items():
                h.append(f'<div class="row"><span>{k}</span><span class="big">{v}</span></div>')
            for k, label in rows:
                h.append(f'<div class="row"><span>{label}</span><span class="big">{counts.get(k,0)}</span></div>')
            h.append('<p class="mut" style="margin-top:18px">Event log (terakhir 30):</p><pre style="font-size:11px;color:#9a9aaa;white-space:pre-wrap">')
            for e in LOG[-30:]:
                h.append(json.dumps({k: e.get(k) for k in ('event', 'lid', 'matched', 'odds', 'score', 'step', 'ip_watchlist')}) + '\n')
            h.append('</pre><p><a href="/">← back to site</a></p></body></html>')
            body = ''.join(h).encode()
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.send_header('Content-Length', str(len(body))); self._cors(); self.end_headers()
            self.wfile.write(body)
        elif u.path == '/api/funnel':
            self._json(200, dict(collections.Counter(e.get('event') for e in LOG)))
        elif u.path == '/api/ipstatus':
            ip = self.client_address[0]
            hour_ago = time.time() - 3600
            n = len([e for e in LOG if e.get('_ip') == ip and e.get('event') == 'quiz_complete' and e['_ts'] >= hour_ago])
            self._json(200, {"submissions_last_hour": n, "watchlisted": n >= 3})
        elif u.path.startswith('/template_') or '/template_' in u.path:
            self.send_error(404, 'Not found')
        else:
            super().do_GET()

if __name__ == '__main__':
    srv = http.server.ThreadingHTTPServer(('0.0.0.0', 8931), Handler)
    print('CardPath v2 server on :8931')
    srv.serve_forever()

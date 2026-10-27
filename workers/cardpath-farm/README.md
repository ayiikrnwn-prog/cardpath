

---

## API CONTRACT — `POST /api/track`

Batch-first-party tracking. `Content-Type: application/json`.
Payload: `{"batch":[{lid WAJIB non-empty string, event WAJIB dari VALID_EVENTS, sub, page, session_id, utm:{...}, device, country, depth?, engaged_sec?, data:{}}]}`
VALID_EVENTS: session_start page_view scroll_depth heartbeat session_end quiz_start quiz_complete gate_completed jump_click sub2_landing p1_view p2_view outbound_click match_slide click view
Response: `{"ok":true,"saved":N,"rejected":M}` — event tidak valid TIDAK pernah masuk D1.

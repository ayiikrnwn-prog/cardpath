
CREATE TABLE IF NOT EXISTS funnel_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  lid TEXT,
  event TEXT NOT NULL,
  sub TEXT,
  page TEXT,
  utm_source TEXT,
  meta_json TEXT
);
CREATE INDEX IF NOT EXISTS idx_fe_lid ON funnel_events(lid);
CREATE INDEX IF NOT EXISTS idx_fe_event ON funnel_events(event);
CREATE INDEX IF NOT EXISTS idx_fe_ts ON funnel_events(ts);

CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  lid TEXT,
  email TEXT NOT NULL,
  source TEXT,
  meta_json TEXT
);
CREATE INDEX IF NOT EXISTS idx_leads_lid ON leads(lid);
CREATE INDEX IF NOT EXISTS idx_leads_ts ON leads(ts);

-- v4.3.1: results lookup by lid (token tidak lagi lewat URL)
CREATE TABLE IF NOT EXISTS results (
  lid TEXT PRIMARY KEY,
  ts INTEGER NOT NULL,
  token TEXT NOT NULL,
  meta_json TEXT
);

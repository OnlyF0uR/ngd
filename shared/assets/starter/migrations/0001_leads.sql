-- Leads from the conversational contact form. Apply with:
--   npx wrangler d1 migrations apply <database_name> --local   (then --remote for production)
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  answers TEXT NOT NULL, -- JSON object with every answered question
  source_path TEXT
);
CREATE INDEX IF NOT EXISTS leads_created_at ON leads (created_at);

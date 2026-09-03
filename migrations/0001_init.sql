CREATE TABLE IF NOT EXISTS users (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 username TEXT UNIQUE NOT NULL,
 password_hash TEXT NOT NULL,
 role TEXT NOT NULL CHECK(role IN ('ADMIN','BGH','CSGD')),
 school TEXT,
 active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS students (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 mssv TEXT UNIQUE NOT NULL,
 full_name TEXT, school TEXT, cohort TEXT, major TEXT,
 pa1_score REAL, pa1_level TEXT, pa1_valid INTEGER DEFAULT 0,
 pa2_score REAL, pa2_level TEXT, pa3_score REAL, pa3_level TEXT,
 best_level TEXT, method TEXT, status TEXT, alerts TEXT DEFAULT '[]',
 registration_pa1 TEXT, note TEXT, pa3_source TEXT,
 updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS audit_log (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 actor_username TEXT, role TEXT, school TEXT,
 action TEXT NOT NULL, entity TEXT, entity_id TEXT, metadata TEXT
);
CREATE TABLE IF NOT EXISTS sessions (
 token TEXT PRIMARY KEY,
 user_id INTEGER NOT NULL,
 expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_students_school ON students(school);
CREATE INDEX IF NOT EXISTS idx_students_mssv ON students(mssv);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);
-- Demo users (SHA-256 hashes below)
INSERT OR IGNORE INTO users(username,password_hash,role,school) VALUES
('admin','240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9','ADMIN',NULL),
('bgh','f2979497f5294575386be7031aa1814b6c8a1ca73f4d6817dfa57631a300efda','BGH',NULL),
('dhspkt','da7bbcd0803f776398e57da9dc7842bddd92e074a8c2cee84ddf35278bbfe2dd','CSGD','ĐHSPKT'),
('dhsp','8d2109a0fff7ecdbb7553eac0111a15483b530f9a2576fe00e49c3873c07ee9b','CSGD','ĐHSP'),
('dhkt','c33dadaeae06f411c08e035e3b8d935b725ab254ce2a5a4ae56968b96cea7ed5','CSGD','ĐHKT'),
('dhbk','155deccf9c1c5c52490738d196bb8aa57b6fffc49536567db86be84e985982c0','CSGD','ĐHBK'),
('dhcntt','2e16eeffa5b3051f979892374bacf2bc6cd8b7fd69b7215c95193485ad45ee6d','CSGD','ĐH CNTT');

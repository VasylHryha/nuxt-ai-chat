PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS _migrations
(
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL UNIQUE,
    applied_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS users
(
    id         TEXT PRIMARY KEY,
    email      TEXT    NOT NULL UNIQUE,
    name       TEXT    NOT NULL,
    created_at INTEGER NOT NULL
);

-- credentials: private auth data (one row per user + credential type)
CREATE TABLE IF NOT EXISTS credentials
(
    id              TEXT PRIMARY KEY,
    user_id         TEXT    NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    kind            TEXT    NOT NULL, -- 'password' | 'oauth' | 'magic' ...
    password_hash   TEXT,             -- present if kind='password'
    password_salt   TEXT,             -- optional if your hasher returns it separately
    password_algo   TEXT,             -- e.g. 'argon2id', 'bcrypt'
    password_params TEXT,             -- JSON: {memory,iterations,parallelism} or bcrypt cost
    created_at      INTEGER NOT NULL,
    updated_at      INTEGER NOT NULL,
    UNIQUE (user_id, kind)
);

-- optional: session tokens if you want server sessions
CREATE TABLE IF NOT EXISTS sessions
(
    id         TEXT PRIMARY KEY, -- random token (base64url)
    user_id    TEXT    NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    ip         TEXT,
    ua         TEXT
);

-- optional: password reset tokens / email verification
CREATE TABLE IF NOT EXISTS password_resets
(
    id         TEXT PRIMARY KEY, -- random token
    user_id    TEXT    NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    used_at    INTEGER
);
CREATE INDEX IF NOT EXISTS idx_credentials_user ON credentials (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);

CREATE TABLE IF NOT EXISTS connections
(
    id            TEXT PRIMARY KEY,
    user_id       TEXT    NOT NULL,
    label         TEXT    NOT NULL,
    provider      TEXT    NOT NULL,
    model         TEXT    NOT NULL,
    base_url      TEXT,
    settings_json TEXT,
    created_at    INTEGER NOT NULL,
    updated_at    INTEGER NOT NULL,
    deleted_at    INTEGER,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chats
(
    id            TEXT PRIMARY KEY,
    user_id       TEXT    NOT NULL,
    connection_id TEXT    NOT NULL,
    title         TEXT    NOT NULL,
    created_at    INTEGER NOT NULL,
    updated_at    INTEGER NOT NULL,
    deleted_at    INTEGER,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (connection_id) REFERENCES connections (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages
(
    id                     TEXT PRIMARY KEY,
    chat_id                TEXT    NOT NULL,
    role                   TEXT    NOT NULL CHECK (role IN ('system', 'user', 'assistant', 'tool')),
    content                TEXT    NOT NULL,
    created_at             INTEGER NOT NULL,
    provider_generation_id TEXT,
    FOREIGN KEY (chat_id) REFERENCES chats (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_conn_user ON connections (user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_chats_user ON chats (user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_msgs_chat ON messages (chat_id, created_at);

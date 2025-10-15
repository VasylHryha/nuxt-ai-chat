PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS _migrations (
                                           id INTEGER PRIMARY KEY AUTOINCREMENT,
                                           name TEXT NOT NULL UNIQUE,
                                           applied_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
                                     id TEXT PRIMARY KEY,
                                     email TEXT NOT NULL UNIQUE,
                                     created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS connections (
                                           id TEXT PRIMARY KEY,
                                           user_id TEXT NOT NULL,
                                           label TEXT NOT NULL,
                                           provider TEXT NOT NULL,
                                           model TEXT NOT NULL,
                                           base_url TEXT,
                                           settings_json TEXT,
                                           created_at INTEGER NOT NULL,
                                           updated_at INTEGER NOT NULL,
                                           deleted_at INTEGER,
                                           FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS chats (
                                     id TEXT PRIMARY KEY,
                                     user_id TEXT NOT NULL,
                                     connection_id TEXT NOT NULL,
                                     title TEXT NOT NULL,
                                     created_at INTEGER NOT NULL,
                                     updated_at INTEGER NOT NULL,
                                     deleted_at INTEGER,
                                     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (connection_id) REFERENCES connections(id) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS messages (
                                        id TEXT PRIMARY KEY,
                                        chat_id TEXT NOT NULL,
                                        role TEXT NOT NULL CHECK (role IN ('system','user','assistant','tool')),
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    provider_generation_id TEXT,
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
    );

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_conn_user ON connections(user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_chats_user ON chats(user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_msgs_chat ON messages(chat_id, created_at);

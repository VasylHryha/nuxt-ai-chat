-- Add UI kind to connections to drive client routing
-- Values: 'ai-sdk' | 'native' | 'proxy' (extensible)

ALTER TABLE connections
  ADD COLUMN ui TEXT NOT NULL DEFAULT 'ai-sdk';

-- Backfill strategy: keep existing connections on 'ai-sdk' to preserve current UI
-- If you later introduce distinct UIs, update specific rows accordingly, e.g.:
--   UPDATE connections SET ui = 'proxy' WHERE provider IN ('openrouter','anthropic','google');


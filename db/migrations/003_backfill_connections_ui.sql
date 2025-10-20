-- Backfill connections.ui based on provider semantics

UPDATE connections SET ui = 'proxy'
WHERE provider IN ('openrouter','anthropic','google');

-- Keep OpenAI on 'ai-sdk' by default for now
-- Future: set ui='native' for specific OpenAI connections if needed


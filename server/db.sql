-- Example table for storing messages
CREATE TABLE IF NOT EXISTS messages (
  id bigserial PRIMARY KEY,
  conversationid text NOT NULL,
  message jsonb NOT NULL
);

-- Optional index:
CREATE INDEX IF NOT EXISTS idx_messages_conversationid ON messages (conversationid);

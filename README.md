# Chatbot Conversation Viewer (Frontend + Backend)

This repository contains a minimal working example of:
- **server**: Express + node-postgres (PG) exposing two endpoints:
  - `GET /api/conversations` - list of conversation IDs with a preview
  - `GET /api/conversations/:conversationid/messages` - messages for a conversation
- **client**: Vite + React single-page app that lists conversations and shows a chat view.

## Quick start (local)

You need Node.js (v16+) and npm installed, and optionally a Postgres database.

1. Start the server:
   ```bash
   cd server
   npm install
   # provide DB connection with environment variables or use mock mode (see below)
   node index.js
   ```
   The server runs on port 3000 by default.

2. Start the client:
   ```bash
   cd client
   npm install
   npm run dev
   ```
   The client runs on port 5173 by default and talks to `http://localhost:3000/api`.

## Postgres / Database
The server will attempt to read the following environment variables:
- `PGHOST`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, `PGPORT` (or a single `DATABASE_URL`)

If no DB connection is found, the server responds with **mock data** so you can test the frontend.

Example `messages` table (Postgres):
```sql
CREATE TABLE messages (
  id bigserial PRIMARY KEY,
  conversationid text NOT NULL,
  message jsonb NOT NULL
);
-- example insert:
INSERT INTO messages (conversationid, message) VALUES
('d8963a24f7794c819489273521871eef', '{"type":"human", "content":"es correcto"}'),
('d8963a24f7794c819489273521871eef', '{"type":"ai", "content":"¡Tu reservación ha sido registrada exitosamente..."}');
```

## Notes
- The server returns the `message` column as stored (JSONB or text). The client tries to parse it and display `content`.
- Adjust ports or `apiBase` in the client if you serve the API from a different origin.


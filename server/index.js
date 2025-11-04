// Minimal Express server with node-postgres
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Try to create a PG pool if env vars exist
let pool = null;
const hasDb = !!(process.env.DATABASE_URL || process.env.PGHOST);
if (hasDb) {
  pool = new Pool({
    //connectionString: process.env.DATABASE_URL,
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    port: process.env.PGPORT,
    ssl: { rejectUnauthorized: false}
  });
  pool.on('error', (err) => {
    console.error('Unexpected PG error', err);
  });
} else {
  console.log('No Postgres config found — server will use mock data.');
}

// Helper: run query if pool exists
async function runQuery(text, params=[]) {
  if (!pool) throw new Error('No DB');
  const res = await pool.query(text, params);
  return res.rows;
}

// GET /api/conversations
app.get('/api/conversations', async (req, res) => {
  try {
    const q = `
      SELECT
        u.nombre_completo,
        t.session_id,
        t.max_id AS last_message_id,
        substring(h.message::jsonb ->> 'content' FOR 120) AS preview
      FROM (
        SELECT session_id, MAX(id) AS max_id
        FROM beta.n8n_chat_histories
        GROUP BY session_id
      ) t
      JOIN beta.n8n_chat_histories h
        ON h.session_id = t.session_id AND h.id = t.max_id
      JOIN beta.usuarios u
        ON u.telefono = t.session_id
      ORDER BY t.max_id DESC
      LIMIT 1000;
    `;
    const { rows } = await pool.query(q);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/conversations/:session_id/messages
app.get('/api/conversations/:session_id/messages', async (req, res) => {
  try {
    const text = `SELECT id, session_id, message FROM beta.n8n_chat_histories WHERE session_id = $1 ORDER BY id ASC;`;
    const values = [req.params.session_id];
    const { rows } = await pool.query(text, values);
    // Aseguramos que message salga como string para el frontend
    const transformed = rows.map(r => ({
      id: r.id,
      conversationid: r.session_id,
      message: typeof r.message === 'object' ? JSON.stringify(r.message) : r.message
    }));
    res.json(transformed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

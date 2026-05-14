const pool = require("../config/db");
async function findAll() {
  const r = await pool.query(
    "SELECT * FROM auditoria_his ORDER BY created_at DESC LIMIT 300",
  );
  return r.rows;
}
module.exports = { findAll };

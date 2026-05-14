const { Pool } = require("pg");
const pool = new Pool({
  host: process.env.HIS_DB_HOST,
  port: process.env.HIS_DB_PORT,
  database: process.env.HIS_DB_NAME,
  user: process.env.HIS_DB_USER,
  password: process.env.HIS_DB_PASSWORD,
});
module.exports = pool;

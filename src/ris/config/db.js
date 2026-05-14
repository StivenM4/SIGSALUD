const { Pool } = require("pg");
const pool = new Pool({
  host: process.env.RIS_DB_HOST,
  port: process.env.RIS_DB_PORT,
  database: process.env.RIS_DB_NAME,
  user: process.env.RIS_DB_USER,
  password: process.env.RIS_DB_PASSWORD,
});
module.exports = pool;

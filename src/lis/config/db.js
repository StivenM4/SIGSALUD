const { Pool } = require("pg");
const pool = new Pool({
  host: process.env.LIS_DB_HOST,
  port: process.env.LIS_DB_PORT,
  database: process.env.LIS_DB_NAME,
  user: process.env.LIS_DB_USER,
  password: process.env.LIS_DB_PASSWORD,
});
module.exports = pool;

const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.AUTH_DB_HOST,
  port: process.env.AUTH_DB_PORT,
  database: process.env.AUTH_DB_NAME,
  user: process.env.AUTH_DB_USER,
  password: process.env.AUTH_DB_PASSWORD,
});

module.exports = pool;

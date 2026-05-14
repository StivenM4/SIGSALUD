const express = require("express");
const c = require("../controllers/auditoriaController");
const p = require("../middlewares/requirePermission");
const r = express.Router();
r.get("/", p("HIS_AUDIT"), c.index);
module.exports = r;

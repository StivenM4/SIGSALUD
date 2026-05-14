const express = require("express");
const c = require("../controllers/dashboardController");
const p = require("../middlewares/requirePermission");
const r = express.Router();
r.get("/", p("HIS_ACCESS"), c.index);
module.exports = r;

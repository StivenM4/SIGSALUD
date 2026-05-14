const express = require("express");
const c = require("../controllers/citaController");
const p = require("../middlewares/requirePermission");
const r = express.Router();
r.get("/", p("HIS_APPOINTMENTS"), c.index);
r.get("/crear", p("HIS_APPOINTMENTS"), c.create);
r.post("/", p("HIS_APPOINTMENTS"), c.store);
module.exports = r;

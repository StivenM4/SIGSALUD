const express = require("express");
const c = require("../controllers/pacienteController");
const p = require("../middlewares/requirePermission");
const r = express.Router();
r.get("/", p("HIS_PATIENTS"), c.index);
r.get("/crear", p("HIS_PATIENTS"), c.create);
r.post("/", p("HIS_PATIENTS"), c.store);
r.get("/:id", p("HIS_PATIENTS"), c.show);
module.exports = r;

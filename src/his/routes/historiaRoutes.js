const express = require("express");
const c = require("../controllers/historiaController");
const p = require("../middlewares/requirePermission");
const r = express.Router();
r.get("/", p("HIS_MEDICAL_RECORDS"), c.index);
r.get("/paciente/:pacienteId", p("HIS_MEDICAL_RECORDS"), c.showByPaciente);
module.exports = r;

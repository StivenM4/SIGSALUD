const express = require("express");
const c = require("../controllers/notificacionController");
const p = require("../middlewares/requirePermission");
const r = express.Router();
r.get("/", p("HIS_RESULTS"), c.index);
r.post("/:id/leida", p("HIS_RESULTS"), c.markRead);
module.exports = r;

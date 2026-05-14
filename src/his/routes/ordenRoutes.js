const express = require("express");
const c = require("../controllers/ordenController");
const p = require("../middlewares/requirePermission");
const r = express.Router();
r.get("/", p("HIS_ORDERS"), c.index);
r.get("/crear", p("HIS_ORDERS"), c.create);
r.get("/crear/tipo", p("HIS_ORDERS"), c.createByTipo);
r.post("/", p("HIS_ORDERS"), c.store);
module.exports = r;

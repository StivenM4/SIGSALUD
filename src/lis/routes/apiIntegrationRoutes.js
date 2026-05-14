const express = require("express");
const c = require("../controllers/apiIntegrationController");
const t = require("../middlewares/verifyInternalToken");
const r = express.Router();
r.post("/ordenes", t, c.receiveOrderFromHis);
r.get("/resultados/:hisOrderId", t, c.getResultByHisOrder);
module.exports = r;

const express = require("express");
const c = require("../controllers/apiIntegrationController");
const t = require("../middlewares/verifyInternalToken");
const r = express.Router();
r.post("/lis/resultados", t, c.receiveLisResult);
r.post("/ris/informes", t, c.receiveRisReport);
r.patch("/ordenes/:ordenId/estado", t, c.updateOrderStatus);
module.exports = r;

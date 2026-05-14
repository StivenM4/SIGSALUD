const repo = require("../repositories/integrationRepository");
async function receiveOrderFromHis(req, res) {
  try {
    const order = await repo.createRadiologyOrderFromHis(req.body);
    res.status(201).json({
      ok: true,
      his_order_id: req.body.his_order_id,
      ris_order_id: order.orden_ris_id,
      estudio_ris_id: order.estudio_ris_id,
      estado: "RECIBIDA",
      message: "Orden recibida correctamente por RIS",
    });
  } catch (e) {
    res.status(400).json({ ok: false, message: e.message });
  }
}
async function getReportByHisOrder(req, res) {
  try {
    const informe = await repo.getReportByHisOrderId(req.params.hisOrderId);
    if (!informe)
      return res
        .status(404)
        .json({ ok: false, message: "Informe no encontrado en RIS" });
    res.json({ ok: true, informe });
  } catch (e) {
    res.status(400).json({ ok: false, message: e.message });
  }
}
module.exports = { receiveOrderFromHis, getReportByHisOrder };

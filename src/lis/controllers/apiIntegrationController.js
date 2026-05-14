const repo = require("../repositories/integrationRepository");
async function receiveOrderFromHis(req, res) {
  try {
    const order = await repo.createOrderFromHis(req.body);
    res.status(201).json({
      ok: true,
      his_order_id: req.body.his_order_id,
      lis_order_id: order.id,
      estado: "RECIBIDA",
      message: "Orden recibida correctamente por LIS",
    });
  } catch (e) {
    res.status(400).json({ ok: false, message: e.message });
  }
}
async function getResultByHisOrder(req, res) {
  try {
    const resultado = await repo.getResultByHisOrderId(req.params.hisOrderId);
    if (!resultado)
      return res
        .status(404)
        .json({ ok: false, message: "Resultado no encontrado en LIS" });
    res.json({ ok: true, resultado });
  } catch (e) {
    res.status(400).json({ ok: false, message: e.message });
  }
}
module.exports = { receiveOrderFromHis, getResultByHisOrder };

const repo = require("../repositories/integrationRepository");
async function receiveLisResult(req, res) {
  try {
    const r = await repo.saveDiagnosticResult({
      ...req.body,
      sistema_origen: "LIS",
      tipo_resultado: "LABORATORIO",
    });
    res.status(201).json({
      ok: true,
      message: "Resultado LIS anexado a la historia clínica",
      result_id: r.id,
    });
  } catch (e) {
    res.status(400).json({ ok: false, message: e.message });
  }
}
async function receiveRisReport(req, res) {
  try {
    const r = await repo.saveDiagnosticResult({
      ...req.body,
      sistema_origen: "RIS",
      tipo_resultado: "INFORME_RADIOLOGICO",
    });
    res.status(201).json({
      ok: true,
      message: "Informe RIS anexado a la historia clínica",
      result_id: r.id,
    });
  } catch (e) {
    res.status(400).json({ ok: false, message: e.message });
  }
}
async function updateOrderStatus(req, res) {
  try {
    const r = await repo.updateOrderStatus({
      ordenId: req.params.ordenId,
      estadoCodigo: req.body.estado,
    });
    res.json({ ok: true, order: r });
  } catch (e) {
    res.status(400).json({ ok: false, message: e.message });
  }
}
module.exports = { receiveLisResult, receiveRisReport, updateOrderStatus };

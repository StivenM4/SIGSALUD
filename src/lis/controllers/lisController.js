const repo = require("../repositories/lisRepository");
const his = require("../services/hisIntegrationService");
async function dashboard(req, res) {
  res.render("dashboard/index", {
    title: "Dashboard LIS",
    stats: await repo.stats(),
  });
}
async function orders(req, res) {
  res.render("ordenes/index", {
    title: "Órdenes de laboratorio",
    ordenes: await repo.orders(),
  });
}
async function orderShow(req, res) {
  const data = await repo.orderById(req.params.id);
  res.render("ordenes/show", { title: "Detalle orden LIS", ...data });
}
async function collect(req, res) {
  const sample = await repo.collectSample(req.params.id, req.user.userId);
  res.render("muestras/etiqueta", { title: "Etiqueta de muestra", sample });
}
async function samples(req, res) {
  res.render("muestras/index", {
    title: "Muestras",
    muestras: await repo.samples(),
  });
}
async function resultsIndex(req, res) {
  res.render("resultados/index", {
    title: "Resultados de laboratorio",
    ordenes: await repo.resultOrders(),
  });
}
async function resultForm(req, res) {
  const data = await repo.orderById(req.params.id);
  res.render("resultados/form", { title: "Registrar resultados", ...data });
}
async function saveResults(req, res) {
  await repo.saveResults(req.params.id, req.body, req.user.userId);
  res.redirect("/validacion");
}
async function validations(req, res) {
  res.render("validaciones/index", {
    title: "Validación de resultados",
    ordenes: await repo.validatedOrders(),
  });
}
async function validationShow(req, res) {
  const data = await repo.validationDetail(req.params.id);
  if (!data.order) return res.status(404).send("Orden no encontrada");
  res.render("validaciones/show", {
    title: "Validar resultado LIS",
    ...data,
    error: null,
  });
}
async function validateAndSend(req, res) {
  try {
    await repo.validateOrder(req.params.id, req.user.userId);
    await his.sendValidatedResultToHis(req.params.id);
    res.redirect("/validacion");
  } catch (e) {
    const data = await repo.validationDetail(req.params.id);
    res.status(400).render("validaciones/show", {
      title: "Validar resultado LIS",
      ...data,
      error: e.message,
    });
  }
}
async function reports(req, res) {
  res.render("reportes/index", {
    title: "Reportes de laboratorio",
    reportes: await repo.reports(),
  });
}
async function report(req, res) {
  const data = await repo.orderById(req.params.id);
  res.render("reportes/show", { title: "Reporte laboratorio", ...data });
}
async function patients(req, res) {
  const search = req.query.search || "";
  res.render("pacientes/index", {
    title: "Pacientes LIS",
    pacientes: await repo.patients(search),
    search,
  });
}
async function patientHistory(req, res) {
  const data = await repo.patientHistory(req.params.id);
  if (!data.paciente) return res.status(404).send("Paciente no encontrado");
  res.render("pacientes/historial", {
    title: "Historial laboratorio",
    ...data,
  });
}
async function audit(req, res) {
  res.render("auditoria/index", {
    title: "Auditoría LIS",
    auditoria: await repo.audit(),
  });
}
module.exports = {
  dashboard,
  orders,
  orderShow,
  collect,
  samples,
  resultsIndex,
  resultForm,
  saveResults,
  validations,
  validationShow,
  validateAndSend,
  reports,
  report,
  patients,
  patientHistory,
  audit,
};

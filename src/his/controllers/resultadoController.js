const repo = require("../repositories/resultadoRepository");
const integration = require("../repositories/integrationRepository");

async function index(req, res) {
  res.render("resultados/index", {
    title: "Resultados diagnósticos",
    resultados: await repo.findAll(),
    origen: "TODOS",
  });
}
async function lis(req, res) {
  res.render("resultados/index", {
    title: "Resultados de laboratorio LIS",
    resultados: await repo.findByOrigin("LIS"),
    origen: "LIS",
  });
}
async function ris(req, res) {
  res.render("resultados/index", {
    title: "Informes radiológicos RIS",
    resultados: await repo.findByOrigin("RIS"),
    origen: "RIS",
  });
}
async function show(req, res) {
  const resultado = await repo.findById(req.params.id);
  if (!resultado) return res.status(404).send("Resultado no encontrado");
  res.render("resultados/show", { title: "Detalle resultado", resultado });
}
async function sync(req, res) {
  try {
    await integration.syncOrderFromOrigin(req.params.ordenId);
    res.redirect("/resultados");
  } catch (e) {
    res.status(400).send(e.message);
  }
}
module.exports = { index, lis, ris, show, sync };

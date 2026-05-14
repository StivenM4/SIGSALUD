const historia = require("../repositories/historiaRepository");
const resultados = require("../repositories/resultadoRepository");
async function index(req, res) {
  const search = req.query.search || "";
  res.render("historias/index", {
    title: "Historias clínicas",
    historias: await historia.findAll(search),
    search,
  });
}
async function showByPaciente(req, res) {
  const data = await historia.showByPatient(req.params.pacienteId);
  if (!data.paciente) return res.status(404).send("Paciente no encontrado");
  const resx = await resultados.findByPacienteId(req.params.pacienteId);
  const ordenes = await resultados.ordersWithResultsByPatient(
    req.params.pacienteId,
  );
  res.render("historias/show", {
    title: "Historia clínica",
    ...data,
    resultados: resx,
    ordenes,
  });
}
module.exports = { index, showByPaciente };

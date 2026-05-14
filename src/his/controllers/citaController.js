const repo = require("../repositories/citaRepository");
const paciente = require("../repositories/pacienteRepository");
const catalog = require("../repositories/catalogRepository");
async function index(req, res) {
  res.render("citas/index", {
    title: "Citas médicas",
    citas: await repo.findAll(),
  });
}
async function create(req, res) {
  res.render("citas/create", {
    title: "Crear cita",
    pacientes: await paciente.findAll(""),
    especialidades: await catalog.especialidades(),
    estados: await catalog.estadosCita(),
    error: null,
  });
}
async function store(req, res) {
  try {
    await repo.create(req.body);
    res.redirect("/citas");
  } catch (e) {
    res.status(400).render("citas/create", {
      title: "Crear cita",
      pacientes: await paciente.findAll(""),
      especialidades: await catalog.especialidades(),
      estados: await catalog.estadosCita(),
      error: e.message,
    });
  }
}
module.exports = { index, create, store };

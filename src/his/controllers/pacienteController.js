const pacienteRepository = require("../repositories/pacienteRepository");
const catalog = require("../repositories/catalogRepository");
const audit = require("../repositories/auditRepository");
async function index(req, res) {
  res.render("pacientes/index", {
    title: "Pacientes",
    pacientes: await pacienteRepository.findAll(req.query.search || ""),
    search: req.query.search || "",
  });
}
async function create(req, res) {
  res.render("pacientes/create", {
    title: "Crear paciente",
    tiposDocumento: await catalog.tiposDocumento(),
    generos: await catalog.generos(),
    error: null,
  });
}
async function store(req, res) {
  try {
    const id = await pacienteRepository.create(req.body);
    await audit.registerAudit({
      user: req.user,
      accion: "CREAR_PACIENTE",
      entidad: "pacientes",
      entidadId: id,
      req,
    });
    res.redirect(`/pacientes/${id}`);
  } catch (e) {
    res.status(400).render("pacientes/create", {
      title: "Crear paciente",
      tiposDocumento: await catalog.tiposDocumento(),
      generos: await catalog.generos(),
      error: e.message,
    });
  }
}
async function show(req, res) {
  const paciente = await pacienteRepository.findById(req.params.id);
  if (!paciente) return res.status(404).send("Paciente no encontrado");
  res.render("pacientes/show", { title: "Detalle paciente", paciente });
}
module.exports = { index, create, store, show };

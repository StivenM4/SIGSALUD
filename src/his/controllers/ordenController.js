const orden = require("../repositories/ordenRepository");
const paciente = require("../repositories/pacienteRepository");
const catalog = require("../repositories/catalogRepository");
const dispatch = require("../services/orderDispatchService");
async function index(req, res) {
  res.render("ordenes/index", {
    title: "Órdenes diagnósticas",
    ordenes: await orden.findAll(),
  });
}
async function create(req, res) {
  const tipos = await catalog.tiposOrden();
  res.render("ordenes/create", {
    title: "Crear orden",
    pacientes: await paciente.findAll(""),
    tiposOrden: tipos,
    prioridades: await catalog.prioridadesOrden(),
    procedimientos: [],
    selectedTipo: null,
    error: null,
  });
}
async function createByTipo(req, res) {
  const tipos = await catalog.tiposOrden();
  const selected = tipos.find(
    (t) => String(t.id) === String(req.query.tipo_orden_id),
  );
  const procedimientos = selected
    ? await catalog.procedimientosByTipo(
        selected.sistema_destino === "LIS" ? "LAB" : "RAD",
      )
    : [];
  res.render("ordenes/create", {
    title: "Crear orden",
    pacientes: await paciente.findAll(""),
    tiposOrden: tipos,
    prioridades: await catalog.prioridadesOrden(),
    procedimientos,
    selectedTipo: selected,
    error: null,
  });
}
async function store(req, res) {
  try {
    const procedimientos = Array.isArray(req.body.procedimientos)
      ? req.body.procedimientos
      : [req.body.procedimientos].filter(Boolean);
    if (!procedimientos.length)
      throw new Error("Debe seleccionar al menos un procedimiento");
    const id = await orden.create({
      ...req.body,
      procedimientos,
      creado_por: req.user.userId,
    });
    try {
      await dispatch.dispatchOrderToDiagnosticSystem(id);
    } catch (integrationError) {
      console.error("Error integración:", integrationError.message);
    }
    res.redirect("/ordenes");
  } catch (e) {
    res.status(400).send(e.message);
  }
}
async function resultados(req, res) {
  res.render("resultados/index", {
    title: "Resultados diagnósticos",
    resultados: await orden.findResults(),
  });
}
module.exports = { index, create, createByTipo, store, resultados };

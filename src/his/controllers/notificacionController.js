const repo = require("../repositories/notificacionRepository");
async function index(req, res) {
  res.render("notificaciones/index", {
    title: "Notificaciones",
    notificaciones: await repo.findAll(),
  });
}
async function markRead(req, res) {
  await repo.markRead(req.params.id);
  res.redirect("/notificaciones");
}
module.exports = { index, markRead };

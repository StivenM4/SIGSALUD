const repo = require("../repositories/auditoriaRepository");
async function index(req, res) {
  res.render("auditoria/index", {
    title: "Auditoría HIS",
    auditoria: await repo.findAll(),
  });
}
module.exports = { index };

const repo = require("../repositories/dashboardRepository");
async function index(req, res) {
  res.render("dashboard/index", {
    title: "Dashboard HIS",
    stats: await repo.stats(),
    recentOrders: await repo.recentOrders(),
    notifications: await repo.notifications(),
  });
}
module.exports = { index };

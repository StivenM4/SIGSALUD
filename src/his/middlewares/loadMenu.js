const menuRepository = require("../repositories/menuRepository");
async function loadMenu(req, res, next) {
  try {
    res.locals.menu = await menuRepository.getMenuByPermissions(
      req.user?.permissions || [],
    );
    res.locals.user = req.user;
    next();
  } catch (e) {
    next(e);
  }
}
module.exports = loadMenu;

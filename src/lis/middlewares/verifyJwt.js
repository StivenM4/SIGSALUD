const jwt = require("jsonwebtoken");
function verifyJwt(req, res, next) {
  const token = req.query.token || req.cookies?.sigsalud_token;
  if (!token)
    return res.redirect(
      `${process.env.AUTH_URL}?system=LIS&error=Debe iniciar sesión`,
    );
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (
      payload.system !== "LIS" ||
      !payload.permissions?.includes("LIS_ACCESS")
    )
      return res.status(403).render("errors/forbidden", {
        title: "Acceso denegado",
        requiredSystem: "LIS",
        authUrl: process.env.AUTH_URL,
      });
    req.user = payload;
    next();
  } catch (e) {
    res.clearCookie("sigsalud_token");
    return res.redirect(
      `${process.env.AUTH_URL}?system=LIS&error=Sesión vencida o inválida`,
    );
  }
}
module.exports = verifyJwt;

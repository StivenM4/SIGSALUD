function requirePermission(permissionCode) {
  return (req, res, next) => {
    if (!req.user?.permissions?.includes(permissionCode)) {
      return res.status(403).render("errors/forbidden", {
        title: "Acceso denegado",
        requiredSystem: "HIS",
        authUrl: process.env.AUTH_URL,
      });
    }
    next();
  };
}
module.exports = requirePermission;

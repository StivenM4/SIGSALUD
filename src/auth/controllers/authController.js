const authService = require("../services/authService");
const systemRepository = require("../repositories/systemRepository");

async function renderLogin(req, res) {
  const systems = await systemRepository.getActiveSystems();
  res.render("login", {
    title: "Iniciar sesión - SIGSALUD",
    systems,
    selectedSystem: req.query.system || "",
    error: req.query.error || null,
    success: req.query.success || null,
  });
}

async function login(req, res) {
  const systems = await systemRepository.getActiveSystems();
  try {
    const result = await authService.login({
      email: req.body.email,
      password: req.body.password,
      system: req.body.system,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });

    if (!result.ok) {
      return res.status(401).render("login", {
        title: "Iniciar sesión - SIGSALUD",
        systems,
        selectedSystem: req.body.system,
        error: result.message,
        success: null,
      });
    }

    res.redirect(result.redirectUrl);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).render("login", {
      title: "Iniciar sesión - SIGSALUD",
      systems,
      selectedSystem: req.body.system || "",
      error: "No fue posible iniciar sesión.",
      success: null,
    });
  }
}

function logout(req, res) {
  res.clearCookie("sigsalud_token");
  res.redirect("/login?success=Sesión cerrada correctamente");
}

function health(req, res) {
  res.json({ service: "SIGSALUD Auth", status: "online" });
}

module.exports = { renderLogin, login, logout, health };

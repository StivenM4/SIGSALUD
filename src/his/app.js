require("dotenv").config();
const path = require("path");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const verifyJwt = require("./middlewares/verifyJwt");
const loadMenu = require("./middlewares/loadMenu");
const apiRoutes = require("./routes/apiIntegrationRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const pacienteRoutes = require("./routes/pacienteRoutes");
const citaRoutes = require("./routes/citaRoutes");
const ordenRoutes = require("./routes/ordenRoutes");
const resultadoRoutes = require("./routes/resultadoRoutes");
const historiaRoutes = require("./routes/historiaRoutes");
const notificacionRoutes = require("./routes/notificacionRoutes");
const auditoriaRoutes = require("./routes/auditoriaRoutes");
const app = express();
const port = process.env.HIS_PORT || 8001;
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use("/api/integracion", apiRoutes);
app.get("/auth/callback", verifyJwt, (req, res) => {
  res.cookie("sigsalud_token", req.query.token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 1000,
  });
  res.redirect("/");
});
app.use(verifyJwt);
app.use(loadMenu);
app.use("/", dashboardRoutes);
app.use("/pacientes", pacienteRoutes);
app.use("/citas", citaRoutes);
app.use("/historias", historiaRoutes);
app.use("/ordenes", ordenRoutes);
app.use("/resultados", resultadoRoutes);
app.use("/notificaciones", notificacionRoutes);
app.use("/auditoria", auditoriaRoutes);
app.get("/logout", (req, res) => {
  res.clearCookie("sigsalud_token");
  res.redirect(`${process.env.AUTH_URL}?success=Sesión cerrada correctamente`);
});
app.use((req, res) =>
  res.status(404).render("simple", {
    title: "Ruta no encontrada",
    message: `No existe la ruta ${req.originalUrl} en HIS`,
  }),
);
app.listen(port, () => console.log(`HIS activo en http://localhost:${port}`));

require("dotenv").config();
const path = require("path");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const verifyJwt = require("./middlewares/verifyJwt");
const loadMenu = require("./middlewares/loadMenu");
const apiRoutes = require("./routes/apiIntegrationRoutes");
const risRoutes = require("./routes/risRoutes");
const app = express();
const port = process.env.RIS_PORT || 8003;
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
app.use("/", risRoutes);
app.get("/auditoria", (req, res) =>
  res.render("simple", { title: "Auditoría RIS", message: "Auditoría RIS" }),
);
app.get("/logout", (req, res) => {
  res.clearCookie("sigsalud_token");
  res.redirect(`${process.env.AUTH_URL}?success=Sesión cerrada correctamente`);
});
app.listen(port, () => console.log(`RIS activo en http://localhost:${port}`));

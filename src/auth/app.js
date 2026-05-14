require("dotenv").config();
const path = require("path");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/authRoutes");

const app = express();
const port = process.env.AUTH_PORT || 8007;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use("/", authRoutes);
app.use((req, res) =>
  res.status(404).send("Ruta no encontrada en Auth SIGSALUD"),
);

app.listen(port, () =>
  console.log(`Auth SIGSALUD activo en http://localhost:${port}/login`),
);

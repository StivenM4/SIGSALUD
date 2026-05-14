const express = require("express");
const authController = require("../controllers/authController");
const router = express.Router();

router.get("/", (req, res) => res.redirect("/login"));
router.get("/login", authController.renderLogin);
router.post("/login", authController.login);
router.get("/logout", authController.logout);
router.get("/health", authController.health);

module.exports = router;

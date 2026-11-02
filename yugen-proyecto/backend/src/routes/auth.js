// routes/auth.js
// Inicio de sesión del administrador. Se mantiene el JWT en Bearer hasta la etapa 4 (cookie httpOnly).
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.post("/login", asyncHandler(async (req, res) => {
  const email = String(req.body.email || "");
  const password = String(req.body.password || "");
  const passwordOk = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH || "");
  if (email !== process.env.ADMIN_EMAIL || passwordOk === false) {
    return res.status(401).json({ error: "Correo o contraseña incorrectos." });
  }
  const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "2h" });
  return res.json({ token });
}));

module.exports = router;

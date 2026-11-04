// routes/auth.js
// Inicio de sesión del administrador: cookie httpOnly, límite de intentos y token CSRF.
const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const asyncHandler = require("../utils/asyncHandler");
const requireAdmin = require("../middleware/requireAdmin");
const csrfProtection = require("../middleware/csrfProtection");
const { SESSION_COOKIE, sessionCookieOptions, baseOptions } = require("../utils/cookies");
const { revoke } = require("../utils/revokedSessions");

const router = express.Router();

// Máximo de intentos de login por IP en 15 minutos (configurable desde el entorno).
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.LOGIN_MAX_ATTEMPTS || 5),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos. Espera 15 minutos e intenta de nuevo." }
});

router.post("/login", loginLimiter, asyncHandler(async (req, res) => {
  const email = String(req.body.email || "");
  const password = String(req.body.password || "");
  const passwordOk = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH || "");
  if (email !== process.env.ADMIN_EMAIL || passwordOk === false) {
    return res.status(401).json({ error: "Correo o contraseña incorrectos." });
  }

  // El token CSRF viaja dentro de la sesión firmada: no es legible desde cookies ni desde otros sitios.
  const csrfToken = crypto.randomBytes(32).toString("hex");
  const session = jwt.sign({ email, csrf: csrfToken, jti: crypto.randomUUID() }, process.env.JWT_SECRET, { algorithm: "HS256", expiresIn: "2h" });
  res.cookie(SESSION_COOKIE, session, sessionCookieOptions());
  return res.json({ email, csrfToken });
}));

// Datos de la sesión actual. La página lo usa al cargar para saber si hay sesión activa.
router.get("/me", requireAdmin, (req, res) => {
  return res.json({ email: req.admin.email, csrfToken: req.admin.csrf });
});

router.post("/logout", requireAdmin, csrfProtection, (req, res) => {
  revoke(req.admin.jti, req.admin.exp);
  res.clearCookie(SESSION_COOKIE, baseOptions());
  return res.json({ ok: true });
});

module.exports = router;

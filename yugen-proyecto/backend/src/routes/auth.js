// routes/auth.js
// Inicio de sesión del administrador: cookie httpOnly, contador de fallos y token CSRF.
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
const { readConfig } = require("../config/env");

const router = express.Router();
const WINDOW_MS = 15 * 60 * 1000;

// Solo cuentan los intentos fallidos: un acceso correcto no consume cupo.
const loginLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: readConfig().loginMaxAttempts,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    const retryAfterSeconds = Math.max(1, Math.ceil((req.rateLimit.resetTime.getTime() - Date.now()) / 1000));
    return res.status(429).json({
      error: "Demasiados intentos fallidos. Espera antes de volver a intentarlo.",
      retryAfterSeconds
    });
  }
});

router.post("/login", loginLimiter, asyncHandler(async (req, res) => {
  const config = readConfig();
  const email = String(req.body.email || "");
  const password = String(req.body.password || "");
  const passwordOk = await bcrypt.compare(password, config.adminPasswordHash || "");
  if (email !== config.adminEmail || passwordOk === false) {
    const remainingAttempts = req.rateLimit ? Math.max(0, req.rateLimit.remaining) : undefined;
    return res.status(401).json({ error: "Correo o contraseña incorrectos.", remainingAttempts });
  }

  // El token CSRF viaja dentro de la sesión firmada. El identificador jti permite revocar esta sesión.
  const csrfToken = crypto.randomBytes(32).toString("hex");
  const session = jwt.sign(
    { email, csrf: csrfToken, jti: crypto.randomUUID(), aud: "admin" },
    config.jwtSecret,
    { algorithm: "HS256", expiresIn: "2h" }
  );
  res.cookie(SESSION_COOKIE, session, sessionCookieOptions());
  return res.json({ email, csrfToken });
}));

router.get("/me", requireAdmin, (req, res) => {
  return res.json({ email: req.admin.email, csrfToken: req.admin.csrf });
});

router.post("/logout", requireAdmin, csrfProtection, async (req, res) => {
  await revoke(req.admin.jti, req.admin.exp);
  res.clearCookie(SESSION_COOKIE, baseOptions());
  return res.json({ ok: true });
});

module.exports = router;

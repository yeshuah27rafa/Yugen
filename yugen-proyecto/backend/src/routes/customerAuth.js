// routes/customerAuth.js
// Rutas públicas y de sesión de cliente: registro, confirmación, inicio de sesión, recuperación y cambio de contraseña.
const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const asyncHandler = require("../utils/asyncHandler");
const requireCustomer = require("../middleware/requireCustomer");
const customerCsrf = require("../middleware/customerCsrf");
const customerService = require("../services/customerService");
const { revoke } = require("../utils/revokedSessions");
const { CUSTOMER_COOKIE, sessionCookieOptions, baseOptions } = require("../utils/cookies");
const { readConfig } = require("../config/env");

const router = express.Router();
const WINDOW_MS = 15 * 60 * 1000;

// Límite por IP para registro y recuperación (evita envío masivo de correos).
const sensitiveLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas solicitudes. Espera unos minutos e intenta de nuevo." }
});

// Inicio de sesión de cliente: fallos por IP y por par IP-correo; solo cuentan los fallos.
const loginIpLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: "Demasiados intentos desde esta conexión. Espera 15 minutos." }
});

const loginPairLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: readConfig().loginMaxAttempts,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `${req.ip}|${String(req.body.email || "").trim().toLowerCase()}`,
  handler: (req, res) => {
    const retryAfterSeconds = Math.max(1, Math.ceil((req.rateLimit.resetTime.getTime() - Date.now()) / 1000));
    return res.status(429).json({
      error: "Demasiados intentos fallidos con este correo. Espera antes de volver a intentarlo.",
      retryAfterSeconds
    });
  }
});

// Emite la cookie de sesión de cliente y devuelve el token CSRF para la página.
function issueCustomerSession(res, customer) {
  const csrfToken = crypto.randomBytes(32).toString("hex");
  const session = jwt.sign(
    { sub: String(customer._id), email: customer.email, tv: customer.tokenVersion, csrf: csrfToken, jti: crypto.randomUUID(), aud: "cliente" },
    readConfig().customerJwtSecret,
    { algorithm: "HS256", expiresIn: "2h" }
  );
  res.cookie(CUSTOMER_COOKIE, session, sessionCookieOptions());
  return csrfToken;
}

// Respuesta de registro idéntica exista o no el correo.
router.post("/registro", sensitiveLimiter, asyncHandler(async (req, res) => {
  await customerService.register({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    privacyAccepted: req.body.privacyAccepted
  });
  return res.status(202).json({ message: "Si el correo es válido, te enviamos un enlace para confirmar tu cuenta." });
}));

router.post("/verificar", asyncHandler(async (req, res) => {
  await customerService.verifyEmail(req.body.token);
  return res.json({ ok: true, message: "Tu correo fue confirmado. Ya puedes iniciar sesión." });
}));

router.post("/entrar", loginIpLimiter, loginPairLimiter, asyncHandler(async (req, res) => {
  try {
    const customer = await customerService.login(req.body.email, req.body.password);
    const csrfToken = issueCustomerSession(res, customer);
    return res.json({ name: customer.name, email: customer.email, csrfToken });
  } catch (error) {
    if (error.status === 401) {
      const remainingAttempts = req.rateLimit ? Math.max(0, req.rateLimit.remaining) : undefined;
      return res.status(401).json({ error: error.message, remainingAttempts });
    }
    throw error;
  }
}));

router.get("/me", requireCustomer, (req, res) => {
  return res.json({ name: req.customer.name, email: req.customer.email, csrfToken: req.customer.csrf });
});

router.post("/salir", requireCustomer, customerCsrf, (req, res) => {
  revoke(req.customer.jti, req.customer.exp);
  res.clearCookie(CUSTOMER_COOKIE, baseOptions());
  return res.json({ ok: true });
});

router.post("/recuperar", sensitiveLimiter, asyncHandler(async (req, res) => {
  await customerService.requestPasswordReset(req.body.email);
  return res.status(202).json({ message: "Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña." });
}));

router.post("/restablecer", asyncHandler(async (req, res) => {
  await customerService.resetPassword(req.body.token, req.body.password);
  return res.json({ ok: true, message: "Tu contraseña fue actualizada. Inicia sesión con la nueva." });
}));

router.post("/clave", requireCustomer, customerCsrf, asyncHandler(async (req, res) => {
  const customer = await customerService.changePassword(req.customer.id, req.body.currentPassword, req.body.newPassword);
  // Las sesiones anteriores quedan inválidas por tokenVersion; esta sesión se reemite.
  revoke(req.customer.jti, req.customer.exp);
  const csrfToken = issueCustomerSession(res, customer);
  return res.json({ ok: true, csrfToken });
}));

module.exports = router;

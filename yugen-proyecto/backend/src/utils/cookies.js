// utils/cookies.js
// Configuración de las cookies de sesión. Un solo lugar para los atributos de seguridad.
const { readConfig } = require("../config/env");

const SESSION_COOKIE = "yugen_session";
const CUSTOMER_COOKIE = "yugen_cliente";
const SESSION_MAX_AGE_MS = 2 * 60 * 60 * 1000;

// SameSite configurable. "none" exige Secure, que se activa en producción.
function baseOptions() {
  const config = readConfig();
  return {
    path: "/",
    httpOnly: true,
    sameSite: config.cookieSameSite,
    secure: config.nodeEnv === "production"
  };
}

function sessionCookieOptions() {
  return Object.assign({}, baseOptions(), { maxAge: SESSION_MAX_AGE_MS });
}

module.exports = { SESSION_COOKIE, CUSTOMER_COOKIE, sessionCookieOptions, baseOptions };

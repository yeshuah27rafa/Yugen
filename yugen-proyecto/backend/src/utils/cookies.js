// utils/cookies.js
// Configuración de la cookie de sesión del administrador. Un solo lugar para no olvidar ningún atributo de seguridad.
const SESSION_COOKIE = "yugen_session";
const SESSION_MAX_AGE_MS = 2 * 60 * 60 * 1000;

// SameSite: "lax" para desarrollo y dominios compartidos; "none" solo si frontend y API están en sitios distintos.
// "none" exige Secure, que en producción ya está activo.
function baseOptions() {
  return {
    path: "/",
    httpOnly: true,
    sameSite: process.env.COOKIE_SAMESITE || "lax",
    secure: process.env.NODE_ENV === "production"
  };
}

function sessionCookieOptions() {
  return Object.assign({}, baseOptions(), { maxAge: SESSION_MAX_AGE_MS });
}

module.exports = { SESSION_COOKIE, sessionCookieOptions, baseOptions };

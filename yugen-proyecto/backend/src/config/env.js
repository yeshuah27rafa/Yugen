// config/env.js
// Lectura y validación centralizada de variables de entorno.
const crypto = require("crypto");
// Se lee en cada llamada para que las pruebas puedan cambiar process.env antes de usar la configuración.

// En desarrollo, si no existe CUSTOMER_JWT_SECRET, se deriva de JWT_SECRET con una etiqueta fija.
// Así el secreto de clientes sigue siendo distinto del administrativo sin pedir una variable nueva.
// En producción no se deriva: la variable es obligatoria.
function deriveCustomerSecret(jwtSecret) {
  return crypto.createHmac("sha256", jwtSecret).update("yugen-customer-session").digest("hex");
}

function readConfig(env) {
  const source = env || process.env;
  const nodeEnv = source.NODE_ENV || "development";
  const jwtSecret = source.JWT_SECRET || "";
  const explicitCustomerSecret = source.CUSTOMER_JWT_SECRET || "";
  const canDerive = nodeEnv !== "production" && jwtSecret !== "";
  return {
    nodeEnv: nodeEnv,
    mongodbUri: source.MONGODB_URI || "",
    port: Number(source.PORT || 4000),
    jwtSecret: jwtSecret,
    customerJwtSecret: explicitCustomerSecret !== "" ? explicitCustomerSecret : (canDerive ? deriveCustomerSecret(jwtSecret) : ""),
    adminEmail: source.ADMIN_EMAIL || "",
    adminPasswordHash: source.ADMIN_PASSWORD_HASH || "",
    frontendOrigin: source.FRONTEND_ORIGIN || "http://localhost:5173",
    publicAppUrl: source.PUBLIC_APP_URL || source.FRONTEND_ORIGIN || "http://localhost:5173",
    mailProvider: source.MAIL_PROVIDER || "outbox",
    mailFrom: source.MAIL_FROM || "Yugen <no-reply@localhost>",
    loginMaxAttempts: Number(source.LOGIN_MAX_ATTEMPTS || 5),
    contactMaxAttempts: Number(source.CONTACT_MAX_ATTEMPTS || 10),
    cookieSameSite: source.COOKIE_SAMESITE || "lax",
    trustProxy: source.TRUST_PROXY || "",
    // Contacto que se muestra a quien no quiere crear cuenta. Se configura cuando el desarrollador lo indique.
    contactEmail: source.CONTACT_EMAIL || "",
    contactWhatsapp: source.CONTACT_WHATSAPP || ""
  };
}

// Devuelve la lista de errores de configuración. Lista vacía significa configuración válida.
// requireMongo: el servidor necesita MONGODB_URI; las pruebas sin base de datos no.
function validateConfig(config, options) {
  const requireMongo = options && options.requireMongo === true;
  const errors = [];

  if (requireMongo && config.mongodbUri === "") errors.push("Falta MONGODB_URI.");
  if (config.jwtSecret.length < 32) errors.push("JWT_SECRET debe tener al menos 32 caracteres.");
  if (config.customerJwtSecret.length < 32) errors.push("CUSTOMER_JWT_SECRET debe tener al menos 32 caracteres.");
  if (config.jwtSecret !== "" && config.jwtSecret === config.customerJwtSecret) {
    errors.push("JWT_SECRET y CUSTOMER_JWT_SECRET deben ser distintos.");
  }
  if (requireMongo && config.adminEmail === "") errors.push("Falta ADMIN_EMAIL.");
  if (requireMongo && config.adminPasswordHash === "") errors.push("Falta ADMIN_PASSWORD_HASH.");

  if (["outbox", "provider"].includes(config.mailProvider) === false) {
    errors.push("MAIL_PROVIDER debe ser 'outbox' o 'provider'.");
  }
  // Regla de seguridad: un correo de desarrollo nunca debe salir en producción.
  if (config.nodeEnv === "production" && config.mailProvider === "outbox") {
    errors.push("MAIL_PROVIDER=outbox no se permite en producción.");
  }
  if (["lax", "strict", "none"].includes(config.cookieSameSite) === false) {
    errors.push("COOKIE_SAMESITE debe ser lax, strict o none.");
  }
  return errors;
}

module.exports = { readConfig, validateConfig };

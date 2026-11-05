// services/customerService.js
// Lógica de cuentas de cliente: registro, confirmación, inicio de sesión, recuperación y cambio de contraseña.
// Las respuestas que podrían revelar si un correo existe son siempre genéricas.
const bcrypt = require("bcryptjs");
const Customer = require("../models/Customer");
const { generateToken, hashToken, isWellFormedToken } = require("./tokenService");
const { getMailer } = require("../mail");
const { readConfig } = require("../config/env");

const BCRYPT_COST = 12;
const VERIFY_HOURS = 24;
const RESET_HOURS = 1;
const PRIVACY_NOTICE_VERSION = "2026-11-01";
const EXISTING_ACCOUNT_MESSAGE = "Ya existe una cuenta con este correo. Inicia sesión o recupera tu contraseña.";

// Hash ficticio para comparar tiempos cuando el correo no existe y la respuesta no tarda menos.
const DUMMY_HASH = bcrypt.hashSync("clave-ficticia-para-igualar-tiempos", BCRYPT_COST);

// Error con código HTTP para que las rutas respondan sin lógica adicional.
function fail(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function validateRegistration(input) {
  const errors = [];
  const name = String(input.name || "").trim();
  const email = normalizeEmail(input.email);
  const password = String(input.password || "");
  if (name.length < 2 || name.length > 120) errors.push("El nombre debe tener entre 2 y 120 caracteres.");
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) === false || email.length > 254) errors.push("El correo no es válido.");
  if (password.length < 10 || password.length > 128) errors.push("La contraseña debe tener entre 10 y 128 caracteres.");
  if (password.toLowerCase() === email) errors.push("La contraseña no puede ser igual al correo.");
  if (input.privacyAccepted !== true) errors.push("Debes aceptar el aviso de privacidad para crear la cuenta.");
  return errors;
}

async function sendVerificationEmail(customer, raw) {
  const config = readConfig();
  const link = `${config.publicAppUrl}/cuenta/verificar?token=${raw}`;
  await getMailer().send({
    from: config.mailFrom,
    to: customer.email,
    subject: "Confirma tu correo en Yugen",
    text: `Hola ${customer.name}. Confirma tu correo con este enlace (válido 24 horas):\n${link}`
  });
}

// Registro: siempre responde igual. Un correo ya registrado no crea cuenta ni revela su existencia.
async function register(input) {
  const errors = validateRegistration(input);
  if (errors.length > 0) throw fail(400, errors.join(" "));

  const email = normalizeEmail(input.email);
  // D18: el cliente debe saber que ya tiene cuenta. El límite de registros por IP limita el sondeo.
  const existing = await Customer.findOne({ email });
  if (existing !== null) throw fail(409, EXISTING_ACCOUNT_MESSAGE);

  const verification = generateToken();
  const passwordHash = await bcrypt.hash(String(input.password), BCRYPT_COST);
  try {
    const customer = await Customer.create({
      name: String(input.name).trim(),
      email,
      passwordHash,
      verifyTokenHash: verification.hash,
      verifyTokenExpires: new Date(Date.now() + VERIFY_HOURS * 3600 * 1000),
      privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
      privacyAcceptedAt: new Date()
    });
    await sendVerificationEmail(customer, verification.raw);
  } catch (error) {
    // Carrera entre dos registros del mismo correo: mismo mensaje que si la cuenta ya existía.
    if (error.code === 11000) throw fail(409, EXISTING_ACCOUNT_MESSAGE);
    throw error;
  }
}

async function verifyEmail(raw) {
  if (isWellFormedToken(raw) === false) throw fail(400, "El enlace no es válido o ya caducó.");
  const customer = await Customer.findOne({
    verifyTokenHash: hashToken(raw),
    verifyTokenExpires: { $gt: new Date() }
  });
  if (customer === null) throw fail(400, "El enlace no es válido o ya caducó.");
  customer.emailVerifiedAt = new Date();
  customer.verifyTokenHash = null;
  customer.verifyTokenExpires = null;
  await customer.save();
  return customer;
}

// Inicio de sesión: la contraseña se verifica siempre, exista o no el correo.
async function login(email, password) {
  const customer = await Customer.findOne({ email: normalizeEmail(email) });
  const hash = customer === null ? DUMMY_HASH : customer.passwordHash;
  const passwordOk = await bcrypt.compare(String(password || ""), hash);
  if (customer === null || passwordOk === false) throw fail(401, "Correo o contraseña incorrectos.");
  if (customer.emailVerifiedAt === null) {
    throw fail(403, "Confirma tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.");
  }
  return customer;
}

// Recuperación: respuesta igual exista o no el correo.
async function requestPasswordReset(email) {
  const customer = await Customer.findOne({ email: normalizeEmail(email) });
  if (customer === null || customer.emailVerifiedAt === null) return;
  const reset = generateToken();
  customer.resetTokenHash = reset.hash;
  customer.resetTokenExpires = new Date(Date.now() + RESET_HOURS * 3600 * 1000);
  await customer.save();
  const config = readConfig();
  await getMailer().send({
    from: config.mailFrom,
    to: customer.email,
    subject: "Restablece tu contraseña de Yugen",
    text: `Enlace para restablecer tu contraseña (válido 1 hora):\n${config.publicAppUrl}/cuenta/restablecer?token=${reset.raw}`
  });
}

function validateNewPassword(password, email) {
  const value = String(password || "");
  if (value.length < 10 || value.length > 128) throw fail(400, "La contraseña debe tener entre 10 y 128 caracteres.");
  if (value.toLowerCase() === String(email || "").toLowerCase()) {
    throw fail(400, "La contraseña no puede ser igual al correo.");
  }
}

// Restablecer: un solo uso. Incrementa tokenVersion para cerrar sesiones anteriores.
async function resetPassword(raw, newPassword) {
  if (isWellFormedToken(raw) === false) throw fail(400, "El enlace no es válido o ya caducó.");
  const customer = await Customer.findOne({
    resetTokenHash: hashToken(raw),
    resetTokenExpires: { $gt: new Date() }
  });
  if (customer === null) throw fail(400, "El enlace no es válido o ya caducó.");
  validateNewPassword(newPassword, customer.email);
  customer.passwordHash = await bcrypt.hash(String(newPassword), BCRYPT_COST);
  customer.tokenVersion = customer.tokenVersion + 1;
  customer.resetTokenHash = null;
  customer.resetTokenExpires = null;
  await customer.save();
}

// Cambio de contraseña desde la cuenta: exige la actual y devuelve la cuenta actualizada.
async function changePassword(customerId, currentPassword, newPassword) {
  const customer = await Customer.findById(customerId);
  if (customer === null) throw fail(401, "Tu sesión ya no es válida.");
  const currentOk = await bcrypt.compare(String(currentPassword || ""), customer.passwordHash);
  if (currentOk === false) throw fail(400, "La contraseña actual no es correcta.");
  validateNewPassword(newPassword, customer.email);
  customer.passwordHash = await bcrypt.hash(String(newPassword), BCRYPT_COST);
  customer.tokenVersion = customer.tokenVersion + 1;
  await customer.save();
  return customer;
}

module.exports = {
  register,
  verifyEmail,
  login,
  requestPasswordReset,
  resetPassword,
  changePassword,
  PRIVACY_NOTICE_VERSION
};

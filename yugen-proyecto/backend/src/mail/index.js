// mail/index.js
// Interfaz de correo. OutboxMailer guarda los mensajes en una carpeta local (desarrollo y pruebas).
// ProviderMailer se implementa en la fase de despliegue; hasta entonces falla con un mensaje claro.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { readConfig } = require("../config/env");

class OutboxMailer {
  constructor(directory) {
    this.directory = directory;
    this.sent = []; // copia en memoria para las pruebas
  }

  async send(message) {
    this.sent.push(message);
    fs.mkdirSync(this.directory, { recursive: true });
    const name = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}.json`;
    fs.writeFileSync(path.join(this.directory, name), JSON.stringify(message, null, 2));
    return { id: name };
  }
}

class ProviderMailer {
  async send() {
    throw new Error("Proveedor de correo no configurado todavía.");
  }
}

let current = null;

function createMailer(config) {
  if (config.mailProvider === "outbox") {
    return new OutboxMailer(path.join(__dirname, "..", "..", "outbox"));
  }
  return new ProviderMailer();
}

function getMailer() {
  if (current === null) current = createMailer(readConfig());
  return current;
}

// Permite sustituir el correo, por ejemplo en las pruebas.
function setMailer(mailer) {
  current = mailer;
}

module.exports = { OutboxMailer, ProviderMailer, createMailer, getMailer, setMailer };

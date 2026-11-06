// models/RevokedSession.js
// Sesiones cerradas. Se borran solas al caducar (índice TTL), así la colección no crece sin límite.
const mongoose = require("mongoose");

const revokedSessionSchema = new mongoose.Schema({
  jti: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }
});

module.exports = mongoose.model("RevokedSession", revokedSessionSchema);

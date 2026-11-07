// middleware/honeypot.js
// Campo trampa: los humanos no lo ven ni lo llenan. Si un robot lo llena, la petición se descarta
// y se responde como si fuera válida, para no darle pistas.
module.exports = function honeypot(req, res, next) {
  const trap = req.body ? req.body.website : undefined;
  if (typeof trap === "string" && trap.trim() !== "") {
    return res.status(201).json({ ok: true });
  }
  return next();
};

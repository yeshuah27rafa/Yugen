// utils/asyncHandler.js
// Express 4 no captura rechazos de funciones async. Este envoltorio envía los errores al manejador central.
module.exports = function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
};

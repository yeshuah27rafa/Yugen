// routes/requests.js
// Solicitudes de pedido del cliente: crear y consultar las propias.
const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const requireCustomer = require("../middleware/requireCustomer");
const customerCsrf = require("../middleware/customerCsrf");
const { createRequest, listMyRequests } = require("../services/requestService");
const honeypot = require("../middleware/honeypot");
const { recordAdminChange } = require("../services/auditLogService");

const router = express.Router();

router.post("/", requireCustomer, customerCsrf, honeypot, asyncHandler(async (req, res) => {
  const result = await createRequest(req.customer.id, req.body);
  await recordAdminChange({ email: "Cliente" }, { entityType: "solicitud", entityLabel: result.code, action: "creado", summary: "Se recibió una nueva solicitud de pedido.", details: { itemCount: Array.isArray(req.body.items) ? req.body.items.length : 0, deliveryMethod: String(req.body.deliveryMethod || "") } });
  return res.status(201).json(result);
}));

router.get("/mias", requireCustomer, asyncHandler(async (req, res) => {
  return res.json({ requests: await listMyRequests(req.customer.id) });
}));

module.exports = router;

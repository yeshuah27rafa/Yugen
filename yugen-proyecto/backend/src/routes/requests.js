// routes/requests.js
// Solicitudes de pedido del cliente: crear y consultar las propias.
const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const requireCustomer = require("../middleware/requireCustomer");
const customerCsrf = require("../middleware/customerCsrf");
const { createRequest, listMyRequests } = require("../services/requestService");

const router = express.Router();

router.post("/", requireCustomer, customerCsrf, asyncHandler(async (req, res) => {
  const result = await createRequest(req.customer.id, req.body);
  return res.status(201).json(result);
}));

router.get("/mias", requireCustomer, asyncHandler(async (req, res) => {
  return res.json({ requests: await listMyRequests(req.customer.id) });
}));

module.exports = router;

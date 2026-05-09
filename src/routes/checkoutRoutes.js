const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { checkout } = require("../controllers/checkoutController");

const router = express.Router();

router.post("/", authMiddleware, checkout);

module.exports = router;
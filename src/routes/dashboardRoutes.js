const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { getDashboardSummary } = require("../controllers/dashboardController");
const { getWeeklySales } = require("../controllers/dashboardController");

const router = express.Router();

router.get("/summary", authMiddleware, getDashboardSummary);
router.get("/weekly-sales", authMiddleware, getWeeklySales);

module.exports = router;
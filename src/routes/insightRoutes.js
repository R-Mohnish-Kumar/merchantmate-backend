const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { getTodayInsights } = require("../controllers/insightController");

const router = express.Router();

router.get("/today", authMiddleware, getTodayInsights);

module.exports = router;
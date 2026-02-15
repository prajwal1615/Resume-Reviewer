const express = require("express");
const { listFeatureFlags } = require("../controllers/feature.controller");

const router = express.Router();

router.get("/", listFeatureFlags);

module.exports = router;

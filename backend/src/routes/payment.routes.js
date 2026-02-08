const express = require("express");
const auth = require("../middleware/auth.middleware");
const { initPayU, verifyPayU } = require("../controllers/payment.controller");

const router = express.Router();

router.post("/payu/init", auth, initPayU);
router.post("/payu/verify", verifyPayU);

module.exports = router;

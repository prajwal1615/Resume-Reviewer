const express = require("express");
const auth = require("../middleware/auth.middleware");
const requireAdmin = require("../middleware/admin.middleware");
const {
  listUsers,
  updateUserBlockStatus,
  listFeatureFlags,
  updateFeatureFlag,
} = require("../controllers/admin.controller");

const router = express.Router();

router.use(auth, requireAdmin);

router.get("/users", listUsers);
router.patch("/users/:id/block", updateUserBlockStatus);
router.get("/feature-flags", listFeatureFlags);
router.patch("/feature-flags/:key", updateFeatureFlag);

module.exports = router;

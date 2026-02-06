
const express = require("express");
const auth = require("../middleware/auth.middleware");
const {
  createJob,
  getJobs,
  updateJob,
  deleteJob
} = require("../controllers/job.controller");

const router = express.Router();

router.use(auth);

router.post("/", createJob);
router.get("/", getJobs);
router.put("/:id", updateJob);
router.delete("/:id", deleteJob);

module.exports = router;

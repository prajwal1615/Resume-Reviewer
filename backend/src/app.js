const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/jobs", require("./routes/job.routes"));
app.use("/api/resume", require("./routes/resume.routes"));
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/payments", require("./routes/payment.routes"));
app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

module.exports = app;

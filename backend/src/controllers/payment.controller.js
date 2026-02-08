const crypto = require("crypto");

const payuEnv = (process.env.PAYU_ENV || "test").toLowerCase();
const PAYU_BASE_URL =
  payuEnv === "live" ? "https://secure.payu.in/_payment" : "https://test.payu.in/_payment";

const buildPayuHash = (payload, salt) => {
  const {
    key,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
  } = payload;
  const hashString = [
    key,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    "", "", "", "", "", "", "", "", "", "",
    salt,
  ].join("|");
  return crypto.createHash("sha512").update(hashString).digest("hex");
};

exports.initPayU = async (req, res) => {
  const key = process.env.PAYU_KEY;
  const salt = process.env.PAYU_SALT;
  if (!key || !salt) {
    return res.status(500).json({ message: "PAYU_KEY or PAYU_SALT not configured." });
  }

  const amount = Number(req.body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ message: "Invalid amount." });
  }

  const productinfo = String(req.body.productinfo || "JobFlow Premium").trim();
  const firstname = String(req.body.firstname || req.user?.name || "User").trim();
  const email = String(req.body.email || req.user?.email || "").trim();
  const phone = String(req.body.phone || "").trim();
  if (!email) {
    return res.status(400).json({ message: "Email is required for PayU." });
  }

  const txnid = crypto.randomBytes(16).toString("hex");
  const surl = process.env.PAYU_SUCCESS_URL || "http://localhost:5173/payment-success";
  const furl = process.env.PAYU_FAILURE_URL || "http://localhost:5173/payment-failure";

  const payload = {
    key,
    txnid,
    amount: amount.toFixed(2),
    productinfo,
    firstname,
    email,
    phone,
    surl,
    furl,
  };

  const hash = buildPayuHash(payload, salt);
  res.json({ action: PAYU_BASE_URL, payload: { ...payload, hash } });
};

exports.verifyPayU = async (req, res) => {
  const salt = process.env.PAYU_SALT;
  if (!salt) {
    return res.status(500).json({ message: "PAYU_SALT not configured." });
  }
  const {
    status,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    key,
    hash,
  } = req.body || {};

  if (!status || !txnid || !amount || !productinfo || !firstname || !email || !key || !hash) {
    return res.status(400).json({ message: "Missing required PayU fields." });
  }

  const hashString = [
    salt,
    status,
    "", "", "", "", "", "", "", "",
    email,
    firstname,
    productinfo,
    amount,
    txnid,
    key,
  ].join("|");

  const expected = crypto.createHash("sha512").update(hashString).digest("hex");
  const valid = expected === String(hash);
  res.json({ valid });
};

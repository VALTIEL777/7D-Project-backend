const express = require("express");
const { uploadExcel } = require("../../controllers/RTR/rtrController");
const multer = require("multer");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("file"), uploadExcel);

module.exports = router;

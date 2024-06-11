//./routes/status.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/status.controller');

/* GET status. */
router.get('/', controller.status);






module.exports = router;

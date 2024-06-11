//./routes/status.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/config.controller');

/* GET status. */
router.get('/', controller.get);
router.put('/', controller.put);






module.exports = router;

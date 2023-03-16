//./routes/status.js
var express = require('express');
var router = express.Router();
const controller = require('../controllers/status.controller');

/* GET status. */
router.get('/', controller.status);






module.exports = router;

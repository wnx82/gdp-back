//./routes/status.js
var express = require('express');
var router = express.Router();
const controller = require('../controllers/status.controller');

/* GET habitations listing. */
router.get('/', controller.status);

module.exports = router;

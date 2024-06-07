//./routes/forgotPassword.js
var express = require('express');
var router = express.Router();
const controller = require('../controllers/forgotPassword.controller');

router.post('/', controller.forgotPassword);
router.post('/reset-password/:token', controller.resetPassword);

module.exports = router;

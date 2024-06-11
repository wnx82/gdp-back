//./routes/forgotPassword.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/forgotPassword.controller');

router.post('/', controller.forgotPassword);
router.post('/reset-password/:token', controller.resetPassword);

module.exports = router;

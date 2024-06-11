const express = require('express');
const router = express.Router();
const controller = require('../controllers/logs.controller');

// Routes pour access.log
router.get('/access', controller.getAccessLog);
router.delete('/access', controller.deleteAccessLog);

// Routes pour console.log
router.get('/console', controller.getConsoleLog);
router.delete('/console', controller.deleteConsoleLog);

module.exports = router;

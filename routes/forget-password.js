//./routes/infractions.js
var express = require('express');
var router = express.Router();
const controller = require('../controllers/forget-password.controller');
// const validateId = require('../helpers/validateId');

/* GET infractions listing. */

router.post('/', controller.forgetPassword);

module.exports = router;

//./routes/logs.js
var express = require('express');
var router = express.Router();
const controller = require('../controllers/logs.controller');
// const validateId = require('../helpers/validateId');
/* GET logs listing. */
router.get('/', controller.get);
// router.get('/:id', validateId, controller.findOne);
// router.post('/', controller.create);
// router.post('/purge', controller.deleteMany);
// router.post('/restore', controller.restoreMany);
// router.patch('/:id', validateId, controller.updateOne);
router.delete('/', controller.deleteFile);

module.exports = router;

//./routes/horaires.js
var express = require('express');
var router = express.Router();
const controller = require('../controllers/horaires.controller');
const validateId = require('../helpers/validateId');
/* GET horaires listing. */
router.get('/', controller.findAll);
router.get('/:id', validateId, controller.findOne);
router.post('/', controller.create);
router.post('/purge', controller.deleteMany);
router.post('/restore', controller.restoreMany);
router.patch('/:id', validateId, controller.updateOne);
router.delete('/:id', validateId, controller.deleteOne);

module.exports = router;

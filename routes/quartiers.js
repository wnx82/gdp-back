//./routes/habitations.js
var express = require('express');
var router = express.Router();
const controller = require('../controllers/quartiers.controller');
const validateId = require('../helpers/validateId');

/* GET habitations listing. */
router.get('/', controller.findAll);
router.get('/:id', validateId, controller.findOne);
router.post('/', controller.create);
router.patch('/:id', validateId, controller.updateOne);
router.delete('/:id', validateId, controller.deleteOne);

module.exports = router;
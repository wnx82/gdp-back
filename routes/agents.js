// ./routes/agents.js
var express = require('express');
var router = express.Router();
const controller = require('../controllers/agents.controller');
const validateId = require('../helpers/validateId');

/* GET agents listing. */
router.get('/', controller.findAll);
router.post('/', controller.create);
router.get('/:id', validateId, controller.findOne);
router.patch('/:id', validateId, controller.updateOne);
router.delete('/:id', validateId, controller.deleteOne);

module.exports = router;

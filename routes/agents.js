// ./routes/agents.js
var express = require('express');
var router = express.Router();
const controller = require('../controllers/agents.controller');
const validateId = require('../helpers/validateId');
var cors = require('cors');

/* GET agents listing. */
router.get('/', cors(), controller.findAll);
router.get('/:id', validateId, controller.findOne);
router.post('/', controller.create);
router.patch('/:id', validateId, controller.updateOne);
router.delete('/:id', validateId, controller.deleteOne);

module.exports = router;

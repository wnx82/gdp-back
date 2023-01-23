var express = require('express');
var router = express.Router();
const controller = require('../controllers/agents.controller');

/* GET agents listing. */
router.get('/', controller.findAll);
router.get('/:id', controller.findOne);
router.post('/', controller.create);
router.patch('/:id', controller.updateOne);
router.delete('/:id', controller.deleteOne);
// /* GET agents listing. */
// router.get('/', controller.findAll);
// router.get('/:id', controller.findOne);
// router.post('/', controller.create);
// router.patch('/:id', controller.updateOne);
// router.delete('/:id', controller.deleteOne);

module.exports = router;

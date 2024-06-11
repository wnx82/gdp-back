//./routes/validations.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/content/habitations.validations.controller');
const validateId = require('../helpers/validateId');
/* GET validations listing. */
router.get('/', controller.findAll);
router.get('/:id', validateId, controller.findOne);
router.post('/', controller.create);
router.post('/purge', controller.deleteMany);
router.post('/restore', controller.restoreMany);
router.patch('/:id', validateId, controller.updateOne);
router.delete('/:id', validateId, controller.deleteOne);

module.exports = router;

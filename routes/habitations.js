//./routes/habitations.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/content/habitations.controller');
const validateId = require('../helpers/validateId');

/* GET habitations listing. */
router.get('/', controller.findAll);
router.get('/active', controller.findActiveHabitations);
router.get('/:id', validateId, controller.findOne);
router.post('/', controller.create);
router.post('/purge', controller.deleteMany);
router.post('/restore', controller.restoreMany);
router.patch('/:id', validateId, controller.updateOne);
router.delete('/:id', validateId, controller.deleteOne);

module.exports = router;

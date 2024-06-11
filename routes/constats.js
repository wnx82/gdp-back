//./routes/constats.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/content/constats.controller');
const validateId = require('../helpers/validateId');

/* GET constats listing. */
router.get('/', controller.findAll);
router.get('/:id', validateId, controller.findOne);
router.post('/', controller.create);
router.post('/purge', controller.deleteMany);
router.post('/restore', controller.restoreMany);
router.patch('/:id', controller.updateOne);
router.delete('/:id', controller.deleteOne);
//ajouter supprimer agents du constat
router.get('/:id/agents', validateId, controller.findAgents);
router.post('/:id/agents', validateId, controller.addAgent);
router.delete('/:id/:agentId', validateId, controller.removeAgent);

module.exports = router;

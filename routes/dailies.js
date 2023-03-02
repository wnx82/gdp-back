//./routes/constats.js
var express = require('express');
var router = express.Router();
const controller = require('../controllers/dailies.controller');
const validateId = require('../helpers/validateId');

/* GET constats listing. */
router.get('/', controller.findAll);
router.get('/:id', validateId, controller.findOne);
router.post('/', controller.create);
router.patch('/:id', controller.updateOne);
router.delete('/:id', controller.deleteOne);
//ajouter supprimer agent du constat
router.get('/:id/agents', validateId, controller.findAgents);
router.post('/:id/agents', validateId, controller.addAgent);
router.delete('/:id/:agentId', validateId, controller.removeAgent);
//ajouter supprimer quartier du constat
router.get('/:id/quartiers', validateId, controller.findQuartiers);
router.post('/:id/quartiers', validateId, controller.addQuartier);
router.delete('/:id/:quartierId', validateId, controller.removeQuartier);
//ajouter supprimer mission du constat
router.get('/:id/missions', validateId, controller.findMissions);
router.post('/:id/missions', validateId, controller.addMission);
router.delete('/:id/:missionId', validateId, controller.removeMission);

module.exports = router;

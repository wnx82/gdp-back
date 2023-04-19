//./routes/dailies.js
var express = require('express');
var router = express.Router();
const controller = require('../controllers/dailies.controller');
const validateId = require('../helpers/validateId');

/* GET dailies listing. */
router.get('/', controller.findAll);
router.get('/:id', validateId, controller.findOne);
router.post('/', controller.create);
router.post('/purge', controller.deleteMany);
router.post('/restore', controller.restoreMany);
router.patch('/:id', controller.updateOne);
router.delete('/:id', controller.deleteOne);
//ajouter supprimer agent du daily
router.get('/:id/agents', validateId, controller.findAgents);
router.post('/:id/agents', validateId, controller.addAgent);
//envoi de la daily par mail aux agents
router.post('/:id/send', validateId, controller.sendDaily);
//efface
router.delete('/:id/agents/:agentId', validateId, controller.removeAgent);
//ajouter supprimer quartier du daily
router.get('/:id/quartiers', validateId, controller.findQuartiers);
router.post('/:id/quartiers', validateId, controller.addQuartier);
router.delete(
    '/:id/quartiers/:quartierId',
    validateId,
    controller.removeQuartier
);
//ajouter supprimer mission du daily
router.get('/:id/missions', validateId, controller.findMissions);
router.post('/:id/missions', validateId, controller.addMission);
router.delete('/:id/missions/:missionId', validateId, controller.removeMission);

module.exports = router;

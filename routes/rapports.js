//./routes/rapports.js
var express = require('express');
var router = express.Router();
const controller = require('../controllers/content/rapports.controller');
const validateId = require('../helpers/validateId');

/* GET rapports listing. */
router.get('/', controller.findAll);
router.get('/:id', validateId, controller.findOne);
router.post('/', controller.create);
router.post('/purge', controller.deleteMany);
router.post('/restore', controller.restoreMany);
router.patch('/:id', controller.updateOne);
router.delete('/:id', controller.deleteOne);
//ajouter supprimer agent du rapport
router.get('/:id/agents', validateId, controller.findAgents);
router.post('/:id/agents', validateId, controller.addAgent);
router.delete('/:id/agents/:agentId', validateId, controller.removeAgent);
//ajouter supprimer quartier du rapport
router.get('/:id/quartiers', validateId, controller.findQuartiers);
router.post('/:id/quartiers', validateId, controller.addQuartier);
router.delete(
    '/:id/quartiers/:quartierId',
    validateId,
    controller.removeQuartier
);
//ajouter supprimer mission du rapport
router.get('/:id/missions', validateId, controller.findMissions);
router.post('/:id/missions', validateId, controller.addMission);
router.delete('/:id/missions/:missionId', validateId, controller.removeMission);

//ajouter supprimer quartierMissionsValidate du rapport
router.get(
    '/:id/quartierMissionsValidate',
    validateId,
    controller.findMissionsQuartier
);
router.post(
    '/:id/quartierMissionsValidate',
    validateId,
    controller.addMissionQuartier
);
router.delete(
    '/:id/quartierMissionsValidate/:missionId',
    validateId,
    controller.removeMissionQuartier
);

module.exports = router;

// ./routes/agents.js
/**
 * @swagger
 * /agents:
 *   get:
 *     summary: Get all agents
 *     description: Retrieve a list of all agents.
 *     responses:
 *       200:
 *         description: A list of agents.
 *
 *   post:
 *     summary: Post a agent
 *     description: Create a new agent
 *     responses:
 *       200:
 *         description: A list of agents.
 *       400:
 *         error request
 *
 */
var express = require('express');
var router = express.Router();
const controller = require('../controllers/agents.controller');
const validateId = require('../helpers/validateId');

/* GET agents listing. */
router.get('/', controller.findAll);
router.get('/:id', validateId, controller.findOne);
router.post('/', controller.create);
router.post('/purge', controller.deleteMany);
router.patch('/:id', validateId, controller.updateOne);
router.delete('/:id', validateId, controller.deleteOne);

module.exports = router;

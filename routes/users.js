// ./routes/users.js
/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a list of all users.
 *     responses:
 *       200:
 *         description: A list of users.
 *
 *   post:
 *     summary: Post a user
 *     description: Create a new user
 *     responses:
 *       200:
 *         description: A list of users.
 *       400:
 *         error request
 *
 */
const express = require('express');
const router = express.Router();
const controller = require('../controllers/users.controller');
const validateId = require('../helpers/validateId');

/* GET users listing. */
router.get('/', controller.findAll);
router.get('/:id', validateId, controller.findOne);
router.post('/', controller.create);
router.post('/purge', controller.deleteMany);
router.post('/restore', controller.restoreMany);
router.patch('/:id', validateId, controller.updateOne);
router.delete('/:id', validateId, controller.deleteOne);

module.exports = router;

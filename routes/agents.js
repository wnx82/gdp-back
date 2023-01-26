var express = require('express');
var router = express.Router();
const controller = require('../controllers/agents.controller');

// generic route handler
const genericHandler = (req, res, next) => {
    res.json({
        status: 'success',
        data: req.body,
    });
};
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

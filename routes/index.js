var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', { title: 'Express' });
});

// generic route handler
// generic route handler
const genericHandler = (req, res, next) => {
    res.json({
        status: 'success',
        data: req.body,
    });
};
module.exports = router;

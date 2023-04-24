
var express = require('express');
var router = express.Router();
const { redisClient } = require('../utils/');
/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', { title: 'GDP Backend' });
});

/* Flush Redis cache */
router.post('/flushall', async function (req, res, next) {
    try {
        await redisClient.flushall();

        res.status(200).json('Cache Redis vidé avec succès');
        console.log("Cache has been successfully flushed.");

    } catch (err) {
        console.error(err);
        next(err);
    }
});

module.exports = router;

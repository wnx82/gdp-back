// var express = require('express');
// var router = express.Router();
// const fs = require('fs');
// const path = require('path');
// const README_PATH = path.join(__dirname, 'README.md');
// const app = express();

// console.log(README_PATH);
// /* GET home page. */
// router.get('/', function (req, res, next) {
//     fs.readFile(README_PATH, 'utf8', function (err, data) {
//         if (err) {
//             return res.status(500).send(err);
//         }

//         res.render('template', {
//             title: 'GDP Back-End',
//             content: data,
//         });
//     });
// });

// module.exports = router;
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', { title: 'GDP Backend' });
});

module.exports = router;

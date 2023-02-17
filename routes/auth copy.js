const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const dbClient = require('../utils/').dbClient;
const database = dbClient.db(process.env.MONGO_DB_DATABASE);

const collection = database.collection('users');

const passport = require('passport');

const { myPassportLocal } = require('../passport');

router.post('/', async (req, res) => {
    passport.authenticate('local', { session: false }, (err, user) => {
        console.log('user', user);
    });
    res.json({ ok: 'ok' });
});

module.exports = router;

/* POST login. */
// router.post('/login', function (req, res, next) {
//     passport.authenticate('local', { session: false }, (err, user, info) => {
//         if (err || !user) {
//             return res.status(400).json({
//                 message: 'Something is not right',
//                 user: user,
//             });
//         }
//         req.login(user, { session: false }, (err) => {
//             if (err) {
//                 res.send(err);
//             }
//             // generate a signed son web token with the contents of user object and return it in the response
//             const token = jwt.sign(user, 'password');
//             return res.json({ user, token });
//         });
//     })(req, res);
// });

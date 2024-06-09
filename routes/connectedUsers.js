// routes/connectedUsers.js

const express = require('express');
const router = express.Router();
const connectedUsers = require('../utils/auth/connectedUsers');

router.get('/', (req, res) => {
    connectedUsers.getConnectedUsers((err, users) => {
        if (err) return res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs connectés' });
        res.json(users);
    });
});

module.exports = router;

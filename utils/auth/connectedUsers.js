// utils/connectedUsers.js

const redisClient = require('../redis-client.util'); // Assurez-vous que le chemin est correct

const addUser = (user) => {
    // Utiliser une clé avec un préfixe spécifique pour les agents
    redisClient.set(`agent:${user._id.toString()}`, JSON.stringify(user), 'EX', 3600); // Expire après 1 heure
};

const removeUser = (userId) => {
    redisClient.del(`agent:${userId.toString()}`, (err, response) => {
        if (err) console.error('Erreur lors de la suppression de l\'utilisateur dans Redis:', err);
        if (response === 1) console.log('Utilisateur déconnecté supprimé de Redis:', userId);
    });
};

const getConnectedUsers = (callback) => {
    redisClient.keys('agent:*', (err, keys) => {
        if (err) return callback(err, null);

        if (keys.length === 0) return callback(null, []);

        redisClient.mget(keys, (err, users) => {
            if (err) return callback(err, null);

            let connectedUsers = users.map(user => JSON.parse(user));
            // Trier les utilisateurs par matricule
            connectedUsers = connectedUsers.sort((a, b) => a.matricule - b.matricule);
            callback(null, connectedUsers);
        });
    });
};


module.exports = {
    addUser,
    removeUser,
    getConnectedUsers
};

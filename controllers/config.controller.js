// ./controllers/categories.controller.js

// const dbClient = require('../utils/').dbClient;
const { dbClient, redisClient } = require('../utils');
const { catchAsync, success } = require('../helpers');
const fs = require('fs');

const DEFAULT_CONFIG = {
    users: [
        { id: 1, name: 'Alice', email: 'alice@example.com' },
        { id: 2, name: 'Bob', email: 'bob@example.com' },
        { id: 3, name: 'Charlie', email: 'charlie@example.com' },
    ],
    mail: {
        host: 'smtp.hostinger.com',
        port: 465,
        user: 'noreply@gdlp.be',
        password: 'Coucou*86',
        to_chef: 'vandermeulen.christophe@gmail.com',
        to_habitations: 'vandermeulen.christophe@gmail.com',
        to_police: 'vandermeulen.christophe@gmail.com',
        from: 'Service GDP Mouscron 👻 <noreply@gdlp.be>',
    },
};

const configHelper = require('../helpers/configHelper');

// Utiliser la fonction createConfigFile() du module configHelper
configHelper.createConfigFile();

const CONFIG_FILE_PATH = 'config.json';

const get = catchAsync(async (req, res) => {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
        fs.readFile(CONFIG_FILE_PATH, (err, data) => {
            if (err) throw err;
            const jsonData = JSON.parse(data);
            res.json(jsonData);
        });
    } else {
        fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(DEFAULT_CONFIG), err => {
            if (err) throw err;
            res.status(404).send(
                'Configuration file not found, created default configuration file'
            );
        });
    }
});

const put = catchAsync(async (req, res) => {
    const newData = req.body; // Les nouvelles données à enregistrer
    if (fs.existsSync(CONFIG_FILE_PATH)) {
        fs.readFile(CONFIG_FILE_PATH, (err, data) => {
            if (err) throw err;
            const jsonData = JSON.parse(data);
            // Mettre à jour les données existantes
            jsonData.name = newData.name;
            jsonData.age = newData.age;
            jsonData.email = newData.email;
            // Écrire les nouvelles données dans le fichier JSON
            fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(jsonData), err => {
                if (err) throw err;
                res.send('Data updated successfully');
            });
        });
    } else {
        fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(DEFAULT_CONFIG), err => {
            if (err) throw err;
            res.status(404).send(
                'Configuration file not found, created default configuration file'
            );
        });
    }
});

module.exports = {
    get,
    put,
};

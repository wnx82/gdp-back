// ./controllers/logs.controller.js

const fs = require('fs');
const path = require('path');
const { catchAsync, success } = require('../helpers');

// Chemins des fichiers de log
const accessLogPath = path.join(__dirname, '../access.log');
const consoleLogPath = path.join(__dirname, '../console.log');

// Fonction pour lire access.log
const getAccessLog = catchAsync(async (req, res) => {
    fs.readFile(accessLogPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading access.log file:', err);
            res.status(500).json({ error: 'Error reading access.log file' });
        } else {
            const logs = data.split('\n').filter(log => log); // Filtrer les lignes vides
            res.json(logs);
        }
    });
});

// Fonction pour effacer access.log
const deleteAccessLog = catchAsync(async (req, res) => {
    try {
        await fs.promises.truncate(accessLogPath, 0);
        console.log('Le contenu du fichier access.log a été effacé avec succès.');
        res.json({
            message: 'Le contenu du fichier access.log a été effacé avec succès.',
        });
    } catch (err) {
        console.error('Erreur lors de l\'effacement du contenu du fichier access.log:', err);
        res.status(500).json({
            error: 'Erreur lors de l\'effacement du contenu du fichier access.log.',
        });
    }
});

// Fonction pour lire console.log
const getConsoleLog = catchAsync(async (req, res) => {
    fs.readFile(consoleLogPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading console.log file:', err);
            res.status(500).json({ error: 'Error reading console.log file' });
        } else {
            const logs = data.split('\n').filter(log => log); // Filtrer les lignes vides
            res.json(logs);
        }
    });
});

// Fonction pour effacer console.log
const deleteConsoleLog = catchAsync(async (req, res) => {
    try {
        await fs.promises.truncate(consoleLogPath, 0);
        console.log('Le contenu du fichier console.log a été effacé avec succès.');
        res.json({
            message: 'Le contenu du fichier console.log a été effacé avec succès.',
        });
    } catch (err) {
        console.error('Erreur lors de l\'effacement du contenu du fichier console.log:', err);
        res.status(500).json({
            error: 'Erreur lors de l\'effacement du contenu du fichier console.log.',
        });
    }
});

module.exports = {
    getAccessLog,
    deleteAccessLog,
    getConsoleLog,
    deleteConsoleLog,
};

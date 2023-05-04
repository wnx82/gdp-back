// ./controllers/logs.controller.js

const fs = require('fs');
const { catchAsync, success } = require('../helpers');

const get = catchAsync(async (req, res) => {
    fs.readFile('access.log', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading log file:', err);
            res.status(500).json({ error: 'Error reading log file' });
        } else {
            const logs = data.split('\n');
            res.json(logs);
        }
    });
});
const deleteFile = catchAsync(async (req, res) => {
    try {
        await fs.promises.truncate('access.log', 0);
        console.log(
            'Le contenu du fichier access.log a été effacé avec succès.'
        );
        res.json({
            message:
                'Le contenu du fichier access.log a été effacé avec succès.',
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: "Erreur lors de l'effacement du contenu du fichier.",
        });
    }
});

module.exports = {
    get,
    deleteFile,
};

// ./controllers/vehicules.controller.js

const fs = require('fs');
const { catchAsync, success } = require('../helpers');

const get = catchAsync(async (req, res) => {
    // fs.readFile('access.log', 'utf8', (err, data) => {
    //     if (err) {
    //         console.error(err);
    //         res.status(500).send('Error reading log file');
    //     } else {
    //         res.send(data);
    //     }
    // });
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



module.exports = {
    get
};

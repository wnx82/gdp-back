//routes/upload.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, '../public/uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.post('/', upload.single('file'), function (req, res, next) {
    // Récupérer les informations sur le fichier uploadé
    const fileName = req.file.filename;
    const fileType = req.file.mimetype;

    // Envoyer une réponse au client avec les informations sur le fichier uploadé
    res.json({
        success: true,
        message: 'File uploaded successfully!',
        file: {
            name: fileName,
            type: fileType
        }
    });
});

module.exports = router;

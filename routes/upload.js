//routes/upload.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// ! sudo chmod -R 766 /root/personal-projects/gdp-back/public/uploads

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },

    // filename: function (req, file, cb) {
    //     cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    // }
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Use the original filename
    },
});

const upload = multer({ storage: storage }).single('file');;

router.post('/', function (req, res, next) {
    upload(req, res, function (err) {
        if (err) {
            // Gérer l'erreur ici
            console.log(err);
            return res.status(400).send(err);
        }
        // Récupérer les informations sur le fichier uploadé
        const fileName = req.file.filename;
        const fileType = req.file.mimetype;
        // console.log(fileName);

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
})
module.exports = router;

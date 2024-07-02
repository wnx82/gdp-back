//routes/upload.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

router.post('/rename', function (req, res, next) {
    const { oldName, newName } = req.body;
    const oldPath = path.join(__dirname, '..', 'public', 'uploads', oldName);
    const newPath = path.join(__dirname, '..', 'public', 'uploads', newName);

    fs.rename(oldPath, newPath, (err) => {
        if (err) {
            console.log(err);
            return res.status(400).json({
                success: false,
                message: 'File renaming failed!',
                error: err
            });
        }
        res.json({
            success: true,
            message: 'File renamed successfully!',
            oldName: oldName,
            newName: newName
        });
    });
});
router.delete('/:imageName', function (req, res, next) {
    const imageName = req.params.imageName;
    const imagePath = path.join(__dirname, '..', 'public', 'uploads', imageName);

    fs.unlink(imagePath, (err) => {
        if (err) {
            console.log(err);
            return res.status(400).json({
                success: false,
                message: 'File deletion failed!',
                error: err
            });
        }
        res.json({
            success: true,
            message: 'File deleted successfully!',
            imageName: imageName
        });
    });
});

module.exports = router;

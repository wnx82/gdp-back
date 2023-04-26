//./routes/horaires.js
const express = require('express');
const router = express.Router();
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });



router.post('/upload', upload.single('file'), function (req, res, next) {
    // Récupérer les informations sur le fichier uploadé
    const fileName = req.file.filename;
    const fileType = req.file.mimetype;
});
// Envoyer une réponse au client avec les informations sur le fichier uploadé
res.send(`Le fichier ${fileName} a été uploadé avec succès. Type de fichier: ${fileType}`);


module.exports = router;

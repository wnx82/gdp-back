// Importation des modules nécessaires
var createError = require('http-errors');
var cors = require('cors');
const express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const passport = require('passport');
const bodyParser = require('body-parser');
const fs = require('fs');
const { dbClient, redisClient } = require('./utils/');
const { consoleLogStream, accessLogStream, formatAccessLog } = require('./utils/logger'); // Chemin vers le fichier logger.js

// Fuseau horaire de Bruxelles
process.env.TZ = 'Europe/Brussels';

// Initialisation de l'application Express
var app = express();

// Importation des modules de routes et contrôleurs
var indexRouter = require('./routes/index');
var authRouter = require('./routes/auth');
var configRouter = require('./routes/config');
var statusRouter = require('./routes/status');
var uploadRouter = require('./routes/upload');
var logsRouter = require('./routes/logs');
var imageController = require('./controllers/image.controller');
var forgotPasswordRouter = require('./routes/forgotPassword');
var connectedUsersRouter = require('./routes/connectedUsers'); // Assurez-vous que le chemin est correct

// Administration
var agentsRouter = require('./routes/agents');
var categoriesRouter = require('./routes/categories');
var constatsRouter = require('./routes/constats');
var dailiesRouter = require('./routes/dailies');
var rapportsRouter = require('./routes/rapports');
var habitationsRouter = require('./routes/habitations');
var horairesRouter = require('./routes/horaires');
var infractionsRouter = require('./routes/infractions');
var ruesRouter = require('./routes/rues');
var quartiersRouter = require('./routes/quartiers');
var missionsRouter = require('./routes/missions');
var validationsRouter = require('./routes/validations');
var vehiculesRouter = require('./routes/vehicules');

// Importation des configurations nécessaires
require('./utils/auth/passport');

// Configuration de CORS
var corsOptions = {
    origin: '*',
    methods: ['GET', 'PUT', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Configuration des middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(logger(formatAccessLog, { stream: accessLogStream })); // Utilisation du format personnalisé pour les logs d'accès

// Configuration du moteur de vues
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Configuration des routes
app.use('/', indexRouter);
app.use('/config', configRouter);
app.use('/connected', connectedUsersRouter);
app.use('/login', authRouter);
app.use('/forgot-password', forgotPasswordRouter);
app.use('/logs', logsRouter);
app.use('/upload', uploadRouter);
app.post('/save-image', imageController.saveImage);

app.use('/agents', agentsRouter);
app.use('/users', passport.authenticate('jwt', { session: false }), agentsRouter);
app.use('/categories', categoriesRouter);
app.use('/constats', constatsRouter);
app.use('/dailies', dailiesRouter);
app.use('/rapports', rapportsRouter);
app.use('/habitations', habitationsRouter);
app.use('/horaires', horairesRouter);
app.use('/infractions', infractionsRouter);
app.use('/quartiers', quartiersRouter);
app.use('/rues', ruesRouter);
app.use('/status', statusRouter);
app.use('/missions', missionsRouter);
app.use('/validations', validationsRouter);
app.use('/vehicules', vehiculesRouter);

// Route pour gérer les erreurs 404
app.use(function (req, res, next) {
    next(createError(404));
});

// Route pour servir les images
app.get('/public/uploads/:imageName', (req, res) => {
    const imageName = req.params.imageName;
    const imagePath = path.join(__dirname, 'public/uploads', imageName);
    res.sendFile(imagePath);
});

// Gestionnaire d'erreurs
app.use(function (err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;

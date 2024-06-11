// Importation des modules nécessaires
const createError = require('http-errors');
const cors = require('cors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const passport = require('passport');
const bodyParser = require('body-parser');
const fs = require('fs');
const { dbClient, redisClient } = require('./utils/');
const { consoleLogStream, accessLogStream, formatAccessLog } = require('./utils/logger'); // Chemin vers le fichier logger.js

// Fuseau horaire de Bruxelles
process.env.TZ = 'Europe/Brussels';

// Initialisation de l'application Express
const app = express();

// Importation des modules de routes et contrôleurs
const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const configRouter = require('./routes/config');
const statusRouter = require('./routes/status');
const uploadRouter = require('./routes/upload');
const logsRouter = require('./routes/logs');
const imageController = require('./controllers/image.controller');
const forgotPasswordRouter = require('./routes/forgotPassword');
const connectedUsersRouter = require('./routes/connectedUsers'); // Assurez-vous que le chemin est correct

// Administration
const agentsRouter = require('./routes/agents');
const articlesRouter = require('./routes/articles');
const categoriesRouter = require('./routes/categories');
const constatsRouter = require('./routes/constats');
const dailiesRouter = require('./routes/dailies');
const rapportsRouter = require('./routes/rapports');
const habitationsRouter = require('./routes/habitations');
const horairesRouter = require('./routes/horaires');
const infractionsRouter = require('./routes/infractions');
const ruesRouter = require('./routes/rues');
const quartiersRouter = require('./routes/quartiers');
const missionsRouter = require('./routes/missions');
const validationsRouter = require('./routes/validations');
const vehiculesRouter = require('./routes/vehicules');

// Importation des configurations nécessaires
require('./utils/auth/passport');

// Configuration de CORS
const corsOptions = {
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
app.use('/articles', articlesRouter);
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
app.use((req, res, next) => {
    next(createError(404));
});

// Route pour servir les images
app.get('/public/uploads/:imageName', (req, res) => {
    const imageName = req.params.imageName;
    const imagePath = path.join(__dirname, 'public/uploads', imageName);
    res.sendFile(imagePath);
});

// Gestionnaire d'erreurs
app.use((err, req, res, next) => {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;

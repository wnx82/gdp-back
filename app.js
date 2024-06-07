var createError = require('http-errors');
var cors = require('cors');
const express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const passport = require('passport');
const bodyParser = require('body-parser');
const prettier = require('prettier');
const morgan = require('morgan');
const fs = require('fs');
const { dbClient, redisClient } = require('./utils/');
const accessLogStream = fs.createWriteStream(
    path.join(__dirname, 'access.log'),
    { flags: 'a' }
);

// const flushCache = async (req, res, next) => {
//     try {
//         await redisClient.flushall();
//         res.status(200).send('Cache Redis vidé avec succès');
//         console.log("Cache has been successfully flushed.");

//     } catch (err) {
//         console.error(err);
//         next(err);
//     }
// };

require('./utils/passport');
var app = express();

var indexRouter = require('./routes/index');
var authRouter = require('./routes/auth');
var statusRouter = require('./routes/status');
var uploadRouter = require('./routes/upload');
var logsRouter = require('./routes/logs');
var imageController = require('./controllers/image.controller');
var forgotPasswordRouter = require('./routes/forgotPassword')
// var configRouter = require('./routes/config');


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

// const swaggerUi = require('swagger-ui-express');
// const swaggerJSDoc = require('swagger-jsdoc');

// const options = {
//     definition: {
//         openapi: '3.0.0',
//         info: {
//             title: 'My API',
//             version: '1.0.0',
//             description: 'My API description',
//         },
//         servers: [
//             {
//                 url: 'http://localhost:3003',
//             },
//         ],
//     },
//     apis: ['./routes/*.js'],
// };

// const swaggerSpec = swaggerJSDoc(options);

// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// app.use((req, res, next) => {
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.setHeader(
//         'Access-Control-Allow-Methods',
//         'GET, POST, PUT, PATCH, DELETE, OPTIONS'
//     );
//     res.setHeader(
//         'Access-Control-Allow-Headers',
//         'Content-Type, Authorization'
//     );
//     next();
// });
var corsOptions = {
    origin: '*',
    methods: ['GET', 'PUT', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    // allowedHeaders: ['Content-Type', 'Authorization'],
    // optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(cors(corsOptions));
// app.use(cors());
// app.use((req, res, next) => {
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods', 'PUT, GET, HEAD, POST, DELETE, OPTIONS, PATCH');
//   res.setHeader('Access-Control-Allow-Headers', 'content-type');
//   next();
// });

// app.post('/flushall', flushCache);
app.post('login', async (req, res) => {
    res.json({ ok: 'ok' });
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// const IMAGE_DIR = path.join(__dirname, 'public/uploads');
// console.log(IMAGE_DIR);

// app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
// app.use('/images', express.static(path.join(__dirname, 'public/images')));

app.use(morgan('combined', { stream: accessLogStream }));

app.use('/', indexRouter);
app.use('/login', authRouter);
app.use('/agents', agentsRouter);
app.use(
    '/users',
    passport.authenticate('jwt', { session: false }),
    agentsRouter
);
app.use('/forgot-password', forgotPasswordRouter)
app.use('/logs', logsRouter);
app.use('/upload', uploadRouter);
app.post('/save-image', imageController.saveImage);
// app.use('/config', configRouter);


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

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});
app.get('/public/uploads/:imageName', (req, res) => {
    const imageName = req.params.imageName;
    const imagePath = path.join(IMAGE_DIR, imageName);
    res.sendFile(imagePath);
});
// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;

// const createError = require('http-errors');
// const cors = require('cors');
// const express = require('express');
// const path = require('path');
// const cookieParser = require('cookie-parser');
// const logger = require('morgan');
// const passport = require('passport');
// const bodyParser = require('body-parser');
// const morgan = require('morgan');
// const fs = require('fs');

// // Import des modules de routes
// const indexRouter = require('./routes/index');
// const authRouter = require('./routes/auth');
// const agentsRouter = require('./routes/agents');
// const categoriesRouter = require('./routes/categories');
// const configRouter = require('./routes/config');
// const constatsRouter = require('./routes/constats');
// const dailiesRouter = require('./routes/dailies');
// const rapportsRouter = require('./routes/rapports');
// const habitationsRouter = require('./routes/habitations');
// const horairesRouter = require('./routes/horaires');
// const infractionsRouter = require('./routes/infractions');
// const ruesRouter = require('./routes/rues');
// const statusRouter = require('./routes/status');
// const quartiersRouter = require('./routes/quartiers');
// const missionsRouter = require('./routes/missions');
// const validationsRouter = require('./routes/validations');
// const vehiculesRouter = require('./routes/vehicules');
// const uploadRouter = require('./routes/upload');
// const imageController = require('./controllers/image.controller');
// const logsRouter = require('./routes/logs');

// const { dbClient, redisClient } = require('./utils/');
// const accessLogStream = fs.createWriteStream(
//     path.join(__dirname, 'access.log'),
//     { flags: 'a' }
// );

// // Initialisation de l'application Express
// const app = express();

// // Middleware
// app.use(cors());
// app.use(logger('dev'));
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(morgan('combined', { stream: accessLogStream }));

// // Routes
// app.use('/', indexRouter);
// app.use('/login', authRouter);
// app.use('/agents', agentsRouter);
// app.use(
//     '/users',
//     passport.authenticate('jwt', { session: false }),
//     agentsRouter
// );
// app.use('/categories', categoriesRouter);
// app.use('/config', configRouter);
// app.use('/constats', constatsRouter);
// app.use('/dailies', dailiesRouter);
// app.use('/rapports', rapportsRouter);
// app.use('/habitations', habitationsRouter);
// app.use('/horaires', horairesRouter);
// app.use('/infractions', infractionsRouter);
// app.use('/logs', logsRouter);
// app.use('/quartiers', quartiersRouter);
// app.use('/rues', ruesRouter);
// app.use('/status', statusRouter);
// app.use('/missions', missionsRouter);
// app.use('/validations', validationsRouter);
// app.use('/vehicules', vehiculesRouter);
// app.use('/upload', uploadRouter);
// app.post('/save-image', imageController.saveImage);

// // Catch 404 and forward to error handler
// app.use(function (req, res, next) {
//     next(createError(404));
// });

// // Error handler
// app.use(function (err, req, res, next) {
//     res.locals.message = err.message;
//     res.locals.error = req.app.get('env') === 'development' ? err : {};
//     res.status(err.status || 500);
//     res.render('error');
// });

// module.exports = app;

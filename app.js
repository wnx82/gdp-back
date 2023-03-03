var createError = require('http-errors');
var cors = require('cors');
const express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const passport = require('passport');
const bodyParser = require('body-parser');
const prettier = require('prettier');

require('./passport');
var app = express();

var indexRouter = require('./routes/index');
var authRouter = require('./routes/auth');
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

app.post('login', async (req, res) => {
    res.json({ ok: 'ok' });
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/login', authRouter);
app.use('/agents', agentsRouter);
app.use(
    '/users',
    passport.authenticate('jwt', { session: false }),
    agentsRouter
);
app.use('/categories', categoriesRouter);
app.use('/constats', constatsRouter);
app.use('/dailies', dailiesRouter);
app.use('/rapports', rapportsRouter);
app.use('/habitations', habitationsRouter);
app.use('/horaires', horairesRouter);
app.use('/infractions', infractionsRouter);
app.use('/quartiers', quartiersRouter);
app.use('/rues', ruesRouter);
app.use('/missions', missionsRouter);
app.use('/validations', validationsRouter);
app.use('/vehicules', vehiculesRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
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

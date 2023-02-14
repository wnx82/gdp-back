var createError = require('http-errors');
var cors = require('cors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const { success } = require('./helpers/helper');
const bodyParser = require('body-parser');
const prettier = require('prettier');

const passport = require('passport');

var indexRouter = require('./routes/index');
var agentsRouter = require('./routes/agents');
var authRouter = require('./routes/auth');
var habitationsRouter = require('./routes/habitations');
var validationsRouter = require('./routes/validations');

var app = express();

// const mongoose = require('mongoose');
// mongoose.set('strictQuery', false);
// mongoose
//     .connect('mongodb://localhost:27017/gdp')
//     .catch((error) => handleError(error));

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
app.use('/', authRouter);
app.use('/agents', agentsRouter);
app.use('/habitations', habitationsRouter);
app.use('/validations', validationsRouter);

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

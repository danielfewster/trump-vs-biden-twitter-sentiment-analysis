require('dotenv').config()

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
// const cors = require('cors')

const indexRouter = require('./routes/index');
// const helmet = require('helmet');
const app = express();

app.use(logger('tiny'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
//app.use(cors());
//app.use(helmet());

app.use(express.static(path.join(__dirname, 'public')));

/*
app.use((req, res, next) => { // NOTE: when did this get here?
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'DELETE, PUT');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    if ('OPTIONS' == req.method) res.sendStatus(200);
    else next();
});
*/

app.use('/', indexRouter);

module.exports = app;

import 'dotenv/config';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import apiRouter from './routes/api.js';
import authRouter from './routes/auth.js';
import { fileURLToPath } from 'url';
import sessions from 'express-session';
import { dirname } from 'path';
import models from './models.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const oneDay = 1000 * 60 * 60 * 24;

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(sessions({
	secret: process.env.EXPRESS_SESSION_SECRET,
	resave: false,
	saveUninitialized: false,
	cookie: {
		httpOnly: true,
		secure: false, // set this to true on production
		maxAge: oneDay,
	}
}));

app.use(async (req, res, next) => {
    req.models = models;
    next();
});

app.use('/api', apiRouter);
app.use('/auth', authRouter);

app.get('/signin', (req, res) => {
    res.redirect('/auth/signin')
})
app.get('/signout', (req, res) => {
    res.redirect('/auth/signout')
});
app.get('/error', (req,res) => {
    res.status(500).send('There was a server error');
});
app.get('/unauthorized', (req,res) => {
    res.status(403).send('Permission Denied');
});

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
    res.send(
        `<html>
            <body>
                <h1 style='color: red'>Error!</h1>
                <h2>Message</h2>
                <p>${err.message}</p>
                <h4>Full Details</h4>
                <p>${JSON.stringify(err, null, 2)}</p>
            </body>
        </html>
        `
    );
});
export default app;

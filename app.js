'use strict';

//Requiring core modules
const express = require('express');
const qs = require('qs');
const path = require('path');

//Requiring 3rd party modules
const morgan = require('morgan'); //Logger in the console
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
// const mongoSanitize = require('express-mongo-sanitize');
// const xss = require('xss-clean');
// const hpp = require('hpp');

// Requiring developer-defined modules (routers of different resources) or Classes from utils folder or even controllers
const tourRouter = require(`${__dirname}/routes/tourRoutes`);
const userRouter = require(`${__dirname}/routes/userRoutes`);
const reviewRouter = require(`${__dirname}/routes/reviewRoutes`);
const bookingRouter = require(`${__dirname}/routes/bookingRoutes`);
const viewRouter = require(`${__dirname}/routes/viewRoutes`);
const globalErrorHandler = require('./controllers/errorController');
const AppError = require('./utils/appError');

//Instantiation of my express app
const app = express();
app.set('query parser', (str) => qs.parse(str)); //to use qs library (globally) instead of the default querystring module in parsing the query string that solves the problem of nested objects in the query string used in filtering feature ex: ?duration[gte]=5&difficulty=easy

//Middlewares (Checkpoints)
if (process.env.NODE_ENV === 'development') app.use(morgan('dev')); //Logging middleware in case we are in dev mode

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        'https://cdnjs.cloudflare.com',
        'https://js.stripe.com',
      ],
      frameSrc: ['https://js.stripe.com', 'https://hooks.stripe.com'],
      imgSrc: ["'self'", 'data:', 'https://*.stripe.com'],
      styleSrc: ["'self'", "'unsafe-inline'"],

      connectSrc: [
        "'self'",
        'ws://localhost:*',
        'http://localhost:*',
        'https://api.stripe.com',
      ],
    },
  }),
);

//Limiting too many requests on the same API (Our software simply) to prevent brute force attacks
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests, please try again in an hour!',
});
app.use('/api', limiter);

// reading data from the body of the request into req.body
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// //Data Sanitization against query injections
// app.use(mongoSanitize());

// //Data sanitization against XSS -> Security guard checking bags at the entrance
// app.use(xss());

// //Prevent parameter poullution ->Building security system that restricts what can happen inside
// app.use(
//   hpp({
//     whitelist: [
//       'duration,ratingsQuantity',
//       'ratingsAverage',
//       'maxGroupSize',
//       'difficulty',
//       'price',
//     ],
//   }),
// );

//Defining the template engine for rendring web pages
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//Serving static files (middleware) means that if there is any file in the public folder and the user tries to access it directly from the url it will be served directly without going through any route handler
app.use(express.static(path.join(__dirname, 'public')));

//TEST MIDDLEWARE
// app.use((req, res, next) => {
//   console.log(req.cookies);
//   next();
// });

// API Routes (also Middlewares)
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

//Middleware to create an error for routes that are not specified or cached
app.use((req, res, next) => {
  next(new AppError(`Can not find ${req.originalUrl} on this server!`, 404));
});

//Global error handling middleware
app.use(globalErrorHandler);

//Exporting app to be able to use it in server.js(The entry point of the application)
module.exports = app;

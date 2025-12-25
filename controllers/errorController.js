const AppError = require('./../utils/appError');

//! Handlers / Helpers

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  let value;

  if (err.keyValue) {
    value = Object.values(err.keyValue)[0];
  } else if (err.errmsg) {
    const match = err.errmsg.match(/(["'])(\\?.)*?\1/);

    value = match ? match[0] : 'Unknown value';
  } else {
    value = 'Unknown value';
  }

  const message = `Duplicate field value: ${value}, Please use another value!`;

  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((val) => val.message);

  const message = `Invalid input data: ${errors.toString()}`;

  return new AppError(message, 400);
};

const handleJWTError = () => {
  return new AppError('Invalid Token. Please login again', 401);
};

const handleJWTExpiredError = () => {
  return new AppError('Token Expired. Please login again', 401);
};

//////////////////////////////////////////////////////////////////////////////////!
const sendErrorProd = (err, res) => {
  //Operational, trusted error: Send message to the client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
    //programming or other unknown error: don't leak error details
  } else {
    //1) Log The Error
    console.error('ERROR ❌');

    //2)Sending generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
    });
  }
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

//////////////////////////////////////////////////////////////////////////////!
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    //Sending The Response
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err, message: err.message, name: err.name, code: err.code };

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError(error);
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    //Sending The Response
    sendErrorProd(error, res);
  }
};

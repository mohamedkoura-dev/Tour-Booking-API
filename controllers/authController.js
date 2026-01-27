'use strict';

const AppError = require('../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const User = require('./../models/userModel');
const Email = require('./../utils/email');
const createAndSendToken = require('./../utils/createAndSendToken');
const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
  });

  //Constructing and sending the welcome email our Email class (service)
  const url = `${req.protocol}://${req.get('host')}/me`;
  const email = new Email(newUser, url);

  await email.sendWelcome();

  //Logging signed up user in automatically after signing up
  createAndSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //check if the email or password exists
  if (!email || !password)
    return next(new AppError('Please provide your email and password!', 400));

  //check if there's a user with those credentials
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password)))
    return next(new AppError('incorrect email or password', 401));

  //if everything is okay, send the token to the client and log him in
  createAndSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'LoggedOut', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    status: 'success',
  });
};

exports.protect = catchAsync(async (req, res, next) => {
  //Get The token and check if it's exist
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(
      new AppError('You are not logged in, please log in to get access', 401),
    );
  }

  //Verification the token (Checking if the token is valid or not) by decoding it, decoding means exactly in details what's inside the token which is the payload data and the signature and checking if the signature is valid by comparing it to a new signature generated from the header and payload using the secret key
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //Check if user still exists
  const currentUser = await User.findById(decoded.id);

  if (!currentUser)
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401,
      ),
    );

  //Check if the user change password after the jwt was issued -> checking if the token is still valid
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password. Please login again', 401),
    );
  }

  //GRANT ACCESS TO THE PROTECTED ROUTE VIA attaching the user data to the request object
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles ['admin', 'lead-guide', .....].
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    }

    next();
  };
};

exports.isLoggedIn = async (req, res, next) => {
  //Get The token and check if it's exist
  let token;

  if (req.cookies.jwt) {
    try {
      token = req.cookies.jwt;

      //Verification the token (Checking if the token is valid or not) by decoding it, decoding means exactly in details what's inside the token which is the payload data and the signature and checking if the signature is valid by comparing it to a new signature generated from the header and payload using the secret key
      const decoded = await promisify(jwt.verify)(
        token,
        process.env.JWT_SECRET,
      );

      //Check if user still exists
      const currentUser = await User.findById(decoded.id);

      if (!currentUser) return next();

      //Check if the user change password after the jwt was issued -> checking if the token is still valid
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      //GRANT ACCESS TO THE PROTECTED ROUTE VIA attaching the user data to the locals object
      res.locals.user = currentUser;
    } catch (error) {
      return next();
    }
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles ['admin', 'lead-guide', .....].
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //Check if there's a body with the request
  if (req.body === undefined) {
    return next(new AppError('Please provide your email address', 400));
  }

  const { email } = req.body;

  if (!email) {
    return next(new AppError('Please provide your email address', 400));
  }

  //If yes then initiate the query with the request body data which supposed to be the email address
  const user = await User.findOne({
    email: email.toLowerCase(),
  });

  //If there's no user with this email Always respond the same way whether user exists or not
  //to prevent user enumeration attacks
  if (!user) {
    return res.status(200).json({
      status: 'success',
      message:
        'If an account exists with this email, a password reset link has been sent.',
    });
  }

  //Creating the token wich will be sent to the user via email service
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  //Sending the resetToken via email to the user's email
  try {
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

    const resetEmail = new Email(user, resetURL);
    await resetEmail.sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message:
        'If an account exists with this email, a password reset link has been sent.',
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    console.error('Email sending failed:', error);

    return next(
      new AppError(
        'There was an error processing your request. Please try again later.',
        500,
      ),
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  //Check if token has not expired and there is a user. if so then set a new password
  if (!user) return next(new AppError('Token is invalid or has expired', 400));

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  //Log in the user, send JWT
  createAndSendToken(user, 201, res);
});

exports.updateMyPassword = catchAsync(async (req, res, next) => {
  //Get user from the collection
  const user = await User.findById(req.user.id).select('+password');

  if (!user) {
    return next(
      new AppError(
        'There was an error processing your request. Please try again later.',
        400,
      ),
    );
  }

  //Check if the posted password is matching with the user current password
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Invalid Curent Password!', 400));
  }

  //If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  //Log user in
  createAndSendToken(user, 201, res);
});

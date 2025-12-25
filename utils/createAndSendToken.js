const signToken = require('./../utils/signToken');
const jwt = require('jsonwebtoken');

module.exports = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true, //Prevent the browser from accessing or modifying the cookie
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true; //This flag ensures the cookie is only sent over secure connections (HTTPS)

  res.cookie('jwt', token, cookieOptions);

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

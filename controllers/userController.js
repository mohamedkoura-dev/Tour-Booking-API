'use strict';

const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const filterObj = require('./../utils/filterBody');
const factory = require('./handlerFactory');

//simply to store the current user id into req.params because i won't specify an id in the url i am gonna assign the id from the protect handler into the params property with this middleware
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  //Create Error if user posts password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword',
        400,
      ),
    );
  }

  //Filter Body to only update name and email
  const filteredBody = filterObj(req.body, 'name', 'email', 'photo');

  //If not we simply need to update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false }); //Soft delete just by deactivating the active property

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User);
exports.updateUser = factory.updateOne(User, ['name', 'email', 'role']); //Admin
exports.deleteUser = factory.deleteOne(User); // permanently delete (Admin)

//Just for the sake of completion but it does not do anything
exports.createUser = (req, res, next) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined. Please use /signup instead',
  });
};

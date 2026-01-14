const express = require('express');

const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');
const reviewController = require('./../controllers/reviewController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.post('/resetPassword/:token', authController.resetPassword);

//Middlewares to protect and restrict all the routes that is down there
router.use(authController.protect);
router.use(authController.restrictTo('admin'));

router.patch('/updateMyPassword', authController.updateMyPassword);
router.patch('/updateMe', userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);
router.get('/me', userController.getMe, userController.getUser);

router.patch(
  '/updateUser/:id',
  authController.restrictTo('admin'),
  userController.updateUser,
);

router.delete(
  '/deleteUser/:id',
  authController.restrictTo('admin'),
  userController.deleteUser,
);

router.route('/:id').get(userController.getUser);

router.route('/').get(userController.getAllUsers).post(userController.createUser);

module.exports = router;

const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/:id')
  .get(reviewController.getReview)
  .delete(authController.restrictTo('user', 'admin'), reviewController.deleteReview)
  .patch(authController.restrictTo('user', 'admin'), reviewController.updateReview);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('admin', 'user'),
    reviewController.setUserAndTourId,
    reviewController.createReview,
  );

module.exports = router;

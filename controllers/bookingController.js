const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('./../utils/appError');
const Tour = require('./../models/tourModel');
const Booking = require('./../models/bookingModel');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  const bookedTour = await Tour.findById(req.params.tourId);

  if (!bookedTour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',

    success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${bookedTour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${bookedTour.slug}`,

    customer_email: req.user.email,
    client_reference_id: req.params.tourId,

    //What user is paying for
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: bookedTour.price * 100,
          product_data: {
            name: `${bookedTour.name} Tour`,
            description: bookedTour.summary,
            images: [`https://www.natours.dev/img/tours/${bookedTour.imageCover}`],
          },
        },
        quantity: 1,
      },
    ],
  });

  res.status(200).json({
    status: 'success',
    session,
  });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  const { tour, user, price } = req.query; //Getting data from the query params of the success url of the getCheckoutSession MW

  if (!tour || !user || !price) return next();

  await Booking.create({
    tour,
    user,
    price,
  });

  res.redirect(req.originalUrl.split('?')[0]);
});

exports.getAllBookings = factory.getAll(Booking);
exports.getBooking = factory.getOne(Booking);
exports.createBooking = factory.createOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);

//Your Express app Defines what is being paid

// Stripe handles how it’s paid

// Webhooks confirm that it was paid

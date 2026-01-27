import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { showAlert } from './alert';

const stripePromise = loadStripe(
  'pk_test_51SrewaCx7UKkENneDKV6ChUIURf8zcV9e4Z4A06sl2OSE86sQssEXqYZaSxTMucJBpjObVc8JxRmOppu2f2b9Y1a006HsacdcC',
);

export const bookTour = async (tourId) => {
  try {
    const stripe = await stripePromise;
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);

    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (error) {
    console.error(error.message);
    showAlert('error', 'Something went wrong!');
  }
};
